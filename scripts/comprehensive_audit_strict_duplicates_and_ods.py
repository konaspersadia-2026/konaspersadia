#!/usr/bin/env python3
"""
comprehensive_audit_strict_duplicates_and_ods.py
Audit menyeluruh 15 Kontingen terhadap ODS:
1. Status Keberadaan di ODS (In ODS vs Not in ODS)
2. Pengecekan Duplikasi HANYA jika 4 parameter identik:
   - Nama
   - No. Telepon / HP
   - Jenis Kelamin
   - Tanggal Lahir
   (Jika salah satu beda, BUKAN duplikasi)
"""

import os
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime
from collections import defaultdict
import openpyxl

BASE_DIR = "Data peserta/Data pengambilan baju"

def clean_phone(p):
    if not p: return ""
    d = re.sub(r"[^\d]", "", str(p))
    if d.startswith("62"): d = "0" + d[2:]
    elif d.startswith("8"): d = "0" + d
    return d

def norm_gender(g):
    if not g: return ""
    s = str(g).upper().strip()
    if s.startswith("P") or "WANITA" in s or "PEREMPUAN" in s: return "P"
    if s.startswith("L") or "PRIA" in s or "LAKI" in s: return "L"
    return s

def norm_date(d):
    if not d or str(d).strip() in ["-", "", "None", "HADIR"]: return ""
    if isinstance(d, datetime):
        return d.strftime("%d/%m/%Y")
    s = str(d).strip()
    m = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", s)
    if m:
        return f"{int(m.group(1)):02d}/{int(m.group(2)):02d}/{m.group(3)}"
    m_iso = re.search(r"(\d{4})[/-](\d{1,2})[/-](\d{1,2})", s)
    if m_iso:
        return f"{int(m_iso.group(3)):02d}/{int(m_iso.group(2)):02d}/{m_iso.group(1)}"
    month_map = {
        "jan": "01", "januari": "01", "feb": "02", "februari": "02",
        "mar": "03", "maret": "03", "apr": "04", "april": "04",
        "mei": "05", "may": "05", "jun": "06", "juni": "06",
        "jul": "07", "juli": "07", "agu": "08", "agustus": "08", "aug": "08",
        "sep": "09", "september": "09", "okt": "10", "oktober": "10", "oct": "10",
        "nop": "11", "november": "11", "nov": "11", "des": "12", "desember": "12", "dec": "12"
    }
    m_clean = re.search(r"(\d{1,2})[\s/-]+([A-Za-z]+)[\s/-]+(\d{2,4})", s)
    if m_clean:
        day, mon, yr = m_clean.groups()
        if len(yr) == 2:
            yr = "19" + yr if int(yr) > 30 else "20" + yr
        mon_str = month_map.get(mon.lower()[:3])
        if mon_str:
            return f"{int(day):02d}/{mon_str}/{yr}"
    return s

def norm_name(n):
    if not n: return ""
    s = str(n).lower().strip()
    s = re.sub(r"\b(dr|drg|s\.pd|sp\.pd|sp\.m|sp\.gk|mars|m\.m|m\.m\.r\.s|skm|a\.md\.kep|a\.md\.gz|sst\.ft|h|hj)\b", "", s)
    s = re.sub(r"[\*\.,\(\)\'\"]", " ", s)
    s = " ".join(s.split())
    return s

# 1. LOAD ODS
print("=== 1. LOADING MASTER ODS ===")
with zipfile.ZipFile(os.path.join(BASE_DIR, "Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods")) as z:
    content = z.read("content.xml")
root = ET.fromstring(content)
ns_table = "urn:oasis:names:tc:opendocument:xmlns:table:1.0"
ns_text = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"

ods_rows = []
for table in root.iter(f"{{{ns_table}}}table"):
    for row in table.iter(f"{{{ns_table}}}table-row"):
        row_cells = []
        for cell in row.iter(f"{{{ns_table}}}table-cell"):
            repeat = int(cell.attrib.get(f"{{{ns_table}}}number-columns-repeated", "1"))
            texts = [t.text for t in cell.iter(f"{{{ns_text}}}p") if t.text]
            cell_val = " ".join(texts) if texts else ""
            for _ in range(min(repeat, 30)):
                row_cells.append(cell_val)
        if any(c.strip() for c in row_cells):
            ods_rows.append(row_cells)

ods_regs = set()
ods_dict = {}
for idx, r in enumerate(ods_rows[1:], start=2):
    reg = r[0].strip()
    nama = r[2].strip()
    phone = clean_phone(r[5])
    cabang = r[14].strip() if len(r) > 14 else ""
    status = r[10].strip() if len(r) > 10 else ""
    if reg:
        ods_regs.add(reg)
        ods_dict[reg] = {"row": idx, "nama": nama, "phone": phone, "cabang": cabang, "status": status}

print(f"Total ODS rows: {len(ods_dict)}")

# 2. LOAD ALL 15 CONTINGENTS INTO UNIFIED LIST
print("\n=== 2. LOADING 15 CONTINGENTS ===")
participants = []

# (1) Gorontalo
gorontalo = [
    {"no": 1, "nama": "Yusran Aswad", "tgl": "15/09/1986", "jk": "L", "hp": "085240540642", "reg": "KNS2026-44111610"},
    {"no": 2, "nama": "dr. Taufik Ramadhan Biya, SpPD, K-EMD", "tgl": "09/07/1981", "jk": "L", "hp": "08124264272", "reg": "KNS2026-17799480"},
    {"no": 3, "nama": "dr.Dina Noerlaila Hadju, Sp.GK", "tgl": "14/05/1988", "jk": "P", "hp": "082348661114", "reg": "KNS2026-14731383"},
]
for p in gorontalo:
    participants.append({
        "kontingen": "Gorontalo", "no": p["no"], "nama_asli": p["nama"], "nama_norm": norm_name(p["nama"]),
        "hp_asli": p["hp"], "hp_clean": clean_phone(p["hp"]), "jk": norm_gender(p["jk"]),
        "tgl_asli": p["tgl"], "tgl_norm": norm_date(p["tgl"]), "reg": p["reg"], "source": "3 - Gorontalo.txt"
    })

# (2) Karawang
karawang = [
    {"no": 1, "nama": "dr. Irvan Aikaya Salampessy MARS", "tgl": "08/10/1964", "jk": "L", "hp": "0811867986", "reg": "KNS2026-64589989"},
    {"no": 2, "nama": "dr Dian H Rahim ,Sp.M", "tgl": "04/11/1961", "jk": "L", "hp": "08151875396", "reg": "KNS2026-68195449"},
    {"no": 3, "nama": "Ade Hartini,S.Pd", "tgl": "17/07/1962", "jk": "P", "hp": "083815353615", "reg": "KNS2026-13797687"},
    {"no": 4, "nama": "Teti Setiawaty", "tgl": "01/10/1970", "jk": "P", "hp": "08129299419", "reg": "KNS2026-23319806"},
]
for p in karawang:
    participants.append({
        "kontingen": "Karawang", "no": p["no"], "nama_asli": p["nama"], "nama_norm": norm_name(p["nama"]),
        "hp_asli": p["hp"], "hp_clean": clean_phone(p["hp"]), "jk": norm_gender(p["jk"]),
        "tgl_asli": p["tgl"], "tgl_norm": norm_date(p["tgl"]), "reg": p["reg"], "source": "4 - Karawang.txt"
    })

# (3) Subang
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "24_LAPORAN_VERIFIKASI_DATA_PESERTA_SUBANG.xlsx"), data_only=True)
subang_verif = {r[0]: (r[1], r[2], r[3], r[5]) for r in list(wb.active.iter_rows(values_only=True))[1:]}

wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "43 - Subang.xlsx"), data_only=True)
for r in list(wb.active.iter_rows(values_only=True))[4:]:
    if r[0] is not None and str(r[0]).strip().isdigit():
        no = int(r[0])
        reg, nm_ods, hp_ods, st = subang_verif.get(no, ("", "", "", ""))
        reg_val = reg if reg and reg != "-" else ""
        participants.append({
            "kontingen": "Subang", "no": no, "nama_asli": str(r[1] or "").strip(), "nama_norm": norm_name(r[1]),
            "hp_asli": str(r[4] or "").strip(), "hp_clean": clean_phone(r[4]),
            "jk": norm_gender(r[3]), "tgl_asli": str(r[2] or "").strip(), "tgl_norm": norm_date(r[2]),
            "reg": reg_val, "source": "43 - Subang.xlsx"
        })

# (4) Cianjur
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_CIANJUR.md")) as f:
    for line in f:
        if line.startswith("|") and "`KNS2026-" in line:
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 10:
                participants.append({
                    "kontingen": "Cianjur", "no": int(parts[0]), "nama_asli": parts[1], "nama_norm": norm_name(parts[1]),
                    "hp_asli": parts[2], "hp_clean": clean_phone(parts[2]),
                    "jk": norm_gender(parts[3]), "tgl_asli": parts[4], "tgl_norm": norm_date(parts[4]),
                    "reg": parts[6].replace("`", ""), "source": "29 - Cianjur.pdf"
                })

# (5) Cimahi
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "63_LAPORAN_VERIFIKASI_DATA_PESERTA_CIMAHI.xlsx"), data_only=True)
cimahi_verif = {r[0]: r[1] for r in list(wb.active.iter_rows(values_only=True))[1:]}

wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "63 - Cimahi.xlsx"), data_only=True)
for r in list(wb.active.iter_rows(values_only=True))[2:]:
    if r[0] is not None and str(r[0]).strip().isdigit():
        no = int(r[0])
        participants.append({
            "kontingen": "Cimahi", "no": no, "nama_asli": str(r[1] or "").strip(), "nama_norm": norm_name(r[1]),
            "hp_asli": str(r[4] or "").strip(), "hp_clean": clean_phone(r[4]),
            "jk": norm_gender(r[3]), "tgl_asli": str(r[2] or "").strip(), "tgl_norm": norm_date(r[2]),
            "reg": cimahi_verif.get(no, ""), "source": "63 - Cimahi.xlsx"
        })

# (6) Jakarta Barat
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "80_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_BARAT.xlsx"), data_only=True)
jb_verif = {r[0]: r[1] for r in list(wb.active.iter_rows(values_only=True))[1:]}

wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "80_List Peserta WDD_2026 jakkarta barat.xlsx"), data_only=True)
for r in list(wb.active.iter_rows(values_only=True))[6:]:
    if r[1] is not None and str(r[1]).strip().isdigit():
        no = int(r[1])
        participants.append({
            "kontingen": "Jakarta Barat", "no": no, "nama_asli": str(r[2] or "").strip(), "nama_norm": norm_name(r[2]),
            "hp_asli": str(r[5] or "").strip(), "hp_clean": clean_phone(r[5]),
            "jk": norm_gender(r[4]), "tgl_asli": str(r[3] or "").strip(), "tgl_norm": norm_date(r[3]),
            "reg": jb_verif.get(no, ""), "source": "80_List Peserta WDD_2026 jakkarta barat.xlsx"
        })

# (7) Ciamis
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "93_LAPORAN_VERIFIKASI_DATA_PESERTA_CIAMIS.xlsx"), data_only=True)
ciamis_verif = {r[0]: r[1] for r in list(wb.active.iter_rows(values_only=True))[1:]}

# Load Ciamis from DAFTAR_NO_REGISTRASI_PESERTA_CIAMIS.md section 5
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_CIAMIS.md")) as f:
    in_sec5 = False
    for line in f:
        if "TABEL LENGKAP" in line:
            in_sec5 = True; continue
        if in_sec5 and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No") and not line.startswith("| :--"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                no = int(parts[0])
                m_reg = re.search(r"KNS2026-\d+", parts[7])
                reg_val = m_reg.group(0) if m_reg else ciamis_verif.get(no, "")
                participants.append({
                    "kontingen": "Ciamis", "no": no, "nama_asli": parts[3], "nama_norm": norm_name(parts[3]),
                    "hp_asli": parts[4], "hp_clean": clean_phone(parts[4]),
                    "jk": norm_gender(parts[5]) if len(parts)>5 else "", "tgl_asli": "", "tgl_norm": "",
                    "reg": reg_val, "source": "93 - Ciamis.pdf"
                })

# (8) Sumedang
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "100 - Sumedang.xlsx"), data_only=True)
for r in list(wb.active.iter_rows(values_only=True))[2:102]:
    if r[0] is not None and str(r[0]).strip().isdigit():
        no = int(r[0])
        reg_val = str(r[6] or "").strip()
        reg_str = f"KNS2026-{reg_val}" if reg_val and not reg_val.startswith("KNS") else reg_val
        participants.append({
            "kontingen": "Sumedang", "no": no, "nama_asli": str(r[2] or "").strip(), "nama_norm": norm_name(r[2]),
            "hp_asli": str(r[5] or "").strip(), "hp_clean": clean_phone(r[5]),
            "jk": norm_gender(r[3]), "tgl_asli": str(r[4] or "").strip(), "tgl_norm": norm_date(r[4]),
            "reg": reg_str, "source": "100 - Sumedang.xlsx"
        })

# (9) Purwakarta
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "117_LAPORAN_VERIFIKASI_DATA_PESERTA_PURWAKARTA.xlsx"), data_only=True)
for r in list(wb.active.iter_rows(values_only=True))[1:]:
    reg_val = str(r[1] or "").strip()
    participants.append({
        "kontingen": "Purwakarta", "no": int(r[0]), "nama_asli": str(r[2] or "").strip(), "nama_norm": norm_name(r[2]),
        "hp_asli": str(r[3] or "").strip(), "hp_clean": clean_phone(r[3]),
        "jk": "", "tgl_asli": "", "tgl_norm": "",
        "reg": reg_val if reg_val and reg_val != "-" else "", "source": "121 - Purwakarta (incomplete data).pdf"
    })

# (10) Jakarta Selatan
wb_js = openpyxl.load_workbook(os.path.join(BASE_DIR, "244_LAPORAN_VERIFIKASI_DATA_PESERTA_JAKARTA_SELATAN.xlsx"), data_only=True)
js_verif = {r[0]: (r[1], r[2], r[3], r[5]) for r in list(wb_js.active.iter_rows(values_only=True))[1:]}

# Load Jaksel MD
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_SELATAN.md")) as f:
    in_sec = False
    for line in f:
        if "TABEL LENGKAP" in line:
            in_sec = True; continue
        if in_sec and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No") and not line.startswith("| :--"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                no = int(parts[0])
                m_reg = re.search(r"KNS2026-\d+", parts[1])
                reg_val = m_reg.group(0) if m_reg else ""
                participants.append({
                    "kontingen": "Jakarta Selatan", "no": no, "nama_asli": parts[4], "nama_norm": norm_name(parts[4]),
                    "hp_asli": parts[5], "hp_clean": clean_phone(parts[5]),
                    "jk": "", "tgl_asli": "", "tgl_norm": "",
                    "reg": reg_val, "source": "250 - Jakarta Selatan.xlsx"
                })

# (11) Bekasi
wb = openpyxl.load_workbook(os.path.join(BASE_DIR, "380 - Bekasi.xlsx"), data_only=True)
ws = wb.active
for idx, r in enumerate(list(ws.iter_rows(values_only=True))[1:], start=1):
    if r[0]:
        participants.append({
            "kontingen": "Bekasi", "no": idx, "nama_asli": str(r[0]).strip(), "nama_norm": norm_name(r[0]),
            "hp_asli": str(r[2] or "").strip(), "hp_clean": clean_phone(r[2]),
            "jk": norm_gender(r[10]) if len(r)>10 else "", "tgl_asli": str(r[9] or "").strip(),
            "tgl_norm": norm_date(r[9]), "reg": "", "source": "380 - Bekasi.xlsx"
        })

# (12) KORMI & DIID
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_KORMI_DIID.md")) as f:
    in_sec = False
    for line in f:
        if "TABEL LENGKAP" in line:
            in_sec = True; continue
        if in_sec and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No") and not line.startswith("| :--"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 11:
                m_reg = re.search(r"KNS2026-\d+", parts[7])
                reg_val = m_reg.group(0) if m_reg else ""
                participants.append({
                    "kontingen": "KORMI & DIID", "no": int(parts[0]), "nama_asli": parts[2], "nama_norm": norm_name(parts[2]),
                    "hp_asli": parts[6], "hp_clean": clean_phone(parts[6]),
                    "jk": norm_gender(parts[5]), "tgl_asli": parts[4], "tgl_norm": norm_date(parts[4]),
                    "reg": reg_val, "source": "486 - KORMI & DIID.xlsx"
                })

# (13) Jakarta Timur
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_TIMUR.md")) as f:
    in_sec = False
    for line in f:
        if "TABEL LENGKAP" in line:
            in_sec = True; continue
        if in_sec and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No") and not line.startswith("| :--"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                m_reg = re.search(r"KNS2026-\d+", parts[7])
                reg_val = m_reg.group(0) if m_reg else ""
                participants.append({
                    "kontingen": "Jakarta Timur", "no": int(parts[0]), "nama_asli": parts[2], "nama_norm": norm_name(parts[2]),
                    "hp_asli": parts[5], "hp_clean": clean_phone(parts[5]),
                    "jk": norm_gender(parts[4]), "tgl_asli": parts[3], "tgl_norm": norm_date(parts[3]),
                    "reg": reg_val, "source": "585 - Jakarta Timur.pdf"
                })

# (14) Bogor
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_BOGOR.md")) as f:
    in_sec = False
    for line in f:
        if "TABEL LENGKAP" in line:
            in_sec = True; continue
        if in_sec and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No") and not line.startswith("| :--"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                m_reg = re.search(r"KNS2026-\d+", parts[7])
                reg_val = m_reg.group(0) if m_reg else ""
                participants.append({
                    "kontingen": "Bogor", "no": int(parts[0]), "nama_asli": parts[3], "nama_norm": norm_name(parts[3]),
                    "hp_asli": parts[4], "hp_clean": clean_phone(parts[4]),
                    "jk": "", "tgl_asli": parts[5], "tgl_norm": norm_date(parts[5]),
                    "reg": reg_val, "source": "1242 - Bogor.pdf"
                })

# (15) Depok
with open(os.path.join(BASE_DIR, "DAFTAR_NO_REGISTRASI_PESERTA_DEPOK.md")) as f:
    in_sec = False
    for line in f:
        if "TABEL LENGKAP" in line:
            in_sec = True; continue
        if in_sec and line.startswith("|") and not line.startswith("|:--") and not line.startswith("| No") and not line.startswith("| :--"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 11:
                m_reg = re.search(r"KNS2026-\d+", parts[10])
                reg_val = m_reg.group(0) if m_reg else ""
                participants.append({
                    "kontingen": "Depok", "no": int(parts[0]), "nama_asli": parts[4], "nama_norm": norm_name(parts[4]),
                    "hp_asli": parts[8], "hp_clean": clean_phone(parts[8]),
                    "jk": norm_gender(parts[7]), "tgl_asli": parts[6], "tgl_norm": norm_date(parts[6]),
                    "reg": reg_val, "source": "2859 - Depok.pdf"
                })

print(f"Total participants loaded: {len(participants)}")
cnt_by_k = defaultdict(int)
for p in participants: cnt_by_k[p["kontingen"]] += 1
for k, v in sorted(cnt_by_k.items()):
    print(f"  {k:<16}: {v}")

