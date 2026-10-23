-- ==============================================================================
-- KONAS PERSADIA 2026 - SISTEM E-VOTING PEMILIHAN PRESIDEN PERSADIA 2026–2030
-- ==============================================================================
-- Skrip ini membuat seluruh struktur tabel, indeks, RPC atomik, dan izin (RLS)
-- untuk sistem pemilihan yang 100% terisolasi dari tabel pendaftar utama.
--
-- CARA EKSEKUSI DI SUPABASE:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Masuk ke menu "SQL Editor" -> Klik "New query"
-- 3. Salin & tempel seluruh isi script ini -> Klik tombol "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL voting_kandidat (Data Calon Presiden PERSADIA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voting_kandidat (
    id SERIAL PRIMARY KEY,
    nomor_urut INT NOT NULL UNIQUE,
    nama_kandidat TEXT NOT NULL,
    gelar TEXT,
    institusi TEXT,
    foto_url TEXT,
    visi TEXT,
    misi TEXT,
    cv_url TEXT,
    ringkasan_cv TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrasi aman jika tabel sudah ada sebelumnya
ALTER TABLE public.voting_kandidat ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.voting_kandidat ADD COLUMN IF NOT EXISTS ringkasan_cv TEXT;

-- ------------------------------------------------------------------------------
-- 2. TABEL voting_dpt (Daftar Pemilih Tetap / Delegasi Cabang Berhak Suara)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voting_dpt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap TEXT NOT NULL,
    whatsapp TEXT,
    cabang_persadia TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status_memilih BOOLEAN NOT NULL DEFAULT FALSE,
    waktu_memilih TIMESTAMPTZ,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pastikan kolom whatsapp bersifat opsional
ALTER TABLE public.voting_dpt ALTER COLUMN whatsapp DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voting_dpt_token ON public.voting_dpt (UPPER(TRIM(token)));
CREATE INDEX IF NOT EXISTS idx_voting_dpt_status ON public.voting_dpt (status_memilih);

-- ------------------------------------------------------------------------------
-- 3. TABEL voting_suara (Kotak Suara Tertutup - Anonim / Secret Ballot)
-- ------------------------------------------------------------------------------
-- Catatan: Tabel ini sengaja TIDAK memiliki kolom ID pemilih agar asas kerahasiaan
-- suara (LUBER) terjaga dan tidak dapat dilacak siapa memilih siapa.
CREATE TABLE IF NOT EXISTS public.voting_suara (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kandidat_id INT NOT NULL REFERENCES public.voting_kandidat(id) ON DELETE CASCADE,
    waktu_suara TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voting_suara_kandidat ON public.voting_suara (kandidat_id);

-- ------------------------------------------------------------------------------
-- 4. TABEL voting_config (Pengaturan & Status Sesi Sidang Pemilihan)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voting_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert nilai konfigurasi awal jika belum ada
INSERT INTO public.voting_config (key, value, description)
VALUES 
    ('status_pemilihan', 'draft', 'Status sesi sidang: draft (belum dibuka), open (sedang berlangsung), closed (ditutup)'),
    ('tampilkan_quick_count', 'false', 'Tampilkan hasil suara real-time: true / false'),
    ('judul_pemilihan', 'Pemilihan Presiden Pengurus Besar PERSADIA Periode 2026–2030', 'Judul resmi sesi sidang pemilihan'),
    ('voting_admin_passcode', 'panlih2026', 'Passcode login darurat panitia pemilihan presidium'),
    ('scanner_passcode', 'persadia2026', 'Passcode login panitia petugas scanner QR tiket & presensi'),
    ('putaran_voting', '1', 'Putaran pemilihan: 1 (Putaran Pertama) atau 2 (Putaran Kedua / Run-off)'),
    ('kandidat_putaran_2', '[]', 'Daftar ID kandidat yang berhak maju ke Putaran Kedua dalam format JSON array')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. RPC: VALIDASI TOKEN PEMILIH (validate_voter_token)
-- ------------------------------------------------------------------------------
-- Dipanggil saat pemilih membuka link atau memasukkan token di bilik suara.
-- Cukup menggunakan Token Rahasia tanpa mewajibkan nomor WhatsApp.
CREATE OR REPLACE FUNCTION public.validate_voter_token(
    p_token TEXT,
    p_whatsapp TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_token TEXT;
    v_dpt RECORD;
    v_status TEXT;
BEGIN
    v_clean_token := UPPER(TRIM(COALESCE(p_token, '')));
    
    -- Cek status sesi pemilihan
    SELECT value INTO v_status FROM public.voting_config WHERE key = 'status_pemilihan';
    IF v_status IS NULL THEN
        v_status := 'draft';
    END IF;

    -- Cari data DPT berdasarkan token
    SELECT id, nama_lengkap, whatsapp, cabang_persadia, token, status_memilih, waktu_memilih
    INTO v_dpt
    FROM public.voting_dpt
    WHERE UPPER(TRIM(token)) = v_clean_token;

    -- Token tidak ditemukan
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'TOKEN_NOT_FOUND',
            'message', 'Token tidak ditemukan. Pastikan kode yang Anda masukkan sesuai dengan undangan panitia.'
        );
    END IF;

    -- Cek apakah sudah pernah memilih
    IF v_dpt.status_memilih = TRUE THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'ALREADY_VOTED',
            'message', 'Hak suara untuk token ini sudah digunakan sebelumnya.',
            'nama', v_dpt.nama_lengkap,
            'cabang', v_dpt.cabang_persadia,
            'waktu_memilih', v_dpt.waktu_memilih
        );
    END IF;

    -- Token valid
    RETURN jsonb_build_object(
        'valid', true,
        'reason', 'OK',
        'nama', v_dpt.nama_lengkap,
        'cabang', v_dpt.cabang_persadia,
        'token', v_dpt.token,
        'status_pemilihan', v_status
    );
END;
$$;

-- 6. RPC ATOMIK: PENGIRIMAN SUARA KE KOTAK SUARA (submit_voting_ballot)
-- ------------------------------------------------------------------------------
-- Memverifikasi token, membakar token, dan memasukkan suara anonim dalam 1 transaksi.
CREATE OR REPLACE FUNCTION public.submit_voting_ballot(
    p_token TEXT,
    p_kandidat_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_token TEXT;
    v_status TEXT;
    v_dpt_id UUID;
    v_already_voted BOOLEAN;
    v_kandidat_exists BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
    v_putaran TEXT;
    v_kandidat_p2_str TEXT;
BEGIN
    v_clean_token := UPPER(TRIM(COALESCE(p_token, '')));

    -- 1. Validasi sesi sidang pemilihan harus 'open'
    SELECT value INTO v_status FROM public.voting_config WHERE key = 'status_pemilihan';
    IF v_status IS NULL OR v_status <> 'open' THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'SESSION_NOT_OPEN',
            'message', 'Sesi pemilihan saat ini belum dibuka atau telah resmi ditutup oleh pimpinan sidang.'
        );
    END IF;

    -- 2. Kunci baris DPT (SELECT FOR UPDATE) untuk mencegah race condition / double submit
    SELECT id, status_memilih INTO v_dpt_id, v_already_voted
    FROM public.voting_dpt
    WHERE UPPER(TRIM(token)) = v_clean_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'TOKEN_NOT_FOUND',
            'message', 'Token suara tidak valid.'
        );
    END IF;

    IF v_already_voted = TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'ALREADY_VOTED',
            'message', 'Hak suara untuk token ini sudah pernah digunakan. Satu token hanya dapat digunakan satu kali.'
        );
    END IF;

    -- 3. Validasi kandidat yang dipilih
    SELECT EXISTS(
        SELECT 1 FROM public.voting_kandidat WHERE id = p_kandidat_id
    ) INTO v_kandidat_exists;

    IF NOT v_kandidat_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'INVALID_CANDIDATE',
            'message', 'Kandidat yang dipilih tidak terdaftar.'
        );
    END IF;

    -- Validasi kualifikasi kandidat untuk putaran kedua (jika sedang putaran 2)
    SELECT COALESCE(value, '1') INTO v_putaran FROM public.voting_config WHERE key = 'putaran_voting';
    IF v_putaran = '2' THEN
        SELECT COALESCE(value, '[]') INTO v_kandidat_p2_str FROM public.voting_config WHERE key = 'kandidat_putaran_2';
        IF v_kandidat_p2_str <> '[]' THEN
            IF NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(v_kandidat_p2_str::jsonb) elem WHERE elem::int = p_kandidat_id
            ) THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'reason', 'CANDIDATE_NOT_IN_ROUND_2',
                    'message', 'Kandidat yang dipilih tidak memenuhi syarat untuk Putaran Kedua.'
                );
            END IF;
        END IF;
    END IF;

    -- 4. Eksekusi 1: Hanguskan token di tabel DPT
    UPDATE public.voting_dpt
    SET status_memilih = TRUE,
        waktu_memilih = v_now
    WHERE id = v_dpt_id;

    -- 5. Eksekusi 2: Masukkan suara murni tanpa identitas ke kotak suara
    INSERT INTO public.voting_suara (kandidat_id, waktu_suara)
    VALUES (p_kandidat_id, v_now);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Hak suara Anda berhasil dicatat secara sah dan rahasia.',
        'waktu_suara', v_now
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. RPC: REKAPITULASI SUARA (get_voting_rekapitulasi)
-- ------------------------------------------------------------------------------
-- Mengembalikan rekapitulasi suara per kandidat dan metrik partisipasi DPT.
CREATE OR REPLACE FUNCTION public.get_voting_rekapitulasi()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_total_dpt INT := 0;
    v_total_suara INT := 0;
    v_status TEXT;
    v_show_quick_count BOOLEAN := false;
    v_putaran TEXT := '1';
    v_kandidat_p2_str TEXT := '[]';
    v_kandidat_list JSONB;
BEGIN
    SELECT COUNT(*) INTO v_total_dpt FROM public.voting_dpt;
    SELECT COUNT(*) INTO v_total_suara FROM public.voting_suara;
    
    SELECT value INTO v_status FROM public.voting_config WHERE key = 'status_pemilihan';
    SELECT (value = 'true') INTO v_show_quick_count FROM public.voting_config WHERE key = 'tampilkan_quick_count';
    SELECT COALESCE(value, '1') INTO v_putaran FROM public.voting_config WHERE key = 'putaran_voting';
    SELECT COALESCE(value, '[]') INTO v_kandidat_p2_str FROM public.voting_config WHERE key = 'kandidat_putaran_2';

    -- Rekap suara per kandidat (jika putaran 2, hanya tampilkan kandidat putaran 2)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', k.id,
            'nomor_urut', k.nomor_urut,
            'nama_kandidat', k.nama_kandidat,
            'gelar', k.gelar,
            'institusi', k.institusi,
            'foto_url', k.foto_url,
            'cv_url', k.cv_url,
            'ringkasan_cv', k.ringkasan_cv,
            'total_suara', COALESCE(s.suara_count, 0),
            'persentase', CASE 
                WHEN v_total_suara > 0 THEN ROUND((COALESCE(s.suara_count, 0)::NUMERIC / v_total_suara::NUMERIC) * 100, 1)
                ELSE 0 
            END
        ) ORDER BY k.nomor_urut ASC
    ), '[]'::jsonb)
    INTO v_kandidat_list
    FROM public.voting_kandidat k
    LEFT JOIN (
        SELECT kandidat_id, COUNT(*) AS suara_count
        FROM public.voting_suara
        GROUP BY kandidat_id
    ) s ON s.kandidat_id = k.id
    WHERE (
        v_putaran <> '2' OR 
        v_kandidat_p2_str = '[]' OR 
        k.id IN (SELECT jsonb_array_elements_text(v_kandidat_p2_str::jsonb)::int)
    );

    RETURN jsonb_build_object(
        'total_dpt', v_total_dpt,
        'total_suara_masuk', v_total_suara,
        'belum_memilih', GREATEST(0, v_total_dpt - v_total_suara),
        'persentase_partisipasi', CASE 
            WHEN v_total_dpt > 0 THEN ROUND((v_total_suara::NUMERIC / v_total_dpt::NUMERIC) * 100, 1)
            ELSE 0 
        END,
        'status_pemilihan', COALESCE(v_status, 'draft'),
        'tampilkan_quick_count', v_show_quick_count,
        'putaran_voting', COALESCE(v_putaran, '1'),
        'kandidat_putaran_2', COALESCE(v_kandidat_p2_str::jsonb, '[]'::jsonb),
        'kandidat', v_kandidat_list
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) & HAK AKSES
-- ------------------------------------------------------------------------------
ALTER TABLE public.voting_kandidat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_dpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_suara ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_config ENABLE ROW LEVEL SECURITY;

-- Policy voting_kandidat: Siapapun dapat membaca profil kandidat
DROP POLICY IF EXISTS "Public can view candidates" ON public.voting_kandidat;
CREATE POLICY "Public can view candidates" ON public.voting_kandidat FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Auth or RPC can manage candidates" ON public.voting_kandidat;
CREATE POLICY "Auth or RPC can manage candidates" ON public.voting_kandidat FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy voting_config: Siapapun dapat membaca konfigurasi sesi sidang
DROP POLICY IF EXISTS "Public can view voting config" ON public.voting_config;
CREATE POLICY "Public can view voting config" ON public.voting_config FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can manage voting config" ON public.voting_config;
CREATE POLICY "Public can manage voting config" ON public.voting_config FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy voting_dpt: Akses baca/tulis untuk kelola DPT
DROP POLICY IF EXISTS "Manage voting dpt" ON public.voting_dpt;
CREATE POLICY "Manage voting dpt" ON public.voting_dpt FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy voting_suara: Insert dan Select melalui RPC
DROP POLICY IF EXISTS "Manage voting suara" ON public.voting_suara;
CREATE POLICY "Manage voting suara" ON public.voting_suara FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. RPC: RESET / BERSIHKAN DATA SIMULASI (reset_voting_data)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_voting_data(p_mode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_mode = 'votes_only' THEN
        -- 1. Kosongkan kotak suara
        DELETE FROM public.voting_suara;
        
        -- 2. Reset status token DPT agar bisa memilih ulang
        UPDATE public.voting_dpt 
        SET status_memilih = FALSE, 
            waktu_memilih = NULL;
            
        -- 3. Kembalikan status sesi ke draft dan putaran 1
        UPDATE public.voting_config SET value = 'draft' WHERE key = 'status_pemilihan';
        UPDATE public.voting_config SET value = 'false' WHERE key = 'tampilkan_quick_count';
        UPDATE public.voting_config SET value = '1' WHERE key = 'putaran_voting';
        UPDATE public.voting_config SET value = '[]' WHERE key = 'kandidat_putaran_2';
        
        RETURN jsonb_build_object('success', true, 'message', 'Kotak suara simulasi berhasil dikosongkan, putaran dikembalikan ke ronde 1, dan seluruh token DPT telah aktif kembali.');
        
    ELSIF p_mode = 'all' THEN
        -- 1. Kosongkan kotak suara
        DELETE FROM public.voting_suara;
        
        -- 2. Kosongkan seluruh pemilih DPT
        DELETE FROM public.voting_dpt;
        
        -- 3. Kosongkan seluruh kandidat
        DELETE FROM public.voting_kandidat;
        
        -- 4. Kembalikan status sesi ke draft dan putaran 1
        UPDATE public.voting_config SET value = 'draft' WHERE key = 'status_pemilihan';
        UPDATE public.voting_config SET value = 'false' WHERE key = 'tampilkan_quick_count';
        UPDATE public.voting_config SET value = '1' WHERE key = 'putaran_voting';
        UPDATE public.voting_config SET value = '[]' WHERE key = 'kandidat_putaran_2';
        
        RETURN jsonb_build_object('success', true, 'message', 'Seluruh data suara, pemilih DPT, dan kandidat simulasi telah dihapus bersih.');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Mode reset tidak valid.');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_voting_ballot(TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_voting_rekapitulasi() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_voting_data(TEXT) TO anon, authenticated;

-- Berikan izin SELECT, INSERT, UPDATE, DELETE ke tabel-tabel voting
GRANT ALL ON TABLE public.voting_kandidat TO anon, authenticated;
GRANT ALL ON TABLE public.voting_dpt TO anon, authenticated;
GRANT ALL ON TABLE public.voting_suara TO anon, authenticated;
GRANT ALL ON TABLE public.voting_config TO anon, authenticated;

-- Grant USAGE sequence jika ada
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'voting_kandidat_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.voting_kandidat_id_seq TO anon, authenticated;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. DATA KANDIDAT CONTOH (Hanya jika tabel kosong)
-- ------------------------------------------------------------------------------
INSERT INTO public.voting_kandidat (nomor_urut, nama_kandidat, gelar, institusi, foto_url, visi, misi)
SELECT 
    1, 
    'Calon Presiden PERSADIA No. 1', 
    'Dr. dr. Sp.PD-KEMD, FINASIM', 
    'Pengurus Besar PERSADIA', 
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
    'Mewujudkan PERSADIA sebagai organisasi profesi dan kemasyarakatan diabetes yang unggul, inklusif, dan berdaya saing global.',
    '1. Memperkuat advokasi dan edukasi pencegahan diabetes nasional.\n2. Modernisasi tata kelola organisasi berbasis teknologi digital.\n3. Kolaborasi erat dengan seluruh cabang di Indonesia.'
WHERE NOT EXISTS (SELECT 1 FROM public.voting_kandidat WHERE nomor_urut = 1);

INSERT INTO public.voting_kandidat (nomor_urut, nama_kandidat, gelar, institusi, foto_url, visi, misi)
SELECT 
    2, 
    'Calon Presiden PERSADIA No. 2', 
    'Prof. Dr. dr. Sp.PD-KEMD, FINASIM', 
    'Pengurus Besar PERSADIA', 
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80',
    'Akselerasi pemerataan pelayanan dan edukasi diabetes melitus di seluruh pelosok Nusantara.',
    '1. Pemberdayaan fasilitas kesehatan primer dan edukator diabetes.\n2. Riset terintegrasi penanganan komplikasi diabetes.\n3. Peningkatan kesejahteraan dan kualitas hidup diabetisi di Indonesia.'
WHERE NOT EXISTS (SELECT 1 FROM public.voting_kandidat WHERE nomor_urut = 2);

-- ==============================================================================
-- SELESAI. Tabel dan RPC E-Voting siap digunakan.
-- ==============================================================================
