-- ==============================================================================
-- SCRIPT PENGISIAN DATA DUMMY PEMERIKSAAN FISIK & GULA DARAH (HARI KE-2)
-- Kongres Nasional PERSADIA 2026 — Pesta Rakyat & Skrining Kesehatan
-- ==============================================================================
-- File: supabase/GENERATE_DUMMY_PEMERIKSAAN_GULA_DARAH.sql
--
-- Field disesuaikan 100% dengan Form Scanner Petugas (scanner/App.tsx):
-- 1. cek_gula_darah          -> 'Ya' (Flag status pemeriksaan selesai)
-- 2. gula_darah              -> Nilai GDS realistis (mg/dL) antara 90 s/d 235
-- 3. kesediaan_data          -> 'Ya' (Persetujuan rekam medis)
-- 4. gejala_neuropati        -> 'Tidak' (75%) atau 'Ya' (25%)
-- 5. tinggi_badan            -> 148 s/d 174 cm
-- 6. berat_badan             -> 48.0 s/d 81.5 kg (1 desimal)
-- 7. lingkar_perut           -> 70 s/d 94 cm
-- 8. tensi                   -> 110/70 s/d 140/90 mmHg
-- 9. tanggal_lahir & gender  -> Otomatis dilengkapi jika data peserta sebelumnya kosong
-- 10. registrasi_onsite_hari_2 -> 'Ya' (Waktu antara 1-2 jam yang lalu)
--
-- Catatan Keamanan:
-- - Script ini HANYA mengubah peserta yang belum punya data gula darah.
-- - Data peserta riil yang sudah discan oleh relawan TIDAK AKAN tertimpa.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. LIHAT JUMLAH PESERTA YANG BELUM PERIKSA SEBELUM DIEKSEKUSI
-- ------------------------------------------------------------------------------
SELECT 
    COUNT(*) AS jumlah_peserta_belum_periksa
FROM public.pendaftar
WHERE (
    cek_gula_darah IS NULL 
    OR TRIM(cek_gula_darah) = '' 
    OR LOWER(TRIM(cek_gula_darah)) NOT IN ('ya', 'true', 'sudah', '1')
)
AND (
    gula_darah IS NULL 
    OR TRIM(gula_darah) = '' 
    OR TRIM(gula_darah) = '-'
)
AND (
    kesediaan_data IS NULL 
    OR TRIM(kesediaan_data) = '' 
    OR LOWER(TRIM(kesediaan_data)) NOT IN ('ya', 'true', '1')
);

-- ------------------------------------------------------------------------------
-- 2. EKSEKUSI UPDATE DATA DUMMY
-- (Gunakan OPSI 1 untuk semua peserta, atau OPSI 2 jika hanya ingin jumlah tertentu)
-- ------------------------------------------------------------------------------

-- [OPSI 1]: UPDATE SEMUA PESERTA YANG BELUM ADA DATANYA
UPDATE public.pendaftar
SET 
    -- 1. Status Selesai & Persetujuan (Wajib di Scanner)
    cek_gula_darah = 'Ya',
    kesediaan_data = 'Ya',

    -- 2. Nilai Gula Darah Sewaktu (mg/dL) - Distribusi acak klinis realistis
    gula_darah = CASE 
        WHEN random() < 0.65 THEN (90 + floor(random() * 49))::text    -- 65% Normal (90 - 138 mg/dL)
        WHEN random() < 0.88 THEN (140 + floor(random() * 46))::text   -- 23% Pre-Diabetes (140 - 185 mg/dL)
        ELSE (186 + floor(random() * 50))::text                        -- 12% Diabetes (186 - 235 mg/dL)
    END,

    -- 3. Tinggi Badan (cm)
    tinggi_badan = round((148 + random() * 26)::numeric, 0),

    -- 4. Berat Badan (kg)
    berat_badan = round((48.0 + random() * 33.5)::numeric, 1),

    -- 5. Lingkar Perut (cm)
    lingkar_perut = (70 + floor(random() * 25))::text,

    -- 6. Tensi Darah (mmHg)
    tensi = (ARRAY[
        '110/70', '115/75', '120/75', '120/80', 
        '125/80', '130/80', '130/85', '135/85', '140/90'
    ])[floor(random() * 9 + 1)],

    -- 7. Gejala Neuropati (Pertanyaan wajib di form scanner)
    gejala_neuropati = CASE 
        WHEN random() < 0.25 THEN 'Ya' 
        ELSE 'Tidak' 
    END,

    -- 8. Kelengkapan Identitas (Lengkapi jika tanggal lahir atau gender sebelumnya null/kosong)
    tanggal_lahir = COALESCE(
        NULLIF(TRIM(tanggal_lahir), ''),
        TO_CHAR(DATE '1955-01-01' + (floor(random() * 14000))::int * INTERVAL '1 day', 'YYYY-MM-DD')
    ),
    jenis_kelamin = COALESCE(
        NULLIF(NULLIF(TRIM(jenis_kelamin), ''), '-'),
        (ARRAY['Laki-laki', 'Perempuan'])[floor(random() * 2 + 1)]
    ),

    -- 9. Presensi Onsite Hari 2 (Pesta Rakyat)
    registrasi_onsite_hari_2 = 'Ya',
    waktu_registrasi_onsite_hari_2 = COALESCE(
        waktu_registrasi_onsite_hari_2, 
        NOW() - (floor(random() * 7200 + 300) || ' seconds')::interval
    )
WHERE (
    -- Filter ketat: HANYA peserta yang BELUM memiliki data gula darah
    cek_gula_darah IS NULL 
    OR TRIM(cek_gula_darah) = '' 
    OR LOWER(TRIM(cek_gula_darah)) NOT IN ('ya', 'true', 'sudah', '1')
)
AND (
    gula_darah IS NULL 
    OR TRIM(gula_darah) = '' 
    OR TRIM(gula_darah) = '-'
)
AND (
    kesediaan_data IS NULL 
    OR TRIM(kesediaan_data) = '' 
    OR LOWER(TRIM(kesediaan_data)) NOT IN ('ya', 'true', '1')
);

-- ------------------------------------------------------------------------------
-- CATATAN: JIKA INGIN MEMBATASI HANYA CONTOHNYA 500 ATAU 1000 PESERTA SAJA:
-- Ganti klausa WHERE di atas menjadi:
-- WHERE id IN (
--     SELECT id FROM public.pendaftar
--     WHERE (cek_gula_darah IS NULL OR LOWER(TRIM(cek_gula_darah)) NOT IN ('ya', 'true', 'sudah', '1'))
--       AND (gula_darah IS NULL OR TRIM(gula_darah) = '' OR TRIM(gula_darah) = '-')
--       AND (kesediaan_data IS NULL OR LOWER(TRIM(kesediaan_data)) NOT IN ('ya', 'true', '1'))
--     LIMIT 500
-- );
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- 3. VERIFIKASI REKAP DATA SETELAH UPDATE
-- ------------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_peserta_sudah_periksa,
    COUNT(CASE WHEN gula_darah ~ '^[0-9]+$' AND gula_darah::int < 140 THEN 1 END) AS gds_normal,
    COUNT(CASE WHEN gula_darah ~ '^[0-9]+$' AND gula_darah::int BETWEEN 140 AND 185 THEN 1 END) AS gds_sedang,
    COUNT(CASE WHEN gula_darah ~ '^[0-9]+$' AND gula_darah::int > 185 THEN 1 END) AS gds_tinggi
FROM public.pendaftar
WHERE LOWER(TRIM(COALESCE(cek_gula_darah, ''))) IN ('ya', 'true', 'sudah', '1');

-- ------------------------------------------------------------------------------
-- 4. SAMPEL 10 DATA TERBARU
-- ------------------------------------------------------------------------------
SELECT 
    no_registrasi,
    nama_lengkap,
    jenis_kelamin,
    tanggal_lahir,
    tinggi_badan,
    berat_badan,
    lingkar_perut,
    tensi,
    gula_darah,
    gejala_neuropati,
    kesediaan_data,
    cek_gula_darah
FROM public.pendaftar
WHERE LOWER(TRIM(COALESCE(cek_gula_darah, ''))) IN ('ya', 'true', 'sudah', '1')
ORDER BY id DESC
LIMIT 10;

COMMIT;
