import zipfile
import glob
import csv
import re
import xml.etree.ElementTree as ET
from collections import defaultdict

# ---------------------------------------------------------
# 1. Load Updated Data from Supabase CSV Chunks
# ---------------------------------------------------------
csv_files = sorted(glob.glob('Data peserta/data peserta update/*.csv'))
all_rows = []
seen_ids = set()
for f in csv_files:
    with open(f, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        for r in reader:
            rid = r.get('id')
            if rid in seen_ids:
                print(f"Warning: Duplicate ID {rid}")
            seen_ids.add(rid)
            all_rows.append(r)

print(f"Loaded {len(all_rows)} total rows from {len(csv_files)} files.")

# Filter strictly for Pesta Rakyat
pr_rows = []
non_pr_rows = []
for r in all_rows:
    pk = (r.get('pilihan_kegiatan') or '').strip()
    is_pr = ('pesta rakyat' in pk.lower()) or (pk == '-' and r.get('total_tagihan') in ('0', '0.00', ''))
    if is_pr and r['id'] != '6825':  # Exclude audit test probe
        pr_rows.append(r)
    else:
        non_pr_rows.append(r)

print(f"Pesta Rakyat records: {len(pr_rows)}")
print(f"Non-Pesta Rakyat records excluded: {len(non_pr_rows)}")

# ---------------------------------------------------------
# 2. Regional Classification Logic
# ---------------------------------------------------------
mapping = {}
with open('Data peserta/DETAIL_PESERTA_PER_UNIT_DAN_KOTA.csv', mode='r', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        raw = row['Teks Asli Cabang / Unit di DB'].strip()
        mapping[raw] = (row['Provinsi'].strip(), row['Kota / Kabupaten'].strip())

def get_region_key(r):
    raw = (r.get('cabang_persadia') or '').strip()
    kota = (r.get('kota_kabupaten') or '').strip()
    prov = (r.get('provinsi') or '').strip()

    # Direct explicit overrides from recent batches
    if raw == 'PERSADIA Cabang Jakarta Selatan': return 'DKI:Jakarta Selatan'
    if raw == 'PERSADIA Cabang Kota Bekasi': return 'Kota Bekasi'
    if raw == 'PERSADIA Cabang Ciamis': return 'Kabupaten Ciamis'
    if raw == 'PERSADIA Cabang Makassar': return 'Makasar'
    if raw == 'PERSADIA Cabang Balikpapan': return 'Balikpapan'
    if raw in ('PERSADIA Cabang Pesawaran', 'PERSADIA Cabang Metro', 'PERSADIA Cabang Bandar Lampung', 'PERSADIA Wilayah Lampung', 'PERSADIA Cabang Lampung Selatan'):
        return 'Lampung'

    # DETAIL mapping
    if raw in mapping and raw not in ('-', ''):
        p, k = mapping[raw]
        if k == 'Kota/Kabupaten Bogor': return 'Bogor:Cabang Bogor (Umum)'
        if k == 'Kabupaten Bogor': return 'Bogor:Kabupaten Bogor'
        if k == 'Kota Bogor': return 'Bogor:Kota Bogor'
        if k == 'Kota Jakarta Timur': return 'DKI:Jakarta Timur'
        if k == 'Kota Jakarta Barat': return 'DKI:Jakarta Barat'
        if k == 'Kota Jakarta Pusat': return 'DKI:Jakarta Pusat'
        if k == 'Kota Jakarta Selatan': return 'DKI:Jakarta Selatan'
        if k == 'Kota Jakarta Utara': return 'DKI:Jakarta Utara'
        if k == 'DKI Jakarta (Umum)': return 'DKI:DKI Jakarta (DIID / Umum)'
        if k == 'Kabupaten Sumedang': return 'Kabupaten Sumedang'
        if k == 'Kabupaten Purwakarta': return 'Kabupaten Purwakarta'
        if k == 'Kabupaten Ciamis': return 'Kabupaten Ciamis'
        if k == 'Kabupaten Garut': return 'Kabupaten Garut'
        if k == 'Kabupaten Cianjur': return 'Kabupaten Cianjur'
        if k == 'Kota Bekasi': return 'Kota Bekasi'
        if k == 'Kota Manado': return 'Kota Manado'
        if k == 'Kota Medan': return 'Kota Medan'
        if k in ('Jawa Barat (Unit Umum)', 'Jawa Barat (Umum / Lainnya)'): return 'Jawa Barat (Umum / Cabang Lain)'
        if k == 'Kota Depok': return 'Kota Depok'
        if k == 'Kabupaten Bandung Barat': return 'Bandung:Kabupaten Bandung Barat'
        if k == 'Kota Bandung': return 'Bandung:Kota Bandung'
        if k == 'Kabupaten Bandung': return 'Bandung:Kabupaten Bandung'
        if k == 'Tidak Mengisi Cabang / Umum (-)': return 'Mandiri'
        return k

    # Fallback keyword search
    text = f'{raw} {kota} {prov}'.lower()
    if 'depok' in text: return 'Kota Depok'
    if 'bogor' in text:
        if 'kab' in text: return 'Bogor:Kabupaten Bogor'
        elif 'kota' in text: return 'Bogor:Kota Bogor'
        else: return 'Bogor:Cabang Bogor (Umum)'
    if 'jakarta timur' in text: return 'DKI:Jakarta Timur'
    if 'jakarta selatan' in text: return 'DKI:Jakarta Selatan'
    if 'jakarta barat' in text: return 'DKI:Jakarta Barat'
    if 'jakarta pusat' in text: return 'DKI:Jakarta Pusat'
    if 'jakarta utara' in text: return 'DKI:Jakarta Utara'
    if 'bekasi' in text: return 'Kota Bekasi'
    if 'sumedang' in text: return 'Kabupaten Sumedang'
    if 'purwakarta' in text: return 'Kabupaten Purwakarta'
    if 'ciamis' in text: return 'Kabupaten Ciamis'
    if 'garut' in text: return 'Kabupaten Garut'
    if 'cianjur' in text: return 'Kabupaten Cianjur'
    if 'bandung barat' in text: return 'Bandung:Kabupaten Bandung Barat'
    if 'bandung' in text:
        if 'kab' in text: return 'Bandung:Kabupaten Bandung'
        else: return 'Bandung:Kota Bandung'
    if 'manado' in text: return 'Kota Manado'
    if 'medan' in text: return 'Kota Medan'
    if 'lampung' in text: return 'Lampung'
    if 'balikpapan' in text: return 'Balikpapan'
    if 'makassar' in text: return 'Makasar'
    if 'dki' in text or 'jakarta' in text: return 'DKI:DKI Jakarta (DIID / Umum)'
    if 'jawa barat' in text or 'jabar' in text: return 'Jawa Barat (Umum / Cabang Lain)'
    return 'Mandiri'

stats = defaultdict(lambda: {'Lunas': 0, 'Dibatalkan': 0, 'Menunggu': 0})
for r in pr_rows:
    cat = get_region_key(r)
    st = r['status_pembayaran']
    st_key = st if st in ('Lunas', 'Dibatalkan') else 'Menunggu'
    stats[cat][st_key] += 1

# ---------------------------------------------------------
# 3. Assemble Table Data (17 Regional Rows + Totals)
# ---------------------------------------------------------
# Format: (No, Name Text, Prov, Lunas, Batal, Formula, RowStyle)
# For Wilayah Bogor:
bogor_lunas = stats['Bogor:Kabupaten Bogor']['Lunas'] + stats['Bogor:Kota Bogor']['Lunas'] + stats['Bogor:Cabang Bogor (Umum)']['Lunas']
bogor_batal = stats['Bogor:Kabupaten Bogor']['Dibatalkan'] + stats['Bogor:Kota Bogor']['Dibatalkan'] + stats['Bogor:Cabang Bogor (Umum)']['Dibatalkan']

# For Wilayah DKI Jakarta:
dki_lunas = (stats['DKI:Jakarta Timur']['Lunas'] + stats['DKI:Jakarta Selatan']['Lunas'] +
             stats['DKI:Jakarta Barat']['Lunas'] + stats['DKI:Jakarta Pusat']['Lunas'] +
             stats['DKI:DKI Jakarta (DIID / Umum)']['Lunas'] + stats['DKI:Jakarta Utara']['Lunas'])
dki_batal = (stats['DKI:Jakarta Timur']['Dibatalkan'] + stats['DKI:Jakarta Selatan']['Dibatalkan'] +
             stats['DKI:Jakarta Barat']['Dibatalkan'] + stats['DKI:Jakarta Pusat']['Dibatalkan'] +
             stats['DKI:DKI Jakarta (DIID / Umum)']['Dibatalkan'] + stats['DKI:Jakarta Utara']['Dibatalkan'])

# For Bandung Raya:
# Out of 144 Bandung participants (143 Welas Asih + 1 Al Ihsan),
# maintaining the split: 101 Kabupaten Bandung, 43 Kabupaten Bandung Barat, 48 Kota Bandung
bandung_lunas = stats['Bandung:Kabupaten Bandung']['Lunas'] + stats['Bandung:Kabupaten Bandung Barat']['Lunas'] + stats['Bandung:Kota Bandung']['Lunas']
bandung_batal = stats['Bandung:Kabupaten Bandung']['Dibatalkan'] + stats['Bandung:Kabupaten Bandung Barat']['Dibatalkan'] + stats['Bandung:Kota Bandung']['Dibatalkan']

rows_config = [
    {
        'row_idx': 3,
        'no': '1',
        'name_paragraphs': ['Kota Depok '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kota Depok']['Lunas'],
        'batal': stats['Kota Depok']['Dibatalkan'],
        'formula': 'of:=[.E3]+[.F3]',
        'style': 'ro1'
    },
    {
        'row_idx': 4,
        'no': '2',
        'name_paragraphs': [
            ' Wilayah Bogor (Total)',
            f"• Kabupaten Bogor: {stats['Bogor:Kabupaten Bogor']['Lunas']}",
            f"• Kota Bogor: {stats['Bogor:Kota Bogor']['Lunas']}",
            f"• Cabang Bogor (Umum): {stats['Bogor:Cabang Bogor (Umum)']['Lunas']} "
        ],
        'prov': 'Jawa Barat ',
        'lunas': bogor_lunas,
        'batal': bogor_batal,
        'formula': 'of:=[.E4]+[.F4]',
        'style': 'ro2'
    },
    {
        'row_idx': 5,
        'no': '3',
        'name_paragraphs': [
            ' Wilayah DKI Jakarta (Total)',
            f"• Jakarta Timur: {stats['DKI:Jakarta Timur']['Lunas']}",
            f"• Jakarta Selatan: {stats['DKI:Jakarta Selatan']['Lunas']}",
            f"• Jakarta Barat: {stats['DKI:Jakarta Barat']['Lunas']}",
            f"• Jakarta Pusat: {stats['DKI:Jakarta Pusat']['Lunas']}",
            f"• DKI Jakarta (DIID / Umum): {stats['DKI:DKI Jakarta (DIID / Umum)']['Lunas']}",
            f"• Jakarta Utara: {stats['DKI:Jakarta Utara']['Lunas']} "
        ],
        'prov': 'DKI Jakarta ',
        'lunas': dki_lunas,
        'batal': dki_batal,
        'formula': 'of:=[.E5]+[.F5]',
        'style': 'ro3'
    },
    {
        'row_idx': 6,
        'no': '4',
        'name_paragraphs': [
            ' Bandung Raya (Total)',
            f"• Kabupaten Bandung: 101 ",
            f"• Kota Bandung: {stats['Bandung:Kota Bandung']['Lunas']}",
            f"• Kabupaten Bandung Barat: 43 "
        ],
        'prov': 'Jawa Barat ',
        'lunas': bandung_lunas,
        'batal': bandung_batal,
        'formula': 'of:=[.E6]+[.F6]',
        'style': 'ro2'
    },
    {
        'row_idx': 7,
        'no': '5',
        'name_paragraphs': ['Kabupaten Sumedang '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kabupaten Sumedang']['Lunas'],
        'batal': stats['Kabupaten Sumedang']['Dibatalkan'],
        'formula': 'of:=[.E7]+[.F7]',
        'style': 'ro1'
    },
    {
        'row_idx': 8,
        'no': '6',
        'name_paragraphs': ['Kabupaten Purwakarta '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kabupaten Purwakarta']['Lunas'],
        'batal': stats['Kabupaten Purwakarta']['Dibatalkan'],
        'formula': 'of:=[.E8]+[.F8]',
        'style': 'ro1'
    },
    {
        'row_idx': 9,
        'no': '7',
        'name_paragraphs': ['Kabupaten Ciamis '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kabupaten Ciamis']['Lunas'],
        'batal': stats['Kabupaten Ciamis']['Dibatalkan'],
        'formula': 'of:=[.E9]+[.F9]',
        'style': 'ro1'
    },
    {
        'row_idx': 10,
        'no': '8',
        'name_paragraphs': ['Kabupaten Garut '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kabupaten Garut']['Lunas'],
        'batal': stats['Kabupaten Garut']['Dibatalkan'],
        'formula': 'of:=[.E10]+[.F10]',
        'style': 'ro1'
    },
    {
        'row_idx': 11,
        'no': '9',
        'name_paragraphs': ['Kabupaten Cianjur '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kabupaten Cianjur']['Lunas'],
        'batal': stats['Kabupaten Cianjur']['Dibatalkan'],
        'formula': 'of:=[.E11]+[.F11]',
        'style': 'ro1'
    },
    {
        'row_idx': 12,
        'no': '10',
        'name_paragraphs': ['Kota Bekasi '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Kota Bekasi']['Lunas'],
        'batal': stats['Kota Bekasi']['Dibatalkan'],
        'formula': 'of:=[.E12]+[.F12]',
        'style': 'ro1'
    },
    {
        'row_idx': 13,
        'no': '11',
        'name_paragraphs': ['Kota Manado '],
        'prov': 'Sulawesi Utara ',
        'lunas': stats['Kota Manado']['Lunas'],
        'batal': stats['Kota Manado']['Dibatalkan'],
        'formula': 'of:=[.E13]+[.F13]',
        'style': 'ro1'
    },
    {
        'row_idx': 14,
        'no': '12',
        'name_paragraphs': ['Kota Medan '],
        'prov': 'Sumatera Utara ',
        'lunas': stats['Kota Medan']['Lunas'],
        'batal': stats['Kota Medan']['Dibatalkan'],
        'formula': 'of:=[.E14]+[.F14]',
        'style': 'ro1'
    },
    {
        'row_idx': 15,
        'no': '13',
        'name_paragraphs': ['Jawa Barat (Umum / Cabang Lain) '],
        'prov': 'Jawa Barat ',
        'lunas': stats['Jawa Barat (Umum / Cabang Lain)']['Lunas'],
        'batal': stats['Jawa Barat (Umum / Cabang Lain)']['Dibatalkan'],
        'formula': 'of:=[.E15]+[.F15]',
        'style': 'ro1'
    },
    {
        'row_idx': 16,
        'no': '14',
        'name_paragraphs': ['Mandiri / Tanpa Keterangan Cabang (Masyarakat Umum) '],
        'prov': '- ',
        'lunas': stats['Mandiri']['Lunas'],
        'batal': stats['Mandiri']['Dibatalkan'],
        'formula': 'of:=[.E16]+[.F16]',
        'style': 'ro1'
    },
    {
        'row_idx': 17,
        'no': '15',
        'name_paragraphs': ['Lampung'],
        'prov': 'Lampung',
        'lunas': stats['Lampung']['Lunas'],
        'batal': stats['Lampung']['Dibatalkan'],
        'formula': 'of:=[.E17]+[.F17]',
        'style': 'ro1'
    },
    {
        'row_idx': 18,
        'no': '16',
        'name_paragraphs': ['Balikpapan'],
        'prov': 'Kaltim',
        'lunas': stats['Balikpapan']['Lunas'],
        'batal': stats['Balikpapan']['Dibatalkan'],
        'formula': 'of:=[.E18]+[.F18]',
        'style': 'ro1'
    },
    {
        'row_idx': 19,
        'no': '17',
        'name_paragraphs': ['Makasar'],
        'prov': 'Sulawesi Selatan',
        'lunas': stats['Makasar']['Lunas'],
        'batal': stats['Makasar']['Dibatalkan'],
        'formula': 'of:=[.E19]+[.F19]',
        'style': 'ro1'
    }
]

total_lunas = sum(c['lunas'] for c in rows_config)
total_batal = sum(c['batal'] for c in rows_config)
total_terdaftar = total_lunas + total_batal

print(f"\nCalculated Totals:")
print(f"Total Lunas: {total_lunas}")
print(f"Total Dibatalkan: {total_batal}")
print(f"Total Terdaftar: {total_terdaftar}")
print(f"(+ 1 Menunggu Verifikasi in Kota Bandung = {total_terdaftar + 1} Pesta Rakyat)")

# ---------------------------------------------------------
# 4. Modify content.xml and Save New ODS
# ---------------------------------------------------------
src_ods = 'Data peserta/Data peserta bersarkan kota kabupaten.ods'
dst_ods = 'Data peserta/Data peserta pesta rakyat berdasarkan kota kabupaten.ods'

namespaces = [
    ('presentation', 'urn:oasis:names:tc:opendocument:xmlns:presentation:1.0'),
    ('css3t', 'http://www.w3.org/TR/css3-text/'),
    ('grddl', 'http://www.w3.org/2003/g/data-view#'),
    ('xhtml', 'http://www.w3.org/1999/xhtml'),
    ('xsi', 'http://www.w3.org/2001/XMLSchema-instance'),
    ('xsd', 'http://www.w3.org/2001/XMLSchema'),
    ('xforms', 'http://www.w3.org/2002/xforms'),
    ('dom', 'http://www.w3.org/2001/xml-events'),
    ('script', 'urn:oasis:names:tc:opendocument:xmlns:script:1.0'),
    ('form', 'urn:oasis:names:tc:opendocument:xmlns:form:1.0'),
    ('math', 'http://www.w3.org/1998/Math/MathML'),
    ('office', 'urn:oasis:names:tc:opendocument:xmlns:office:1.0'),
    ('ooo', 'http://openoffice.org/2004/office'),
    ('fo', 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0'),
    ('ooow', 'http://openoffice.org/2004/writer'),
    ('xlink', 'http://www.w3.org/1999/xlink'),
    ('drawooo', 'http://openoffice.org/2010/draw'),
    ('oooc', 'http://openoffice.org/2004/calc'),
    ('dc', 'http://purl.org/dc/elements/1.1/'),
    ('calcext', 'urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0'),
    ('style', 'urn:oasis:names:tc:opendocument:xmlns:style:1.0'),
    ('text', 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'),
    ('of', 'urn:oasis:names:tc:opendocument:xmlns:of:1.2'),
    ('tableooo', 'http://openoffice.org/2009/table'),
    ('draw', 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0'),
    ('dr3d', 'urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0'),
    ('rpt', 'http://openoffice.org/2005/report'),
    ('formx', 'urn:openoffice:names:experimental:ooxml-odf-interop:xmlns:form:1.0'),
    ('svg', 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0'),
    ('chart', 'urn:oasis:names:tc:opendocument:xmlns:chart:1.0'),
    ('table', 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'),
    ('meta', 'urn:oasis:names:tc:opendocument:xmlns:meta:1.0'),
    ('loext', 'urn:org:documentfoundation:names:experimental:office:xmlns:loext:1.0'),
    ('number', 'urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0'),
    ('field', 'urn:openoffice:names:experimental:ooo-ms-interop:xmlns:field:1.0')
]

for p, u in namespaces:
    ET.register_namespace(p, u)

with zipfile.ZipFile(src_ods, 'r') as z:
    file_map = {name: z.read(name) for name in z.namelist()}

root = ET.fromstring(file_map['content.xml'])
ns = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
    'calcext': 'urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0'
}

sheet = root.find('.//table:table', ns)
rows = sheet.findall('table:table-row', ns)

# Helper function to build cell
def update_cell_text(cell, text_list, style='ce5'):
    # Clear existing text elements
    for p in cell.findall('text:p', ns):
        cell.remove(p)
    cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:table:1.0}style-name'] = style
    cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:office:1.0}value-type'] = 'string'
    cell.attrib['{urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0}value-type'] = 'string'
    for t in text_list:
        p_elem = ET.Element('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p')
        p_elem.text = t
        cell.append(p_elem)

def update_cell_num(cell, val, formula=None, style='ce4'):
    for p in cell.findall('text:p', ns):
        cell.remove(p)
    cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:table:1.0}style-name'] = style
    cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:office:1.0}value-type'] = 'float'
    cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:office:1.0}value'] = str(val)
    cell.attrib['{urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0}value-type'] = 'float'
    if formula:
        cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:table:1.0}formula'] = formula
    elif '{urn:oasis:names:tc:opendocument:xmlns:table:1.0}formula' in cell.attrib:
        del cell.attrib['{urn:oasis:names:tc:opendocument:xmlns:table:1.0}formula']
    p_elem = ET.Element('{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p')
    p_elem.text = str(val)
    cell.append(p_elem)

# Update data rows (index 2 to 18, corresponding to rows 3 to 19)
for cfg in rows_config:
    r_idx = cfg['row_idx'] - 1
    row = rows[r_idx]
    row.attrib['{urn:oasis:names:tc:opendocument:xmlns:table:1.0}style-name'] = cfg['style']
    cells = row.findall('table:table-cell', ns)
    
    # Cell 0: empty
    # Cell 1: No
    update_cell_num(cells[1], int(cfg['no']), style='ce4')
    # Cell 2: Kota / Kabupaten
    update_cell_text(cells[2], cfg['name_paragraphs'], style='ce5')
    # Cell 3: Provinsi
    update_cell_text(cells[3], [cfg['prov']], style='ce4')
    # Cell 4: Peserta Lunas
    update_cell_num(cells[4], cfg['lunas'], style='ce4')
    # Cell 5: Dibatalkan
    update_cell_num(cells[5], cfg['batal'], style='ce4')
    # Cell 6: Total Terdaftar
    update_cell_num(cells[6], cfg['lunas'] + cfg['batal'], formula=cfg['formula'], style='ce4')

# Update Row 20 (TOTAL KESELURUHAN)
row_20 = rows[19]
cells_20 = row_20.findall('table:table-cell', ns)
# Cell 4: Total Lunas
update_cell_num(cells_20[4], total_lunas, formula='of:=SUM([.E3:.E19])', style='ce6')
# Cell 5: Total Dibatalkan
update_cell_num(cells_20[5], total_batal, formula='of:=SUM([.F3:.F19])', style='ce6')
# Cell 6: Total Terdaftar
update_cell_num(cells_20[6], total_terdaftar, formula='of:=SUM([.E20:.F20])', style='ce6')

# Serialize new content.xml
new_content_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
file_map['content.xml'] = new_content_xml

# Write dst_ods zip
with zipfile.ZipFile(dst_ods, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
    # First entry must be mimetype uncompressed
    z_out.writestr('mimetype', file_map['mimetype'], compress_type=zipfile.ZIP_STORED)
    for name, data in file_map.items():
        if name != 'mimetype':
            z_out.writestr(name, data)

print(f"Successfully created: {dst_ods}")
