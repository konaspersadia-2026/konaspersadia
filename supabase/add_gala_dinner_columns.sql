-- ==============================================================================
-- KONAS PERSADIA 2026 - PENAMBAHAN KOLOM HARI KE-1 TABEL PENDAFTAR
-- (Hak Akses Undangan Gala Dinner & Presensi Pintu Masuk Ballroom)
-- ==============================================================================
-- Alur Gala Dinner (Grand Ballroom Novotel Bogor):
-- 1. Hak Akses (Whitelist): Di-marking Admin (Default: FALSE / Ditolak)
--    -> Kolom: `hak_gala_dinner` (BOOLEAN, default: false)
-- 2. Presensi Pintu: Discan panitia saat peserta tiba di pintu masuk
--    -> Kolom: `kehadiran_gala_dinner` (TEXT: 'Ya' / null) & `waktu_kehadiran_gala_dinner` (TIMESTAMPTZ)
--
-- CARA EKSEKUSI:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Masuk ke SQL Editor -> New Query -> Tempel script ini -> Klik RUN
-- ==============================================================================

ALTER TABLE public.pendaftar 
  ADD COLUMN IF NOT EXISTS hak_gala_dinner BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS kehadiran_gala_dinner TEXT,
  ADD COLUMN IF NOT EXISTS waktu_kehadiran_gala_dinner TIMESTAMPTZ,
  -- Kompatibilitas alias kolom tambahan
  ADD COLUMN IF NOT EXISTS akses_gala_dinner TEXT,
  ADD COLUMN IF NOT EXISTS waktu_akses_gala_dinner TIMESTAMPTZ;

-- Pastikan seluruh data pendaftar yang sudah ada bernilai false (Ditolak secara default)
UPDATE public.pendaftar 
SET hak_gala_dinner = false 
WHERE hak_gala_dinner IS NULL;

-- Berikan komentar dokumentasi pada kolom
COMMENT ON COLUMN public.pendaftar.hak_gala_dinner IS 'Hak akses undangan Gala Dinner (true = Diundang / Boleh Masuk, false = Ditolak)';
COMMENT ON COLUMN public.pendaftar.kehadiran_gala_dinner IS 'Status verifikasi presensi pintu masuk Gala Dinner (Ya / null)';
COMMENT ON COLUMN public.pendaftar.waktu_kehadiran_gala_dinner IS 'Waktu timestamp presensi masuk Gala Dinner';

-- Verifikasi struktur kolom
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pendaftar' 
  AND column_name IN (
    'registrasi_onsite',
    'hak_gala_dinner',
    'kehadiran_gala_dinner',
    'waktu_kehadiran_gala_dinner',
    'akses_gala_dinner',
    'waktu_akses_gala_dinner'
  );
