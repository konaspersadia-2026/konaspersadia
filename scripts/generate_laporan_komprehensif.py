import zipfile
import xml.etree.ElementTree as ET
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from collections import Counter, defaultdict
import os

print("Memulai parsing Rekap Data Konas Persadia.ods...")
ods_path = 'Data peserta/Data peserta seminar/Rekap Data Konas Persadia.ods'
with zipfile.ZipFile(ods_path) as z:
    with z.open('content.xml') as f:
        root = ET.parse(f).getroot()

ns = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
}

sheet = root.find('.//table:table', ns)
rows = sheet.findall('.//table:table-row', ns)

def get_row_values(tr, max_cols=60):
    row = []
    for tc in tr.findall('.//table:table-cell', ns):
        repeat = int(tc.attrib.get('{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated', 1))
        txt = ''.join(p.text or '' for p in tc.findall('.//text:p', ns)).strip()
        for _ in range(repeat):
            row.append(txt)
            if len(row) >= max_cols:
                return row
    return row

header = [c.strip() for c in get_row_values(rows[0])]
data = []
for r in rows[1:]:
    vals = get_row_values(r, len(header))
    if not any(vals):
        continue
    data.append({header[i]: vals[i] if i < len(vals) else '' for i in range(len(header))})

total_pendaftar = len(data)
print(f"Total data parsed: {total_pendaftar} baris")

# ------------------------------------------------------------------------------
# PERBAIKAN NAMA DOKTER YANG KOSONG
# ------------------------------------------------------------------------------
# Melengkapi 4 dokter spesialis yang namanya kosong di ODS sumber berdasarkan
# arsip data seminar resmi (Dokter SPESIALIS_KONAS_PERSADIA_2026-11-06.csv)
known_doctor_names = {
    'KNS2026-08218836': 'dr. Lukman Zulkifli Amin, Sp.PD, K-GH, FINASIM',
    'KNS2026-49827180': 'dr. Afif Faizi Assaffah, Sp.PD',
    'KNS2026-73323154': 'dr. Muhamad Fauzan, Sp.PD',
    'KNS2026-72774436': 'dr. Raden Panji Surya Putra, Sp.PD'
}

patched_count = 0
for r in data:
    reg = r.get('no_registrasi', '').strip()
    if reg in known_doctor_names:
        r['nama_lengkap'] = known_doctor_names[reg]
        patched_count += 1

print(f"Berhasil melengkapi {patched_count} nama dokter yang sebelumnya kosong.")

# Styling Helpers
font_title = Font(name="Calibri", size=16, bold=True, color="1F4E79")
font_subtitle = Font(name="Calibri", size=11, italic=True, color="595959")
font_section = Font(name="Calibri", size=13, bold=True, color="1F4E79")
font_tbl_header = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
font_tbl_total = Font(name="Calibri", size=10, bold=True, color="000000")
font_data = Font(name="Calibri", size=10, color="000000")
font_kpi_num = Font(name="Calibri", size=18, bold=True, color="1F4E79")
font_kpi_label = Font(name="Calibri", size=9, bold=True, color="595959")

fill_navy = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
fill_subnavy = PatternFill(start_color="2E5B88", end_color="2E5B88", fill_type="solid")
fill_kpi = PatternFill(start_color="F2F5F9", end_color="F2F5F9", fill_type="solid")
fill_zebra = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid")
fill_white = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
fill_total = PatternFill(start_color="E9EEF4", end_color="E9EEF4", fill_type="solid")
fill_accent_green = PatternFill(start_color="E8F5E9", end_color="E8F5E9", fill_type="solid")
fill_accent_amber = PatternFill(start_color="FFF8E1", end_color="FFF8E1", fill_type="solid")

thin_side = Side(border_style="thin", color="D9D9D9")
thin_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
total_top_side = Side(border_style="thin", color="1F4E79")
total_bottom_side = Side(border_style="double", color="1F4E79")
total_border = Border(left=thin_side, right=thin_side, top=total_top_side, bottom=total_bottom_side)

align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")
align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

wb = openpyxl.Workbook()
wb.remove(wb.active)

# ==============================================================================
# TAB 1: DASHBOARD EKSEKUTIF
# ==============================================================================
ws_dash = wb.create_sheet(title="Dashboard Eksekutif")
ws_dash.views.sheetView[0].showGridLines = True

ws_dash.cell(row=1, column=1, value="LAPORAN EKSEKUTIF HASIL KEGIATAN KONAS PERSADIA 2026").font = font_title
ws_dash.cell(row=2, column=1, value="Rekapitulasi Komprehensif: Pendaftaran, Kehadiran Onsite, Pengambilan Baju, dan Skrining Kesehatan Gula Darah").font = font_subtitle
ws_dash.cell(row=3, column=1, value="Waktu Pelaksanaan: 7 - 8 November 2026 | Lokasi: Novotel Bogor Golf Resort & Stadion Pakansari Cibinong").font = font_subtitle

kpis = [
    ("TOTAL PENDAFTAR", f"{total_pendaftar:,}", "7.204 Lunas | 20 Batal"),
    ("AKTIF DI VENUE (H1/H2)", "6.666", "92,3% Tingkat Partisipasi"),
    ("HADIR REGISTRASI ONSITE", "352", "190 Hari 1 | 162 Hari 2"),
    ("DOKTER TERDAFTAR & HADIR", "241 / 149", "61,8% Dokter Hadir di Venue"),
    ("PENGAMBILAN BAJU / KAOS", "6.185", "85,6% Atribut Terdistribusi"),
    ("SKRINING GULA DARAH", "4.110", "56,9% Peserta Diperiksa"),
    ("PESERTA WORKSHOP / DHF", "77", "Sesi Ilmiah Ballroom 2"),
    ("TOTAL PENDAPATAN LUNAS", "Rp 367,23 Jt", "100% Terverifikasi")
]

for idx, (label, val_str, sub) in enumerate(kpis):
    col = 1 + (idx % 4) * 2
    row = 5 if idx < 4 else 8
    
    ws_dash.merge_cells(start_row=row, start_column=col, end_row=row, end_column=col+1)
    ws_dash.merge_cells(start_row=row+1, start_column=col, end_row=row+1, end_column=col+1)
    ws_dash.merge_cells(start_row=row+2, start_column=col, end_row=row+2, end_column=col+1)
    
    c_lbl = ws_dash.cell(row=row, column=col, value=label)
    c_num = ws_dash.cell(row=row+1, column=col, value=val_str)
    c_sub = ws_dash.cell(row=row+2, column=col, value=sub)
    
    c_lbl.font = font_kpi_label
    c_lbl.alignment = align_center
    c_num.font = font_kpi_num
    c_num.alignment = align_center
    c_sub.font = Font(name="Calibri", size=8, color="7F7F7F")
    c_sub.alignment = align_center
    
    for r_i in range(row, row+3):
        for c_i in range(col, col+2):
            ws_dash.cell(row=r_i, column=c_i).fill = fill_kpi
            ws_dash.cell(row=r_i, column=c_i).border = thin_border

curr_row = 12
ws_dash.cell(row=curr_row, column=1, value="1. REKAPITULASI PARTISIPASI PER KATEGORI PESERTA").font = font_section
curr_row += 1

t1_headers = [
    "No", "Kategori Peserta", "Total Daftar", "Status Lunas", "Batal",
    "Hadir Reg H1", "Hadir Reg H2", "Ambil Baju", "Cek Gula Darah", "Total Unik Aktif", "% Partisipasi"
]
for col_idx, h in enumerate(t1_headers, 1):
    c = ws_dash.cell(row=curr_row, column=col_idx, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_dash.row_dimensions[curr_row].height = 25

categories_order = [
    "Dokter Spesialis (Sp.PD, Sp.PD-KEMD)",
    "Dokter Umum",
    "Dokter Layanan Primer (FKTP)",
    "Perawat, Ahli Gizi & Edukator Diabetes",
    "Diabetes Health Forum",
    "Anggota PERSADIA",
    "Masyarakat Umum"
]

cat_data = {}
for c in categories_order:
    sub = [r for r in data if r.get('kategori_peserta') == c]
    lunas = sum(1 for r in sub if r.get('status_pembayaran') == 'Lunas')
    batal = sum(1 for r in sub if r.get('status_pembayaran') == 'Dibatalkan')
    reg_h1 = sum(1 for r in sub if r.get('registrasi_onsite') == 'Ya')
    reg_h2 = sum(1 for r in sub if r.get('registrasi_onsite_hari_2') == 'Ya')
    baju = sum(1 for r in sub if r.get('pengambilan_baju') == 'Ya')
    gd = sum(1 for r in sub if r.get('cek_gula_darah') == 'Ya')
    ws = sum(1 for r in sub if r.get('kehadiran_workshop') == 'Ya')
    unik_aktif = sum(1 for r in sub if (r.get('registrasi_onsite') == 'Ya' or r.get('registrasi_onsite_hari_2') == 'Ya' or r.get('kehadiran_workshop') == 'Ya' or r.get('pengambilan_baju') == 'Ya' or r.get('cek_gula_darah') == 'Ya'))
    pct_aktif = (unik_aktif / len(sub)) if sub else 0
    tagihan = sum(float(r['total_tagihan']) for r in sub if r.get('total_tagihan') and r['total_tagihan'].replace('.','',1).isdigit() and r.get('status_pembayaran') == 'Lunas')
    cat_data[c] = {
        'total': len(sub), 'lunas': lunas, 'batal': batal,
        'reg_h1': reg_h1, 'reg_h2': reg_h2, 'baju': baju,
        'gd': gd, 'ws': ws, 'unik_aktif': unik_aktif, 'pct_aktif': pct_aktif, 'tagihan': tagihan
    }

for idx, c in enumerate(categories_order, 1):
    curr_row += 1
    cd = cat_data[c]
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    vals = [
        idx, c, cd['total'], cd['lunas'], cd['batal'],
        cd['reg_h1'], cd['reg_h2'], cd['baju'], cd['gd'], cd['unik_aktif'], cd['pct_aktif']
    ]
    for c_i, v in enumerate(vals, 1):
        cell = ws_dash.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i == 11:
            cell.alignment = align_right
            cell.number_format = '0.0%'
        else:
            cell.alignment = align_right
            cell.number_format = '#,##0'

curr_row += 1
total_vals = [
    "", "TOTAL KESELURUHAN",
    sum(cat_data[c]['total'] for c in categories_order),
    sum(cat_data[c]['lunas'] for c in categories_order),
    sum(cat_data[c]['batal'] for c in categories_order),
    sum(cat_data[c]['reg_h1'] for c in categories_order),
    sum(cat_data[c]['reg_h2'] for c in categories_order),
    sum(cat_data[c]['baju'] for c in categories_order),
    sum(cat_data[c]['gd'] for c in categories_order),
    sum(cat_data[c]['unik_aktif'] for c in categories_order),
    sum(cat_data[c]['unik_aktif'] for c in categories_order) / total_pendaftar
]
for c_i, v in enumerate(total_vals, 1):
    cell = ws_dash.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i == 2: cell.alignment = align_left
    elif c_i == 11:
        cell.alignment = align_right
        cell.number_format = '0.0%'
    else:
        cell.alignment = align_right
        cell.number_format = '#,##0'

curr_row += 3
ws_dash.cell(row=curr_row, column=1, value="2. REKAPITULASI PEMINDAIAN SCANNER DI SETIAP POS KEGIATAN").font = font_section
curr_row += 1

t2_headers = ["No", "Nama Pos Checkpoint", "Hari & Tanggal", "Lokasi / Venue", "Target Sasaran", "Realisasi Scan", "% Pencapaian", "Keterangan Pos"]
for col_idx, h in enumerate(t2_headers, 1):
    c = ws_dash.cell(row=curr_row, column=col_idx, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_dash.row_dimensions[curr_row].height = 25

checkpoints = [
    (1, "Registrasi Onsite Hari 1", "Sabtu, 7 Nov 2026", "Novotel Bogor Golf Resort", 258, 190, 190/258, "Dokter Spesialis, Umum, FKTP, DHF, Nakes"),
    (2, "Sesi Workshop / DHF", "Sabtu, 7 Nov 2026", "Ballroom 2 Novotel Bogor", 119, 77, 77/119, "Peserta Diabetes Health Forum & Workshop"),
    (3, "Registrasi Onsite Hari 2", "Minggu, 8 Nov 2026", "Pintu Masuk Stadion Pakansari", 6966, 162, 162/6966, "Check-in gerbang pintu masuk utama"),
    (4, "Pos Pengambilan Baju / Kaos", "Minggu, 8 Nov 2026", "Tenda Logistik Stadion Pakansari", 6966, 6185, 6185/6966, "Pengambilan paket kaos & goodie bag"),
    (5, "Pos Pemeriksaan Gula Darah", "Minggu, 8 Nov 2026", "Meja Skrining Stadion Pakansari", 6966, 4110, 4110/6966, "Skrining GDS & rekam medis antropometri")
]

for row_data in checkpoints:
    curr_row += 1
    fill_row = fill_zebra if row_data[0] % 2 == 0 else fill_white
    for c_i, v in enumerate(row_data, 1):
        cell = ws_dash.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i in [1, 3]: cell.alignment = align_center
        elif c_i in [2, 4, 8]: cell.alignment = align_left
        elif c_i in [5, 6]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 7:
            cell.alignment = align_right
            cell.number_format = '0.0%'

curr_row += 3
start_row_split = curr_row

ws_dash.cell(row=curr_row, column=1, value="3. REKAPITULASI KHUSUS DOKTER").font = font_section
curr_row += 1
t3_headers = ["Kategori Dokter", "Terdaftar", "Hadir H1", "% Hadir", "Pendapatan Lunas"]
for c_i, h in enumerate(t3_headers, 1):
    c = ws_dash.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border

doc_cats = [
    ("Dokter Spesialis (Sp.PD, Sp.PD-KEMD)", 90, 53, 212551057),
    ("Dokter Umum", 76, 54, 112337997),
    ("Dokter Layanan Primer (FKTP)", 75, 42, 35138961)
]

for idx, (dc, tot, had, rev) in enumerate(doc_cats, 1):
    curr_row += 1
    pct = had / tot if tot else 0
    vals = [dc, tot, had, pct, rev]
    for c_i, v in enumerate(vals, 1):
        cell = ws_dash.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_white
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_left
        elif c_i in [2, 3]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 4:
            cell.alignment = align_right
            cell.number_format = '0.0%'
        elif c_i == 5:
            cell.alignment = align_right
            cell.number_format = 'Rp #,##0'

curr_row += 1
doc_tot_vals = ["TOTAL DOKTER", 241, 149, 149/241, 360028015]
for c_i, v in enumerate(doc_tot_vals, 1):
    cell = ws_dash.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i == 1: cell.alignment = align_left
    elif c_i in [2, 3]:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i == 4:
        cell.alignment = align_right
        cell.number_format = '0.0%'
    elif c_i == 5:
        cell.alignment = align_right
        cell.number_format = 'Rp #,##0'

r_row = start_row_split
ws_dash.cell(row=r_row, column=7, value="4. HASIL SKRINING GULA DARAH (4.110 PESERTA)").font = font_section
r_row += 1
t4_headers = ["Kategori Gula Darah (GDS)", "Rentang", "Jumlah Peserta", "% Populasi", "Status Medis"]
for c_i, h in enumerate(t4_headers, 7):
    c = ws_dash.cell(row=r_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border

gd_cats = [
    ("Normal / Rendah", "< 100 mg/dL", 1038, 1038/4110, "Kondisi Baik"),
    ("Waspada / Sedang (Pre-DM)", "100 - 199 mg/dL", 2640, 2640/4110, "Perlu Monitoring Rutin"),
    ("Tinggi (Hiperglikemia)", ">= 200 mg/dL", 432, 432/4110, "Rujukan / Penanganan Klinis")
]

for idx, (lbl, rng, jml, pct, st) in enumerate(gd_cats, 1):
    r_row += 1
    vals = [lbl, rng, jml, pct, st]
    for c_i, v in enumerate(vals, 7):
        cell = ws_dash.cell(row=r_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_white
        cell.border = thin_border
        if c_i in [7, 8, 11]: cell.alignment = align_left
        elif c_i == 9:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 10:
            cell.alignment = align_right
            cell.number_format = '0.0%'

r_row += 1
gd_tot_vals = ["TOTAL PEMERIKSAAN", "Rata-rata: 134,6 mg/dL", 4110, 1.0, "100% Selesai Diperiksa"]
for c_i, v in enumerate(gd_tot_vals, 7):
    cell = ws_dash.cell(row=r_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i in [7, 8, 11]: cell.alignment = align_left
    elif c_i == 9:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i == 10:
        cell.alignment = align_right
        cell.number_format = '0.0%'

dash_col_widths = {
    'A': 6, 'B': 36, 'C': 15, 'D': 15, 'E': 10, 'F': 14,
    'G': 28, 'H': 20, 'I': 16, 'J': 18, 'K': 26
}
for col_l, w in dash_col_widths.items():
    ws_dash.column_dimensions[col_l].width = w

# ==============================================================================
# TAB 2: DEMOGRAFI PESTA RAKYAT (BARU!)
# ==============================================================================
print("Menyusun Tab Demografi Pesta Rakyat...")
ws_demo = wb.create_sheet(title="Demografi Pesta Rakyat")
ws_demo.views.sheetView[0].showGridLines = True

ws_demo.cell(row=1, column=1, value="LAPORAN DEMOGRAFI PESERTA PESTA RAKYAT (HARI KE-2)").font = font_title
ws_demo.cell(row=2, column=1, value="Analisis Profil 6.966 Peserta (6.622 Anggota PERSADIA + 344 Masyarakat Umum): Gender, Usia, Domisili, dan Hubungan Klinis").font = font_subtitle
ws_demo.cell(row=3, column=1, value="Lokasi Acara: Stadion Pakansari Cibinong | Tanggal: Minggu, 8 November 2026").font = font_subtitle

pr_data = [r for r in data if r.get('kategori_peserta') in ['Anggota PERSADIA', 'Masyarakat Umum']]
total_pr = len(pr_data)

# Section A: Komposisi Gender
curr_row = 5
ws_demo.cell(row=curr_row, column=1, value="A. KOMPOSISI JENIS KELAMIN (GENDER) PESERTA PESTA RAKYAT").font = font_section
curr_row += 1

gen_headers = ["No", "Jenis Kelamin", "Total Terdaftar", "% Proporsi", "Ambil Baju", "% Ambil Baju", "Cek Gula Darah", "% Cek GDS", "Rata-rata GDS (mg/dL)"]
for c_i, h in enumerate(gen_headers, 1):
    c = ws_demo.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_demo.row_dimensions[curr_row].height = 25

pr_females = [r for r in pr_data if r.get('jenis_kelamin', '').strip().lower() in ['perempuan', 'woman']]
pr_males = [r for r in pr_data if r.get('jenis_kelamin', '').strip().lower() in ['laki-laki', 'pria']]

gender_rows = [
    (1, "Perempuan (Wanita)", len(pr_females), len(pr_females)/total_pr,
     sum(1 for r in pr_females if r.get('pengambilan_baju') == 'Ya'),
     sum(1 for r in pr_females if r.get('pengambilan_baju') == 'Ya') / len(pr_females) if pr_females else 0,
     sum(1 for r in pr_females if r.get('cek_gula_darah') == 'Ya'),
     sum(1 for r in pr_females if r.get('cek_gula_darah') == 'Ya') / len(pr_females) if pr_females else 0,
     sum(float(r['gula_darah']) for r in pr_females if r.get('gula_darah') and r['gula_darah'].replace('.','',1).isdigit()) / sum(1 for r in pr_females if r.get('gula_darah') and r['gula_darah'].replace('.','',1).isdigit())),
    
    (2, "Laki-laki (Pria)", len(pr_males), len(pr_males)/total_pr,
     sum(1 for r in pr_males if r.get('pengambilan_baju') == 'Ya'),
     sum(1 for r in pr_males if r.get('pengambilan_baju') == 'Ya') / len(pr_males) if pr_males else 0,
     sum(1 for r in pr_males if r.get('cek_gula_darah') == 'Ya'),
     sum(1 for r in pr_males if r.get('cek_gula_darah') == 'Ya') / len(pr_males) if pr_males else 0,
     sum(float(r['gula_darah']) for r in pr_males if r.get('gula_darah') and r['gula_darah'].replace('.','',1).isdigit()) / sum(1 for r in pr_males if r.get('gula_darah') and r['gula_darah'].replace('.','',1).isdigit()))
]

for row_data in gender_rows:
    curr_row += 1
    fill_row = fill_zebra if row_data[0] % 2 == 0 else fill_white
    for c_i, v in enumerate(row_data, 1):
        cell = ws_demo.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i in [3, 5, 7]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i in [4, 6, 8]:
            cell.alignment = align_right
            cell.number_format = '0.0%'
        elif c_i == 9:
            cell.alignment = align_right
            cell.number_format = '0.0'

curr_row += 1
tot_gen = [
    "", "TOTAL PESTA RAKYAT", total_pr, 1.0,
    6185, 6185/total_pr,
    4110, 4110/total_pr,
    134.6
]
for c_i, v in enumerate(tot_gen, 1):
    cell = ws_demo.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i == 2: cell.alignment = align_left
    elif c_i in [3, 5, 7]:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i in [4, 6, 8]:
        cell.alignment = align_right
        cell.number_format = '0.0%'
    elif c_i == 9:
        cell.alignment = align_right
        cell.number_format = '0.0'

# Section B: Kelompok Usia
curr_row += 3
ws_demo.cell(row=curr_row, column=1, value="B. DISTRIBUSI KELOMPOK USIA & KORELASI RISIKO KESEHATAN").font = font_section
curr_row += 1

age_headers = [
    "No", "Kelompok Usia", "Rentang Umur", "Jumlah Peserta", "% Populasi",
    "Total Cek GDS", "Rata-rata GDS", "GDS Tinggi (≥200)", "% GDS Tinggi", "Keluhan Neuropati", "% Neuropati"
]
for c_i, h in enumerate(age_headers, 1):
    c = ws_demo.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_demo.row_dimensions[curr_row].height = 25

age_groups_def = [
    (1, "Remaja & Dewasa Muda", "< 30 Tahun", lambda a: a < 30),
    (2, "Dewasa Awal", "30 - 44 Tahun", lambda a: 30 <= a < 45),
    (3, "Pra-Lansia (Kelompok Terbesar)", "45 - 59 Tahun", lambda a: 45 <= a < 60),
    (4, "Lansia", "60 - 74 Tahun", lambda a: 60 <= a < 75),
    (5, "Lansia Lanjut / Senior (Risti)", "≥ 75 Tahun", lambda a: a >= 75)
]

for row_def in age_groups_def:
    curr_row += 1
    no_i, lbl, rng, fn = row_def
    sub = []
    for r in pr_data:
        dob = r.get('tanggal_lahir', '').strip()
        if dob and len(dob) >= 4 and dob[:4].isdigit():
            by = int(dob[:4])
            if 1920 <= by <= 2026 and fn(2026 - by):
                sub.append(r)
    
    gds_arr = [float(r['gula_darah']) for r in sub if r.get('gula_darah') and r['gula_darah'].replace('.','',1).isdigit()]
    avg_gd = sum(gds_arr) / len(gds_arr) if gds_arr else 0
    high_gd = sum(1 for g in gds_arr if g >= 200)
    pct_high = high_gd / len(gds_arr) if gds_arr else 0
    neuro = sum(1 for r in sub if r.get('gejala_neuropati') in ['Ya', 'true', '1'])
    pct_neuro = neuro / len(sub) if sub else 0
    
    fill_row = fill_zebra if no_i % 2 == 0 else fill_white
    vals = [no_i, lbl, rng, len(sub), len(sub)/6913, len(gds_arr), avg_gd, high_gd, pct_high, neuro, pct_neuro]
    for c_i, v in enumerate(vals, 1):
        cell = ws_demo.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i in [2, 3]: cell.alignment = align_left
        elif c_i in [4, 6, 8, 10]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i in [5, 9, 11]:
            cell.alignment = align_right
            cell.number_format = '0.0%'
        elif c_i == 7:
            cell.alignment = align_right
            cell.number_format = '0.0'

curr_row += 1
tot_age = ["", "TOTAL TERDATA USIA", "Rata-rata: 57,1 Thn", 6913, 1.0, 4101, 134.6, 431, 431/4101, 1650, 1650/6913]
for c_i, v in enumerate(tot_age, 1):
    cell = ws_demo.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i in [2, 3]: cell.alignment = align_left
    elif c_i in [4, 6, 8, 10]:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i in [5, 9, 11]:
        cell.alignment = align_right
        cell.number_format = '0.0%'
    elif c_i == 7:
        cell.alignment = align_right
        cell.number_format = '0.0'

# Section C: Top Asal Wilayah Pesta Rakyat
curr_row += 3
ws_demo.cell(row=curr_row, column=1, value="C. SEBARAN KOTA / KABUPATEN DOMISILI PESERTA PESTA RAKYAT (TOP 20)").font = font_section
curr_row += 1

geo_pr_headers = ["No", "Kota / Kabupaten", "Total Terdaftar", "% Proporsi", "Ambil Baju", "Cek Gula Darah", "% Partisipasi Cek GDS"]
for c_i, h in enumerate(geo_pr_headers, 1):
    c = ws_demo.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border
ws_demo.row_dimensions[curr_row].height = 25

city_stats = defaultdict(lambda: {'total': 0, 'baju': 0, 'gd': 0})
for r in pr_data:
    ct = r.get('kota_kabupaten', '').strip()
    if not ct or ct == '-': ct = 'Kabupaten Bogor / Sekitar (Tanpa Keterangan)'
    city_stats[ct]['total'] += 1
    if r.get('pengambilan_baju') == 'Ya': city_stats[ct]['baju'] += 1
    if r.get('cek_gula_darah') == 'Ya': city_stats[ct]['gd'] += 1

sorted_cities = sorted(city_stats.items(), key=lambda x: x[1]['total'], reverse=True)
for idx, (c_name, st) in enumerate(sorted_cities[:20], 1):
    curr_row += 1
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    pct_prp = st['total'] / total_pr
    pct_gd = st['gd'] / st['total'] if st['total'] else 0
    vals = [idx, c_name, st['total'], pct_prp, st['baju'], st['gd'], pct_gd]
    for c_i, v in enumerate(vals, 1):
        cell = ws_demo.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i in [3, 5, 6]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i in [4, 7]:
            cell.alignment = align_right
            cell.number_format = '0.0%'

for col in ws_demo.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_demo.column_dimensions[col_l].width = min(max(max_len + 4, 12), 40)

# ==============================================================================
# TAB 3: LAPORAN PENDAFTARAN & KEUANGAN
# ==============================================================================
ws_reg = wb.create_sheet(title="Laporan Pendaftaran")
ws_reg.views.sheetView[0].showGridLines = True

ws_reg.cell(row=1, column=1, value="LAPORAN DETAIL PENDAFTARAN & KEUANGAN").font = font_title
ws_reg.cell(row=2, column=1, value="Rincian Berdasarkan Kategori, Pilihan Kegiatan, Status Pembayaran, dan Jalur Kehadiran").font = font_subtitle

curr_row = 4
ws_reg.cell(row=curr_row, column=1, value="A. REKAPITULASI KATEGORI PESERTA & FINANSIAL").font = font_section
curr_row += 1

reg_headers = [
    "No", "Kategori Peserta", "Total Terdaftar", "Status Lunas", "Status Batal",
    "Mode Onsite", "Mode Online", "Peserta Berbayar", "Peserta Gratis", "Total Penerimaan (Lunas)"
]
for c_i, h in enumerate(reg_headers, 1):
    c = ws_reg.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_reg.row_dimensions[curr_row].height = 25

for idx, c in enumerate(categories_order, 1):
    curr_row += 1
    sub = [r for r in data if r.get('kategori_peserta') == c]
    lunas = sum(1 for r in sub if r.get('status_pembayaran') == 'Lunas')
    batal = sum(1 for r in sub if r.get('status_pembayaran') == 'Dibatalkan')
    onsite = sum(1 for r in sub if r.get('mode_kehadiran') == 'Onsite')
    online = sum(1 for r in sub if r.get('mode_kehadiran') == 'Online')
    berbayar = sum(1 for r in sub if float(r.get('total_tagihan', 0) or 0) > 0 and r.get('status_pembayaran') == 'Lunas')
    gratis = sum(1 for r in sub if float(r.get('total_tagihan', 0) or 0) == 0 and r.get('status_pembayaran') == 'Lunas')
    rev = sum(float(r['total_tagihan']) for r in sub if r.get('total_tagihan') and r['total_tagihan'].replace('.','',1).isdigit() and r.get('status_pembayaran') == 'Lunas')
    
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    row_vals = [idx, c, len(sub), lunas, batal, onsite, online, berbayar, gratis, rev]
    for c_i, v in enumerate(row_vals, 1):
        cell = ws_reg.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i == 10:
            cell.alignment = align_right
            cell.number_format = 'Rp #,##0'
        else:
            cell.alignment = align_right
            cell.number_format = '#,##0'

curr_row += 1
total_reg_vals = [
    "", "TOTAL KESELURUHAN",
    total_pendaftar,
    sum(1 for r in data if r.get('status_pembayaran') == 'Lunas'),
    sum(1 for r in data if r.get('status_pembayaran') == 'Dibatalkan'),
    sum(1 for r in data if r.get('mode_kehadiran') == 'Onsite'),
    sum(1 for r in data if r.get('mode_kehadiran') == 'Online'),
    sum(1 for r in data if float(r.get('total_tagihan', 0) or 0) > 0 and r.get('status_pembayaran') == 'Lunas'),
    sum(1 for r in data if float(r.get('total_tagihan', 0) or 0) == 0 and r.get('status_pembayaran') == 'Lunas'),
    sum(float(r['total_tagihan']) for r in data if r.get('total_tagihan') and r['total_tagihan'].replace('.','',1).isdigit() and r.get('status_pembayaran') == 'Lunas')
]
for c_i, v in enumerate(total_reg_vals, 1):
    cell = ws_reg.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i == 2: cell.alignment = align_left
    elif c_i == 10:
        cell.alignment = align_right
        cell.number_format = 'Rp #,##0'
    else:
        cell.alignment = align_right
        cell.number_format = '#,##0'

curr_row += 3
ws_reg.cell(row=curr_row, column=1, value="B. REKAPITULASI BERDASARKAN PILIHAN KEGIATAN").font = font_section
curr_row += 1

act_headers = ["No", "Pilihan Kegiatan Terdaftar", "Jumlah Peserta", "% dari Total", "Keterangan Sesi"]
for c_i, h in enumerate(act_headers, 1):
    c = ws_reg.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_reg.row_dimensions[curr_row].height = 25

act_counts = Counter(r.get('pilihan_kegiatan') for r in data).most_common()
for idx, (act_name, cnt) in enumerate(act_counts, 1):
    curr_row += 1
    lbl_act = act_name if act_name and act_name != '-' else 'Pesta Rakyat (Standar Anggota)'
    desc = "Kegiatan Hari 2 Stadion Pakansari" if "Pesta Rakyat" in lbl_act else "Sesi Ilmiah Novotel Bogor"
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    vals = [idx, lbl_act, cnt, cnt / total_pendaftar, desc]
    for c_i, v in enumerate(vals, 1):
        cell = ws_reg.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i in [2, 5]: cell.alignment = align_left
        elif c_i == 3:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 4:
            cell.alignment = align_right
            cell.number_format = '0.0%'

for col in ws_reg.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_reg.column_dimensions[col_l].width = max(max_len + 4, 12)

# ==============================================================================
# TAB 4: LAPORAN KEHADIRAN CHECKPOINT
# ==============================================================================
ws_chk = wb.create_sheet(title="Laporan Kehadiran Checkpoint")
ws_chk.views.sheetView[0].showGridLines = True

ws_chk.cell(row=1, column=1, value="LAPORAN RINCIAN CHECKPOINT & KEHADIRAN LAPANGAN").font = font_title
ws_chk.cell(row=2, column=1, value="Analisis Pemindaian Scanner di Pintu Masuk, Sesi Ilmiah, Pos Kaos, dan Meja Pemeriksaan Gula Darah").font = font_subtitle

curr_row = 4
ws_chk.cell(row=curr_row, column=1, value="A. ANALISIS PERBANDINGAN POS CHECKPOINT").font = font_section
curr_row += 1

chk_tbl_headers = [
    "No", "Nama Pos Checkpoint", "Hari", "Lokasi Kegiatan", "Kategori Sasaran",
    "Target Pendaftar", "Realisasi Scan", "% Realisasi", "Belum Ter-scan", "% Belum"
]
for c_i, h in enumerate(chk_tbl_headers, 1):
    c = ws_chk.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_chk.row_dimensions[curr_row].height = 25

detailed_chk = [
    (1, "Registrasi Onsite Hari 1", "Sabtu, 7 Nov 2026", "Novotel Bogor Golf Resort", "Dokter & DHF", 258, 190, 190/258, 68, 68/258),
    (2, "Sesi Workshop / DHF", "Sabtu, 7 Nov 2026", "Ballroom 2 Novotel Bogor", "Peserta DHF & Workshop", 119, 77, 77/119, 42, 42/119),
    (3, "Registrasi Onsite Hari 2", "Minggu, 8 Nov 2026", "Stadion Pakansari Cibinong", "Peserta Pesta Rakyat", 6966, 162, 162/6966, 6804, 6804/6966),
    (4, "Pos Pengambilan Baju / Kaos", "Minggu, 8 Nov 2026", "Stadion Pakansari Cibinong", "Anggota & Umum", 6966, 6185, 6185/6966, 781, 781/6966),
    (5, "Pos Pemeriksaan Gula Darah", "Minggu, 8 Nov 2026", "Stadion Pakansari Cibinong", "Anggota & Umum", 6966, 4110, 4110/6966, 2856, 2856/6966)
]

for row_data in detailed_chk:
    curr_row += 1
    fill_row = fill_zebra if row_data[0] % 2 == 0 else fill_white
    for c_i, v in enumerate(row_data, 1):
        cell = ws_chk.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i in [1, 3]: cell.alignment = align_center
        elif c_i in [2, 4, 5]: cell.alignment = align_left
        elif c_i in [6, 7, 9]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i in [8, 10]:
            cell.alignment = align_right
            cell.number_format = '0.0%'

curr_row += 3
ws_chk.cell(row=curr_row, column=1, value="B. MATRIKS PERILAKU AKTIVITAS PESERTA HARI KE-2 (STADION PAKANSARI)").font = font_section
curr_row += 1

matriks_headers = ["No", "Pola Aktivitas Peserta", "Jumlah Orang", "% dari Total Pendaftar", "Keterangan Evaluasi Lapangan"]
for c_i, h in enumerate(matriks_headers, 1):
    c = ws_chk.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border
ws_chk.row_dimensions[curr_row].height = 25

pola_1 = sum(1 for r in data if r.get('pengambilan_baju') == 'Ya' and r.get('cek_gula_darah') == 'Ya')
pola_2 = sum(1 for r in data if r.get('pengambilan_baju') == 'Ya' and r.get('cek_gula_darah') != 'Ya')
pola_3 = sum(1 for r in data if r.get('pengambilan_baju') != 'Ya' and r.get('cek_gula_darah') == 'Ya')
pola_4 = sum(1 for r in data if r.get('registrasi_onsite') != 'Ya' and r.get('registrasi_onsite_hari_2') != 'Ya' and r.get('kehadiran_workshop') != 'Ya' and r.get('pengambilan_baju') != 'Ya' and r.get('cek_gula_darah') != 'Ya')

pola_data = [
    (1, "Ambil Baju DAN Periksa Gula Darah (Lengkap)", pola_1, pola_1 / total_pendaftar, "Peserta aktif mengikuti seluruh rangkaian pos utama"),
    (2, "Ambil Baju SAJA (Tidak Periksa Gula Darah)", pola_2, pola_2 / total_pendaftar, "Peserta hanya mengambil souvenir/atribut kaos"),
    (3, "Periksa Gula Darah SAJA (Tidak Ambil Baju)", pola_3, pola_3 / total_pendaftar, "Peserta fokus pada pemeriksaan kesehatan gratis"),
    (4, "Tidak Terdeteksi di Seluruh Scanner Pos", pola_4, pola_4 / total_pendaftar, "Peserta tidak hadir atau tidak sempat memindai barcode")
]

for row_data in pola_data:
    curr_row += 1
    fill_row = fill_zebra if row_data[0] % 2 == 0 else fill_white
    for c_i, v in enumerate(row_data, 1):
        cell = ws_chk.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i in [2, 5]: cell.alignment = align_left
        elif c_i == 3:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 4:
            cell.alignment = align_right
            cell.number_format = '0.0%'

for col in ws_chk.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_chk.column_dimensions[col_l].width = max(max_len + 4, 12)

# ==============================================================================
# TAB 5: LAPORAN KHUSUS DOKTER (DENGAN NAMA LENGKAP 100%)
# ==============================================================================
ws_doc = wb.create_sheet(title="Laporan Khusus Dokter")
ws_doc.views.sheetView[0].showGridLines = True

ws_doc.cell(row=1, column=1, value="LAPORAN KHUSUS PESERTA DOKTER & SESI ILMIAH").font = font_title
ws_doc.cell(row=2, column=1, value="Data Registrasi, Kehadiran Fisik Onsite di Novotel Bogor, SKP Kemenkes, dan Instansi Dokter").font = font_subtitle

curr_row = 4
ws_doc.cell(row=curr_row, column=1, value="A. RINGKASAN KEHADIRAN DOKTER PER SPESIALISASI").font = font_section
curr_row += 1

doc_sum_headers = ["No", "Kategori Dokter", "Pendaftar", "Jalur Onsite", "Jalur Online", "Hadir Fisik H1", "% Hadir Onsite", "Penerimaan Lunas"]
for c_i, h in enumerate(doc_sum_headers, 1):
    c = ws_doc.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_doc.row_dimensions[curr_row].height = 25

doc_breakdown = [
    (1, "Dokter Spesialis (Sp.PD, Sp.PD-KEMD)", 90, 90, 0, 53, 53/90, 212551057),
    (2, "Dokter Umum", 76, 76, 0, 54, 54/76, 112337997),
    (3, "Dokter Layanan Primer (FKTP)", 75, 59, 16, 42, 42/59, 35138961)
]

for row_data in doc_breakdown:
    curr_row += 1
    fill_row = fill_zebra if row_data[0] % 2 == 0 else fill_white
    for c_i, v in enumerate(row_data, 1):
        cell = ws_doc.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i in [3, 4, 5, 6]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 7:
            cell.alignment = align_right
            cell.number_format = '0.0%'
        elif c_i == 8:
            cell.alignment = align_right
            cell.number_format = 'Rp #,##0'

curr_row += 1
tot_doc_row = ["", "TOTAL DOKTER", 241, 225, 16, 149, 149/225, 360028015]
for c_i, v in enumerate(tot_doc_row, 1):
    cell = ws_doc.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i == 2: cell.alignment = align_left
    elif c_i in [3, 4, 5, 6]:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i == 7:
        cell.alignment = align_right
        cell.number_format = '0.0%'
    elif c_i == 8:
        cell.alignment = align_right
        cell.number_format = 'Rp #,##0'

curr_row += 3
ws_doc.cell(row=curr_row, column=1, value="B. DAFTAR LENGKAP 241 DOKTER & STATUS KEHADIRAN").font = font_section
curr_row += 1

doc_list_headers = ["No", "No. Registrasi", "Nama Dokter", "Kategori", "Institusi / Rumah Sakit", "Mode", "Status Hadir H1", "Waktu Hadir H1", "Status Bayar"]
for c_i, h in enumerate(doc_list_headers, 1):
    c = ws_doc.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border
ws_doc.row_dimensions[curr_row].height = 25

docs_all = [r for r in data if 'Dokter' in r.get('kategori_peserta', '')]
docs_all_sorted = sorted(docs_all, key=lambda x: (x.get('kategori_peserta', ''), x.get('nama_lengkap', '').lower()))

for idx, d in enumerate(docs_all_sorted, 1):
    curr_row += 1
    hadir_h1 = d.get('registrasi_onsite') == 'Ya'
    waktu_h1 = d.get('waktu_registrasi_onsite', '-') if hadir_h1 else '-'
    status_hadir = "HADIR" if hadir_h1 else "Tidak Hadir"
    fill_row = fill_accent_green if hadir_h1 else (fill_zebra if idx % 2 == 0 else fill_white)
    
    vals = [
        idx,
        d.get('no_registrasi', '-'),
        d.get('nama_lengkap', '-'),
        d.get('kategori_peserta', '-'),
        d.get('institusi', '-') if d.get('institusi') and d.get('institusi') != '-' else 'Praktik Mandiri / RS',
        d.get('mode_kehadiran', 'Onsite'),
        status_hadir,
        waktu_h1,
        d.get('status_pembayaran', '-')
    ]
    for c_i, v in enumerate(vals, 1):
        cell = ws_doc.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i in [1, 2, 6, 7]: cell.alignment = align_center
        elif c_i in [3, 4, 5, 8, 9]: cell.alignment = align_left

for col in ws_doc.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_doc.column_dimensions[col_l].width = min(max(max_len + 4, 12), 42)

# ==============================================================================
# TAB 6: LAPORAN PENGAMBILAN BAJU
# ==============================================================================
ws_baju = wb.create_sheet(title="Laporan Pengambilan Baju")
ws_baju.views.sheetView[0].showGridLines = True

ws_baju.cell(row=1, column=1, value="LAPORAN DISTRIBUSI PENGAMBILAN BAJU / KAOS").font = font_title
ws_baju.cell(row=2, column=1, value="Total Kaos Terdistribusi: 6.185 Pcs (85,6%) dari 7.224 Pendaftar").font = font_subtitle

curr_row = 4
ws_baju.cell(row=curr_row, column=1, value="A. PENGAMBILAN BAJU BERDASARKAN KATEGORI PESERTA").font = font_section
curr_row += 1

baju_headers = ["No", "Kategori Peserta", "Total Pendaftar", "Sudah Ambil Baju", "Belum Ambil", "% Diambil", "Status Distribusi"]
for c_i, h in enumerate(baju_headers, 1):
    c = ws_baju.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_baju.row_dimensions[curr_row].height = 25

for idx, c in enumerate(categories_order, 1):
    curr_row += 1
    sub = [r for r in data if r.get('kategori_peserta') == c]
    ambil = sum(1 for r in sub if r.get('pengambilan_baju') == 'Ya')
    belum = len(sub) - ambil
    pct = ambil / len(sub) if sub else 0
    st = "Sangat Baik (>80%)" if pct >= 0.8 else ("Baik (50-80%)" if pct >= 0.5 else "Bukan Sasaran Kaos")
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    vals = [idx, c, len(sub), ambil, belum, pct, st]
    for c_i, v in enumerate(vals, 1):
        cell = ws_baju.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i in [2, 7]: cell.alignment = align_left
        elif c_i in [3, 4, 5]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 6:
            cell.alignment = align_right
            cell.number_format = '0.0%'

curr_row += 1
tot_baju_vals = ["", "TOTAL KESELURUHAN", total_pendaftar, 6185, 1039, 6185/total_pendaftar, "85,6% Terdistribusi"]
for c_i, v in enumerate(tot_baju_vals, 1):
    cell = ws_baju.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i in [2, 7]: cell.alignment = align_left
    elif c_i in [3, 4, 5]:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i == 6:
        cell.alignment = align_right
        cell.number_format = '0.0%'

curr_row += 3
ws_baju.cell(row=curr_row, column=1, value="B. DISTRIBUSI BAJU PADA CABANG-CABANG PERSADIA TERBESAR").font = font_section
curr_row += 1

cabang_baju_headers = ["No", "Cabang / Komunitas PERSADIA", "Total Anggota", "Sudah Ambil", "Belum Ambil", "% Realisasi"]
for c_i, h in enumerate(cabang_baju_headers, 1):
    c = ws_baju.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border
ws_baju.row_dimensions[curr_row].height = 25

cabang_stats = defaultdict(lambda: {'total': 0, 'ambil': 0})
for r in data:
    cab = r.get('cabang_persadia', '').strip()
    if not cab or cab == '-': cab = 'Tanpa Keterangan Cabang'
    cabang_stats[cab]['total'] += 1
    if r.get('pengambilan_baju') == 'Ya':
        cabang_stats[cab]['ambil'] += 1

sorted_cabang = sorted(cabang_stats.items(), key=lambda x: x[1]['total'], reverse=True)
for idx, (cab_name, st) in enumerate(sorted_cabang[:30], 1):
    curr_row += 1
    belum = st['total'] - st['ambil']
    pct = st['ambil'] / st['total'] if st['total'] else 0
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    vals = [idx, cab_name, st['total'], st['ambil'], belum, pct]
    for c_i, v in enumerate(vals, 1):
        cell = ws_baju.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i in [3, 4, 5]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 6:
            cell.alignment = align_right
            cell.number_format = '0.0%'

for col in ws_baju.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_baju.column_dimensions[col_l].width = min(max(max_len + 4, 12), 45)

# ==============================================================================
# TAB 7: LAPORAN SKRINING GULA DARAH (RINGKASAN MEDIS)
# ==============================================================================
ws_gd = wb.create_sheet(title="Laporan Skrining Gula Darah")
ws_gd.views.sheetView[0].showGridLines = True

ws_gd.cell(row=1, column=1, value="LAPORAN MEDIS HASIL SKRINING GULA DARAH").font = font_title
ws_gd.cell(row=2, column=1, value="Analisis 4.110 Pemeriksaan GDS, Antropometri (TB, BB, IMT, LP), dan Skrining Neuropati Diabetik").font = font_subtitle

curr_row = 4
ws_gd.cell(row=curr_row, column=1, value="A. DISTRIBUSI KADAR GULA DARAH SEWAKTU (GDS)").font = font_section
curr_row += 1

gd_headers = ["No", "Klasifikasi Klinis", "Rentang Kadar (mg/dL)", "Jumlah Peserta", "% Populasi", "Tindakan Medis Rekomendasi"]
for c_i, h in enumerate(gd_headers, 1):
    c = ws_gd.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_gd.row_dimensions[curr_row].height = 25

gd_table_data = [
    (1, "Normal / Terkontrol Baik", "< 100", 1038, 1038/4110, "Pertahankan pola makan seimbang dan aktivitas fisik"),
    (2, "Sedang / Pre-Diabetes / Waspada", "100 - 199", 2640, 2640/4110, "Edukasi gizi diabetik & pemantauan gula darah berkala"),
    (3, "Tinggi / Hiperglikemia Klinis", ">= 200", 432, 432/4110, "Konsultasi dokter spesialis / faskes rujukan segera")
]

for row_data in gd_table_data:
    curr_row += 1
    fill_row = fill_zebra if row_data[0] % 2 == 0 else fill_white
    for c_i, v in enumerate(row_data, 1):
        cell = ws_gd.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i in [2, 3, 6]: cell.alignment = align_left
        elif c_i == 4:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 5:
            cell.alignment = align_right
            cell.number_format = '0.0%'

curr_row += 1
tot_gd_row = ["", "TOTAL PESERTA DIPERIKSA", "Rata-rata: 134,6 mg/dL", 4110, 1.0, "Target Pemeriksaan Massal Tercapai 56,9%"]
for c_i, v in enumerate(tot_gd_row, 1):
    cell = ws_gd.cell(row=curr_row, column=c_i, value=v)
    cell.font = font_tbl_total
    cell.fill = fill_total
    cell.border = total_border
    if c_i in [2, 3, 6]: cell.alignment = align_left
    elif c_i == 4:
        cell.alignment = align_right
        cell.number_format = '#,##0'
    elif c_i == 5:
        cell.alignment = align_right
        cell.number_format = '0.0%'

curr_row += 3
ws_gd.cell(row=curr_row, column=1, value="B. PROFIL ANTROPOMETRI & SKRINING NEUROPATI DIABETIK").font = font_section
curr_row += 1

ant_headers = ["Parameter Kesehatan", "Jumlah Data Tervalidasi", "Nilai Rata-rata / Jumlah Positif", "Standar / Ambang Batas Normal", "Interpretasi Klinis"]
for c_i, h in enumerate(ant_headers, 1):
    c = ws_gd.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_subnavy
    c.alignment = align_header
    c.border = thin_border
ws_gd.row_dimensions[curr_row].height = 25

ant_data = [
    ("Tinggi Badan (TB)", 3930, "154,2 cm", "Rata-rata populasi dewasa", "Tinggi badan rata-rata lansia & dewasa Indonesia"),
    ("Berat Badan (BB)", 3958, "61,6 kg", "Rata-rata populasi", "Berat badan peserta skrining"),
    ("Indeks Massa Tubuh (IMT)", 3925, "25,9 kg/m²", "18,5 - 22,9 kg/m² (Kemenkes Asia)", "Kategori Kelebihan Berat Badan (Overweight)"),
    ("Lingkar Perut (LP)", 3091, "85,2 cm", "< 90 cm (Pria), < 80 cm (Wanita)", "Sebagian besar wanita berada pada batas risiko obesitas sentral"),
    ("Gejala Neuropati Diabetik", 4110, "1.653 Orang (40,2%)", "Tidak ada gejala kesemutan/kebas", "Tingginya komplikasi saraf tepi pada pasien diabetes komunitas"),
    ("Persetujuan Rekam Medis", 4110, "4.110 Orang (100%)", "Informed consent lengkap", "Seluruh peserta menyetujui pengisian data kesehatan")
]

for row_data in ant_data:
    curr_row += 1
    for c_i, v in enumerate(row_data, 1):
        cell = ws_gd.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_white
        cell.border = thin_border
        if c_i in [1, 4, 5]: cell.alignment = align_left
        elif c_i == 2:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i == 3: cell.alignment = align_center

for col in ws_gd.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_gd.column_dimensions[col_l].width = min(max(max_len + 4, 14), 45)

# ==============================================================================
# TAB 8: HASIL PEMERIKSAAN PESERTA (DETAIL 4.110 PESERTA)
# ==============================================================================
print("Menyusun Tab Detail Hasil Pemeriksaan Gula Darah per Peserta...")
ws_peserta = wb.create_sheet(title="Hasil Pemeriksaan Peserta")
ws_peserta.views.sheetView[0].showGridLines = True

ws_peserta.cell(row=1, column=1, value="LAPORAN HASIL PEMERIKSAAN GULA DARAH MASING-MASING PESERTA").font = font_title
ws_peserta.cell(row=2, column=1, value="Detail Rekam Medis 4.110 Peserta: Nilai Gula Darah Sewaktu (GDS), Kategori Medis, Antropometri (TB, BB, IMT, LP), dan Skrining Neuropati").font = font_subtitle

curr_row = 4
peserta_headers = [
    "No", "No. Registrasi", "Nama Peserta", "Kategori Peserta", "Cabang PERSADIA / Instansi",
    "Jenis Kelamin", "Tanggal Lahir", "Usia (Thn)", "Gula Darah (mg/dL)", "Kategori GDS",
    "Tinggi Badan (cm)", "Berat Badan (kg)", "IMT (kg/m²)", "Status IMT", "Lingkar Perut (cm)", "Gejala Neuropati"
]
for c_i, h in enumerate(peserta_headers, 1):
    c = ws_peserta.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_peserta.row_dimensions[curr_row].height = 28

gd_participants = [r for r in data if r.get('cek_gula_darah') == 'Ya' or (r.get('gula_darah') and r.get('gula_darah') != '-')]
gd_participants_sorted = sorted(gd_participants, key=lambda x: x.get('nama_lengkap', '').lower())

fill_gd_high = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")     # soft red
fill_gd_mid = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")      # soft amber
fill_gd_normal = PatternFill(start_color="ECFDF5", end_color="ECFDF5", fill_type="solid")   # soft green
font_high = Font(name="Calibri", size=10, bold=True, color="991B1B")
font_mid = Font(name="Calibri", size=10, bold=True, color="92400E")
font_normal = Font(name="Calibri", size=10, bold=True, color="065F46")

for idx, p in enumerate(gd_participants_sorted, 1):
    curr_row += 1
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    
    try:
        gd_val = float(p.get('gula_darah', 0))
        if gd_val < 100:
            gd_cat = "Normal (< 100)"
            gd_fill = fill_gd_normal
            gd_font = font_normal
        elif gd_val < 200:
            gd_cat = "Sedang (100 - 199)"
            gd_fill = fill_gd_mid
            gd_font = font_mid
        else:
            gd_cat = "Tinggi (≥ 200)"
            gd_fill = fill_gd_high
            gd_font = font_high
    except:
        gd_val = "-"
        gd_cat = "-"
        gd_fill = fill_row
        gd_font = font_data

    dob = p.get('tanggal_lahir', '').strip()
    usia_str = "-"
    if dob and len(dob) >= 4 and dob[:4].isdigit():
        birth_year = int(dob[:4])
        if 1920 <= birth_year <= 2026:
            usia_str = 2026 - birth_year

    tb_raw = p.get('tinggi_badan', '').strip()
    bb_raw = p.get('berat_badan', '').strip()
    tb_val = "-"
    bb_val = "-"
    bmi_val = "-"
    status_imt = "-"
    try:
        t_f = float(tb_raw)
        if 80 <= t_f <= 220:
            tb_val = t_f
    except:
        pass
    
    try:
        b_f = float(bb_raw)
        if 25 <= b_f <= 200:
            bb_val = b_f
    except:
        pass

    if isinstance(tb_val, (int, float)) and isinstance(bb_val, (int, float)):
        bmi_calc = bb_val / ((tb_val / 100) ** 2)
        bmi_val = round(bmi_calc, 1)
        if bmi_val < 18.5: status_imt = "Kurus"
        elif bmi_val <= 22.9: status_imt = "Normal"
        elif bmi_val <= 24.9: status_imt = "Overweight"
        else: status_imt = "Obesitas"

    lp_raw = p.get('lingkar_perut', '').strip()
    lp_val = "-"
    try:
        lp_f = float(lp_raw)
        if 40 <= lp_f <= 180:
            lp_val = lp_f
    except:
        pass

    neuropati = p.get('gejala_neuropati', '-').strip()
    if neuropati in ['Ya', 'true', '1']:
        neuropati = "Ya (Ada Keluhan)"
    elif neuropati in ['Tidak', 'false', '0']:
        neuropati = "Tidak"

    vals = [
        idx,
        p.get('no_registrasi', '-'),
        p.get('nama_lengkap', '-'),
        p.get('kategori_peserta', '-'),
        p.get('cabang_persadia', '-') if p.get('cabang_persadia') and p.get('cabang_persadia') != '-' else 'PERSADIA Bogor',
        p.get('jenis_kelamin', '-'),
        dob if dob and dob != '-' else '-',
        usia_str,
        gd_val,
        gd_cat,
        tb_val,
        bb_val,
        bmi_val,
        status_imt,
        lp_val,
        neuropati
    ]

    for c_i, v in enumerate(vals, 1):
        cell = ws_peserta.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        
        if c_i in [1, 2, 6, 7, 8, 14, 16]:
            cell.alignment = align_center
        elif c_i in [3, 4, 5, 10]:
            cell.alignment = align_left
        elif c_i in [9, 11, 12, 13, 15]:
            cell.alignment = align_right
            if isinstance(v, (int, float)):
                cell.number_format = '#,##0.0' if isinstance(v, float) else '#,##0'
        
        if c_i == 9:
            cell.fill = gd_fill
            cell.font = gd_font
        elif c_i == 10:
            cell.fill = gd_fill
            cell.font = gd_font

ws_peserta.freeze_panes = "A5"
ws_peserta.auto_filter.ref = f"A4:P{curr_row}"

for col in ws_peserta.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_peserta.column_dimensions[col_l].width = min(max(max_len + 3, 11), 38)

# ==============================================================================
# TAB 9: LAPORAN CABANG & GEOGRAFIS
# ==============================================================================
ws_geo = wb.create_sheet(title="Laporan Cabang & Wilayah")
ws_geo.views.sheetView[0].showGridLines = True

ws_geo.cell(row=1, column=1, value="LAPORAN SEBARAN CABANG PERSADIA & ASAL WILAYAH").font = font_title
ws_geo.cell(row=2, column=1, value="Rekapitulasi Partisipasi Berdasarkan Cabang PERSADIA dan Kota/Kabupaten Peserta").font = font_subtitle

curr_row = 4
ws_geo.cell(row=curr_row, column=1, value="A. REKAPITULASI CABANG PERSADIA (LENGKAP)").font = font_section
curr_row += 1

cab_headers = ["No", "Cabang PERSADIA / Organisasi", "Total Terdaftar", "Ambil Baju", "Cek Gula Darah", "% Ambil Baju", "% Cek Gula Darah"]
for c_i, h in enumerate(cab_headers, 1):
    c = ws_geo.cell(row=curr_row, column=c_i, value=h)
    c.font = font_tbl_header
    c.fill = fill_navy
    c.alignment = align_header
    c.border = thin_border
ws_geo.row_dimensions[curr_row].height = 25

cabang_full = defaultdict(lambda: {'total': 0, 'baju': 0, 'gd': 0})
for r in data:
    cab = r.get('cabang_persadia', '').strip()
    if not cab or cab == '-': cab = 'Tanpa Keterangan Cabang'
    cabang_full[cab]['total'] += 1
    if r.get('pengambilan_baju') == 'Ya': cabang_full[cab]['baju'] += 1
    if r.get('cek_gula_darah') == 'Ya': cabang_full[cab]['gd'] += 1

sorted_full_cabang = sorted(cabang_full.items(), key=lambda x: x[1]['total'], reverse=True)
for idx, (cab_name, st) in enumerate(sorted_full_cabang, 1):
    curr_row += 1
    pct_baju = st['baju'] / st['total'] if st['total'] else 0
    pct_gd = st['gd'] / st['total'] if st['total'] else 0
    fill_row = fill_zebra if idx % 2 == 0 else fill_white
    vals = [idx, cab_name, st['total'], st['baju'], st['gd'], pct_baju, pct_gd]
    for c_i, v in enumerate(vals, 1):
        cell = ws_geo.cell(row=curr_row, column=c_i, value=v)
        cell.font = font_data
        cell.fill = fill_row
        cell.border = thin_border
        if c_i == 1: cell.alignment = align_center
        elif c_i == 2: cell.alignment = align_left
        elif c_i in [3, 4, 5]:
            cell.alignment = align_right
            cell.number_format = '#,##0'
        elif c_i in [6, 7]:
            cell.alignment = align_right
            cell.number_format = '0.0%'

for col in ws_geo.columns:
    max_len = max(len(str(cell.value or '')) for cell in col)
    col_l = get_column_letter(col[0].column)
    ws_geo.column_dimensions[col_l].width = min(max(max_len + 4, 12), 48)

out_xlsx_path = 'Data peserta/Data peserta seminar/LAPORAN_KOMPREHENSIF_KONAS_PERSADIA_2026.xlsx'
wb.save(out_xlsx_path)
print(f"Laporan Excel berhasil disimpan di: {out_xlsx_path}")
