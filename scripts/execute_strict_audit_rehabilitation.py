#!/usr/bin/env python3
"""
execute_strict_audit_rehabilitation.py

Mengimplementasikan hasil audit ketat:
"Lakukan pengecekan duplikasi kepada mereka yang identik saja.
Nama, no tlpn, jenis kelamin, dan tanggal lahir sama.
Jika salah satu beda, jangan anggap sebagai duplikasi."

Eksekusi:
1. Bogor:
   - Rehabilitasi seluruh 26 duplikat internal + 2 duplikat lintas wilayah (CI EMI & Rosmida)
   - Kuota valid menjadi 1.230
   - Update & rename menjadi 1230_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx
   - Hapus 1202_...

2. KORMI & DIID:
   - Pertahankan 1 duplikat identik sejati: Sri Wahyuni (Row 150)
   - Rehabilitasi 16 duplikat internal lainnya (beda tgl lahir/beda gender/beda nama)
   - Kuota valid menjadi 485
   - Update & rename menjadi 485_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx
   - Hapus 469_...

3. Depok:
   - Pertahankan 2 duplikat identik sejati: Mulyani (Row 1227) & Sri Maryani (Row 1330)
   - Rehabilitasi 6 duplikat internal lainnya (beda tgl lahir/beda HP/beda nama)
   - Kuota valid menjadi 2.857
   - Update & rename menjadi 2857_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx
   - Hapus 2851_...

4. Jakarta Timur:
   - Pertahankan 1 duplikat internal sejati: Nunik Sajiyati (Row 194)
   - Pertahankan 1 duplikat lintas wilayah identik: Kusmiati (Row 207, dialihkan ke KORMI)
   - Rehabilitasi Syamsu Alam (Row 213, beda tgl lahir selisih 8 tahun dari Syamsu Alam KORMI)
   - Kuota valid menjadi 566
   - Update & rename menjadi 566_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx
   - Hapus 565_...

5. Update LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN (.xlsx & .md)
6. Update SQL files & DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md
7. Update Markdowns terkait
"""

import os
import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

BASE_DIR = "Data peserta/Data pengambilan baju"
SQL_DIR = os.path.join(BASE_DIR, "sql_update_pengambilan_baju")

fill_valid = PatternFill(fill_type=None)
font_valid_status = Font(name="Calibri", size=10, bold=False, color="00375623") # Dark Green
font_normal = Font(name="Calibri", size=10, bold=False, color="00000000")

# -----------------------------------------------------------------------------
# 1. BOGOR (1202 -> 1230)
# -----------------------------------------------------------------------------
print("=== 1. Updating Bogor Verification File ===")
old_bogor = os.path.join(BASE_DIR, "1202_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx")
new_bogor = os.path.join(BASE_DIR, "1230_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx")

wb_b = openpyxl.load_workbook(old_bogor)
ws_b = wb_b.active

rehab_bogor_count = 0
for r in range(2, ws_b.max_row + 1):
    st = str(ws_b.cell(r, 6).value or "").strip()
    if "DUPLIKAT" in st:
        ws_b.cell(r, 6).value = "VALID (HAK KONTINGEN INI)"
        ws_b.cell(r, 6).font = font_valid_status
        ws_b.cell(r, 6).fill = fill_valid
        ws_b.cell(r, 7).value = "Kaos diserahkan melalui Kontingen Bogor."
        ws_b.cell(r, 7).font = font_normal
        ws_b.cell(r, 7).fill = fill_valid
        rehab_bogor_count += 1

wb_b.save(new_bogor)
if os.path.exists(old_bogor) and old_bogor != new_bogor:
    os.remove(old_bogor)
print(f"Bogor updated: {rehab_bogor_count} rows rehabilitated to VALID. Saved to {os.path.basename(new_bogor)}.")


# -----------------------------------------------------------------------------
# 2. KORMI & DIID (469 -> 485)
# -----------------------------------------------------------------------------
print("\n=== 2. Updating KORMI & DIID Verification File ===")
old_kormi = os.path.join(BASE_DIR, "469_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx")
new_kormi = os.path.join(BASE_DIR, "485_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx")

wb_k = openpyxl.load_workbook(old_kormi)
ws_k = wb_k.active

rehab_kormi_count = 0
for r in range(2, ws_k.max_row + 1):
    no = ws_k.cell(r, 1).value
    st = str(ws_k.cell(r, 6).value or "").strip()
    # Row 150 (Sri Wahyuni) remains DUPLIKAT INTERNAL
    if no == 150:
        continue
    if "DUPLIKAT" in st:
        ws_k.cell(r, 6).value = "VALID (HAK KONTINGEN INI)"
        ws_k.cell(r, 6).font = font_valid_status
        ws_k.cell(r, 6).fill = fill_valid
        ws_k.cell(r, 7).value = "Kaos diserahkan melalui Kontingen KORMI & DIID."
        ws_k.cell(r, 7).font = font_normal
        ws_k.cell(r, 7).fill = fill_valid
        rehab_kormi_count += 1

wb_k.save(new_kormi)
if os.path.exists(old_kormi) and old_kormi != new_kormi:
    os.remove(old_kormi)
print(f"KORMI & DIID updated: {rehab_kormi_count} rows rehabilitated to VALID. Saved to {os.path.basename(new_kormi)}.")


# -----------------------------------------------------------------------------
# 3. DEPOK (2851 -> 2857)
# -----------------------------------------------------------------------------
print("\n=== 3. Updating Depok Verification File ===")
old_depok = os.path.join(BASE_DIR, "2851_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx")
new_depok = os.path.join(BASE_DIR, "2857_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx")

wb_d = openpyxl.load_workbook(old_depok)
ws_d = wb_d.active

rehab_depok_count = 0
for r in range(2, ws_d.max_row + 1):
    no = ws_d.cell(r, 1).value
    st = str(ws_d.cell(r, 6).value or "").strip()
    # Row 1227 (Mulyani) & Row 1330 (Sri Maryani) remain DUPLIKAT INTERNAL
    if no in [1227, 1330]:
        continue
    if "DUPLIKAT" in st:
        ws_d.cell(r, 6).value = "VALID (HAK KONTINGEN INI)"
        ws_d.cell(r, 6).font = font_valid_status
        ws_d.cell(r, 6).fill = fill_valid
        ws_d.cell(r, 7).value = "Kaos diserahkan melalui Kontingen Depok."
        ws_d.cell(r, 7).font = font_normal
        ws_d.cell(r, 7).fill = fill_valid
        rehab_depok_count += 1

wb_d.save(new_depok)
if os.path.exists(old_depok) and old_depok != new_depok:
    os.remove(old_depok)
print(f"Depok updated: {rehab_depok_count} rows rehabilitated to VALID. Saved to {os.path.basename(new_depok)}.")


# -----------------------------------------------------------------------------
# 4. JAKARTA TIMUR (565 -> 566)
# -----------------------------------------------------------------------------
print("\n=== 4. Updating Jakarta Timur Verification File ===")
old_jt = os.path.join(BASE_DIR, "565_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx")
new_jt = os.path.join(BASE_DIR, "566_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx")

wb_j = openpyxl.load_workbook(old_jt)
ws_j = wb_j.active

rehab_jt_count = 0
for r in range(2, ws_j.max_row + 1):
    no = ws_j.cell(r, 1).value
    # Row 213 (Syamsu Alam) is rehabilitated to VALID because birth date differs by 8 years from KORMI Syamsu Alam
    if no == 213:
        ws_j.cell(r, 6).value = "VALID (HAK KONTINGEN INI)"
        ws_j.cell(r, 6).font = font_valid_status
        ws_j.cell(r, 6).fill = fill_valid
        ws_j.cell(r, 7).value = "Kaos diserahkan melalui Kontingen Jakarta Timur."
        ws_j.cell(r, 7).font = font_normal
        ws_j.cell(r, 7).fill = fill_valid
        rehab_jt_count += 1

wb_j.save(new_jt)
if os.path.exists(old_jt) and old_jt != new_jt:
    os.remove(old_jt)
print(f"Jakarta Timur updated: {rehab_jt_count} row (Syamsu Alam) rehabilitated to VALID. Saved to {os.path.basename(new_jt)}.")

print("\n=== VERIFICATION OF UPDATED COUNTS ===")
for path_f in [new_bogor, new_kormi, new_depok, new_jt]:
    wb_chk = openpyxl.load_workbook(path_f, data_only=True)
    ws_chk = wb_chk.active
    rows_chk = list(ws_chk.iter_rows(values_only=True))[1:]
    val_cnt = sum(1 for r in rows_chk if r[5] == "VALID (HAK KONTINGEN INI)")
    print(f"File: {os.path.basename(path_f)} -> Total Rows: {len(rows_chk)} | VALID: {val_cnt}")

