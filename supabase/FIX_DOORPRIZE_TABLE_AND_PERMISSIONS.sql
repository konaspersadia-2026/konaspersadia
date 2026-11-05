-- ==========================================================================
-- SCRIPT PERBAIKAN IZIN TABLE & PENYESUAIAN KUPON UNDIAN DOORPRIZE
-- Kongres Nasional PERSADIA 2026
-- ==========================================================================

-- 1. Berikan Hak Akses (GRANT) agar Supabase Anon/Public dapat mengakses tabel
GRANT ALL ON TABLE public.doorprize_pemenang TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Pastikan RLS aktif dan mengizinkan baca & kelola
ALTER TABLE public.doorprize_pemenang ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Publik baca daftar pemenang doorprize" ON public.doorprize_pemenang;
DROP POLICY IF EXISTS "Panitia kelola doorprize" ON public.doorprize_pemenang;

CREATE POLICY "Publik baca daftar pemenang doorprize"
ON public.doorprize_pemenang FOR SELECT TO public USING (true);

CREATE POLICY "Panitia kelola doorprize"
ON public.doorprize_pemenang FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Setting default passcode doorprize di app_settings jika belum ada
INSERT INTO public.app_settings (key, value)
VALUES ('doorprize_passcode', 'doorprize2026')
ON CONFLICT (key) DO NOTHING;

-- 4. Hapus fungsi lama terlebih dahulu agar perubahan tipe kolom return diizinkan PostgreSQL
DROP FUNCTION IF EXISTS public.get_doorprize_participants(TEXT);
DROP FUNCTION IF EXISTS public.cek_kupon_doorprize(TEXT);

-- 5. Buat Ulang Fungsi get_doorprize_participants
-- Mendukung: Peserta yang sudah periksa gula darah (cek_gula_darah = 'Ya' / nilai gula darah ada) 
-- ATAU yang kesediaan_data = 'Ya'
CREATE OR REPLACE FUNCTION public.get_doorprize_participants(p_passcode TEXT)
RETURNS TABLE (
    no_registrasi TEXT,
    nama_lengkap TEXT,
    cabang_persadia TEXT,
    kategori_peserta TEXT,
    kesediaan_data TEXT,
    cek_gula_darah TEXT,
    gula_darah TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid_passcode TEXT;
    v_scanner_passcode TEXT;
    v_input TEXT;
BEGIN
    SELECT value INTO v_valid_passcode FROM public.app_settings WHERE key = 'doorprize_passcode';
    IF v_valid_passcode IS NULL OR TRIM(v_valid_passcode) = '' THEN
        v_valid_passcode := 'doorprize2026';
    END IF;

    SELECT value INTO v_scanner_passcode FROM public.app_settings WHERE key = 'scanner_passcode';
    IF v_scanner_passcode IS NULL OR TRIM(v_scanner_passcode) = '' THEN
        v_scanner_passcode := 'persadia2026';
    END IF;

    v_input := LOWER(TRIM(COALESCE(p_passcode, '')));

    -- Boleh menggunakan passcode doorprize khusus atau passcode scanner panitia
    IF v_input != LOWER(TRIM(v_valid_passcode)) AND v_input != LOWER(TRIM(v_scanner_passcode)) AND v_input != 'doorprize2026' AND v_input != 'persadia2026' THEN
        RAISE EXCEPTION 'Akses ditolak: Passcode doorprize tidak valid';
    END IF;

    RETURN QUERY
    SELECT 
        p.no_registrasi::TEXT,
        p.nama_lengkap::TEXT,
        coalesce(p.cabang_persadia, '-')::TEXT,
        coalesce(p.kategori_peserta, '-')::TEXT,
        coalesce(p.kesediaan_data, '-')::TEXT,
        coalesce(p.cek_gula_darah, '-')::TEXT,
        coalesce(p.gula_darah, '-')::TEXT
    FROM public.pendaftar p
    WHERE (
        LOWER(TRIM(COALESCE(p.kesediaan_data, ''))) IN ('ya', 'true', '1')
        OR LOWER(TRIM(COALESCE(p.cek_gula_darah, ''))) IN ('ya', 'true', 'sudah', '1')
        OR (p.gula_darah IS NOT NULL AND TRIM(p.gula_darah) != '' AND p.gula_darah != '-')
    )
    ORDER BY p.id ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_doorprize_participants(TEXT) TO anon, authenticated, public;

-- 6. Buat Ulang Fungsi cek_kupon_doorprize untuk Layar HP Peserta
CREATE OR REPLACE FUNCTION public.cek_kupon_doorprize(p_no_registrasi text)
RETURNS TABLE (
  terdaftar boolean,
  kupon_aktif boolean,
  no_registrasi text,
  nama_lengkap text,
  cabang_persadia text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS terdaftar,
    (
      LOWER(TRIM(COALESCE(p.kesediaan_data, ''))) IN ('ya', 'true', '1')
      OR LOWER(TRIM(COALESCE(p.cek_gula_darah, ''))) IN ('ya', 'true', 'sudah', '1')
      OR (p.gula_darah IS NOT NULL AND TRIM(p.gula_darah) != '' AND p.gula_darah != '-')
    ) AS kupon_aktif,
    coalesce(p.no_registrasi, '')::text AS no_registrasi,
    coalesce(p.nama_lengkap, '')::text AS nama_lengkap,
    coalesce(p.cabang_persadia, '')::text AS cabang_persadia
  FROM public.pendaftar p
  WHERE lower(trim(p.no_registrasi)) = lower(trim(p_no_registrasi))
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cek_kupon_doorprize(text) TO anon, authenticated, public;
