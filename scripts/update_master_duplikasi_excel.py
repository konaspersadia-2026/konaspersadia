#!/usr/bin/env python3
"""
update_master_duplikasi_excel.py
Memperbarui LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx
agar selaras dengan hasil audit ketat:
- 2 Duplikasi Lintas Berkas Definitif (Kusmiati & Mimi Sopiati)
- Rekapitulasi 15 Kontingen Sah (Total 6.273 Kaos)
- Daftar Homonim Direhabilitasi (termasuk CI EMI, Rosmida, Syamsu Alam, Mujenah, Diana, Yuyun)
"""

import os
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

BASE_DIR = "Data peserta/Data pengambilan baju"
XLSX_PATH = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx")

wb = openpyxl.Workbook()

# Styles
font_super = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_sub = Font(name="Calibri", size=9.5, bold=True)
font_data = Font(name="Calibri", size=9.5)
font_bold = Font(name="Calibri", size=9.5, bold=True)
font_code = Font(name="Consolas", size=9.5, bold=True)

fill_master_super = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
fill_master_sub = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")

fill_sah_super = PatternFill(start_color="1E4620", end_color="1E4620", fill_type="solid")
fill_sah_sub = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")

fill_kuning_super = PatternFill(start_color="8A6D3B", end_color="8A6D3B", fill_type="solid")
fill_kuning_sub = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")

fill_eval_super = PatternFill(start_color="34495E", end_color="34495E", fill_type="solid")
fill_eval_sub = PatternFill(start_color="EAECEE", end_color="EAECEE", fill_type="solid")

fill_rekom_super = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid")
fill_rekom_sub = PatternFill(start_color="E5E7E9", end_color="E5E7E9", fill_type="solid")

fill_row_even = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
fill_row_odd = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")

thin_border_side = Side(border_style="thin", color="D3D3D3")
thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

# -----------------------------------------------------------------------------
# SHEET 1: Duplikasi Definitif Lintas Berkas (2 Kasus)
# -----------------------------------------------------------------------------
ws1 = wb.active
ws1.title = "Duplikasi Definitif (2 Kasus)"

super_headers_ws1 = [
    (1, 5, "DATA MASTER ACUAN SISTEM (MASTER ODS)", fill_master_super),
    (6, 11, "DOKUMEN A: KONTINGEN PENYERAH (HAK SAH)", fill_sah_super),
    (12, 17, "DOKUMEN B: KONTINGEN DIALIHKAN (STATUS KUNING)", fill_kuning_super),
    (18, 22, "PARAMETER KOMPARASI & HASIL EVALUASI", fill_eval_super),
    (23, 25, "KEPUTUSAN PANITIA & INSTRUKSI OPERASIONAL", fill_rekom_super),
]

for sc, ec, title, f_col in super_headers_ws1:
    ws1.merge_cells(start_row=1, start_column=sc, end_row=1, end_column=ec)
    c = ws1.cell(1, sc)
    c.value = title; c.font = font_super; c.fill = f_col; c.alignment = align_center
    for col in range(sc, ec + 1):
        ws1.cell(1, col).border = thin_border; ws1.cell(1, col).fill = f_col

headers_ws1 = [
    ("No", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("No. Registrasi ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Nama Lengkap di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_left),
    ("No. WhatsApp di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Cabang Resmi di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_left),
    
    ("Kontingen Penyerah (Hak Sah)", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Nama di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("No. HP di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Tgl. Lahir Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Cabang / Unit di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Posisi Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    
    ("Kontingen Dialihkan (Kuning)", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Tgl. Lahir Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Cabang / Unit di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("Posisi Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    
    ("Evaluasi Kesamaan Nama", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi Kesamaan No. HP", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi Tanggal Lahir", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("SKALA KESAMAAN", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("KATEGORI", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    
    ("Pertimbangan Objektif Panitia", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Instruksi Operasional Lapangan", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Dasar Verifikasi Sistem", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
]

for col_idx, (h_title, h_fill, h_font, h_align) in enumerate(headers_ws1, 1):
    c = ws1.cell(2, col_idx)
    c.value = h_title; c.fill = h_fill; c.font = h_font; c.alignment = h_align; c.border = thin_border

ws1.row_dimensions[1].height = 28
ws1.row_dimensions[2].height = 34

definitif_data = [
    {
        "no": 1, "reg": "KNS2026-66667866", "nama_ods": "KUSMIATI", "wa_ods": "082110859972", "cab_ods": "Kormi & DIID",
        "k_sah": "KORMI & DIID", "nama_sah": "Ati (KUSMIATI)", "hp_sah": "082110859972", "bd_sah": "13/04/1979", "unit_sah": "DIID - DKI JAKARTA", "pos_sah": "No. 322",
        "k_kun": "Jakarta Timur", "nama_kun": "Kusmiati", "hp_kun": "082110859972", "bd_kun": "13/04/1979", "unit_kun": "PKM UNIT SETU", "pos_kun": "No. 207",
        "eval_nama": "Identik (Panggilan 'Ati')", "eval_hp": "Sama Persis (082110859972)", "eval_bd": "Sama Persis (13/04/1979)",
        "scale": 5, "kategori": "5 - SANGAT KUAT (Identik)",
        "pertimbangan": "Semua 4 parameter (Nama, HP, Jenis Kelamin, Tanggal Lahir) cocok sempurna.",
        "instruksi": "Hak kaos diserahkan 1x melalui KORMI & DIID. Jatah di Jakarta Timur dialihkan (Kuning).",
        "dasar": "Database ODS resmi terdaftar di Kormi & DIID."
    },
    {
        "no": 2, "reg": "KNS2026-56854302", "nama_ods": "MIMI SOPIATI", "wa_ods": "081386214460", "cab_ods": "PERSADIA Cabang Kota Depok",
        "k_sah": "Depok", "nama_sah": "Mimi Supiati", "hp_sah": "081386214460", "bd_sah": "11/03/1959", "unit_sah": "Klinik Prima Husada (Unit #11)", "pos_sah": "No. 2853",
        "k_kun": "Jakarta Selatan", "nama_kun": "MIMI SOPIATI", "hp_kun": "081386214460", "bd_kun": "11/03/1959", "unit_kun": "RS Prikasih", "pos_kun": "No. 112",
        "eval_nama": "Identik Fonetik (Supiati vs Sopiati)", "eval_hp": "Sama Persis (081386214460)", "eval_bd": "Sama Persis (11/03/1959)",
        "scale": 5, "kategori": "5 - SANGAT KUAT (Identik)",
        "pertimbangan": "Semua 4 parameter cocok sempurna, variasi nama hanya 1 huruf vokal fonetik.",
        "instruksi": "Hak kaos diserahkan 1x melalui Depok. Jatah di Jakarta Selatan dialihkan (Kuning).",
        "dasar": "Database ODS terdaftar di Cabang Depok."
    }
]

for row_idx, d in enumerate(definitif_data, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    row_vals = [
        (d["no"], font_bold, align_center, bg_row),
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["wa_ods"], font_data, align_center, bg_row),
        (d["cab_ods"], font_data, align_left, bg_row),
        (d["k_sah"], font_bold, align_center, bg_row),
        (d["nama_sah"], font_bold, align_left, bg_row),
        (d["hp_sah"], font_data, align_center, bg_row),
        (d["bd_sah"], font_data, align_center, bg_row),
        (d["unit_sah"], font_data, align_left, bg_row),
        (d["pos_sah"], font_data, align_center, bg_row),
        (d["k_kun"], font_bold, align_center, bg_row),
        (d["nama_kun"], font_bold, align_left, bg_row),
        (d["hp_kun"], font_data, align_center, bg_row),
        (d["bd_kun"], font_data, align_center, bg_row),
        (d["unit_kun"], font_data, align_left, bg_row),
        (d["pos_kun"], font_data, align_center, bg_row),
        (d["eval_nama"], font_data, align_left, bg_row),
        (d["eval_hp"], font_data, align_left, bg_row),
        (d["eval_bd"], font_data, align_left, bg_row),
        (d["scale"], Font(name="Calibri", size=11, bold=True, color="155724"), align_center, PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid")),
        (d["kategori"], Font(name="Calibri", size=9.5, bold=True, color="155724"), align_center, PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid")),
        (d["pertimbangan"], font_data, align_left, bg_row),
        (d["instruksi"], font_data, align_left, bg_row),
        (d["dasar"], font_data, align_left, bg_row),
    ]
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_vals, 1):
        cell = ws1.cell(row_idx, c_idx)
        cell.value = val; cell.font = c_font; cell.alignment = c_align; cell.fill = c_fill; cell.border = thin_border

col_widths = {
    1: 6, 2: 18, 3: 22, 4: 16, 5: 25,
    6: 18, 7: 22, 8: 16, 9: 15, 10: 28, 11: 12,
    12: 18, 13: 22, 14: 16, 15: 15, 16: 28, 17: 12,
    18: 24, 19: 24, 20: 24, 21: 14, 22: 26,
    23: 35, 24: 35, 25: 30
}
for col_idx, width in col_widths.items():
    ws1.column_dimensions[get_column_letter(col_idx)].width = width

# -----------------------------------------------------------------------------
# SHEET 2: Ringkasan Resmi Kuota 15 Kontingen
# -----------------------------------------------------------------------------
ws2 = wb.create_sheet(title="Rekapitulasi Kuota 15 Kontingen")

ws2.merge_cells("A1:G1")
ws2.cell(1, 1).value = "REKAPITULASI RESMI KUOTA KAOS SAH 15 KONTINGEN (AUDIT KETAT)"
ws2.cell(1, 1).font = Font(name="Calibri", size=13, bold=True, color="FFFFFF")
ws2.cell(1, 1).fill = fill_master_super
ws2.cell(1, 1).alignment = align_center

h_ws2 = ["No", "Nama Kontingen", "Total Pendaftar Berkas", "Terdaftar di ODS", "Belum di ODS", "Duplikat", "Total Kuota Kaos Sah"]
for col_idx, title in enumerate(h_ws2, 1):
    c = ws2.cell(2, col_idx)
    c.value = title; c.font = font_sub; c.fill = fill_master_sub; c.alignment = align_center; c.border = thin_border

rekap_15 = [
    (1, "Depok", 2859, 2859, 0, 2, 2857),
    (2, "Bogor", 1242, 1230, 12, 0, 1230),
    (3, "Jakarta Timur", 585, 568, 17, 2, 566),
    (4, "KORMI & DIID", 486, 486, 0, 1, 485),
    (5, "Bekasi", 378, 378, 0, 0, 378),
    (6, "Jakarta Selatan", 250, 245, 5, 1, 244),
    (7, "Purwakarta", 121, 117, 4, 0, 117),
    (8, "Sumedang", 100, 100, 0, 0, 100),
    (9, "Ciamis", 93, 93, 0, 0, 93),
    (10, "Jakarta Barat", 80, 80, 0, 0, 80),
    (11, "Cimahi", 63, 63, 0, 0, 63),
    (12, "Cianjur", 29, 29, 0, 0, 29),
    (13, "Subang", 43, 42, 1, 0, 42),
    (14, "Karawang", 4, 4, 0, 0, 4),
    (15, "Gorontalo", 3, 3, 0, 0, 3),
]

for idx, r in enumerate(rekap_15, 3):
    bg_row = fill_row_even if idx % 2 == 1 else fill_row_odd
    ws2.cell(idx, 1).value = r[0]; ws2.cell(idx, 1).font = font_bold; ws2.cell(idx, 1).alignment = align_center; ws2.cell(idx, 1).fill = bg_row; ws2.cell(idx, 1).border = thin_border
    ws2.cell(idx, 2).value = r[1]; ws2.cell(idx, 2).font = font_bold; ws2.cell(idx, 2).alignment = align_left; ws2.cell(idx, 2).fill = bg_row; ws2.cell(idx, 2).border = thin_border
    ws2.cell(idx, 3).value = r[2]; ws2.cell(idx, 3).font = font_data; ws2.cell(idx, 3).alignment = align_center; ws2.cell(idx, 3).fill = bg_row; ws2.cell(idx, 3).border = thin_border
    ws2.cell(idx, 4).value = r[3]; ws2.cell(idx, 4).font = font_data; ws2.cell(idx, 4).alignment = align_center; ws2.cell(idx, 4).fill = bg_row; ws2.cell(idx, 4).border = thin_border
    ws2.cell(idx, 5).value = r[4]; ws2.cell(idx, 5).font = font_data; ws2.cell(idx, 5).alignment = align_center; ws2.cell(idx, 5).fill = bg_row; ws2.cell(idx, 5).border = thin_border
    ws2.cell(idx, 6).value = r[5]; ws2.cell(idx, 6).font = font_data; ws2.cell(idx, 6).alignment = align_center; ws2.cell(idx, 6).fill = bg_row; ws2.cell(idx, 6).border = thin_border
    ws2.cell(idx, 7).value = r[6]; ws2.cell(idx, 7).font = font_bold; ws2.cell(idx, 7).alignment = align_center; ws2.cell(idx, 7).fill = PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid"); ws2.cell(idx, 7).border = thin_border

# Total Row
tot_row = len(rekap_15) + 3
ws2.cell(tot_row, 1).value = ""
ws2.cell(tot_row, 2).value = "TOTAL KESELURUHAN"
ws2.cell(tot_row, 3).value = sum(x[2] for x in rekap_15)
ws2.cell(tot_row, 4).value = sum(x[3] for x in rekap_15)
ws2.cell(tot_row, 5).value = sum(x[4] for x in rekap_15)
ws2.cell(tot_row, 6).value = sum(x[5] for x in rekap_15)
ws2.cell(tot_row, 7).value = sum(x[6] for x in rekap_15)

for c in range(1, 8):
    ws2.cell(tot_row, c).font = Font(name="Calibri", size=10.5, bold=True, color="1B365D")
    ws2.cell(tot_row, c).fill = fill_master_sub
    ws2.cell(tot_row, c).border = thin_border
    if c >= 3: ws2.cell(tot_row, c).alignment = align_center

ws2.column_dimensions["A"].width = 8
ws2.column_dimensions["B"].width = 24
ws2.column_dimensions["C"].width = 22
ws2.column_dimensions["D"].width = 18
ws2.column_dimensions["E"].width = 16
ws2.column_dimensions["F"].width = 16
ws2.column_dimensions["G"].width = 22

# -----------------------------------------------------------------------------
# SHEET 3: Homonim Direhabilitasi
# -----------------------------------------------------------------------------
ws3 = wb.create_sheet(title="Homonim Direhabilitasi")
ws3.merge_cells("A1:G1")
ws3.cell(1, 1).value = "DAFTAR PENDAFTAR DIREHABILITASI (BUKAN DUPLIKAT - BEDA PARAMETER)"
ws3.cell(1, 1).font = font_super; ws3.cell(1, 1).fill = fill_sah_super; ws3.cell(1, 1).alignment = align_center

h_ws3 = ["No", "Nama Pendaftar", "Kontingen Berkas A", "Tgl Lahir / Kontak A", "Kontingen Berkas B", "Tgl Lahir / Kontak B", "Alasan Status Bukan Duplikat"]
for col_idx, title in enumerate(h_ws3, 1):
    c = ws3.cell(2, col_idx)
    c.value = title; c.font = font_sub; c.fill = fill_sah_sub; c.alignment = align_center; c.border = thin_border

rehab_samples = [
    (1, "CI EMI / Emmy Winata", "KORMI & DIID", "11/01/1965 (081808510044)", "Bogor", "10/10/1960 (081808510044)", "Beda Tanggal Lahir (Selisih 4 tahun) & beda nama"),
    (2, "Rosmida FS / Rosmida", "Depok", "01/09/1970 (085865192885)", "Bogor", "01/09/1970 (085865292885)", "Beda Nomor Kontak HP (Digit ke-7) & beda nama"),
    (3, "Syamsu Alam / H. Syamsu Alam*", "KORMI & DIID", "09/07/1962 (081387429550)", "Jakarta Timur", "24/05/1954 (081387429550)", "Beda Tanggal Lahir terpaut 8 tahun (1962 vs 1954)"),
    (4, "MUJENAH", "Jakarta Barat", "05/05/1955 (085715309261)", "Bogor", "06/03/1975 (087715471348)", "Beda Tanggal Lahir terpaut 20 tahun & beda nomor kontak HP"),
    (5, "DIANA", "Jakarta Barat", "16/03/1967 (081585012808)", "Bogor", "13/07/1976 (08891481457)", "Beda Tanggal Lahir terpaut 9 tahun & beda nomor kontak HP"),
    (6, "YUYUN", "Jakarta Barat", "HADIR (087771266903)", "Bogor", "28/06/1970 (0857108830)", "Beda Nomor Kontak HP"),
    (7, "Lilih Solihat (Bogor)", "Bogor (#128)", "15/04/1963 (081284291260)", "Bogor (#1104)", "20/08/1971 (089614320213)", "Beda Tanggal Lahir terpaut 8 tahun & beda nomor HP"),
    (8, "Halimah (Bogor)", "Bogor (#277)", "11/04/1957 (087887516459)", "Bogor (#342)", "06/06/1972 (0895329808310)", "Beda Tanggal Lahir terpaut 15 tahun & beda nomor HP"),
    (9, "Misni (Bogor)", "Bogor (#791)", "26/03/1972 (081219914787)", "Bogor (#871)", "12/04/1996 (08962713451)", "Beda Tanggal Lahir terpaut 24 tahun"),
    (10, "Mujinem (KORMI)", "KORMI (#116)", "29/05/1976 (081289388347)", "KORMI (#390)", "15/09/1956 (081289388347)", "Beda Tanggal Lahir terpaut 20 tahun"),
    (11, "Melda Sari (KORMI)", "KORMI (#119)", "22/04/1980 (085714696917)", "KORMI (#391)", "27/06/1993 (085714696917)", "Beda Tanggal Lahir terpaut 13 tahun"),
    (12, "Saefinah (KORMI)", "KORMI (#211)", "09/10/1968 (085718858094)", "KORMI (#225)", "13/09/1981 (085718858094)", "Beda Tanggal Lahir terpaut 13 tahun"),
    (13, "Suratmi (Depok)", "Depok (#2607)", "02/07/1962 (085891981037)", "Depok (#2640)", "08/04/1967 (085585003552)", "Beda Tanggal Lahir terpaut 5 tahun & beda nomor HP"),
    (14, "Tri Hartati (Depok)", "Depok (#948)", "09/02/1977 (08195342482)", "Depok (#2431)", "03/04/1962 (087885735757)", "Beda Tanggal Lahir terpaut 15 tahun & beda nomor HP"),
]

for idx, r in enumerate(rehab_samples, 3):
    bg_row = fill_row_even if idx % 2 == 1 else fill_row_odd
    for c_idx, val in enumerate(r, 1):
        cell = ws3.cell(idx, c_idx)
        cell.value = val
        cell.font = font_bold if c_idx in [1, 2] else font_data
        cell.alignment = align_center if c_idx in [1, 4, 6] else align_left
        cell.fill = bg_row
        cell.border = thin_border

ws3.column_dimensions["A"].width = 6
ws3.column_dimensions["B"].width = 24
ws3.column_dimensions["C"].width = 20
ws3.column_dimensions["D"].width = 28
ws3.column_dimensions["E"].width = 20
ws3.column_dimensions["F"].width = 28
ws3.column_dimensions["G"].width = 45

wb.save(XLSX_PATH)
print(f"Master duplikasi Excel report updated: {XLSX_PATH}")

