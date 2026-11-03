#!/usr/bin/env python3
"""
generate_complete_duplikasi_excel.py
Menghasilkan LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx
dengan menyandingkan data temuan sebelah-menyebelah secara lengkap:
- Data Master ODS
- Data di Dokumen Penyerah (Hak Sah): Nama, No HP, Cabang/Unit/Faskes, No Urut
- Data di Dokumen Dialihkan (Status Kuning): Nama, No HP, Cabang/Unit/Faskes, No Urut
- Analisis Komparasi Nama & No HP serta Instruksi Lapangan
"""

import os
import re
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

BASE_DIR = "Data peserta/Data pengambilan baju"
OUTPUT_XLSX = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx")

def clean_reg(val):
    if not val:
        return ""
    m = re.search(r"KNS2026-\d+", str(val))
    return m.group(0) if m else str(val).strip("` ")

def clean_phone(val):
    if not val:
        return "-"
    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    # Remove non-digits except +
    clean = re.sub(r"[^\d+]", "", s)
    if clean.startswith("62") and not clean.startswith("+62"):
        clean = "0" + clean[2:]
    elif clean.startswith("+62"):
        clean = "0" + clean[3:]
    elif clean.startswith("8"):
        clean = "0" + clean
    return clean if clean else s

# 1. Parse Markdown Files to build comprehensive lookup
print("Loading data from Markdown files and source Excel files...")

bogor_map = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_BOGOR.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP 1.242 PESERTA" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                reg = clean_reg(parts[7])
                if reg:
                    bogor_map.setdefault(reg, []).append({
                        "global_no": parts[0],
                        "unit": parts[1],
                        "no_unit": parts[2],
                        "nama": parts[3],
                        "hp": parts[4],
                        "tgl_lahir": parts[5],
                        "status": parts[6],
                        "cabang_ods": parts[10] if len(parts) > 10 else "Bogor",
                    })

depok_map = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_DEPOK.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP 2.859 PESERTA" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 11:
                reg = clean_reg(parts[10])
                if reg:
                    depok_map.setdefault(reg, []).append({
                        "global_no": parts[0],
                        "unit": parts[2],
                        "no_unit": parts[3],
                        "nama": parts[4],
                        "hp": parts[8],
                        "tgl_lahir": parts[6],
                        "jk": parts[7],
                        "cabang_ods": parts[13] if len(parts) > 13 else "PERSADIA Cabang Kota Depok",
                    })

kormi_map = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_KORMI_DIID.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP 486 PESERTA" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                reg = clean_reg(parts[7])
                if reg:
                    kormi_map.setdefault(reg, []).append({
                        "global_no": parts[0],
                        "unit": parts[1],
                        "nama": parts[2],
                        "hp": parts[6],
                        "tgl_lahir": parts[4],
                        "jk": parts[5],
                        "cabang_ods": parts[10] if len(parts) > 10 else "Kormi & DIID",
                    })

jaktim_map = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_TIMUR.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP" in line or "## 4. TABEL LENGKAP" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                reg = clean_reg(parts[7])
                if reg:
                    jaktim_map.setdefault(reg, []).append({
                        "global_no": parts[0],
                        "unit": parts[1],
                        "nama": parts[2],
                        "hp": parts[5],
                        "tgl_lahir": parts[3],
                        "jk": parts[4],
                        "cabang_ods": parts[10] if len(parts) > 10 else "Jakarta Timur",
                    })

# Bekasi from 380 - Bekasi.xlsx
bekasi_map = {}
wb_bekasi = openpyxl.load_workbook(os.path.join(BASE_DIR, "380 - Bekasi.xlsx"), data_only=True)
ws_b = wb_bekasi.active
for r in range(2, ws_b.max_row + 1):
    nama_b = str(ws_b.cell(r, 1).value or "").strip()
    wa_b = str(ws_b.cell(r, 3).value or "").strip()
    cab_b = str(ws_b.cell(r, 9).value or "").strip()
    bekasi_map[nama_b.lower()] = {
        "global_no": str(r - 1),
        "nama": nama_b,
        "hp": wa_b,
        "unit": cab_b or "Cabang Kota Bekasi",
    }

# Sumedang from 100 - Sumedang.xlsx
sumedang_map = {}
wb_sum = openpyxl.load_workbook(os.path.join(BASE_DIR, "100 - Sumedang.xlsx"), data_only=True)
ws_s = wb_sum.active
for r in range(3, ws_s.max_row + 1):
    nama_s = str(ws_s.cell(r, 3).value or "").strip()
    hp_s = str(ws_s.cell(r, 6).value or "").strip()
    reg_s = str(ws_s.cell(r, 7).value or "").strip()
    unit_s = str(ws_s.cell(r, 2).value or "").strip()
    sumedang_map[nama_s.lower()] = {
        "global_no": str(ws_s.cell(r, 1).value or (r - 2)),
        "nama": nama_s,
        "hp": hp_s,
        "unit": unit_s or "PERSADIA Cabang Sumedang",
        "reg": reg_s,
    }

# Cimahi from DAFTAR_NO_REGISTRASI_PESERTA_CIMAHI.md
cimahi_map = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_CIMAHI.md")) as f:
    in_table = False
    for line in f:
        if "## 4. TABEL LENGKAP" in line or "## 5. TABEL LENGKAP" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 7:
                reg = clean_reg(parts[6])
                if reg:
                    cimahi_map[reg] = [{
                        "global_no": parts[0],
                        "nama": parts[1],
                        "hp": parts[4],
                        "unit": "PERSADIA Cabang Cimahi",
                    }]

# Jaksel
jaksel_map = {
    "KNS2026-56854302": [{
        "global_no": "49",
        "nama": "MIMI SOPIATI",
        "hp": "0813 8621 4460",
        "unit": "RS Prikasih",
    }],
    "KNS2026-90423191": [{
        "global_no": "30",
        "nama": "Suryati",
        "hp": "8129052865",
        "unit": "RS Fatmawati",
    }]
}

# Purwakarta
purwakarta_map = {
    "KNS2026-60155713": [{
        "global_no": "35",
        "nama": "Ita Juwita",
        "hp": "89684566789",
        "unit": "KLINIK FERREN",
    }]
}

# Load current Excel to get existing 56 entries and logic
wb_curr = openpyxl.load_workbook(OUTPUT_XLSX, data_only=True)
ws_curr = wb_curr["Penyerahan Kaos Lintas Berkas"]

items_56 = []
for r in range(2, ws_curr.max_row + 1):
    no = ws_curr.cell(r, 1).value
    nama_ods = ws_curr.cell(r, 2).value
    reg = clean_reg(ws_curr.cell(r, 3).value)
    wa_ods = ws_curr.cell(r, 4).value
    cabang_ods = ws_curr.cell(r, 5).value
    k_sah = ws_curr.cell(r, 6).value
    pos_sah_old = ws_curr.cell(r, 7).value
    k_kuning = ws_curr.cell(r, 8).value
    pos_kuning_old = ws_curr.cell(r, 9).value
    instruksi = ws_curr.cell(r, 10).value
    dasar = ws_curr.cell(r, 11).value
    
    items_56.append({
        "no": no,
        "nama_ods": nama_ods,
        "reg": reg,
        "wa_ods": str(wa_ods).strip() if wa_ods else "",
        "cabang_ods": cabang_ods,
        "k_sah": k_sah,
        "pos_sah_old": pos_sah_old,
        "k_kuning": k_kuning,
        "pos_kuning_old": pos_kuning_old,
        "instruksi": instruksi,
        "dasar": dasar,
    })

print(f"Total base items: {len(items_56)}")

# Helper to get specific info
def get_party_info(kontingen, reg, nama_ods):
    if kontingen == "Bogor":
        res = bogor_map.get(reg, [])
        return res
    elif kontingen == "Depok":
        res = depok_map.get(reg, [])
        return res
    elif kontingen == "KORMI & DIID":
        res = kormi_map.get(reg, [])
        return res
    elif kontingen == "Jakarta Timur":
        res = jaktim_map.get(reg, [])
        return res
    elif kontingen == "Bekasi":
        b = bekasi_map.get(nama_ods.lower())
        if not b:
            for k, v in bekasi_map.items():
                if nama_ods.lower() in k or k in nama_ods.lower():
                    b = v
                    break
        return [b] if b else []
    elif kontingen == "Sumedang":
        s = sumedang_map.get(nama_ods.lower())
        if not s:
            for k, v in sumedang_map.items():
                if nama_ods.lower() in k or k in nama_ods.lower():
                    s = v
                    break
        return [s] if s else []
    elif kontingen == "Cimahi":
        return cimahi_map.get(reg, [])
    elif kontingen == "Jakarta Selatan":
        return jaksel_map.get(reg, [])
    elif kontingen == "Purwakarta":
        return purwakarta_map.get(reg, [])
    return []

# File verification map for reference
verification_file_map = {
    "Sumedang": "100_LAPORAN_VERIFIKASI_DATA_PESERTA_SUMEDANG.xlsx",
    "Cianjur": "29_LAPORAN_VERIFIKASI_DATA_PESERTA_CIANJUR.xlsx",
    "Cimahi": "63_LAPORAN_VERIFIKASI_DATA_PESERTA_CIMAHI.xlsx",
    "Ciamis": "93_LAPORAN_VERIFIKASI_DATA_PESERTA_CIAMIS.xlsx",
    "Bekasi": "378_LAPORAN_VERIFIKASI_DATA_PESERTA_BEKASI.xlsx",
    "KORMI & DIID": "469_LAPORAN_VERIFIKASI_DATA_PESERTA_KORMI_DIID.xlsx",
    "Jakarta Timur": "561_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_TIMUR.xlsx",
    "Bogor": "1157_LAPORAN_VERIFIKASI_DATA_PESERTA_BOGOR.xlsx",
    "Depok": "2851_LAPORAN_VERIFIKASI_DATA_PESERTA_DEPOK.xlsx",
    "Gorontalo": "3_LAPORAN_VERIFIKASI_DATA_PESERTA_GORONTALO.xlsx",
    "Karawang": "4_LAPORAN_VERIFIKASI_DATA_PESERTA_KARAWANG.xlsx",
    "Purwakarta": "114_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx",
    "Subang": "24_LAPORAN_VERIFIKASI_DATA_PESERTA_SUBANG.xlsx",
    "Jakarta Selatan": "242_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx",
}

# Build enriched 56 rows
enriched_56 = []
for item in items_56:
    reg = item["reg"]
    nama_ods = item["nama_ods"]
    wa_ods = item["wa_ods"]
    cab_ods = item["cabang_ods"]
    k_sah = item["k_sah"]
    k_kuning = item["k_kuning"]
    
    # Party A (Sah)
    sah_list = get_party_info(k_sah, reg, nama_ods)
    sah_item = sah_list[0] if sah_list else {}
    nama_sah = sah_item.get("nama") or nama_ods
    hp_sah = clean_phone(sah_item.get("hp")) or clean_phone(wa_ods)
    unit_sah = sah_item.get("unit") or cab_ods
    if "no_unit" in sah_item and sah_item["no_unit"]:
        unit_sah_display = f"{unit_sah} (Unit #{sah_item['no_unit']})"
    else:
        unit_sah_display = unit_sah
    pos_sah_display = f"No. {sah_item.get('global_no', '-')}"
    
    # Party B (Kuning)
    kuning_list = get_party_info(k_kuning, reg, nama_ods)
    if len(kuning_list) == 1:
        k_item = kuning_list[0]
        nama_kuning = k_item.get("nama") or nama_ods
        hp_kuning = clean_phone(k_item.get("hp")) or "-"
        unit_kuning = k_item.get("unit") or "-"
        if "no_unit" in k_item and k_item["no_unit"]:
            unit_kuning_display = f"{unit_kuning} (Unit #{k_item['no_unit']})"
        else:
            unit_kuning_display = unit_kuning
        pos_kuning_display = f"No. {k_item.get('global_no', '-')}"
    elif len(kuning_list) > 1:
        # Multiple entries in dialihkan (e.g. Halimah, Nani)
        nama_kuning = " / ".join([x.get("nama", nama_ods) for x in kuning_list])
        hp_kuning = " / ".join([clean_phone(x.get("hp")) for x in kuning_list])
        unit_kuning_display = " // ".join([
            f"{x.get('unit', '-')} (#{x.get('no_unit', '-')})" if 'no_unit' in x else x.get('unit', '-')
            for x in kuning_list
        ])
        pos_kuning_display = " & ".join([f"No. {x.get('global_no', '-')}" for x in kuning_list])
    else:
        nama_kuning = nama_ods
        hp_kuning = "-"
        unit_kuning_display = "-"
        pos_kuning_display = "-"

    # Specific cleanups for known special cases
    if reg == "KNS2026-60155713" and k_sah == "Bogor":
        # Ita Juwita in Bogor is at unit RS Sentra Medika #16 (Global #527) or KPS Cibinong
        nama_sah = "Tita Juwita"
        unit_sah_display = "(7) RS. Sentra Medika (Unit #16)"
        pos_sah_display = "No. 527"
        hp_sah = "082125185360"
        
    if reg == "KNS2026-57542673" and k_sah == "KORMI & DIID":
        # Mimin in KORMI
        nama_sah = "Mimin (RACUN)"
        
    if reg == "KNS2026-41371802" and k_sah == "KORMI & DIID":
        # Nunung in KORMI
        nama_sah = "Nunung (SUPARMI)"
        
    if reg == "KNS2026-66667866" and k_sah == "KORMI & DIID":
        # Ati in KORMI
        nama_sah = "Ati (KUSMIATI)"

    # Comparative analysis string
    diff_notes = []
    if nama_sah.strip().lower() == nama_kuning.strip().lower():
        nama_status = f"Nama Cocok ('{nama_sah}')"
    else:
        nama_status = f"Variasi Nama: '{nama_sah}' vs '{nama_kuning}'"
    diff_notes.append(nama_status)
    
    clean_hp_sah = clean_phone(hp_sah)
    clean_hp_kun = clean_phone(hp_kuning)
    if clean_hp_sah == clean_hp_kun and clean_hp_sah != "-":
        diff_notes.append("No. HP Sama Persis")
    elif clean_hp_kun != "-":
        diff_notes.append(f"No. HP Beda ({clean_hp_sah} vs {clean_hp_kun})")
        
    diff_notes.append(f"No. Reg ODS Sama: {reg}")
    diff_summary = "; ".join(diff_notes)

    enriched_56.append({
        "no": item["no"],
        "reg": reg,
        "nama_ods": nama_ods,
        "wa_ods": clean_phone(wa_ods),
        "cabang_ods": cab_ods,
        
        # Dokumen A (Sah)
        "k_sah": k_sah,
        "nama_sah": nama_sah,
        "hp_sah": hp_sah,
        "unit_sah": unit_sah_display,
        "pos_sah": pos_sah_display,
        "status_sah": "HAK SAH (SERAHKAN KAOS)",
        
        # Dokumen B (Dialihkan)
        "k_kuning": k_kuning,
        "nama_kuning": nama_kuning,
        "hp_kuning": hp_kuning,
        "unit_kuning": unit_kuning_display,
        "pos_kuning": pos_kuning_display,
        "status_kuning": "DUPLIKAT (DIALIHKAN - KUNING)",
        
        # Analysis
        "analisis_komparasi": diff_summary,
        "instruksi": item["instruksi"],
        "dasar": item["dasar"],
    })

print(f"Enriched 56 rows created successfully. Example: {enriched_56[0]['nama_ods']}")

# 2. Build enriched Sheet 3 (All 58 claims)
ws_curr_s3 = wb_curr["Log 58 Klaim Dialihkan (Kuning)"]
enriched_58 = []
for r in range(2, ws_curr_s3.max_row + 1):
    no = ws_curr_s3.cell(r, 1).value
    k_dialihkan = ws_curr_s3.cell(r, 2).value
    file_dialihkan = ws_curr_s3.cell(r, 3).value
    no_urut_berkas = ws_curr_s3.cell(r, 4).value
    baris_excel = ws_curr_s3.cell(r, 5).value
    reg = clean_reg(ws_curr_s3.cell(r, 6).value)
    nama_ods = ws_curr_s3.cell(r, 7).value
    wa_ods = clean_phone(ws_curr_s3.cell(r, 8).value)
    cab_ods = ws_curr_s3.cell(r, 9).value
    status_kaos = ws_curr_s3.cell(r, 10).value
    catatan_alokasi = ws_curr_s3.cell(r, 11).value
    
    # Find corresponding row in enriched_56
    e56 = next((x for x in enriched_56 if x["reg"] == reg), None)
    
    # Get specific dialihkan item
    kuning_list = get_party_info(k_dialihkan, reg, nama_ods)
    # Match by no_urut if multiple
    target_k = None
    if len(kuning_list) == 1:
        target_k = kuning_list[0]
    elif len(kuning_list) > 1:
        # Match global_no with no_urut_berkas
        for cand in kuning_list:
            if cand.get("global_no") == str(no_urut_berkas) or cand.get("no_unit") == str(no_urut_berkas):
                target_k = cand
                break
        if not target_k:
            target_k = kuning_list[0]
            
    nama_k = target_k.get("nama", nama_ods) if target_k else nama_ods
    hp_k = clean_phone(target_k.get("hp")) if target_k else "-"
    unit_k = target_k.get("unit", "-") if target_k else "-"
    if target_k and "no_unit" in target_k and target_k["no_unit"]:
        unit_k = f"{unit_k} (Unit #{target_k['no_unit']})"

    k_sah = e56["k_sah"] if e56 else "-"
    file_sah = verification_file_map.get(k_sah, "-")
    pos_sah = e56["pos_sah"] if e56 else "-"
    nama_sah = e56["nama_sah"] if e56 else nama_ods
    hp_sah = e56["hp_sah"] if e56 else "-"
    unit_sah = e56["unit_sah"] if e56 else "-"
    
    enriched_58.append({
        "no": no,
        # Dokumen Dialihkan
        "k_dialihkan": k_dialihkan,
        "file_dialihkan": file_dialihkan,
        "no_urut_berkas": no_urut_berkas,
        "baris_excel": baris_excel,
        "nama_dialihkan": nama_k,
        "hp_dialihkan": hp_k,
        "unit_dialihkan": unit_k,
        "status_dialihkan": "DUPLIKAT (DIALIHKAN - KUNING)",
        
        # Dokumen Hak Sah
        "k_sah": k_sah,
        "file_sah": file_sah,
        "pos_sah": pos_sah,
        "nama_sah": nama_sah,
        "hp_sah": hp_sah,
        "unit_sah": unit_sah,
        "status_sah": "HAK SAH (SERAHKAN KAOS)",
        
        # Master ODS
        "reg": reg,
        "nama_ods": nama_ods,
        "wa_ods": wa_ods,
        "cabang_ods": cab_ods,
        
        "catatan": catatan_alokasi,
    })

print(f"Enriched 58 claims created successfully. Total: {len(enriched_58)}")

# 3. Create the New Workbook with Professional Styling
wb_new = openpyxl.Workbook()

# Style definitions
font_super = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_sub = Font(name="Calibri", size=10, bold=True)
font_data = Font(name="Calibri", size=10)
font_bold = Font(name="Calibri", size=10, bold=True)
font_code = Font(name="Consolas", size=9.5, bold=True)

# Colors
fill_master_super = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid") # Deep Navy
fill_master_sub = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")   # Soft Blue

fill_sah_super = PatternFill(start_color="1E4620", end_color="1E4620", fill_type="solid")    # Forest Green
fill_sah_sub = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")      # Soft Green
fill_sah_badge = PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid")    # Light Green Badge
font_sah_badge = Font(name="Calibri", size=9.5, bold=True, color="155724")

fill_kuning_super = PatternFill(start_color="8A6D3B", end_color="8A6D3B", fill_type="solid") # Warm Amber / Ochre
fill_kuning_sub = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")   # Soft Yellow
fill_kuning_badge = PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid") # Light Yellow Badge
font_kuning_badge = Font(name="Calibri", size=9.5, bold=True, color="856404")

fill_analisis_super = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid") # Slate Dark
fill_analisis_sub = PatternFill(start_color="E7E6E6", end_color="E7E6E6", fill_type="solid")   # Soft Grey

# Zebra row fills
fill_row_even = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
fill_row_odd = PatternFill(start_color="F9FAFC", end_color="F9FAFC", fill_type="solid")

thin_border_side = Side(border_style="thin", color="D3D3D3")
thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
thick_right_side = Side(border_style="medium", color="7F7F7F")

# Alignments
align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
align_right = Alignment(horizontal="right", vertical="center", wrap_text=True)

# ==============================================================================
# SHEET 1: Penyerahan Kaos Lintas Berkas (Side-by-Side Comparison)
# ==============================================================================
ws1 = wb_new.active
ws1.title = "Penyerahan Kaos Lintas Berkas"

# Super headers (Row 1)
super_headers_ws1 = [
    (1, 5, "DATA MASTER ACUAN SISTEM (DATABASE RESMI ODS)", fill_master_super),
    (6, 11, "DOKUMEN A: KONTINGEN PENYERAH (HAK SAH KAOS LAPANGAN)", fill_sah_super),
    (12, 17, "DOKUMEN B: KONTINGEN TERDAMPAK / DIALIHKAN (STATUS KUNING)", fill_kuning_super),
    (18, 20, "ANALISIS PERBANDINGAN & INSTRUKSI LAPANGAN", fill_analisis_super),
]

for start_col, end_col, title, fill_color in super_headers_ws1:
    ws1.merge_cells(start_row=1, start_column=start_col, end_row=1, end_column=end_col)
    cell = ws1.cell(1, start_col)
    cell.value = title
    cell.font = font_super
    cell.fill = fill_color
    cell.alignment = align_center
    for c in range(start_col, end_col + 1):
        ws1.cell(1, c).border = thin_border
        ws1.cell(1, c).fill = fill_color

# Sub headers (Row 2)
headers_ws1 = [
    # Master ODS
    ("No", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("No. Registrasi ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Nama Lengkap di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_left),
    ("No. WhatsApp di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("Cabang Resmi di ODS", fill_master_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_left),
    
    # Dokumen A (Sah)
    ("Kontingen Penyerah (Hak Sah)", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Nama di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("No. HP di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Cabang / Unit di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Posisi di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Status Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    
    # Dokumen B (Dialihkan)
    ("Kontingen Dialihkan (Kuning)", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Cabang / Unit di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("Posisi di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Status Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    
    # Analisis & Instruksi
    ("Perbandingan Nama & No. HP (A vs B)", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Instruksi Operasional Petugas Lapangan", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Dasar Keputusan Panitia", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
]

for col_idx, (h_title, h_fill, h_font, h_align) in enumerate(headers_ws1, 1):
    c = ws1.cell(2, col_idx)
    c.value = h_title
    c.fill = h_fill
    c.font = h_font
    c.alignment = h_align
    c.border = thin_border

ws1.row_dimensions[1].height = 28
ws1.row_dimensions[2].height = 32

# Fill Data Rows
for row_idx, d in enumerate(enriched_56, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    
    row_values = [
        (d["no"], font_bold, align_center, bg_row),
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["wa_ods"], font_data, align_center, bg_row),
        (d["cabang_ods"], font_data, align_left, bg_row),
        
        # Dokumen A (Sah)
        (d["k_sah"], font_bold, align_center, bg_row),
        (d["nama_sah"], font_bold, align_left, bg_row),
        (d["hp_sah"], font_data, align_center, bg_row),
        (d["unit_sah"], font_data, align_left, bg_row),
        (d["pos_sah"], font_data, align_center, bg_row),
        ("HAK SAH (SERAHKAN)", font_sah_badge, align_center, fill_sah_badge),
        
        # Dokumen B (Dialihkan)
        (d["k_kuning"], font_bold, align_center, bg_row),
        (d["nama_kuning"], font_bold, align_left, bg_row),
        (d["hp_kuning"], font_data, align_center, bg_row),
        (d["unit_kuning"], font_data, align_left, bg_row),
        (d["pos_kuning"], font_data, align_center, bg_row),
        ("DIALOKASIKAN (KUNING)", font_kuning_badge, align_center, fill_kuning_badge),
        
        # Analisis & Instruksi
        (d["analisis_komparasi"], font_data, align_left, bg_row),
        (d["instruksi"], font_data, align_left, bg_row),
        (d["dasar"], font_data, align_left, bg_row),
    ]
    
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_values, 1):
        cell = ws1.cell(row_idx, c_idx)
        cell.value = val
        cell.font = c_font
        cell.alignment = c_align
        cell.fill = c_fill
        cell.border = thin_border
        
    ws1.row_dimensions[row_idx].height = 42

# Freeze Panes at Col F (Row 3)
ws1.freeze_panes = "F3"
ws1.views.sheetView[0].showGridLines = True

# Column width adjustments for Sheet 1
col_widths_ws1 = {
    1: 6,    # No
    2: 19,   # No Reg ODS
    3: 24,   # Nama ODS
    4: 16,   # WA ODS
    5: 35,   # Cabang ODS
    6: 18,   # Kontingen Sah
    7: 24,   # Nama Sah
    8: 18,   # HP Sah
    9: 30,   # Unit Sah
    10: 15,  # Posisi Sah
    11: 20,  # Status Sah
    12: 18,  # Kontingen Dialihkan
    13: 24,  # Nama Dialihkan
    14: 18,  # HP Dialihkan
    15: 32,  # Unit Dialihkan
    16: 15,  # Posisi Dialihkan
    17: 22,  # Status Dialihkan
    18: 38,  # Perbandingan A vs B
    19: 45,  # Instruksi Lapangan
    20: 38,  # Dasar Penetapan
}

for col_idx, width in col_widths_ws1.items():
    col_letter = get_column_letter(col_idx)
    ws1.column_dimensions[col_letter].width = width

print("Sheet 1 generated.")


# ==============================================================================
# SHEET 2: Ringkasan Alokasi Penyerahan
# ==============================================================================
ws2 = wb_new.create_sheet(title="Ringkasan Alokasi Penyerahan")

# Title Header
ws2.merge_cells("A1:G1")
ws2["A1"] = "RINGKASAN EKSEKUTIF ALOKASI PENYERAHAN KAOS LINTAS BERKAS"
ws2["A1"].font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
ws2["A1"].fill = fill_master_super
ws2["A1"].alignment = align_center

ws2.merge_cells("A2:G2")
ws2["A2"] = "Audit Silang 14 Kontingen Wilayah Kongres Nasional (KONAS) PERSADIA 2026 - GOR Pakansari Bogor"
ws2["A2"].font = Font(name="Calibri", size=10, italic=True, color="FFFFFF")
ws2["A2"].fill = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid")
ws2["A2"].alignment = align_center

ws2.row_dimensions[1].height = 30
ws2.row_dimensions[2].height = 20

# Section 1: KPI Statistics Table
ws2.cell(4, 1).value = "1. STATISTIK UTAMA AUDIT DUPLIKASI LINTAS BERKAS"
ws2.cell(4, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

kpi_headers = ["Parameter Audit Lintas Berkas", "Jumlah", "Satuan", "Keterangan Penjelasan Operasional"]
for c_idx, h in enumerate(kpi_headers, 1):
    c = ws2.cell(5, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_master_sub
    c.border = thin_border
    c.alignment = align_center if c_idx in [2, 3] else align_left

kpi_data = [
    ("Total Peserta Terdaftar Lintas Wilayah", 56, "Orang", "Jumlah individu unik yang namanya tertera pada lebih dari satu berkas kontingen"),
    ("Total Klaim Pendaftaran Fisik di Berkas", 114, "Klaim", "Total baris pendaftaran fisik di 14 berkas kontingen sebelum dilakukan eliminasi"),
    ("Total Kaos Diserahkan (Hak Sah Lapangan)", 56, "Kaos", "Tepat satu kaos per peserta unik, diserahkan oleh kontingen pemegang hak sah"),
    ("Total Klaim Berhasil Dibatalkan (Status Kuning)", 58, "Klaim", "49 klaim di Bogor, 6 di Jakarta Timur, 2 di Jakarta Selatan, 1 di Purwakarta"),
    ("Total Kuota Bersih Kaos 14 Kontingen Sah", 6088, "Kaos", "Total kuota peserta terverifikasi bersih pasca pengalihan duplikasi lintas berkas"),
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

# Section 2: Matriks Silang Penyerahan Kaos
ws2.cell(12, 1).value = "2. MATRIKS SILANG PENYERAHAN KAOS ANTAR-KONTINGEN (CROSS-REFERENCING)"
ws2.cell(12, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

matrix_headers = [
    "Kontingen Penyerah Kaos (Hak Sah)",
    "Klaim Bogor (Batal)",
    "Klaim Jaktim (Batal)",
    "Klaim Jaksel (Batal)",
    "Klaim Purwakarta (Batal)",
    "Total Kaos Diserahkan (Hak Sah)",
]

for c_idx, h in enumerate(matrix_headers, 1):
    c = ws2.cell(13, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_sah_sub if c_idx == 1 or c_idx == 6 else fill_kuning_sub
    c.border = thin_border
    c.alignment = align_center

matrix_rows = [
    ("Depok", 20, 1, 1, 0, 22),
    ("KORMI & DIID", 12, 3, 0, 0, 15),
    ("Jakarta Timur", 8, 0, 0, 0, 8),
    ("Bogor", 0, 2, 1, 1, 4),
    ("Bekasi", 4, 0, 0, 0, 4),
    ("Sumedang", 2, 0, 0, 0, 2),
    ("Cimahi", 1, 0, 0, 0, 1),
    ("TOTAL KLAIM", "47 Orang (49 Klaim)", "6 Orang (6 Klaim)", "2 Orang (2 Klaim)", "1 Orang (1 Klaim)", "56 Orang (56 Kaos)"),
]

for r_offset, row in enumerate(matrix_rows, 14):
    is_total = (r_offset == 14 + len(matrix_rows) - 1)
    bg = fill_master_sub if is_total else (fill_row_even if r_offset % 2 == 0 else fill_row_odd)
    for c_idx, val in enumerate(row, 1):
        cell = ws2.cell(r_offset, c_idx)
        cell.value = val
        cell.font = font_bold if (is_total or c_idx in [1, 6]) else font_data
        cell.alignment = align_left if c_idx == 1 else align_center
        cell.fill = bg
        cell.border = thin_border

# Section 3: Rekapitulasi 14 Kontingen Lengkap
ws2.cell(24, 1).value = "3. REKAPITULASI KUOTA & STATUS PENYERAHAN KAOS 14 KONTINGEN"
ws2.cell(24, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

kontingen_summary = [
    ("Depok", "Penyerah Kaos Utama", 22, 0, 2851, "Menyerahkan 22 kaos (20 dialihkan dari klaim Bogor, 1 Jaktim, 1 Jaksel)"),
    ("KORMI & DIID", "Penyerah Kaos Utama", 15, 0, 469, "Menyerahkan 15 kaos (12 dialihkan dari klaim Bogor, 3 Jaktim)"),
    ("Jakarta Timur", "Penyerah & Terdampak", 8, 6, 561, "Menyerahkan 8 kaos (dari Bogor); 6 klaim Jaktim dialihkan ke KORMI/Depok/Bogor"),
    ("Bogor", "Penyerah & Terdampak", 4, 49, 1157, "Menyerahkan 4 kaos (2 Jaktim, 1 Purwakarta, 1 Jaksel); 49 klaim dialihkan"),
    ("Bekasi", "Penyerah Kaos Utama", 4, 0, 378, "Menyerahkan 4 kaos (semua dialihkan dari klaim Bogor sesuai domisili cabang)"),
    ("Sumedang", "Penyerah Kaos Utama", 2, 0, 100, "Menyerahkan 2 kaos (semua dialihkan dari klaim Bogor sesuai domisili cabang)"),
    ("Cimahi", "Penyerah Kaos Utama", 1, 0, 63, "Menyerahkan 1 kaos (dialihkan dari klaim Bogor sesuai domisili cabang Cimahi)"),
    ("Jakarta Selatan", "Kontingen Terdampak", 0, 2, 242, "2 klaim dialihkan (1 diserahkan oleh Bogor, 1 diserahkan oleh Depok)"),
    ("Purwakarta", "Kontingen Terdampak", 0, 1, 114, "1 klaim dialihkan (Ita Juwita diserahkan oleh Kontingen Bogor)"),
    ("Ciamis", "Mandiri / Netral", 0, 0, 93, "Tidak ada irisan duplikasi dengan kontingen lain"),
    ("Cianjur", "Mandiri / Netral", 0, 0, 29, "Tidak ada irisan duplikasi dengan kontingen lain"),
    ("Subang", "Mandiri / Netral", 0, 0, 24, "Tidak ada irisan duplikasi dengan kontingen lain"),
    ("Karawang", "Mandiri / Netral", 0, 0, 4, "Tidak ada irisan duplikasi dengan kontingen lain"),
    ("Gorontalo", "Mandiri / Netral", 0, 0, 3, "Tidak ada irisan duplikasi dengan kontingen lain"),
    ("TOTAL KESELURUHAN", "14 Kontingen", 56, 58, 6088, "Tepat 56 Kaos Diserahkan, 58 Klaim Dicegah Dobel, Kuota Kaos Bersih: 6.088"),
]

rekap_headers = ["No", "Nama Kontingen", "Peran Lapangan", "Kaos Diserahkan (Hak Sah)", "Klaim Dibatalkan (Kuning)", "Total Kuota Kaos Sah", "Rincian Lapangan & Catatan"]
for c_idx, h in enumerate(rekap_headers, 1):
    c = ws2.cell(25, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_master_sub
    c.border = thin_border
    c.alignment = align_center if c_idx in [1, 3, 4, 5, 6] else align_left

for r_offset, row in enumerate(kontingen_summary, 26):
    is_total = (r_offset == 26 + len(kontingen_summary) - 1)
    bg = fill_master_sub if is_total else (fill_row_even if r_offset % 2 == 0 else fill_row_odd)
    no_val = "" if is_total else (r_offset - 25)
    
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
ws2.column_dimensions["G"].width = 60

print("Sheet 2 generated.")


# ==============================================================================
# SHEET 3: Log 58 Klaim Dialihkan (Kuning) (Side-by-Side Comparison)
# ==============================================================================
ws3 = wb_new.create_sheet(title="Log 58 Klaim Dialihkan (Kuning)")

# Super headers (Row 1)
super_headers_ws3 = [
    (1, 7, "DOKUMEN KLAIM TERDAMPAK / DIALIHKAN (STATUS KUNING - BATAL)", fill_kuning_super),
    (8, 13, "DISANDINGKAN DENGAN DOKUMEN PENYERAH (HAK SAH LAPANGAN)", fill_sah_super),
    (14, 18, "IDENTITAS RESMI MASTER ODS & CATATAN PANITIA", fill_analisis_super),
]

for start_col, end_col, title, fill_color in super_headers_ws3:
    ws3.merge_cells(start_row=1, start_column=start_col, end_row=1, end_column=end_col)
    cell = ws3.cell(1, start_col)
    cell.value = title
    cell.font = font_super
    cell.fill = fill_color
    cell.alignment = align_center
    for c in range(start_col, end_col + 1):
        ws3.cell(1, c).border = thin_border
        ws3.cell(1, c).fill = fill_color

# Sub headers (Row 2)
headers_ws3 = [
    # Dokumen Dialihkan
    ("No", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Kontingen Dialihkan (Kuning)", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("File Verifikasi Berkas", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. Urut Berkas", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Cabang / Unit di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    
    # Dokumen Hak Sah
    ("Kontingen Penyerah (Hak Sah)", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("File Verifikasi Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Posisi di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Nama di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("No. HP di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Cabang / Unit di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    
    # Master ODS
    ("No. Registrasi ODS", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_center),
    ("Nama di Master ODS", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("No. WhatsApp ODS", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_center),
    ("Cabang Resmi di ODS", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Catatan Alokasi & Instruksi Panitia", fill_analisis_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
]

for col_idx, (h_title, h_fill, h_font, h_align) in enumerate(headers_ws3, 1):
    c = ws3.cell(2, col_idx)
    c.value = h_title
    c.fill = h_fill
    c.font = h_font
    c.alignment = h_align
    c.border = thin_border

ws3.row_dimensions[1].height = 28
ws3.row_dimensions[2].height = 32

for row_idx, d in enumerate(enriched_58, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    
    row_values = [
        # Dokumen Dialihkan
        (d["no"], font_bold, align_center, bg_row),
        (d["k_dialihkan"], font_bold, align_center, bg_row),
        (d["file_dialihkan"], font_code, align_left, bg_row),
        (d["no_urut_berkas"], font_bold, align_center, bg_row),
        (d["nama_dialihkan"], font_bold, align_left, bg_row),
        (d["hp_dialihkan"], font_data, align_center, bg_row),
        (d["unit_dialihkan"], font_data, align_left, bg_row),
        
        # Dokumen Hak Sah
        (d["k_sah"], font_bold, align_center, bg_row),
        (d["file_sah"], font_code, align_left, bg_row),
        (d["pos_sah"], font_data, align_center, bg_row),
        (d["nama_sah"], font_bold, align_left, bg_row),
        (d["hp_sah"], font_data, align_center, bg_row),
        (d["unit_sah"], font_data, align_left, bg_row),
        
        # Master ODS
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["wa_ods"], font_data, align_center, bg_row),
        (d["cabang_ods"], font_data, align_left, bg_row),
        (d["catatan"], font_data, align_left, bg_row),
    ]
    
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_values, 1):
        cell = ws3.cell(row_idx, c_idx)
        cell.value = val
        cell.font = c_font
        cell.alignment = c_align
        cell.fill = c_fill
        cell.border = thin_border
        
    ws3.row_dimensions[row_idx].height = 38

ws3.freeze_panes = "H3"
ws3.views.sheetView[0].showGridLines = True

col_widths_ws3 = {
    1: 6,    # No
    2: 18,   # Kontingen Dialihkan
    3: 35,   # File Dialihkan
    4: 14,   # No Urut Berkas
    5: 22,   # Nama Dialihkan
    6: 18,   # HP Dialihkan
    7: 30,   # Unit Dialihkan
    8: 18,   # Kontingen Sah
    9: 35,   # File Sah
    10: 16,  # Posisi Sah
    11: 22,  # Nama Sah
    12: 18,  # HP Sah
    13: 30,  # Unit Sah
    14: 19,  # No Reg ODS
    15: 22,  # Nama ODS
    16: 16,  # WA ODS
    17: 32,  # Cabang ODS
    18: 45,  # Catatan
}

for col_idx, width in col_widths_ws3.items():
    col_letter = get_column_letter(col_idx)
    ws3.column_dimensions[col_letter].width = width

print("Sheet 3 generated.")

# Save workbook
wb_new.save(OUTPUT_XLSX)
print(f"Workbook saved successfully to: {OUTPUT_XLSX}")

