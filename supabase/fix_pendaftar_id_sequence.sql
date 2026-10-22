-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX PERMANEN SEQUENCE AUTO-INCREMENT TABEL PENDAFTAR
-- ==============================================================================
-- Masalah:
-- Error saat pendaftar klik "Kirim pendaftaran" di website:
-- "Gagal menyimpan pendaftaran: duplicate key value violates unique constraint 'pendaftar_pkey'"
--
-- Penyebab:
-- Ketika data peserta dimasukkan secara manual/massal melalui SQL Editor (dengan kolom `id` terisi),
-- sequence auto-increment PostgreSQL (`pendaftar_id_seq`) TIDAK otomatis sinkron.
-- Akibatnya, saat calon pendaftar mendaftar dari web (tanpa mengisi kolom ID),
-- PostgreSQL memanggil sequence lama yang sudah terpakai dan menabrak PRIMARY KEY (`pendaftar_pkey`).
--
-- Solusi Permanen Script Ini:
-- 1. Menyinkronkan sequence `pendaftar_id_seq` ke ID tertinggi saat ini.
-- 2. Memasang TRIGGER OTOMATIS: Setiap kali ada insert manual dengan kolom `id` di masa depan,
--    sequence otomatis dinaikkan secara real-time sehingga TIDAK AKAN PERNAH bentrok lagi.
-- 3. Membuat RPC Function `sync_pendaftar_id_sequence()` dan `get_next_pendaftar_id()`
--    sebagai mekanisme self-healing otomatis langsung dari aplikasi web.
--
-- CARA EKSEKUSI:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project KONAS PERSADIA 2026 -> Masuk ke menu "SQL Editor"
-- 3. Klik "+ New query", Tempel (Paste) seluruh isi script ini, lalu klik "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SINKRONKAN SEQUENCE KE ID TERTINGGI SAAT INI (LANGSUNG AKTIF)
-- ------------------------------------------------------------------------------
SELECT setval(
    COALESCE(
        pg_get_serial_sequence('public.pendaftar', 'id'), 
        'public.pendaftar_id_seq'
    ),
    COALESCE((SELECT MAX(id) FROM public.pendaftar), 0)
);

-- Fallback jika tabel menggunakan PostgreSQL 10+ IDENTITY COLUMN
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


-- ------------------------------------------------------------------------------
-- 2. PASANG TRIGGER OTOMATIS (MENCEGAH MASALAH INI TERULANG SELAMANYA)
-- ------------------------------------------------------------------------------
-- Fungsi trigger yang otomatis menaikkan sequence bila ada import/insert dengan ID manual
CREATE OR REPLACE FUNCTION public.auto_sync_pendaftar_id_sequence()
RETURNS TRIGGER AS $$
DECLARE
    v_seq_name text;
    v_last_val bigint;
BEGIN
    IF NEW.id IS NOT NULL THEN
        v_seq_name := COALESCE(pg_get_serial_sequence('public.pendaftar', 'id'), 'public.pendaftar_id_seq');
        BEGIN
            -- Ambil nilai sequence saat ini
            EXECUTE format('SELECT last_value FROM %s', v_seq_name) INTO v_last_val;
            
            -- Jika ID baru lebih besar dari sequence, langsung naikkan sequence ke nilai ID baru
            IF NEW.id >= v_last_val THEN
                PERFORM setval(v_seq_name, NEW.id);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger pada tabel public.pendaftar
DROP TRIGGER IF EXISTS trg_auto_sync_pendaftar_id_sequence ON public.pendaftar;
CREATE TRIGGER trg_auto_sync_pendaftar_id_sequence
AFTER INSERT ON public.pendaftar
FOR EACH ROW
EXECUTE FUNCTION public.auto_sync_pendaftar_id_sequence();


-- ------------------------------------------------------------------------------
-- 3. BUAT RPC SELF-HEALING (DAPAT DIPANGGIL WEBSITE JIKA TERJADI DESINKRONISASI)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_pendaftar_id_sequence()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_id bigint;
    v_seq_name text;
    v_new_val bigint;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO v_max_id FROM public.pendaftar;
    v_seq_name := COALESCE(pg_get_serial_sequence('public.pendaftar', 'id'), 'public.pendaftar_id_seq');
    
    -- Naikkan sequence ke max(id)
    v_new_val := setval(v_seq_name, v_max_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'max_id', v_max_id,
        'new_sequence_value', v_new_val
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_pendaftar_id_sequence() TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. BUAT RPC GENERATOR ID CADANGAN
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_pendaftar_id()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_max_id bigint;
    v_seq_name text;
    v_next_val bigint;
BEGIN
    SELECT COALESCE(MAX(id), 0) INTO v_max_id FROM public.pendaftar;
    v_seq_name := COALESCE(pg_get_serial_sequence('public.pendaftar', 'id'), 'public.pendaftar_id_seq');
    
    -- Pastikan sequence minimal sama dengan max_id
    PERFORM setval(v_seq_name, v_max_id);
    
    -- Ambil sequence berikutnya
    v_next_val := nextval(v_seq_name);
    
    RETURN v_next_val;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_pendaftar_id() TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. VERIFIKASI HASIL EKSEKUSI
-- ------------------------------------------------------------------------------
SELECT 
    (SELECT MAX(id) FROM public.pendaftar) AS id_tertinggi_tabel,
    currval(COALESCE(pg_get_serial_sequence('public.pendaftar', 'id'), 'public.pendaftar_id_seq')) AS sequence_saat_ini;
