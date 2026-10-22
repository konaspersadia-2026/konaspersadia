-- ==============================================================================
-- KONAS PERSADIA 2026 - PENAMBAHAN KOLOM HARI KE-2 TABEL PENDAFTAR
-- (Pengambilan Snack, Pengambilan Baju, dan Waktu Pengambilan)
-- ==============================================================================
-- Kebutuhan Hari ke-2 (GOR Pakansari):
-- 1. Registrasi Onsite        -> Sudah ada: `registrasi_onsite`, `waktu_registrasi_onsite`
-- 2. Pengambilan Snack        -> BARU: `pengambilan_snack`, `waktu_pengambilan_snack`
-- 3. Pengambilan Makan Siang  -> Sudah ada: `makan_siang_pesta_rakyat` (+ `waktu_makan_siang_pesta_rakyat`)
-- 4. Pengambilan Gula Darah   -> Sudah ada: `cek_gula_darah`, `gula_darah`, `tensi`, dll.
-- 5. Pengambilan Baju         -> BARU: `pengambilan_baju`, `waktu_pengambilan_baju` (+ sinkron `pengambilan_merchandise`)
--
-- CARA EKSEKUSI:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Masuk ke SQL Editor -> New Query -> Tempel (Paste) script ini -> Klik RUN
-- ==============================================================================

ALTER TABLE public.pendaftar 
  ADD COLUMN IF NOT EXISTS pengambilan_snack TEXT,
  ADD COLUMN IF NOT EXISTS waktu_pengambilan_snack TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pengambilan_baju TEXT,
  ADD COLUMN IF NOT EXISTS waktu_pengambilan_baju TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS waktu_makan_siang_pesta_rakyat TIMESTAMPTZ;

-- Berikan komentar dokumentasi pada kolom baru
COMMENT ON COLUMN public.pendaftar.pengambilan_snack IS 'Status pengambilan snack box Hari 2 GOR Pakansari (Ya / null)';
COMMENT ON COLUMN public.pendaftar.waktu_pengambilan_snack IS 'Waktu timestamp pengambilan snack box Hari 2';
COMMENT ON COLUMN public.pendaftar.pengambilan_baju IS 'Status pengambilan baju / kaos eksklusif Hari 2 GOR Pakansari (Ya / null)';
COMMENT ON COLUMN public.pendaftar.waktu_pengambilan_baju IS 'Waktu timestamp pengambilan baju Hari 2';
COMMENT ON COLUMN public.pendaftar.waktu_makan_siang_pesta_rakyat IS 'Waktu timestamp verifikasi makan siang Hari 2';

-- Verifikasi struktur kolom
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pendaftar' 
  AND column_name IN (
    'registrasi_onsite',
    'pengambilan_snack',
    'makan_siang_pesta_rakyat',
    'cek_gula_darah',
    'pengambilan_baju',
    'pengambilan_merchandise'
  );
