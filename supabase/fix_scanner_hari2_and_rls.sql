-- ==============================================================================
-- KONAS PERSADIA 2026 - FIX SCANNER HARI 2, PEMISAHAN CHECKPOINT & PERMISSION RLS
-- ==============================================================================
-- Skrip ini menyelesaikan 2 hal krusial pada aplikasi Scanner:
-- 1. Menambahkan kolom Registrasi Onsite khusus Hari ke-2 (Pesta Rakyat GOR Pakansari)
--    sehingga kehadiran di Hari ke-1 (Novotel) tidak otomatis menganggap peserta
--    sudah registrasi di Hari ke-2.
-- 2. Memperbaiki izin PostgreSQL & RLS (Row Level Security) agar petugas scanner
--    (role anon) tidak lagi mengalami error "permission denied for table pendaftar"
--    melalui hak akses tabel langsung DAN fungsi RPC berstatus SECURITY DEFINER.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project KONAS PERSADIA 2026 -> Masuk menu "SQL Editor" -> Klik "New query"
-- 3. Salin & tempel seluruh isi script ini -> Klik tombol "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PENAMBAHAN KOLOM REGISTRASI ONSITE HARI KE-2 PADA TABEL public.pendaftar
-- ------------------------------------------------------------------------------
ALTER TABLE public.pendaftar 
    ADD COLUMN IF NOT EXISTS registrasi_onsite_hari_2 TEXT,
    ADD COLUMN IF NOT EXISTS waktu_registrasi_onsite_hari_2 TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS waktu_makan_siang_hari_1 TIMESTAMPTZ;

COMMENT ON COLUMN public.pendaftar.registrasi_onsite_hari_2 IS 'Status presensi registrasi fisik di pintu masuk Stadion Pakansari Hari ke-2 ("Ya" atau NULL)';
COMMENT ON COLUMN public.pendaftar.waktu_registrasi_onsite_hari_2 IS 'Waktu timestamp presensi registrasi fisik Hari ke-2';
COMMENT ON COLUMN public.pendaftar.waktu_makan_siang_hari_1 IS 'Waktu timestamp pengambilan konsumsi/makan siang Hari ke-1 (Novotel)';

CREATE INDEX IF NOT EXISTS idx_pendaftar_reg_onsite_h2 ON public.pendaftar (registrasi_onsite_hari_2);

-- ------------------------------------------------------------------------------
-- 2. GRANT PERMISSION POSTGRESQL PADA TABEL pendaftar
-- ------------------------------------------------------------------------------
-- Penting: PostgreSQL memblokir UPDATE sebelum RLS dievaluasi jika role 'anon'
-- belum diberikan hak UPDATE pada tingkat tabel.
GRANT SELECT, UPDATE ON TABLE public.pendaftar TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. PERBAHARUI RLS POLICY UNTUK UPDATE CHECKPOINT & DATA PENDAFTAR
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Izinkan admin meng-update data" ON public.pendaftar;
DROP POLICY IF EXISTS "Izinkan admin dan scanner meng-update data" ON public.pendaftar;

CREATE POLICY "Izinkan admin dan scanner meng-update data"
  ON public.pendaftar
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. RPC STORED PROCEDURE: update_pendaftar_scanner (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
-- Fungsi atomik ini dieksekusi dengan hak istimewa database owner (postgres),
-- sehingga 100% KEBAL terhadap batasan RLS dan error 'permission denied'.
-- Fungsi ini menangani seluruh pembaruan dari scanner lapangan.
CREATE OR REPLACE FUNCTION public.update_pendaftar_scanner(
    p_no_registrasi TEXT,
    p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_reg TEXT;
    v_count INT;
BEGIN
    v_clean_reg := UPPER(TRIM(COALESCE(p_no_registrasi, '')));
    IF v_clean_reg = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nomor registrasi tidak boleh kosong');
    END IF;

    UPDATE public.pendaftar
    SET
        -- Pos Registrasi Onsite Hari 1 (Novotel)
        registrasi_onsite = CASE 
            WHEN p_updates ? 'registrasi_onsite' THEN (p_updates->>'registrasi_onsite') 
            ELSE registrasi_onsite 
        END,
        waktu_registrasi_onsite = CASE 
            WHEN p_updates ? 'waktu_registrasi_onsite' THEN 
                CASE WHEN (p_updates->>'waktu_registrasi_onsite') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_registrasi_onsite')::TIMESTAMPTZ 
                END
            ELSE waktu_registrasi_onsite 
        END,

        -- Pos Registrasi Onsite Hari 2 (GOR Pakansari)
        registrasi_onsite_hari_2 = CASE 
            WHEN p_updates ? 'registrasi_onsite_hari_2' THEN (p_updates->>'registrasi_onsite_hari_2') 
            ELSE registrasi_onsite_hari_2 
        END,
        waktu_registrasi_onsite_hari_2 = CASE 
            WHEN p_updates ? 'waktu_registrasi_onsite_hari_2' THEN 
                CASE WHEN (p_updates->>'waktu_registrasi_onsite_hari_2') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_registrasi_onsite_hari_2')::TIMESTAMPTZ 
                END
            ELSE waktu_registrasi_onsite_hari_2 
        END,

        -- Pos Akses Gala Dinner (Hari 1)
        akses_gala_dinner = CASE 
            WHEN p_updates ? 'akses_gala_dinner' THEN (p_updates->>'akses_gala_dinner') 
            ELSE akses_gala_dinner 
        END,
        waktu_akses_gala_dinner = CASE 
            WHEN p_updates ? 'waktu_akses_gala_dinner' THEN 
                CASE WHEN (p_updates->>'waktu_akses_gala_dinner') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_akses_gala_dinner')::TIMESTAMPTZ 
                END
            ELSE waktu_akses_gala_dinner 
        END,
        kehadiran_gala_dinner = CASE 
            WHEN p_updates ? 'kehadiran_gala_dinner' THEN (p_updates->>'kehadiran_gala_dinner') 
            ELSE kehadiran_gala_dinner 
        END,
        waktu_kehadiran_gala_dinner = CASE 
            WHEN p_updates ? 'waktu_kehadiran_gala_dinner' THEN 
                CASE WHEN (p_updates->>'waktu_kehadiran_gala_dinner') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_kehadiran_gala_dinner')::TIMESTAMPTZ 
                END
            ELSE waktu_kehadiran_gala_dinner 
        END,

        -- Pos Presensi Workshop (Hari 1)
        kehadiran_workshop = CASE 
            WHEN p_updates ? 'kehadiran_workshop' THEN (p_updates->>'kehadiran_workshop') 
            ELSE kehadiran_workshop 
        END,
        waktu_kehadiran_workshop = CASE 
            WHEN p_updates ? 'waktu_kehadiran_workshop' THEN (p_updates->>'waktu_kehadiran_workshop')
            ELSE waktu_kehadiran_workshop 
        END,

        -- Pos Pengambilan Snack (Hari 2)
        pengambilan_snack = CASE 
            WHEN p_updates ? 'pengambilan_snack' THEN (p_updates->>'pengambilan_snack') 
            ELSE pengambilan_snack 
        END,
        waktu_pengambilan_snack = CASE 
            WHEN p_updates ? 'waktu_pengambilan_snack' THEN 
                CASE WHEN (p_updates->>'waktu_pengambilan_snack') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_pengambilan_snack')::TIMESTAMPTZ 
                END
            ELSE waktu_pengambilan_snack 
        END,

        -- Pos Pengambilan Kaos / Baju (Hari 2)
        pengambilan_baju = CASE 
            WHEN p_updates ? 'pengambilan_baju' THEN (p_updates->>'pengambilan_baju') 
            ELSE pengambilan_baju 
        END,
        waktu_pengambilan_baju = CASE 
            WHEN p_updates ? 'waktu_pengambilan_baju' THEN 
                CASE WHEN (p_updates->>'waktu_pengambilan_baju') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_pengambilan_baju')::TIMESTAMPTZ 
                END
            ELSE waktu_pengambilan_baju 
        END,
        pengambilan_merchandise = CASE 
            WHEN p_updates ? 'pengambilan_merchandise' THEN (p_updates->>'pengambilan_merchandise') 
            ELSE pengambilan_merchandise 
        END,

        -- Pos Konsumsi / Makan Siang Hari 1 & Hari 2
        makan_siang_hari_1 = CASE 
            WHEN p_updates ? 'makan_siang_hari_1' THEN (p_updates->>'makan_siang_hari_1') 
            ELSE makan_siang_hari_1 
        END,
        waktu_makan_siang_hari_1 = CASE 
            WHEN p_updates ? 'waktu_makan_siang_hari_1' THEN 
                CASE WHEN (p_updates->>'waktu_makan_siang_hari_1') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_makan_siang_hari_1')::TIMESTAMPTZ 
                END
            ELSE waktu_makan_siang_hari_1 
        END,
        makan_siang_pesta_rakyat = CASE 
            WHEN p_updates ? 'makan_siang_pesta_rakyat' THEN (p_updates->>'makan_siang_pesta_rakyat') 
            ELSE makan_siang_pesta_rakyat 
        END,
        waktu_makan_siang_pesta_rakyat = CASE 
            WHEN p_updates ? 'waktu_makan_siang_pesta_rakyat' THEN 
                CASE WHEN (p_updates->>'waktu_makan_siang_pesta_rakyat') IS NULL THEN NULL 
                     ELSE (p_updates->>'waktu_makan_siang_pesta_rakyat')::TIMESTAMPTZ 
                END
            ELSE waktu_makan_siang_pesta_rakyat 
        END,

        -- Pos Skrining Kesehatan & Cek Gula Darah (Hari 2)
        tinggi_badan = CASE 
            WHEN p_updates ? 'tinggi_badan' AND (p_updates->>'tinggi_badan') IS NOT NULL AND (p_updates->>'tinggi_badan') != '' 
            THEN (p_updates->>'tinggi_badan')::NUMERIC 
            ELSE tinggi_badan 
        END,
        berat_badan = CASE 
            WHEN p_updates ? 'berat_badan' AND (p_updates->>'berat_badan') IS NOT NULL AND (p_updates->>'berat_badan') != '' 
            THEN (p_updates->>'berat_badan')::NUMERIC 
            ELSE berat_badan 
        END,
        tensi = CASE 
            WHEN p_updates ? 'tensi' THEN (p_updates->>'tensi') 
            ELSE tensi 
        END,
        gula_darah = CASE 
            WHEN p_updates ? 'gula_darah' THEN (p_updates->>'gula_darah') 
            ELSE gula_darah 
        END,
        lingkar_perut = CASE 
            WHEN p_updates ? 'lingkar_perut' THEN (p_updates->>'lingkar_perut') 
            ELSE lingkar_perut 
        END,
        kesediaan_data = CASE 
            WHEN p_updates ? 'kesediaan_data' THEN (p_updates->>'kesediaan_data') 
            ELSE kesediaan_data 
        END,
        gejala_neuropati = CASE 
            WHEN p_updates ? 'gejala_neuropati' THEN (p_updates->>'gejala_neuropati') 
            ELSE gejala_neuropati 
        END,
        cek_gula_darah = CASE 
            WHEN p_updates ? 'cek_gula_darah' THEN (p_updates->>'cek_gula_darah') 
            ELSE cek_gula_darah 
        END,

        -- Perbaikan Data Identitas Peserta
        nama_lengkap = CASE 
            WHEN p_updates ? 'nama_lengkap' AND (p_updates->>'nama_lengkap') IS NOT NULL AND TRIM(p_updates->>'nama_lengkap') != '' 
            THEN TRIM(p_updates->>'nama_lengkap') 
            ELSE nama_lengkap 
        END,
        jenis_kelamin = CASE 
            WHEN p_updates ? 'jenis_kelamin' THEN (p_updates->>'jenis_kelamin') 
            ELSE jenis_kelamin 
        END,
        tanggal_lahir = CASE 
            WHEN p_updates ? 'tanggal_lahir' THEN (p_updates->>'tanggal_lahir') 
            ELSE tanggal_lahir 
        END,
        nik = CASE 
            WHEN p_updates ? 'nik' THEN (p_updates->>'nik') 
            ELSE nik 
        END
    WHERE UPPER(TRIM(no_registrasi)) = v_clean_reg;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Nomor registrasi peserta tidak ditemukan dalam database');
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Data checkpoint berhasil diperbarui');
END;
$$;

-- Berikan izin pemanggilan RPC kepada public/anon dan authenticated
GRANT EXECUTE ON FUNCTION public.update_pendaftar_scanner(TEXT, JSONB) TO anon, authenticated;

-- ==============================================================================
-- SELESAI. Skrip berhasil dieksekusi.
-- ==============================================================================
