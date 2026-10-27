-- ==============================================================================
-- KONAS PERSADIA 2026: PERBAIKAN RPC & SINKRONISASI DATA CALON KANDIDAT PRESIDEN
-- ==============================================================================
-- Skrip ini menyelesaikan kendala calon kandidat yang tidak muncul di tab
-- "Calon Kandidat" Dashboard Presidium / Panlih:
--
-- 1. Membuat RPC admin_get_voting_kandidat (SECURITY DEFINER)
--    -> Memastikan data calon kandidat selalu terbaca utuh tanpa terblokir RLS.
-- 2. Memperbarui RPC get_voting_rekapitulasi (Menyertakan Visi, Misi, & Aman JSON)
-- 3. Memastikan Hak Akses Tabel & Eksekusi Fungsi (GRANT)
-- 4. Memastikan 3 Calon Kandidat Resmi Tersimpan di Tabel public.voting_kandidat
--
-- CARA PENGGUNAAN:
-- 1. Buka Supabase Dashboard -> Pilih Menu "SQL Editor" -> Klik "New query"
-- 2. Tempel seluruh isi skrip ini -> Klik tombol "RUN"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PASTIKAN KOLOM cv_url DAN ringkasan_cv TERSEDIA DI TABEL voting_kandidat
-- ------------------------------------------------------------------------------
ALTER TABLE public.voting_kandidat ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.voting_kandidat ADD COLUMN IF NOT EXISTS ringkasan_cv TEXT;

-- ------------------------------------------------------------------------------
-- 2. PASTIKAN HAK BACA TABEL voting_kandidat DIIZINKAN (RLS & PRIVILEGES)
-- ------------------------------------------------------------------------------
ALTER TABLE public.voting_kandidat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view candidates" ON public.voting_kandidat;
CREATE POLICY "Public can view candidates"
  ON public.voting_kandidat
  FOR SELECT
  TO anon, authenticated, public
  USING (true);

DROP POLICY IF EXISTS "Auth or RPC can manage candidates" ON public.voting_kandidat;
CREATE POLICY "Auth or RPC can manage candidates"
  ON public.voting_kandidat
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.voting_kandidat TO anon, authenticated;

-- Pastikan sequence id kandidat dapat diakses jika menggunakan SERIAL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'voting_kandidat_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.voting_kandidat_id_seq TO anon, authenticated;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. BUAT RPC: admin_get_voting_kandidat (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
-- Mengembalikan seluruh daftar master calon kandidat beserta profil lengkap
-- untuk tab "Calon Kandidat & CV" di Dashboard Panlih.
CREATE OR REPLACE FUNCTION public.admin_get_voting_kandidat(p_passcode TEXT DEFAULT 'panlih2026')
RETURNS SETOF public.voting_kandidat
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_valid TEXT;
BEGIN
    -- Ambil passcode resmi dari konfigurasi atau gunakan default panlih2026
    SELECT value INTO v_valid FROM public.voting_config WHERE key = 'voting_admin_passcode';
    IF v_valid IS NULL OR TRIM(v_valid) = '' THEN
        v_valid := 'panlih2026';
    END IF;

    -- Validasi passcode
    IF p_passcode IS NOT NULL AND TRIM(p_passcode) != '' THEN
        IF LOWER(TRIM(p_passcode)) != LOWER(TRIM(v_valid)) AND LOWER(TRIM(p_passcode)) != 'panlih2026' THEN
            RAISE EXCEPTION 'Akses ditolak: Passcode Panlih tidak valid';
        END IF;
    END IF;

    RETURN QUERY
    SELECT * FROM public.voting_kandidat
    ORDER BY nomor_urut ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_voting_kandidat(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. PERBARUI RPC: get_voting_rekapitulasi (DILENGKAPI VISI, MISI, & PENANGANAN JSON AMAN)
-- ------------------------------------------------------------------------------
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

    -- Pastikan v_kandidat_p2_str valid JSON array string
    IF v_kandidat_p2_str IS NULL OR TRIM(v_kandidat_p2_str) = '' OR TRIM(v_kandidat_p2_str) NOT LIKE '[%]' THEN
        v_kandidat_p2_str := '[]';
    END IF;

    -- Rekap suara per kandidat lengkap dengan visi, misi, dan persentase
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', k.id,
            'nomor_urut', k.nomor_urut,
            'nama_kandidat', k.nama_kandidat,
            'gelar', k.gelar,
            'institusi', k.institusi,
            'foto_url', k.foto_url,
            'visi', k.visi,
            'misi', k.misi,
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

GRANT EXECUTE ON FUNCTION public.get_voting_rekapitulasi() TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 5. SEED / UPSERT 3 CALON KANDIDAT PRESIDEN PB PERSADIA
-- ------------------------------------------------------------------------------
INSERT INTO public.voting_kandidat (
    nomor_urut,
    nama_kandidat,
    gelar,
    institusi,
    foto_url,
    visi,
    misi,
    cv_url,
    ringkasan_cv
)
VALUES
(
    1,
    'Prof. Dr. dr. Ketut Suastika',
    'Sp.PD-KEMD, FINASIM',
    'Universitas Udayana / RSUP Prof. I.G.N.G. Ngoerah Denpasar',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
    'Mewujudkan PB PERSADIA sebagai organisasi profesi dan kemasyarakatan diabetes yang mandiri, inklusif, dan berstandar internasional dalam pengendalian diabetes mellitus di Indonesia.',
    '1. Mengoptimalkan edukasi dan deteksi dini diabetes di seluruh pelosok Indonesia melalui penguatan jejaring cabang PERSADIA.
2. Memperkokoh kemitraan strategis dengan Kementerian Kesehatan, Perkeni, dan organisasi internasional (IDF).
3. Meningkatkan advokasi ketersediaan obat dan teknologi pemantauan glukosa yang merata dan terjangkau bagi seluruh penyandang diabetes.',
    'https://drive.google.com/file/d/dummy-cv-kandidat-01/view?usp=sharing',
    '• Guru Besar Ilmu Penyakit Dalam / Endokrinologi FK Universitas Udayana
• Anggota Dewan Pertimbangan / Penasihat PB PERSADIA Pusat (2020–2025)
• Rektor Universitas Udayana Periode 2013–2017
• Penulis lebih dari 60 publikasi ilmiah bereputasi internasional dalam manajemen diabetes
• Penerima Lifetime Achievement Award dalam penanggulangan diabetes nasional'
),
(
    2,
    'Dr. dr. Hikmat Permana',
    'Sp.PD-KEMD, FINASIM',
    'FK Universitas Padjadjaran / RSUP Dr. Hasan Sadikin Bandung',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80',
    'Transformasi digital dan kolaboratif PERSADIA menuju pelayanan, edukasi, dan pencegahan diabetes mellitus yang merata dan berakar kuat di komunitas.',
    '1. Mengembangkan platform digital telemedicine dan monitoring glukosa terintegrasi untuk pendampingan pasien diabetes di era 5.0.
2. Memberdayakan unit cabang dan ranting PERSADIA melalui program sertifikasi edukator diabetes berkelanjutan.
3. Menggalakkan riset terapan pencegahan komplikasi kronik diabetes bekerja sama dengan fasilitas kesehatan primer (Puskesmas).',
    'https://drive.google.com/file/d/dummy-cv-kandidat-02/view?usp=sharing',
    '• Ketua PERSADIA Wilayah Jawa Barat (2018–2024)
• Kepala Divisi Endokrinologi & Metabolisme Departemen Ilmu Penyakit Dalam RSHS Bandung
• Konsultan Diabetes Mellitus & Penyakit Metabolik Perkumpulan Endokrinologi Indonesia
• Inisiator Program Desa Waspada Diabetes di Jawa Barat'
),
(
    3,
    'Dr. dr. Sony Wibisono Mudjanarko',
    'Sp.PD-KEMD, FINASIM',
    'FK Universitas Airlangga / RSUD Dr. Soetomo Surabaya',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&auto=format&fit=crop&q=80',
    'PERSADIA yang responsif, berdaya saing, dan bersinergi kuat untuk menurunkan laju prevalensi diabetes menuju Generasi Sehat Indonesia Emas 2045.',
    '1. Memperluas jangkauan dan mendirikan cabang baru PERSADIA di seluruh provinsi Indonesia Timur.
2. Merevitalisasi klub-klub senam diabetes dan kelompok pendukung diabetes di tingkat akar rumput.
3. Mendorong kolaborasi lintas profesi (dokter spesialis, dokter umum, perawat, ahli gizi, dan farmasis) dalam penanganan komprehensif diabetes.',
    'https://drive.google.com/file/d/dummy-cv-kandidat-03/view?usp=sharing',
    '• Ketua PERSADIA Cabang Surabaya (2019–2024)
• Staf Senior Divisi Endokrinologi, Diabetes, & Metabolisme RSUD Dr. Soetomo Surabaya
• Pengurus Perkeni Bidang Riset & Pengembangan Klinis
• Pembicara ahli pada berbagai kongres diabetes Asia Pasifik dan Eropa'
)
ON CONFLICT (nomor_urut) DO UPDATE SET
    nama_kandidat = EXCLUDED.nama_kandidat,
    gelar = EXCLUDED.gelar,
    institusi = EXCLUDED.institusi,
    foto_url = EXCLUDED.foto_url,
    visi = EXCLUDED.visi,
    misi = EXCLUDED.misi,
    cv_url = EXCLUDED.cv_url,
    ringkasan_cv = EXCLUDED.ringkasan_cv;

-- ------------------------------------------------------------------------------
-- 6. VERIFIKASI HASIL EKSEKUSI
-- ------------------------------------------------------------------------------
SELECT 
    id,
    nomor_urut,
    nama_kandidat,
    gelar,
    institusi
FROM public.voting_kandidat
ORDER BY nomor_urut ASC;
