-- ==========================================================================
-- SCRIPT PENGHAPUSAN BERSIH 500 DATA PESERTA DUMMY SIMULASI GULA DARAH
-- Menghapus hanya data yang memiliki awalan no_registrasi 'KNS2026-SIM-%'
-- Data riil 7.000+ peserta tetap 100% aman dan tidak tersentuh
-- ==========================================================================

BEGIN;

DELETE FROM pendaftar
WHERE no_registrasi LIKE 'KNS2026-SIM-%';

COMMIT;

-- Verifikasi: Pastikan hasil query di bawah menghasilkan angka 0 (nol)
SELECT COUNT(*) AS sisa_data_simulasi FROM pendaftar WHERE no_registrasi LIKE 'KNS2026-SIM-%';
