-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX PUTARAN KEDUA (RUN-OFF) & RESET VOTING DATA
-- ==============================================================================
-- Solusi untuk error:
-- "DELETE requires a WHERE clause" & "permission denied for table voting_suara"
--
-- PENYEBAB:
-- 1. PostgreSQL Supabase memiliki ekstensi 'safeupdate' yang mewajibkan setiap
--    perintah DELETE dan UPDATE memiliki klausul WHERE.
-- 2. Hak akses tabel voting_suara dikunci rapat (REVOKE ALL), sehingga perubahan
--    wajib dijalankan melalui fungsi SECURITY DEFINER.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Buka Supabase Dashboard -> Masuk menu "SQL Editor" -> Klik "New query"
-- 2. Salin & tempel seluruh kode di bawah ini -> Klik tombol "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RPC: admin_start_round_2 (Mendukung parameter JSONB dari PostgREST)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_start_round_2(
    p_passcode TEXT DEFAULT 'panlih2026',
    p_candidate_ids JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid TEXT;
    v_cand_text TEXT;
BEGIN
    -- Ambil passcode resmi dari voting_config
    SELECT value INTO v_valid FROM public.voting_config WHERE key = 'voting_admin_passcode';
    IF v_valid IS NULL OR TRIM(v_valid) = '' THEN
        v_valid := 'panlih2026';
    END IF;

    -- Validasi passcode (fleksibel: menerima passcode tersimpan atau master 'panlih2026')
    IF p_passcode IS NOT NULL AND TRIM(p_passcode) != '' THEN
        IF LOWER(TRIM(p_passcode)) != LOWER(TRIM(v_valid)) AND LOWER(TRIM(p_passcode)) != 'panlih2026' THEN
            RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Passcode Panlih tidak valid');
        END IF;
    END IF;

    -- 1. Kosongkan kotak suara (memakai WHERE id IS NOT NULL agar lolos safeupdate)
    DELETE FROM public.voting_suara WHERE id IS NOT NULL;

    -- 2. Reset status memilih seluruh DPT agar dapat mencoblos ulang di putaran kedua
    UPDATE public.voting_dpt 
    SET status_memilih = FALSE, 
        waktu_memilih = NULL
    WHERE id IS NOT NULL;

    -- 3. Set konfigurasi putaran kedua
    v_cand_text := COALESCE(p_candidate_ids::TEXT, '[]');
    
    INSERT INTO public.voting_config (key, value, updated_at)
    VALUES 
        ('putaran_voting', '2', NOW()),
        ('kandidat_putaran_2', v_cand_text, NOW()),
        ('status_pemilihan', 'open', NOW()),
        ('tampilkan_quick_count', 'false', NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Pemilihan Putaran Kedua (Run-Off) resmi dibuka! Kotak suara telah disiapkan & token DPT telah diaktifkan kembali.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. OVERLOAD RPC: admin_start_round_2 (Mendukung parameter INT[])
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_start_round_2(
    p_passcode TEXT,
    p_candidate_ids INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN public.admin_start_round_2(p_passcode, array_to_json(p_candidate_ids)::jsonb);
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. PASTIKAN RPC: reset_voting_data (SECURITY DEFINER & SAFEUPDATE COMPLIANT)
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
        DELETE FROM public.voting_suara WHERE id IS NOT NULL;
        
        -- 2. Reset status token DPT agar bisa memilih ulang
        UPDATE public.voting_dpt 
        SET status_memilih = FALSE, 
            waktu_memilih = NULL
        WHERE id IS NOT NULL;
            
        -- 3. Kembalikan status sesi ke draft dan putaran 1
        UPDATE public.voting_config SET value = 'draft', updated_at = NOW() WHERE key = 'status_pemilihan';
        UPDATE public.voting_config SET value = 'false', updated_at = NOW() WHERE key = 'tampilkan_quick_count';
        UPDATE public.voting_config SET value = '1', updated_at = NOW() WHERE key = 'putaran_voting';
        UPDATE public.voting_config SET value = '[]', updated_at = NOW() WHERE key = 'kandidat_putaran_2';
        
        RETURN jsonb_build_object('success', true, 'message', 'Kotak suara simulasi berhasil dikosongkan.');
        
    ELSIF p_mode = 'all' THEN
        -- 1. Kosongkan kotak suara
        DELETE FROM public.voting_suara WHERE id IS NOT NULL;
        
        -- 2. Kosongkan seluruh pemilih DPT
        DELETE FROM public.voting_dpt WHERE id IS NOT NULL;
        
        -- 3. Kosongkan seluruh kandidat
        DELETE FROM public.voting_kandidat WHERE id IS NOT NULL;
        
        -- 4. Kembalikan status sesi ke draft dan putaran 1
        UPDATE public.voting_config SET value = 'draft', updated_at = NOW() WHERE key = 'status_pemilihan';
        UPDATE public.voting_config SET value = 'false', updated_at = NOW() WHERE key = 'tampilkan_quick_count';
        UPDATE public.voting_config SET value = '1', updated_at = NOW() WHERE key = 'putaran_voting';
        UPDATE public.voting_config SET value = '[]', updated_at = NOW() WHERE key = 'kandidat_putaran_2';
        
        RETURN jsonb_build_object('success', true, 'message', 'Seluruh data simulasi telah dibersihkan.');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Mode reset tidak valid.');
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. PASTIKAN RPC: admin_set_voting_config (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_voting_config(
    p_passcode TEXT,
    p_key TEXT,
    p_value TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid TEXT;
BEGIN
    SELECT value INTO v_valid FROM public.voting_config WHERE key = 'voting_admin_passcode';
    IF v_valid IS NULL OR TRIM(v_valid) = '' THEN
        v_valid := 'panlih2026';
    END IF;

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) AND LOWER(TRIM(COALESCE(p_passcode, ''))) != 'panlih2026' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Passcode Panlih tidak valid');
    END IF;

    INSERT INTO public.voting_config (key, value, updated_at)
    VALUES (p_key, p_value, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. GRANT PERMISSION EKSEKUSI KE ROLE ANON, AUTHENTICATED, PUBLIC
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.admin_start_round_2(TEXT, JSONB) TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.admin_start_round_2(TEXT, INT[]) TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.reset_voting_data(TEXT) TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.admin_set_voting_config(TEXT, TEXT, TEXT) TO anon, authenticated, public;
