export interface EventInfo {
  namaAcara: string;
  tema: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  batasEarlyBird: string;
  batasOnsite: string;
  deadlinePembayaranPeserta: string;
  eventLogoUrl?: string;
}

export interface HargaKegiatan {
  earlyBird: number;
  onsite: number;
}

export interface KategoriPeserta {
  id: string;
  label: string;
  akses: "ilmiah" | "pesta_rakyat";
  hargaSymposium?: HargaKegiatan;
  hargaSymposiumWorkshop?: HargaKegiatan;
  hargaEarlyBird?: number; // untuk pesta_rakyat
  hargaReguler?: number; // untuk pesta_rakyat
  fieldTambahan: Array<"noSTR" | "institusi" | "noKTP" | "cabangPersadia" | "slotWaktuCekGula" | "nim">;
}

export interface RekeningPembayaran {
  bank: string;
  nomorRekening: string;
  atasNama: string;
}

export interface KontakPanitia {
  email: string;
  whatsapp: string;
}

export interface BrandColors {
  cream: string;
  biruMuda: string;
  biruSedang: string;
  biruTua: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  institution: string;
  imageUrl: string;
  topics: string[];
}

export interface RegistrationData {
  id?: string;
  kategoriId: string;
  pilihanKegiatan?: "Symposium" | "Symposium + Workshop";
  namaLengkap: string;
  email: string;
  whatsapp: string;
  akses?: string;
  noSTR?: string;
  institusi?: string;
  nim?: string;
  noKTP?: string;
  cabangPersadia?: string;
  slotWaktuCekGula?: string;
  hargaDasar: number;
  kodeUnik: number;
  totalAkhir: number;
  status: "Menunggu Verifikasi" | "Terverifikasi" | "Ditolak";
  timestamp?: string;
}
