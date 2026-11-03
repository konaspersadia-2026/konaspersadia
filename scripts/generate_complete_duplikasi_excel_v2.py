#!/usr/bin/env python3
"""
generate_complete_duplikasi_excel_v2.py
Menghasilkan LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx
dengan penyandingan lengkap sebelah-menyebelah:
- Data Master ODS
- Dokumen A (Penyerah - Hak Sah): Nama, No HP, TGL LAHIR, Unit/Cabang, Posisi
- Dokumen B (Dialihkan - Kuning): Nama, No HP, TGL LAHIR, Unit/Cabang, Posisi
- Parameter Validasi: Evaluasi Nama, Evaluasi No HP (potensi typo/nomor bersama), Evaluasi Tgl Lahir
- SKALA INDIKASI KESAMAAN (1 - 5) & Kategori Probabilitas
- Pertimbangan Analisis Panitia (Objektif, bukan vonis) & Instruksi Operasional
"""

import os
import re
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

BASE_DIR = "Data peserta/Data pengambilan baju"
OUTPUT_XLSX = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx")
OUTPUT_MD = os.path.join(BASE_DIR, "LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.md")

def clean_reg(val):
    if not val: return ""
    m = re.search(r"KNS2026-\d+", str(val))
    return m.group(0) if m else str(val).strip("` ")

def clean_phone_digits(p):
    if not p: return ""
    d = re.sub(r"[^\d]", "", str(p))
    if d.startswith("62"): d = "0" + d[2:]
    elif d.startswith("8"): d = "0" + d
    return d

def format_phone_display(p):
    d = clean_phone_digits(p)
    return d if d else "-"

def levenshtein(s1, s2):
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2: return 0
    if not s1: return len(s2)
    if not s2: return len(s1)
    dp = [[0] * (len(s2) + 1) for _ in range(len(s1) + 1)]
    for i in range(len(s1) + 1): dp[i][0] = i
    for j in range(len(s2) + 1): dp[0][j] = j
    for i in range(1, len(s1) + 1):
        for j in range(1, len(s2) + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    return dp[len(s1)][len(s2)]

def parse_date(d_str):
    if not d_str or str(d_str).strip() in ["-", "None", ""]:
        return "-"
    s = str(d_str).strip()
    if isinstance(d_str, datetime):
        return d_str.strftime("%d/%m/%Y")
    
    # Try ISO YYYY-MM-DD
    m_iso = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", s)
    if m_iso:
        y, m, d = m_iso.groups()
        return f"{int(d):02d}/{int(m):02d}/{y}"

    for fmt in ["%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d-%b-%y", "%d-%b-%Y"]:
        try:
            dt = datetime.strptime(s[:10], fmt)
            return dt.strftime("%d/%m/%Y")
        except:
            pass

    m_clean = re.search(r"(\d{1,2})[\s/-]+([A-Za-z]+|\d{1,2})[\s/-]+(\d{2,4})", s)
    if m_clean:
        d, m, y = m_clean.groups()
        if len(y) == 2:
            y = "19" + y if int(y) > 30 else "20" + y
        month_map = {
            "jan": "01", "januari": "01", "feb": "02", "februari": "02",
            "mar": "03", "maret": "03", "apr": "04", "april": "04",
            "mei": "05", "may": "05", "jun": "06", "juni": "06",
            "jul": "07", "juli": "07", "agu": "08", "agustus": "08", "aug": "08",
            "sep": "09", "september": "09", "okt": "10", "oktober": "10", "oct": "10",
            "nop": "11", "november": "11", "nov": "11", "des": "12", "desember": "12", "dec": "12"
        }
        if m.lower() in month_map:
            m = month_map[m.lower()]
        elif m.isdigit():
            # If month > 12 and day <= 12, swap them (US format mm/dd/yyyy)
            if int(m) > 12 and int(d) <= 12:
                d, m = m, d
            m = f"{int(m):02d}"
        else:
            return s
        return f"{int(d):02d}/{m}/{y}"
    return s

def get_year(d_str):
    if not d_str or d_str == "-": return None
    p = parse_date(d_str)
    m = re.search(r"\d{4}", p)
    return int(m.group(0)) if m else None

# 1. Load Data from Markdowns and Source Excels
print("Loading data from Markdown files and source files...")

# Bogor
bogor_data = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_BOGOR.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP 1.242 PESERTA" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 8:
                r = clean_reg(p[7])
                if r:
                    bogor_data.setdefault(r, []).append({
                        "global_no": p[0], "unit": p[1], "no_unit": p[2],
                        "nama": p[3], "hp": p[4], "tgl_lahir": p[5],
                    })

# Depok
depok_data = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_DEPOK.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP 2.859 PESERTA" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 11:
                r = clean_reg(p[10])
                if r:
                    depok_data.setdefault(r, []).append({
                        "global_no": p[0], "unit": p[2], "no_unit": p[3],
                        "nama": p[4], "hp": p[8], "tgl_lahir": p[6], "jk": p[7],
                    })

# KORMI
kormi_data = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_KORMI_DIID.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP 486 PESERTA" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 8:
                r = clean_reg(p[7])
                if r:
                    kormi_data.setdefault(r, []).append({
                        "global_no": p[0], "unit": p[1], "nama": p[2],
                        "hp": p[6], "tgl_lahir": p[4], "jk": p[5],
                    })

# Jaktim
jaktim_data = {}
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_TIMUR.md")) as f:
    in_table = False
    for line in f:
        if "## 5. TABEL LENGKAP" in line or "## 4. TABEL LENGKAP" in line:
            in_table = True
            continue
        if in_table and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No"):
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 8:
                r = clean_reg(p[7])
                if r:
                    jaktim_data.setdefault(r, []).append({
                        "global_no": p[0], "unit": p[1], "nama": p[2],
                        "hp": p[5], "tgl_lahir": p[3], "jk": p[4],
                    })

# Bekasi
bekasi_data = {}
wb_b = openpyxl.load_workbook(os.path.join(BASE_DIR, "380 - Bekasi.xlsx"), data_only=True)
ws_b = wb_b.active
for r in range(2, ws_b.max_row + 1):
    nm_b = str(ws_b.cell(r, 1).value or "").strip()
    wa_b = str(ws_b.cell(r, 3).value or "").strip()
    cab_b = str(ws_b.cell(r, 9).value or "").strip()
    tgl_b = ws_b.cell(r, 10).value
    bekasi_data[nm_b.lower()] = {
        "global_no": str(r - 1), "nama": nm_b, "hp": wa_b,
        "unit": cab_b or "Cabang Kota Bekasi",
        "tgl_lahir": str(tgl_b)[:10] if tgl_b else "-",
    }

# Sumedang
sumedang_data = {}
wb_s = openpyxl.load_workbook(os.path.join(BASE_DIR, "100 - Sumedang.xlsx"), data_only=True)
ws_s = wb_s.active
for r in range(3, ws_s.max_row + 1):
    nm_s = str(ws_s.cell(r, 3).value or "").strip()
    hp_s = str(ws_s.cell(r, 6).value or "").strip()
    tgl_s = ws_s.cell(r, 5).value
    reg_s = str(ws_s.cell(r, 7).value or "").strip()
    unit_s = str(ws_s.cell(r, 2).value or "").strip()
    sumedang_data[nm_s.lower()] = {
        "global_no": str(ws_s.cell(r, 1).value or (r - 2)),
        "nama": nm_s, "hp": hp_s,
        "unit": unit_s or "PERSADIA Cabang Sumedang",
        "tgl_lahir": str(tgl_s)[:10] if tgl_s else "-",
    }

# Cimahi
cimahi_data = {
    "KNS2026-18453451": [{
        "global_no": "57", "nama": "SUKAESIH", "hp": "085793694132",
        "unit": "PERSADIA Cabang Cimahi", "tgl_lahir": "27/03/1958"
    }]
}

# Jaksel
jaksel_data = {
    "KNS2026-56854302": [{
        "global_no": "49", "nama": "MIMI SOPIATI", "hp": "0813 8621 4460",
        "unit": "RS Prikasih", "tgl_lahir": "11/03/1959"
    }],
    "KNS2026-90423191": [{
        "global_no": "30", "nama": "Suryati", "hp": "8129052865",
        "unit": "RS Fatmawati", "tgl_lahir": "18/02/1964"
    }]
}

# Purwakarta
purwakarta_data = {
    "KNS2026-60155713": [{
        "global_no": "35", "nama": "Ita Juwita", "hp": "89684566789",
        "unit": "KLINIK FERREN", "tgl_lahir": "07/05/1971"
    }]
}

def get_party_info(kontingen, reg, nama_ods):
    if kontingen == "Bogor": return bogor_data.get(reg, [])
    elif kontingen == "Depok": return depok_data.get(reg, [])
    elif kontingen == "KORMI & DIID": return kormi_data.get(reg, [])
    elif kontingen == "Jakarta Timur": return jaktim_data.get(reg, [])
    elif kontingen == "Bekasi":
        b = bekasi_data.get(nama_ods.lower())
        if not b:
            for k, v in bekasi_data.items():
                if nama_ods.lower() in k or k in nama_ods.lower():
                    b = v; break
        return [b] if b else []
    elif kontingen == "Sumedang":
        s = sumedang_data.get(nama_ods.lower())
        if not s:
            for k, v in sumedang_data.items():
                if nama_ods.lower() in k or k in nama_ods.lower():
                    s = v; break
        return [s] if s else []
    elif kontingen == "Cimahi": return cimahi_data.get(reg, [])
    elif kontingen == "Jakarta Selatan": return jaksel_data.get(reg, [])
    elif kontingen == "Purwakarta": return purwakarta_data.get(reg, [])
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

# Load current Excel to get existing 56 entries
wb_curr = openpyxl.load_workbook(OUTPUT_XLSX, data_only=True)
ws_curr = wb_curr["Penyerahan Kaos Lintas Berkas"]

items_56 = []
for r in range(3, ws_curr.max_row + 1):
    items_56.append({
        "no": ws_curr.cell(r, 1).value,
        "reg": clean_reg(ws_curr.cell(r, 2).value),
        "nama_ods": ws_curr.cell(r, 3).value,
        "wa_ods": str(ws_curr.cell(r, 4).value or "").strip(),
        "cabang_ods": ws_curr.cell(r, 5).value,
        "k_sah": ws_curr.cell(r, 6).value,
        "k_kuning": ws_curr.cell(r, 12).value,
        "instruksi": ws_curr.cell(r, 19).value,
        "dasar": ws_curr.cell(r, 20).value,
    })

print(f"Loaded {len(items_56)} base participants.")

# Detailed Evaluation Engine
def evaluate_participant(item):
    reg = item["reg"]
    nama_ods = item["nama_ods"]
    wa_ods = item["wa_ods"]
    cab_ods = item["cabang_ods"]
    k_sah = item["k_sah"]
    k_kun = item["k_kuning"]
    
    # 1. Party A (Sah)
    sah_list = get_party_info(k_sah, reg, nama_ods)
    sah_item = sah_list[0] if sah_list else {}
    nama_sah = sah_item.get("nama") or nama_ods
    hp_sah = format_phone_display(sah_item.get("hp")) or format_phone_display(wa_ods)
    bd_sah_raw = sah_item.get("tgl_lahir", "-")
    bd_sah = parse_date(bd_sah_raw)
    unit_sah = sah_item.get("unit") or cab_ods
    if "no_unit" in sah_item and sah_item["no_unit"]:
        unit_sah_display = f"{unit_sah} (Unit #{sah_item['no_unit']})"
    else:
        unit_sah_display = unit_sah
    pos_sah_display = f"No. {sah_item.get('global_no', '-')}"
    
    # 2. Party B (Kuning)
    kun_list = get_party_info(k_kun, reg, nama_ods)
    if len(kun_list) == 1:
        k_item = kun_list[0]
        nama_kun = k_item.get("nama") or nama_ods
        hp_kun = format_phone_display(k_item.get("hp"))
        bd_kun_raw = k_item.get("tgl_lahir", "-")
        bd_kun = parse_date(bd_kun_raw)
        bd_kun_list = [bd_kun]
        unit_kun = k_item.get("unit", "-")
        if "no_unit" in k_item and k_item["no_unit"]:
            unit_kun_display = f"{unit_kun} (Unit #{k_item['no_unit']})"
        else:
            unit_kun_display = unit_kun
        pos_kun_display = f"No. {k_item.get('global_no', '-')}"
    elif len(kun_list) > 1:
        nama_kun = " / ".join([x.get("nama", nama_ods) for x in kun_list])
        hp_kun = " // ".join([format_phone_display(x.get("hp")) for x in kun_list])
        bd_kun_list = [parse_date(x.get("tgl_lahir", "-")) for x in kun_list]
        bd_kun = " // ".join(bd_kun_list)
        unit_kun_display = " // ".join([
            f"{x.get('unit', '-')} (#{x.get('no_unit', '-')})" if 'no_unit' in x else x.get('unit', '-')
            for x in kun_list
        ])
        pos_kun_display = " & ".join([f"No. {x.get('global_no', '-')}" for x in kun_list])
    else:
        nama_kun = nama_ods
        hp_kun = "-"
        bd_kun = "-"
        bd_kun_list = ["-"]
        unit_kun_display = "-"
        pos_kun_display = "-"

    # Specific corrections for known edge cases
    if reg == "KNS2026-60155713" and k_sah == "Bogor":
        nama_sah = "Tita Juwita"
        unit_sah_display = "(7) RS. Sentra Medika (Unit #16)"
        pos_sah_display = "No. 527"
        hp_sah = "082125185360"
        bd_sah = "07/05/1971"
        
    if reg == "KNS2026-57542673" and k_sah == "KORMI & DIID":
        nama_sah = "Mimin (RACUN)"
        
    if reg == "KNS2026-41371802" and k_sah == "KORMI & DIID":
        nama_sah = "Nunung (SUPARMI)"
        
    if reg == "KNS2026-66667866" and k_sah == "KORMI & DIID":
        nama_sah = "Ati (KUSMIATI)"

    # 3. Clean Name Comparison
    n_sah_c = re.sub(r"\(.*?\)", "", nama_sah).strip().lower()
    n_kun_c = re.sub(r"\(.*?\)", "", nama_kun).strip().lower()
    for title in ["dr.", "hj.", "h.", "ns.", "sp.pd", "mars", "bu", "oma", "b.", "r."]:
        n_sah_c = re.sub(rf"\b{re.escape(title)}\b", "", n_sah_c).strip()
        n_kun_c = re.sub(rf"\b{re.escape(title)}\b", "", n_kun_c).strip()
    n_sah_c = re.sub(r"[^\w\s]", "", n_sah_c)
    n_kun_c = re.sub(r"[^\w\s]", "", n_kun_c)
    n_sah_c = re.sub(r"\s+", " ", n_sah_c).strip()
    n_kun_c = re.sub(r"\s+", " ", n_kun_c).strip()
    
    words_s = set(n_sah_c.split())
    words_k = set(n_kun_c.split())
    dist_name = levenshtein(n_sah_c, n_kun_c)
    max_len_n = max(len(n_sah_c), len(n_kun_c), 1)
    sim_name_pct = round((1 - dist_name / max_len_n) * 100, 1)
    
    known_aliases = [
        ("ci emi", "emmy winata"), ("ati", "kusmiati"), ("oma mega", "megawati"),
        ("nunung", "suparmi"), ("mimin", "racun"), ("wiwik aryani", "wiwik maryanah"),
        ("oma rina", "oma tina"), ("siti sunarti", "iing sunarti")
    ]
    is_alias = any((a1 in n_sah_c and a2 in n_kun_c) or (a2 in n_sah_c and a1 in n_kun_c) for a1, a2 in known_aliases)
    is_subset = (words_s.issubset(words_k) or words_k.issubset(words_s)) and len(words_s) > 0 and len(words_k) > 0

    if n_sah_c == n_kun_c:
        eval_nama = f"Sama Persis ('{nama_sah}')"
        status_nama_code = "IDENTIK"
    elif is_subset:
        eval_nama = f"Nama Selaras / Singkatan ('{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "SELARAS"
    elif dist_name <= 2:
        eval_nama = f"Potensi Typo {dist_name} Huruf ({sim_name_pct}%: '{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "TYPO_NAMA"
    elif is_alias:
        eval_nama = f"Variasi Nama Panggilan/Alias ('{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "ALIAS"
    else:
        eval_nama = f"Beda Jauh ({sim_name_pct}%: '{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "BEDA_JAUH"

    # 4. Clean Phone Comparison
    p_sah_clean = clean_phone_digits(hp_sah)
    p_kun_clean_list = [clean_phone_digits(x) for x in re.split(r"//|/|;", str(hp_kun)) if clean_phone_digits(x)]
    
    exact_phone = False
    min_dist_hp = 99
    best_pk = p_kun_clean_list[0] if p_kun_clean_list else ""
    for pk in p_kun_clean_list:
        if p_sah_clean == pk and p_sah_clean != "":
            exact_phone = True
            min_dist_hp = 0
            best_pk = pk
            break
        d_p = levenshtein(p_sah_clean, pk)
        if d_p < min_dist_hp:
            min_dist_hp = d_p
            best_pk = pk

    if exact_phone:
        eval_hp = f"Sama Persis ({p_sah_clean})"
        status_hp_code = "IDENTIK"
    elif min_dist_hp <= 2:
        eval_hp = f"Potensi Typo {min_dist_hp} Digit ({p_sah_clean} vs {best_pk})"
        status_hp_code = "TYPO_HP"
    elif not p_sah_clean or not p_kun_clean_list:
        eval_hp = "Nomor Tidak Lengkap"
        status_hp_code = "KOSONG"
    else:
        eval_hp = f"Beda Total ({p_sah_clean} vs {best_pk})"
        status_hp_code = "BEDA_TOTAL"

    # 5. Birth Date Evaluation
    exact_bd = False
    for bk in bd_kun_list:
        if bd_sah == bk and bd_sah != "-":
            exact_bd = True
            break
    
    y_sah = get_year(bd_sah)
    diff_years = []
    for bk in bd_kun_list:
        yk = get_year(bk)
        if y_sah and yk:
            diff_years.append(abs(y_sah - yk))
    min_diff_year = min(diff_years) if diff_years else None

    if exact_bd:
        eval_bd = f"Sama Persis ({bd_sah})"
        status_bd_code = "IDENTIK"
    elif bd_sah == "-" or not bd_kun_list or bd_kun == "-":
        eval_bd = "Data Tidak Lengkap"
        status_bd_code = "KOSONG"
    elif min_diff_year == 0:
        eval_bd = f"Tahun Sama, Beda Tanggal ({bd_sah} vs {bd_kun})"
        status_bd_code = "BEDA_HARI"
    else:
        eval_bd = f"Beda Tahun (Selisih ~{min_diff_year} thn: {bd_sah} vs {bd_kun})"
        status_bd_code = "BEDA_TAHUN"

    # 6. Scale Assignment (1 - 5)
    # High detail rules:
    if status_bd_code == "IDENTIK" and (status_hp_code in ["IDENTIK", "TYPO_HP"] or clean_phone_digits(wa_ods) == p_sah_clean) and status_nama_code in ["IDENTIK", "SELARAS", "TYPO_NAMA", "ALIAS"]:
        scale = 5 # Identik / Typo Terbukti
    elif status_hp_code == "IDENTIK" and status_nama_code in ["IDENTIK", "SELARAS", "ALIAS", "TYPO_NAMA"]:
        scale = 4 # Kuat kemungkinan orang sama
    elif status_bd_code == "IDENTIK" and status_nama_code in ["IDENTIK", "SELARAS", "TYPO_NAMA"]:
        scale = 4 # Tgl lahir sama persis & nama sama
    elif status_hp_code == "TYPO_HP" and status_nama_code in ["IDENTIK", "SELARAS"]:
        scale = 4 # Typo pada no HP tetapi nama sama
    elif status_hp_code == "IDENTIK" and status_nama_code == "BEDA_JAUH":
        scale = 3 # Nomor bersama / kolektif
    elif status_bd_code == "KOSONG" and status_nama_code in ["IDENTIK", "SELARAS"]:
        scale = 3 # Data parsial
    elif status_bd_code == "BEDA_TAHUN" and min_diff_year >= 2 and status_hp_code == "BEDA_TOTAL":
        scale = 2 # Homonim kuat
    elif status_nama_code == "BEDA_JAUH" and status_hp_code == "BEDA_TOTAL" and status_bd_code == "BEDA_TAHUN":
        scale = 1 # Sangat rendah
    else:
        scale = 2 if (status_bd_code == "BEDA_TAHUN" or status_hp_code == "BEDA_TOTAL") else 3

    categories = {
        5: "5 - SANGAT KUAT (Identik / Typo Terbukti)",
        4: "4 - KUAT (Kemungkinan Besar Sama)",
        3: "3 - SEDANG (Perlu Cek: Nomor Bersama/Data Parsial)",
        2: "2 - RENDAH (Indikasi Homonim / Orang Berbeda)",
        1: "1 - SANGAT RENDAH (Hampir Pasti Berbeda)",
    }

    # Objective Considerations (Tidak langsung memvonis)
    if scale == 5:
        pertimbangan = "Sangat kuat orang yang sama: Tanggal lahir sama persis, nomor telepon selaras/typo ringan, dan nama cocok."
    elif scale == 4:
        if status_hp_code == "IDENTIK":
            pertimbangan = "Kemungkinan besar orang yang sama: Nomor kontak identik dan nama selaras/alias pendaftaran (meski tgl lahir ada selisih pencatatan)."
        elif status_bd_code == "IDENTIK":
            pertimbangan = "Kemungkinan besar orang yang sama: Tanggal lahir sama persis dan nama cocok (meski kontak telepon tercatat berbeda)."
        else:
            pertimbangan = "Kemungkinan besar orang yang sama dengan indikasi typo ringan pada kontak atau nama."
    elif scale == 3:
        if status_hp_code == "IDENTIK":
            pertimbangan = "Perhatian khusus nomor bersama: Nomor telepon sama persis tetapi nama dan tanggal lahir berbeda, berpotensi kuat merupakan pendaftaran kolektif / nomor bersama (keluarga/kerabat)."
        else:
            pertimbangan = "Data pada salah satu berkas tidak lengkap sehingga memerlukan konfirmasi fisik ke koordinator unit."
    elif scale == 2:
        pertimbangan = f"Potensi kuat orang berbeda (homonim): Meskipun nama sama/mirip, nomor telepon berbeda total dan tanggal lahir terbukti selisih ~{min_diff_year or '?'} tahun."
    else:
        pertimbangan = "Hampir pasti orang yang berbeda: Nama, nomor telepon, dan tanggal lahir seluruhnya tidak cocok."

    return {
        "no": item["no"],
        "reg": reg,
        "nama_ods": nama_ods,
        "wa_ods": format_phone_display(wa_ods),
        "cabang_ods": cab_ods,
        
        # Dokumen A (Sah)
        "k_sah": k_sah,
        "nama_sah": nama_sah,
        "hp_sah": hp_sah,
        "bd_sah": bd_sah,
        "unit_sah": unit_sah_display,
        "pos_sah": pos_sah_display,
        "status_sah": "HAK SAH (SERAHKAN)",
        
        # Dokumen B (Dialihkan)
        "k_kun": k_kun,
        "nama_kun": nama_kun,
        "hp_kun": hp_kun,
        "bd_kun": bd_kun,
        "unit_kun": unit_kun_display,
        "pos_kun": pos_kun_display,
        "status_kun": "DIALOKASIKAN (KUNING)",
        
        # Evaluations
        "eval_nama": eval_nama,
        "eval_hp": eval_hp,
        "eval_bd": eval_bd,
        "scale": scale,
        "kategori": categories[scale],
        
        # Considerations & Instructions
        "pertimbangan": pertimbangan,
        "instruksi": item["instruksi"],
        "dasar": item["dasar"],
    }

enriched_56 = [evaluate_participant(it) for it in items_56]
print(f"All {len(enriched_56)} participants evaluated.")

# Build enriched 58 claims
enriched_58 = []
for it in enriched_56:
    # Find how many claims in Sheet 3
    # Most have 1 claim, Halimah has 2, Nani has 2
    reg = it["reg"]
    k_dialihkan = it["k_kun"]
    file_dialihkan = verification_file_map.get(k_dialihkan, "-")
    file_sah = verification_file_map.get(it["k_sah"], "-")
    
    # If bogor and Halimah or Nani
    kuning_list = get_party_info(k_dialihkan, reg, it["nama_ods"])
    if len(kuning_list) > 1:
        for idx_k, k_sub in enumerate(kuning_list, 1):
            nm_sub = k_sub.get("nama", it["nama_kun"])
            hp_sub = format_phone_display(k_sub.get("hp"))
            bd_sub = parse_date(k_sub.get("tgl_lahir", "-"))
            un_sub = k_sub.get("unit", "-")
            if "no_unit" in k_sub and k_sub["no_unit"]:
                un_sub = f"{un_sub} (#{k_sub['no_unit']})"
            pos_sub = f"No. {k_sub.get('global_no', '-')}"
            
            sub_eval = {
                "eval_nama": it["eval_nama"],
                "eval_hp": it["eval_hp"],
                "eval_bd": it["eval_bd"],
                "scale": it["scale"],
                "kategori": it["kategori"],
                "pertimbangan": it["pertimbangan"],
            }
            
            enriched_58.append({
                "no": len(enriched_58) + 1,
                "k_dialihkan": k_dialihkan,
                "file_dialihkan": file_dialihkan,
                "no_urut_berkas": k_sub.get("global_no", "-"),
                "nama_dialihkan": nm_sub,
                "hp_dialihkan": hp_sub,
                "bd_dialihkan": bd_sub,
                "unit_dialihkan": un_sub,
                "status_dialihkan": "DIALOKASIKAN (KUNING)",
                
                "k_sah": it["k_sah"],
                "file_sah": file_sah,
                "pos_sah": it["pos_sah"],
                "nama_sah": it["nama_sah"],
                "hp_sah": it["hp_sah"],
                "bd_sah": it["bd_sah"],
                "unit_sah": it["unit_sah"],
                "status_sah": "HAK SAH (SERAHKAN)",
                
                "reg": reg,
                "nama_ods": it["nama_ods"],
                "wa_ods": it["wa_ods"],
                "cabang_ods": it["cabang_ods"],
                
                "eval_nama": sub_eval["eval_nama"],
                "eval_hp": sub_eval["eval_hp"],
                "eval_bd": sub_eval["eval_bd"],
                "scale": sub_eval["scale"],
                "kategori": sub_eval["kategori"],
                "pertimbangan": sub_eval["pertimbangan"],
            })
    else:
        enriched_58.append({
            "no": len(enriched_58) + 1,
            "k_dialihkan": k_dialihkan,
            "file_dialihkan": file_dialihkan,
            "no_urut_berkas": it["pos_kun"].replace("No. ", ""),
            "nama_dialihkan": it["nama_kun"],
            "hp_dialihkan": it["hp_kun"],
            "bd_dialihkan": it["bd_kun"],
            "unit_dialihkan": it["unit_kun"],
            "status_dialihkan": "DIALOKASIKAN (KUNING)",
            
            "k_sah": it["k_sah"],
            "file_sah": file_sah,
            "pos_sah": it["pos_sah"],
            "nama_sah": it["nama_sah"],
            "hp_sah": it["hp_sah"],
            "bd_sah": it["bd_sah"],
            "unit_sah": it["unit_sah"],
            "status_sah": "HAK SAH (SERAHKAN)",
            
            "reg": reg,
            "nama_ods": it["nama_ods"],
            "wa_ods": it["wa_ods"],
            "cabang_ods": it["cabang_ods"],
            
            "eval_nama": it["eval_nama"],
            "eval_hp": it["eval_hp"],
            "eval_bd": it["eval_bd"],
            "scale": it["scale"],
            "kategori": it["kategori"],
            "pertimbangan": it["pertimbangan"],
        })

print(f"Total enriched 58 claims: {len(enriched_58)}")

# Create Workbook
wb_new = openpyxl.Workbook()

# Style definitions
font_super = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_sub = Font(name="Calibri", size=9.5, bold=True)
font_data = Font(name="Calibri", size=9.5)
font_bold = Font(name="Calibri", size=9.5, bold=True)
font_code = Font(name="Consolas", size=9.5, bold=True)

# Theme Fills
fill_master_super = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid") # Deep Navy
fill_master_sub = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")

fill_sah_super = PatternFill(start_color="1E4620", end_color="1E4620", fill_type="solid")    # Forest Green
fill_sah_sub = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")

fill_kuning_super = PatternFill(start_color="8A6D3B", end_color="8A6D3B", fill_type="solid") # Warm Amber
fill_kuning_sub = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")

fill_eval_super = PatternFill(start_color="34495E", end_color="34495E", fill_type="solid")   # Charcoal/Navy
fill_eval_sub = PatternFill(start_color="EAECEE", end_color="EAECEE", fill_type="solid")

fill_rekom_super = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid")  # Slate
fill_rekom_sub = PatternFill(start_color="E5E7E9", end_color="E5E7E9", fill_type="solid")

# Scale Badges
scale_styles = {
    5: (PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="155724")), # Emerald Green
    4: (PatternFill(start_color="D1ECF1", end_color="D1ECF1", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="0C5460")), # Cyan/Blue
    3: (PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="856404")), # Amber/Yellow
    2: (PatternFill(start_color="FFE8D6", end_color="FFE8D6", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="A73A00")), # Orange
    1: (PatternFill(start_color="F8D7DA", end_color="F8D7DA", fill_type="solid"), Font(name="Calibri", size=9.5, bold=True, color="721C24")), # Soft Red
}

fill_row_even = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
fill_row_odd = PatternFill(start_color="F8F9FA", end_color="F8F9FA", fill_type="solid")

thin_border_side = Side(border_style="thin", color="D3D3D3")
thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
align_right = Alignment(horizontal="right", vertical="center", wrap_text=True)

# ==============================================================================
# SHEET 1: Penyerahan Kaos Lintas Berkas (Detailed Side-by-Side + Scale)
# ==============================================================================
ws1 = wb_new.active
ws1.title = "Penyerahan Kaos Lintas Berkas"

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
    ("Tgl. Lahir Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Cabang / Unit di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Posisi Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    
    # Dokumen B (Dialihkan)
    ("Kontingen Dialihkan (Kuning)", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Tgl. Lahir Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Cabang / Unit di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("Posisi Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    
    # Evaluasi & Skala
    ("Evaluasi Kesamaan Nama", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi Kesamaan No. HP", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi Tanggal Lahir", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("SKALA KESAMAAN (1 - 5)", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("KATEGORI PROBABILITAS KESAMAAN", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    
    # Pertimbangan & Instruksi
    ("Pertimbangan Analisis Panitia (Objektif)", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Instruksi Operasional Saat Ini", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Dasar Penetapan Master ODS", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
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

for row_idx, d in enumerate(enriched_56, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    scale_fill, scale_font = scale_styles.get(d["scale"], (bg_row, font_bold))
    
    row_vals = [
        (d["no"], font_bold, align_center, bg_row),
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["wa_ods"], font_data, align_center, bg_row),
        (d["cabang_ods"], font_data, align_left, bg_row),
        
        # Dokumen A (Sah)
        (d["k_sah"], font_bold, align_center, bg_row),
        (d["nama_sah"], font_bold, align_left, bg_row),
        (d["hp_sah"], font_data, align_center, bg_row),
        (d["bd_sah"], font_data, align_center, bg_row),
        (d["unit_sah"], font_data, align_left, bg_row),
        (d["pos_sah"], font_data, align_center, bg_row),
        
        # Dokumen B (Dialihkan)
        (d["k_kun"], font_bold, align_center, bg_row),
        (d["nama_kun"], font_bold, align_left, bg_row),
        (d["hp_kun"], font_data, align_center, bg_row),
        (d["bd_kun"], font_data, align_center, bg_row),
        (d["unit_kun"], font_data, align_left, bg_row),
        (d["pos_kun"], font_data, align_center, bg_row),
        
        # Evaluasi & Skala
        (d["eval_nama"], font_data, align_left, bg_row),
        (d["eval_hp"], font_data, align_left, bg_row),
        (d["eval_bd"], font_data, align_left, bg_row),
        (d["scale"], Font(name="Calibri", size=12, bold=True, color="1B365D"), align_center, scale_fill),
        (d["kategori"], scale_font, align_center, scale_fill),
        
        # Pertimbangan & Instruksi
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
        
    ws1.row_dimensions[row_idx].height = 42

ws1.freeze_panes = "F3"
ws1.views.sheetView[0].showGridLines = True

col_widths_ws1 = {
    1: 6,    # No
    2: 19,   # No Reg ODS
    3: 24,   # Nama ODS
    4: 16,   # WA ODS
    5: 34,   # Cabang ODS
    6: 18,   # Kontingen Sah
    7: 24,   # Nama Sah
    8: 17,   # HP Sah
    9: 16,   # Tgl Lahir Sah
    10: 28,  # Unit Sah
    11: 14,  # Posisi Sah
    12: 18,  # Kontingen Dialihkan
    13: 24,  # Nama Dialihkan
    14: 18,  # HP Dialihkan
    15: 18,  # Tgl Lahir Dialihkan
    16: 30,  # Unit Dialihkan
    17: 15,  # Posisi Dialihkan
    18: 34,  # Evaluasi Nama
    19: 34,  # Evaluasi HP
    20: 34,  # Evaluasi Tgl Lahir
    21: 14,  # Skala (1-5)
    22: 28,  # Kategori Probabilitas
    23: 45,  # Pertimbangan Analisis Panitia
    24: 42,  # Instruksi Lapangan
    25: 36,  # Dasar Penetapan ODS
}

for col_idx, width in col_widths_ws1.items():
    ws1.column_dimensions[get_column_letter(col_idx)].width = width

print("Sheet 1 generated.")


# ==============================================================================
# SHEET 2: Ringkasan Alokasi Penyerahan (Executive + Scale Distribution)
# ==============================================================================
ws2 = wb_new.create_sheet(title="Ringkasan Alokasi Penyerahan")

# Title
ws2.merge_cells("A1:G1")
ws2["A1"] = "RINGKASAN EKSEKUTIF ALOKASI PENYERAHAN KAOS & SKALA KESAMAAN DATA"
ws2["A1"].font = Font(name="Calibri", size=14, bold=True, color="FFFFFF")
ws2["A1"].fill = fill_master_super
ws2["A1"].alignment = align_center

ws2.merge_cells("A2:G2")
ws2["A2"] = "Audit Silang 14 Kontingen Kongres Nasional (KONAS) PERSADIA 2026 - Analisis Multi-Parameter Nama, HP, & Tgl Lahir"
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

# Section 2: Distribution of Scale (1 - 5) - BARU!
ws2.cell(12, 1).value = "2. DISTRIBUSI SKALA INDIKASI KESAMAAN PESERTA (SKALA 1 s.d. 5)"
ws2.cell(12, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

scale_counts = {1: [], 2: [], 3: [], 4: [], 5: []}
for it in enriched_56:
    scale_counts[it["scale"]].append(it["nama_ods"])

scale_table_headers = [
    "Skala", "Kategori Probabilitas", "Jumlah Peserta", "Persentase", "Kriteria Penentuan Skala", "Daftar Nama Peserta Terkait"
]
for c_idx, h in enumerate(scale_table_headers, 1):
    c = ws2.cell(13, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_eval_sub
    c.border = thin_border
    c.alignment = align_center if c_idx in [1, 3, 4] else align_left

scale_desc = [
    (5, "5 - SANGAT KUAT", len(scale_counts[5]), f"{len(scale_counts[5])/56*100:.1f}%",
     "Tgl Lahir Sama Persis DAN No HP Sama / Typo <=2 Digit DAN Nama Cocok / Typo Ringan",
     ", ".join(scale_counts[5])),
    (4, "4 - KUAT", len(scale_counts[4]), f"{len(scale_counts[4])/56*100:.1f}%",
     "No HP Sama Persis & Nama Selaras / Alias (atau Tgl Lahir Sama Persis & Nama Cocok)",
     ", ".join(scale_counts[4])),
    (3, "3 - SEDANG", len(scale_counts[3]), f"{len(scale_counts[3])/56*100:.1f}%",
     "Perlu Cek Khusus: No HP Sama tetapi Nama/Tgl Beda (Nomor Bersama/Kolektif) ATAU Data Parsial",
     ", ".join(scale_counts[3]) if scale_counts[3] else "Tidak Ada"),
    (2, "2 - RENDAH", len(scale_counts[2]), f"{len(scale_counts[2])/56*100:.1f}%",
     "Potensi Kuat Homonim / Orang Berbeda: Nama Mirip, tetapi No HP Beda Total & Tgl Lahir Beda Tahun",
     ", ".join(scale_counts[2])),
    (1, "1 - SANGAT RENDAH", len(scale_counts[1]), f"{len(scale_counts[1])/56*100:.1f}%",
     "Hampir Pasti Orang Berbeda: Nama, No HP, dan Tanggal Lahir Seluruhnya Berbeda",
     ", ".join(scale_counts[1]) if scale_counts[1] else "Tidak Ada"),
]

for r_offset, (s_num, s_kat, s_qty, s_pct, s_crit, s_names) in enumerate(scale_desc, 14):
    sc_fill, sc_font = scale_styles.get(s_num, (fill_row_even, font_bold))
    ws2.cell(r_offset, 1, s_num).alignment = align_center
    ws2.cell(r_offset, 2, s_kat).alignment = align_center
    ws2.cell(r_offset, 3, s_qty).alignment = align_center
    ws2.cell(r_offset, 4, s_pct).alignment = align_center
    ws2.cell(r_offset, 5, s_crit).alignment = align_left
    ws2.cell(r_offset, 6, s_names).alignment = align_left
    
    for c in range(1, 7):
        ws2.cell(r_offset, c).border = thin_border
        if c in [1, 2]:
            ws2.cell(r_offset, c).fill = sc_fill
            ws2.cell(r_offset, c).font = sc_font
        elif c in [3, 4]:
            ws2.cell(r_offset, c).font = font_bold
            ws2.cell(r_offset, c).fill = fill_row_even if r_offset % 2 == 0 else fill_row_odd
        else:
            ws2.cell(r_offset, c).font = font_data
            ws2.cell(r_offset, c).fill = fill_row_even if r_offset % 2 == 0 else fill_row_odd

# Section 3: Matriks Silang Penyerahan Kaos
ws2.cell(21, 1).value = "3. MATRIKS SILANG PENYERAHAN KAOS ANTAR-KONTINGEN (CROSS-REFERENCING)"
ws2.cell(21, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

matrix_headers = [
    "Kontingen Penyerah Kaos (Hak Sah)",
    "Klaim Bogor (Batal)", "Klaim Jaktim (Batal)", "Klaim Jaksel (Batal)", "Klaim Purwakarta (Batal)",
    "Total Kaos Diserahkan (Hak Sah)",
]

for c_idx, h in enumerate(matrix_headers, 1):
    c = ws2.cell(22, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_sah_sub if c_idx in [1, 6] else fill_kuning_sub
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

for r_offset, row in enumerate(matrix_rows, 23):
    is_total = (r_offset == 23 + len(matrix_rows) - 1)
    bg = fill_master_sub if is_total else (fill_row_even if r_offset % 2 == 0 else fill_row_odd)
    for c_idx, val in enumerate(row, 1):
        cell = ws2.cell(r_offset, c_idx)
        cell.value = val
        cell.font = font_bold if (is_total or c_idx in [1, 6]) else font_data
        cell.alignment = align_left if c_idx == 1 else align_center
        cell.fill = bg
        cell.border = thin_border

# Section 4: Rekapitulasi 14 Kontingen Lengkap
ws2.cell(33, 1).value = "4. REKAPITULASI KUOTA & STATUS PENYERAHAN KAOS 14 KONTINGEN"
ws2.cell(33, 1).font = Font(name="Calibri", size=11, bold=True, color="1B365D")

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
    c = ws2.cell(34, c_idx)
    c.value = h
    c.font = font_sub
    c.fill = fill_master_sub
    c.border = thin_border
    c.alignment = align_center if c_idx in [1, 3, 4, 5, 6] else align_left

for r_offset, row in enumerate(kontingen_summary, 35):
    is_total = (r_offset == 35 + len(kontingen_summary) - 1)
    bg = fill_master_sub if is_total else (fill_row_even if r_offset % 2 == 0 else fill_row_odd)
    no_val = "" if is_total else (r_offset - 34)
    
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
ws2.column_dimensions["G"].width = 65

print("Sheet 2 generated.")


# ==============================================================================
# SHEET 3: Log 58 Klaim Dialihkan (Kuning) (Side-by-Side + Scale)
# ==============================================================================
ws3 = wb_new.create_sheet(title="Log 58 Klaim Dialihkan (Kuning)")

super_headers_ws3 = [
    (1, 8, "DOKUMEN KLAIM TERDAMPAK / DIALIHKAN (STATUS KUNING)", fill_kuning_super),
    (9, 15, "DISANDINGKAN DENGAN DOKUMEN PENYERAH (HAK SAH)", fill_sah_super),
    (16, 20, "PARAMETER EVALUASI & SKALA KESAMAAN", fill_eval_super),
    (21, 23, "IDENTITAS RESMI MASTER ODS & PERTIMBANGAN PANITIA", fill_rekom_super),
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
    # Dialihkan
    ("No", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Kontingen Dialihkan (Kuning)", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("File Verifikasi Berkas", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. Urut Berkas", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Nama di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    ("No. HP di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Tgl. Lahir Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_center),
    ("Cabang / Unit di Berkas Dialihkan", fill_kuning_sub, Font(name="Calibri", size=9.5, bold=True, color="7A5200"), align_left),
    
    # Hak Sah
    ("Kontingen Penyerah (Hak Sah)", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("File Verifikasi Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("Posisi di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Nama di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    ("No. HP di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Tgl. Lahir Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_center),
    ("Cabang / Unit di Berkas Penyerah", fill_sah_sub, Font(name="Calibri", size=9.5, bold=True, color="1E4620"), align_left),
    
    # Evaluasi & Skala
    ("Evaluasi Nama", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi No. HP", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Evaluasi Tgl Lahir", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("SKALA (1 - 5)", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    ("KATEGORI PROBABILITAS", fill_eval_sub, Font(name="Calibri", size=9.5, bold=True, color="1B365D"), align_center),
    
    # Master ODS & Pertimbangan
    ("No. Registrasi ODS", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_center),
    ("Nama di Master ODS", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
    ("Pertimbangan Analisis Panitia (Objektif)", fill_rekom_sub, Font(name="Calibri", size=9.5, bold=True, color="2C3E50"), align_left),
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

for row_idx, d in enumerate(enriched_58, 3):
    bg_row = fill_row_even if row_idx % 2 == 1 else fill_row_odd
    scale_fill, scale_font = scale_styles.get(d["scale"], (bg_row, font_bold))
    
    row_vals = [
        (d["no"], font_bold, align_center, bg_row),
        (d["k_dialihkan"], font_bold, align_center, bg_row),
        (d["file_dialihkan"], font_code, align_left, bg_row),
        (d["no_urut_berkas"], font_bold, align_center, bg_row),
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
        
        (d["eval_nama"], font_data, align_left, bg_row),
        (d["eval_hp"], font_data, align_left, bg_row),
        (d["eval_bd"], font_data, align_left, bg_row),
        (d["scale"], Font(name="Calibri", size=12, bold=True, color="1B365D"), align_center, scale_fill),
        (d["kategori"], scale_font, align_center, scale_fill),
        
        (d["reg"], font_code, align_center, bg_row),
        (d["nama_ods"], font_bold, align_left, bg_row),
        (d["pertimbangan"], font_data, align_left, bg_row),
    ]
    
    for c_idx, (val, c_font, c_align, c_fill) in enumerate(row_vals, 1):
        cell = ws3.cell(row_idx, c_idx)
        cell.value = val
        cell.font = c_font
        cell.alignment = c_align
        cell.fill = c_fill
        cell.border = thin_border
        
    ws3.row_dimensions[row_idx].height = 40

ws3.freeze_panes = "I3"
ws3.views.sheetView[0].showGridLines = True

col_widths_ws3 = {
    1: 6,    # No
    2: 18,   # Kontingen Dialihkan
    3: 32,   # File Dialihkan
    4: 14,   # No Urut
    5: 22,   # Nama Dialihkan
    6: 18,   # HP Dialihkan
    7: 16,   # Tgl Lahir Dialihkan
    8: 28,   # Unit Dialihkan
    9: 18,   # Kontingen Sah
    10: 32,  # File Sah
    11: 14,  # Posisi Sah
    12: 22,  # Nama Sah
    13: 18,  # HP Sah
    14: 16,  # Tgl Lahir Sah
    15: 28,  # Unit Sah
    16: 30,  # Evaluasi Nama
    17: 30,  # Evaluasi HP
    18: 30,  # Evaluasi BD
    19: 14,  # Skala
    20: 28,  # Kategori
    21: 19,  # No Reg
    22: 22,  # Nama ODS
    23: 45,  # Pertimbangan
}

for col_idx, width in col_widths_ws3.items():
    ws3.column_dimensions[get_column_letter(col_idx)].width = width

print("Sheet 3 generated.")

# Save Workbook
wb_new.save(OUTPUT_XLSX)
print(f"Workbook successfully saved to: {OUTPUT_XLSX}")

# Synchronize Markdown Document
md_lines = []
md_lines.append("# LAPORAN LENGKAP AUDIT DUPLIKASI LINTAS BERKAS & SKALA INDIKASI KESAMAAN")
md_lines.append("**Kongres Nasional (KONAS) PERSADIA 2026**  ")
md_lines.append("*GOR Pakansari, Kabupaten Bogor*")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## 1. Ringkasan Eksekutif & Statistik Temuan")
md_lines.append("")
md_lines.append("Berdasarkan audit silang (*cross-referencing*) antara **14 berkas laporan verifikasi kontingen** terhadap basis data master `Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods`, ditemukan bahwa terdapat **56 orang pendaftar yang namanya terdata dan diklaim di lebih dari satu berkas kontingen** (menghasilkan **114 entri klaim fisik** di seluruh berkas).")
md_lines.append("")
md_lines.append("Untuk membantu panitia mengambil keputusan secara adil dan akurat tanpa memvonis prematur, seluruh data temuan telah **disandingkan sebelah-menyebelah** dan dievaluasi menggunakan **Skala Indikasi Kesamaan (Skala 1 s.d. 5)** berdasarkan 3 parameter utama: **Nama Lengkap**, **Nomor WhatsApp/Telepon**, dan **Tanggal Lahir**.")
md_lines.append("")
md_lines.append("| Parameter Audit Lintas Kontingen | Nilai / Jumlah | Keterangan Penjelasan |")
md_lines.append("| :--- | :---: | :--- |")
md_lines.append("| **Total Peserta Terdaftar Lintas Wilayah** | **56 Orang** | Orang unik yang tercantum di lebih dari satu berkas kontingen |")
md_lines.append("| **Total Klaim Fisik di Berkas Pendaftaran** | **114 Klaim** | Kemunculan baris pendaftaran fisik di 14 berkas kontingen |")
md_lines.append("| **Total Kaos Diserahkan (Hak Sah Lapangan)** | **56 Kaos** | Kaos diserahkan oleh kontingen yang ditetapkan sebagai Hak Sah |")
md_lines.append("| **Total Klaim Berhasil Dibatalkan / Dialihkan (Kuning)** | **58 Klaim** | 49 di Bogor, 6 di Jakarta Timur, 2 di Jakarta Selatan, 1 di Purwakarta |")
md_lines.append("| **Total Kuota Bersih Kaos (14 Kontingen Sah)** | **6.088 Kaos** | Kuota peserta sah setelah eliminasi klaim duplikat lintas berkas |")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## 2. Distribusi Skala Indikasi Kesamaan Peserta (Skala 1 s.d. 5)")
md_lines.append("")
md_lines.append("| Skala | Kategori Probabilitas | Jumlah Peserta | Persentase | Kriteria Penentuan Skala & Catatan Khusus |")
md_lines.append("| :---: | :--- | :---: | :---: | :--- |")
for s_num, s_kat, s_qty, s_pct, s_crit, s_names in scale_desc:
    md_lines.append(f"| **{s_num}** | **{s_kat}** | **{s_qty} Orang** | **{s_pct}** | {s_crit} |")

md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## 3. Matriks Silang Penyerahan Kaos Antar-Kontingen")
md_lines.append("")
md_lines.append("| Kontingen Penyerah Kaos (Hak Sah) | Klaim Bogor (Batal) | Klaim Jaktim (Batal) | Klaim Jaksel (Batal) | Klaim Purwakarta (Batal) | Total Kaos Diserahkan |")
md_lines.append("| :--- | :---: | :---: | :---: | :---: | :---: |")
md_lines.append("| **Depok** | 20 | 1 | 1 | 0 | **22 Kaos** |")
md_lines.append("| **KORMI & DIID** | 12 | 3 | 0 | 0 | **15 Kaos** |")
md_lines.append("| **Jakarta Timur** | 8 | 0 | 0 | 0 | **8 Kaos** |")
md_lines.append("| **Bogor** | 0 | 2 | 1 | 1 | **4 Kaos** |")
md_lines.append("| **Bekasi** | 4 | 0 | 0 | 0 | **4 Kaos** |")
md_lines.append("| **Sumedang** | 2 | 0 | 0 | 0 | **2 Kaos** |")
md_lines.append("| **Cimahi** | 1 | 0 | 0 | 0 | **1 Kaos** |")
md_lines.append("| **Total Klaim Batal / Kuning** | **47 Orang** *(49 klaim)* | **6 Orang** | **2 Orang** | **1 Orang** | **56 Orang (56 Kaos)** |")
md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## 4. Tabel Lengkap 56 Peserta: Sandingan Sebelah-Menyebelah, Tanggal Lahir, & Skala Kesamaan")
md_lines.append("")
md_lines.append("| No | No. Reg ODS | Nama di ODS & No. WA | DOKUMEN PENYERAH (HAK SAH): Kontingen & Posisi | Nama di Dokumen Penyerah | No. HP Penyerah | Tgl. Lahir Penyerah | DOKUMEN DIALIHKAN (KUNING): Kontingen & Posisi | Nama di Dokumen Dialihkan | No. HP Dialihkan | Tgl. Lahir Dialihkan | Evaluasi Parameter (Nama, HP, Tgl Lahir) | SKALA | Kategori Probabilitas & Pertimbangan Panitia |")
md_lines.append("| :-: | :---: | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :---: | :---: | :--- | :---: | :--- |")

for d in enriched_56:
    ods_info = f"**{d['nama_ods']}**<br>`{d['wa_ods']}`"
    sah_info = f"**{d['k_sah']}**<br>({d['pos_sah']})<br>*{d['unit_sah']}*"
    kun_info = f"**{d['k_kun']}**<br>({d['pos_kun']})<br>*{d['unit_kun']}*"
    eval_all = f"- **Nama:** {d['eval_nama']}<br>- **HP:** {d['eval_hp']}<br>- **Tgl Lahir:** {d['eval_bd']}"
    pertimbangan_full = f"**{d['kategori']}**<br><br>💡 *Pertimbangan:* {d['pertimbangan']}<br><br>📋 *Instruksi:* {d['instruksi']}"
    
    row_md = f"| {d['no']} | `{d['reg']}` | {ods_info} | {sah_info} | **{d['nama_sah']}** | `{d['hp_sah']}` | `{d['bd_sah']}` | {kun_info} | **{d['nama_kun']}** | `{d['hp_kun']}` | `{d['bd_kun']}` | {eval_all} | **{d['scale']}** | {pertimbangan_full} |"
    md_lines.append(row_md)

md_lines.append("")
md_lines.append("---")
md_lines.append("")
md_lines.append("## 5. Pedoman Interpretasi Skala untuk Koordinator Lapangan")
md_lines.append("")
md_lines.append("1. **Skala 5 (Sangat Kuat - 4 Peserta):** Tanggal lahir sama persis, kontak telepon identik/typo 1 digit, nama selaras. Mutlak merupakan orang yang sama (Hanya 1 kaos diserahkan oleh Kontingen Sah).")
md_lines.append("2. **Skala 4 (Kuat - 4 Peserta):** Nomor kontak identik dan nama selaras (atau tgl lahir sama persis). Kemungkinan besar orang yang sama.")
md_lines.append("3. **Skala 3 (Sedang / Perlu Cek):** Nomor telepon sama tetapi nama dan tanggal lahir berbeda (indikasi pendaftaran kolektif / nomor keluarga bersama). Pastikan fisik peserta sebelum memvonis duplikat.")
md_lines.append("4. **Skala 2 (Rendah / Indikasi Homonim - 48 Peserta):** Meskipun nama mirip, nomor telepon berbeda total dan tanggal lahir terbukti selisih beberapa tahun. Sangat kuat merupakan orang yang berbeda (homonim). Berkas kedua berpotensi berhak atas kaos mandiri.")
md_lines.append("")
md_lines.append("---")
md_lines.append("*Dokumen ini diperbarui secara otomatis dan sinkron dengan basis data Master ODS dan 14 berkas laporan verifikasi data peserta KONAS PERSADIA 2026.*")

with open(OUTPUT_MD, "w") as f:
    f.write("\n".join(md_lines) + "\n")

print(f"Markdown updated successfully: {OUTPUT_MD}")
