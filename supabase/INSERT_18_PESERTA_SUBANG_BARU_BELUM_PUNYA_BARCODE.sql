-- ==============================================================================
-- KONAS PERSADIA 2026 - INSERT 18 PESERTA SUBANG (BELUM PUNYA BARCODE)
-- Wilayah: PERSADIA Cabang Subang (Kabupaten Subang, Jawa Barat)
-- Status: Lunas (Rp 0) | Pilihan Kegiatan: Pesta Rakyat | Mode: Onsite
-- Catatan: Unengsih TIDAK dimasukkan karena sudah terdaftar di ODS (baris 822) & DB
--          dengan nomor registrasi KNS2026-32472712.
-- Sequence-Safe: Otomatis sinkronkan sequence pendaftar_id_seq
--                sehingga pendaftaran web setelahnya TIDAK AKAN bentrok ID!
-- ==============================================================================

WITH base_id AS (
    SELECT COALESCE(MAX(id), 0) AS max_id FROM public.pendaftar
),
new_data AS (
    SELECT
        ROW_NUMBER() OVER () AS rnum,
        v.no_registrasi,
        v.nama_lengkap,
        v.jenis_kelamin,
        v.whatsapp,
        v.tanggal_lahir,
        v.institusi,
        v.cabang_persadia,
        v.kota_kabupaten,
        v.provinsi
    FROM (
        VALUES
        ('KNS2026-22004425', 'Nining', 'Perempuan', '08131042673', '1965-07-07', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 1. Nining (Asal Subang, 07 Juli 1965)
        ('KNS2026-29272632', 'Cania Gosal', 'Perempuan', '082219784393', '1970-10-17', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 2. Cania Gosal (Asal Banyuwangi, 17 Oktober 1970)
        ('KNS2026-31760089', 'Hj Oom Komalasari', 'Perempuan', '081394285230', '1954-08-15', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 3. Hj Oom Komalasari (Asal Bandung, 15 Agustus 1954)
        ('KNS2026-36060952', 'Ina Mulyani', 'Perempuan', '085222669395', '1965-06-07', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 4. Ina Mulyani (Asal Subang, 7 Juni 1965)
        ('KNS2026-93186149', 'Ai Rohamsyah', 'Perempuan', '088971004017', '1965-10-21', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 5. Ai Rohamsyah (Asal Subang, 21 Oktober 1965)
        ('KNS2026-92597552', 'Nunung N', 'Perempuan', '085220423063', '1969-04-18', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 6. Nunung N (Asal Subang, 18 April 1969)
        ('KNS2026-27930905', 'Cucu Sekarningsih', 'Perempuan', '081214915330', '1953-06-26', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 7. Cucu Sekarningsih (Asal Subang, 26 Juni 1953)
        ('KNS2026-17339937', 'Hj Ikkeu Fatihajatiningsih', 'Perempuan', '081312401665', '1965-08-05', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 8. Hj Ikkeu Fatihajatiningsih (Asal Subang, 5 Agustus 1965)
        ('KNS2026-80969643', 'Yuyu Wahyuningsih', 'Perempuan', '089520600230', '1967-06-23', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 9. Yuyu Wahyuningsih (Asal Subang, 23 Juni 1967)
        ('KNS2026-44081116', 'Lena Kulnianingsih', 'Perempuan', '082127487065', '1965-05-25', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 10. Lena Kulnianingsih (Asal Subang, 25 Mei 1965)
        ('KNS2026-81096259', 'Oom Romlah', 'Perempuan', '082113359881', '1980-10-29', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 11. Oom Romlah (Asal Majalengka, 29 Oktober 1980)
        ('KNS2026-78225404', 'Epon Lili Ligarwati', 'Perempuan', '082115726261', '1980-11-14', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 12. Epon Lili Ligarwati (Asal Subang, 14 November 1980)
        ('KNS2026-25359867', 'Yulia Fitriyani', 'Perempuan', '082215392019', '1981-07-09', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 13. Yulia Fitriyani (Asal Subang, 09 Juli 1981)
        ('KNS2026-33933272', 'Euis Carkesih', 'Perempuan', '082214711106', '1979-08-10', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 14. Euis Carkesih (Ditemukan dari master 43 - Subang.xlsx: Subang, 10 Agustus 1979)
        ('KNS2026-70773253', 'Okay Karyawati', 'Perempuan', '085351028884', '1976-08-29', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 15. Okay Karyawati (Ditemukan dari master 43 - Subang.xlsx: Subang, 29 Agustus 1976)
        ('KNS2026-35404539', 'Icha Rebeca Tias Belinda', 'Perempuan', '082127632403', '2000-09-14', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 16. Icha Rebeca Tias Belinda (Asal Lubuk Linggau, 14 September 2000)
        ('KNS2026-53615506', 'Ratna Purwati', 'Perempuan', '082321062686', '1986-06-30', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat'), -- 17. Ratna Purwati (Asal Indramayu, 30 Juni 1986)
        ('KNS2026-96391079', 'Suherman', 'Laki-laki', '085221105001', '1976-01-13', 'PERSADIA Cabang Subang', 'PERSADIA Cabang Subang', 'Kabupaten Subang', 'Jawa Barat') -- 18. Suherman (Asal 13 Januari 1976)
    ) AS v(no_registrasi, nama_lengkap, jenis_kelamin, whatsapp, tanggal_lahir, institusi, cabang_persadia, kota_kabupaten, provinsi)
)
INSERT INTO public.pendaftar (
    id,
    "timestamp",
    no_registrasi,
    status_pembayaran,
    nama_lengkap,
    email,
    whatsapp,
    kategori_peserta,
    pilihan_kegiatan,
    total_tagihan,
    institusi,
    nim,
    cabang_persadia,
    tanggal_lahir,
    jenis_kelamin,
    registrasi_onsite,
    waktu_registrasi_onsite,
    tinggi_badan,
    berat_badan,
    tensi,
    lingkar_perut,
    cek_gula_darah,
    gula_darah,
    makan_siang_pesta_rakyat,
    ikut_health_talk,
    bersedia_anggota_persadia,
    alamat_lengkap,
    kelurahan,
    kecamatan,
    kota_kabupaten,
    provinsi,
    kesediaan_data,
    gejala_neuropati,
    pengambilan_merchandise,
    kode_voucher,
    makan_siang_hari_1,
    nama_ketua_cabang,
    mode_kehadiran
)
SELECT
    b.max_id + d.rnum,                                  -- id otomatis berurutan dari id max saat ini
    NOW(),                                              -- timestamp
    d.no_registrasi,                                    -- no_registrasi unik KNS2026-XXXXXXXX (0 bentrok di ODS)
    'Lunas',                                            -- status_pembayaran
    d.nama_lengkap,                                     -- nama_lengkap
    '-',                                                -- email
    d.whatsapp,                                         -- whatsapp
    'Anggota PERSADIA',                                 -- kategori_peserta
    'Pesta Rakyat',                                     -- pilihan_kegiatan
    0,                                                  -- total_tagihan
    d.institusi,                                        -- institusi
    '-',                                                -- nim
    d.cabang_persadia,                                  -- cabang_persadia
    d.tanggal_lahir,                                    -- tanggal_lahir (YYYY-MM-DD)
    d.jenis_kelamin,                                    -- jenis_kelamin
    '',                                                 -- registrasi_onsite
    NULL,                                               -- waktu_registrasi_onsite
    NULL,                                               -- tinggi_badan
    NULL,                                               -- berat_badan
    '',                                                 -- tensi
    '',                                                 -- lingkar_perut
    '',                                                 -- cek_gula_darah
    '',                                                 -- gula_darah
    '',                                                 -- makan_siang_pesta_rakyat
    false,                                              -- ikut_health_talk
    false,                                              -- bersedia_anggota_persadia
    '-',                                                -- alamat_lengkap
    '-',                                                -- kelurahan
    '-',                                                -- kecamatan
    d.kota_kabupaten,                                   -- kota_kabupaten
    d.provinsi,                                         -- provinsi
    'Tidak',                                            -- kesediaan_data
    'Tidak',                                            -- gejala_neuropati
    '',                                                 -- pengambilan_merchandise
    '-',                                                -- kode_voucher
    '',                                                 -- makan_siang_hari_1
    '-',                                                -- nama_ketua_cabang
    'Onsite'                                            -- mode_kehadiran
FROM new_data d
CROSS JOIN base_id b;

-- ------------------------------------------------------------------------------
-- SINKRONISASI SEQUENCE (AGAR TIDAK BENTROK SAAT DAFTAR LEWAT WEBSITE)
-- ------------------------------------------------------------------------------
SELECT setval(
    COALESCE(pg_get_serial_sequence('public.pendaftar', 'id'), 'public.pendaftar_id_seq'),
    COALESCE((SELECT MAX(id) FROM public.pendaftar), 0)
);

DO $$
DECLARE
    v_max_id bigint;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_max_id FROM public.pendaftar;
    BEGIN
        EXECUTE format('ALTER TABLE public.pendaftar ALTER COLUMN id RESTART WITH %s', v_max_id);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

DO $$
BEGIN
    PERFORM public.sync_pendaftar_id_sequence();
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- VERIFIKASI HASIL INSERT 18 PESERTA
-- ------------------------------------------------------------------------------
SELECT id, no_registrasi, nama_lengkap, jenis_kelamin, tanggal_lahir, whatsapp, cabang_persadia, status_pembayaran
FROM public.pendaftar
WHERE no_registrasi IN (
    'KNS2026-22004425',
    'KNS2026-29272632',
    'KNS2026-31760089',
    'KNS2026-36060952',
    'KNS2026-93186149',
    'KNS2026-92597552',
    'KNS2026-27930905',
    'KNS2026-17339937',
    'KNS2026-80969643',
    'KNS2026-44081116',
    'KNS2026-81096259',
    'KNS2026-78225404',
    'KNS2026-25359867',
    'KNS2026-33933272',
    'KNS2026-70773253',
    'KNS2026-35404539',
    'KNS2026-53615506',
    'KNS2026-96391079'
)
ORDER BY id ASC;
