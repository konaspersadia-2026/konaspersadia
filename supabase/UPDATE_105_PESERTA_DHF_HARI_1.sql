-- ==============================================================================
-- KONAS PERSADIA 2026 - UPDATE AKSES SESI DHF & MAKAN SIANG HARI 1 (105 PESERTA)
-- Tanggal Acara: Sabtu, 7 November 2026 (Ballroom 2 Novotel Bogor)
-- Target: 105 Peserta (PERSADIA Cabang Bogor & Umum)
-- Sesuai Struktur Tabel Asli: TIDAK MENAMBAH KOLOM BARU DI TABEL PUBLIC.PENDAFTAR
-- Kolom yang di-update (seluruhnya sudah ada di tabel):
--   1. pilihan_kegiatan  -> 'Pesta Rakyat + Diabetes Health Forum' (Opsi A)
--   2. ikut_health_talk  -> true (Parameter DHF untuk Scanner)
--   3. mode_kehadiran    -> 'Onsite' (Memastikan tiket fisik/tatap muka)
--   4. status_pembayaran -> 'Lunas' (Syarat mutlak lolos validasi scanner)
-- ==============================================================================

UPDATE public.pendaftar
SET
    pilihan_kegiatan  = 'Pesta Rakyat + Diabetes Health Forum',
    ikut_health_talk  = true,
    mode_kehadiran    = 'Onsite',
    status_pembayaran = 'Lunas'
WHERE no_registrasi IN (
    'KNS2026-80220', -- 1. SUSANTI
    'KNS2026-85267', -- 2. Susantisuharto
    'KNS2026-89542', -- 3. Boedi Setijo Karijadi
    'KNS2026-99161', -- 4. Syaifuddin Qadri
    'KNS2026-59549', -- 5. Slamet Santosa
    'KNS2026-37574', -- 6. Wargantono Adhi
    'KNS2026-93337', -- 7. Palupi
    'KNS2026-71597', -- 8. Sumiatun
    'KNS2026-11598', -- 9. Supiah
    'KNS2026-97449', -- 10. Nina Maria Ulfah
    'KNS2026-37781', -- 11. Desmaria
    'KNS2026-66750', -- 12. Siti mai iriani
    'KNS2026-64885', -- 13. Lia Yuliawati
    'KNS2026-94543', -- 14. Sylviana T Ticoalu
    'KNS2026-51494', -- 15. Neneng Nazmiyati
    'KNS2026-15061512', -- 16. Nuning
    'KNS2026-65018754', -- 17. Arlina
    'KNS2026-62615', -- 18. Yos Syahmiarti
    'KNS2026-89266', -- 19. Nenah mulyanti
    'KNS2026-20352', -- 20. Tati Gustinah
    'KNS2026-99932082', -- 21. PONIYATI
    'KNS2026-20795', -- 22. Saptariah
    'KNS2026-40532', -- 23. Jajat sudrajat
    'KNS2026-68577', -- 24. Apriyanti
    'KNS2026-59031', -- 25. SUTIYAH
    'KNS2026-64483', -- 26. Eneh
    'KNS2026-37525', -- 27. Nani
    'KNS2026-65952', -- 28. atmah
    'KNS2026-34620', -- 29. Hamidah
    'KNS2026-57675', -- 30. Titin Supriatin
    'KNS2026-68205', -- 31. Mintarsih
    'KNS2026-67308', -- 32. Neneng Sumiati
    'KNS2026-33342', -- 33. Ilah
    'KNS2026-96126591', -- 34. Hj Nurhaida Wicky
    'KNS2026-44531', -- 35. Nuryanah
    'KNS2026-74781', -- 36. H.NUR AINI
    'KNS2026-85314558', -- 37. KADEMI
    'KNS2026-55432', -- 38. Helminah
    'KNS2026-53551305', -- 39. Ika Sartika
    'KNS2026-13589', -- 40. Nurhayati
    'KNS2026-32904', -- 41. Khairun Nisa
    'KNS2026-51716', -- 42. Enung Ratna Ningrum
    'KNS2026-75699', -- 43. Tini Sumartini
    'KNS2026-11441', -- 44. Winiarsih
    'KNS2026-54848', -- 45. Heni Wijaya
    'KNS2026-95276', -- 46. Anima Harmoni
    'KNS2026-39122', -- 47. Enti Supartiah
    'KNS2026-24657', -- 48. HERAWATI
    'KNS2026-11573', -- 49. Nicke Noviani
    'KNS2026-76338', -- 50. Hj.yatmi
    'KNS2026-71116', -- 51. DARSIAH
    'KNS2026-76985', -- 52. Iim Holisoh
    'KNS2026-57380', -- 53. Endang Sriyati
    'KNS2026-79603', -- 54. Farida
    'KNS2026-10560', -- 55. Sri Susilawaty
    'KNS2026-70474', -- 56. Nurhayati
    'KNS2026-67717', -- 57. Debbie Marlyn Ticoalu
    'KNS2026-39979', -- 58. Tuti Restuningsih
    'KNS2026-15570', -- 59. Agustini
    'KNS2026-64671', -- 60. Nia Aryani R
    'KNS2026-19173', -- 61. Nina kania
    'KNS2026-68329', -- 62. Ana kusmaryati
    'KNS2026-62155', -- 63. ELIS SUSILAWATI
    'KNS2026-69558', -- 64. Nina mardiana
    'KNS2026-43146', -- 65. Yulia
    'KNS2026-53271', -- 66. Wiwiek Widiastutik
    'KNS2026-29132', -- 67. Suliyah suhaeti
    'KNS2026-69243', -- 68. Neneng Hodijah
    'KNS2026-75119', -- 69. Sri Hastuti
    'KNS2026-79592', -- 70. Suwarni Suhartini
    'KNS2026-81278', -- 71. Destaruna
    'KNS2026-63640', -- 72. Diana makuntari
    'KNS2026-37757', -- 73. Hj. Yuliani Triningsih
    'KNS2026-86974', -- 74. Latifatul Khoiriyah
    'KNS2026-68245', -- 75. DEDEH SIDAH HAYATI
    'KNS2026-62395', -- 76. Barliah
    'KNS2026-84773', -- 77. Ismawati
    'KNS2026-53979', -- 78. Erna Burhanuddin
    'KNS2026-72330', -- 79. sri yuliah
    'KNS2026-76626', -- 80. Tri Nuryanti
    'KNS2026-41987', -- 81. Sumiyati
    'KNS2026-38312', -- 82. Juliyah
    'KNS2026-14511', -- 83. Rasmiyati
    'KNS2026-68535', -- 84. Sri Warsiati
    'KNS2026-18455', -- 85. Sriningsih
    'KNS2026-28701', -- 86. Tati Mulyati
    'KNS2026-65186', -- 87. Mulyantini
    'KNS2026-83656', -- 88. Nurtaviani
    'KNS2026-21593', -- 89. Maryati
    'KNS2026-97780', -- 90. Yuti sutari
    'KNS2026-84198', -- 91. Yatik Pipih
    'KNS2026-88385', -- 92. Lilih Solihat
    'KNS2026-36775', -- 93. Listuti(Euis)
    'KNS2026-81537', -- 94. Kusrianingsih
    'KNS2026-59622', -- 95. Ade romlah
    'KNS2026-15889', -- 96. Yati mulyati
    'KNS2026-13987', -- 97. Rosita
    'KNS2026-20903', -- 98. Imas masitoh
    'KNS2026-89474', -- 99. Sri handayani
    'KNS2026-75437', -- 100. Suwarti
    'KNS2026-91892', -- 101. Sugiyarni Rika
    'KNS2026-45803', -- 102. Sri Warsini
    'KNS2026-92755', -- 103. Enih nuraeni
    'KNS2026-21287', -- 104. Anin Sumarni
    'KNS2026-49817' -- 105. Nursiah
);

-- ------------------------------------------------------------------------------
-- VERIFIKASI HASIL UPDATE 105 PESERTA DHF
-- ------------------------------------------------------------------------------
SELECT 
    id,
    no_registrasi,
    nama_lengkap,
    kategori_peserta,
    pilihan_kegiatan,
    ikut_health_talk,
    mode_kehadiran,
    status_pembayaran,
    cabang_persadia
FROM public.pendaftar
WHERE no_registrasi IN (
    'KNS2026-80220',
    'KNS2026-85267',
    'KNS2026-89542',
    'KNS2026-99161',
    'KNS2026-59549',
    'KNS2026-37574',
    'KNS2026-93337',
    'KNS2026-71597',
    'KNS2026-11598',
    'KNS2026-97449',
    'KNS2026-37781',
    'KNS2026-66750',
    'KNS2026-64885',
    'KNS2026-94543',
    'KNS2026-51494',
    'KNS2026-15061512',
    'KNS2026-65018754',
    'KNS2026-62615',
    'KNS2026-89266',
    'KNS2026-20352',
    'KNS2026-99932082',
    'KNS2026-20795',
    'KNS2026-40532',
    'KNS2026-68577',
    'KNS2026-59031',
    'KNS2026-64483',
    'KNS2026-37525',
    'KNS2026-65952',
    'KNS2026-34620',
    'KNS2026-57675',
    'KNS2026-68205',
    'KNS2026-67308',
    'KNS2026-33342',
    'KNS2026-96126591',
    'KNS2026-44531',
    'KNS2026-74781',
    'KNS2026-85314558',
    'KNS2026-55432',
    'KNS2026-53551305',
    'KNS2026-13589',
    'KNS2026-32904',
    'KNS2026-51716',
    'KNS2026-75699',
    'KNS2026-11441',
    'KNS2026-54848',
    'KNS2026-95276',
    'KNS2026-39122',
    'KNS2026-24657',
    'KNS2026-11573',
    'KNS2026-76338',
    'KNS2026-71116',
    'KNS2026-76985',
    'KNS2026-57380',
    'KNS2026-79603',
    'KNS2026-10560',
    'KNS2026-70474',
    'KNS2026-67717',
    'KNS2026-39979',
    'KNS2026-15570',
    'KNS2026-64671',
    'KNS2026-19173',
    'KNS2026-68329',
    'KNS2026-62155',
    'KNS2026-69558',
    'KNS2026-43146',
    'KNS2026-53271',
    'KNS2026-29132',
    'KNS2026-69243',
    'KNS2026-75119',
    'KNS2026-79592',
    'KNS2026-81278',
    'KNS2026-63640',
    'KNS2026-37757',
    'KNS2026-86974',
    'KNS2026-68245',
    'KNS2026-62395',
    'KNS2026-84773',
    'KNS2026-53979',
    'KNS2026-72330',
    'KNS2026-76626',
    'KNS2026-41987',
    'KNS2026-38312',
    'KNS2026-14511',
    'KNS2026-68535',
    'KNS2026-18455',
    'KNS2026-28701',
    'KNS2026-65186',
    'KNS2026-83656',
    'KNS2026-21593',
    'KNS2026-97780',
    'KNS2026-84198',
    'KNS2026-88385',
    'KNS2026-36775',
    'KNS2026-81537',
    'KNS2026-59622',
    'KNS2026-15889',
    'KNS2026-13987',
    'KNS2026-20903',
    'KNS2026-89474',
    'KNS2026-75437',
    'KNS2026-91892',
    'KNS2026-45803',
    'KNS2026-92755',
    'KNS2026-21287',
    'KNS2026-49817'
)
ORDER BY nama_lengkap ASC;
