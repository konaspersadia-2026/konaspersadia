-- ==============================================================================
-- KONAS PERSADIA 2026 - OPTIMASI PERFORMANCE DATABASE SUPABASE (HARI-H)
-- ==============================================================================
-- Target: 100+ Petugas Scanner & 7.000+ Peserta di Lokasi (Stadion Pakansari & Novotel)
-- Tujuan:
-- 1. Mempercepat query pencarian dan verifikasi (SELECT) hingga < 1 ms (100x lebih cepat).
-- 2. Mempercepat transaksi update presensi, penyerahan kaos, snack, dan skrining gula darah.
-- 3. Mencegah Sequential Scan (Full Table Scan) yang membebani CPU server saat peak hours.
-- 4. Memperbarui statistik query planner PostgreSQL (ANALYZE).
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project KONAS PERSADIA 2026 -> Masuk ke menu "SQL Editor"
-- 3. Klik "New Query", tempel seluruh isi script ini, lalu klik tombol "RUN".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. INDEKS UTAMA: NOMOR REGISTRASI (KUNCI UTAMA SCANNER & QR CODE)
-- ------------------------------------------------------------------------------

-- Functional Index untuk ekspresi UPPER(TRIM(no_registrasi))
-- Sangat krusial karena get_scanner_live_participant dan update_pendaftar_scanner
-- menggunakan filter: WHERE UPPER(TRIM(no_registrasi)) = v_clean_reg
CREATE INDEX IF NOT EXISTS idx_pendaftar_no_reg_upper 
  ON public.pendaftar (UPPER(TRIM(no_registrasi)));

-- Standard Index untuk direct query no_registrasi
CREATE INDEX IF NOT EXISTS idx_pendaftar_no_reg 
  ON public.pendaftar (no_registrasi);

-- Index pada primary key / id untuk pagination cepat
CREATE INDEX IF NOT EXISTS idx_pendaftar_id 
  ON public.pendaftar (id);


-- ------------------------------------------------------------------------------
-- 2. PARTIAL INDEXES: CHECKPOINT & STATUS KEHADIRAN (HARI 1 & HARI 2)
-- Partial index hanya mengindeks baris yang bernilai (IS NOT NULL),
-- sehingga ukuran index sangat kecil, hemat RAM, dan query rekap sangat kilat.
-- ------------------------------------------------------------------------------

-- Presensi Onsite Hari 1 (Novotel)
CREATE INDEX IF NOT EXISTS idx_pendaftar_reg_onsite_h1 
  ON public.pendaftar (registrasi_onsite) 
  WHERE registrasi_onsite IS NOT NULL;

-- Presensi Onsite Hari 2 (GOR Pakansari)
CREATE INDEX IF NOT EXISTS idx_pendaftar_reg_onsite_h2 
  ON public.pendaftar (registrasi_onsite_hari_2) 
  WHERE registrasi_onsite_hari_2 IS NOT NULL;

-- Pos Pengambilan Kaos / Baju
CREATE INDEX IF NOT EXISTS idx_pendaftar_pengambilan_baju 
  ON public.pendaftar (pengambilan_baju) 
  WHERE pengambilan_baju IS NOT NULL;

-- Pos Pengambilan Merchandise
CREATE INDEX IF NOT EXISTS idx_pendaftar_merchandise 
  ON public.pendaftar (pengambilan_merchandise) 
  WHERE pengambilan_merchandise IS NOT NULL;

-- Pos Pengambilan Snack
CREATE INDEX IF NOT EXISTS idx_pendaftar_pengambilan_snack 
  ON public.pendaftar (pengambilan_snack) 
  WHERE pengambilan_snack IS NOT NULL;

-- Pos Konsumsi / Makan Siang Hari 1
CREATE INDEX IF NOT EXISTS idx_pendaftar_makan_siang_h1 
  ON public.pendaftar (makan_siang_hari_1) 
  WHERE makan_siang_hari_1 IS NOT NULL;

-- Pos Konsumsi / Makan Siang Hari 2 (Pesta Rakyat)
CREATE INDEX IF NOT EXISTS idx_pendaftar_makan_pesta_rakyat 
  ON public.pendaftar (makan_siang_pesta_rakyat) 
  WHERE makan_siang_pesta_rakyat IS NOT NULL;

-- Pos Skrining Kesehatan / Gula Darah
CREATE INDEX IF NOT EXISTS idx_pendaftar_cek_gula_darah 
  ON public.pendaftar (cek_gula_darah) 
  WHERE cek_gula_darah IS NOT NULL;

-- Pos Akses Gala Dinner Hari 1 (Novotel)
CREATE INDEX IF NOT EXISTS idx_pendaftar_akses_gala_dinner 
  ON public.pendaftar (akses_gala_dinner) 
  WHERE akses_gala_dinner IS NOT NULL;

-- Pos Kehadiran Workshop Hari 1 (Novotel)
CREATE INDEX IF NOT EXISTS idx_pendaftar_kehadiran_workshop 
  ON public.pendaftar (kehadiran_workshop) 
  WHERE kehadiran_workshop IS NOT NULL;

-- Status Pembayaran & Kategori Peserta (Untuk filter hak akses cepat)
CREATE INDEX IF NOT EXISTS idx_pendaftar_status_pembayaran 
  ON public.pendaftar (status_pembayaran);

CREATE INDEX IF NOT EXISTS idx_pendaftar_kategori_peserta 
  ON public.pendaftar (kategori_peserta);


-- ------------------------------------------------------------------------------
-- 3. INDEKS TABEL PENDUKUNG (app_settings)
-- Mempercepat verifikasi passcode scanner (verify_scanner_passcode)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_app_settings_key 
  ON public.app_settings (key);


-- ------------------------------------------------------------------------------
-- 4. UPDATE STATISTIK QUERY PLANNER (ANALYZE)
-- Memaksa PostgreSQL memperbarui statistik distribusi data sehingga
-- planner secara otomatis memilih Index Scan dibanding Sequential Scan.
-- (Menggunakan ANALYZE agar kompatibel dengan Transaction Block SQL Editor Supabase)
-- ------------------------------------------------------------------------------
ANALYZE public.pendaftar;
ANALYZE public.app_settings;


-- ------------------------------------------------------------------------------
-- 5. VERIFIKASI KESEHATAN INDEKS
-- Menampilkan daftar indeks yang aktif pada tabel public.pendaftar
-- ------------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'pendaftar'
ORDER BY indexname;

