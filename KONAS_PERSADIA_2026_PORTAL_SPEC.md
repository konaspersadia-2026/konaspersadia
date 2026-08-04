# DOKUMEN SPESIFIKASI DAN INFORMASI PORTAL WEB KONAS PERSADIA 2026

Dokumen ini disusun sebagai panduan menyeluruh bagi *website builder* atau pengembang lain untuk dapat mereplikasi, membangun, atau memelihara Portal Web Resmi **KONAS PERSADIA, KONKER PEDI, dan KONKER PERKENI 2026** dengan informasi, alur kerja (flow), dan konsep desain yang sama persis tanpa ada detail yang tertinggal.

---

## 1. IDENTITAS & BRANDING ACARA

### 1.1 Judul & Tema Acara
*   **Nama Acara Utama:** KONAS PERSADIA, KONKER PEDI, dan KONKER PERKENI 2026
*   **Tema Utama:** "Pesta Rakyat Persadia, Menyehatkan Indonesia"
*   **Fokus Kampanye:** "Diabetes, Deteksi Dini Lebih Awal"
*   **Slogan Kampanye (Tagline):**
    *   *Bahasa Indonesia:* "Deteksi Dini, Hidup Lebih Baik: Bersama Melawan Diabetes dari Akar"
    *   *Bahasa Inggris:* "Early Detection for Better Living: Standing Together Against Diabetes at Its Root"
*   **Logo Acara:** [URL Logo Gabungan](https://i.ibb.co.com/TqcrNyd9/logo.webp)

### 1.2 Palet Warna Brand (Tailwind & Hex)
*   **Cream (Latar Belakang Lembut):** `#F8FAFC` (Slate 50)
*   **Biru Muda (Aksen Oranye/Kuning):** `#F59E0B` (Amber 500)
*   **Biru Sedang (Teal/Toska):** `#0D9488` (Teal 600)
*   **Biru Tua (Primary):** `#1E3A8A` (Blue 900)

---

## 2. INFORMASI JADWAL, LOKASI & AKOMODASI

### 2.1 Waktu Pelaksanaan
*   **Tanggal Mulai:** Sabtu, 7 November 2026
*   **Tanggal Selesai:** Minggu, 8 November 2026

### 2.2 Pembagian Jalur Acara (Two-Track System)
1.  **Track Ilmiah (Indoor):**
    *   *Hari/Tanggal:* Sabtu, 7 November 2026
    *   *Lokasi:* **Novotel Bogor Golf Resort and Convention Center**, Danau Bogor Raya, Bogor, Jawa Barat.
    *   *Target Audien:* Kalangan medis profesional (Dokter Spesialis Endokrin/Penyakit Dalam, Dokter Umum, Perawat, Ahli Gizi, Residen/PPDS, Mahasiswa Kedokteran).
2.  **Track Pesta Rakyat (Outdoor & Bakti Sosial):**
    *   *Hari/Tanggal:* Minggu, 8 November 2026 (Mulai pukul 05:30 WIB)
    *   *Lokasi:* **GOR Pakansari**, Jl. GOR Pakansari, Cibinong, Bogor, Jawa Barat.
    *   *Target Audien:* Penyandang diabetes (diabetesi) beserta keluarga, anggota PERSADIA, serta masyarakat umum di wilayah Bogor dan sekitarnya.

---

## 3. STRUKTUR MENU & SEKSI WEBSITE (SINGLE PAGE NAVIGATION)

Situs web ini dirancang dengan struktur *Single Page Application (SPA)* dengan navigasi yang halus (*smooth scrolling*) dan halaman khusus untuk sponsorship (*kemitraan*):

1.  **Beranda (Hero Section):** Pengenalan singkat acara, tombol daftar peserta, dan tombol akses informasi sponsorship.
2.  **Tentang Acara (About):** Latar belakang kolaborasi historis tiga organisasi (PERSADIA, PEDI, PERKENI), tujuan kegiatan, target peserta, dan visualisasi estimasi target (400+ peserta ilmiah, 10.000+ peserta pesta rakyat).
3.  **Jadwal Kegiatan (Schedules):** Panel interaktif dengan tab untuk berganti antara *Sesi Ilmiah* dan *Pesta Rakyat*.
4.  **Profil Pembicara (Speakers):** Grid profil narasumber utama beserta judul materi dan institusi asal mereka.
5.  **Biaya & Registrasi (Registration Fees):** Informasi tarif berdasarkan kategori dan periode pendaftaran, dilengkapi tombol aksi pendaftaran.
6.  **Cek Status (Check Status):** Formulir pencarian berbasis Nomor Registrasi atau Email untuk memverifikasi status pendaftaran pendaftar secara langsung.
7.  **Lokasi & Akomodasi (Location):** Peta interaktif (embed map) untuk Novotel Bogor dan GOR Pakansari, disertai rekomendasi hotel/akomodasi di sekitarnya.
8.  **Susunan Panitia (Committee):** Struktur kepanitiaan lengkap (Penasehat, Ketua, Wakil, Bendahara, dll).
9.  **Daftar Sponsor (Sponsors):** Logo-logo perusahaan mitra yang mendukung terselenggaranya acara.
10. **FAQ (Pertanyaan Umum):** Daftar tanya-jawab interaktif mengenai pendaftaran, pembayaran, akomodasi, dan keikutsertaan.
11. **Halaman Kemitraan (Partnership/Sponsorship):** Halaman terpisah (route `/kemitraan` atau `/sponsorship`) yang menyajikan brosur digital skema sponsorship, daftar paket (Nusantara, Diamond, Sapphire, Ruby, Emerald, Topaz, Pendukung), serta formulir/kontak kerja sama.

---

## 4. JADWAL DETAIL ACARA (AGENDA)

### 4.1 Track Ilmiah (Novotel Bogor)
#### Hari 1 — Sabtu, 7 November 2026
*   **07:30 - 08:30:** Registrasi Peserta, Re-registrasi & Coffee Morning (Foyer Grand Ballroom) | *Panitia Pelaksana*
*   **08:30 - 09:30:** Sesi Pleno Pembuka: Kebijakan Nasional Deteksi Dini Diabetes (Grand Ballroom A) | *Perwakilan Kemenkes RI & Dr. dr. K Heri Nugroho Hario Seno, Sp.PD-KEMD*
*   **09:30 - 10:00:** Upacara Pembukaan Resmi KONAS & KONKER Bersama (Grand Ballroom A & B) | *dr. Roy Panusunan Sibarani, Sp.PD-KEMD (Ketua Panitia)*
*   **10:00 - 12:00:** Simposium I: Pendekatan Komprehensif Terapi Insulin & Manajemen CGMS (Grand Ballroom A) | *Prof. Dr. dr. Sidartawan Soegondo, Sp.PD-KEMD*
*   **12:00 - 13:30:** ISHOMA (Restoran Novotel Bogor) | *Seksi Konsumsi*
*   **13:30 - 15:30:** Workshop Paralel A: Tata Laksana Penanganan Kaki Diabetes & Pencegahan Amputasi (Parijs Room) | *Dr. dr. Wismandari, Sp.PD-KEMD & Tim*
*   **13:30 - 15:30:** Workshop Paralel B: Komunikasi Terapeutik & Konseling Gizi Terpadu (Bogor Room) | *dr. Monika, Sp.PD & Ahli Gizi PEDI*
*   **15:30 - 17:00:** Rapat Anggota Tahunan & Pleno Kerja Organisasi PERKENI / PEDI (Grand Ballroom B) | *Pengurus Pusat Organisasi*

#### Hari 2 — Minggu, 8 November 2026
*   **08:00 - 10:00:** Simposium II: Mengatasi Hambatan Psikososial pada Pendampingan Diabetesi (Grand Ballroom A) | *Pengurus PEDI & dr. William Djauhari*
*   **10:00 - 12:00:** Simposium III: Pencegahan Komplikasi Ginjal & Jantung Sejak Dini (Grand Ballroom A) | *dr. Dicky Levenus Tahapary, Sp.PD-KEMD, Ph.D*
*   **12:00 - 13:00:** Makan Siang & Penutupan Kongres Sesi Ilmiah (Foyer Grand Ballroom) | *Panitia Pelaksana*

### 4.2 Track Pesta Rakyat (GOR Pakansari)
#### Hari 2 — Minggu, 8 November 2026
*   **05:30 - 06:00:** Kumpul Peserta & Distribusi Atribut/Konsumsi Pagi (Area Parkir Barat) | *Seksi Peserta*
*   **06:00 - 06:45:** Senam Bugar Diabetes Nasional Massal (Panggung Utama Lapangan Luar) | *Instruktur Senam PERSADIA Bogor*
*   **06:45 - 07:45:** Jalan Sehat Keluarga Menyehatkan Indonesia (Rute Lingkar GOR Pakansari - 1.5 KM) | *Seluruh Peserta & Panitia*
*   **07:30 - 12:00:** Pembukaan Booth Skrining Gula Darah & Pemeriksaan Kesehatan Gratis (Tenda Medis Utama) | *Tim Dokter Residen, Perawat & Edukator Diabetes PEDI*
*   **08:00 - 09:30:** Talkshow Interaktif Awam: Deteksi Dini & Mitos vs Fakta Mengenai Diabetes (Panggung Utama) | *dr. Roy Panusunan Sibarani, Sp.PD-KEMD & Tokoh Masyarakat*
*   **09:30 - 11:30:** Panggung Hiburan Rakyat, Undian Doorprize & Demo Memasak Makanan Sehat Diabetesi (Panggung Utama) | *PERSADIA Bogor & Depok*
*   **11:30 - 12:00:** Pemberian Penghargaan Unit Persadia Berprestasi & Penutupan Acara (Panggung Utama) | *Pengurus PERSADIA Pusat*

---

## 5. SKEMA TARIF & KATEGORI PENDAFTARAN

### 5.1 Penentuan Masa Pendaftaran
*   **Masa Early Bird:** S.d. 30 September 2026
*   **Masa Onsite / Reguler:** Mulai 1 Oktober 2026 s.d. 20 Oktober 2026

### 5.2 Rincian Biaya per Kategori

| Kategori Peserta | Jenis Akses | Pilihan Kegiatan | Biaya Early Bird (s.d. 30 Sep 2026) | Biaya Onsite (Mulai 1 Okt 2026) |
| :--- | :--- | :--- | :--- | :--- |
| **Dokter Umum** | Ilmiah | Symposium | Rp 1.500.000 | Rp 1.800.000 |
| | | Symposium + Workshop | Rp 2.400.000 | Rp 2.800.000 |
| **Dokter Spesialis**| Ilmiah | Symposium | Rp 2.200.000 | Rp 2.600.000 |
| | | Symposium + Workshop | Rp 3.200.000 | Rp 3.700.000 |
| **Residen** | Ilmiah | Symposium | Rp 1.000.000 | Rp 1.300.000 |
| | | Symposium + Workshop | Rp 1.700.000 | Rp 2.000.000 |
| **Mahasiswa** | Ilmiah | Symposium | Rp 600.000 | Rp 800.000 |
| | | Symposium + Workshop | Rp 1.000.000 | Rp 1.300.000 |
| **Anggota PERSADIA**| Pesta Rakyat | - | Rp 0 (Gratis) | Rp 50.000 |
| **Masyarakat Umum** | Pesta Rakyat | - | Rp 0 (Gratis) | Rp 50.000 |

---

## 6. FORMULIR PENDAFTARAN & ALUR TRANSAKSI (FLOW)

Proses pendaftaran menggunakan modal interaktif dengan **4 Langkah Terstruktur**:

```
[ Langkah 1: Biodata ] ──> [ Langkah 2: Pembayaran ] ──> [ Langkah 3: Bukti ] ──> [ Langkah 4: Selesai ]
```

### 6.1 Langkah 1: Pengisian Biodata & Kategori
*   **Input Wajib:** Nama Lengkap, Alamat Email, Nomor WhatsApp (minimal 9 digit).
*   **Pilihan Kategori:** Menggunakan dropdown dinamis yang merujuk pada tabel biaya di atas.
*   **Input Bersyarat (Conditional Fields):**
    *   Jika memilih *Dokter Umum, Dokter Spesialis, atau Residen*: Wajib mengisi **Nomor STR** dan **Nama Institusi**.
    *   Jika memilih *Mahasiswa*: Wajib mengisi **Nama Institusi** dan **Nomor Induk Mahasiswa (NIM)**.
    *   Jika memilih *Anggota PERSADIA*: Wajib mengisi **Nomor KTP (16 digit)**, **Nama Cabang PERSADIA**, dan memilih **Slot Waktu Cek Gula Darah**.
    *   Jika memilih *Masyarakat Umum*: Wajib mengisi **Nomor KTP (16 digit)** dan memilih **Slot Waktu Cek Gula Darah**.
*   **Pilihan Slot Waktu Cek Gula Darah (Gratis):**
    *   Sesi Pagi I: 06:00 - 07:30
    *   Sesi Pagi II: 07:30 - 09:00
    *   Sesi Pagi III: 09:00 - 10:30
    *   Sesi Siang: 10:30 - 12:00

### 6.2 Langkah 2: Alur Pembayaran & Kode Unik (Billing)
*   **Logika Perhitungan Tagihan:**
    1.  Sistem menentukan harga dasar berdasarkan *Kategori*, *Pilihan Kegiatan*, dan *Tanggal Hari Ini* (mendeteksi otomatis apakah masuk periode Early Bird atau Onsite).
    2.  Sistem menghasilkan **3 digit kode unik acak** berkisar dari `100` hingga `999`.
    3.  **Total Akhir Transfer = Harga Dasar + Kode Unik**.
        *   *Contoh:* Kategori Mahasiswa (Symposium Early Bird = Rp 600.000) mendapat kode unik `509`, maka Total Akhir Transfer adalah **Rp 600.509**.
*   **Detail Rekening Bank Resmi:**
    *   **Nama Bank:** Bank Victoria
    *   **Nomor Rekening:** `2101022971`
    *   **Atas Nama:** Perkumpulan Diabetes Inisiatif
*   *Catatan Penting:* Pengguna disajikan tombol sekali-klik untuk menyalin Nomor Rekening dan menyalin nominal Total Akhir Transfer guna menghindari kesalahan ketik manual.

### 6.3 Langkah 3: Unggah Bukti (Upload)
*   Mendukung mekanisme drag-and-drop file atau penjelajah file manual.
*   **File Bukti yang Diperlukan:**
    1.  **Bukti Transfer (Wajib):** Gambar tangkapan layar (screenshot) atau foto bukti transaksi pembayaran.
    2.  **Bukti Status Mahasiswa (Opsional/Bersyarat):** File/foto Kartu Tanda Mahasiswa (KTM) aktif (hanya diwajibkan bagi pendaftar dengan kategori *Mahasiswa*).

### 6.4 Langkah 4: Selesai (Konfirmasi)
*   **Pembuatan Nomor Registrasi (ID):**
    Sistem menerbitkan ID unik berformat **`KNS2026-XXXXX`** di mana `XXXXX` adalah angka acak 5 digit dinamis (berkisar antara `10000` hingga `99999`) untuk mengakomodasi target di atas 10.000 pendaftar tanpa tabrakan ID.
*   Menampilkan ringkasan nomor registrasi, nama lengkap, total akhir transfer yang harus dibayar, serta pemberitahuan bahwa status verifikasi manual oleh bendahara membutuhkan waktu maksimal 1x24 jam.

---

## 7. SISTEM VALIDASI & INTEGRASI GOOGLE SHEET

Semua data pendaftaran disimpan secara langsung ke dalam Google Spreadsheet menggunakan **Google Apps Script Web App** sebagai backend.

### 7.1 Struktur Kolom Google Sheet (Header)
Data pendaftaran disimpan dalam sheet bernama `Pendaftaran_Konas_2026` dengan struktur kolom sebagai berikut:

1.  **A:** No. Registrasi
2.  **B:** Timestamp
3.  **C:** Nama Lengkap
4.  **D:** Email
5.  **E:** No. WhatsApp
6.  **F:** Kategori Peserta (Kategori ID)
7.  **G:** Akses (ilmiah / pesta_rakyat)
8.  **H:** Pilihan Kegiatan (Symposium / Symposium + Workshop)
9.  **I:** Harga Dasar
10. **J:** Kode Unik (3 digit)
11. **K:** Total Akhir (Harga Dasar + Kode Unik)
12. **L:** Status (Pilihan dropdown validasi: `Menunggu Verifikasi`, `Terverifikasi`, `Gagal`)
13. **M:** No. STR
14. **N:** Institusi
15. **O:** No. KTP
16. **P:** Cabang PERSADIA
17. **Q:** Slot Cek Gula
18. **R:** Bukti Mahasiswa (Link URL Drive)
19. **S:** Bukti Transfer (Link URL Drive)
20. **T:** NIM

---

## 8. ALUR NOTIFIKASI EMAIL OTOMATIS (TRIGGERS)

Ketika bendahara mengubah nilai pada kolom **Status (Kolom L)** di Google Sheet, sistem akan memicu pengiriman email otomatis ke alamat email pendaftar.

### 8.1 Email Status: "Terverifikasi" (Berhasil)
*   **Pemicu:** Nilai Kolom L diubah menjadi `Terverifikasi` atau `Berhasil`.
*   **Subjek Email:** `Konfirmasi Pendaftaran Berhasil - KONAS PERSADIA 2026`
*   **Fitur Spesial (E-Ticket / QR Code):**
    Email berformat HTML ini melampirkan QR Code dinamis resmi yang dihasilkan oleh API luar:
    `https://quickchart.io/qr?text=[NOMOR_REGISTRASI]&size=300`
    QR Code ini akan di-scan oleh panitia di lokasi acara (Novotel Bogor atau GOR Pakansari) untuk registrasi ulang cepat.
*   **Isi Email (Struktur Desain):**
    *   Header berwarna hijau toska (#0D9488) bertuliskan **"STATUS: TERVERIFIKASI"**.
    *   Kalimat ucapan selamat bergabung.
    *   Kotak detail registrasi (No. Registrasi, Waktu Daftar, Nama Lengkap, Email, Kategori Peserta, Pilihan Kegiatan, No. STR, dan Institusi).
    *   QR Code di tengah dengan teks instruksi penataran loket registrasi fisik.

### 8.2 Email Status: "Gagal" (Masalah Pembayaran/Dokumen)
*   **Pemicu:** Nilai Kolom L diubah menjadi `Gagal`.
*   **Subjek Email:** `Masalah Verifikasi Pendaftaran - KONAS PERSADIA 2026`
*   **Isi Email (Struktur Desain):**
    *   Header berwarna merah gelap (#E11D48) bertuliskan **"STATUS: GAGAL VERIFIKASI"**.
    *   Pemberitahuan bahwa verifikasi belum berhasil dilakukan karena ketidaksesuaian nominal transfer atau foto bukti pembayaran yang tidak jelas/buram.
    *   **Tindakan Penting:** Instruksi tegas meminta pendaftar untuk membalas email tersebut (*Reply*) dengan melampirkan bukti screenshot atau foto transfer yang valid agar panitia dapat memproses ulang pendaftaran mereka.

---

## 9. SKEMA KEMITRAAN & SPONSORSHIP (PARTNERSHIP)

Acara ini membuka kemitraan industri yang dikelola langsung bersama Seksi Kemitraan Panitia. Berikut spesifikasi paket sponsorship:

### 9.1 Paket Terbuka Nusantara (Sponsor Tunggal Pesta Rakyat)
*   **Sifat:** Eksklusif Tunggal untuk Track Pesta Rakyat (Stadion Pakansari).
*   **Eksposur Terbesar:** Menanggung pengadaan atribut kaos resmi, topi resmi, dan konsumsi box pagi bagi **10.000 peserta senam/jalan sehat**.
*   **Apresiasi Khusus:** Plakat/karya seni lukis eksklusif hasil kreasi seniman nasional **Tamara Geraldine / Wendy Septarina**.
*   **Nilai Paket:** Hubungi Panitia (Negosiasi langsung).

### 9.2 Paket Berjenjang (Tiered Packages)

#### A. Paket Diamond — Rp 350.000.000 (Terbatas 3 Sponsor)
*   **Fasilitas Utama:** Presentasi di sesi Symposium, Workshop, Meet the Expert, & Dinner Symposium. 1 sesi simposium makan siang khusus. Booth premium di Novotel, Tenda sarnavile 5x5m di GOR Pakansari. Logo di slide, banner, kaos & tas.
*   **Apresiasi Khusus:** Karya seni eksklusif Tamara Geraldine / Wendy Septarina.
*   **Fasilitas Peserta:** Gratis pendaftaran 3 peserta ilmiah (symposium + workshop), 100 tiket undangan dinner symposium, 5 voucher konsumsi panitia.

#### B. Paket Sapphire — Rp 250.000.000
*   **Fasilitas Utama:** Presentasi di sesi Symposium & Workshop serta Meet the Expert. Booth pameran Novotel, Tenda sarnavile 5x5m di GOR Pakansari. Logo di slide, banner, kaos & tas.
*   **Apresiasi Khusus:** Karya seni eksklusif Tamara Geraldine / Wendy Septarina.
*   **Fasilitas Peserta:** Gratis pendaftaran 2 peserta ilmiah (symposium + workshop), 50 tiket undangan dinner symposium, 3 voucher konsumsi panitia.

#### C. Paket Ruby — Rp 150.000.000
*   **Fasilitas Utama:** Presentasi di sesi Symposium & Workshop. Booth pameran Novotel, Tenda sarnavile 3x3m GOR Pakansari. Logo di media promosi.
*   **Apresiasi Khusus:** Karya seni eksklusif kreasi Anggota PERSADIA Bogor.
*   **Fasilitas Peserta:** Gratis pendaftaran 1 peserta ilmiah (symposium + workshop), 30 tiket undangan dinner symposium, 2 voucher konsumsi panitia.

#### D. Paket Emerald — Rp 50.000.000
*   **Fasilitas Utama:** Presentasi di sesi Workshop saja. Booth pameran Novotel, Tenda sarnavile 3x3m GOR Pakansari. Logo di media cetak/slide.
*   **Fasilitas Peserta:** Gratis pendaftaran 2 peserta workshop, 20 tiket undangan dinner, 2 voucher konsumsi.

#### E. Paket Topaz — Rp 25.000.000
*   **Fasilitas Utama:** Booth 1 hari di lokasi Novotel Bogor. 1 voucher konsumsi panitia, dan 5 tiket undangan dinner symposium.

#### F. Paket Pendukung (Mitra Lokal / UMKM) — Rp 3.000.000
*   **Fasilitas Utama:** *Area/space only* ukuran 3x3m (tanpa instalasi listrik) di area pameran Novotel Bogor & GOR Pakansari untuk mempromosikan produk lokal terpercaya.

### 9.3 Aturan & Ketentuan Sponsorship
*   **Batas Waktu Pembayaran:** Paling lambat tanggal **23 Oktober 2026** (2 minggu sebelum acara).
*   **Kebijakan Pembatalan:**
    *   Pembatalan pasca 23 Oktober 2026: Dikenakan denda 50% dari nilai kontrak kerja sama.
    *   Pembatalan dalam kurun waktu < 1 minggu sebelum acara: Dikenakan denda 100% (dana hangus sepenuhnya).
*   **Force Majeure:** Pengembalian sisa dana atau negosiasi ulang hanya diperbolehkan jika terjadi pembatalan total akibat bencana alam atau larangan darurat pemerintah.

---

## 10. KONTAK PANITIA RESMI
Untuk keperluan koordinasi pendaftaran, konfirmasi manual, maupun pertanyaan seputar sponsorship, panitia dapat dihubungi melalui:
*   **Email Resmi:** `diabetesinitiativeid@gmail.com`
*   **Nomor WhatsApp:** `0898-0287-820` (Seksi Acara & Registrasi)

---

## 11. STRUKTUR SUSUNAN PANITIA PELAKSANA
*   **Penasehat:**
    1.  Prof. Dr. dr. Achmad Rudijanto, Sp.PD., K-EMD
    2.  Prof. Dr. dr. Sidartawan Soegondo, Sp.PD., K-EMD
    3.  Prof. Dr. dr. Mardi Santoso, Sp.PD., K-EMD
    4.  Prof. dr. Putu Moda Arsana, Sp.PD., K-EMD
    5.  Dr. dr. K Heri Nugroho Hario Seno, Sp.PD., K-EMD
*   **Ketua Umum Panitia Pelaksana (Periode 2026-2029):** dr. Roy Panusunan Sibarani, Sp.PD., K-EMD
*   **Wakil Ketua:** dr. Dicky Levenus Tahapary, Sp.PD., K-EMD, Ph.D
*   **Bendahara:** Ibu Magdalena Vandry & dr. Monika Hartawan
*   **Sekretaris:** dr. William Djauhari & dr. Widya Mandala Sari, Sp.PD
*   **Seksi Acara:** Novry Hetharia, Adisty Wulandari, dr. Maya Kusumawati, Sp.PD., K-EMD, dr. Pandu Tridana Sakti, Sp.PD
*   **Seksi Ilmiah:** Dr. dr. Wismandari, Sp.PD., K-EMD, dr. Johanes Purworto, Sp.PD., K-EMD, dr. Nur Rusyda Kuddah, Sp.PD., K-EMD
*   **Seksi Transportasi:** Mohammad Sidik & Ali Nandho
*   **Seksi Konsumsi:** Susanti Suharto
*   **Seksi Peserta:** Agus Sumitro & Hans Phattua L
*   **Seksi Publikasi:** Steven Wijaya
*   **Seksi Protokol:** dr. Fauzia Kirana, Sp.PD, dr. Maria Sen, dr. Elis Tiahesara

---

## 12. PANDUAN LANGKAH INTEGRASI GOOGLE APPS SCRIPT (STEP-BY-STEP)

Bagi pengembang yang ingin men-deploy sistem sheet ini ke akun Google Sheet baru, ikuti panduan praktis berikut:

### 12.1 Persiapan Google Spreadsheet
1.  Buka [Google Sheets](https://sheets.google.com) dan buat dokumen kosong baru.
2.  Beri nama dokumen tersebut (misal: "Database Pendaftaran KONAS PERSADIA 2026").
3.  Salin **ID Spreadsheet** Anda dari alamat URL browser. ID tersebut adalah deretan karakter acak yang terletak di antara `/d/` dan `/edit` pada alamat URL.
    *   *Contoh URL:* `https://docs.google.com/spreadsheets/d/1oYYnHF7nbGgP__-6xMXc8kvc2QyVBy70ZWt_j5KSexc/edit`
    *   *ID Spreadsheet:* `1oYYnHF7nbGgP__-6xMXc8kvc2QyVBy70ZWt_j5KSexc`

### 12.2 Persiapan Folder Google Drive
1.  Buka [Google Drive](https://drive.google.com) dan buat sebuah folder kosong baru (misal bernama "Bukti Registrasi KONAS 2026"). Folder ini akan otomatis menampung file unggahan foto Bukti Pembayaran & KTM pendaftar.
2.  Buka folder tersebut, lalu salin **ID Folder Drive** dari alamat URL browser (deretan karakter unik di bagian akhir URL setelah `/folders/`).
    *   *ID Folder:* `1vqz4-BZYYZjIT_4UYrSkufNwXz7fUlDj`

### 12.3 Mengonfigurasi Kode Google Apps Script
1.  Di Google Spreadsheet Anda, masuk ke menu **Extensions (Ekstensi) > Apps Script**.
2.  Hapus semua kode default `function myFunction() {}` yang ada pada file `Code.gs`.
3.  Salin seluruh kode Apps Script yang disediakan panitia (dari file `GOOGLE_APPS_SCRIPT.gs` di root repositori ini) dan tempelkan (*paste*) ke dalam editor.
4.  Sesuaikan dua variabel konstanta di baris paling atas kode dengan ID milik Anda:
    ```javascript
    // GANTI DENGAN ID FOLDER GOOGLE DRIVE ANDA
    const DRIVE_FOLDER_ID = "ID_FOLDER_GOOGLE_DRIVE_ANDA";

    // GANTI DENGAN ID SPREADSHEET ANDA
    const SPREADSHEET_ID = "ID_SPREADSHEET_ANDA";
    ```
5.  Klik ikon **Save (Simpan / Gambar Disket)** di bagian atas editor.

### 12.4 Mendeploy sebagai Aplikasi Web (Web App)
1.  Klik tombol **Deploy** di sudut kanan atas editor, lalu pilih **New deployment**.
2.  Klik ikon gerigi (**Select type**) dan pilih **Web app**.
3.  Konfigurasikan setelan deployment sebagai berikut:
    *   **Description:** Portal Web Registrasi Konas 2026
    *   **Execute as:** *Me (Email anda)*
    *   **Who has access:** *Anyone (Siapa saja)*
4.  Klik tombol **Deploy**.
5.  Sebuah jendela otorisasi akan muncul meminta izin akses akun Google Anda untuk membaca spreadsheet, membuat file di Drive, dan mengirim email atas nama Anda. Klik **Authorize access**, pilih akun Google Anda, klik tautan kecil **Advanced (Lanjutan)** di kiri bawah, lalu klik **Go to ... (Unsafe)**, dan terakhir klik **Allow**.
6.  Salin **URL Web App** yang dihasilkan pada layar konfirmasi terakhir (URL ini diakhiri dengan `/exec`). Simpan URL tersebut pada variabel lingkungan portal web Anda (`VITE_GOOGLE_SHEET_WEBAPP_URL`).

### 12.5 Membuat Trigger Otomatis untuk Mengirim Email (onEditStatus)
Agar email konfirmasi otomatis dapat dikirimkan saat kolom status pendaftaran diubah, Anda wajib mengaktifkan trigger pengenalan edit di Apps Script:
1.  Pada menu navigasi kiri editor Apps Script, klik ikon **Triggers (ikon Jam dinding)**.
2.  Klik tombol **Add Trigger (Tambahkan Pemicu)** di pojok kanan bawah.
3.  Lakukan pengaturan pemicu sebagai berikut:
    *   *Choose which function to run:* **onEditStatus**
    *   *Choose which deployment to run:* **Head**
    *   *Select event source:* **From spreadsheet**
    *   *Select event type:* **On edit**
4.  Klik tombol **Save**. Berikan otorisasi izin sekali lagi jika diminta.
5.  Selesai! Sistem akan memantau setiap perubahan status pendaftaran dan mengirimkan email konfirmasi terperinci (beserta QR Code) atau penolakan dengan instruksi jelas secara otomatis.
