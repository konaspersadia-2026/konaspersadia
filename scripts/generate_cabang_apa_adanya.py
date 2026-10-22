#!/usr/bin/env python3
"""
scripts/generate_cabang_apa_adanya.py
Mengelompokkan data peserta di direktori 'Data peserta/data peserta update'
berdasarkan teks kolom 'cabang_persadia' secara apa adanya (tanpa standarisasi kota).
"""

import os
import csv
import glob
import zipfile
import xml.sax.saxutils as saxutils
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'Data peserta')
OUTPUT_CSV_REKAP = os.path.join(DATA_DIR, 'REKAP_CABANG_PERSADIA_APA_ADANYA.csv')
OUTPUT_XLSX_REKAP = os.path.join(DATA_DIR, 'REKAP_CABANG_PERSADIA_APA_ADANYA.xlsx')
OUTPUT_CSV_DATA = os.path.join(DATA_DIR, 'DATA_PESERTA_KELOMPOK_CABANG_APA_ADANYA.csv')
OUTPUT_XLSX_DATA = os.path.join(DATA_DIR, 'DATA_PESERTA_KELOMPOK_CABANG_APA_ADANYA.xlsx')

def escape_xml(s):
    if s is None:
        return ''
    return saxutils.escape(str(s))

def col_letter(col_idx):
    result = ""
    while col_idx > 0:
        col_idx, remainder = divmod(col_idx - 1, 26)
        result = chr(65 + remainder) + result
    return result

def run():
    print("Membaca berkas CSV di Data peserta/data peserta update...")
    csv_files = sorted(glob.glob(os.path.join(DATA_DIR, 'data peserta update', '*.csv')))
    all_rows = []
    for fpath in csv_files:
        with open(fpath, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                all_rows.append(r)

    total_rows = len(all_rows)
    print(f"Total baris pendaftar: {total_rows}")

    # 1. Hitung Statistik per cabang_persadia apa adanya
    stats = defaultdict(lambda: {'lunas': 0, 'batal': 0, 'menunggu': 0, 'total': 0})
    for r in all_rows:
        raw_cabang = (r.get('cabang_persadia') or '').strip()
        key = raw_cabang if raw_cabang != '' else '-'
        st = (r.get('status_pembayaran') or '').strip().lower()
        stats[key]['total'] += 1
        if st == 'lunas':
            stats[key]['lunas'] += 1
        elif st == 'dibatalkan':
            stats[key]['batal'] += 1
        else:
            stats[key]['menunggu'] += 1

    # Urutkan berdasarkan total peserta terbanyak
    sorted_stats = sorted(stats.items(), key=lambda x: -x[1]['total'])

    total_lunas = sum(s['lunas'] for s in stats.values())
    total_batal = sum(s['batal'] for s in stats.values())
    total_mnggu = sum(s['menunggu'] for s in stats.values())

    rekap_rows = []
    for idx, (cab_name, s) in enumerate(sorted_stats, 1):
        pct = f"{s['lunas'] / total_lunas * 100:.2f}%" if total_lunas > 0 else "0.00%"
        rekap_rows.append({
            'No': idx,
            'cabang_persadia (Teks Asli DB)': cab_name,
            'Lunas (Aktif)': s['lunas'],
            'Dibatalkan': s['batal'],
            'Menunggu Verifikasi': s['menunggu'],
            'Total Peserta': s['total'],
            'Persentase (Lunas)': pct
        })

    # Baris Total
    rekap_rows.append({
        'No': '',
        'cabang_persadia (Teks Asli DB)': 'TOTAL KESELURUHAN',
        'Lunas (Aktif)': total_lunas,
        'Dibatalkan': total_batal,
        'Menunggu Verifikasi': total_mnggu,
        'Total Peserta': total_rows,
        'Persentase (Lunas)': '100.00%'
    })

    rekap_headers = ['No', 'cabang_persadia (Teks Asli DB)', 'Lunas (Aktif)', 'Dibatalkan', 'Menunggu Verifikasi', 'Total Peserta', 'Persentase (Lunas)']

    # Simpan CSV Rekap
    with open(OUTPUT_CSV_REKAP, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rekap_headers)
        writer.writeheader()
        writer.writerows(rekap_rows)
    print(f"Berkas CSV Rekap Apa Adanya disimpan: {OUTPUT_CSV_REKAP} ({len(rekap_rows)} baris)")

    # 2. Urutkan Seluruh Data Peserta Berdasarkan cabang_persadia apa adanya
    def sort_data_key(item):
        c = (item.get('cabang_persadia') or '').strip().lower()
        is_dash = 1 if c in ('-', '') else 0
        return (is_dash, c, (item.get('nama_lengkap') or '').lower())

    all_rows.sort(key=sort_data_key)

    # Simpan CSV Data Peserta Lengkap Terkelompok
    orig_headers = list(all_rows[0].keys())
    with open(OUTPUT_CSV_DATA, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=orig_headers)
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"Berkas CSV Data Peserta Terkelompok Apa Adanya: {OUTPUT_CSV_DATA} ({len(all_rows)} baris)")

    # 3. Bangun Excel XLSX Rekap Apa Adanya
    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="6">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF065F46"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF991B1B"/><name val="Calibri"/></font>
    <font><b/><sz val="12"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF1E293B"/><name val="Calibri"/></font>
  </fonts>
  <fills count="6">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="7">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>'''

    content_types_single = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

    rels_single = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    wb_rels_single = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    wb_rekap_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Rekap Cabang Apa Adanya" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

    rekap_sheet_lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    rekap_sheet_lines.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
    rekap_sheet_lines.append('  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane state="frozen" ySplit="1"/></sheetView></sheetViews>')
    rekap_sheet_lines.append('  <sheetFormatPr defaultRowHeight="20"/>')
    rekap_sheet_lines.append('  <sheetData>')

    rekap_sheet_lines.append('    <row r="1" ht="26" customHeight="1">')
    for c_idx, h in enumerate(rekap_headers, 1):
        cell_ref = f"{col_letter(c_idx)}1"
        rekap_sheet_lines.append(f'      <c r="{cell_ref}" s="1" t="inlineStr"><is><t>{escape_xml(h)}</t></is></c>')
    rekap_sheet_lines.append('    </row>')

    for r_idx, row_dict in enumerate(rekap_rows, 2):
        is_total = (row_dict.get('cabang_persadia (Teks Asli DB)') == 'TOTAL KESELURUHAN')
        style_idx = 6 if is_total else (2 if r_idx % 2 == 0 else 0)
        rekap_sheet_lines.append(f'    <row r="{r_idx}" ht="20">')
        for c_idx, h in enumerate(rekap_headers, 1):
            cell_ref = f"{col_letter(c_idx)}{r_idx}"
            val = row_dict.get(h, '')
            rekap_sheet_lines.append(f'      <c r="{cell_ref}" s="{style_idx}" t="inlineStr"><is><t>{escape_xml(val)}</t></is></c>')
        rekap_sheet_lines.append('    </row>')

    rekap_sheet_lines.append('  </sheetData>')
    rekap_sheet_lines.append('</worksheet>')

    with zipfile.ZipFile(OUTPUT_XLSX_REKAP, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types_single)
        z.writestr('_rels/.rels', rels_single)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels_single)
        z.writestr('xl/workbook.xml', wb_rekap_xml)
        z.writestr('xl/styles.xml', styles_xml)
        z.writestr('xl/worksheets/sheet1.xml', '\n'.join(rekap_sheet_lines))
    print(f"Berkas Excel Rekap Apa Adanya disimpan: {OUTPUT_XLSX_REKAP}")

    # 4. Bangun Excel Data Peserta Terkelompok Apa Adanya
    wb_data_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Data Peserta Apa Adanya" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

    display_cols = [
        ('No', 'no'),
        ('cabang_persadia (Teks Asli)', 'cabang_persadia'),
        ('Institusi / Faskes', 'institusi'),
        ('ID DB', 'id'),
        ('No Registrasi', 'no_registrasi'),
        ('Nama Lengkap', 'nama_lengkap'),
        ('Status Pembayaran', 'status_pembayaran'),
        ('Kategori Peserta', 'kategori_peserta'),
        ('Pilihan Kegiatan', 'pilihan_kegiatan'),
        ('Nomor WhatsApp', 'whatsapp'),
        ('Tanggal Lahir', 'tanggal_lahir'),
        ('Jenis Kelamin', 'jenis_kelamin'),
        ('Kota / Kabupaten', 'kota_kabupaten'),
        ('Provinsi', 'provinsi'),
        ('Waktu Pendaftaran', 'timestamp')
    ]

    data_sheet_lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    data_sheet_lines.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
    data_sheet_lines.append('  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane state="frozen" ySplit="1"/></sheetView></sheetViews>')
    data_sheet_lines.append('  <sheetFormatPr defaultRowHeight="20"/>')
    data_sheet_lines.append('  <sheetData>')

    data_sheet_lines.append('    <row r="1" ht="26" customHeight="1">')
    for c_idx, (label, key) in enumerate(display_cols, 1):
        cell_ref = f"{col_letter(c_idx)}1"
        data_sheet_lines.append(f'      <c r="{cell_ref}" s="1" t="inlineStr"><is><t>{escape_xml(label)}</t></is></c>')
    data_sheet_lines.append('    </row>')

    current_cab = None
    cab_toggle = 0
    for r_idx, r in enumerate(all_rows, 2):
        raw_c = (r.get('cabang_persadia') or '').strip()
        if raw_c != current_cab:
            current_cab = raw_c
            cab_toggle = 1 - cab_toggle

        st = (r.get('status_pembayaran') or '').strip().lower()
        if st == 'dibatalkan':
            style_idx = 4
        elif cab_toggle == 1:
            style_idx = 2
        else:
            style_idx = 0

        r['no'] = str(r_idx - 1)
        data_sheet_lines.append(f'    <row r="{r_idx}" ht="20">')
        for c_idx, (label, key) in enumerate(display_cols, 1):
            cell_ref = f"{col_letter(c_idx)}{r_idx}"
            val = r.get(key, '')
            data_sheet_lines.append(f'      <c r="{cell_ref}" s="{style_idx}" t="inlineStr"><is><t>{escape_xml(val)}</t></is></c>')
        data_sheet_lines.append('    </row>')

    data_sheet_lines.append('  </sheetData>')
    data_sheet_lines.append('</worksheet>')

    with zipfile.ZipFile(OUTPUT_XLSX_DATA, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types_single)
        z.writestr('_rels/.rels', rels_single)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels_single)
        z.writestr('xl/workbook.xml', wb_data_xml)
        z.writestr('xl/styles.xml', styles_xml)
        z.writestr('xl/worksheets/sheet1.xml', '\n'.join(data_sheet_lines))
    print(f"Berkas Excel Data Peserta Terkelompok Apa Adanya: {OUTPUT_XLSX_DATA}")

if __name__ == '__main__':
    run()
