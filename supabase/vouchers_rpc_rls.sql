-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX RPC & RLS VOUCHERS (FKTP & DIABETES HEALTH FORUM)
-- ==============================================================================

-- 1. PASTIKAN STRUKTUR KOLOM LENGKAP PADA TABEL VOUCHERS
ALTER TABLE IF EXISTS vouchers 
  ADD COLUMN IF NOT EXISTS kategori_target TEXT,
  ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS used_by TEXT,
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vouchers_code_upper ON vouchers (UPPER(TRIM(code)));
CREATE INDEX IF NOT EXISTS idx_vouchers_is_used ON vouchers (is_used);

-- ------------------------------------------------------------------------------
-- 2. HAPUS SEMUA VERSI FUNGSI LAMA (AGAR TIDAK ADA KONFLIK OVERLOAD/FUNCTION LAMA)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS validate_voucher(TEXT);
DROP FUNCTION IF EXISTS validate_voucher(TEXT, TEXT);
DROP FUNCTION IF EXISTS validate_voucher(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS validate_voucher;

DROP FUNCTION IF EXISTS claim_voucher(TEXT);
DROP FUNCTION IF EXISTS claim_voucher(TEXT, TEXT);
DROP FUNCTION IF EXISTS claim_voucher(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS claim_voucher;

-- ------------------------------------------------------------------------------
-- 3. SETUP ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage vouchers" ON vouchers;
CREATE POLICY "Admin manage vouchers"
  ON vouchers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. BUAT ULANG RPC validate_voucher (MENDUKUNG FKTP & DHF)
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
    -- Normalisasi kode
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));

    IF v_clean_code = '' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Kode voucher tidak boleh kosong.'
        );
    END IF;

    -- Cari voucher
    SELECT id, code, kategori_target, is_used, used_by, used_at
    INTO v_voucher
    FROM vouchers
    WHERE UPPER(TRIM(code)) = v_clean_code
    LIMIT 1;

    -- Jika tidak ditemukan
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Kode voucher tidak ditemukan. Pastikan penulisan kode sudah benar.'
        );
    END IF;

    -- Jika sudah pernah digunakan
    IF COALESCE(v_voucher.is_used, false) = true THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'Kode voucher ini sudah pernah digunakan.'
        );
    END IF;

    -- Validasi kecocokan kategori jika p_kategori disertakan
    IF p_kategori IS NOT NULL AND TRIM(p_kategori) != '' THEN
        -- 1. Voucher FKTP Dokter Umum
        IF v_clean_code LIKE 'FKTP-%' OR LOWER(COALESCE(v_voucher.kategori_target, '')) IN ('dokter_umum', 'fktp') THEN
            IF LOWER(TRIM(p_kategori)) NOT IN ('dokter_umum', 'fktp') THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'message', 'Voucher FKTP ini hanya berlaku untuk kategori Dokter Umum.'
                );
            END IF;
        -- 2. Voucher Diabetes Health Forum (DHF / HT)
        ELSIF v_clean_code LIKE 'DHF-%' OR v_clean_code LIKE 'HT-%' 
           OR LOWER(COALESCE(v_voucher.kategori_target, '')) IN ('dhf', 'health_talk', 'umum', 'persadia', 'diabetes_health_forum') THEN
            IF LOWER(TRIM(p_kategori)) NOT IN ('umum', 'persadia', 'dhf', 'health_talk', 'diabetes_health_forum') THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'message', 'Voucher ini hanya berlaku untuk sesi Diabetes Health Forum (Masyarakat Umum & Anggota PERSADIA).'
                );
            END IF;
        END IF;
    END IF;

    -- Voucher VALID
    RETURN jsonb_build_object(
        'valid', true,
        'code', v_voucher.code,
        'kategori_target', v_voucher.kategori_target,
        'message', 'Kode voucher valid dan siap digunakan.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. BUAT ULANG RPC claim_voucher
-- ------------------------------------------------------------------------------
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

    UPDATE vouchers
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
        IF EXISTS (SELECT 1 FROM vouchers WHERE UPPER(TRIM(code)) = v_clean_code) THEN
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

-- ------------------------------------------------------------------------------
-- 6. BERIKAN HAK AKSES EXECUTE
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION validate_voucher(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION claim_voucher(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
