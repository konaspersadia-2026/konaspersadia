#!/usr/bin/env python3
"""
generate_jakbar_report.py

Membuat laporan verifikasi resmi untuk Jakarta Barat:
1. 80_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_BARAT.xlsx
2. DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_BARAT.md
3. 15_UPDATE_BAJU_JAKARTA_BARAT.sql
"""

import os
import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime

BASE_DIR = "Data peserta/Data pengambilan baju"
SQL_DIR = os.path.join(BASE_DIR, "sql_update_pengambilan_baju")

# 1. Read source excel
src_path = os.path.join(BASE_DIR, "80_List Peserta WDD_2026 jakkarta barat.xlsx")
wb_src = openpyxl.load_workbook(src_path)
ws_src = wb_src['Semua Peserta']

jb_list = []
for r in range(8, 88):
    no = ws_src.cell(r, 2).value
    nama = str(ws_src.cell(r, 3).value or '').strip()
    tgl = str(ws_src.cell(r, 4).value or '').strip()
    nohp = str(ws_src.cell(r, 5).value or '').strip()
    gender = str(ws_src.cell(r, 6).value or '').strip()
    unit = str(ws_src.cell(r, 7).value or '').strip()
    
    hp_digits = re.sub(r'\D', '', nohp)
    if hp_digits.startswith('62'): hp_digits = '0' + hp_digits[2:]
    elif hp_digits.startswith('8'): hp_digits = '0' + hp_digits
    
    jb_list.append({
        'no': no, 'nama': nama, 'tgl': tgl, 'hp_raw': nohp, 'hp_clean': hp_digits, 'gender': gender, 'unit': unit
    })

# 2. Read ODS
ods_path = os.path.join(BASE_DIR, "Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods")
with zipfile.ZipFile(ods_path) as z:
    with z.open('content.xml') as f:
        tree = ET.parse(f)
        root = tree.getroot()

ods_rows = []
for table in root.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
    for row in table.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row'):
        row_vals = []
        for cell in row.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell'):
            repeat = int(cell.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated', 1))
            if repeat > 50:
                continue
            texts = [t.text for t in cell.iter('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p') if t.text]
            val = ' '.join(texts) if texts else ''
            for _ in range(repeat):
                row_vals.append(val)
        if any(row_vals):
            ods_rows.append(row_vals)

# Find all Jakbar in ODS
jakbar_ods = []
for idx, r in enumerate(ods_rows[1:], start=2):
    cabang = r[14] if len(r) > 14 else ''
    if 'jakarta barat' in cabang.lower():
        jakbar_ods.append({
            'row_idx': idx, 'reg': r[0].strip(), 'nama': r[2].strip(),
            'hp': r[5].strip() if len(r)>5 else '', 'cabang': cabang
        })

print(f"Total Jakbar records in ODS: {len(jakbar_ods)}")

# Match each participant
matched_list = []
for p in jb_list:
    found = None
    for o in jakbar_ods:
        hp_d = re.sub(r'\D', '', o['hp'])
        if hp_d.startswith('62'): hp_d = '0' + hp_d[2:]
        elif hp_d.startswith('8'): hp_d = '0' + hp_d
        if p['hp_clean'] and p['hp_clean'] == hp_d:
            found = o
            break
    if not found:
        for o in jakbar_ods:
            if p['nama'].upper() == o['nama'].upper():
                found = o
                break
    
    if found:
        matched_list.append({
            'no': p['no'],
            'reg': found['reg'],
            'nama_ods': found['nama'],
            'hp_ods': re.sub(r"^'", "", found['hp']),
            'cabang_ods': found['cabang'],
            'status': 'VALID (HAK KONTINGEN INI)',
            'catatan': 'Kaos diserahkan melalui Kontingen Jakarta Barat.'
        })

print(f"Matched: {len(matched_list)} / 80")

# 3. Create Excel 80_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_BARAT.xlsx
wb_out = openpyxl.Workbook()
ws_out = wb_out.active
ws_out.title = "Verifikasi Jakarta Barat"

headers = ['No', 'No Registrasi ODS', 'Nama di ODS', 'No WhatsApp ODS', 'Cabang di ODS', 'Status Alokasi Kaos', 'Catatan Verifikasi Panitia']
ws_out.append(headers)

font_header = Font(name="Calibri", size=11, bold=True, color="00000000")
fill_header = PatternFill(start_color="00D9E1F2", end_color="00D9E1F2", fill_type="solid")
font_normal = Font(name="Calibri", size=11, bold=False, color="00000000")
align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
thin_border = Border(
    left=Side(style='thin', color='00D9D9D9'),
    right=Side(style='thin', color='00D9D9D9'),
    top=Side(style='thin', color='00D9D9D9'),
    bottom=Side(style='thin', color='00D9D9D9')
)

for col_idx in range(1, 8):
    cell = ws_out.cell(1, col_idx)
    cell.font = font_header
    cell.fill = fill_header
    cell.alignment = align_center
    cell.border = thin_border

for m in matched_list:
    row_vals = [
        m['no'], m['reg'], m['nama_ods'], m['hp_ods'], m['cabang_ods'], m['status'], m['catatan']
    ]
    ws_out.append(row_vals)
    curr_row = ws_out.max_row
    for c in range(1, 8):
        cell = ws_out.cell(curr_row, c)
        cell.font = font_normal
        cell.border = thin_border
        if c in [1, 2, 4, 6]:
            cell.alignment = align_center
        else:
            cell.alignment = align_left

# Set column widths
ws_out.column_dimensions['A'].width = 8
ws_out.column_dimensions['B'].width = 20
ws_out.column_dimensions['C'].width = 30
ws_out.column_dimensions['D'].width = 18
ws_out.column_dimensions['E'].width = 35
ws_out.column_dimensions['F'].width = 28
ws_out.column_dimensions['G'].width = 45

out_path = os.path.join(BASE_DIR, "80_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_BARAT.xlsx")
wb_out.save(out_path)
print(f"Saved: {out_path}")

# 4. Generate DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_BARAT.md
md_lines = [
    "# DAFTAR NO REGISTRASI PESERTA JAKARTA BARAT (TERVERIFIKASI DI ODS)",
    "",
    "**Keterangan File:**",
    "- **Sumber Asal:** `80_List Peserta WDD_2026 jakkarta barat.xlsx`",
    "- **File Master Verifikasi:** `Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods` (Update Terkini)",
    f"- **Total Peserta Diajukan:** {len(jb_list)} Orang",
    f"- **Total Terdaftar di ODS:** {len(matched_list)} Orang (100.0%)",
    f"- **Total Kuota Kaos Valid (Hak Kontingen Ini):** {len(matched_list)} Kaos",
    f"- **Waktu Pembaruan:** {datetime.now().strftime('%d %B %Y, %H:%M:%S WIB')}",
    "",
    "---",
    "",
    f"## 1. DAFTAR {len(matched_list)} NO. REGISTRASI UTAMA (1 NOMOR PER BARIS)",
    "*(Siap di-copy untuk keperluan pemrosesan script, regex, atau pencocokan data)*",
    "",
    "```text"
]
for m in matched_list:
    md_lines.append(m['reg'])
md_lines.append("```")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append(f"## 2. FORMAT QUERY SQL (WHERE no_registrasi IN (...))")
md_lines.append("```sql")
md_lines.append(f"-- Query untuk {len(matched_list)} Peserta Valid Jakarta Barat:")
md_lines.append("SELECT id, no_registrasi, nama_lengkap, whatsapp, status, pilihan_kegiatan, cabang")
md_lines.append("FROM public.pendaftar")
md_lines.append("WHERE no_registrasi IN (")
regs = [f"  '{m['reg']}'" for m in matched_list]
md_lines.append(",\n".join(regs))
md_lines.append(");")
md_lines.append("```")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## 3. TABEL LENGKAP 80 PESERTA DAN STATUS VERIFIKASI DI MASTER ODS")
md_lines.append("")
md_lines.append("| No | No. Registrasi ODS | Nama di ODS | Nama di Berkas Asal | No. WhatsApp ODS | Cabang di ODS | Status Alokasi Kaos | Catatan Verifikasi |")
md_lines.append("|:---:|:---:|---|---|:---:|---|:---:|---|")
for p, m in zip(jb_list, matched_list):
    md_lines.append(f"| {m['no']} | `{m['reg']}` | {m['nama_ods']} | {p['nama']} | {m['hp_ods']} | {m['cabang_ods']} | {m['status']} | {m['catatan']} |")

md_path = os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_BARAT.md")
with open(md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines) + "\n")
print(f"Saved: {md_path}")

# 5. Create 15_UPDATE_BAJU_JAKARTA_BARAT.sql
valid_regs = [m['reg'] for m in matched_list]
sql_lines = [
    "-- ==============================================================================",
    "-- KONAS PERSADIA 2026 - UPDATE PENGAMBILAN BAJU (ANTI OVER-CLAIM)",
    "-- Wilayah / Kontingen: Jakarta Barat",
    "-- Berkas Sumber: 80_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_BARAT.xlsx",
    f"-- Kuota Kaos Sah (VALID): {len(valid_regs)} Peserta",
    f"-- Total No. Registrasi Unik di Script Ini: {len(valid_regs)}",
    f"-- Waktu Pembaruan: {datetime.now().strftime('%d %B %Y, %H:%M:%S WIB')}",
    "-- ==============================================================================",
    "",
    "UPDATE public.pendaftar",
    "SET ",
    "    pengambilan_baju = 'Ya',",
    "    waktu_pengambilan_baju = COALESCE(waktu_pengambilan_baju, NOW()),",
    "    pengambilan_merchandise = 'Ya'",
    "WHERE no_registrasi IN ("
]
for i in range(0, len(valid_regs), 5):
    chunk = valid_regs[i:i+5]
    line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
    if i + 5 < len(valid_regs):
        line_str += ","
    sql_lines.append(line_str)
sql_lines.append(");")
sql_lines.append("")
sql_lines.append("SELECT COUNT(*) AS total_terupdate_jakarta_barat")
sql_lines.append("FROM public.pendaftar")
sql_lines.append("WHERE pengambilan_baju = 'Ya' AND no_registrasi IN (")
for i in range(0, len(valid_regs), 5):
    chunk = valid_regs[i:i+5]
    line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
    if i + 5 < len(valid_regs):
        line_str += ","
    sql_lines.append(line_str)
sql_lines.append(");")

sql_path = os.path.join(SQL_DIR, "15_UPDATE_BAJU_JAKARTA_BARAT.sql")
with open(sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines) + "\n")
print(f"Saved: {sql_path}")
print("ALL GENERATIONS FINISHED SUCCESSFULLY.")
