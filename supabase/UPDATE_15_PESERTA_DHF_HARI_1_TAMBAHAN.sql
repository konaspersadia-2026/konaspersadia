-- ==============================================================================
-- KONAS PERSADIA 2026 - UPDATE AKSES SESI DHF & MAKAN SIANG HARI 1 (15 PESERTA)
-- Tanggal Acara: Sabtu, 7 November 2026 (Ballroom 2 Novotel Bogor)
-- Wilayah: PERSADIA Cabang Bogor & Sekitarnya (Bogor Barat, ATS, Marzoeki Mahdi)
-- Keterangan Verifikasi ODS: 15 nama & no registrasi telah dicocokkan 100% ke ODS.
-- Catatan Khusus:
--   1. Terdapat 3 peserta yang sudah tercakup di batch 105 sebelumnya (No. 3, 8, 9).
--   2. No. 3 (Yanah Hadi): Typo 1 digit (44581 -> 44531) an Nuryanah.
-- Sesuai Struktur Tabel Asli: TIDAK MENAMBAH KOLOM BARU DI TABEL PUBLIC.PENDAFTAR
-- ==============================================================================

UPDATE public.pendaftar
SET
    pilihan_kegiatan  = 'Pesta Rakyat + Diabetes Health Forum',
    ikut_health_talk  = true,
    mode_kehadiran    = 'Onsite',
    status_pembayaran = 'Lunas'
WHERE no_registrasi IN (
    'KNS2026-29691',            -- 1. Nayu Nuraifa (Baru)
    'KNS2026-43541185',         -- 2. ADE NURJANAH / Ade (Baru)
    'KNS2026-44531',            -- 3. Nuryanah / Yanah Hadi (Koreksi typo input: 44581 -> 44531, sudah ada di batch 105)
    'KNS2026-38371',            -- 4. Dini rediny / Dini (Baru)
    'KNS2026-95390',            -- 5. Tati Suryati (Baru)
    'KNS2026-87019',            -- 6. Hj Nyinyih wasiah / Nyinyih wasid (Baru)
    'KNS2026-51148660',         -- 7. Emmy Theresya / Emi (Baru)
    'KNS2026-70474',            -- 8. Nurhayati (Sudah ada di batch 105)
    'KNS2026-96126591',         -- 9. Hj Nurhaida Wicky / Wiki nurhaida (Sudah ada di batch 105)
    'KNS2026-99153',            -- 10. DJUMIANAH / Djumianah (Baru)
    'KNS2026-59809',            -- 11. IIS NIKMAH / Iis nikmah (Baru)
    'KNS2026-41597',            -- 12. Dewi Murniati / Dewi murniati (Baru)
    'KNS2026-34450',            -- 13. Sri rejeki / B.Sri rezeki (Baru)
    'KNS2026-80770',            -- 14. Nunung / B.Nunung Irawati (Baru)
    'KNS2026-80168'             -- 15. Sumariyah / B.Sumariah (Baru)
);

-- ------------------------------------------------------------------------------
-- VERIFIKASI HASIL UPDATE 15 PESERTA
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
    'KNS2026-29691',
    'KNS2026-43541185',
    'KNS2026-44531',
    'KNS2026-38371',
    'KNS2026-95390',
    'KNS2026-87019',
    'KNS2026-51148660',
    'KNS2026-70474',
    'KNS2026-96126591',
    'KNS2026-99153',
    'KNS2026-59809',
    'KNS2026-41597',
    'KNS2026-34450',
    'KNS2026-80770',
    'KNS2026-80168'
)
ORDER BY nama_lengkap ASC;
