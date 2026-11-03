import openpyxl, re
from datetime import datetime

wb = openpyxl.load_workbook("Data peserta/Data pengambilan baju/LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx", data_only=True)
ws1 = wb["Penyerahan Kaos Lintas Berkas"]

# Load all birth dates
# 1. Depok
depok_bd = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_DEPOK.md") as f:
    for line in f:
        if "`KNS2026-" in line and "|" in line:
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 11:
                r = re.search(r"KNS2026-\d+", p[10])
                if r: depok_bd[r.group(0)] = p[6]

# 2. Bogor
bogor_bd = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_BOGOR.md") as f:
    for line in f:
        if "`KNS2026-" in line and "|" in line:
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 11:
                r = re.search(r"KNS2026-\d+", p[7])
                if r: bogor_bd.setdefault(r.group(0), []).append(p[5])

# 3. KORMI
kormi_bd = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_KORMI_DIID.md") as f:
    for line in f:
        if "`KNS2026-" in line and "|" in line:
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 8:
                r = re.search(r"KNS2026-\d+", p[7])
                if r: kormi_bd[r.group(0)] = p[4]

# 4. Jaktim
jaktim_bd = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_TIMUR.md") as f:
    for line in f:
        if "`KNS2026-" in line and "|" in line:
            p = [x.strip() for x in line.split("|")[1:-1]]
            if len(p) >= 8:
                r = re.search(r"KNS2026-\d+", p[7])
                if r: jaktim_bd.setdefault(r.group(0), []).append(p[3])

# 5. Bekasi
bekasi_bd = {}
wb_b = openpyxl.load_workbook("Data peserta/Data pengambilan baju/380 - Bekasi.xlsx", data_only=True)
ws_b = wb_b.active
for r in range(2, ws_b.max_row + 1):
    nm = str(ws_b.cell(r, 1).value or "").strip().lower()
    tgl = ws_b.cell(r, 10).value
    if tgl: bekasi_bd[nm] = str(tgl)[:10]

# 6. Sumedang
sumedang_bd = {}
wb_s = openpyxl.load_workbook("Data peserta/Data pengambilan baju/100 - Sumedang.xlsx", data_only=True)
ws_s = wb_s.active
for r in range(3, ws_s.max_row + 1):
    nm = str(ws_s.cell(r, 3).value or "").strip().lower()
    tgl = ws_s.cell(r, 5).value
    if tgl: sumedang_bd[nm] = str(tgl)[:10]

# 7. Cimahi
cimahi_bd = {"KNS2026-18453451": "27/03/1958"}

# 8. Jaksel
jaksel_bd = {
    "KNS2026-56854302": "11/03/1959",
    "KNS2026-90423191": "18/02/1964"
}

# 9. Purwakarta
purwakarta_bd = {
    "KNS2026-60155713": "07/05/1971"
}

print(f"{'No':<3} | {'Nama ODS':<20} | {'Kont. Sah':<12} | {'Tgl Lhr Sah':<12} | {'Kont. Kun':<10} | {'Tgl Lhr Kun':<15} | {'Kesesuaian Tgl Lahir'}")
print("-" * 95)

for r in range(3, ws1.max_row + 1):
    no = ws1.cell(r, 1).value
    reg = ws1.cell(r, 2).value
    nama = ws1.cell(r, 3).value
    k_sah = ws1.cell(r, 6).value
    k_kun = ws1.cell(r, 12).value
    
    bd_sah = "-"
    if k_sah == "Depok": bd_sah = depok_bd.get(reg, "-")
    elif k_sah == "Bogor": bd_sah = bogor_bd.get(reg, ["-"])[0]
    elif k_sah == "KORMI & DIID": bd_sah = kormi_bd.get(reg, "-")
    elif k_sah == "Jakarta Timur": bd_sah = jaktim_bd.get(reg, ["-"])[0]
    elif k_sah == "Bekasi": bd_sah = bekasi_bd.get(nama.lower(), "-")
    elif k_sah == "Sumedang": bd_sah = sumedang_bd.get(nama.lower(), "-")
    elif k_sah == "Cimahi": bd_sah = cimahi_bd.get(reg, "-")
    
    bd_kun = "-"
    if k_kun == "Bogor":
        bd_kun_list = bogor_bd.get(reg, ["-"])
        bd_kun = " / ".join(bd_kun_list)
    elif k_kun == "Jakarta Timur":
        bd_kun_list = jaktim_bd.get(reg, ["-"])
        bd_kun = " / ".join(bd_kun_list)
    elif k_kun == "Jakarta Selatan": bd_kun = jaksel_bd.get(reg, "-")
    elif k_kun == "Purwakarta": bd_kun = purwakarta_bd.get(reg, "-")
    
    print(f"{no:<3} | {nama[:20]:<20} | {k_sah:<12} | {str(bd_sah)[:12]:<12} | {k_kun:<10} | {str(bd_kun)[:15]:<15} |")

