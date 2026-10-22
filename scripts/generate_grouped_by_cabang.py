#!/usr/bin/env python3
"""
scripts/generate_grouped_by_cabang.py
Mengelompokkan seluruh data peserta di direktori 'Data peserta/data peserta update'
berdasarkan Cabang PERSADIA, menghasilkan berkas Excel dan CSV terbaru.
"""

import os
import re
import csv
import glob
import zipfile
import xml.sax.saxutils as saxutils
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'Data peserta')
OUTPUT_CSV_DATA = os.path.join(DATA_DIR, 'DATA_PESERTA_TERKELOMPOK_PER_CABANG.csv')
OUTPUT_XLSX_DATA = os.path.join(DATA_DIR, 'DATA_PESERTA_TERKELOMPOK_PER_CABANG.xlsx')
OUTPUT_CSV_REKAP = os.path.join(DATA_DIR, 'REKAP_JUMLAH_PESERTA_PER_CABANG_UPDATE.csv')
OUTPUT_XLSX_REKAP = os.path.join(DATA_DIR, 'REKAP_JUMLAH_PESERTA_PER_CABANG_UPDATE.xlsx')

def escape_xml(s):
    if s is None:
        return ''
    return saxutils.escape(str(s))

def run():
    print("Membaca berkas CSV di Data peserta/data peserta update...")
    csv_files = sorted(glob.glob(os.path.join(DATA_DIR, 'data peserta update', '*.csv')))
    all_rows = []
    for fpath in csv_files:
        with open(fpath, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                all_rows.append(r)

    print(f"Total baris dimuat: {len(all_rows)}")

    # Mapping referensi
    mapping = {}
    mapping_file = os.path.join(DATA_DIR, 'DETAIL_PESERTA_PER_UNIT_DAN_KOTA.csv')
    if os.path.exists(mapping_file):
        with open(mapping_file, mode='r', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                raw = row['Teks Asli Cabang / Unit di DB'].strip()
                mapping[raw] = (row['Provinsi'].strip(), row['Kota / Kabupaten'].strip())

    def map_cabang(r):
        kat = (r.get('kategori_peserta') or '').strip()
        raw = (r.get('cabang_persadia') or '').strip()
        kota = (r.get('kota_kabupaten') or '').strip()
        prov = (r.get('provinsi') or '').strip()

        if kat in ('Masyarakat Umum', 'Dokter Umum', 'Dokter Layanan Primer (FKTP)'):
            return '', kat, prov if prov not in ('-', '') else 'Masyarakat Umum / Dokter'

        if raw in ('', '-', 'None', 'null'):
            return '', 'Tanpa Cabang', '-'

        # Direct override check
        if raw == 'PERSADIA Cabang Kota Bekasi': return 'PERSADIA Cabang Kota Bekasi', 'Jawa Barat', 'Kota Bekasi'
        if raw == 'INORGA - Yayasan Jantung Indonesia Kabupaten Bogor': return 'INORGA - Yayasan Jantung Indonesia Kabupaten Bogor', 'Jawa Barat', 'Kabupaten Bogor'
        if raw == 'PERSADIA Cabang Jakarta Selatan': return 'PERSADIA Cabang Jakarta Selatan', 'DKI Jakarta', 'Kota Jakarta Selatan'
        if raw == 'PERSADIA Cabang Jakarta Timur': return 'PERSADIA Cabang Jakarta Timur', 'DKI Jakarta', 'Kota Jakarta Timur'
        if raw == 'PERSADIA Cabang Cimahi': return 'PERSADIA Cabang Cimahi', 'Jawa Barat', 'Kota Cimahi'
        if raw == 'PERSADIA Cabang Subang': return 'PERSADIA Cabang Subang', 'Jawa Barat', 'Kabupaten Subang'
        if raw == 'PERSADIA Cabang Ciamis': return 'PERSADIA Cabang Ciamis', 'Jawa Barat', 'Kabupaten Ciamis'
        if raw == 'PERSADIA Unit RSCM Cabang Jakarta Pusat': return 'PERSADIA Cabang Jakarta Pusat', 'DKI Jakarta', 'Kota Jakarta Pusat'
        if raw == 'PERSADIA Wilayah Jawa Barat': return 'PERSADIA Wilayah Jawa Barat', 'Jawa Barat', 'Jawa Barat'
        if raw in ('PERSADIA Cabang Pesawaran', 'PERSADIA Cabang Metro', 'PERSADIA Cabang Bandar Lampung', 'PERSADIA Cabang Lampung Selatan', 'PERSADIA Wilayah Lampung'):
            return raw, 'Lampung', raw.replace('PERSADIA Cabang ', '').replace('PERSADIA Wilayah ', '')
        if raw in ('PERSADIA Cabang Makassar', 'PERSADIA Cabang Manado', 'PERSADIA Cabang Balikpapan', 'PERSADIA Cabang Garut', 'PERSADIA Cabang Bali'):
            p = 'Sulawesi Selatan' if 'Makassar' in raw else ('Sulawesi Utara' if 'Manado' in raw else ('Kalimantan Timur' if 'Balikpapan' in raw else ('Bali' if 'Bali' in raw else 'Jawa Barat')))
            return raw, p, raw.replace('PERSADIA Cabang ', '')

        if raw == 'DIID Jakarta': return 'INORGA - DIID DKI Jakarta', 'DKI Jakarta', 'DKI Jakarta'
        if raw == 'Persadia Makasar': return 'PERSADIA Cabang Makassar', 'Sulawesi Selatan', 'Kota Makassar'
        if raw == 'KORMI': return 'INORGA - KORMI', 'Jawa Barat', 'Komunitas / INORGA'
        if raw.lower() == 'bogor': return 'PERSADIA Cabang Bogor', 'Jawa Barat', 'Bogor'

        if raw in mapping:
            p, k = mapping[raw]
            if k == 'Tidak Mengisi Cabang / Umum (-)':
                return '', 'Tanpa Cabang', '-'
            if k == 'Kota Depok': return 'PERSADIA Cabang Kota Depok', p, k
            if k == 'Kota Bekasi': return 'PERSADIA Cabang Kota Bekasi', p, k
            if k == 'Kota/Kabupaten Bogor': return 'PERSADIA Cabang Bogor', p, k
            if k == 'Kabupaten Bogor': return 'PERSADIA Cabang Kabupaten Bogor', p, k
            if k == 'Kota Bogor': return 'PERSADIA Cabang Kota Bogor', p, k
            if k == 'Kota Jakarta Timur': return 'PERSADIA Cabang Jakarta Timur', p, k
            if k == 'Kota Jakarta Selatan': return 'PERSADIA Cabang Jakarta Selatan', p, k
            if k == 'Kota Jakarta Barat': return 'PERSADIA Cabang Jakarta Barat', p, k
            if k == 'Kota Jakarta Pusat': return 'PERSADIA Cabang Jakarta Pusat', p, k
            if k == 'Kota Jakarta Utara': return 'PERSADIA Cabang Jakarta Utara', p, k
            if k == 'DKI Jakarta (Umum)': return 'INORGA - DIID DKI Jakarta', p, k
            if k == 'Kabupaten Sumedang': return 'PERSADIA Cabang Sumedang', p, k
            if k == 'Kabupaten Purwakarta': return 'PERSADIA Cabang Purwakarta', p, k
            if k == 'Kabupaten Ciamis': return 'PERSADIA Cabang Ciamis', p, k
            if k == 'Kabupaten Garut': return 'PERSADIA Cabang Garut', p, k
            if k == 'Kabupaten Cianjur': return 'PERSADIA Cabang Cianjur', p, k
            if k == 'Kabupaten Bandung Barat': return 'PERSADIA Cabang Bandung Barat', p, k
            if k == 'Kota Bandung': return 'PERSADIA Cabang Kota Bandung', p, k
            if k == 'Kabupaten Bandung': return 'PERSADIA Cabang Kabupaten Bandung', p, k
            if k in ('Jawa Barat (Unit Umum)', 'Jawa Barat (Umum / Lainnya)'): return 'PERSADIA Wilayah Jawa Barat', p, k
            if k == 'Kota Manado': return 'PERSADIA Cabang Manado', p, k
            if k == 'Kota Medan': return 'PERSADIA Cabang Medan', p, k
            return f'PERSADIA Cabang {k}', p, k

        return raw, prov, kota

    processed_data = []
    for r in all_rows:
        c_std, p_std, k_std = map_cabang(r)
        row_copy = dict(r)
        row_copy['cabang_persadia_detail'] = r.get('cabang_persadia', '')
        row_copy['cabang_persadia'] = c_std
        row_copy['provinsi_kelompok'] = p_std
        row_copy['kota_kelompok'] = k_std
        processed_data.append(row_copy)

    # Urutkan: Cabang berurutan (non-empty first, empty last), lalu Nama Lengkap
    def sort_key(item):
        c = item['cabang_persadia']
        has_cabang = 0 if c else 1
        return (has_cabang, c, item.get('nama_lengkap', '').lower())

    processed_data.sort(key=sort_key)

    # 1. Tulis CSV Data Peserta Terkelompok
    orig_headers = list(all_rows[0].keys())
    new_headers = []
    for h in orig_headers:
        new_headers.append(h)
        if h == 'cabang_persadia':
            new_headers.append('cabang_persadia_detail')
            new_headers.append('provinsi_kelompok')

    with open(OUTPUT_CSV_DATA, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=new_headers, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(processed_data)
    print(f"Berkas CSV Data Peserta Terkelompok: {OUTPUT_CSV_DATA} ({len(processed_data)} baris)")

    # 2. Rekap Jumlah Peserta per Cabang
    branch_stats = defaultdict(lambda: {'lunas': 0, 'batal': 0, 'menunggu': 0, 'total': 0, 'prov': '', 'kat': ''})
    for r in processed_data:
        c = r['cabang_persadia']
        key = c if c else '[Tanpa Cabang / Masyarakat Umum / Dokter]'
        st = (r.get('status_pembayaran') or '').strip().lower()
        branch_stats[key]['total'] += 1
        branch_stats[key]['prov'] = r['provinsi_kelompok']
        branch_stats[key]['kat'] = r.get('kategori_peserta', '')
        if st == 'lunas':
            branch_stats[key]['lunas'] += 1
        elif st == 'dibatalkan':
            branch_stats[key]['batal'] += 1
        else:
            branch_stats[key]['menunggu'] += 1

    sorted_cabangs = sorted([k for k in branch_stats if k != '[Tanpa Cabang / Masyarakat Umum / Dokter]'], key=lambda k: -branch_stats[k]['total'])
    sorted_cabangs.append('[Tanpa Cabang / Masyarakat Umum / Dokter]')

    total_all = len(processed_data)
    total_lunas = sum(b['lunas'] for b in branch_stats.values())
    total_batal = sum(b['batal'] for b in branch_stats.values())
    total_mnggu = sum(b['menunggu'] for b in branch_stats.values())

    rekap_rows = []
    for idx, cab in enumerate(sorted_cabangs, 1):
        s = branch_stats[cab]
        pct = f"{s['lunas'] / total_lunas * 100:.2f}%" if total_lunas > 0 else "0.00%"
        kat_desc = 'Anggota PERSADIA' if cab != '[Tanpa Cabang / Masyarakat Umum / Dokter]' else 'Masyarakat Umum, Dokter & Mandiri'
        rekap_rows.append({
            'No': idx,
            'Cabang PERSADIA': cab if cab != '[Tanpa Cabang / Masyarakat Umum / Dokter]' else '(Tanpa Cabang / Umum / Dokter)',
            'Wilayah / Provinsi': s['prov'],
            'Kategori Utama': kat_desc,
            'Peserta Lunas (Aktif)': s['lunas'],
            'Peserta Dibatalkan': s['batal'],
            'Menunggu Verifikasi': s['menunggu'],
            'Total Terdaftar': s['total'],
            'Persentase (Lunas)': pct
        })

    rekap_rows.append({
        'No': '',
        'Cabang PERSADIA': 'TOTAL KESELURUHAN',
        'Wilayah / Provinsi': '',
        'Kategori Utama': '',
        'Peserta Lunas (Aktif)': total_lunas,
        'Peserta Dibatalkan': total_batal,
        'Menunggu Verifikasi': total_mnggu,
        'Total Terdaftar': total_all,
        'Persentase (Lunas)': '100.00%'
    })

    rekap_headers = ['No', 'Cabang PERSADIA', 'Wilayah / Provinsi', 'Kategori Utama', 'Peserta Lunas (Aktif)', 'Peserta Dibatalkan', 'Menunggu Verifikasi', 'Total Terdaftar', 'Persentase (Lunas)']
    with open(OUTPUT_CSV_REKAP, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rekap_headers)
        writer.writeheader()
        writer.writerows(rekap_rows)
    print(f"Berkas CSV Rekap Cabang: {OUTPUT_CSV_REKAP} ({len(rekap_rows)} baris)")

    # 3. Bangun Excel XLSX
    def col_letter(col_idx):
        result = ""
        while col_idx > 0:
            col_idx, remainder = divmod(col_idx - 1, 26)
            result = chr(65 + remainder) + result
        return result

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

    # Buat XLSX Rekap Cabang
    wb_rekap_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Rekap Peserta per Cabang" sheetId="1" r:id="rId1"/></sheets>
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
        is_total = (row_dict.get('Cabang PERSADIA') == 'TOTAL KESELURUHAN')
        style_idx = 6 if is_total else (2 if r_idx % 2 == 0 else 0)
        rekap_sheet_lines.append(f'    <row r="{r_idx}" ht="21">')
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
    print(f"Berkas Excel Rekap Cabang: {OUTPUT_XLSX_REKAP}")

    # Buat XLSX Data Peserta Terkelompok
    wb_data_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Data Peserta Terkelompok Cabang" sheetId="1" r:id="rId1"/></sheets>
</workbook>'''

    data_sheet_lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
    data_sheet_lines.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
    data_sheet_lines.append('  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane state="frozen" ySplit="1"/></sheetView></sheetViews>')
    data_sheet_lines.append('  <sheetFormatPr defaultRowHeight="20"/>')
    data_sheet_lines.append('  <sheetData>')

    # Kolom utama yang ditampilkan di Excel
    display_cols = [
        ('No', 'no'),
        ('Cabang PERSADIA (Kelompok)', 'cabang_persadia'),
        ('Cabang / Unit Asli DB', 'cabang_persadia_detail'),
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

    data_sheet_lines.append('    <row r="1" ht="26" customHeight="1">')
    for c_idx, (label, key) in enumerate(display_cols, 1):
        cell_ref = f"{col_letter(c_idx)}1"
        data_sheet_lines.append(f'      <c r="{cell_ref}" s="1" t="inlineStr"><is><t>{escape_xml(label)}</t></is></c>')
    data_sheet_lines.append('    </row>')

    current_cab = None
    cab_toggle = 0
    for r_idx, r in enumerate(processed_data, 2):
        cab_val = r.get('cabang_persadia', '')
        if cab_val != current_cab:
            current_cab = cab_val
            cab_toggle = 1 - cab_toggle

        st = (r.get('status_pembayaran') or '').strip().lower()
        if st == 'dibatalkan':
            style_idx = 4 # Merah muda
        elif cab_toggle == 1:
            style_idx = 2 # Sedikit abu/kontras
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
    print(f"Berkas Excel Data Peserta Terkelompok: {OUTPUT_XLSX_DATA}")

if __name__ == '__main__':
    run()
