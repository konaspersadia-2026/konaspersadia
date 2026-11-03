import zipfile
import xml.etree.ElementTree as ET
import re
import openpyxl

# Load ODS
with zipfile.ZipFile("Data peserta/Data pengambilan baju/Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods") as z:
    content = z.read("content.xml")

root = ET.fromstring(content)
ns_table = "urn:oasis:names:tc:opendocument:xmlns:table:1.0"
ns_text = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"

rows_ods = []
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
            rows_ods.append(row_cells)

# Build phone lookup in ODS
def norm_phone(val):
    if not val: return ""
    d = re.sub(r"[^\d]", "", str(val))
    if d.startswith("62"): d = "0" + d[2:]
    elif d.startswith("8"): d = "0" + d
    return d

ods_phone_map = {}
for idx, r in enumerate(rows_ods[1:], 2):
    reg = r[0].strip()
    nama = r[2].strip()
    phone = norm_phone(r[5])
    cabang = r[14].strip() if len(r) > 14 else ""
    if phone:
        ods_phone_map.setdefault(phone, []).append((reg, nama, cabang, idx))
    # also store without leading zero
    if phone.startswith("0"):
        ods_phone_map.setdefault(phone[1:], []).append((reg, nama, cabang, idx))

wb = openpyxl.load_workbook("Data peserta/Data pengambilan baju/LAPORAN_DUPLIKASI_LINTAS_BERKAS_ANTAR_KONTINGEN.xlsx", data_only=True)
ws1 = wb["Penyerahan Kaos Lintas Berkas"]

print("=== CHECKING IF KUNING PARTICIPANTS ACTUALLY HAVE THEIR OWN SEPARATE REGISTRATION IN ODS ===")
found_own_reg = 0
not_found_own_reg = 0

for r in range(3, ws1.max_row + 1):
    no = ws1.cell(r, 1).value
    nama = ws1.cell(r, 3).value
    reg_assigned = ws1.cell(r, 2).value
    k_sah = ws1.cell(r, 6).value
    hp_sah = ws1.cell(r, 8).value
    k_kun = ws1.cell(r, 12).value
    nama_kun = ws1.cell(r, 13).value
    hp_kun = str(ws1.cell(r, 14).value or "")
    
    # Check if hp_kun exists in ODS
    clean_k = norm_phone(hp_kun)
    matches = ods_phone_map.get(clean_k, [])
    # Filter matches
    matches = list(set(matches))
    
    if matches:
        found_own_reg += 1
        m_regs = [m[0] for m in matches]
        if reg_assigned in m_regs:
            print(f"#{no:02d} {nama} -> HP Kuning SAMA dengan HP Sah ({reg_assigned}) -> Orang yang sama persis!")
        else:
            print(f"#{no:02d} {nama} (Kuning: {nama_kun}, HP: {hp_kun}) -> PUNYA NO REG SENDIRI DI ODS: {matches[0][0]} ({matches[0][1]} - {matches[0][2]})!")
    else:
        not_found_own_reg += 1
        print(f"#{no:02d} {nama} (Kuning: {nama_kun}, HP: {hp_kun}) -> HP TIDAK ADA DI ODS (Belum daftar online / typo)")

print(f"\nSummary: found_own_reg={found_own_reg}, not_found={not_found_own_reg}")

