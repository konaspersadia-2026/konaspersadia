import { EventInfo, KategoriPeserta, RekeningPembayaran, KontakPanitia, BrandColors, Speaker, HotelOption, HotelRoom } from "./types";

// ============================================
// KONFIGURASI EVENT — EDIT BAGIAN INI SAJA
// ============================================

export const EVENT_INFO: EventInfo = {
  namaAcara: "KONAS PERSADIA, KONKER PEDI, dan KONKER PERKENI 2026",
  tema: "Pesta Rakyat Persadia, Menyehatkan Indonesia",
  tanggalMulai: "2026-11-07",
  tanggalSelesai: "2026-11-08",
  batasEarlyBird: "2026-09-30",
  batasOnsite: "2026-10-01",
  deadlinePembayaranPeserta: "2026-10-20",
  // URL Logo Gabungan Acara. Anda bisa mengganti ini dengan URL ImgBB atau link CDN gambar tunggal Anda
  eventLogoUrl: "https://i.ibb.co.com/TqcrNyd9/logo.webp",
};

export const KATEGORI_PESERTA: KategoriPeserta[] = [
  {
    id: "dokter_umum",
    label: "Dokter Umum",
    akses: "ilmiah",
    hargaSymposium: { earlyBird: 1500000, onsite: 1800000 },
    hargaSymposiumWorkshop: { earlyBird: 2400000, onsite: 2800000 },
    fieldTambahan: ["institusi"],
  },
  {
    id: "dokter_spesialis",
    label: "Dokter Spesialis",
    akses: "ilmiah",
    hargaSymposium: { earlyBird: 2200000, onsite: 2600000 },
    hargaSymposiumWorkshop: { earlyBird: 3200000, onsite: 3700000 },
    fieldTambahan: ["institusi"],
  },
  {
    id: "residen",
    label: "Residen",
    akses: "ilmiah",
    hargaSymposium: { earlyBird: 1000000, onsite: 1300000 },
    hargaSymposiumWorkshop: { earlyBird: 1700000, onsite: 2000000 },
    fieldTambahan: ["institusi"],
  },
  {
    id: "perawat",
    label: "Perawat",
    akses: "ilmiah",
    // Khusus Perawat hanya dapat mengikuti kegiatan Workshop
    hargaWorkshop: { earlyBird: 400000, onsite: 400000 },
    hargaSymposiumWorkshop: { earlyBird: 400000, onsite: 400000 },
    fieldTambahan: ["institusi"],
  },
  {
    id: "mahasiswa",
    label: "Mahasiswa",
    akses: "ilmiah",
    hargaSymposium: { earlyBird: 600000, onsite: 800000 },
    hargaSymposiumWorkshop: { earlyBird: 1000000, onsite: 1300000 },
    fieldTambahan: ["institusi", "nim"],
  },
  {
    id: "persadia",
    label: "Anggota PERSADIA",
    akses: "pesta_rakyat",
    hargaEarlyBird: 0,
    hargaReguler: 0,
    fieldTambahan: ["cabangPersadia", "namaKetuaCabang", "tanggalLahir", "jenisKelamin"],
  },
  {
    id: "umum",
    label: "Masyarakat Umum",
    akses: "pesta_rakyat",
    hargaEarlyBird: 100000,
    hargaReguler: 100000,
    fieldTambahan: ["tanggalLahir", "jenisKelamin"],
  },
];

// Konfigurasi Paket Voucher Khusus Dokter Umum (FKTP)
export const VOUCHER_DOKTER_UMUM_CONFIG = {
  prefix: "FKTP-",
  // Placeholder harga khusus voucher (silakan sesuaikan nominal):
  hargaSymposium: 6000000,
  hargaSymposiumWorkshop: 6000000,
};

// Konfigurasi Sesi Diabetes Health Forum (Anggota PERSADIA & Masyarakat Umum)
export const DIABETES_HEALTH_FORUM_CONFIG = {
  biaya: 200000,
  hargaNormal: 200000,
  kuotaMaksimal: 200,
};

// Alias kompatibilitas kode
export const HEALTH_TALK_CONFIG = DIABETES_HEALTH_FORUM_CONFIG;

export const REKENING_PEMBAYARAN: RekeningPembayaran = {
  bank: "Bank Victoria",
  nomorRekening: "2101022971",
  atasNama: "Perkumpulan Diabetes Inisiatif",
};

export const KONTAK_PANITIA: KontakPanitia = {
  email: "diabetesinitiativeid@gmail.com",
  whatsapp: "0898-0287-820",
};

export const BRAND_COLORS: BrandColors = {
  cream: "#F8FAFC",
  biruMuda: "#C89A2E",
  biruSedang: "#00B4AC",
  biruTua: "#0B3D5E",
};

// Slots waktu untuk pemeriksaan gula darah gratis di Pesta Rakyat
export const SLOT_WAKTU_CEK_GULA = [
  "06:00 - 07:30 (Sesi Pagi I)",
  "07:30 - 09:00 (Sesi Pagi II)",
  "09:00 - 10:30 (Sesi Pagi III)",
  "10:30 - 12:00 (Sesi Siang)",
];

// Daftar Pembicara & Narasumber Resmi Simposium, Workshop & Health Forum
export const DUMMY_SPEAKERS: Speaker[] = [
  {
    id: "sp-putu",
    name: "Prof. dr. Putu Moda Arsana, SpPD-KEMD",
    title: "Konsultan Endokrinologi, Metabolisme, dan Diabetes",
    institution: "Konsil Kedokteran Indonesia (KKI) / PB PERKENI",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=Prof+Putu+Moda",
    topics: ["Good Habit for a Better Life (Plenary Lecture)", "Etika & Regulasi Praktik Kedokteran"],
    role: "Plenary Lecture",
    category: "plenary"
  },
  {
    id: "sp-sidartawan",
    name: "Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD",
    title: "Guru Besar Endokrinologi & Metabolik",
    institution: "FKUI - RSCM / PB PERKENI",
    imageUrl: "https://i.ibb.co.com/6R5WyHsH/Prof-Dr-dr-Sidartawan-Soegondo-Sp-PD-KEMD.webp",
    topics: ["Presidents' Lecture: Obesity", "Manajemen Mutakhir Diabetes Tipe 2"],
    role: "Presidents' Lecture",
    category: "plenary"
  },
  {
    id: "sp-heri",
    name: "Dr. dr. K. Heri Nugroho Hariosena, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Universitas Diponegoro / RSUP Dr. Kariadi",
    imageUrl: "https://i.ibb.co.com/zThPMMFp/Dr-dr-K-Heri-Nugroho-Hario-Seno-Sp-PD-KEMD-1.webp",
    topics: ["Tirzepatide: Beyond the Numbers", "Dual GIP/GLP-1 Receptor Agonist"],
    role: "Presidents' Lecture",
    category: "plenary"
  },
  {
    id: "sp-rudijanto",
    name: "Prof. Dr. dr. Achmad Rudijanto, SpPD-KEMD",
    title: "Guru Besar Endokrinologi & Metabolik",
    institution: "Universitas Brawijaya / PB PERKENI",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=Prof+Achmad+Rudijanto",
    topics: ["Diabetes Update Treatment: Janus, The First and After", "Kardiometabolik & Proteksi Organ"],
    role: "Presidents' Lecture",
    category: "plenary"
  },
  {
    id: "sp-baringin",
    name: "dr. Baringin T A Manik, MKM",
    title: "Dokter Praktisi FKTP & Penggiat Layanan Primer",
    institution: "Fasilitas Kesehatan Tingkat Pertama (FKTP)",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Baringin+Manik",
    topics: ["My Life in FKTP", "Tantangan dan Solusi Penanganan Diabetes di Layanan Primer"],
    role: "Dokter FKTP",
    category: "symposium"
  },
  {
    id: "sp-dicky",
    name: "dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD",
    title: "Konsultan Endokrinologi & Peneliti Klinis",
    institution: "FKUI - RSCM / PB PERSADIA",
    imageUrl: "https://i.ibb.co.com/LhBkK3MV/dr-Dicky-Levenus-Tahapary-Sp-PD-KEMD-Ph-D.webp",
    topics: ["Diabetes Approach in FKTP", "Deteksi Dini & Pencegahan Komplikasi di Layanan Primer"],
    role: "Dokter FKTP",
    category: "symposium"
  },
  {
    id: "sp-roy",
    name: "dr. Roy Panusunan Sibarani, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Ketua Panitia Pelaksana / RS Siloam Lippo Village",
    imageUrl: "https://i.ibb.co.com/QvrqTp98/dr-Roy-Panusunan-Sibarani-Sp-PD-KEMD.webp",
    topics: ["Footsteps Leading to Neuropathy: From Upstream (Endocrinologist POV)", "Pencegahan Kerusakan Saraf & Kaki Diabetik"],
    role: "Simposium Sesi 4",
    category: "symposium"
  },
  {
    id: "sp-gloria",
    name: "dr. Gloria Tanjung, SpN",
    title: "Dokter Spesialis Neurologi (Saraf)",
    institution: "Perhimpunan Dokter Spesialis Neurologi Indonesia (PERDOSNI)",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Gloria+Tanjung",
    topics: ["Footsteps Leading to Neuropathy: To Downstream (Neurologist POV)", "Evaluasi Klinis & Terapi Neuropati Diabetik"],
    role: "Simposium Sesi 4",
    category: "symposium"
  },
  {
    id: "sp-johanes",
    name: "dr. Johanes Purwoto, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "RS Siloam Semanggi / PB PERKENI",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Johanes+Purwoto",
    topics: [
      "Mastering AGP: A Step-by-Step Guide to Read CGM Reports",
      "CGM-Driven Clinical Decisions in Type 1 & Type 2 Diabetes",
      "CGM in Special Populations: Prediabetes, Pregnancy, Elderly & Inpatient"
    ],
    role: "Workshop 1 (CGM)",
    category: "workshop"
  },
  {
    id: "sp-daniel",
    name: "Daniel Surbakti",
    title: "Patient Advocate & Diabetes Champion",
    institution: "Komunitas Penyandang Diabetes",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=Daniel+Surbakti",
    topics: ["Patient's POV on Continuous Glucose Monitoring (CGM)", "Hands-on: Case-based CGM Workshop"],
    role: "Workshop 1 (CGM)",
    category: "workshop"
  },
  {
    id: "sp-boyke",
    name: "dr. Boyke Dian Nugraha, SpOG, MARS",
    title: "Dokter Spesialis Obstetri & Ginekologi / Seksolog Klinis",
    institution: "Klinik Pasutri / Edukator Nasional",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Boyke+SpOG",
    topics: ["Cantik, Bugar, Bergairah", "Menjaga Kebugaran & Harmoni Pasutri Penyandang Diabetes"],
    role: "Diabetes Health Forum",
    category: "health_forum"
  },
  {
    id: "sp-sony",
    name: "dr. Sony Wibisono Mudjanarko, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Universitas Airlangga / RSUD Dr. Soetomo",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Sony+Wibisono",
    topics: [
      "Targeting Metabolic Risk Early: Semaglutide Beyond Weight Loss",
      "Synergy of Semaglutide & Lifestyle Intervention in Prediabetes Reversal",
      "Hands-on: Navigating Real-World Prediabetes Cases with Semaglutide"
    ],
    role: "Workshop 2 (Semaglutide)",
    category: "workshop"
  },
  {
    id: "sp-santi",
    name: "dr. Santi Syafril, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Universitas Sumatera Utara / RSUP H. Adam Malik",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Santi+Syafril",
    topics: [
      "Navigating Dietary Patterns: Mediterranean, Low-Carb & IF in Diabetes",
      "Carbohydrate Counting & Glycemic Index: Practical Strategies",
      "Hands-on: Meal Planning & Designing Practical Diets"
    ],
    role: "Workshop 3 (Nutrition)",
    category: "workshop"
  },
  {
    id: "sp-yuanita",
    name: "Dr. dr. Yuanita Langi, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Universitas Sam Ratulangi / RSUP Prof. Dr. R. D. Kandou",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=Dr+dr+Yuanita+Langi",
    topics: [
      "Hypoglycemia Unawareness: Mechanism & Risk Stratification",
      "Hypoglycemia in Special Populations: Elderly & Renal Impairment",
      "Hypoglycemia Management Protocol, Prevention & Post-Crisis Care"
    ],
    role: "Workshop 4 (Hypoglycemia)",
    category: "workshop"
  },
  {
    id: "sp-henny",
    name: "dr. Henny Megawati, SpPD",
    title: "Dokter Spesialis Penyakit Dalam",
    institution: "Perhimpunan Dokter Spesialis Penyakit Dalam Indonesia (PAPDI)",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Henny+Megawati",
    topics: ["Hands-on Case-based Workshop: Complex Hypoglycemic Scenarios (Filling the Gap)"],
    role: "Workshop 4 (Hypoglycemia)",
    category: "workshop"
  },
  {
    id: "sp-ratna",
    name: "Dr. dr. Made Ratna Saraswati, SpPD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Universitas Udayana / RSUP Prof. I.G.N.G. Ngoerah",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=Dr+dr+Made+Ratna",
    topics: [
      "Early Detection & Risk Stratification in Prediabetes: Stopping the Continuum",
      "Pharmacotherapy vs Lifestyle Modification in Prediabetes: Finding Balance",
      "Reversing Prediabetes: Practical Nutrition & Exercise Prescriptions"
    ],
    role: "Workshop 5 (Prediabetes)",
    category: "workshop"
  },
  {
    id: "sp-pandu",
    name: "dr. Pandu Sakti, SpPD, AIFO-K",
    title: "Dokter Spesialis Penyakit Dalam & Ahli Faal Olahraga Klinis",
    institution: "PAPDI / Pakar Faal Olahraga Klinis",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Pandu+Sakti",
    topics: ["Hands-on Case-based Learning: Personalizing Prediabetes Management (Filling the Gap)"],
    role: "Workshop 5 (Prediabetes)",
    category: "workshop"
  },
  {
    id: "sp-rudy",
    name: "Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD",
    title: "Dokter Spesialis Penyakit Dalam & Edukator Diabetes",
    institution: "PB PERSADIA / Sobat Diabet",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=Dr+dr+Rudy+Kurniawan",
    topics: ["Master of Ceremony (MC): Plenary Lecture & Opening Ceremony"],
    role: "MC & Moderator",
    category: "moderator"
  },
  {
    id: "sp-fauzia",
    name: "dr. Fauzia Kirana, SpPD",
    title: "Dokter Spesialis Penyakit Dalam",
    institution: "Perhimpunan Dokter Spesialis Penyakit Dalam Indonesia (PAPDI)",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+Fauzia+Kirana",
    topics: ["Moderator: Presidents' Lecture (Obesity, Tirzepatide, Diabetes Update)"],
    role: "Moderator",
    category: "moderator"
  },
  {
    id: "sp-william",
    name: "dr. William Djauhari",
    title: "Dokter Praktisi Medis",
    institution: "Ikatan Dokter Indonesia (IDI)",
    imageUrl: "https://placehold.co/400x400/0B3D5E/ffffff?text=dr+William+Djauhari",
    topics: ["Moderator: Footsteps Leading to Neuropathy (Endocrinologist & Neurologist POV)"],
    role: "Moderator",
    category: "moderator"
  }
];

// Susunan Panitia Pelaksana (Sesuai Dokumen Terbaru)
export const SUSUNAN_PANITIA = {
  penasehat: [
    "Prof. Dr. dr. Sidartawan Soegondo, Sp.PD., K-EMD",
    "Prof. Dr. dr. Achmad Rudijanto, Sp.PD., K-EMD",
    "Prof. Dr. dr. Mardi Santoso, Sp.PD., K-EMD",
    "Prof. dr. Putu Moda Arsana, Sp.PD., K-EMD",
    "Dr. dr. K Heri Nugroho Hario Seno, Sp.PD., K-EMD"
  ],
  ketua: "dr. Roy Panusunan Sibarani, Sp.PD., K-EMD (Ketua Umum periode 2026–2029)",
  wakilKetua: "dr. Dicky Levenus Tahapary, Sp.PD., K-EMD, Ph.D",
  bendahara: [
    "Ibu Magdalena Vandry",
    "dr. Monika Hartawan"
  ],
  sekretaris: [
    "dr. William Djauhari",
    "dr. Widya Mandala Sari, Sp.PD"
  ],
  seksiAcara: [
    "Paul Tuanakotta",
    "Tamara Geraldine",
    "dr. Maya Kusumawati, Sp.PD., K-EMD",
    "dr. Pandu Tridana Sakti, Sp.PD"
  ],
  seksiIlmiah: [
    "Dr. dr. Wismandari, Sp.PD., K-EMD",
    "dr. Johanes Purworto, Sp.PD., K-EMD",
    "dr. Nur Rusyda Kuddah, Sp.PD., K-EMD"
  ],
  seksiTransportasi: [
    "Mohammad Sidik",
    "Ali Nandho"
  ],
  seksiKonsumsi: "Susanti Suharto",
  seksiPeserta: [
    "Agus Sumitro",
    "Hans Phattua L"
  ],
  seksiPublikasi: "Steven Wijaya",
  seksiProtokol: [
    "dr. Fauzia Kirana, Sp.PD",
    "dr. Maria Sen",
    "dr. Elis Tiahesara"
  ]
};

// ============================================
// KONFIGURASI AKOMODASI & HOTEL KHUSUS PESERTA
// ============================================

export const KONTAK_AKOMODASI = {
  telepon: "0853-7071-6686",
  whatsappNumber: "6285370716686",
  email: "diabetesinitiativeid@gmail.com",
};

/**
 * PANDUAN MENGHEMAT BANDWIDTH NETLIFY:
 * Agar foto kamar tidak menguras kuota bandwidth Netlify, Anda dapat:
 * 1. Buka repo GitHub proyek ini -> Buka tab "Issues" -> Buat/buka issue baru (atau draft komentar).
 * 2. Drag & drop foto kamar hotel ke kolom komentar issue.
 * 3. Tunggu hingga GitHub selesai mengunggah, lalu salin URL gambar hasil generate GitHub
 *    (biasanya berformat: https://github.com/user-attachments/assets/... atau https://user-images.githubusercontent.com/...).
 * 4. Tempelkan URL tersebut ke array `images` di bawah ini menggantikan placeholder.
 */
export const AKOMODASI_HOTEL: HotelOption[] = [
  {
    id: "novotel",
    name: "Novotel Bogor Golf Resort & Convention Center",
    location: "Golf Estate Bogor Raya, Sukaraja, Kabupaten Bogor, Jawa Barat 16710",
    distance: "Venue Utama Hari ke-1 (Sesi Ilmiah, Seminar, & Rapat Kerja)",
    description: "Hotel resor bintang 4 tempat diselenggarakannya Sesi Ilmiah (Symposium & Workshop) Hari ke-1. Dikelilingi taman tropis yang asri dengan pemandangan lapangan golf 18-hole, udara sejuk, serta fasilitas konvensi berstandar internasional.",
    coverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      {
        id: "novotel-klasik",
        name: "Kamar Klasik (Classic Room)",
        price: 1500000,
        bedType: "1 King Bed atau 2 Single Beds",
        description: "Kamar bergaya arsitektur tradisional khas resor tropis yang hangat dengan lantai kayu atau ornamen alami. Dilengkapi balkon atau teras pribadi dengan pemandangan lanskap taman hijau nan asri.",
        facilities: [
          "Termasuk Sarapan (Breakfast) 2 Orang",
          "Balkon / Teras Pribadi dengan Garden View",
          "Pendingin Ruangan (AC) Individual",
          "Koneksi Wi-Fi Berkecepatan Tinggi Gratis",
          "Coffee & Tea Maker Fasilitas Kamar",
          "Safe Deposit Box & Mini Kulkas",
          "Kamar Mandi dengan Shower & Perlengkapan Mandi Lengkap",
          "Akses Kolam Renang Resor Luas & Pusat Kebugaran (Gym)"
        ],
        images: [
          "https://github.com/user-attachments/assets/ab6e2a2e-86ba-414a-aa5d-457b20a92abc",
          "https://github.com/user-attachments/assets/480b1da7-aa6e-460e-a5bf-7e8047c03b3a",
          "https://github.com/user-attachments/assets/e9b15827-f140-4f77-9679-8d7df40d9187",
          "https://github.com/user-attachments/assets/77184457-7a58-47cf-bc12-4498ca8f136b",
          "https://github.com/user-attachments/assets/362668a9-5302-4f91-9537-e627f5fe0169",
          "https://github.com/user-attachments/assets/5e94b675-f94e-4d55-b816-b7e2953613df",
          "https://github.com/user-attachments/assets/ee604e87-802e-450f-b9cb-6dd138f45417"
        ]
      },
      {
        id: "novotel-modern",
        name: "Kamar Modern (Superior / Deluxe Modern)",
        price: 1700000,
        bedType: "1 King Bed atau 2 Single Beds",
        description: "Kamar berdesain kontemporer modern yang elegan, mengutamakan kenyamanan premium dan estetika mutakhir. Menawarkan suasana santai dengan pencahayaan hangat dan perabotan berkualitas tinggi.",
        facilities: [
          "Termasuk Sarapan (Breakfast) 2 Orang",
          "Interior Kontemporer Modern & Elegan",
          "Smart LED TV Layar Lebar & Saluran Internasional",
          "Koneksi Wi-Fi Berkecepatan Tinggi Gratis",
          "Kamar Mandi Mewah dengan Rain Shower & Hair Dryer",
          "Coffee Machine / Tea Maker & Meja Kerja Ergonomis",
          "Safe Deposit Box Digital & Mini Bar",
          "Akses Fasilitas Resor, Kolam Renang, & Kids Club"
        ],
        images: [
          "https://github.com/user-attachments/assets/7bd5912b-918c-4815-9f0a-d1c4f01769b8",
          "https://github.com/user-attachments/assets/38199986-022a-4bf7-bd3f-208767398b4e",
          "https://github.com/user-attachments/assets/9776ce22-1f33-4f93-8656-03d543fb89f6",
          "https://github.com/user-attachments/assets/90e19f80-70f0-4419-8fcc-fbe2eaeb8e4e",
          "https://github.com/user-attachments/assets/b4d1ade4-cf00-490c-89e0-3106d78cbeaf",
          "https://github.com/user-attachments/assets/431dba4d-e1e2-47d2-a0e2-151101cf52bb"
        ]
      }
    ]
  },
  {
    id: "ibis-styles",
    name: "Ibis Styles Bogor Raya",
    location: "Golf Estate Bogor Raya, Sukaraja, Kabupaten Bogor, Jawa Barat 16710",
    distance: "Bersebelahan langsung dengan Novotel Bogor (1 menit berjalan kaki)",
    description: "Hotel modern berkonsep penuh warna, ceria, dan dinamis yang berada tepat bersebelahan dengan Novotel Bogor. Menawarkan opsi akomodasi yang sangat praktis, nyaman, dan terjangkau bagi para peserta kegiatan ilmiah.",
    coverImage: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    rooms: [
      {
        id: "ibis-standard",
        name: "Kamar Standard Ibis Styles",
        price: 800000,
        bedType: "1 Queen Bed atau 2 Single Beds",
        description: "Kamar dengan rancangan interior pop-art yang segar dan fungsional. Dilengkapi ranjang istimewa 'Sweet Bed by ibis' untuk menjamin kualitas tidur terbaik Anda setelah seharian beraktivitas di sesi konferensi.",
        facilities: [
          "Termasuk Sarapan (Breakfast) 2 Orang",
          "Ranjang Tidur 'Sweet Bed by ibis' Berstandar Internasional",
          "Pendingin Ruangan (AC) Individual",
          "Koneksi Wi-Fi Berkecepatan Tinggi Gratis",
          "LED TV Layar Datar dengan Saluran Kabel",
          "Kamar Mandi Modern dengan Shower & Water Heater",
          "Coffee & Tea Maker serta Botol Air Mineral Harian",
          "Akses Kolam Renang Bersama & Pusat Kebugaran"
        ],
        images: [
          "https://github.com/user-attachments/assets/16f23f5d-cd67-4b18-b450-bf51dcbf4a9f",
          "https://github.com/user-attachments/assets/bae593cc-6104-4490-aa21-0891e696e717",
          "https://github.com/user-attachments/assets/b8382cd5-336f-4944-aaa9-b721245e0d07",
          "https://github.com/user-attachments/assets/d7288c9f-7c9c-4692-9f55-401f52595def",
          "https://github.com/user-attachments/assets/9a667dda-1f9e-431b-8e8c-93bf7aa1b3fb",
          "https://github.com/user-attachments/assets/abd2713f-8100-4b8a-a6e7-b93f42b48e58",
          "https://github.com/user-attachments/assets/97b9c9d3-f090-4923-880c-3f33c588442c"
        ]
      }
    ]
  }
];
