import json

with open("Data peserta/REKAP_119_PESERTA_DHF_HARI_1.json") as f:
    data = json.load(f)

data_sorted = sorted(data, key=lambda x: x["nama_ods"].lower())

md = []
md.append("# DAFTAR LENGKAP 119 PESERTA SESI DHF HARI 1 (NOVOTEL BOGOR)")
md.append("**Konas PERSADIA 2026 — Sesi Diabetes Health Forum (DHF) & Makan Siang Hari ke-1**")
md.append("**Waktu & Lokasi:** Sabtu, 7 November 2026 | Ballroom 2 Novotel Bogor Golf Resort")
md.append("")
md.append("---")
md.append("")
md.append("## 📊 Ringkasan Statistik")
md.append("- **Total Peserta:** 119 Orang")
md.append("- **Kategori Peserta:**")
md.append("  - 116 Orang: `Anggota PERSADIA` (PERSADIA Cabang Bogor & unit-unit sekitarnya: ATS, Bogor Barat, RSMM, Marzoeki Mahdi, Ciomas, dll.)")
md.append("  - 3 Orang: `Masyarakat Umum` (SUSANTI, Eneh, Winiarsih)")
md.append("- **Mode Kehadiran:** 100% Onsite (Tatap Muka Fisik di Venue)")
md.append("- **Status Pembayaran:** 100% Lunas")
md.append("- **Hak Fasilitas Hari 1:**")
md.append("  1. Akses Meja Registrasi Fisik Hari 1 di Novotel Bogor")
md.append("  2. Akses Masuk Sesi Diabetes Health Forum (DHF) di Ballroom 2 Novotel Bogor")
md.append("  3. Kupon Konsumsi / Makan Siang Buffet Novotel Hari ke-1")
md.append("  4. Tetap memiliki hak penuh mengikuti rangkaian Pesta Rakyat Hari ke-2 di Stadion Pakansari Cibinong")
md.append("")
md.append("---")
md.append("")
md.append("## 📋 Tabel Lengkap 119 Peserta & Catatan Verifikasi")
md.append("")
md.append("| No | No. Registrasi Master | Nama Lengkap (Sesuai DB/ODS) | Kategori | Cabang / Unit | No. WhatsApp | Catatan Khusus / Status Duplikat |")
md.append("|:---:|:---:|---|:---:|---|:---:|---|")

for idx, p in enumerate(data_sorted, 1):
    nr = p["noreg_master"]
    nm = p["nama_ods"]
    kat = p["kategori"]
    cab = p["cabang"] if p["cabang"] and p["cabang"] != "-" else "PERSADIA Cabang Bogor"
    hp = p["hp"].replace("'", "")
    catatan = p["catatan"]
    
    if p["noreg_input"] != p["noreg_master"]:
        catatan = f"Input koordinator: `{p['noreg_input']}`. {catatan}"
    elif p["nama_input"].lower() != p["nama_ods"].lower():
        catatan = f"Nama di daftar koordinator: '{p['nama_input']}'. {catatan}"
        
    md.append(f"| {idx} | `{nr}` | **{nm}** | {kat} | {cab} | {hp} | {catatan} |")

md.append("")
md.append("---")
md.append("")
md.append("## ℹ️ Panduan Informasi untuk Koordinator & Peserta")
md.append("1. **Nomor Barcode Resmi**: Nomor registrasi yang tercantum pada kolom `No. Registrasi Master` di atas adalah nomor barcode resmi yang aktif di sistem.")
md.append("2. **Peserta Riwayat Pendaftaran Ganda**: Untuk peserta yang memiliki catatan riwayat nomor ganda (seperti B. Siti Masitoh `KNS2026-44913` / `KNS2026-55979` dan B. Iin `KNS2026-66832` / `KNS2026-61714`), kedua nomor registrasi tersebut telah di-update di database Supabase sehingga petugas scanner dapat memindai barcode nomor mana pun tanpa kendala.")
md.append("3. **Hak Makan Siang Hari 1**: Peserta dipersilakan menuju pos konsumsi Novotel pada jam makan siang Hari ke-1 dengan menunjukkan tiket / barcode untuk di-scan oleh petugas.")
md.append("4. **Hari ke-2 (Minggu, 8 Nov 2026)**: Seluruh 119 peserta tetap berhak mengikuti Pesta Rakyat di Stadion Pakansari Cibinong (senam, pemeriksaan gula darah gratis, doorprize, dan snack).")

content = "\n".join(md) + "\n"

with open("Data peserta/DAFTAR_LENGKAP_119_PESERTA_DHF_HARI_1_BOGOR.md", "w", encoding="utf-8") as f:
    f.write(content)

print("Generated DAFTAR_LENGKAP_119_PESERTA_DHF_HARI_1_BOGOR.md successfully!")

