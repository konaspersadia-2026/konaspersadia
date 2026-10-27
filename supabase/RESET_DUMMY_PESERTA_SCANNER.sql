-- ==============================================================================
-- KONAS PERSADIA 2026 - RESET LENGKAP KONDISI AWAL DATA DUMMY TESTING SCANNER
-- DISESUAIKAN PENUH DENGAN 54 KOLOM AKTUAL TABEL 'public.pendaftar'
-- ==============================================================================
--
-- Deskripsi:
-- Script ini mengembalikan seluruh status 14 peserta dummy (KNS2026-TEST01 s/d TEST14)
-- kembali ke kondisi awal (fresh/belum di-scan) untuk pengujian ulang di HP/orang berbeda:
--
-- KOLOM YANG DIBERSIHKAN (TOTAL 27 KOLOM OPERASIONAL & MEDIS):
-- 1. Registrasi Onsite : registrasi_onsite, waktu_registrasi_onsite,
--                        registrasi_onsite_hari_2, waktu_registrasi_onsite_hari_2
-- 2. Workshop Medis    : kehadiran_workshop, waktu_kehadiran_workshop
-- 3. Konsumsi & Makan  : makan_siang_hari_1, waktu_makan_siang_hari_1,
--                        makan_siang_pesta_rakyat, waktu_makan_siang_pesta_rakyat,
--                        pengambilan_snack, waktu_pengambilan_snack
-- 4. Kit, Souvenir     : pengambilan_merchandise, pengambilan_baju,
--                        waktu_pengambilan_baju
-- 5. Gala Dinner       : kehadiran_gala_dinner, waktu_kehadiran_gala_dinner,
--                        akses_gala_dinner, waktu_akses_gala_dinner
-- 6. Pemeriksaan Fisik : cek_gula_darah, gula_darah, tensi, tinggi_badan,
--    & Gula Darah        berat_badan, lingkar_perut, gejala_neuropati, kesediaan_data
--
-- CARA PENGGUNAAN DI SUPABASE:
-- Buka Supabase Dashboard -> Masuk menu "SQL Editor" -> Tempel skrip ini -> Klik "RUN".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RESET SELURUH POS SCANNER & REKAM MEDIS UNTUK TEST01 s/d TEST13 (KOSONG / NULL)
-- ------------------------------------------------------------------------------
UPDATE public.pendaftar
SET 
    -- A. Registrasi Onsite (Hari 1 Novotel & Hari 2 Pakansari)
    registrasi_onsite = NULL,
    waktu_registrasi_onsite = NULL,
    registrasi_onsite_hari_2 = NULL,
    waktu_registrasi_onsite_hari_2 = NULL,

    -- B. Presensi Workshop Medis
    kehadiran_workshop = NULL,
    waktu_kehadiran_workshop = NULL,

    -- C. Konsumsi Makan Siang & Snack (Hari 1 & Hari 2)
    makan_siang_hari_1 = NULL,
    waktu_makan_siang_hari_1 = NULL,
    makan_siang_pesta_rakyat = NULL,
    waktu_makan_siang_pesta_rakyat = NULL,
    pengambilan_snack = NULL,
    waktu_pengambilan_snack = NULL,

    -- D. Merchandise, Souvenir, & Kaos/Baju
    pengambilan_merchandise = NULL,
    pengambilan_baju = NULL,
    waktu_pengambilan_baju = NULL,

    -- E. Akses Gala Dinner
    kehadiran_gala_dinner = NULL,
    waktu_kehadiran_gala_dinner = NULL,
    akses_gala_dinner = NULL,
    waktu_akses_gala_dinner = NULL,

    -- F. Pemeriksaan Fisik, Gula Darah, & Skrining Kesehatan Hari ke-2
    cek_gula_darah = NULL,
    gula_darah = NULL,
    tensi = NULL,
    tinggi_badan = NULL,
    berat_badan = NULL,
    lingkar_perut = NULL,
    gejala_neuropati = NULL,
    kesediaan_data = NULL
WHERE no_registrasi LIKE 'KNS2026-TEST%'
  AND no_registrasi != 'KNS2026-TEST14';

-- ------------------------------------------------------------------------------
-- 2. RESET KHUSUS TEST14 (Skenario Peserta yang Sudah Check-In & Ambil Souvenir)
-- ------------------------------------------------------------------------------
UPDATE public.pendaftar
SET 
    -- Skenario Awal: Sudah Check-In & Sudah Ambil Souvenir/Makan Siang Pesta Rakyat
    registrasi_onsite = 'Ya',
    waktu_registrasi_onsite = '2026-11-08 07:15:00+07'::TIMESTAMPTZ,
    makan_siang_pesta_rakyat = 'Ya',
    waktu_makan_siang_pesta_rakyat = '2026-11-08 12:00:00+07'::TIMESTAMPTZ,
    pengambilan_merchandise = 'Ya',

    -- Pos Lainnya & Pemeriksaan Medis Tetap Bersih (NULL)
    registrasi_onsite_hari_2 = NULL,
    waktu_registrasi_onsite_hari_2 = NULL,
    kehadiran_workshop = NULL,
    waktu_kehadiran_workshop = NULL,
    makan_siang_hari_1 = NULL,
    waktu_makan_siang_hari_1 = NULL,
    pengambilan_snack = NULL,
    waktu_pengambilan_snack = NULL,
    pengambilan_baju = NULL,
    waktu_pengambilan_baju = NULL,
    kehadiran_gala_dinner = NULL,
    waktu_kehadiran_gala_dinner = NULL,
    akses_gala_dinner = NULL,
    waktu_akses_gala_dinner = NULL,
    cek_gula_darah = NULL,
    gula_darah = NULL,
    tensi = NULL,
    tinggi_badan = NULL,
    berat_badan = NULL,
    lingkar_perut = NULL,
    gejala_neuropati = NULL,
    kesediaan_data = NULL
WHERE no_registrasi = 'KNS2026-TEST14';

-- ------------------------------------------------------------------------------
-- 3. PULIHKAN STATUS PEMBAYARAN SESUAI SKENARIO TESTING AWAL
-- ------------------------------------------------------------------------------
-- TEST12: Belum Lunas / Menunggu Verifikasi (Uji Penolakan Meja Registrasi)
UPDATE public.pendaftar SET status_pembayaran = 'Menunggu Verifikasi' WHERE no_registrasi = 'KNS2026-TEST12';

-- TEST13: Dibatalkan (Uji Penolakan Seluruh Pos Scanner)
UPDATE public.pendaftar SET status_pembayaran = 'Dibatalkan' WHERE no_registrasi = 'KNS2026-TEST13';

-- TEST01 s/d TEST11 & TEST14: Lunas
UPDATE public.pendaftar 
SET status_pembayaran = 'Lunas' 
WHERE no_registrasi LIKE 'KNS2026-TEST%' 
  AND no_registrasi NOT IN ('KNS2026-TEST12', 'KNS2026-TEST13');

-- ------------------------------------------------------------------------------
-- 4. VERIFIKASI HASIL PEMBERSIHAN DATA LANGSUNG DI SUPABASE
-- ------------------------------------------------------------------------------
SELECT 
    no_registrasi, 
    nama_lengkap, 
    status_pembayaran,
    registrasi_onsite,
    waktu_registrasi_onsite,
    makan_siang_hari_1,
    makan_siang_pesta_rakyat,
    pengambilan_merchandise,
    pengambilan_baju,
    pengambilan_snack,
    cek_gula_darah,
    gula_darah,
    tensi,
    tinggi_badan,
    berat_badan,
    lingkar_perut,
    gejala_neuropati,
    kesediaan_data
FROM public.pendaftar 
WHERE no_registrasi LIKE 'KNS2026-TEST%'
ORDER BY no_registrasi ASC;
