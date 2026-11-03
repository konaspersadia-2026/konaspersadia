import openpyxl, re

def clean_reg(val):
    if not val:
        return ""
    m = re.search(r"KNS2026-\d+", str(val))
    return m.group(0) if m else str(val).strip("` ")

bogor_map = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_BOGOR.md") as f:
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
                    })

depok_map = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_DEPOK.md") as f:
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
                    })

kormi_map = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_KORMI_DIID.md") as f:
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
                    })

jaktim_map = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_TIMUR.md") as f:
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
                    })

bekasi_map = {
    "haryati": {"global_no": "349", "nama": "Haryati", "hp": "081 3 1 061 1 553", "unit": "PERSADIA Cabang Kota Bekasi"},
    "mulyanti": {"global_no": "201", "nama": "Mulyanti", "hp": "81282608490", "unit": "PERSADIA Cabang Kota Bekasi"},
    "ratmi": {"global_no": "7", "nama": "Ratmi", "hp": "85773240000", "unit": "PERSADIA Cabang Kota Bekasi"},
    "wiwik aryani": {"global_no": "332", "nama": "Wiwik Aryani", "hp": "81513956249", "unit": "PERSADIA Cabang Kota Bekasi"},
}

sumedang_map = {
    "maesaroh": {"global_no": "22", "nama": "Maesaroh", "hp": "081222189192", "unit": "PERSADIA Cabang Sumedang"},
    "oma rina": {"global_no": "69", "nama": "Oma Rina", "hp": "081222543500", "unit": "PERSADIA Cabang Sumedang"},
}

cimahi_map = {
    "KNS2026-18453451": [{"global_no": "57", "nama": "SUKAESIH", "hp": "085793694132", "unit": "PERSADIA Cabang Cimahi"}]
}

jaksel_map = {
    "KNS2026-56854302": [{"global_no": "49", "nama": "MIMI SOPIATI", "hp": "0813 8621 4460", "unit": "RS Prikasih"}],
    "KNS2026-90423191": [{"global_no": "30", "nama": "Suryati", "hp": "8129052865", "unit": "RS Fatmawati"}]
}

purwakarta_map = {
    "KNS2026-60155713": [{"global_no": "35", "nama": "Ita Juwita", "hp": "89684566789", "unit": "KLINIK FERREN"}]
}

wb = openpyxl.load_workbook("Data peserta/Data pengambilan baju/LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx", data_only=True)
ws = wb["Penyerahan Kaos Lintas Berkas"]

print(f"Total rows to verify: {ws.max_row - 1}")
for r in range(2, ws.max_row + 1):
    no = ws.cell(r, 1).value
    nama_ods = ws.cell(r, 2).value
    reg = clean_reg(ws.cell(r, 3).value)
    k_sah = ws.cell(r, 6).value
    k_kuning = ws.cell(r, 8).value
    
    info_sah = None
    if k_sah == "Bogor":
        info_sah = bogor_map.get(reg, [{}])[0]
    elif k_sah == "Depok":
        info_sah = depok_map.get(reg, [{}])[0]
    elif k_sah == "KORMI & DIID":
        info_sah = kormi_map.get(reg, [{}])[0]
    elif k_sah == "Jakarta Timur":
        info_sah = jaktim_map.get(reg, [{}])[0]
    elif k_sah == "Bekasi":
        info_sah = bekasi_map.get(nama_ods.lower())
    elif k_sah == "Sumedang":
        info_sah = sumedang_map.get(nama_ods.lower())
    elif k_sah == "Cimahi":
        info_sah = cimahi_map.get(reg, [{}])[0]
    
    info_kuning = None
    if k_kuning == "Bogor":
        info_kuning = bogor_map.get(reg, [{}])
    elif k_kuning == "Jakarta Timur":
        info_kuning = jaktim_map.get(reg, [{}])
    elif k_kuning == "Jakarta Selatan":
        info_kuning = jaksel_map.get(reg, [{}])
    elif k_kuning == "Purwakarta":
        info_kuning = purwakarta_map.get(reg, [{}])
    
    n_s = info_sah.get("nama", "?") if info_sah else "?"
    hp_s = info_sah.get("hp", "?") if info_sah else "?"
    u_s = info_sah.get("unit", "?") if info_sah else "?"
    
    k_items = []
    if isinstance(info_kuning, list):
        for x in info_kuning:
            nm = x.get("nama", "?")
            hp = x.get("hp", "?")
            un = x.get("unit", "?")
            k_items.append(f"{nm} | HP: {hp} | Unit: {un}")
    k_res = " // ".join(k_items)
    
    print(f"#{no:02d} [{reg}] SAH: {k_sah} -> {n_s} | {hp_s} | {u_s} <===> KUNING: {k_kuning} -> {k_res}")

