-- ==============================================================================
-- KONAS PERSADIA 2026: SKRIP BERSIHKAN / RESET DATA E-VOTING
-- ==============================================================================
-- Gunakan skrip ini setelah Anda selesai melakukan uji coba / simulasi voting
-- agar sistem kembali bersih 0% saat hari-H kongres resmi dimulai.
--
-- CARA PENGGUNAAN DI SUPABASE SQL EDITOR:
-- Pilih salah satu Opsi di bawah ini (Opsi A atau Opsi B), lalu klik RUN.
-- ==============================================================================

-- ==============================================================================
-- OPSI A (SANGAT DIREKOMENDASIKAN UNTUK SIMULASI):
-- RESET KOTAK SUARA & HANGUSAN TOKEN (Kandidat & DPT Tetap Utuh)
-- ==============================================================================
-- Gunakan opsi ini jika nama kandidat dan nama pemilih cabang sudah benar,
-- dan Anda hanya ingin meng-nol-kan kembali hasil suara coblosan simulasi.

-- 1. Kosongkan seluruh kotak suara (suara simulasi dihapus)
DELETE FROM public.voting_suara;

-- 2. Hidupkan kembali seluruh token pemilih (status kembali belum memilih)
UPDATE public.voting_dpt
SET status_memilih = FALSE,
    waktu_memilih = NULL;

-- 3. Kembalikan status sidang ke 'draft' dan sembunyikan quick count
UPDATE public.voting_config
SET value = 'draft'
WHERE key = 'status_pemilihan';

UPDATE public.voting_config
SET value = 'false'
WHERE key = 'tampilkan_quick_count';

-- Verifikasi hasil Opsi A:
SELECT 
    (SELECT COUNT(*) FROM public.voting_kandidat) AS total_kandidat,
    (SELECT COUNT(*) FROM public.voting_dpt) AS total_dpt,
    (SELECT COUNT(*) FROM public.voting_suara) AS total_suara_masuk_harus_nol,
    (SELECT value FROM public.voting_config WHERE key = 'status_pemilihan') AS status_sidang_harus_draft;


-- ==============================================================================
-- OPSI B: RESET TOTAL / BERSIH SEMPURNA (HAPUS SEMUA DATA DUMMY)
-- ==============================================================================
-- Gunakan opsi ini jika Anda ingin menghapus seluruh data simulasi termasuk
-- kandidat dummy dan pemilih dummy, sehingga tabel benar-benar kosong melompong.
-- (Buka tanda komentar di bawah jika ingin menjalankan Opsi B)

/*
-- 1. Hapus semua suara
DELETE FROM public.voting_suara;

-- 2. Hapus semua pemilih DPT
DELETE FROM public.voting_dpt;

-- 3. Hapus semua kandidat
DELETE FROM public.voting_kandidat;

-- 4. Kembalikan urutan nomor ID kandidat ke 1
ALTER SEQUENCE IF EXISTS public.voting_kandidat_id_seq RESTART WITH 1;

-- 5. Reset status sidang ke draft
UPDATE public.voting_config SET value = 'draft' WHERE key = 'status_pemilihan';
UPDATE public.voting_config SET value = 'false' WHERE key = 'tampilkan_quick_count';

-- Verifikasi hasil Opsi B (semuanya harus 0):
SELECT 
    (SELECT COUNT(*) FROM public.voting_kandidat) AS sisa_kandidat,
    (SELECT COUNT(*) FROM public.voting_dpt) AS sisa_dpt,
    (SELECT COUNT(*) FROM public.voting_suara) AS sisa_suara;
*/
