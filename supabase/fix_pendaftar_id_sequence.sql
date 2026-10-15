-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX SEQUENCE AUTO-INCREMENT ID TABEL PENDAFTAR
-- ==============================================================================
-- Masalah:
-- Error saat pendaftar submit form di web:
-- "Gagal menyimpan pendaftaran: duplicate key value violates unique constraint 'pendaftar_pkey'"
--
-- Penyebab:
-- Ketika data peserta dimasukkan secara massal melalui SQL (manual INSERT dengan kolom `id` terisi),
-- sequence auto-increment bawaan PostgreSQL (pendaftar_id_seq) TIDAK otomatis naik.
-- Akibatnya, saat ada pendaftar baru dari website (yang tidak mengisi ID),
-- database memanggil sequence yang masih berada di nomor lama (sudah terpakai),
-- sehingga menabrak PRIMARY KEY ("pendaftar_pkey").
--
-- Cara Eksekusi:
-- 1. Buka Supabase Dashboard -> SQL Editor
-- 2. Tempel (Paste) script ini dan klik RUN
-- ==============================================================================

-- 1. Sinkronkan sequence 'pendaftar_id_seq' langsung ke nilai ID tertinggi saat ini
SELECT setval(
    COALESCE(
        pg_get_serial_sequence('public.pendaftar', 'id'), 
        'public.pendaftar_id_seq'
    ),
    COALESCE((SELECT MAX(id) FROM public.pendaftar), 0)
);

-- 2. Fallback jika tabel menggunakan IDENTITY COLUMN (PostgreSQL 10+)
DO $$
DECLARE
    v_max_id bigint;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_max_id FROM public.pendaftar;
    BEGIN
        EXECUTE format('ALTER TABLE public.pendaftar ALTER COLUMN id RESTART WITH %s', v_max_id);
    EXCEPTION WHEN OTHERS THEN
        -- Lewati jika tabel bukan bertipe identity column
        NULL;
    END;
END $$;

-- 3. Verifikasi Hasil
SELECT 
    (SELECT MAX(id) FROM public.pendaftar) AS id_tertinggi_tabel,
    currval(COALESCE(pg_get_serial_sequence('public.pendaftar', 'id'), 'public.pendaftar_id_seq')) AS sequence_berikutnya;
