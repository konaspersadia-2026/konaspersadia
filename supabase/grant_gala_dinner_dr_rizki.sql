-- ==============================================================================
-- KONAS PERSADIA 2026 - PEMBERIAN HAK AKSES GALA DINNER
-- Jalankan skrip ini di SQL Editor Supabase:
-- Dashboard Supabase -> SQL Editor -> Tempel (Paste) -> Run
-- ==============================================================================

-- 1. Berikan hak akses Gala Dinner secara spesifik kepada dr. Rizki Savina Sp. PD
UPDATE public.pendaftar
SET hak_gala_dinner = true
WHERE no_registrasi = 'KNS2026-02499133'
   OR nama_lengkap ILIKE '%Rizki Savina%';

-- 2. (Opsional / Rekomendasi) Berikan hak Gala Dinner kepada SEMUA peserta Simposium & Workshop Onsite yang berstatus Lunas
UPDATE public.pendaftar
SET hak_gala_dinner = true
WHERE status_pembayaran = 'Lunas'
  AND (
    pilihan_kegiatan ILIKE '%workshop%'
    OR kategori_peserta ILIKE '%perawat%'
    OR kategori_peserta ILIKE '%edukator%'
  )
  AND (mode_kehadiran IS NULL OR mode_kehadiran <> 'Online')
  AND (pilihan_kegiatan NOT ILIKE '%online%')
  AND (kategori_peserta NOT ILIKE '%persadia%')
  AND (kategori_peserta NOT ILIKE '%umum%')
  AND (kategori_peserta NOT ILIKE '%health forum%');

-- 3. Cek hasil update untuk dr. Rizki Savina
SELECT 
  no_registrasi, 
  nama_lengkap, 
  kategori_peserta, 
  pilihan_kegiatan, 
  status_pembayaran, 
  hak_gala_dinner
FROM public.pendaftar
WHERE no_registrasi = 'KNS2026-02499133'
   OR nama_lengkap ILIKE '%Rizki Savina%';
