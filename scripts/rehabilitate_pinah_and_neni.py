#!/usr/bin/env python3
"""
rehabilitate_pinah_and_neni.py

Memulihkan 2 pendaftar Purwakarta (unit Klinik Bhakti Sentosa):
1. Pinah (No. Urut 106 di berkas) -> Pinah Suryati (KNS2026-24956004, HP: 083122069655)
2. Neni Amalia (No. Urut 108 di berkas) -> Neni Amelia (KNS2026-14804591, HP: 085720146296)

Dampak:
- Kuota Sah Purwakarta naik dari 115 menjadi 117 kaos.
- Peserta belum terdaftar di Purwakarta berkurang dari 6 menjadi 4 orang (Dewi, Yul Toding, Yul Balukon, Since Wairata).
- Total Kuota Sah 14 Kontingen naik dari 6.139 menjadi 6.141 kaos.
"""

import os
import re
import shutil
import zipfile
import tempfile
import xml.etree.ElementTree as ET
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

BASE_DIR = "Data peserta/Data pengambilan baju"
SQL_DIR = os.path.join(BASE_DIR, "sql_update_pengambilan_baju")
ODS_PATH = os.path.join(BASE_DIR, "Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods")

print("=== 1. Updating Master ODS file ===")
# Backup ODS first
ods_backup = ODS_PATH + ".bak"
shutil.copy2(ODS_PATH, ods_backup)

# Unpack and edit content.xml
temp_dir = tempfile.mkdtemp()
with zipfile.ZipFile(ODS_PATH, 'r') as zin:
    zin.extractall(temp_dir)

content_xml_path = os.path.join(temp_dir, 'content.xml')
tree = ET.parse(content_xml_path)
root = tree.getroot()

ns = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'
}
ET.register_namespace('table', 'urn:oasis:names:tc:opendocument:xmlns:table:1.0')
ET.register_namespace('text', 'urn:oasis:names:tc:opendocument:xmlns:text:1.0')
ET.register_namespace('office', 'urn:oasis:names:tc:opendocument:xmlns:office:1.0')

ods_modified = 0
for row in root.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row'):
    texts = [t.text for t in row.iter('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p') if t.text]
    row_str = ' '.join(texts)
    if 'KNS2026-24956004' in row_str or 'KNS2026-14804591' in row_str:
        cells = list(row)
        for idx, cell in enumerate(cells):
            rep = int(cell.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated', 1))
            ctexts = [t.text for t in cell.iter('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p') if t.text]
            if ctexts == ['-'] and rep == 4:
                cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated'] = '3'
                new_cell = ET.Element('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell', {
                    '{urn:oasis:names:tc:opendocument:xmlns:office:1.0}value-type': 'string'
                })
                p = ET.SubElement(new_cell, '{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p')
                p.text = 'Purwakarta'
                cell_index = list(row).index(cell)
                row.insert(cell_index + 1, new_cell)
                ods_modified += 1
                break

tree.write(content_xml_path, xml_declaration=True, encoding='utf-8')

# Repack zip
with zipfile.ZipFile(ODS_PATH, 'w', zipfile.ZIP_DEFLATED) as zout:
    for foldername, subfolders, filenames in os.walk(temp_dir):
        for filename in filenames:
            filepath = os.path.join(foldername, filename)
            arcname = os.path.relpath(filepath, temp_dir)
            zout.write(filepath, arcname)

shutil.rmtree(temp_dir)
print(f"Master ODS updated successfully ({ods_modified} records set to Purwakarta).")


print("\n=== 2. Updating Purwakarta Excel Verification File ===")
pwk_source = os.path.join(BASE_DIR, "115_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx")
wb_pwk = openpyxl.load_workbook(pwk_source)
ws_pwk = wb_pwk.active

fill_valid = PatternFill(fill_type=None)
font_valid_status = Font(name="Calibri", size=11, bold=False, color="00000000")
font_normal = Font(name="Calibri", size=11, bold=False, color="00000000")
thin_border = Border(
    left=Side(style='thin', color='00D9D9D9'),
    right=Side(style='thin', color='00D9D9D9'),
    top=Side(style='thin', color='00D9D9D9'),
    bottom=Side(style='thin', color='00D9D9D9')
)

# Row 107 in Excel is No. 106 (Pinah)
row_106 = 107
ws_pwk.cell(row_106, 2).value = "KNS2026-24956004"
ws_pwk.cell(row_106, 3).value = "Pinah Suryati"
ws_pwk.cell(row_106, 4).value = "83122069655"
ws_pwk.cell(row_106, 5).value = "Purwakarta"
ws_pwk.cell(row_106, 6).value = "VALID (HAK KONTINGEN INI)"
ws_pwk.cell(row_106, 7).value = "Kaos diserahkan melalui Kontingen Purwakarta."

for c in range(1, 8):
    ws_pwk.cell(row_106, c).fill = fill_valid
    ws_pwk.cell(row_106, c).font = font_normal
    ws_pwk.cell(row_106, c).border = thin_border
ws_pwk.cell(row_106, 6).font = font_valid_status
print("Row 107 (No. 106 Pinah Suryati) updated to VALID.")

# Row 109 in Excel is No. 108 (Neni Amalia)
row_108 = 109
ws_pwk.cell(row_108, 2).value = "KNS2026-14804591"
ws_pwk.cell(row_108, 3).value = "Neni Amelia"
ws_pwk.cell(row_108, 4).value = "85720146296"
ws_pwk.cell(row_108, 5).value = "Purwakarta"
ws_pwk.cell(row_108, 6).value = "VALID (HAK KONTINGEN INI)"
ws_pwk.cell(row_108, 7).value = "Kaos diserahkan melalui Kontingen Purwakarta."

for c in range(1, 8):
    ws_pwk.cell(row_108, c).fill = fill_valid
    ws_pwk.cell(row_108, c).font = font_normal
    ws_pwk.cell(row_108, c).border = thin_border
ws_pwk.cell(row_108, 6).font = font_valid_status
print("Row 109 (No. 108 Neni Amelia) updated to VALID.")

# Save to 117_..., 115_..., and 114_...
wb_pwk.save(os.path.join(BASE_DIR, "117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx"))
wb_pwk.save(os.path.join(BASE_DIR, "115_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx"))
wb_pwk.save(os.path.join(BASE_DIR, "114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx"))
print("Purwakarta Excel files saved (117, 115, 114 versions).")


print("\n=== 3. Updating DAFTAR_NO_REGISTRASI_PESERTA_PURWAKARTA.md ===")
pwk_md_path = os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_PURWAKARTA.md")
with open(pwk_md_path, "r") as f:
    pwk_md = f.read()

# Update counts
pwk_md = pwk_md.replace("**Total Terdaftar di ODS:** 115 Orang (95.0%)", "**Total Terdaftar di ODS:** 117 Orang (96.7%)")
pwk_md = pwk_md.replace("**Total Kuota Kaos Valid (Hak Kontingen Ini):** 115 Kaos", "**Total Kuota Kaos Valid (Hak Kontingen Ini):** 117 Kaos")
pwk_md = pwk_md.replace("## 1. DAFTAR 115 NO. REGISTRASI UTAMA", "## 1. DAFTAR 117 NO. REGISTRASI UTAMA")
pwk_md = pwk_md.replace("-- Query untuk 115 Peserta Valid Purwakarta:", "-- Query untuk 117 Peserta Valid Purwakarta:")

# Add registration numbers to text list & sql query list
# KNS2026-60146001 is No 105, KNS2026-95436469 is No 107
old_reg_seq = "KNS2026-60146001\nKNS2026-95436469\nKNS2026-32806620"
new_reg_seq = "KNS2026-60146001\nKNS2026-24956004\nKNS2026-95436469\nKNS2026-14804591\nKNS2026-32806620"
pwk_md = pwk_md.replace(old_reg_seq, new_reg_seq)

old_sql_seq = "  'KNS2026-60146001',\n  'KNS2026-95436469',\n  'KNS2026-32806620'"
new_sql_seq = "  'KNS2026-60146001',\n  'KNS2026-24956004',\n  'KNS2026-95436469',\n  'KNS2026-14804591',\n  'KNS2026-32806620'"
pwk_md = pwk_md.replace(old_sql_seq, new_sql_seq)

# Update Section 3 description
old_sec3 = """2. **Belum Terdaftar di ODS (6 Peserta):**
   - No. 103: Dewi (Klinik Bhakti Sentosa)
   - No. 106: Pinah (Klinik Bhakti Sentosa)
   - No. 108: Neni Amalia (Klinik Bhakti Sentosa)
   - No. 119: Yul Toding (Klinik Bhakti Sentosa)
   - No. 120: Yul Balukon (Klinik Bhakti Sentosa)
   - No. 121: Since Wairata (Klinik Bhakti Sentosa)"""

new_sec3 = """2. **Belum Terdaftar di ODS (4 Peserta):**
   - No. 103: Dewi (Klinik Bhakti Sentosa)
   - No. 119: Yul Toding (Klinik Bhakti Sentosa)
   - No. 120: Yul Balukon (Klinik Bhakti Sentosa)
   - No. 121: Since Wairata (Klinik Bhakti Sentosa)
   *(Catatan: No. 106 Pinah Suryati [`KNS2026-24956004`] dan No. 108 Neni Amelia [`KNS2026-14804591`] telah dipulihkan menjadi peserta sah).*"""
pwk_md = pwk_md.replace(old_sec3, new_sec3)

# Update table rows 106 and 108
old_row_106 = "| 106 | - | - | - | Pinah (KLINIK BHAKTI SENTOSA) | - | - | BELUM TERDAFTAR DI ODS | Tidak ditemukan data pendaftaran yang sesuai di Master ODS. |"
new_row_106 = "| 106 | `KNS2026-24956004` | 81 | Pinah Suryati | Pinah (KLINIK BHAKTI SENTOSA) | 83122069655 | Purwakarta | VALID (HAK KONTINGEN INI) | Kaos diserahkan melalui Kontingen Purwakarta. |"
pwk_md = pwk_md.replace(old_row_106, new_row_106)

old_row_108 = "| 108 | - | - | - | Neni Amalia (KLINIK BHAKTI SENTOSA) | - | - | BELUM TERDAFTAR DI ODS | Tidak ditemukan data pendaftaran yang sesuai di Master ODS. |"
new_row_108 = "| 108 | `KNS2026-14804591` | 4553 | Neni Amelia | Neni Amalia (KLINIK BHAKTI SENTOSA) | 85720146296 | Purwakarta | VALID (HAK KONTINGEN INI) | Kaos diserahkan melalui Kontingen Purwakarta. |"
pwk_md = pwk_md.replace(old_row_108, new_row_108)

with open(pwk_md_path, "w") as f:
    f.write(pwk_md)
print("Purwakarta Markdown updated successfully.")


print("\n=== 4. Updating SQL Update Files ===")
valid_pwk_regs = []
for r in range(2, ws_pwk.max_row + 1):
    if ws_pwk.cell(r, 6).value == "VALID (HAK KONTINGEN INI)":
        rg = str(ws_pwk.cell(r, 2).value or "").strip()
        if rg and rg.startswith("KNS2026-") and rg not in valid_pwk_regs:
            valid_pwk_regs.append(rg)

sql_pwk_lines = [
    "-- ==============================================================================",
    "-- KONAS PERSADIA 2026 - UPDATE PENGAMBILAN BAJU (ANTI OVER-CLAIM)",
    "-- Wilayah / Kontingen: Purwakarta",
    "-- Berkas Sumber: 117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx",
    f"-- Kuota Kaos Sah (VALID): {len(valid_pwk_regs)} Peserta",
    f"-- Total No. Registrasi Unik di Script Ini: {len(valid_pwk_regs)}",
    f"-- Waktu Pembaruan: {datetime.now().strftime('%d %B %Y, %H:%M:%S WIB')}",
    "-- ==============================================================================",
    "",
    "-- 1. Pastikan cabang Purwakarta terisi untuk peserta pemulihan",
    "UPDATE public.pendaftar",
    "SET cabang = 'Purwakarta'",
    "WHERE no_registrasi IN ('KNS2026-24956004', 'KNS2026-14804591');",
    "",
    "-- 2. Update status pengambilan baju",
    "UPDATE public.pendaftar",
    "SET ",
    "    pengambilan_baju = 'Ya',",
    "    waktu_pengambilan_baju = COALESCE(waktu_pengambilan_baju, NOW()),",
    "    pengambilan_merchandise = 'Ya'",
    "WHERE no_registrasi IN ("
]
for i in range(0, len(valid_pwk_regs), 5):
    chunk = valid_pwk_regs[i:i+5]
    line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
    if i + 5 < len(valid_pwk_regs):
        line_str += ","
    sql_pwk_lines.append(line_str)
sql_pwk_lines.append(");")
sql_pwk_lines.append("")
sql_pwk_lines.append("SELECT COUNT(*) AS total_terupdate_purwakarta")
sql_pwk_lines.append("FROM public.pendaftar")
sql_pwk_lines.append("WHERE pengambilan_baju = 'Ya' AND no_registrasi IN (")
for i in range(0, len(valid_pwk_regs), 5):
    chunk = valid_pwk_regs[i:i+5]
    line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
    if i + 5 < len(valid_pwk_regs):
        line_str += ","
    sql_pwk_lines.append(line_str)
sql_pwk_lines.append(");")

with open(os.path.join(SQL_DIR, "12_UPDATE_BAJU_PURWAKARTA.sql"), "w") as f:
    f.write("\n".join(sql_pwk_lines) + "\n")
print(f"Updated 12_UPDATE_BAJU_PURWAKARTA.sql ({len(valid_pwk_regs)} regs).")

# Update 00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql
master_sql_path = os.path.join(SQL_DIR, "00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql")
with open(master_sql_path, "r") as f:
    msql = f.read()

msql = re.sub(r"-- Total Kuota Kaos Sah Keseluruhan \(14 Kontingen\): \d+ Kaos", f"-- Total Kuota Kaos Sah Keseluruhan (14 Kontingen): {6139 + 2} Kaos", msql)
msql = re.sub(r"-- Total Kuota Kaos Sah \(VALID\): 115 Peserta", f"-- Total Kuota Kaos Sah (VALID): {len(valid_pwk_regs)} Peserta", msql)

# Replace Purwakarta IN clause in master sql
# Find purwakarta section
pattern_pwk_section = r"(-- Wilayah / Kontingen: Purwakarta.*?WHERE no_registrasi IN \()(.*?)(\);)"
def replace_pwk_in(match):
    prefix = match.group(1)
    suffix = match.group(3)
    in_items = []
    for i in range(0, len(valid_pwk_regs), 5):
        chunk = valid_pwk_regs[i:i+5]
        line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
        if i + 5 < len(valid_pwk_regs):
            line_str += ","
        in_items.append(line_str)
    return prefix + "\n" + "\n".join(in_items) + "\n" + suffix

msql = re.sub(pattern_pwk_section, replace_pwk_in, msql, flags=re.DOTALL)
with open(master_sql_path, "w") as f:
    f.write(msql)
print(f"Updated 00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql (Total: {6139 + 2}).")

# Update DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md
doc_sql_path = os.path.join(BASE_DIR, "DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md")
with open(doc_sql_path, "r") as f:
    doc_sql = f.read()

doc_sql = re.sub(r"\*\*Total Kuota Kaos Sah \(14 Kontingen\):\*\* \*\*6,139 Peserta\*\*", f"**Total Kuota Kaos Sah (14 Kontingen):** **{6139 + 2:,} Peserta**", doc_sql)
doc_sql = re.sub(r"\|\s*12\s*\|\s*\*\*Purwakarta\*\*\s*\|\s*\[`11[45]_LAPORAN.*?\|\s*\*\*11[45]\*\*\s*\|", f"| 12 | **Purwakarta** | [`117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx) | [`12_UPDATE_BAJU_PURWAKARTA.sql`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/sql_update_pengambilan_baju/12_UPDATE_BAJU_PURWAKARTA.sql) | **{len(valid_pwk_regs)}** |", doc_sql)
doc_sql = re.sub(r"\|\s*\|\s*\*\*TOTAL KESELURUHAN \(14 KONTINGEN\)\*\*\s*\|\s*\|\s*\[`00_UPDATE_SEMUA.*?\|\s*\*\*6,139\*\*\s*\|", f"| | **TOTAL KESELURUHAN (14 KONTINGEN)** | | [`00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/sql_update_pengambilan_baju/00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql) | **{6139 + 2:,}** |", doc_sql)

with open(doc_sql_path, "w") as f:
    f.write(doc_sql)
print("Updated DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md.")


print("\n=== 5. Updating Master Duplikasi Cross-Contingent Excel & MD ===")
master_path = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx")
wb_master = openpyxl.load_workbook(master_path)
ws_summary = wb_master["Ringkasan & Matriks Alokasi"]

# Find Purwakarta row in Sheet 2
for r in range(1, ws_summary.max_row + 1):
    val = str(ws_summary.cell(r, 2).value or "")
    if "Purwakarta" in val:
        # Col 6 is Kuota Kaos Sah
        ws_summary.cell(r, 6).value = 117
        ws_summary.cell(r, 7).value = "117 valid (Pinah Suryati & Neni Amelia dipulihkan, Ita Juwita mandiri; 4 belum terdaftar)"
        print(f"Purwakarta row in Sheet 2 updated to 117.")
    if "TOTAL KAOS SAH" in val.upper() or "TOTAL DISTRIBUSI" in val.upper() or "TOTAL KESELURUHAN" in val.upper():
        ws_summary.cell(r, 6).value = 6141
        print("Total Kaos Sah row in Sheet 2 updated to 6,141.")

wb_master.save(master_path)
print("Updated LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx.")

# Update LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md
master_md_path = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md")
with open(master_md_path, "r") as f:
    mmd = f.read()

mmd = mmd.replace("**6.139 Kaos**", "**6.141 Kaos**")
mmd = mmd.replace("**6,139 Kaos**", "**6,141 Kaos**")
mmd = mmd.replace("**6.139**", "**6.141**")
mmd = mmd.replace("**6,139**", "**6,141**")
mmd = mmd.replace("| 7 | **Purwakarta** | Kontingen Mandiri | 0 | 0 | **115** | `115_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx` |", "| 7 | **Purwakarta** | Kontingen Mandiri | 0 | 0 | **117** | `117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx` |")
mmd = mmd.replace("| 7 | **Purwakarta** | Kontingen Terdampak | 0 | 1 | **114** | `114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx` |", "| 7 | **Purwakarta** | Kontingen Mandiri | 0 | 0 | **117** | `117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx` |")

with open(master_md_path, "w") as f:
    f.write(mmd)
print("Updated LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md.")

print("\n=== ALL UPDATES COMPLETED SUCCESSFULLY ===")
