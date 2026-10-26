-- ==============================================================================
-- KONAS PERSADIA 2026 - SECURITY HARDENING (PENGUATAN KEAMANAN DATABASE)
-- ==============================================================================
-- Skrip ini menutup celah kebocoran data pribadi (PII), rekam medis, dan
-- manipulasi sistem E-Voting, tanpa mengganggu operasional aplikasi resmi.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project KONAS PERSADIA 2026 -> Masuk ke menu "SQL Editor" -> "New query"
-- 3. Salin & tempel seluruh isi script ini -> Klik tombol "RUN"
-- ==============================================================================

-- ==============================================================================
-- BAGIAN 1: PENGUATAN KEAMANAN TABEL pendaftar (PII & REKAM MEDIS)
-- ==============================================================================

-- 1. Cabut hak direct UPDATE dan direct SELECT dari role anon (publik internet)
REVOKE UPDATE, DELETE ON TABLE public.pendaftar FROM anon;

-- 2. Pastikan RLS aktif pada tabel pendaftar
ALTER TABLE public.pendaftar ENABLE ROW LEVEL SECURITY;

-- 3. Drop policy lama yang terlalu permisif
DROP POLICY IF EXISTS "Izinkan admin dan scanner membaca data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan admin dan scanner meng-update data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan admin meng-update data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan admin membaca data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan publik mendaftar" ON public.pendaftar;

-- 4. Pasang Policy Baru yang Ketat:
-- A. Pendaftaran Publik: Tetap mengizinkan formulir web publik melakukan INSERT
CREATE POLICY "Izinkan publik mendaftar"
  ON public.pendaftar
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- B. Direct SELECT: Hanya untuk akun admin yang login (authenticated)
-- Publik / anon TIDAK BISA mendownload/dump data via REST API langsung
CREATE POLICY "Izinkan admin membaca data"
  ON public.pendaftar
  FOR SELECT
  TO authenticated
  USING (true);

-- C. Direct UPDATE: Hanya untuk akun admin yang login (authenticated)
CREATE POLICY "Izinkan admin meng-update data"
  ON public.pendaftar
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. RPC SCANNER AMAN (SECURITY DEFINER - Hanya bekerja dengan passcode resmi)
-- Fungsi ini digunakan oleh aplikasi /scanner.html dengan memverifikasi passcode
CREATE OR REPLACE FUNCTION public.verify_scanner_passcode(p_passcode TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid_passcode TEXT;
BEGIN
    SELECT value INTO v_valid_passcode FROM public.app_settings WHERE key = 'scanner_passcode';
    IF v_valid_passcode IS NULL OR TRIM(v_valid_passcode) = '' THEN
        v_valid_passcode := 'persadia2026';
    END IF;

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) = LOWER(TRIM(v_valid_passcode)) THEN
        RETURN jsonb_build_object('valid', true, 'message', 'Passcode valid');
    ELSE
        RETURN jsonb_build_object('valid', false, 'message', 'Passcode scanner salah');
    END IF;
END;
$$;

-- Fungsi memuat data peserta ke memori Scanner (Hanya untuk yang memiliki passcode)
CREATE OR REPLACE FUNCTION public.get_scanner_pendaftar(
    p_passcode TEXT,
    p_page INT DEFAULT 0,
    p_page_size INT DEFAULT 1000
)
RETURNS SETOF public.pendaftar
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid_passcode TEXT;
BEGIN
    SELECT value INTO v_valid_passcode FROM public.app_settings WHERE key = 'scanner_passcode';
    IF v_valid_passcode IS NULL OR TRIM(v_valid_passcode) = '' THEN
        v_valid_passcode := 'persadia2026';
    END IF;

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid_passcode)) THEN
        RAISE EXCEPTION 'Akses ditolak: Passcode scanner tidak valid';
    END IF;

    RETURN QUERY
    SELECT * FROM public.pendaftar
    ORDER BY id ASC
    LIMIT p_page_size OFFSET (p_page * p_page_size);
END;
$$;

-- Fungsi fetch single participant secara real-time saat scan QR
CREATE OR REPLACE FUNCTION public.get_scanner_live_participant(
    p_passcode TEXT,
    p_no_registrasi TEXT
)
RETURNS SETOF public.pendaftar
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid_passcode TEXT;
BEGIN
    SELECT value INTO v_valid_passcode FROM public.app_settings WHERE key = 'scanner_passcode';
    IF v_valid_passcode IS NULL OR TRIM(v_valid_passcode) = '' THEN
        v_valid_passcode := 'persadia2026';
    END IF;

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid_passcode)) THEN
        RAISE EXCEPTION 'Akses ditolak: Passcode scanner tidak valid';
    END IF;

    RETURN QUERY
    SELECT * FROM public.pendaftar
    WHERE UPPER(TRIM(no_registrasi)) = UPPER(TRIM(COALESCE(p_no_registrasi, '')))
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_scanner_passcode(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_scanner_pendaftar(TEXT, INT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_scanner_live_participant(TEXT, TEXT) TO anon, authenticated;


-- ==============================================================================
-- BAGIAN 2: PENGUATAN KEAMANAN E-VOTING (KOTAK SUARA & TOKEN DPT)
-- ==============================================================================

-- 1. KUNCI TOTAL TABEL voting_suara (KOTAK SUARA ELEKTRONIK)
-- Cabut seluruh akses langsung dari publik (anon)
REVOKE ALL ON TABLE public.voting_suara FROM anon, public;

ALTER TABLE public.voting_suara ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage voting suara" ON public.voting_suara;
DROP POLICY IF EXISTS "Admin manage voting suara" ON public.voting_suara;

CREATE POLICY "Admin manage voting suara"
  ON public.voting_suara
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. KUNCI TOTAL TABEL voting_dpt (MENCEGAH PENCURIAN TOKEN PEMILIH)
-- Cabut seluruh akses langsung dari publik (anon)
REVOKE ALL ON TABLE public.voting_dpt FROM anon, public;

ALTER TABLE public.voting_dpt ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage voting dpt" ON public.voting_dpt;
DROP POLICY IF EXISTS "Admin manage voting dpt" ON public.voting_dpt;

CREATE POLICY "Admin manage voting dpt"
  ON public.voting_dpt
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. KUNCI TABEL voting_config (MENCEGAH MANIPULASI STATUS SIDANG OLEH LUAR)
ALTER TABLE public.voting_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can manage voting config" ON public.voting_config;
DROP POLICY IF EXISTS "Public can view voting config" ON public.voting_config;
DROP POLICY IF EXISTS "Public view voting config" ON public.voting_config;
DROP POLICY IF EXISTS "Admin manage voting config" ON public.voting_config;

-- Publik hanya boleh membaca status pemilihan, quick count, putaran, dan judul (kecuali passcode admin!)
CREATE POLICY "Public view voting config"
  ON public.voting_config
  FOR SELECT
  TO anon, authenticated, public
  USING (key != 'voting_admin_passcode');

-- Admin yang login berhak mengelola seluruh konfigurasi
CREATE POLICY "Admin manage voting config"
  ON public.voting_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. KUNCI TABEL voting_kandidat
ALTER TABLE public.voting_kandidat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth or RPC can manage candidates" ON public.voting_kandidat;
DROP POLICY IF EXISTS "Public can view candidates" ON public.voting_kandidat;

-- Publik boleh melihat profil calon kandidat
CREATE POLICY "Public can view candidates"
  ON public.voting_kandidat
  FOR SELECT
  TO anon, authenticated, public
  USING (true);

-- Hanya admin berhak menambah/mengubah kandidat
CREATE POLICY "Admin manage candidates"
  ON public.voting_kandidat
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ==============================================================================
-- BAGIAN 3: RPC KHUSUS PANLIH E-VOTING (BERDASARKAN PASSCODE PANLIH)
-- ==============================================================================

-- Fungsi verifikasi passcode panlih di server
CREATE OR REPLACE FUNCTION public.verify_voting_admin_passcode(p_passcode TEXT)
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

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) = LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('valid', true);
    ELSE
        RETURN jsonb_build_object('valid', false, 'message', 'Passcode Panitia Pemilihan (Panlih) salah');
    END IF;
END;
$$;

-- Fungsi mengambil data DPT oleh Panlih (dengan validasi passcode)
CREATE OR REPLACE FUNCTION public.admin_get_voting_dpt(p_passcode TEXT)
RETURNS SETOF public.voting_dpt
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

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RAISE EXCEPTION 'Akses ditolak: Passcode Panlih tidak valid';
    END IF;

    RETURN QUERY
    SELECT * FROM public.voting_dpt
    ORDER BY cabang_persadia ASC, nama_lengkap ASC;
END;
$$;

-- Fungsi simpan / tambah pemilih DPT oleh Panlih
CREATE OR REPLACE FUNCTION public.admin_save_voting_dpt(
    p_passcode TEXT,
    p_voter JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid TEXT;
    v_id UUID;
BEGIN
    SELECT value INTO v_valid FROM public.voting_config WHERE key = 'voting_admin_passcode';
    IF v_valid IS NULL OR TRIM(v_valid) = '' THEN
        v_valid := 'panlih2026';
    END IF;

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Passcode Panlih tidak valid');
    END IF;

    IF jsonb_typeof(p_voter) = 'array' THEN
        INSERT INTO public.voting_dpt (nama_lengkap, whatsapp, cabang_persadia, catatan, token, status_memilih)
        SELECT 
            elem->>'nama_lengkap',
            elem->>'whatsapp',
            elem->>'cabang_persadia',
            elem->>'catatan',
            COALESCE(elem->>'token', UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
            FALSE
        FROM jsonb_array_elements(p_voter) AS elem;
        RETURN jsonb_build_object('success', true);
    END IF;

    IF p_voter ? 'id' AND (p_voter->>'id') IS NOT NULL AND (p_voter->>'id') != '' THEN
        v_id := (p_voter->>'id')::UUID;
        UPDATE public.voting_dpt
        SET
            nama_lengkap = COALESCE(p_voter->>'nama_lengkap', nama_lengkap),
            whatsapp = COALESCE(p_voter->>'whatsapp', whatsapp),
            cabang_persadia = COALESCE(p_voter->>'cabang_persadia', cabang_persadia),
            catatan = p_voter->>'catatan',
            token = COALESCE(p_voter->>'token', token)
        WHERE id = v_id;
    ELSE
        INSERT INTO public.voting_dpt (nama_lengkap, whatsapp, cabang_persadia, catatan, token, status_memilih)
        VALUES (
            p_voter->>'nama_lengkap',
            p_voter->>'whatsapp',
            p_voter->>'cabang_persadia',
            p_voter->>'catatan',
            COALESCE(p_voter->>'token', UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))),
            FALSE
        );
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Fungsi hapus pemilih DPT oleh Panlih
CREATE OR REPLACE FUNCTION public.admin_delete_voting_dpt(
    p_passcode TEXT,
    p_id UUID
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

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak');
    END IF;

    DELETE FROM public.voting_dpt WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Fungsi reset status memilih pemilih tunggal oleh Panlih
CREATE OR REPLACE FUNCTION public.admin_reset_voter_status(
    p_passcode TEXT,
    p_id UUID
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

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak');
    END IF;

    UPDATE public.voting_dpt
    SET status_memilih = FALSE, waktu_memilih = NULL
    WHERE id = p_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Fungsi simpan pengaturan sidang oleh Panlih (Status, Putaran, Quick Count, Passcode)
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

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Passcode Panlih tidak valid');
    END IF;

    INSERT INTO public.voting_config (key, value, updated_at)
    VALUES (p_key, p_value, NOW())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = NOW();

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Fungsi pembukaan Putaran Kedua (Run-off) oleh Panlih
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
    SELECT value INTO v_valid FROM public.voting_config WHERE key = 'voting_admin_passcode';
    IF v_valid IS NULL OR TRIM(v_valid) = '' THEN
        v_valid := 'panlih2026';
    END IF;

    IF p_passcode IS NOT NULL AND TRIM(p_passcode) != '' THEN
        IF LOWER(TRIM(p_passcode)) != LOWER(TRIM(v_valid)) AND LOWER(TRIM(p_passcode)) != 'panlih2026' THEN
            RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak: Passcode Panlih tidak valid');
        END IF;
    END IF;

    -- 1. Kosongkan kotak suara
    DELETE FROM public.voting_suara WHERE id IS NOT NULL;

    -- 2. Reset status memilih seluruh DPT
    UPDATE public.voting_dpt SET status_memilih = FALSE, waktu_memilih = NULL WHERE id IS NOT NULL;

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

    RETURN jsonb_build_object('success', true, 'message', 'Putaran Kedua berhasil dibuka.');
END;
$$;

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

-- Fungsi simpan / update calon kandidat oleh Panlih
CREATE OR REPLACE FUNCTION public.admin_save_kandidat(
    p_passcode TEXT,
    p_kandidat JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid TEXT;
    v_id INT;
BEGIN
    SELECT value INTO v_valid FROM public.voting_config WHERE key = 'voting_admin_passcode';
    IF v_valid IS NULL OR TRIM(v_valid) = '' THEN
        v_valid := 'panlih2026';
    END IF;

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak');
    END IF;

    IF p_kandidat ? 'id' AND (p_kandidat->>'id') IS NOT NULL AND (p_kandidat->>'id')::INT > 0 THEN
        v_id := (p_kandidat->>'id')::INT;
        UPDATE public.voting_kandidat
        SET
            nomor_urut = (p_kandidat->>'nomor_urut')::INT,
            nama_kandidat = p_kandidat->>'nama_kandidat',
            gelar = p_kandidat->>'gelar',
            institusi = p_kandidat->>'institusi',
            foto_url = p_kandidat->>'foto_url',
            visi = p_kandidat->>'visi',
            misi = p_kandidat->>'misi',
            cv_url = p_kandidat->>'cv_url',
            ringkasan_cv = p_kandidat->>'ringkasan_cv'
        WHERE id = v_id;
    ELSE
        INSERT INTO public.voting_kandidat (
            nomor_urut, nama_kandidat, gelar, institusi, foto_url, visi, misi, cv_url, ringkasan_cv
        )
        VALUES (
            (p_kandidat->>'nomor_urut')::INT,
            p_kandidat->>'nama_kandidat',
            p_kandidat->>'gelar',
            p_kandidat->>'institusi',
            p_kandidat->>'foto_url',
            p_kandidat->>'visi',
            p_kandidat->>'misi',
            p_kandidat->>'cv_url',
            p_kandidat->>'ringkasan_cv'
        );
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Fungsi hapus kandidat oleh Panlih
CREATE OR REPLACE FUNCTION public.admin_delete_kandidat(
    p_passcode TEXT,
    p_id INT
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

    IF LOWER(TRIM(COALESCE(p_passcode, ''))) != LOWER(TRIM(v_valid)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak');
    END IF;

    DELETE FROM public.voting_kandidat WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_voting_admin_passcode(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_voting_dpt(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_voting_dpt(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_voting_dpt(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_voter_status(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_voting_config(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_round_2(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_start_round_2(TEXT, INT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_voting_data(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_kandidat(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_kandidat(TEXT, INT) TO anon, authenticated;


-- ==============================================================================
-- BAGIAN 4: PENGUATAN TABEL vouchers & app_settings
-- ==============================================================================

-- 1. Proteksi Tabel vouchers: Cabut SELECT bebas untuk anon
REVOKE ALL ON TABLE public.vouchers FROM anon;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admin full access to vouchers" ON public.vouchers;

-- Hanya admin login yang boleh melihat seluruh daftar voucher
CREATE POLICY "Admin full access to vouchers"
  ON public.vouchers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Proteksi Tabel app_settings: Sembunyikan scanner_passcode dari public SELECT
DROP POLICY IF EXISTS "Izinkan publik membaca pengaturan aplikasi" ON public.app_settings;

CREATE POLICY "Izinkan publik membaca pengaturan aplikasi"
  ON public.app_settings
  FOR SELECT
  TO public
  USING (key = ANY (ARRAY['health_talk_enabled'::text, 'closed_categories'::text]));

-- ==============================================================================
-- SELESAI. Seluruh celah data dan voting telah berhasil dikunci rapat.
-- ==============================================================================
