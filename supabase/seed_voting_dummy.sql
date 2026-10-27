-- ==============================================================================
-- KONAS PERSADIA 2026: SEED DPT & KANDIDAT DUMMY E-VOTING PRESIDEN PB PERSADIA
-- DISESUAIKAN TEPAT DENGAN STRUKTUR TABEL SUPABASE TERBARU
-- ==============================================================================
--
-- Data yang dimasukkan:
-- 1. 3 Calon Kandidat Presiden PB PERSADIA (Nomor Urut 1, 2, 3 lengkap dengan Visi, Misi, & Ringkasan CV)
-- 2. 15 Daftar Pemilih Tetap (DPT) Delegasi Cabang Se-Indonesia dengan Token Unik
-- 3. Konfigurasi Sesi Pemilihan (Status: 'open' & Quick Count: 'true')
--
-- CARA MENJALANKAN DI SUPABASE:
-- Buka Supabase Dashboard -> SQL Editor -> Tempel seluruh skrip ini -> Klik 'Run'.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BERSIHKAN DATA KOTAK SUARA & RESET STATUS PEMILIH TERDAHULU (AGAR BERSIH)
-- ------------------------------------------------------------------------------
-- Kosongkan kotak suara simulasi sebelumnya
DELETE FROM public.voting_suara WHERE id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. INSERT / UPDATE 3 KANDIDAT CALON PRESIDEN PB PERSADIA (voting_kandidat)
-- ------------------------------------------------------------------------------
INSERT INTO public.voting_kandidat (
    nomor_urut,
    nama_kandidat,
    gelar,
    institusi,
    foto_url,
    visi,
    misi,
    created_at,
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
    NOW(),
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
    NOW(),
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
    NOW(),
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
-- 3. INSERT / UPDATE 15 DAFTAR PEMILIH TETAP (DPT) DELEGASI CABANG (voting_dpt)
-- ------------------------------------------------------------------------------
INSERT INTO public.voting_dpt (
    id,
    nama_lengkap,
    whatsapp,
    cabang_persadia,
    token,
    status_memilih,
    waktu_memilih,
    catatan,
    created_at
)
VALUES
(
    gen_random_uuid(),
    'dr. Ahmad Fauzi, Sp.PD',
    '081234567890',
    'PERSADIA Cabang DKI Jakarta',
    'KNAS-JKT01',
    FALSE,
    NULL,
    'Ketua Delegasi Cabang DKI Jakarta',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Maya Indrawati',
    '081234567891',
    'PERSADIA Cabang Kota Bandung',
    'KNAS-BDG02',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Bandung (Jawa Barat)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. H. Hendra Setiawan, Sp.PD',
    '081234567892',
    'PERSADIA Cabang Kota Bogor',
    'KNAS-BGR03',
    FALSE,
    NULL,
    'Delegasi Tuan Rumah Cabang Bogor',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Budi Santoso, Sp.PD-KEMD',
    '081234567893',
    'PERSADIA Cabang Kota Semarang',
    'KNAS-SMG04',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Semarang (Jawa Tengah)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Siti Aminah, Sp.PD',
    '081234567894',
    'PERSADIA Cabang Surakarta (Solo)',
    'KNAS-SOL05',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Solo',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Hendra Wijaya, Sp.PD',
    '081234567895',
    'PERSADIA Cabang DI Yogyakarta',
    'KNAS-YOG06',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Yogyakarta',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Siti Nurhaliza, Sp.PD',
    '081234567896',
    'PERSADIA Cabang Kota Surabaya',
    'KNAS-SBY07',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Surabaya (Jawa Timur)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. I Wayan Sudarsana, Sp.PD',
    '081234567897',
    'PERSADIA Cabang Denpasar (Bali)',
    'KNAS-DPS08',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Denpasar Bali',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Rina Kartika, Sp.PD',
    '081234567898',
    'PERSADIA Cabang Kota Medan',
    'KNAS-MDN09',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Medan (Sumatera Utara)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Zulkifli Rahman, Sp.PD',
    '081234567899',
    'PERSADIA Cabang Kota Padang',
    'KNAS-PDG10',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Padang (Sumatera Barat)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Muhammad Rizki, Sp.PD',
    '081234567800',
    'PERSADIA Cabang Kota Palembang',
    'KNAS-PLB11',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Palembang (Sumatera Selatan)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Sri Wahyuni, Sp.PD',
    '081234567801',
    'PERSADIA Cabang Banjarmasin',
    'KNAS-BJM12',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Banjarmasin (Kalsel)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Agus Pranoto, Sp.PD',
    '081234567802',
    'PERSADIA Cabang Pontianak',
    'KNAS-PNK13',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Pontianak (Kalbar)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Andi Tenri, Sp.PD',
    '081234567803',
    'PERSADIA Cabang Kota Makassar',
    'KNAS-MKS14',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Makassar (Sulsel)',
    NOW()
),
(
    gen_random_uuid(),
    'dr. Fransiska Runtuwene, Sp.PD',
    '081234567804',
    'PERSADIA Cabang Kota Manado',
    'KNAS-MND15',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Manado (Sulut)',
    NOW()
)
ON CONFLICT (token) DO UPDATE SET
    nama_lengkap = EXCLUDED.nama_lengkap,
    whatsapp = EXCLUDED.whatsapp,
    cabang_persadia = EXCLUDED.cabang_persadia,
    status_memilih = FALSE,
    waktu_memilih = NULL,
    catatan = EXCLUDED.catatan;

-- ------------------------------------------------------------------------------
-- 4. BUKA SESI PEMILIHAN & AKTIFKAN QUICK COUNT (voting_config)
-- ------------------------------------------------------------------------------
INSERT INTO public.voting_config (key, value, description, updated_at)
VALUES 
    ('status_pemilihan', 'open', 'Status sesi sidang: draft (belum dibuka), open (sedang berlangsung), closed (ditutup)', NOW()),
    ('tampilkan_quick_count', 'true', 'Tampilkan hasil suara real-time: true / false', NOW()),
    ('judul_pemilihan', 'Pemilihan Presiden Pengurus Besar PERSADIA Periode 2029–2032', 'Judul resmi sesi sidang pemilihan', NOW()),
    ('voting_admin_passcode', 'panlih2026', 'Passcode login darurat panitia pemilihan presidium', NOW()),
    ('putaran_voting', '1', 'Putaran pemilihan: 1 (Putaran Pertama) atau 2 (Putaran Kedua / Run-off)', NOW()),
    ('kandidat_putaran_2', '[]', 'Daftar ID kandidat yang berhak maju ke Putaran Kedua dalam format JSON array', NOW())
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 5. VERIFIKASI DATA YANG BERHASIL DIINPUT
-- ------------------------------------------------------------------------------
SELECT 
    nomor_urut, 
    nama_kandidat, 
    gelar, 
    institusi 
FROM public.voting_kandidat 
ORDER BY nomor_urut ASC;

SELECT 
    token, 
    nama_lengkap, 
    cabang_persadia, 
    status_memilih 
FROM public.voting_dpt 
ORDER BY token ASC;

SELECT key, value, description FROM public.voting_config ORDER BY key ASC;
