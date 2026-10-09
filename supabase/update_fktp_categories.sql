-- ==============================================================================
-- KONAS PERSADIA 2026 - PENYESUAIAN SQL RESMI
-- Disesuaikan Berdasarkan Skema Aktual Database & Kebijakan RLS Supabase
-- ==============================================================================
-- 
-- HASIL REVIEW STRUKTUR TABEL ANDA:
-- 1. Kolom 'kategori_peserta' dan 'pilihan_kegiatan' pada tabel 'pendaftar' bertipe TEXT.
--    Data baru "Dokter Layanan Primer (FKTP)" dan "Sesi Ilmiah FKTP (Online)" 
--    akan masuk secara otomatis tanpa memerlukan perubahan struktur wajib.
--
-- 2. TEMUAN PENTING PADA RLS 'app_settings':
--    Policy saat ini: "Izinkan publik membaca kuota health talk saja" 
--    hanya mengizinkan public membaca key = 'health_talk_enabled'.
--    Ini menyebabkan publik di form pendaftaran TIDAK BISA membaca setting 'closed_categories'
--    (penutupan pendaftaran Pesta Rakyat / kategori lain).
--    Policy ini KITA PERBAIKI di Bagian 1 di bawah agar publik bisa membaca 'closed_categories'.
--
-- 3. TEMUAN PADA 'registrasi_onsite':
--    Kolom 'registrasi_onsite' di tabel pendaftar saat ini digunakan oleh scanner meja registrasi 
--    untuk check-in fisik saat hari-H. Oleh karena itu, kita tambahkan kolom tersendiri
--    'mode_kehadiran' (Onsite vs Online) agar tidak bentrok dengan check-in scanner.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BAGIAN 1: PERBAIKAN RLS POLICY 'app_settings' (SANGAT PENTING)
-- ------------------------------------------------------------------------------
-- Mengizinkan publik membaca status kuota dan status buka/tutup kategori pendaftaran:
DROP POLICY IF EXISTS "Izinkan publik membaca kuota health talk saja" ON public.app_settings;
DROP POLICY IF EXISTS "Izinkan publik membaca pengaturan aplikasi" ON public.app_settings;

CREATE POLICY "Izinkan publik membaca pengaturan aplikasi"
  ON public.app_settings
  FOR SELECT
  TO public
  USING (key IN ('health_talk_enabled', 'closed_categories'));

-- ------------------------------------------------------------------------------
-- BAGIAN 2: PENAMBAHAN KOLOM 'mode_kehadiran' PADA TABEL 'pendaftar'
-- ------------------------------------------------------------------------------
-- Membedakan peserta yang hadir Onsite di Novotel vs Online via Zoom Webinar:
ALTER TABLE IF EXISTS public.pendaftar 
  ADD COLUMN IF NOT EXISTS mode_kehadiran TEXT DEFAULT 'Onsite';

COMMENT ON COLUMN public.pendaftar.mode_kehadiran IS 'Mode partisipasi: Onsite (Novotel Bogor) atau Online (Zoom Webinar)';

-- ------------------------------------------------------------------------------
-- BAGIAN 3: STANDARISASI DATA HISTORIS (AMAN & IDEMPOTENT)
-- ------------------------------------------------------------------------------
-- 1. Standarkan data FKTP masa lalu yang mungkin tercatat dengan label lama:
UPDATE public.pendaftar
SET kategori_peserta = 'Dokter Layanan Primer (FKTP)'
WHERE kategori_peserta ILIKE '%FKTP%' 
   OR kategori_peserta ILIKE '%Puskesmas%'
   OR kategori_peserta ILIKE '%Klinik Pratama%';

-- 2. Isi nilai 'mode_kehadiran' untuk peserta daring (online) berdasarkan pilihan_kegiatan:
UPDATE public.pendaftar
SET mode_kehadiran = 'Online'
WHERE pilihan_kegiatan ILIKE '%Online%' 
   OR pilihan_kegiatan ILIKE '%Daring%'
   OR pilihan_kegiatan ILIKE '%Webinar%';

-- 3. Pastikan peserta lainnya terisi default 'Onsite':
UPDATE public.pendaftar
SET mode_kehadiran = 'Onsite'
WHERE mode_kehadiran IS NULL;

-- ------------------------------------------------------------------------------
-- BAGIAN 4: OPTIMASI INDEX DATABASE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pendaftar_kategori_peserta ON public.pendaftar (kategori_peserta);
CREATE INDEX IF NOT EXISTS idx_pendaftar_mode_kehadiran ON public.pendaftar (mode_kehadiran);
CREATE INDEX IF NOT EXISTS idx_pendaftar_status_pembayaran ON public.pendaftar (status_pembayaran);
