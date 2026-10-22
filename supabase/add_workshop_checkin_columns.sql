-- ==============================================================================
-- MIGRASI PENAMBAHAN KOLOM PRESENSI WORKSHOP PADA TABEL PENDAFTAR
-- Proyek: KONAS PERSADIA 2026
-- ==============================================================================

-- 1. Tambahkan kolom kehadiran_workshop jika belum ada
ALTER TABLE pendaftar
ADD COLUMN IF NOT EXISTS kehadiran_workshop TEXT;

-- 2. Tambahkan kolom waktu_kehadiran_workshop jika belum ada
ALTER TABLE pendaftar
ADD COLUMN IF NOT EXISTS waktu_kehadiran_workshop TEXT;

-- 3. Beri komentar dokumentasi kolom
COMMENT ON COLUMN pendaftar.kehadiran_workshop IS 'Status kehadiran peserta pada ruangan sesi workshop medis terapan ("Ya" atau NULL)';
COMMENT ON COLUMN pendaftar.waktu_kehadiran_workshop IS 'Stempel waktu ISO 8601 saat peserta melakukan presensi di meja/pintu workshop';

-- 4. Indeks opsional untuk query performa presensi workshop
CREATE INDEX IF NOT EXISTS idx_pendaftar_kehadiran_workshop 
ON pendaftar(kehadiran_workshop) 
WHERE kehadiran_workshop = 'Ya';
