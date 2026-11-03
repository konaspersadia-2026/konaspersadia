#!/usr/bin/env python3
"""
rehabilitate_nimi_jaksel.py

Membebaskan No. 78 NIMI dan No. 97 IDA NIMI pada berkas Jakarta Selatan:
- No. 78: NIMI (KNS2026-55199447, Lahir: 31/12/1952, HP: 085756961202) -> VALID
- No. 97: IDA NIMI (KNS2026-92976643, Lahir: 25/04/1976, HP: 085756961202) -> VALID

Alasan klarifikasi Ketua Cabang:
Keduanya merupakan orang berbeda dengan tanggal lahir berbeda (selisih usia ~24 tahun),
namun menggunakan nomor HP bersama/keluarga.

Dampak:
- Kuota Sah Jakarta Selatan naik dari 243 menjadi 244 kaos.
- Berkas diperbarui menjadi 244_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx (file 243_... dihapus).
- Total Kuota Sah 14 Kontingen naik dari 6.141 menjadi 6.142 kaos.
"""

import os
import re
import copy
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

print("=== 1. Updating Master ODS file (Adding NIMI KNS2026-55199447) ===")
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

inserted_nimi = False
for table in root.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table'):
    table_rows = list(table.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-row'))
    for idx, row in enumerate(table_rows):
        texts = [t.text for t in row.iter('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p') if t.text]
        row_str = ' '.join(texts)
        if 'KNS2026-92976643' in row_str and not inserted_nimi:
            # Clone row for KNS2026-55199447 (NIMI)
            nimi_row = copy.deepcopy(row)
            cells = list(nimi_row.iter('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}table-cell'))
            # Cell 0: Reg
            for p in cells[0].iter('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
                p.text = 'KNS2026-55199447'
            # Cell 2: Nama
            for p in cells[2].iter('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p'):
                p.text = 'NIMI'
            
            # Find index in table
            table_idx = list(table).index(row)
            table.insert(table_idx, nimi_row)
            inserted_nimi = True
            print("Successfully inserted NIMI (KNS2026-55199447) into ODS.")
            break
    if inserted_nimi:
        break

tree.write(content_xml_path, xml_declaration=True, encoding='utf-8')

with zipfile.ZipFile(ODS_PATH, 'w', zipfile.ZIP_DEFLATED) as zout:
    for foldername, subfolders, filenames in os.walk(temp_dir):
        for filename in filenames:
            filepath = os.path.join(foldername, filename)
            arcname = os.path.relpath(filepath, temp_dir)
            zout.write(filepath, arcname)

shutil.rmtree(temp_dir)
print("Master ODS repackaged successfully.")


print("\n=== 2. Updating Jakarta Selatan Excel Verification File ===")
js_old_path = os.path.join(BASE_DIR, "243_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx")
wb_js = openpyxl.load_workbook(js_old_path)
ws_js = wb_js.active

fill_valid = PatternFill(fill_type=None)
font_valid_status = Font(name="Calibri", size=11, bold=False, color="00000000")
font_normal = Font(name="Calibri", size=11, bold=False, color="00000000")
thin_border = Border(
    left=Side(style='thin', color='00D9D9D9'),
    right=Side(style='thin', color='00D9D9D9'),
    top=Side(style='thin', color='00D9D9D9'),
    bottom=Side(style='thin', color='00D9D9D9')
)

# Row 79 is No. 78 (NIMI)
r78 = 79
ws_js.cell(r78, 2).value = "KNS2026-55199447"
ws_js.cell(r78, 3).value = "NIMI"
ws_js.cell(r78, 4).value = "85756961202"
ws_js.cell(r78, 5).value = "PERSADIA Cabang Jakarta Selatan"
ws_js.cell(r78, 6).value = "VALID (HAK KONTINGEN INI)"
ws_js.cell(r78, 7).value = "Kaos diserahkan melalui Kontingen Jakarta Selatan."
for c in range(1, 8):
    ws_js.cell(r78, c).fill = fill_valid
    ws_js.cell(r78, c).font = font_normal
    ws_js.cell(r78, c).border = thin_border
ws_js.cell(r78, 6).font = font_valid_status
print("Row 79 (No. 78 NIMI) set to VALID with KNS2026-55199447.")

# Row 98 is No. 97 (IDA NIMI)
r97 = 98
ws_js.cell(r97, 2).value = "KNS2026-92976643"
ws_js.cell(r97, 3).value = "IDA NIMI"
ws_js.cell(r97, 4).value = "85756961202"
ws_js.cell(r97, 5).value = "PERSADIA Cabang Jakarta Selatan"
ws_js.cell(r97, 6).value = "VALID (HAK KONTINGEN INI)"
ws_js.cell(r97, 7).value = "Kaos diserahkan melalui Kontingen Jakarta Selatan."
for c in range(1, 8):
    ws_js.cell(r97, c).fill = fill_valid
    ws_js.cell(r97, c).font = font_normal
    ws_js.cell(r97, c).border = thin_border
ws_js.cell(r97, 6).font = font_valid_status
print("Row 98 (No. 97 IDA NIMI) set to VALID with KNS2026-92976643.")

# Verify valid count
v_cnt = sum(1 for r in range(2, ws_js.max_row+1) if ws_js.cell(r, 6).value == "VALID (HAK KONTINGEN INI)")
print(f"Total VALID rows in Jakarta Selatan: {v_cnt}")

# Save new file 244_... and remove 243_...
js_new_path = os.path.join(BASE_DIR, f"{v_cnt}_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx")
wb_js.save(js_new_path)
print(f"Saved: {js_new_path}")
if os.path.exists(js_old_path):
    os.remove(js_old_path)
    print(f"Deleted old file: {js_old_path}")


print("\n=== 3. Updating DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_SELATAN.md ===")
js_md_path = os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_SELATAN.md")
with open(js_md_path, "r") as f:
    js_md = f.read()

# Update counts
js_md = re.sub(r"\*\*Total Kuota Kaos Valid \(Hak Kontingen Ini\):\*\* \d+ Kaos", f"**Total Kuota Kaos Valid (Hak Kontingen Ini):** {v_cnt} Kaos", js_md)
js_md = re.sub(r"## 1\. DAFTAR \d+ NO\. REGISTRASI UTAMA", f"## 1. DAFTAR {v_cnt} NO. REGISTRASI UTAMA", js_md)
js_md = re.sub(r"-- Query untuk \d+ Peserta Valid Jakarta Selatan:", f"-- Query untuk {v_cnt} Peserta Valid Jakarta Selatan:", js_md)

# Update Section 1 & Section 2 registration lists
# In Section 1: insert KNS2026-55199447 right after KNS2026-70650474 (No. 77)
if "KNS2026-55199447" not in js_md:
    js_md = js_md.replace("KNS2026-70650474\nKNS2026-79983025", "KNS2026-70650474\nKNS2026-55199447\nKNS2026-79983025")
    js_md = js_md.replace("  'KNS2026-70650474',\n  'KNS2026-79983025'", "  'KNS2026-70650474',\n  'KNS2026-55199447',\n  'KNS2026-79983025'")

# Update Section 3 description
old_sec3_js = """3. **Duplikat Internal (1 Peserta):**
   - **No. 97 - IDA NIMI** (`KNS2026-92976643`, HP: 085756961202): Merupakan klaim ganda dari orang yang sama dengan peserta **No. 78 (NIMI)** di unit RS Prikasih."""

new_sec3_js = """3. **Duplikat Internal (0 Peserta):**
   - Tidak ada duplikat internal. Peserta **No. 78 (NIMI, lahir 31/12/1952, `KNS2026-55199447`)** dan **No. 97 (IDA NIMI, lahir 25/04/1976, `KNS2026-92976643`)** telah diverifikasi dan dikonfirmasi oleh Ketua Cabang sebagai 2 orang berbeda (menggunakan kontak bersama) dan keduanya berstatus VALID."""

js_md = js_md.replace(old_sec3_js, new_sec3_js)

# Update table rows 78 and 97
old_row_78 = "| 78 | `KNS2026-92976643` | 1143 | IDA NIMI | NIMI (RS PRIKASIH) | 85756961202 | PERSADIA Cabang Jakarta Selatan | VALID (HAK KONTINGEN INI) | Kaos diserahkan melalui Kontingen Jakarta Selatan. |"
new_row_78 = "| 78 | `KNS2026-55199447` | - | NIMI | NIMI (RS PRIKASIH) | 85756961202 | PERSADIA Cabang Jakarta Selatan | VALID (HAK KONTINGEN INI) | Kaos diserahkan melalui Kontingen Jakarta Selatan. |"
js_md = js_md.replace(old_row_78, new_row_78)

old_row_97 = "| 97 | `KNS2026-92976643` | 1143 | IDA NIMI | IDA NIMI (RS PRIKASIH) | 85756961202 | PERSADIA Cabang Jakarta Selatan | DUPLIKAT INTERNAL (KLAIM GANDA) | Duplikat internal dengan peserta No. 78 (NIMI / IDA NIMI - HP 0857 5696 1202). Kaos hanya dialokasikan 1 kali. |"
new_row_97 = "| 97 | `KNS2026-92976643` | 1142 | IDA NIMI | IDA NIMI (RS PRIKASIH) | 85756961202 | PERSADIA Cabang Jakarta Selatan | VALID (HAK KONTINGEN INI) | Kaos diserahkan melalui Kontingen Jakarta Selatan. |"
js_md = js_md.replace(old_row_97, new_row_97)

with open(js_md_path, "w") as f:
    f.write(js_md)
print("Updated DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_SELATAN.md.")


print("\n=== 4. Updating SQL Files (14 and 00) ===")
# 14_UPDATE_BAJU_JAKARTA_SELATAN.sql
valid_js_regs = []
for r in range(2, ws_js.max_row + 1):
    if ws_js.cell(r, 6).value == "VALID (HAK KONTINGEN INI)":
        rg = str(ws_js.cell(r, 2).value or "").strip()
        if rg and rg.startswith("KNS2026-") and rg not in valid_js_regs:
            valid_js_regs.append(rg)

sql_js_lines = [
    "-- ==============================================================================",
    "-- KONAS PERSADIA 2026 - UPDATE PENGAMBILAN BAJU (ANTI OVER-CLAIM)",
    "-- Wilayah / Kontingen: Jakarta Selatan",
    f"-- Berkas Sumber: 244_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx",
    f"-- Kuota Kaos Sah (VALID): {len(valid_js_regs)} Peserta",
    f"-- Total No. Registrasi Unik di Script Ini: {len(valid_js_regs)}",
    f"-- Waktu Pembaruan: {datetime.now().strftime('%d %B %Y, %H:%M:%S WIB')}",
    "-- ==============================================================================",
    "",
    "-- 1. Pastikan peserta NIMI terdaftar di public.pendaftar jika belum ada",
    "INSERT INTO public.pendaftar (",
    "    no_registrasi, nama_lengkap, jenis_kelamin, whatsapp, tanggal_lahir, institusi, cabang, status, pilihan_kegiatan, mode_kehadiran, total_bayar",
    ")",
    "SELECT 'KNS2026-55199447', 'NIMI', 'Perempuan', '085756961202', '1952-12-31', 'RS Prikasih', 'PERSADIA Cabang Jakarta Selatan', 'Lunas', 'Pesta Rakyat', 'Onsite', 0",
    "WHERE NOT EXISTS (SELECT 1 FROM public.pendaftar WHERE no_registrasi = 'KNS2026-55199447');",
    "",
    "-- 2. Update status pengambilan baju dan merchandise",
    "UPDATE public.pendaftar",
    "SET ",
    "    pengambilan_baju = 'Ya',",
    "    waktu_pengambilan_baju = COALESCE(waktu_pengambilan_baju, NOW()),",
    "    pengambilan_merchandise = 'Ya'",
    "WHERE no_registrasi IN ("
]
for i in range(0, len(valid_js_regs), 5):
    chunk = valid_js_regs[i:i+5]
    line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
    if i + 5 < len(valid_js_regs):
        line_str += ","
    sql_js_lines.append(line_str)
sql_js_lines.append(");")
sql_js_lines.append("")
sql_js_lines.append("SELECT COUNT(*) AS total_terupdate_jakarta_selatan")
sql_js_lines.append("FROM public.pendaftar")
sql_js_lines.append("WHERE pengambilan_baju = 'Ya' AND no_registrasi IN (")
for i in range(0, len(valid_js_regs), 5):
    chunk = valid_js_regs[i:i+5]
    line_str = "    " + ", ".join([f"'{x}'" for x in chunk])
    if i + 5 < len(valid_js_regs):
        line_str += ","
    sql_js_lines.append(line_str)
sql_js_lines.append(");")

with open(os.path.join(SQL_DIR, "14_UPDATE_BAJU_JAKARTA_SELATAN.sql"), "w") as f:
    f.write("\n".join(sql_js_lines) + "\n")
print(f"Updated 14_UPDATE_BAJU_JAKARTA_SELATAN.sql ({len(valid_js_regs)} regs).")

# Rebuild 00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql
all_regs = []
per_file = {}
for f in sorted(os.listdir(SQL_DIR)):
    if f.startswith('00') or not f.endswith('.sql'):
        continue
    path = os.path.join(SQL_DIR, f)
    with open(path) as fp:
        c = fp.read()
    regs = re.findall(r'KNS2026-\d+', c)
    unique_file = list(dict.fromkeys(regs))
    per_file[f] = len(unique_file)
    all_regs.extend(unique_file)

unique_all = list(dict.fromkeys(all_regs))
grand_total = sum(per_file.values())
print(f"Grand Total Kaos 14 Wilayah: {grand_total}, Unique Regs: {len(unique_all)}")

out_lines = [
    '-- ============================================================================== ',
    '-- KONAS PERSADIA 2026 - MASTER UPDATE PENGAMBILAN BAJU 14 KONTINGEN',
    f'-- Total Kuota Kaos Sah (VALID): {grand_total:,} Peserta (14 Kontingen)',
    f'-- Total No. Registrasi Unik di Script Ini: {len(unique_all)}',
    f'-- Waktu Pembaruan: {datetime.now().strftime("%d %B %Y, %H:%M:%S WIB")}',
    '-- ==============================================================================',
    '',
    '-- 1. Pastikan peserta pemulihan terdaftar di public.pendaftar',
    'INSERT INTO public.pendaftar (',
    '    no_registrasi, nama_lengkap, jenis_kelamin, whatsapp, tanggal_lahir, institusi, cabang, status, pilihan_kegiatan, mode_kehadiran, total_bayar',
    ')',
    "SELECT 'KNS2026-55199447', 'NIMI', 'Perempuan', '085756961202', '1952-12-31', 'RS Prikasih', 'PERSADIA Cabang Jakarta Selatan', 'Lunas', 'Pesta Rakyat', 'Onsite', 0",
    "WHERE NOT EXISTS (SELECT 1 FROM public.pendaftar WHERE no_registrasi = 'KNS2026-55199447');",
    '',
    'UPDATE public.pendaftar',
    "SET cabang = 'Purwakarta'",
    "WHERE no_registrasi IN ('KNS2026-24956004', 'KNS2026-14804591');",
    '',
    '-- 2. Update status pengambilan baju dan merchandise',
    'UPDATE public.pendaftar',
    'SET ',
    "    pengambilan_baju = 'Ya',",
    '    waktu_pengambilan_baju = COALESCE(waktu_pengambilan_baju, NOW()),',
    "    pengambilan_merchandise = 'Ya'",
    'WHERE no_registrasi IN ('
]
for i in range(0, len(unique_all), 5):
    chunk = unique_all[i:i+5]
    line_str = '    ' + ', '.join([f"'{x}'" for x in chunk])
    if i + 5 < len(unique_all):
        line_str += ','
    out_lines.append(line_str)
out_lines.append(');')
out_lines.append('')
out_lines.append('SELECT COUNT(*) AS total_terupdate_keseluruhan')
out_lines.append('FROM public.pendaftar')
out_lines.append("WHERE pengambilan_baju = 'Ya' AND no_registrasi IN (")
for i in range(0, len(unique_all), 5):
    chunk = unique_all[i:i+5]
    line_str = '    ' + ', '.join([f"'{x}'" for x in chunk])
    if i + 5 < len(unique_all):
        line_str += ','
    out_lines.append(line_str)
out_lines.append(');')

master_sql_path = os.path.join(SQL_DIR, '00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql')
with open(master_sql_path, 'w') as fp:
    fp.write('\n'.join(out_lines) + '\n')
print("Updated 00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql.")


print("\n=== 5. Updating Master Duplikasi Cross-Contingent Excel & MD ===")
master_path = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx")
wb_master = openpyxl.load_workbook(master_path)
ws_summary = wb_master["Ringkasan & Matriks Alokasi"]

for r in range(1, ws_summary.max_row + 1):
    val = str(ws_summary.cell(r, 2).value or "")
    if "Jakarta Selatan" in val:
        ws_summary.cell(r, 6).value = 244
        ws_summary.cell(r, 7).value = "244 valid (NIMI & IDA NIMI dibebaskan/mandiri; 1 klaim kuning Mimi Sopiati dialihkan ke Depok; 5 belum terdaftar)"
        print("Jakarta Selatan row in Sheet 2 updated to 244.")
    if "TOTAL KAOS SAH" in val.upper() or "TOTAL DISTRIBUSI" in val.upper() or "TOTAL KESELURUHAN" in val.upper():
        ws_summary.cell(r, 6).value = grand_total
        print(f"Total Kaos Sah row in Sheet 2 updated to {grand_total}.")

wb_master.save(master_path)
print("Updated LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx.")

# Update LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md
master_md_path = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md")
with open(master_md_path, "r") as f:
    mmd = f.read()

mmd = mmd.replace("**6.141 Kaos**", f"**{grand_total:,} Kaos**".replace(",", "."))
mmd = mmd.replace("**6,141 Kaos**", f"**{grand_total:,} Kaos**")
mmd = mmd.replace("**6.141**", f"**{grand_total:,}**".replace(",", "."))
mmd = mmd.replace("**6,141**", f"**{grand_total:,}**")
mmd = re.sub(
    r"\|\s*6\s*\|\s*\*\*Jakarta Selatan\*\*\s*\|\s*Kontingen Terdampak\s*\|\s*0\s*\|\s*1\s*\|\s*\*\*243\*\*\s*\|\s*`243_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN\.xlsx`\s*\|",
    f"| 6 | **Jakarta Selatan** | Kontingen Terdampak | 0 | 1 | **244** | `244_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx` |",
    mmd
)
with open(master_md_path, "w") as f:
    f.write(mmd)
print("Updated LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md.")

# Update DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md
doc_sql_path = os.path.join(BASE_DIR, "DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md")
with open(doc_sql_path, "r") as f:
    doc_sql = f.read()

doc_sql = re.sub(r"\*\*Total Kuota Kaos Sah \(14 Kontingen\):\*\* \*\*[\d,]+ Peserta\*\*", f"**Total Kuota Kaos Sah (14 Kontingen):** **{grand_total:,} Peserta**", doc_sql)
doc_sql = re.sub(
    r"\|\s*14\s*\|\s*\*\*Jakarta Selatan\*\*\s*\|\s*\[`243_LAPORAN.*?\|\s*\*\*243\*\*\s*\|",
    f"| 14 | **Jakarta Selatan** | [`244_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/244_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx) | [`14_UPDATE_BAJU_JAKARTA_SELATAN.sql`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/sql_update_pengambilan_baju/14_UPDATE_BAJU_JAKARTA_SELATAN.sql) | **244** |",
    doc_sql
)
doc_sql = re.sub(r"\|\s*\|\s*\*\*TOTAL KESELURUHAN \(14 KONTINGEN\)\*\*\s*\|\s*\|\s*\[`00_UPDATE_SEMUA.*?\|\s*\*[\d,]+\*\*\s*\|", f"| | **TOTAL KESELURUHAN (14 KONTINGEN)** | | [`00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/sql_update_pengambilan_baju/00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql) | **{grand_total:,}** |", doc_sql)

with open(doc_sql_path, "w") as f:
    f.write(doc_sql)
print("Updated DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md.")

print("\n=== COMPLETED SUCCESSFULLY ===")
