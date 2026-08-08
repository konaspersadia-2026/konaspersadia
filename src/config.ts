import { EventInfo, KategoriPeserta, RekeningPembayaran, KontakPanitia, BrandColors, Speaker } from "./types";

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
    fieldTambahan: ["noKTP", "cabangPersadia", "slotWaktuCekGula"],
  },
  {
    id: "umum",
    label: "Masyarakat Umum",
    akses: "pesta_rakyat",
    hargaEarlyBird: 0,
    hargaReguler: 0,
    fieldTambahan: ["noKTP", "slotWaktuCekGula"],
  },
];

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

// Profil Pembicara Dummy (Sesuai Section 7)
export const DUMMY_SPEAKERS: Speaker[] = [
  {
    id: "sp1",
    name: "Prof. Dr. dr. Sidartawan Soegondo, Sp.PD-KEMD",
    title: "Guru Besar Endokrinologi & Metabolik",
    institution: "Universitas Indonesia / PERKENI",
    imageUrl: "https://i.ibb.co.com/6R5WyHsH/Prof-Dr-dr-Sidartawan-Soegondo-Sp-PD-KEMD.webp",
    topics: ["Manajemen Mutakhir Diabetes Tipe 2", "Edukasi Diabetes Berkelanjutan"]
  },
  {
    id: "sp2",
    name: "dr. Roy Panusunan Sibarani, Sp.PD-KEMD",
    title: "Konsultan Endokrinologi & Metabolik",
    institution: "Ketua Panitia Pelaksana / PERSADIA",
    imageUrl: "https://i.ibb.co.com/QvrqTp98/dr-Roy-Panusunan-Sibarani-Sp-PD-KEMD.webp",
    topics: ["Deteksi Dini Komplikasi Kardiovaskular pada Diabetes", "Pesta Rakyat: Pendekatan Komunitas"]
  },
  {
    id: "sp3",
    name: "Prof. dr. Putu Moda Arsana, Sp.PD., K-EMD",
    title: "Konsultan Endokrinologi, Metabolisme, dan Diabetes",
    institution: "Konsil Kedokteran Indonesia (KKI) / PB PERKENI",
    imageUrl: "https://placehold.co/400x400/f1f5f9/0f172a?text=Prof+Putu+Moda",
    topics: ["Etika Praktik Kedokteran", "Update Tatalaksana Diabetes Melitus Tipe 2"]
  },
  {
    id: "sp4",
    name: "dr. Dicky Levenus Tahapary, Sp.PD-KEMD, Ph.D",
    title: "Peneliti & Staf Pengajar Endokrinologi",
    institution: "Wakil Ketua / RSCM-FKUI",
    imageUrl: "https://i.ibb.co.com/LhBkK3MV/dr-Dicky-Levenus-Tahapary-Sp-PD-KEMD-Ph-D.webp",
    topics: ["Epidemiologi Diabetes di Indonesia", "Gaya Hidup dan Remisi Diabetes"]
  },
  {
    id: "sp5",
    name: "Dr. dr. Wismandari, Sp.PD-KEMD",
    title: "Dokter Spesialis Penyakit Dalam - Konsultan",
    institution: "Seksi Ilmiah PERKENI",
    imageUrl: "https://i.ibb.co.com/xqxSLZVq/Dr-dr-Wismandari-Sp-PD-KEMD.webp",
    topics: ["Gangguan Tiroid dan Diabetes", "Terapi Insulin Presisi"]
  },
  {
    id: "sp6",
    name: "Dr. dr. K Heri Nugroho Hario Seno, Sp.PD-KEMD",
    title: "Konsultan Diabetes Senior",
    institution: "Penasehat Panitia / Universitas Diponegoro",
    imageUrl: "https://i.ibb.co.com/zThPMMFp/Dr-dr-K-Heri-Nugroho-Hario-Seno-Sp-PD-KEMD-1.webp",
    topics: ["Kaki Diabetes: Pencegahan Amputasi", "Nutrisi Medis pada Pasien Geriatri"]
  }
];

// Susunan Panitia Pelaksana (Sesuai Dokumen Terbaru)
export const SUSUNAN_PANITIA = {
  penasehat: [
    "Prof. Dr. dr. Achmad Rudijanto, Sp.PD., K-EMD",
    "Prof. Dr. dr. Sidartawan Soegondo, Sp.PD., K-EMD",
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
