-- ==============================================================================
-- KONAS PERSADIA 2026 - DATA DUMMY TESTING APLIKASI SCANNER (14 KASUS LENGKAP)
-- DISESUAIKAN DENGAN SKEMA AKTUAL TABEL 'public.pendaftar' (41 KOLOM)
-- ==============================================================================
--
-- Deskripsi:
-- Script ini memasukkan 14 peserta dummy representatif untuk menguji seluruh:
-- 1. Mode scanner: Registrasi Onsite, Presensi Workshop Medis, Kupon Makan Siang (H1 & H2),
--    Pengambilan Merchandise, serta Pos Cek Gula Darah & Tensi Hari ke-2.
-- 2. Kategori peserta: Dokter Spesialis, Dokter Umum, Dokter FKTP (Onsite & Online),
--    Residen/PPDS, Perawat/Edukator, Mahasiswa S1, Diabetes Health Forum,
--    Anggota PERSADIA, dan Masyarakat Umum (Bersedia vs Tolak Anggota).
-- 3. Edge cases scanner: Status Pembayaran (Lunas, Belum Lunas/Menunggu, Dibatalkan),
--    Mode Kehadiran (Onsite vs Online), Tiket Simposium Saja vs Workshop,
--    serta verifikasi tampilan peserta yang sudah pernah check-in sebelumnya.
--
-- CATATAN PENGHAPUSAN (CLEANUP):
-- Untuk menghapus kembali seluruh data dummy ini kapan saja, cukup jalankan:
-- DELETE FROM public.pendaftar WHERE no_registrasi LIKE 'KNS2026-TEST%';
-- ==============================================================================

-- 1. Bersihkan data dummy testing terdahulu jika sudah pernah diinput (agar idempotent)
DELETE FROM public.pendaftar WHERE no_registrasi LIKE 'KNS2026-TEST%';

-- 2. Insert 14 Peserta Dummy Testing
WITH base_id AS (
    SELECT COALESCE(MAX(id), 0) AS max_id FROM public.pendaftar
),
new_data AS (
    SELECT
        ROW_NUMBER() OVER () AS rnum,
        v.no_registrasi,
        v.nama_lengkap,
        v.kategori_peserta,
        v.pilihan_kegiatan,
        v.mode_kehadiran,
        v.status_pembayaran,
        v.whatsapp,
        v.email,
        v.institusi,
        v.cabang_persadia,
        v.nik,
        v.nim,
        v.tanggal_lahir,
        v.jenis_kelamin,
        v.kota_kabupaten,
        v.provinsi,
        v.total_tagihan,
        v.ikut_health_talk,
        v.bersedia_anggota_persadia,
        v.registrasi_onsite,
        v.waktu_registrasi_onsite,
        v.kehadiran_workshop,
        v.waktu_kehadiran_workshop,
        v.makan_siang_hari_1,
        v.makan_siang_pesta_rakyat,
        v.pengambilan_merchandise
    FROM (
        VALUES
        -- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        -- 1. DOKTER SPESIALIS (Onsite, Lunas, Simposium & Workshop) -> Akses Penuh: Registrasi, Workshop, Makan H1 & H2, Cek Fisik
        ('KNS2026-TEST01', '[TEST] dr. Budi Santoso, Sp.PD', 'Dokter Spesialis (Sp.PD, Sp.PD-KEMD)', 'Simposium & Workshop', 'Onsite', 'Lunas', '089999000001', 'dr.budi.test@konas2026.com', 'RSUP Dr. Cipto Mangunkusumo', 'PERSADIA Cabang Jakarta Pusat', '3171011505800001', '-', '1980-05-15', 'Laki-laki', 'Kota Jakarta Pusat', 'DKI Jakarta', 2500000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 2. DOKTER UMUM (Onsite, Lunas, Simposium Saja) -> Lolos Registrasi & Makan H1; Ditolak Ruang Workshop (Simposium Saja)
        ('KNS2026-TEST02', '[TEST] dr. Siti Rahmawati', 'Dokter Umum', 'Simposium Saja', 'Onsite', 'Lunas', '089999000002', 'dr.siti.test@konas2026.com', 'Klinik Pratama Sehat Selalu', 'PERSADIA Cabang Kota Bogor', '3271015208880002', '-', '1988-08-12', 'Perempuan', 'Kota Bogor', 'Jawa Barat', 1500000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 3. DOKTER FKTP ONSITE (Lunas, Simposium & Workshop) -> Lolos Registrasi, Workshop, Makan H1 & H2
        ('KNS2026-TEST03', '[TEST] dr. Ahmad Fauzi', 'Dokter Layanan Primer (FKTP)', 'Simposium & Workshop FKTP (Onsite)', 'Onsite', 'Lunas', '089999000003', 'dr.fauzi.test@konas2026.com', 'Puskesmas Cibinong', 'PERSADIA Cabang Kabupaten Bogor', '3201012304850003', '-', '1985-04-23', 'Laki-laki', 'Kabupaten Bogor', 'Jawa Barat', 600000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 4. DOKTER FKTP ONLINE (Lunas, Webinar Zoom) -> Ditolak di Meja Registrasi Fisik, Workshop, & Pos Konsumsi (Tiket Online)
        ('KNS2026-TEST04', '[TEST] dr. Hendra Wijaya', 'Dokter Layanan Primer (FKTP)', 'Sesi Ilmiah FKTP (Online)', 'Online', 'Lunas', '089999000004', 'dr.hendra.online@konas2026.com', 'Puskesmas Bogor Tengah', 'PERSADIA Cabang Kota Bogor', '3271021409890004', '-', '1989-09-14', 'Laki-laki', 'Kota Bogor', 'Jawa Barat', 300000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 5. RESIDEN / PPDS (Onsite, Lunas, Simposium & Workshop) -> Lolos Registrasi, Workshop, Makan H1 & H2
        ('KNS2026-TEST05', '[TEST] dr. Dian Permata', 'Residen / PPDS (Pendidikan Dokter Spesialis)', 'Simposium & Workshop', 'Onsite', 'Lunas', '089999000005', 'dr.dian.ppds@konas2026.com', 'Fakultas Kedokteran UI / RSCM', 'PERSADIA Cabang Jakarta Pusat', '3171036011920005', '-', '1992-11-20', 'Perempuan', 'Kota Jakarta Pusat', 'DKI Jakarta', 1000000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 6. PERAWAT / EDUKATOR (Onsite, Lunas, Workshop Medis) -> Otomatis Berhak Workshop Medis Terapan & Makan H1
        ('KNS2026-TEST06', '[TEST] Ns. Rina Marlina, S.Kep', 'Perawat, Ahli Gizi & Edukator Diabetes', 'Workshop Medis Terapan', 'Onsite', 'Lunas', '089999000006', 'rina.ners@konas2026.com', 'RSUD Cibinong', 'PERSADIA Cabang Kabupaten Bogor', '3201026507870006', '-', '1987-07-25', 'Perempuan', 'Kabupaten Bogor', 'Jawa Barat', 400000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 7. MAHASISWA KEDOKTERAN S1 (Onsite, Lunas, Simposium Saja) -> Lolos Registrasi & Makan H1; Ditolak Ruang Workshop
        ('KNS2026-TEST07', '[TEST] Kevin Sanjaya', 'Mahasiswa Kedokteran S1', 'Simposium Saja', 'Onsite', 'Lunas', '089999000007', 'kevin.fk@student.ac.id', 'Fakultas Kedokteran UI', 'PERSADIA Cabang Jakarta Pusat', '-', '042111533001', '2003-03-18', 'Laki-laki', 'Kota Depok', 'Jawa Barat', 400000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 8. DIABETES HEALTH FORUM (Onsite, Lunas, DHF) -> Lolos Registrasi, Makan H1 (Novotel), Makan H2 (Pakansari); Ditolak Workshop
        ('KNS2026-TEST08', '[TEST] Ibu Ratna Sari', 'Diabetes Health Forum', 'Diabetes Health Forum', 'Onsite', 'Lunas', '089999000008', 'ratna.dhf@konas2026.com', 'Komunitas Diabetes Sehat', 'PERSADIA Cabang Kota Bogor', '3271034406750008', '-', '1975-06-04', 'Perempuan', 'Kota Bogor', 'Jawa Barat', 200000, TRUE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 9. ANGGOTA PERSADIA (Onsite, Lunas, Pesta Rakyat) -> Berhak Merchandise, Makan H2, Cek Gula Darah; Ditolak Workshop & Makan H1
        ('KNS2026-TEST09', '[TEST] Bapak Joko Widodo', 'Anggota PERSADIA', 'Pesta Rakyat', 'Onsite', 'Lunas', '089999000009', '-', 'PERSADIA Unit Bogor Timur', 'PERSADIA Cabang Kota Bogor', '3271011003610009', '-', '1961-03-10', 'Laki-laki', 'Kota Bogor', 'Jawa Barat', 0, FALSE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 10. MASYARAKAT UMUM (BERSEDIA ANGGOTA: TRUE) -> Berhak Merchandise (karena bersedia anggota = TRUE), Makan H2, Cek Gula Darah
        ('KNS2026-TEST10', '[TEST] Ibu Ani Yudhoyono', 'Masyarakat Umum', 'Pesta Rakyat', 'Onsite', 'Lunas', '089999000010', '-', 'Masyarakat Umum Cibinong', 'PERSADIA Cabang Kabupaten Bogor', '3201015007700010', '-', '1970-07-10', 'Perempuan', 'Kabupaten Bogor', 'Jawa Barat', 100000, FALSE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 11. MASYARAKAT UMUM (TIDAK BERSEDIA ANGGOTA: FALSE) -> Ditolak Pengambilan Merchandise! Lolos Makan H2 & Cek Fisik Hari ke-2
        ('KNS2026-TEST11', '[TEST] Bapak Bambang', 'Masyarakat Umum', 'Pesta Rakyat', 'Onsite', 'Lunas', '089999000011', '-', 'Warga Sentul Bogor', 'PERSADIA Cabang Kabupaten Bogor', '3201021208680011', '-', '1968-08-12', 'Laki-laki', 'Kabupaten Bogor', 'Jawa Barat', 100000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 12. STATUS BELUM LUNAS (Dokter Umum Onsite) -> Ditolak di Meja Registrasi ('PEMBAYARAN BELUM LUNAS')
        ('KNS2026-TEST12', '[TEST] dr. Maya Pratiwi (Belum Lunas)', 'Dokter Umum', 'Simposium & Workshop', 'Onsite', 'Menunggu Verifikasi', '089999000012', 'dr.maya.test@konas2026.com', 'Klinik Medika Bogor', 'PERSADIA Cabang Kota Bogor', '3271016509900012', '-', '1990-09-25', 'Perempuan', 'Kota Bogor', 'Jawa Barat', 1500000, FALSE, FALSE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 13. STATUS DIBATALKAN (Anggota PERSADIA) -> Ditolak di Seluruh Pos ('PENDAFTARAN DIBATALKAN')
        ('KNS2026-TEST13', '[TEST] Agus Susanto (Tiket Batal)', 'Anggota PERSADIA', 'Pesta Rakyat', 'Onsite', 'Dibatalkan', '089999000013', '-', 'PERSADIA Unit Cibinong', 'PERSADIA Cabang Kabupaten Bogor', '3201011802650013', '-', '1965-02-18', 'Laki-laki', 'Kabupaten Bogor', 'Jawa Barat', 0, FALSE, TRUE, NULL, NULL, NULL, NULL, NULL, NULL, NULL),

        -- 14. SUDAH CHECK-IN (Anggota PERSADIA) -> Menampilkan status 'Sudah Registrasi', 'Sudah Ambil Souvenir', & 'Sudah Makan'
        ('KNS2026-TEST14', '[TEST] Hj. Siti Aminah (Sudah Check-In)', 'Anggota PERSADIA', 'Pesta Rakyat', 'Onsite', 'Lunas', '089999000014', '-', 'PERSADIA Unit Tanah Sareal', 'PERSADIA Cabang Kota Bogor', '3271025501580014', '-', '1958-01-15', 'Perempuan', 'Kota Bogor', 'Jawa Barat', 0, FALSE, TRUE, 'Ya', '2026-11-08 07:15:00+07', NULL, NULL, NULL, 'Ya', 'Ya')
        -- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    ) AS v(
        no_registrasi, nama_lengkap, kategori_peserta, pilihan_kegiatan, mode_kehadiran, status_pembayaran,
        whatsapp, email, institusi, cabang_persadia, nik, nim, tanggal_lahir, jenis_kelamin,
        kota_kabupaten, provinsi, total_tagihan, ikut_health_talk, bersedia_anggota_persadia,
        registrasi_onsite, waktu_registrasi_onsite, kehadiran_workshop, waktu_kehadiran_workshop,
        makan_siang_hari_1, makan_siang_pesta_rakyat, pengambilan_merchandise
    )
)
INSERT INTO public.pendaftar (
    id, timestamp, no_registrasi, status_pembayaran, nama_lengkap, email, whatsapp,
    kategori_peserta, pilihan_kegiatan, total_tagihan, institusi, nim, cabang_persadia,
    tanggal_lahir, jenis_kelamin, registrasi_onsite, waktu_registrasi_onsite, tinggi_badan,
    berat_badan, tensi, lingkar_perut, cek_gula_darah, gula_darah, makan_siang_pesta_rakyat,
    ikut_health_talk, bersedia_anggota_persadia, alamat_lengkap, kelurahan, kecamatan,
    kota_kabupaten, provinsi, kesediaan_data, gejala_neuropati, pengambilan_merchandise,
    kode_voucher, makan_siang_hari_1, nama_ketua_cabang, mode_kehadiran, nik,
    kehadiran_workshop, waktu_kehadiran_workshop
)
SELECT
    b.max_id + n.rnum,
    NOW(),
    n.no_registrasi,
    n.status_pembayaran,
    n.nama_lengkap,
    n.email,
    n.whatsapp,
    n.kategori_peserta,
    n.pilihan_kegiatan,
    n.total_tagihan::NUMERIC,
    n.institusi,
    n.nim,
    n.cabang_persadia,
    n.tanggal_lahir,
    n.jenis_kelamin,
    n.registrasi_onsite,
    n.waktu_registrasi_onsite::TIMESTAMPTZ,
    NULL::NUMERIC,
    NULL::NUMERIC,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    n.makan_siang_pesta_rakyat,
    n.ikut_health_talk::BOOLEAN,
    n.bersedia_anggota_persadia::BOOLEAN,
    '-'::TEXT,
    '-'::VARCHAR,
    '-'::VARCHAR,
    n.kota_kabupaten::VARCHAR,
    n.provinsi::VARCHAR,
    'Ya'::TEXT,
    'Tidak'::TEXT,
    n.pengambilan_merchandise,
    '-'::TEXT,
    n.makan_siang_hari_1,
    '-'::TEXT,
    n.mode_kehadiran,
    n.nik::VARCHAR,
    n.kehadiran_workshop,
    n.waktu_kehadiran_workshop
FROM new_data n
CROSS JOIN base_id b;

-- 3. VERIFIKASI POST-INSERT
SELECT 
    id, 
    no_registrasi, 
    nama_lengkap, 
    kategori_peserta, 
    pilihan_kegiatan, 
    mode_kehadiran, 
    status_pembayaran,
    waktu_registrasi_onsite,
    bersedia_anggota_persadia,
    registrasi_onsite,
    pengambilan_merchandise
FROM public.pendaftar 
WHERE no_registrasi LIKE 'KNS2026-TEST%'
ORDER BY id ASC;
