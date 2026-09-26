-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX PERMISSIONS & RPC UNTUK TABEL VOUCHERS
-- Jalankan seluruh script ini di Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. PASTIKAN TABEL VOUCHERS DAN KOLOMNYA TERSEDIA LENGKAP
CREATE TABLE IF NOT EXISTS public.vouchers (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    kategori_target TEXT DEFAULT 'dokter_umum',
    is_used BOOLEAN DEFAULT FALSE,
    used_by TEXT,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom ada jika tabel sudah ada sebelumnya
ALTER TABLE public.vouchers 
  ADD COLUMN IF NOT EXISTS kategori_target TEXT DEFAULT 'dokter_umum',
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS used_by TEXT,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vouchers_code_upper ON public.vouchers (UPPER(TRIM(code)));
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used ON public.vouchers (is_used);

-- ------------------------------------------------------------------------------
-- 2. BERIKAN HAK AKSES DASAR (GRANT) KE TABEL & SEQUENCE DI POSTGRESQL
-- (Inilah perbaikan utama untuk error: "permission denied for table vouchers")
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.vouchers TO authenticated;
GRANT ALL ON TABLE public.vouchers TO service_role;
GRANT SELECT ON TABLE public.vouchers TO anon;

-- Grant hak akses ke tabel lain jika diperlukan
GRANT ALL ON TABLE public.pendaftar TO authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.pendaftar TO anon;

GRANT ALL ON TABLE public.app_settings TO authenticated, service_role;
GRANT SELECT ON TABLE public.app_settings TO anon;

-- Grant hak akses ke sequence ID (untuk auto increment ID)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 3. SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admin full access to vouchers" ON public.vouchers;
CREATE POLICY "Admin full access to vouchers"
  ON public.vouchers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public check voucher" ON public.vouchers;
DROP POLICY IF EXISTS "Public read vouchers" ON public.vouchers;
CREATE POLICY "Public read vouchers"
  ON public.vouchers
  FOR SELECT
  TO anon
  USING (true);

-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER RPC: BATCH GENERATE FKTP VOUCHERS
-- Berjalan dengan hak superuser postgres sehingga aman & tidak akan terhalang izin tabel
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_fktp_vouchers(p_count INT DEFAULT 5)
RETURNS SETOF public.vouchers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_code TEXT;
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_suffix TEXT;
    i INT;
    j INT;
    v_voucher public.vouchers;
BEGIN
    FOR i IN 1..COALESCE(p_count, 5) LOOP
        LOOP
            v_suffix := '';
            FOR j IN 1..6 LOOP
                v_suffix := v_suffix || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
            END LOOP;
            v_code := 'FKTP-' || v_suffix;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM public.vouchers WHERE UPPER(TRIM(code)) = v_code);
        END LOOP;

        INSERT INTO public.vouchers (code, kategori_target, is_used, created_at)
        VALUES (v_code, 'dokter_umum', false, NOW())
        RETURNING * INTO v_voucher;

        RETURN NEXT v_voucher;
    END LOOP;
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_fktp_vouchers(INT) TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 5. SECURITY DEFINER RPC: TAMBAH VOUCHER MANUAL
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_voucher(
    p_code TEXT,
    p_kategori TEXT DEFAULT 'dokter_umum'
)
RETURNS SETOF public.vouchers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_voucher public.vouchers;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
    IF v_clean_code = '' THEN
        RAISE EXCEPTION 'Kode voucher tidak boleh kosong';
    END IF;

    IF EXISTS (SELECT 1 FROM public.vouchers WHERE UPPER(TRIM(code)) = v_clean_code) THEN
        RAISE EXCEPTION 'Kode voucher % sudah ada di database', v_clean_code;
    END IF;

    INSERT INTO public.vouchers (code, kategori_target, is_used, created_at)
    VALUES (v_clean_code, COALESCE(NULLIF(TRIM(p_kategori), ''), 'dokter_umum'), false, NOW())
    RETURNING * INTO v_voucher;

    RETURN NEXT v_voucher;
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION create_voucher(TEXT, TEXT) TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 6. SECURITY DEFINER RPC: HAPUS VOUCHER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION delete_voucher(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.vouchers WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code));
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_voucher(TEXT) TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 7. SECURITY DEFINER RPC: AMBIL SELURUH VOUCHER (GET VOUCHERS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_vouchers()
RETURNS SETOF public.vouchers
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT * FROM public.vouchers ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_vouchers() TO authenticated, service_role, anon;

-- ------------------------------------------------------------------------------
-- 8. SECURITY DEFINER RPC: VALIDASI & CLAIM VOUCHER UNTUK FORM REGISTRASI
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_voucher(
    p_code TEXT,
    p_kategori TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_voucher RECORD;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));

    IF v_clean_code = '' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Kode voucher tidak boleh kosong.'
        );
    END IF;

    SELECT id, code, kategori_target, is_used, used_by, used_at
    INTO v_voucher
    FROM public.vouchers
    WHERE UPPER(TRIM(code)) = v_clean_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Kode voucher tidak ditemukan. Pastikan penulisan kode sudah benar.'
        );
    END IF;

    IF COALESCE(v_voucher.is_used, false) = true THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Kode voucher ini sudah pernah digunakan.'
        );
    END IF;

    IF p_kategori IS NOT NULL AND TRIM(p_kategori) != '' THEN
        IF v_clean_code LIKE 'FKTP-%' OR LOWER(COALESCE(v_voucher.kategori_target, '')) IN ('dokter_umum', 'fktp') THEN
            IF LOWER(TRIM(p_kategori)) NOT IN ('dokter_umum', 'fktp') THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'message', 'Voucher FKTP ini hanya berlaku untuk kategori Dokter Umum.'
                );
            END IF;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'code', v_voucher.code,
        'kategori_target', v_voucher.kategori_target,
        'message', 'Kode voucher valid dan siap digunakan.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_voucher(TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION claim_voucher(
    p_code TEXT,
    p_no_reg TEXT DEFAULT NULL,
    p_registered_by TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_user_ident TEXT;
    v_updated_rows INT;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));
    v_user_ident := COALESCE(p_no_reg, p_registered_by, 'REGISTERED_USER');

    IF v_clean_code = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Kode voucher tidak valid.'
        );
    END IF;

    UPDATE public.vouchers
    SET 
        is_used = true,
        used_by = v_user_ident,
        used_at = NOW()
    WHERE UPPER(TRIM(code)) = v_clean_code
      AND (is_used = false OR is_used IS NULL);

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    IF v_updated_rows > 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Voucher berhasil diklaim.'
        );
    ELSE
        IF EXISTS (SELECT 1 FROM public.vouchers WHERE UPPER(TRIM(code)) = v_clean_code) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Voucher sudah pernah digunakan sebelumnya.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Kode voucher tidak ditemukan.'
            );
        END IF;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_voucher(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
