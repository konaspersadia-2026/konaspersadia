#!/usr/bin/env python3
"""
cek_belum_ambil_baju.py
Script untuk menganalisis data peserta yang belum mengambil baju/kaos
berdasarkan Master ODS dan skrip pembaruan SQL 15 kontingen.
"""

import os
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
import openpyxl

BASE_DIR = "Data peserta/Data pengambilan baju"
SQL_MASTER = os.path.join(BASE_DIR, "sql_update_pengambilan_baju", "00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql")
ODS_PATH = os.path.join(BASE_DIR, "Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods")

# 1. Baca daftar No. Registrasi yang sudah tercakup di update sah
with open(SQL_MASTER, "r") as f:
    sql_text = f.read()
sudah_ambil_regs = set(re.findall(r"KNS2026-\w+", sql_text))

# 2. Baca seluruh data Master ODS
with zipfile.ZipFile(ODS_PATH) as z:
    with z.open("content.xml") as f:
        tree = ET.parse(f)
root = tree.getroot()
ns = {
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0"
}
table = root.findall(".//table:table", ns)[0]
rows = table.findall(".//table:table-row", ns)

data_rows = []
for r in rows:
    row_cells = []
    for c in r.findall("table:table-cell", ns):
        rep = c.get("{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated")
        rep_count = int(rep) if rep else 1
        txts = [p.text for p in c.findall(".//text:p", ns) if p.text is not None]
        val = " ".join(txts).strip()
        for _ in range(min(rep_count, 100)):
            row_cells.append(val)
    while row_cells and row_cells[-1] == "":
        row_cells.pop()
    if row_cells:
        data_rows.append(row_cells)

header = data_rows[0]
records = [dict(zip(header, r)) for r in data_rows[1:]]

belum_ambil = []
sudah_ambil = []

for r in records:
    reg = r.get("No. Registrasi", "").strip()
    if reg in sudah_ambil_regs:
        sudah_ambil.append(r)
    else:
        belum_ambil.append(r)

print("=" * 70)
print("AUDIT PENGAMBILAN BAJU PESERTA KONAS PERSADIA 2026")
print("=" * 70)
print(f"Total Peserta di Master Database (ODS) : {len(records):,}")
print(f"Total Sudah Ambil (Kolektif 15 Kontingen): {len(sudah_ambil):,} ({(len(sudah_ambil)/len(records))*100:.2f}%)")
print(f"Total Belum Ambil Baju                 : {len(belum_ambil):,} ({(len(belum_ambil)/len(records))*100:.2f}%)")
print("-" * 70)

cabang_cnt = Counter([r.get("Cabang Persadia", "") or "Tanpa Cabang / Umum (-)" for r in belum_ambil])
print("\nTOP 15 CABANG / UNIT BELUM AMBIL BAJU:")
print(f"{'No':<3} | {'Cabang / Unit':<48} | {'Jumlah':<6}")
print("-" * 65)
for idx, (c, cnt) in enumerate(cabang_cnt.most_common(15), 1):
    print(f"{idx:<3} | {c[:48]:<48} | {cnt:<6}")

print("\n" + "=" * 70)

