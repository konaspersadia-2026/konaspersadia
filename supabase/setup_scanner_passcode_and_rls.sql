-- ==============================================================================
-- KONAS PERSADIA 2026 - SETUP PASSCODE SCANNER & RLS PADA app_settings & pendaftar
-- ==============================================================================
-- File ini menyinkronkan sistem Passcode Scanner ke tabel app_settings
-- dan menyesuaikan RLS Policy agar scanner dapat membaca passcode serta
-- memverifikasi / meng-update presensi peserta di lapangan.
-- ==============================================================================

-- 1. DAFTARKAN KEY 'scanner_passcode' PADA TABEL app_settings
INSERT INTO public.app_settings (key, value)
VALUES ('scanner_passcode', 'persadia2026')
ON CONFLICT (key) DO NOTHING;

-- 2. UPDATE POLICY PADA TABEL app_settings
-- Menambahkan 'scanner_passcode' ke daftar key yang dapat dibaca publik/scanner
DROP POLICY IF EXISTS "Izinkan publik membaca pengaturan aplikasi" ON public.app_settings;
CREATE POLICY "Izinkan publik membaca pengaturan aplikasi"
  ON public.app_settings
  FOR SELECT
  TO public
  USING (key = ANY (ARRAY[
    'health_talk_enabled'::text, 
    'closed_categories'::text, 
    'scanner_passcode'::text
  ]));

-- 3. UPDATE POLICY PADA TABEL pendaftar (BACA DATA)
-- Mengizinkan role 'anon' (petugas scanner via passcode) & 'authenticated' (admin) membaca data pendaftar
DROP POLICY IF EXISTS "Izinkan admin membaca data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan admin dan scanner membaca data" ON public.pendaftar;

CREATE POLICY "Izinkan admin dan scanner membaca data"
  ON public.pendaftar
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4. UPDATE POLICY PADA TABEL pendaftar (UPDATE PRESENSI & CHECKPOINT)
-- Mengizinkan role 'anon' & 'authenticated' meng-update status registrasi onsite, 
-- pengambilan snack, kaos, skrining gula darah, dsb.
DROP POLICY IF EXISTS "Izinkan admin meng-update data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan admin dan scanner meng-update data" ON public.pendaftar;

CREATE POLICY "Izinkan admin dan scanner meng-update data"
  ON public.pendaftar
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
