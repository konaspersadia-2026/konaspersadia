-- ==============================================================================
-- KONAS PERSADIA 2026 - PENAMBAHAN KOLOM NIK UNTUK SKP KEMENKES RI
-- ==============================================================================
--
-- Deskripsi:
-- Script ini menambahkan kolom 'nik' (Nomor Induk Kependudukan 16 digit) pada tabel 'pendaftar'
-- sebagai persyaratan pelaporan perolehan SKP Kementerian Kesehatan RI
-- melalui platform Plataran Sehat / SatuSehat SDMK bagi peserta kegiatan ilmiah
-- (Dokter Spesialis, Dokter Umum, Dokter Layanan Primer FKTP, Residen/PPDS, dan Perawat/Edukator).
--
-- Catatan:
-- - Mahasiswa Kedokteran S1 dan peserta Pesta Rakyat tidak diwajibkan menyertakan NIK.
-- - Script ini bersifat aman dan idempotent (dapat dijalankan berulang kali tanpa error).
-- ==============================================================================

-- 1. Tambahkan kolom nik jika belum ada pada tabel pendaftar
ALTER TABLE IF EXISTS public.pendaftar 
  ADD COLUMN IF NOT EXISTS nik VARCHAR(20) DEFAULT '-';

COMMENT ON COLUMN public.pendaftar.nik IS 'Nomor Induk Kependudukan (NIK 16 digit) untuk pelaporan SKP Kemenkes RI (Plataran Sehat)';

-- 2. Buat index pencarian untuk kolom nik agar query/pencarian cepat
CREATE INDEX IF NOT EXISTS idx_pendaftar_nik ON public.pendaftar (nik);

-- 3. Standarkan data yang sudah ada sebelumnya jika ada nilai NULL
UPDATE public.pendaftar
SET nik = '-'
WHERE nik IS NULL;
