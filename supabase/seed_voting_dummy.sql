-- ==============================================================================
-- KONAS PERSADIA 2026: DATA DUMMY SISTEM E-VOTING KETUA PB PERSADIA (2026–2030)
-- ==============================================================================
-- Skrip ini memasukkan:
-- 1. 3 Calon Kandidat Ketua PB PERSADIA lengkap dengan Gelar, Visi, Misi, & CV
-- 2. 10 Data Pemilih Tetap (DPT) Delegasi Cabang + Nomor WA + Token Unik
--
-- CARA MENJALANKAN DI SUPABASE:
-- Buka Supabase Dashboard -> SQL Editor -> Tempel skrip ini -> Klik "Run".
-- ==============================================================================

-- Pastikan kolom CV sudah ada pada tabel voting_kandidat
ALTER TABLE public.voting_kandidat ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.voting_kandidat ADD COLUMN IF NOT EXISTS ringkasan_cv TEXT;

-- ------------------------------------------------------------------------------
-- 1. SEED DATA DUMMY: 3 KANDIDAT CALON PRESIDEN PB PERSADIA
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
-- 2. SEED DATA DUMMY: 10 DAFTAR PEMILIH TETAP (DPT) DELEGASI CABANG
-- ------------------------------------------------------------------------------
INSERT INTO public.voting_dpt (
    nama_lengkap,
    whatsapp,
    cabang_persadia,
    token,
    status_memilih,
    waktu_memilih,
    catatan
)
VALUES
(
    'dr. Ahmad Fauzi, Sp.PD',
    '081234567890',
    'Cabang DKI Jakarta',
    'KNAS-JKT01',
    FALSE,
    NULL,
    'Ketua Delegasi Cabang DKI Jakarta'
),
(
    'dr. Siti Nurhaliza, Sp.PD',
    '081234567891',
    'Cabang Surabaya (Jawa Timur)',
    'KNAS-SBY02',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Surabaya'
),
(
    'dr. Budi Santoso, Sp.PD-KEMD',
    '081234567892',
    'Cabang Semarang (Jawa Tengah)',
    'KNAS-SMG03',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Semarang'
),
(
    'dr. Maya Indrawati',
    '081234567893',
    'Cabang Bandung (Jawa Barat)',
    'KNAS-BDG04',
    FALSE,
    NULL,
    'Sekretaris Delegasi Cabang Bandung'
),
(
    'dr. Hendra Wijaya, Sp.PD',
    '081234567894',
    'Cabang DI Yogyakarta',
    'KNAS-YOG05',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Yogyakarta'
),
(
    'dr. Rina Kartika, Sp.PD',
    '081234567895',
    'Cabang Medan (Sumatera Utara)',
    'KNAS-MDN06',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Medan'
),
(
    'dr. I Wayan Sudarsana, Sp.PD',
    '081234567896',
    'Cabang Denpasar (Bali)',
    'KNAS-DPS07',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Bali'
),
(
    'dr. Andi Tenri, Sp.PD',
    '081234567897',
    'Cabang Makassar (Sulawesi Selatan)',
    'KNAS-MKS08',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Makassar'
),
(
    'dr. Muhammad Rizki',
    '081234567898',
    'Cabang Palembang (Sumatera Selatan)',
    'KNAS-PLB09',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Palembang'
),
(
    'dr. Sri Wahyuni, Sp.PD',
    '081234567899',
    'Cabang Banjarmasin (Kalimantan Selatan)',
    'KNAS-BJM10',
    FALSE,
    NULL,
    'Delegasi Resmi Cabang Banjarmasin'
)
ON CONFLICT (token) DO UPDATE SET
    nama_lengkap = EXCLUDED.nama_lengkap,
    whatsapp = EXCLUDED.whatsapp,
    cabang_persadia = EXCLUDED.cabang_persadia,
    catatan = EXCLUDED.catatan;

-- ------------------------------------------------------------------------------
-- 3. RESET STATUS SESI PEMILIHAN KE 'draft' (ATAU SIAP BUKA 'open')
-- ------------------------------------------------------------------------------
UPDATE public.voting_config
SET value = 'open'
WHERE key = 'status_pemilihan';

UPDATE public.voting_config
SET value = 'true'
WHERE key = 'tampilkan_quick_count';

-- Verifikasi output data yang baru saja dimasukkan
SELECT 'KANDIDAT TERDAFTAR:' AS info, COUNT(*) AS jumlah FROM public.voting_kandidat
UNION ALL
SELECT 'DPT TERDAFTAR:' AS info, COUNT(*) AS jumlah FROM public.voting_dpt;
