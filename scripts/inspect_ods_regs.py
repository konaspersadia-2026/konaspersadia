import zipfile
import xml.etree.ElementTree as ET
from collections import Counter

with zipfile.ZipFile("Data peserta/Data pengambilan baju/Ambil_Baju_Data_Pendaftar_KONAS_PERSADIA.ods") as z:
    content = z.read("content.xml")

root = ET.fromstring(content)
ns_table = "urn:oasis:names:tc:opendocument:xmlns:table:1.0"
ns_text = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"

rows_data = []
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
            rows_data.append(row_cells)

print(f"Total rows in ODS: {len(rows_data)}")
header = rows_data[0]
print("ODS Header:", header[:15])

reg_col = -1
for i, h in enumerate(header):
    if "registrasi" in h.lower() or "no_reg" in h.lower():
        reg_col = i
        print(f"Found reg_col at {i}: {h}")
        break

if reg_col != -1:
    regs = [r[reg_col].strip() for r in rows_data[1:] if len(r) > reg_col and r[reg_col].strip()]
    counts = Counter(regs)
    print(f"Total non-empty regs: {len(regs)}")
    print(f"Total unique regs: {len(counts)}")
    dups = {k: v for k, v in counts.items() if v > 1}
    print(f"Duplicate regs in ODS: {len(dups)}")
    for k, v in list(dups.items())[:10]:
        print(f"  {k}: {v} times")

# Let's check the specific sample registration numbers:
sample_regs = ["KNS2026-11814453", "KNS2026-45756087", "KNS2026-88192252", "KNS2026-67497393", "KNS2026-42352636"]
print("\nChecking sample regs in ODS:")
for r in rows_data[1:]:
    if len(r) > reg_col:
        val = r[reg_col].strip()
        if val in sample_regs:
            print(f"  Found {val} in row: {r[:6]}")

