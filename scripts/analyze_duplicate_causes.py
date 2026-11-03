import openpyxl, re

wb = openpyxl.load_workbook("Data peserta/Data pengambilan baju/LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx", data_only=True)
ws1 = wb["Penyerahan Kaos Lintas Berkas"]

# Load audit notes from Bogor md, Jaktim md, Jaksel md, Purwakarta md
bogor_notes = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_BOGOR.md") as f:
    for line in f:
        if "`KNS2026-" in line and "|" in line:
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 12:
                reg = re.search(r"KNS2026-\d+", parts[7])
                if reg:
                    bogor_notes.setdefault(reg.group(0), []).append(parts[11])

jaktim_notes = {}
with open("Data peserta/Data pengambilan baju/DAFTAR_NO_REGISTRASI_PESERTA_JAKARTA_TIMUR.md") as f:
    for line in f:
        if "`KNS2026-" in line and "|" in line:
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 12:
                reg = re.search(r"KNS2026-\d+", parts[7])
                if reg:
                    jaktim_notes.setdefault(reg.group(0), []).append(parts[11])

print(f"{'No':<3} | {'Nama ODS':<22} | {'No Reg':<17} | {'Kont. Sah':<12} | {'Kont. Batal':<12} | {'No HP Sah':<15} | {'No HP Batal':<15} | {'Status HP':<10} | {'Catatan Audit'}")
print("-" * 130)

hp_sama_count = 0
hp_beda_count = 0

for r in range(3, ws1.max_row + 1):
    no = ws1.cell(r, 1).value
    reg = ws1.cell(r, 2).value
    nama = ws1.cell(r, 3).value
    k_sah = ws1.cell(r, 6).value
    hp_sah = str(ws1.cell(r, 8).value or "-").strip()
    k_kun = ws1.cell(r, 12).value
    hp_kun = str(ws1.cell(r, 14).value or "-").strip()
    
    clean_s = re.sub(r"[^\d]", "", hp_sah)
    clean_k = re.sub(r"[^\d]", "", hp_kun)
    if clean_s.startswith("62"): clean_s = "0" + clean_s[2:]
    if clean_k.startswith("62"): clean_k = "0" + clean_k[2:]
    if clean_s.startswith("8"): clean_s = "0" + clean_s
    if clean_k.startswith("8"): clean_k = "0" + clean_k
    
    same_hp = (clean_s == clean_k and clean_s != "")
    if same_hp:
        hp_sama_count += 1
        st_hp = "SAMA"
    else:
        hp_beda_count += 1
        st_hp = "BEDA"
        
    notes = bogor_notes.get(reg, []) + jaktim_notes.get(reg, [])
    note_str = " // ".join(notes[:1]) if notes else "-"
    
    print(f"{no:<3} | {nama[:22]:<22} | {reg:<17} | {k_sah:<12} | {k_kun:<12} | {hp_sah[:15]:<15} | {hp_kun[:15]:<15} | {st_hp:<10} | {note_str[:35]}")

print("-" * 130)
print(f"Total: {ws1.max_row - 2} peserta. HP SAMA: {hp_sama_count}, HP BEDA: {hp_beda_count}")

