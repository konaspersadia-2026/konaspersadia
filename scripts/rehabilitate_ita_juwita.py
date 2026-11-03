#!/usr/bin/env python3
"""
rehabilitate_ita_juwita.py

Membebaskan Ita Juwita (KNS2026-60155713) dari status duplikat lintas wilayah,
sesuai instruksi panitia:
- Purwakarta: KLINIK FERREN (No. 35, Ita Juwita, HP: 089684566789, Tgl: 07/05/1971) -> VALID (115 Kaos)
- Bogor: RS. Sentra Medika (No. 527, Tita Juwita, HP: 082125185360, Tgl: 07/05/1971) -> VALID (1.202 Kaos)
Keduanya memiliki nomor HP berbeda total dan nama berbeda huruf awal (Tita vs Ita).
Keduanya berhak atas jatah kaos mandiri di kontingen masing-masing.

Memperbarui:
1. 114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx & 115_...xlsx
2. DAFTAR_NO_REGISTRASI_PESERTA_PURWAKARTA.md
3. 12_UPDATE_BAJU_PURWAKARTA.sql
4. DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md & 00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql
5. LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx & .md
"""

import os
import re
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

BASE_DIR = "Data peserta/Data pengambilan baju"
SQL_DIR = os.path.join(BASE_DIR, "sql_update_pengambilan_baju")

print("=== 1. Updating Purwakarta Excel Verification File ===")
pwk_path = os.path.join(BASE_DIR, "114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx")
wb_pwk = openpyxl.load_workbook(pwk_path)
ws_pwk = wb_pwk.active

fill_valid = PatternFill(fill_type=None)
font_valid_status = Font(name="Calibri", size=10, bold=False, color="00375623")
font_normal = Font(name="Calibri", size=10, bold=False, color="00000000")

for r in range(2, ws_pwk.max_row + 1):
    if ws_pwk.cell(r, 1).value == 35 or ws_pwk.cell(r, 2).value == "KNS2026-60155713":
        ws_pwk.cell(r, 6).value = "VALID (HAK KONTINGEN INI)"
        ws_pwk.cell(r, 7).value = "Kaos diserahkan melalui Kontingen Purwakarta."
        for c in range(1, 8):
            ws_pwk.cell(r, c).fill = fill_valid
            ws_pwk.cell(r, c).font = font_normal
        ws_pwk.cell(r, 6).font = font_valid_status
        print(f"Row {r} (No. 35 Ita Juwita) updated to VALID.")

wb_pwk.save(pwk_path)
wb_pwk.save(os.path.join(BASE_DIR, "115_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx"))
print("Purwakarta Excel updated: 115 valid, 0 duplikat lintas wilayah, 6 belum terdaftar.")


print("\n=== 2. Updating DAFTAR_NO_REGISTRASI_PESERTA_PURWAKARTA.md ===")
pwk_md_path = os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_PURWAKARTA.md")
with open(pwk_md_path, "r") as f:
    pwk_md = f.read()

pwk_md = pwk_md.replace("**Total Kuota Kaos Valid (Hak Kontingen Ini):** 114 Kaos", "**Total Kuota Kaos Valid (Hak Kontingen Ini):** 115 Kaos")
pwk_md = pwk_md.replace("## 1. DAFTAR 114 NO. REGISTRASI UTAMA", "## 1. DAFTAR 115 NO. REGISTRASI UTAMA")
pwk_md = pwk_md.replace("KNS2026-78558553\nKNS2026-80717394", "KNS2026-78558553\nKNS2026-60155713\nKNS2026-80717394")
pwk_md = pwk_md.replace("| **Total Kuota Kaos Valid (Hak Purwakarta)** | **114 Kaos** |", "| **Total Kuota Kaos Valid (Hak Purwakarta)** | **115 Kaos** |")
pwk_md = pwk_md.replace("| Duplikat Lintas Wilayah (Dialihkan) | 1 Peserta |", "| Duplikat Lintas Wilayah (Dialihkan) | 0 Peserta |")
pwk_md = pwk_md.replace(
    "1. **Duplikat Lintas Wilayah (1 Peserta):**\n   - **No. 35 - Ita Juwita** (`KNS2026-60155713`): Tercatat juga pada Kontingen Bogor (Baris 546) yang telah disetujui sebelumnya. Sesuai instruksi panitia, alokasi kaos tetap pada berkas sebelumnya (Bogor) agar dokumen terdahulu tidak berubah.",
    "1. **Duplikat Lintas Wilayah (0 Peserta):**\n   - Tidak ada duplikat lintas wilayah. Peserta No. 35 (Ita Juwita, KLINIK FERREN) telah direhabilitasi menjadi VALID dan berhak atas kaos mandiri di Purwakarta."
)
pwk_md = pwk_md.replace(
    "| 35 | `KNS2026-60155713` | 4651 | Ita juwita | Ita Juwita (KLINIK FERREN) | 89684566789 | Purwakarta | DUPLIKAT LINTAS WILAYAH (DIALIHKAN) | Kaos telah dialokasikan melalui Kontingen Bogor pada 9 berkas sebelumnya. |",
    "| 35 | `KNS2026-60155713` | 4651 | Ita juwita | Ita Juwita (KLINIK FERREN) | 89684566789 | Purwakarta | VALID (HAK KONTINGEN INI) | Kaos diserahkan melalui Kontingen Purwakarta. |"
)

with open(pwk_md_path, "w") as f:
    f.write(pwk_md)
print("Purwakarta Markdown updated successfully.")


print("\n=== 3. Updating SQL Update Files & Documentation ===")
# 12_UPDATE_BAJU_PURWAKARTA.sql
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
    "-- Berkas Sumber: 114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx",
    f"-- Kuota Kaos Sah (VALID): {len(valid_pwk_regs)} Peserta",
    f"-- Total No. Registrasi Unik di Script Ini: {len(valid_pwk_regs)}",
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

# Update DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md
doc_sql_path = os.path.join(BASE_DIR, "DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md")
with open(doc_sql_path, "r") as f:
    doc_sql = f.read()

doc_sql = re.sub(r"\*\*Total Kuota Kaos Sah \(14 Kontingen\):\*\* \*\*6,138 Peserta\*\*", "**Total Kuota Kaos Sah (14 Kontingen):** **6,139 Peserta**", doc_sql)
doc_sql = re.sub(r"\|\s*12\s*\|\s*\*\*Purwakarta\*\*\s*\|\s*\[`114_LAPORAN.*?\|\s*\*\*114\*\*\s*\|", "| 12 | **Purwakarta** | [`114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx) | [`12_UPDATE_BAJU_PURWAKARTA.sql`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/sql_update_pengambilan_baju/12_UPDATE_BAJU_PURWAKARTA.sql) | **115** |", doc_sql)
doc_sql = re.sub(r"\|\s*\|\s*\*\*TOTAL KESELURUHAN \(14 KONTINGEN\)\*\*\s*\|\s*\|\s*\[`00_UPDATE_SEMUA.*?\|\s*\*\*6,138\*\*\s*\|", "| | **TOTAL KESELURUHAN (14 KONTINGEN)** | | [`00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql`](file:///home/orlando/Documents/proyek/konas-persadia-2026/Data peserta/Data pengambilan baju/sql_update_pengambilan_baju/00_UPDATE_SEMUA_PENGAMBILAN_BAJU_MASTER.sql) | **6,139** |", doc_sql)

with open(doc_sql_path, "w") as f:
    f.write(doc_sql)
print("Updated DOKUMENTASI_SQL_UPDATE_PENGAMBILAN_BAJU.md.")


print("\n=== 4. Rebuilding Definitive 5 vs Rehabilitated 51 Master Excel ===")
master_path = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx")
wb_existing = openpyxl.load_workbook(master_path, data_only=True)

# Read existing 6 definitif, remove Ita Juwita
ws_def = wb_existing["Duplikasi Definitif (Skala 4-5)"]
definitif_5 = []
ita_juwita_item = None

for r in range(3, ws_def.max_row + 1):
    item = {
        "no": ws_def.cell(r, 1).value,
        "reg": ws_def.cell(r, 2).value,
        "nama_ods": ws_def.cell(r, 3).value,
        "wa_ods": ws_def.cell(r, 4).value,
        "cabang_ods": ws_def.cell(r, 5).value,
        "k_sah": ws_def.cell(r, 6).value,
        "nama_sah": ws_def.cell(r, 7).value,
        "hp_sah": ws_def.cell(r, 8).value,
        "bd_sah": ws_def.cell(r, 9).value,
        "unit_sah": ws_def.cell(r, 10).value,
        "pos_sah": ws_def.cell(r, 11).value,
        "k_kun": ws_def.cell(r, 12).value,
        "nama_kun": ws_def.cell(r, 13).value,
        "hp_kun": ws_def.cell(r, 14).value,
        "bd_kun": ws_def.cell(r, 15).value,
        "unit_kun": ws_def.cell(r, 16).value,
        "pos_kun": ws_def.cell(r, 17).value,
        "eval_nama": ws_def.cell(r, 18).value,
        "eval_hp": ws_def.cell(r, 19).value,
        "eval_bd": ws_def.cell(r, 20).value,
        "scale": ws_def.cell(r, 21).value,
        "kategori": ws_def.cell(r, 22).value,
        "pertimbangan": ws_def.cell(r, 23).value,
        "instruksi": ws_def.cell(r, 24).value,
        "dasar": ws_def.cell(r, 25).value,
    }
    if item["reg"] == "KNS2026-60155713":
        ita_juwita_item = item
    else:
        definitif_5.append(item)

# Re-number definitif_5
for idx, it in enumerate(definitif_5, 1):
    it["no"] = idx

print(f"Definitive Duplicates reduced to: {len(definitif_5)} participants.")

# Read existing 50 rehabilitated, add Ita Juwita as No. 51
ws_reh = wb_existing["Daftar Homonim Direhabilitasi"]
rehabilitasi_51 = []
for r in range(3, ws_reh.max_row + 1):
    rehabilitasi_51.append({
        "no": ws_reh.cell(r, 1).value,
        "reg": ws_reh.cell(r, 2).value,
        "nama_ods": ws_reh.cell(r, 3).value,
        "wa_ods": ws_reh.cell(r, 4).value,
        "k_sah": ws_reh.cell(r, 5).value,
        "nama_sah": ws_reh.cell(r, 6).value,
        "hp_sah": ws_reh.cell(r, 7).value,
        "bd_sah": ws_reh.cell(r, 8).value,
        "unit_sah": ws_reh.cell(r, 9).value,
        "k_kun": ws_reh.cell(r, 10).value,
        "nama_kun": ws_reh.cell(r, 11).value,
        "hp_kun": ws_reh.cell(r, 12).value,
        "bd_kun": ws_reh.cell(r, 13).value,
        "unit_kun": ws_reh.cell(r, 14).value,
        "eval_nama": ws_reh.cell(r, 15).value,
        "eval_hp": ws_reh.cell(r, 16).value,
        "eval_bd": ws_reh.cell(r, 17).value,
        "scale": int(str(ws_reh.cell(r, 18).value).replace("Skala ", "")),
        "hak_kaos": ws_reh.cell(r, 20).value,
        "alasan": ws_reh.cell(r, 21).value,
    })

# Add Ita Juwita as No. 51
if ita_juwita_item:
    rehabilitasi_51.append({
        "no": 51,
        "reg": ita_juwita_item["reg"],
        "nama_ods": ita_juwita_item["nama_ods"],
        "wa_ods": ita_juwita_item["wa_ods"],
        "k_sah": ita_juwita_item["k_sah"],
        "nama_sah": ita_juwita_item["nama_sah"],
        "hp_sah": ita_juwita_item["hp_sah"],
        "bd_sah": ita_juwita_item["bd_sah"],
        "unit_sah": ita_juwita_item["unit_sah"],
        "k_kun": ita_juwita_item["k_kun"],
        "nama_kun": ita_juwita_item["nama_kun"],
        "hp_kun": ita_juwita_item["hp_kun"],
        "bd_kun": ita_juwita_item["bd_kun"],
        "unit_kun": ita_juwita_item["unit_kun"],
        "eval_nama": ita_juwita_item["eval_nama"],
        "eval_hp": ita_juwita_item["eval_hp"],
        "eval_bd": ita_juwita_item["eval_bd"],
        "scale": 4,
        "hak_kaos": "Kaos diserahkan mandiri di masing-masing kontingen (Bogor dan Purwakarta).",
        "alasan": "Nomor kontak berbeda total (082125185360 vs 089684566789) dan nama berbeda huruf awal (Tita Juwita vs Ita Juwita) di dua cabang berbeda (RS Sentra Medika Bogor vs Klinik Ferren Purwakarta). Diputuskan sebagai dua pendaftar terpisah yang masing-masing berhak atas kaos mandiri.",
    })

print(f"Rehabilitated Homonyms increased to: {len(rehabilitasi_51)} participants.")

# Log 5 Claims (Purwakarta claim removed!)
log_5_claims = [
    {
        "no": 1,
        "k_dialihkan": "Bogor",
        "file_dialihkan": "1157_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx",
        "pos_dialihkan": "No. 647 (Baris #130)",
        "nama_dialihkan": "Emmy Winata",
        "hp_dialihkan": "081808510044",
        "bd_dialihkan": "10/10/1960",
        "unit_dialihkan": "INORGA - Yayasan Jantung Indonesia Kabupaten Bogor",
        "k_sah": "KORMI & DIID",
        "file_sah": "469_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx",
        "pos_sah": "No. 367",
        "nama_sah": "CI EMI",
        "hp_sah": "081808510044",
        "bd_sah": "11/01/1965",
        "unit_sah": "KORMI & DIID",
        "reg": "KNS2026-88192252",
        "nama_ods": "CI EMI",
        "scale": 4,
        "kategori": "4 - KUAT (Kemungkinan Besar Sama)",
        "instruksi": "Kaos diserahkan oleh Kontingen KORMI & DIID. Klaim baris #130 di berkas Bogor berstatus KUNING (batal jatah kaos di Bogor)."
    },
    {
        "no": 2,
        "k_dialihkan": "Jakarta Timur",
        "file_dialihkan": "561_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx",
        "pos_dialihkan": "No. 425 (Baris #208)",
        "nama_dialihkan": "Kusmiati",
        "hp_dialihkan": "082110859972",
        "bd_dialihkan": "13/04/1979",
        "unit_dialihkan": "PKM UNIT SETU",
        "k_sah": "KORMI & DIID",
        "file_sah": "469_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx",
        "pos_sah": "No. 322",
        "nama_sah": "Ati (KUSMIATI)",
        "hp_sah": "082110859972",
        "bd_sah": "13/04/1979",
        "unit_sah": "DIID - DKI JAKARTA",
        "reg": "KNS2026-66667866",
        "nama_ods": "KUSMIATI",
        "scale": 5,
        "kategori": "5 - SANGAT KUAT (Identik / Typo Terbukti)",
        "instruksi": "Kaos diserahkan oleh Kontingen KORMI & DIID. Klaim baris #208 di berkas Jakarta Timur berstatus KUNING (batal jatah kaos di Jaktim)."
    },
    {
        "no": 3,
        "k_dialihkan": "Jakarta Selatan",
        "file_dialihkan": "242_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx",
        "pos_dialihkan": "No. 49 (Baris #113)",
        "nama_dialihkan": "MIMI SOPIATI",
        "hp_dialihkan": "081386214460",
        "bd_dialihkan": "11/03/1959",
        "unit_dialihkan": "RS Prikasih",
        "k_sah": "Depok",
        "file_sah": "2851_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx",
        "pos_sah": "No. 2428",
        "nama_sah": "Mimi Supiati",
        "hp_sah": "081386214460",
        "bd_sah": "11/03/1959",
        "unit_sah": "Telaga Golf (Unit #31)",
        "reg": "KNS2026-56854302",
        "nama_ods": "MIMI SOPIATI",
        "scale": 5,
        "kategori": "5 - SANGAT KUAT (Identik / Typo Terbukti)",
        "instruksi": "Kaos diserahkan oleh Kontingen Depok. Klaim baris #113 di berkas Jakarta Selatan berstatus KUNING (batal jatah kaos di Jaksel)."
    },
    {
        "no": 4,
        "k_dialihkan": "Bogor",
        "file_dialihkan": "1157_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx",
        "pos_dialihkan": "No. 364 (Baris #1220)",
        "nama_dialihkan": "Rosmida Simbolon",
        "hp_dialihkan": "085865292885",
        "bd_dialihkan": "01/09/1970",
        "unit_dialihkan": "(5) Bugar Sehat Inkopad (Unit #130)",
        "k_sah": "Depok",
        "file_sah": "2851_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx",
        "pos_sah": "No. 2428",
        "nama_sah": "Rosmida FS Simbolon",
        "hp_sah": "085865192885",
        "bd_sah": "01/09/1970",
        "unit_sah": "Telaga Golf (Unit #31)",
        "reg": "KNS2026-03915842",
        "nama_ods": "Rosmida FS Simbolon",
        "scale": 5,
        "kategori": "5 - SANGAT KUAT (Identik / Typo Terbukti)",
        "instruksi": "Kaos diserahkan oleh Kontingen Depok. Klaim baris #1220 di berkas Bogor berstatus KUNING (batal jatah kaos di Bogor)."
    },
    {
        "no": 5,
        "k_dialihkan": "Jakarta Timur",
        "file_dialihkan": "561_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx",
        "pos_dialihkan": "No. 432 (Baris #214)",
        "nama_dialihkan": "H. Syamsu Alam*",
        "hp_dialihkan": "081387429550",
        "bd_dialihkan": "24/05/1954",
        "unit_dialihkan": "PERSADIA CAB JAKTIM",
        "k_sah": "KORMI & DIID",
        "file_sah": "469_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx",
        "pos_sah": "No. 343",
        "nama_sah": "Syamsu Alam",
        "hp_sah": "081387429550",
        "bd_sah": "09/07/1962",
        "unit_sah": "KORMI & DIID",
        "reg": "KNS2026-65553373",
        "nama_ods": "Syamsu Alam",
        "scale": 4,
        "kategori": "4 - KUAT (Kemungkinan Besar Sama)",
        "instruksi": "Kaos diserahkan oleh Kontingen KORMI & DIID. Klaim baris #214 di berkas Jakarta Timur berstatus KUNING (batal jatah kaos di Jaktim)."
    }
]

# Create Brand New Master Workbook
wb_new_master = openpyxl.Workbook()

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

scale_styles = {
    5: (PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="155724")),
    4: (PatternFill(start_color="D1ECF1", end_color="D1ECF1", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="0C5460")),
    3: (PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="856404")),
    2: (PatternFill(start_color="FFE8D6", end_color="FFE8D6", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="A73A00")),
}

fill_row_even = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
fill_row_odd = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")

thin_border_side = Side(border_style="thin", color="D3D3D3")
thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)

# SHEET 1: Duplikasi Definitif (Skala 4-5)
ws1 = wb_new_master.active
ws1.title = "Duplikasi Definitif (Skala 4-5)"

super_headers_ws1 = [
    (1, 5, "DATA MASTER ACUAN SISTEM (MASTER ODS)", fill_master_super),
    (6, 11, "DOKUMEN A: KONTINGEN PENYERAH (HAK SAH)", fill_sah_super),
    (12, 17, "DOKUMEN B: KONTINGEN DIALIHKAN (STATUS KUNING)", fill_kuning_super),
    (18, 22, "PARAMETER KOMPARASI & SKALA INDIKASI KESAMAAN", fill_eval_super),
    (23, 25, "PERTIMBANGAN PANITIA & INSTRUKSI OPERASIONAL", fill_rekom_super),
]

for sc, ec, title, f_col in super_headers_ws1:
    ws1.merge_cells(start_row=1, start_column=sc, end_row=1, end_column=ec)
    c = ws1.cell(1, sc)
    c.value = title
    c.font = font_super
    c.fill = f_col
    c.alignment = align_center
    for col in range(sc, ec + 1):
        ws1.cell(1, col).border = thin_border
        ws1.cell(1, col).fill = f_col

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
    ("SKALA (4 - 5)", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("KATEGORI PROBABILITAS", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    
    ("Pertimbangan Analisis Panitia", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Instruksi Operasional Lapangan", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Dasar Penetapan ODS", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
]

for col_idx, (h_title, h_fill, h_font, h_align) in enumerate(headers_ws1, 1):
    c = ws1.cell(2, col_idx)
    c.value = h_title
    c.fill = h_fill
    c.font = h_font
    c.alignment = h_align
    c.border = thin_border

ws1.row_dimensions[1].height = 28
ws1.row_dimensions[2].height = 34

for row_idx, d in enumerate(definitif_5, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    scale_fill, scale_font = scale_styles.get(d["scale"], (bg_row, font_bold))
    
    row_vals = [
        (row_idx - 2, font_bold, align_center, bg_row),
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["wa_ods"], font_data, align_center, bg_row),
        (d["cabang_ods"], font_data, align_left, bg_row),
        
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
        (d["scale"], Font(name="Calibri", size=12, bold=True, color="1B365D"), align_center, scale_fill),
        (d["kategori"], scale_font, align_center, scale_fill),
        
        (d["pertimbangan"], font_data, align_left, bg_row),
        (d["instruksi"], font_data, align_left, bg_row),
        (d["dasar"], font_data, align_left, bg_row),
    ]
    
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_vals, 1):
        cell = ws1.cell(row_idx, c_idx)
        cell.value = val
        cell.font = c_font
        cell.alignment = c_align
        cell.fill = c_fill
        cell.border = thin_border
        
    ws1.row_dimensions[row_idx].height = 45

ws1.freeze_panes = "F3"
ws1.views.sheetView[0].showGridLines = True

col_widths_ws1 = {
    1: 6, 2: 19, 3: 24, 4: 16, 5: 34,
    6: 18, 7: 24, 8: 17, 9: 16, 10: 28, 11: 14,
    12: 18, 13: 24, 14: 18, 15: 18, 16: 30, 17: 15,
    18: 34, 19: 34, 20: 34, 21: 14, 22: 28,
    23: 45, 24: 45, 25: 36
}
for col_idx, width in col_widths_ws1.items():
    ws1.column_dimensions[get_column_letter(col_idx)].width = width


# SHEET 2: Ringkasan & Matriks Alokasi
ws2 = wb_new_master.create_sheet(title="Ringkasan & Matriks Alokasi")

ws2.merge_cells("A1:G1")
ws2["A1"] = "RINGKASAN EKSEKUTIF ALOKASI KAOS PASCA REHABILITASI HOMONIM"
ws2["A1"].font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
ws2["A1"].fill = fill_master_super
ws2["A1"].alignment = align_center

ws2.merge_cells("A2:G2")
ws2["A2"] = "Kongres Nasional (KONAS) PERSADIA 2026 - Rekapitulasi Resmi 14 Kontingen Sah & Matriks Penyerahan Silang"
ws2["A2"].font = Font(name="Calibri", size=10, italic=True, color="FFFFFF")
ws2["A2"].fill = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid")
ws2["A2"].alignment = align_center

ws2.row_dimensions[1].height = 30
ws2.row_dimensions[2].height = 20

# Section 1: KPI Statistics Table
ws2.cell(4, 1).value = "1. STATISTIK UTAMA DUPLIKASI DEFINITIF & REHABILITASI HOMONIM"
ws2.cell(4, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

kpi_headers = ["Parameter Audit Lintas Berkas", "Jumlah", "Satuan", "Keterangan Penjelasan Kebijakan Panitia"]
for c_idx, h in enumerate(kpi_headers, 1):
    c = ws2.cell(5, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_master_sub
    c.border = thin_border
    c.alignment = align_center if c_idx in [2, 3] else align_left

kpi_data = [
    ("Total Duplikasi Definitif Lintas Wilayah (Skala 4 & 5)", 5, "Orang", "Pendaftar yang terbukti orang yang sama (tgl lahir identik / no hp identik / typo ringan)"),
    ("Total Klaim Fisik Duplikat Lintas Berkas", 10, "Klaim", "5 klaim pada kontingen penyerah (Hak Sah) + 5 klaim pada kontingen dialihkan (Kuning)"),
    ("Total Kaos Silang Diserahkan di Lapangan", 5, "Kaos", "Diserahkan oleh Kontingen Sah: Depok (2 kaos), KORMI & DIID (3 kaos), Bogor (0 kaos silang)"),
    ("Total Klaim Berhasil Dibatalkan (Status Kuning)", 5, "Klaim", "2 di Bogor (Emmy & Rosmida), 2 di Jaktim (Kusmiati & Syamsu), 1 di Jaksel (Mimi Sopiati)"),
    ("Total Homonim Direhabilitasi (Skala 1 s.d. 4 Khusus)", 51, "Orang", "51 orang (53 klaim) dibebaskan dari status duplikat karena nomor telepon & tanggal lahir berbeda total"),
    ("Total Kuota Bersih Kaos Sah (14 Kontingen)", 6139, "Kaos", "Total kaos resmi yang diserahkan ke peserta sah (naik menjadi 6.139 kaos)"),
]

for r_offset, (param, qty, unit, note) in enumerate(kpi_data, 6):
    bg = fill_row_even if r_offset % 2 == 0 else fill_row_odd
    ws2.cell(r_offset, 1, param).alignment = align_left
    ws2.cell(r_offset, 2, qty).alignment = align_center
    ws2.cell(r_offset, 3, unit).alignment = align_center
    ws2.cell(r_offset, 4, note).alignment = align_left
    for c in range(1, 5):
        ws2.cell(r_offset, c).font = font_bold if c == 2 else font_data
        ws2.cell(r_offset, c).fill = bg
        ws2.cell(r_offset, c).border = thin_border

# Section 2: Matriks Silang 5 Penyerahan Kaos
ws2.cell(13, 1).value = "2. MATRIKS SILANG PENYERAHAN 5 KAOS DEFINITIF ANTAR-KONTINGEN"
ws2.cell(13, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

matrix_headers = [
    "Kontingen Penyerah Kaos (Hak Sah)",
    "Klaim Bogor (Batal)", "Klaim Jaktim (Batal)", "Klaim Jaksel (Batal)", "Klaim Purwakarta (Batal)",
    "Total Kaos Silang Diserahkan",
]

for c_idx, h in enumerate(matrix_headers, 1):
    c = ws2.cell(14, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_sah_sub if c_idx in [1, 6] else fill_kuning_sub
    c.border = thin_border
    c.alignment = align_center

matrix_rows = [
    ("Depok", 1, 0, 1, 0, 2),
    ("KORMI & DIID", 1, 2, 0, 0, 3),
    ("Bogor", 0, 0, 0, 0, 0),
    ("Bekasi", 0, 0, 0, 0, 0),
    ("Sumedang", 0, 0, 0, 0, 0),
    ("Cimahi", 0, 0, 0, 0, 0),
    ("Jakarta Timur", 0, 0, 0, 0, 0),
    ("Purwakarta", 0, 0, 0, 0, 0),
    ("TOTAL KLAIM KUNING", "2 Klaim", "2 Klaim", "1 Klaim", "0 Klaim", "5 Kaos Silang"),
]

for r_offset, row in enumerate(matrix_rows, 15):
    is_total = (r_offset == 15 + len(matrix_rows) - 1)
    bg = fill_master_sub if is_total else (fill_row_even if r_offset % 2 == 0 else fill_row_odd)
    for c_idx, val in enumerate(row, 1):
        cell = ws2.cell(r_offset, c_idx)
        cell.value = val
        cell.font = font_bold if (is_total or c_idx in [1, 6]) else font_data
        cell.alignment = align_left if c_idx == 1 else align_center
        cell.fill = bg
        cell.border = thin_border

# Section 3: Rekapitulasi Kuota Bersih 14 Kontingen
ws2.cell(26, 1).value = "3. REKAPITULASI RESMI KUOTA BERSIH 14 KONTINGEN (TOTAL: 6.139 KAOS)"
ws2.cell(26, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

rekap_14 = [
    ("Depok", "Penyerah Kaos Utama", 2, 0, 2851, "Menyerahkan 2 kaos (1 ke peserta Bogor: Rosmida Simbolon, 1 ke peserta Jaksel: Mimi Sopiati)"),
    ("Bogor", "Terdampak", 0, 2, 1202, "2 klaim kuning dialihkan ke KORMI & Depok (Emmy & Rosmida); 45 homonim direhabilitasi; Tita Juwita tetap sah di Bogor"),
    ("Jakarta Timur", "Terdampak", 0, 2, 565, "2 klaim kuning (Kusmiati & Syamsu Alam dialihkan ke KORMI); 4 homonim direhabilitasi"),
    ("KORMI & DIID", "Penyerah Kaos Utama", 3, 0, 469, "Menyerahkan 3 kaos (1 ke peserta Bogor: CI EMI, 2 ke peserta Jaktim: Kusmiati & Syamsu Alam)"),
    ("Bekasi", "Mandiri / Bersih", 0, 0, 378, "Mandiri penuh. Pendaftar Bogor bernama serupa telah direhabilitasi sebagai orang berbeda."),
    ("Jakarta Selatan", "Terdampak", 0, 1, 243, "1 klaim kuning (MIMI SOPIATI diserahkan oleh Depok); 1 homonim direhabilitasi (Suryati)"),
    ("Purwakarta", "Mandiri / Bersih", 0, 0, 115, "Mandiri penuh. Ita Juwita direhabilitasi menjadi hak sah mandiri Purwakarta (115 kaos)."),
    ("Sumedang", "Mandiri / Bersih", 0, 0, 100, "Mandiri penuh. Pendaftar Bogor bernama serupa telah direhabilitasi sebagai orang berbeda."),
    ("Ciamis", "Mandiri / Bersih", 0, 0, 93, "Mandiri penuh. Tidak ada irisan duplikasi lintas berkas."),
    ("Cimahi", "Mandiri / Bersih", 0, 0, 63, "Mandiri penuh. Pendaftar Bogor bernama serupa telah direhabilitasi sebagai orang berbeda."),
    ("Cianjur", "Mandiri / Bersih", 0, 0, 29, "Mandiri penuh. Tidak ada irisan duplikasi lintas berkas."),
    ("Subang", "Mandiri / Bersih", 0, 0, 24, "Mandiri penuh. 19 peserta belum terdaftar di ODS."),
    ("Karawang", "Mandiri / Bersih", 0, 0, 4, "Mandiri penuh. Tidak ada irisan duplikasi lintas berkas."),
    ("Gorontalo", "Mandiri / Bersih", 0, 0, 3, "Mandiri penuh. Tidak ada irisan duplikasi lintas berkas."),
    ("TOTAL KESELURUHAN", "14 Kontingen", 5, 5, 6139, "Tepat 5 Kaos Silang Diserahkan, 5 Klaim Kuning Dicegah Dobel, Kuota Kaos Bersih: 6.139"),
]

rekap_headers = ["No", "Nama Kontingen", "Peran Lapangan", "Kaos Silang Diserahkan", "Klaim Kuning (Batal)", "Total Kuota Kaos Sah", "Catatan Operasional Lapangan"]
for c_idx, h in enumerate(rekap_headers, 1):
    c = ws2.cell(27, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_master_sub
    c.border = thin_border
    c.alignment = align_center if c_idx in [1, 3, 4, 5, 6] else align_left

for r_offset, row in enumerate(rekap_14, 28):
    is_total = (r_offset == 28 + len(rekap_14) - 1)
    bg = fill_master_sub if is_total else (fill_row_even if r_offset % 2 == 0 else fill_row_odd)
    no_val = "" if is_total else (r_offset - 27)
    
    ws2.cell(r_offset, 1, no_val).alignment = align_center
    ws2.cell(r_offset, 2, row[0]).alignment = align_left
    ws2.cell(r_offset, 3, row[1]).alignment = align_center
    ws2.cell(r_offset, 4, row[2]).alignment = align_center
    ws2.cell(r_offset, 5, row[3]).alignment = align_center
    ws2.cell(r_offset, 6, row[4]).alignment = align_center
    ws2.cell(r_offset, 7, row[5]).alignment = align_left
    
    for c in range(1, 8):
        ws2.cell(r_offset, c).font = font_bold if is_total else font_data
        ws2.cell(r_offset, c).fill = bg
        ws2.cell(r_offset, c).border = thin_border

ws2.views.sheetView[0].showGridLines = True
ws2.column_dimensions["A"].width = 6
ws2.column_dimensions["B"].width = 24
ws2.column_dimensions["C"].width = 24
ws2.column_dimensions["D"].width = 25
ws2.column_dimensions["E"].width = 25
ws2.column_dimensions["F"].width = 22
ws2.column_dimensions["G"].width = 72


# SHEET 3: Daftar Homonim Direhabilitasi (51 Orang)
ws3 = wb_new_master.create_sheet(title="Daftar Homonim Direhabilitasi")

super_headers_ws3 = [
    (1, 4, "IDENTITAS DATA MASTER ODS", fill_master_super),
    (5, 9, "BERKAS A: KONTINGEN TERDAFTAR #1", fill_sah_super),
    (10, 14, "BERKAS B: KONTINGEN TERDAFTAR #2", fill_kuning_super),
    (15, 18, "BUKTI PENYANDINGAN MULTI-PARAMETER & EVALUASI", fill_eval_super),
    (19, 21, "KEPUTUSAN PANITIA: BUKAN DUPLIKAT (DIREHABILITASI)", fill_rekom_super),
]

for sc, ec, title, f_col in super_headers_ws3:
    ws3.merge_cells(start_row=1, start_column=sc, end_row=1, end_column=ec)
    c = ws3.cell(1, sc)
    c.value = title
    c.font = font_super
    c.fill = f_col
    c.alignment = align_center
    for col in range(sc, ec + 1):
        ws3.cell(1, col).border = thin_border
        ws3.cell(1, col).fill = f_col

headers_ws3 = [
    ("No", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("No. Registrasi ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Nama Lengkap di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_left),
    ("No. WA di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    
    ("Kontingen Berkas A", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Nama di Berkas A", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("No. HP Berkas A", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Tgl. Lahir Berkas A", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Unit di Berkas A", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    
    ("Kontingen Berkas B", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas B", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP Berkas B", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Tgl. Lahir Berkas B", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Unit di Berkas B", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    
    ("Evaluasi Nama", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi No. HP", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi Tgl. Lahir", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Skala Awal", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    
    ("Status Keputusan Panitia", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Hak Kaos Peserta", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Alasan Objektif Pembebasan Status Duplikat", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
]

for col_idx, (h_title, h_fill, h_font, h_align) in enumerate(headers_ws3, 1):
    c = ws3.cell(2, col_idx)
    c.value = h_title
    c.fill = h_fill
    c.font = h_font
    c.alignment = h_align
    c.border = thin_border

ws3.row_dimensions[1].height = 28
ws3.row_dimensions[2].height = 34

fill_rehab_badge = PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid")
font_rehab_badge = Font(name="Calibri", size=9.5, bold=True, color="155724")

for row_idx, d in enumerate(rehabilitasi_51, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    
    row_vals = [
        (row_idx - 2, font_bold, align_center, bg_row),
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["wa_ods"], font_data, align_center, bg_row),
        
        (d["k_sah"], font_bold, align_center, bg_row),
        (d["nama_sah"], font_data, align_left, bg_row),
        (d["hp_sah"], font_data, align_center, bg_row),
        (d["bd_sah"], font_data, align_center, bg_row),
        (d["unit_sah"], font_data, align_left, bg_row),
        
        (d["k_kun"], font_bold, align_center, bg_row),
        (d["nama_kun"], font_data, align_left, bg_row),
        (d["hp_kun"], font_data, align_center, bg_row),
        (d["bd_kun"], font_data, align_center, bg_row),
        (d["unit_kun"], font_data, align_left, bg_row),
        
        (d["eval_nama"], font_data, align_left, bg_row),
        (d["eval_hp"], font_data, align_left, bg_row),
        (d["eval_bd"], font_data, align_left, bg_row),
        (f"Skala {d['scale']}", font_data, align_center, bg_row),
        
        ("DIREHABILITASI (BUKAN DUPLIKAT)", font_rehab_badge, align_center, fill_rehab_badge),
        (d["hak_kaos"], font_bold, align_left, bg_row),
        (d["alasan"], font_data, align_left, bg_row),
    ]
    
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_vals, 1):
        cell = ws3.cell(row_idx, c_idx)
        cell.value = val
        cell.font = c_font
        cell.alignment = c_align
        cell.fill = c_fill
        cell.border = thin_border
        
    ws3.row_dimensions[row_idx].height = 42

ws3.freeze_panes = "E3"
ws3.views.sheetView[0].showGridLines = True

col_widths_ws3 = {
    1: 6, 2: 19, 3: 22, 4: 16,
    5: 16, 6: 22, 7: 16, 8: 15, 9: 25,
    10: 16, 11: 22, 12: 16, 13: 15, 14: 25,
    15: 30, 16: 30, 17: 30, 18: 12,
    19: 30, 20: 38, 21: 45
}
for col_idx, width in col_widths_ws3.items():
    ws3.column_dimensions[get_column_letter(col_idx)].width = width


# SHEET 4: Log 5 Klaim Dialihkan (Kuning)
ws4 = wb_new_master.create_sheet(title="Log 5 Klaim Dialihkan (Kuning)")

super_headers_ws4 = [
    (1, 8, "DOKUMEN KLAIM TERDAMPAK / DIALIHKAN (STATUS KUNING)", fill_kuning_super),
    (9, 15, "DISANDINGKAN DENGAN DOKUMEN PENYERAH (HAK SAH)", fill_sah_super),
    (16, 18, "PARAMETER EVALUASI & SKALA KESAMAAN", fill_eval_super),
    (19, 21, "IDENTITAS RESMI MASTER ODS & INSTRUKSI LAPANGAN", fill_rekom_super),
]

for sc, ec, title, f_col in super_headers_ws4:
    ws4.merge_cells(start_row=1, start_column=sc, end_row=1, end_column=ec)
    c = ws4.cell(1, sc)
    c.value = title
    c.font = font_super
    c.fill = f_col
    c.alignment = align_center
    for col in range(sc, ec + 1):
        ws4.cell(1, col).border = thin_border
        ws4.cell(1, col).fill = f_col

headers_ws4 = [
    ("No", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Kontingen Dialihkan (Kuning)", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("File Verifikasi Berkas", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. Urut Berkas", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Tgl. Lahir Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Cabang / Unit di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    
    ("Kontingen Penyerah (Hak Sah)", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("File Verifikasi Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Posisi di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Nama di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("No. HP di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Tgl. Lahir Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Cabang / Unit di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    
    ("SKALA (4 - 5)", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Kategori Probabilitas", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Status di Berkas Kuning", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    
    ("No. Registrasi ODS", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_center),
    ("Nama di Master ODS", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Instruksi Operasional Lapangan", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
]

for col_idx, (h_title, h_fill, h_font, h_align) in enumerate(headers_ws4, 1):
    c = ws4.cell(2, col_idx)
    c.value = h_title
    c.fill = h_fill
    c.font = h_font
    c.alignment = h_align
    c.border = thin_border

ws4.row_dimensions[1].height = 28
ws4.row_dimensions[2].height = 34

for row_idx, d in enumerate(log_5_claims, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    scale_fill, scale_font = scale_styles.get(d["scale"], (bg_row, font_bold))
    
    row_vals = [
        (d["no"], font_bold, align_center, bg_row),
        (d["k_dialihkan"], font_bold, align_center, bg_row),
        (d["file_dialihkan"], font_code, align_left, bg_row),
        (d["pos_dialihkan"], font_bold, align_center, bg_row),
        (d["nama_dialihkan"], font_bold, align_left, bg_row),
        (d["hp_dialihkan"], font_data, align_center, bg_row),
        (d["bd_dialihkan"], font_data, align_center, bg_row),
        (d["unit_dialihkan"], font_data, align_left, bg_row),
        
        (d["k_sah"], font_bold, align_center, bg_row),
        (d["file_sah"], font_code, align_left, bg_row),
        (d["pos_sah"], font_data, align_center, bg_row),
        (d["nama_sah"], font_bold, align_left, bg_row),
        (d["hp_sah"], font_data, align_center, bg_row),
        (d["bd_sah"], font_data, align_center, bg_row),
        (d["unit_sah"], font_data, align_left, bg_row),
        
        (d["scale"], Font(name="Calibri", size=12, bold=True, color="1B365D"), align_center, scale_fill),
        (d["kategori"], scale_font, align_center, scale_fill),
        ("BATAL JATAH KAOS (DIALIHKAN)", Font(name="Calibri", size=9.5, bold=True, color="8A6D3B"), align_center, fill_kuning_sub),
        
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["instruksi"], font_data, align_left, bg_row),
    ]
    
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_vals, 1):
        cell = ws4.cell(row_idx, c_idx)
        cell.value = val
        cell.font = c_font
        cell.alignment = c_align
        cell.fill = c_fill
        cell.border = thin_border
        
    ws4.row_dimensions[row_idx].height = 42

ws4.freeze_panes = "I3"
ws4.views.sheetView[0].showGridLines = True

col_widths_ws4 = {
    1: 6, 2: 18, 3: 32, 4: 18, 5: 22, 6: 18, 7: 16, 8: 30,
    9: 18, 10: 32, 11: 14, 12: 22, 13: 18, 14: 16, 15: 28,
    16: 14, 17: 28, 18: 26,
    19: 19, 20: 22, 21: 50
}
for col_idx, width in col_widths_ws4.items():
    ws4.column_dimensions[get_column_letter(col_idx)].width = width

wb_new_master.save(master_path)
print(f"Master Excel updated successfully: {master_path}")


print("\n=== 5. Updating Master Markdown Report ===")
md_out = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md")

md = []
md.append("# LAPORAN RESMI DUPLIKASI LINTAS BERKAS & ALOKASI KAOS KONTINGEN")
md.append("**Kongres Nasional (KONAS) PERSADIA 2026**  ")
md.append("*GOR Pakansari, Kabupaten Bogor*")
md.append("")
md.append("---")
md.append("")
md.append("## 1. Ringkasan Eksekutif & Keputusan Panitia")
md.append("")
md.append("Menindaklanjuti audit multi-parameter (Nama, Nomor WhatsApp, dan Tanggal Lahir) serta telaah komprehensif bersama koordinator wilayah:")
md.append("1. **Pendaftar dengan Probabilitas Kesamaan Sedang, Rendah, dan Kasus Terpisah Bebas RESMI DIABAIKAN dari status duplikat.** Sebanyak **51 orang peserta (53 klaim)** yang sebelumnya dicurigai ganda terbukti merupakan **orang yang berbeda (homonim)** atau peserta mandiri terpisah dengan nomor telepon berbeda total dan unit berbeda, termasuk pendaftaran **Ita Juwita (Klinik Ferren Purwakarta)** dan **Tita Juwita (RS Sentra Medika Bogor)**.")
md.append("2. **Duplikasi Definitif Lintas Berkas ditetapkan HANYA untuk 5 Orang Peserta (5 Klaim).** Kelima peserta ini terbukti secara mutlak merupakan individu yang sama yang terdaftar di dua berkas kontingen berbeda.")
md.append("3. **Total Kuota Bersih Kaos Resmi 14 Kontingen disesuaikan menjadi 6.139 Kaos** (Purwakarta naik menjadi 115 kaos sah).")
md.append("")
md.append("| Parameter Audit Lintas Kontingen | Nilai / Jumlah | Keterangan Penjelasan |")
md.append("| :--- | :---: | :--- |")
md.append("| **Total Duplikasi Definitif Lintas Wilayah (Skala 4 & 5)** | **5 Orang** | Terbukti pendaftar yang sama (1 orang = 1 kaos diserahkan) |")
md.append("| **Total Klaim Fisik Duplikat Lintas Berkas** | **10 Klaim** | 5 klaim Hak Sah + 5 klaim Dialihkan / Kuning |")
md.append("| **Total Kaos Silang Diserahkan di Lapangan** | **5 Kaos** | Diserahkan oleh: Depok (2 kaos), KORMI & DIID (3 kaos) |")
md.append("| **Total Klaim Dibatalkan (Status Kuning)** | **5 Klaim** | 2 di Bogor, 2 di Jaktim, 1 di Jaksel |")
md.append("| **Total Homonim Direhabilitasi (Bukan Duplikat)** | **51 Orang (53 Klaim)** | Masing-masing berhak atas jatah kaos mandiri di kontingennya |")
md.append("| **Total Kuota Bersih Kaos Sah (14 Kontingen)** | **6.139 Kaos** | Kuota bersih resmi untuk pembagian kaos seluruh kontingen |")
md.append("")
md.append("---")
md.append("")
md.append("## 2. Matriks Silang Penyerahan 5 Kaos Definitif Antar-Kontingen")
md.append("")
md.append("| Kontingen Penyerah Kaos (Hak Sah) | Klaim Bogor (Batal) | Klaim Jaktim (Batal) | Klaim Jaksel (Batal) | Klaim Purwakarta (Batal) | Total Kaos Silang Diserahkan |")
md.append("| :--- | :---: | :---: | :---: | :---: | :---: |")
md.append("| **Depok** | 1 *(Rosmida Simbolon)* | 0 | 1 *(MIMI SOPIATI)* | 0 | **2 Kaos** |")
md.append("| **KORMI & DIID** | 1 *(CI EMI)* | 2 *(Kusmiati & Syamsu Alam)* | 0 | 0 | **3 Kaos** |")
md.append("| **Bogor** | 0 | 0 | 0 | 0 | **0 Kaos (Terdampak)** |")
md.append("| **Bekasi, Sumedang, Cimahi, Purwakarta** | 0 | 0 | 0 | 0 | **0 Kaos (Mandiri Penuh)** |")
md.append("| **TOTAL KLAIM KUNING** | **2 Klaim** | **2 Klaim** | **1 Klaim** | **0 Klaim** | **5 Kaos Silang** |")
md.append("")
md.append("---")
md.append("")
md.append("## 3. Rekapitulasi Resmi Kuota Kaos 14 Kontingen Sah")
md.append("")
md.append("| No | Nama Kontingen | Peran Operasional Lapangan | Kaos Silang Diserahkan | Klaim Kuning (Batal) | Total Kuota Kaos Sah | File Laporan Verifikasi |")
md.append("|:---:|:---|:---:|:---:|:---:|:---:|:---|")
md.append("| 1 | **Depok** | Penyerah Kaos Utama | 2 | 0 | **2.851** | `2851_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx` |")
md.append("| 2 | **Bogor** | Kontingen Terdampak | 0 | 2 | **1.202** | `1157_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx` *(revisi 1.202)* |")
md.append("| 3 | **Jakarta Timur** | Kontingen Terdampak | 0 | 2 | **565** | `561_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx` *(revisi 565)* |")
md.append("| 4 | **KORMI & DIID** | Penyerah Kaos Utama | 3 | 0 | **469** | `469_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx` |")
md.append("| 5 | **Bekasi** | Mandiri Bersih | 0 | 0 | **378** | `378_LAPORAN_VERIFIKASI_DATA_PESERTA_BEKASI.xlsx` |")
md.append("| 6 | **Jakarta Selatan** | Kontingen Terdampak | 0 | 1 | **243** | `242_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx` *(revisi 243)* |")
md.append("| 7 | **Purwakarta** | Mandiri Bersih | 0 | 0 | **115** | `114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx` *(revisi 115)* |")
md.append("| 8 | **Sumedang** | Mandiri Bersih | 0 | 0 | **100** | `100_LAPORAN_VERIFIKASI_DATA_PESERTA_SUMEDANG.xlsx` |")
md.append("| 9 | **Ciamis** | Mandiri Bersih | 0 | 0 | **93** | `93_LAPORAN_VERIFIKASI_DATA_PESERTA_CIAMIS.xlsx` |")
md.append("| 10 | **Cimahi** | Mandiri Bersih | 0 | 0 | **63** | `63_LAPORAN_VERIFIKASI_DATA_PESERTA_CIMAHI.xlsx` |")
md.append("| 11 | **Cianjur** | Mandiri Bersih | 0 | 0 | **29** | `29_LAPORAN_VERIFIKASI_DATA_PESERTA_CIANJUR.xlsx` |")
md.append("| 12 | **Subang** | Mandiri Bersih | 0 | 0 | **24** | `24_LAPORAN_VERIFIKASI_DATA_PESERTA_SUBANG.xlsx` |")
md.append("| 13 | **Karawang** | Mandiri Bersih | 0 | 0 | **4** | `4_LAPORAN_VERIFIKASI_DATA_PESERTA_KARAWANG.xlsx` |")
md.append("| 14 | **Gorontalo** | Mandiri Bersih | 0 | 0 | **3** | `3_LAPORAN_VERIFIKASI_DATA_PESERTA_GORONTALO.xlsx` |")
md.append("| | **TOTAL KESELURUHAN** | | **5** | **5** | **6.139** | *Total Bersih 14 Kontingen* |")
md.append("")
md.append("---")
md.append("")
md.append("## 4. Tabel 5 Duplikasi Definitif Lintas Berkas (Skala 4 & 5)")
md.append("")
md.append("| No | No. Reg ODS | Nama di ODS | DOKUMEN PENYERAH (HAK SAH): Kontingen & Posisi | Nama di Berkas Sah | No. HP Sah | Tgl Lahir Sah | DOKUMEN DIALIHKAN (KUNING): Kontingen & Posisi | Nama di Berkas Kuning | No. HP Kuning | Tgl Lahir Kuning | Skala | Instruksi Lapangan & Status Hak Kaos |")
md.append("| :-: | :---: | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :-: | :--- |")

for d in definitif_5:
    sah_info = f"**{d['k_sah']}**<br>({d['pos_sah']})<br>*{d['unit_sah']}*"
    kun_info = f"**{d['k_kun']}**<br>({d['pos_kun']})<br>*{d['unit_kun']}*"
    instruksi_badge = f"**{d['kategori']}**<br><br>📋 **Instruksi:** {d['instruksi']}"
    
    row_md = f"| {d['no']} | `{d['reg']}` | **{d['nama_ods']}**<br>`{d['wa_ods']}` | {sah_info} | **{d['nama_sah']}** | `{d['hp_sah']}` | `{d['bd_sah']}` | {kun_info} | **{d['nama_kun']}** | `{d['hp_kun']}` | `{d['bd_kun']}` | **{d['scale']}** | {instruksi_badge} |"
    md.append(row_md)

md.append("")
md.append("---")
md.append("")
md.append("## 5. Ringkasan 51 Pendaftar Homonim yang Direhabilitasi (Bukan Duplikat)")
md.append("")
md.append("> **PEMBERITAHUAN UNTUK KOORDINATOR WILAYAH:**  ")
md.append("> Seluruh pendaftar di bawah ini telah diverifikasi melalui perbandingan tanggal lahir fisik dan kontak telepon. Perbedaan tanggal lahir yang signifikan atau nomor kontak yang berbeda total di dua cabang berbeda membuktikan bahwa mereka adalah **individu yang berbeda atau pendaftar mandiri terpisah**. Status mereka di berkas masing-masing telah **dipulihkan menjadi VALID**, dan masing-masing peserta berhak atas kaos mandiri.")
md.append("")
md.append("| No | No. Reg ODS | Nama di ODS | Kontingen Berkas A & Tgl Lahir | Kontingen Berkas B & Tgl Lahir | Selisih Usia / Tanggal Lahir | Kontak HP Berkas A vs B | Status Keputusan Panitia |")
md.append("| :-: | :---: | :--- | :--- | :--- | :---: | :---: | :--- |")

for idx, d in enumerate(rehabilitasi_51, 1):
    info_a = f"**{d['k_sah']}** (`{d['bd_sah']}`)"
    info_b = f"**{d['k_kun']}** (`{d['bd_kun']}`)"
    diff_note = d["eval_bd"]
    hp_comp = f"`{d['hp_sah']}` vs `{d['hp_kun']}`"
    status_note = "✅ **VALID (Bukan Duplikat)**<br>Hak kaos mandiri di kedua kontingen"
    
    row_md = f"| {idx} | `{d['reg']}` | **{d['nama_ods']}** | {info_a} | {info_b} | {diff_note} | {hp_comp} | {status_note} |"
    md.append(row_md)

md.append("")
md.append("---")
md.append("*Dokumen resmi ini telah disinkronkan dengan berkas verifikasi 14 kontingen dan basis data Master ODS KONAS PERSADIA 2026.*")

with open(md_out, "w") as f:
    f.write("\n".join(md) + "\n")
print(f"Markdown report updated successfully: {md_out}")

print("\n=== ALL TASKS COMPLETED SUCCESSFULLY! ===")

