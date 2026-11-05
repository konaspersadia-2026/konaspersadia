-- ==============================================================================
-- KONAS PERSADIA 2026 - UPDATE AKSES SESI DHF & MAKAN SIANG HARI 1 (2 PESERTA)
-- Tanggal Acara: Sabtu, 7 November 2026 (Ballroom 2 Novotel Bogor)
-- Peserta: B. Siti Masitoh & B. Iin (PERSADIA Cabang Bogor)
-- Catatan Hasil Audit Database:
--   1. B. Siti Masitoh diinput KNS2026-44913. Di master ODS nomor aktifnya adalah KNS2026-55979 (HP 081398595601).
--   2. B. Iin diinput KNS2026-66832. Di master ODS nomor aktifnya adalah KNS2026-61714 (HP 085711188185).
--   Keduanya dimasukkan (nomor input & nomor master ODS) agar 100% aman ter-cover di scanner.
-- ==============================================================================

UPDATE public.pendaftar
SET
    pilihan_kegiatan  = 'Pesta Rakyat + Diabetes Health Forum',
    ikut_health_talk  = true,
    mode_kehadiran    = 'Onsite',
    status_pembayaran = 'Lunas'
WHERE no_registrasi IN (
    'KNS2026-55979',            -- 1a. B. Siti Masitoh (No Master Aktif di ODS)
    'KNS2026-44913',            -- 1b. B. Siti Masitoh (No Registrasi yang Diinput)
    'KNS2026-61714',            -- 2a. B. Iin (No Master Aktif di ODS)
    'KNS2026-66832'             -- 2b. B. Iin (No Registrasi yang Diinput)
);

-- ------------------------------------------------------------------------------
-- VERIFIKASI HASIL UPDATE 2 PESERTA
-- ------------------------------------------------------------------------------
SELECT 
    id,
    no_registrasi,
    nama_lengkap,
    kategori_peserta,
    pilihan_kegiatan,
    ikut_health_talk,
    mode_kehadiran,
    status_pembayaran,
    cabang_persadia
FROM public.pendaftar
WHERE no_registrasi IN (
    'KNS2026-55979',
    'KNS2026-44913',
    'KNS2026-61714',
    'KNS2026-66832'
)
ORDER BY nama_lengkap ASC;
