import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import re
import os

def clean_phone_strict(val):
    if val is None:
        return ''
    s = str(val).strip()
    digits = re.sub(r'\D', '', s)
    if not digits:
        return ''
    if digits.startswith('62'):
        digits = '0' + digits[2:]
    elif digits.startswith('8'):
        digits = '0' + digits
    return digits

def clean_text(val):
    if val is None:
        return ''
    s = str(val).replace('\xa0', ' ').strip()
    return re.sub(r'\s+', ' ', s)

all_petugas = []

# 1. Dinkes Kota Bogor
f1 = 'Data peserta/Data petugas gula darah/DATA PETUGAS DARI DINKES KOTA BOGOR.xlsx'
wb1 = openpyxl.load_workbook(f1)
ws1 = wb1['Sheet1']
for r in list(ws1.iter_rows(values_only=True))[1:]:
    if not any(r[:5]):
        continue
    nama = clean_text(r[1])
    instansi = clean_text(r[2])
    if instansi.lower() == 'dibas kesehatan':
        instansi = 'Dinas Kesehatan Kota Bogor'
    pekerjaan = clean_text(r[3])
    telp = clean_phone_strict(r[4])
    all_petugas.append({
        'nama': nama,
        'telp': telp,
        'instansi': instansi,
        'jabatan': pekerjaan,
        'wilayah': 'Kota Bogor',
        'sumber': 'Dinkes Kota Bogor'
    })

# 2. Puskesmas Kab. Bogor
f2 = 'Data peserta/Data petugas gula darah/DATA PETUGAS PUSKESMAS lengkap.xlsx'
wb2 = openpyxl.load_workbook(f2)
rayon_names = {
    'jasinga': 'Rayon Jasinga (Kab. Bogor)',
    'leuwiliang': 'Rayon Leuwiliang (Kab. Bogor)',
    'parung': 'Rayon Parung (Kab. Bogor)',
    'cibinong': 'Rayon Cibinong (Kab. Bogor)',
    'ciawi': 'Rayon Ciawi (Kab. Bogor)',
    'jonggol': 'Rayon Jonggol (Kab. Bogor)',
}

for sname in ['jasinga', 'leuwiliang', 'parung', 'cibinong', 'ciawi', 'jonggol']:
    ws = wb2[sname]
    rows = list(ws.iter_rows(values_only=True))
    current_pusk = ''
    for r in rows:
        if not any(r[:5]):
            continue
        if r[0] == 'DATA PETUGAS  PUSKESMAS PEMERIKSAAN GULA DARAH ' or r[0] == 'NO' or r[1] == 'PUSKESMAS':
            continue
        if r[1] is not None and str(r[1]).strip() != '':
            current_pusk = clean_text(r[1])
        nama = clean_text(r[2])
        jab = clean_text(r[3])
        telp = clean_phone_strict(r[4])
        
        # skip completely blank placeholder rows
        if not nama and not telp:
            continue
            
        all_petugas.append({
            'nama': nama,
            'telp': telp,
            'instansi': current_pusk,
            'jabatan': jab,
            'wilayah': rayon_names[sname],
            'sumber': 'Puskesmas Kab. Bogor'
        })

print(f"Total extracted petugas: {len(all_petugas)}")

# Create output workbook
out_wb = openpyxl.Workbook()
out_ws = out_wb.active
out_ws.title = "Petugas Gula Darah"

headers = [
    "No",
    "Nama Petugas",
    "No. Telepon",
    "Instansi / Puskesmas",
    "Jabatan / Profesi",
    "Wilayah / Rayon",
    "Sumber Data"
]
out_ws.append(headers)

# Styling definitions
header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

data_font = Font(name="Calibri", size=10, color="000000")
zebra_fill = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid")
white_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")

thin_border_side = Side(border_style="thin", color="D9D9D9")
thin_border = Border(
    left=thin_border_side,
    right=thin_border_side,
    top=thin_border_side,
    bottom=thin_border_side
)

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")

# Apply header styles
out_ws.row_dimensions[1].height = 28
for col_num in range(1, len(headers) + 1):
    cell = out_ws.cell(row=1, column=col_num)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_align
    cell.border = thin_border

# Write data rows
for idx, p in enumerate(all_petugas, start=1):
    row_num = idx + 1
    out_ws.row_dimensions[row_num].height = 20
    fill = zebra_fill if idx % 2 == 0 else white_fill
    
    # Cells
    c_no = out_ws.cell(row=row_num, column=1, value=idx)
    c_nama = out_ws.cell(row=row_num, column=2, value=p['nama'])
    
    # Store phone strictly as text to preserve leading zeros
    c_telp = out_ws.cell(row=row_num, column=3, value=p['telp'] if p['telp'] else "-")
    c_telp.number_format = '@'
    
    c_inst = out_ws.cell(row=row_num, column=4, value=p['instansi'])
    c_jab = out_ws.cell(row=row_num, column=5, value=p['jabatan'])
    c_wil = out_ws.cell(row=row_num, column=6, value=p['wilayah'])
    c_src = out_ws.cell(row=row_num, column=7, value=p['sumber'])
    
    # Alignments
    c_no.alignment = align_center
    c_nama.alignment = align_left
    c_telp.alignment = align_center
    c_inst.alignment = align_left
    c_jab.alignment = align_left
    c_wil.alignment = align_left
    c_src.alignment = align_center
    
    # Borders & Fills
    for col_num in range(1, len(headers) + 1):
        cell = out_ws.cell(row=row_num, column=col_num)
        cell.font = data_font
        cell.fill = fill
        cell.border = thin_border

# Freeze top row
out_ws.freeze_panes = "A2"

# Enable auto-filter
out_ws.auto_filter.ref = f"A1:G{len(all_petugas) + 1}"

# Set optimal column widths
for col in out_ws.columns:
    max_len = 0
    col_letter = get_column_letter(col[0].column)
    for cell in col:
        val_str = str(cell.value or '')
        if len(val_str) > max_len:
            max_len = len(val_str)
    out_ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

out_ws.column_dimensions['A'].width = 8
out_ws.column_dimensions['B'].width = 34
out_ws.column_dimensions['C'].width = 18
out_ws.column_dimensions['D'].width = 36
out_ws.column_dimensions['E'].width = 24
out_ws.column_dimensions['F'].width = 28
out_ws.column_dimensions['G'].width = 24

out_path = 'Data peserta/Data petugas gula darah/DATA_GABUNGAN_PETUGAS_GULA_DARAH.xlsx'
out_wb.save(out_path)
print(f"Successfully saved combined workbook to: {out_path}")

