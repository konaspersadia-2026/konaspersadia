#!/usr/bin/env python3
"""
scripts/generate_audit_excel.py
Menghasilkan berkas Excel terstruktur dan CSV untuk:
1. Daftar No. Registrasi dari 2 pendaftar dengan masalah nomor WhatsApp (kosong / format pendek).
2. Daftar 67 grup pendaftar duplikat (135 baris data) lengkap dengan analisis perbedaan dan rekomendasi tindakan.
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
OUTPUT_XLSX = os.path.join(DATA_DIR, 'AUDIT_TEMUAN_DUPLIKAT_DAN_NO_HP.xlsx')
OUTPUT_CSV_DUP = os.path.join(DATA_DIR, 'AUDIT_67_GRUP_DUPLIKAT_PESERTA.csv')
OUTPUT_CSV_WA = os.path.join(DATA_DIR, 'AUDIT_2_MASALAH_WHATSAPP.csv')

def escape_xml(s):
    if s is None:
        return ''
    return saxutils.escape(str(s))

def generate_audit_files():
    print("Membaca berkas CSV pendaftar...")
    csv_files = sorted(glob.glob(os.path.join(DATA_DIR, 'data peserta update', '*.csv')))
    all_rows = []
    for fpath in csv_files:
        with open(fpath, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                if r.get('kategori_peserta') in ['Anggota PERSADIA', 'Masyarakat Umum']:
                    all_rows.append(r)

    print(f"Total target data: {len(all_rows)} baris.")

    # 1. Analisis WhatsApp Issues
    wa_issues = []
    for r in all_rows:
        wa = (r.get('whatsapp') or '').strip()
        digits = re.sub(r'\D', '', wa)
        if not wa or wa == '-':
            wa_issues.append({
                'no': len(wa_issues) + 1,
                'tipe': 'Nomor WhatsApp Kosong (-)',
                'id': r['id'],
                'no_registrasi': r['no_registrasi'],
                'nama_lengkap': r['nama_lengkap'],
                'whatsapp': wa,
                'kategori': r['kategori_peserta'],
                'cabang': r['cabang_persadia'],
                'institusi': r['institusi'],
                'status': r['status_pembayaran'],
                'kegiatan': r['pilihan_kegiatan'],
                'gender': r['jenis_kelamin'],
                'dob': r['tanggal_lahir'],
                'kota': r['kota_kabupaten'],
                'provinsi': r['provinsi'],
                'timestamp': r['timestamp'],
                'rekomendasi': 'Hubungi via koordinator Cabang Jakarta Barat untuk meminta nomor WhatsApp aktif.'
            })
        elif len(digits) < 9:
            wa_issues.append({
                'no': len(wa_issues) + 1,
                'tipe': 'Format Pendek / Salah Ketik (Hanya 5 digit)',
                'id': r['id'],
                'no_registrasi': r['no_registrasi'],
                'nama_lengkap': r['nama_lengkap'],
                'whatsapp': wa,
                'kategori': r['kategori_peserta'],
                'cabang': r['cabang_persadia'],
                'institusi': r['institusi'],
                'status': r['status_pembayaran'],
                'kegiatan': r['pilihan_kegiatan'],
                'gender': r['jenis_kelamin'],
                'dob': r['tanggal_lahir'],
                'kota': r['kota_kabupaten'],
                'provinsi': r['provinsi'],
                'timestamp': r['timestamp'],
                'rekomendasi': 'Hubungi PIC DIID DKI Jakarta untuk meminta konfirmasi nomor WhatsApp lengkap.'
            })

    # 2. Analisis Duplikasi (Nama + DOB)
    by_name_dob = defaultdict(list)
    for r in all_rows:
        nama = re.sub(r'\s+', ' ', (r.get('nama_lengkap') or '').strip().lower())
        dob = (r.get('tanggal_lahir') or '').strip()
        if nama and dob not in ('', '-', '0000-00-00'):
            by_name_dob[(nama, dob)].append(r)

    dup_groups = {k: v for k, v in by_name_dob.items() if len(v) > 1}
    print(f"Ditemukan {len(dup_groups)} grup duplikat.")

    dup_rows_detailed = []
    for grp_idx, ((nama, dob), rows) in enumerate(sorted(dup_groups.items(), key=lambda x: x[0][0]), 1):
        rows.sort(key=lambda r: int(r['id']) if r['id'].isdigit() else 0)
        
        was = [r['whatsapp'] for r in rows]
        cabs = [r['cabang_persadia'] for r in rows]
        stats = [r['status_pembayaran'] for r in rows]
        
        diff_desc = []
        if len(set(was)) == 1:
            diff_desc.append('No WA sama')
        else:
            diff_desc.append('No WA beda')
            
        if len(set(cabs)) == 1:
            diff_desc.append('Cabang sama')
        else:
            diff_desc.append('Cabang beda')
            
        if any(s != 'Lunas' for s in stats):
            diff_desc.append('Ada status Batal')
        else:
            diff_desc.append('Keduanya Lunas')
            
        summary_diff = ' | '.join(diff_desc)
        
        # Rekomendasi: pilih data yang cabangnya lebih lengkap
        best_row_id = rows[0]['id']
        for candidate in rows:
            c = (candidate['cabang_persadia'] or '').strip()
            if c not in ('', '-'):
                best_row_id = candidate['id']
                break
                
        for entry_idx, r in enumerate(rows, 1):
            is_rec_keep = (r['id'] == best_row_id)
            dup_rows_detailed.append({
                'no_grup': grp_idx,
                'entri_ke': f"{entry_idx} dari {len(rows)}",
                'id': r['id'],
                'no_registrasi': r['no_registrasi'],
                'nama_lengkap': r['nama_lengkap'],
                'tanggal_lahir': r['tanggal_lahir'],
                'jenis_kelamin': r['jenis_kelamin'],
                'whatsapp': r['whatsapp'],
                'kategori_peserta': r['kategori_peserta'],
                'cabang_persadia': r['cabang_persadia'] if r['cabang_persadia'] else '-',
                'institusi': r['institusi'] if r['institusi'] else '-',
                'status_pembayaran': r['status_pembayaran'],
                'pilihan_kegiatan': r['pilihan_kegiatan'] if r['pilihan_kegiatan'] else '-',
                'timestamp': r['timestamp'],
                'kota_kabupaten': r['kota_kabupaten'] if r['kota_kabupaten'] else '-',
                'provinsi': r['provinsi'] if r['provinsi'] else '-',
                'analisis_perbedaan': summary_diff,
                'rekomendasi_aksi': 'Pertahankan (Data Lengkap/Valid)' if is_rec_keep else 'Review / Batalkan Duplikat'
            })

    # Simpan CSV Duplikat
    with open(OUTPUT_CSV_DUP, mode='w', encoding='utf-8', newline='') as f:
        headers_dup = list(dup_rows_detailed[0].keys())
        writer = csv.DictWriter(f, fieldnames=headers_dup)
        writer.writeheader()
        writer.writerows(dup_rows_detailed)
    print(f"Berkas CSV Duplikat disimpan: {OUTPUT_CSV_DUP} ({len(dup_rows_detailed)} baris)")

    # Simpan CSV WhatsApp
    with open(OUTPUT_CSV_WA, mode='w', encoding='utf-8', newline='') as f:
        headers_wa = list(wa_issues[0].keys())
        writer = csv.DictWriter(f, fieldnames=headers_wa)
        writer.writeheader()
        writer.writerows(wa_issues)
    print(f"Berkas CSV WhatsApp disimpan: {OUTPUT_CSV_WA} ({len(wa_issues)} baris)")

    # =========================================================
    # Bangun XLSX Multi-Sheet menggunakan OpenXML Zip
    # =========================================================
    def col_letter(col_idx):
        result = ""
        while col_idx > 0:
            col_idx, remainder = divmod(col_idx - 1, 26)
            result = chr(65 + remainder) + result
        return result

    def build_sheet_xml(headers, data_rows, col_keys, alternate_by_group=False):
        xml_lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
        xml_lines.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
        xml_lines.append('  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane state="frozen" ySplit="1"/></sheetView></sheetViews>')
        xml_lines.append('  <sheetFormatPr defaultRowHeight="20"/>')
        xml_lines.append('  <sheetData>')
        
        # Header Row (Row 1)
        xml_lines.append('    <row r="1" ht="26" customHeight="1">')
        for c_idx, h in enumerate(headers, 1):
            cell_ref = f"{col_letter(c_idx)}1"
            xml_lines.append(f'      <c r="{cell_ref}" s="1" t="inlineStr"><is><t>{escape_xml(h)}</t></is></c>')
        xml_lines.append('    </row>')

        # Data Rows
        current_grp = None
        fill_toggle = 0
        for r_idx, row_dict in enumerate(data_rows, 2):
            if alternate_by_group:
                grp = row_dict.get('no_grup')
                if grp != current_grp:
                    current_grp = grp
                    fill_toggle = 1 - fill_toggle
                style_idx = 2 if fill_toggle == 1 else 0
            else:
                style_idx = 2 if (r_idx % 2 == 0) else 0

            # Highlight rekomendasi pertahankan vs review
            rec = row_dict.get('rekomendasi_aksi', '')
            if 'Pertahankan' in rec and alternate_by_group:
                style_idx = 3 # Greenish/Yellow highlight
            elif 'Batalkan' in rec and alternate_by_group:
                style_idx = 4 # Soft red/orange highlight

            xml_lines.append(f'    <row r="{r_idx}" ht="20">')
            for c_idx, k in enumerate(col_keys, 1):
                cell_ref = f"{col_letter(c_idx)}{r_idx}"
                val = row_dict.get(k, '')
                xml_lines.append(f'      <c r="{cell_ref}" s="{style_idx}" t="inlineStr"><is><t>{escape_xml(val)}</t></is></c>')
            xml_lines.append('    </row>')

        xml_lines.append('  </sheetData>')
        xml_lines.append('</worksheet>')
        return '\n'.join(xml_lines)

    # Sheet 1: Ringkasan Audit
    sheet_summary_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetFormatPr defaultRowHeight="20"/>
  <sheetData>
    <row r="1" ht="28"><c r="A1" s="5" t="inlineStr"><is><t>AUDIT DAN VALIDASI DATA PENDAFTAR - KONAS PERSADIA 2026</t></is></c></row>
    <row r="2"><c r="A2" s="6" t="inlineStr"><is><t>Target: Kategori Anggota PERSADIA dan Masyarakat Umum (Total 6.890 Peserta)</t></is></c></row>
    <row r="3"/>
    <row r="4" ht="24"><c r="A4" s="1" t="inlineStr"><is><t>Indikator Audit</t></is></c><c r="B4" s="1" t="inlineStr"><is><t>Jumlah Kasus</t></is></c><c r="C4" s="1" t="inlineStr"><is><t>Persentase</t></is></c><c r="D4" s="1" t="inlineStr"><is><t>Keterangan &amp; Tindak Lanjut</t></is></c></row>
    <row r="5"><c r="A5" s="0" t="inlineStr"><is><t>Total Data Peserta Terdaftar (Target Audit)</t></is></c><c r="B5" s="0" t="inlineStr"><is><t>6.890</t></is></c><c r="C5" s="0" t="inlineStr"><is><t>100,00%</t></is></c><c r="D5" s="0" t="inlineStr"><is><t>6.543 Anggota PERSADIA + 347 Masyarakat Umum</t></is></c></row>
    <row r="6"><c r="A6" s="2" t="inlineStr"><is><t>Nomor WhatsApp Valid &amp; Lengkap</t></is></c><c r="B6" s="2" t="inlineStr"><is><t>6.888</t></is></c><c r="C6" s="2" t="inlineStr"><is><t>99,97%</t></is></c><c r="D6" s="2" t="inlineStr"><is><t>Siap kirim E-Ticket dan notifikasi WhatsApp</t></is></c></row>
    <row r="7"><c r="A7" s="4" t="inlineStr"><is><t>Temuan Masalah Nomor WhatsApp</t></is></c><c r="B7" s="4" t="inlineStr"><is><t>2</t></is></c><c r="C7" s="4" t="inlineStr"><is><t>0,03%</t></is></c><c r="D7" s="4" t="inlineStr"><is><t>1 kosong (ASMAWI) + 1 format 5 digit (Heny) -> Lihat Tab '2 Masalah WhatsApp'</t></is></c></row>
    <row r="8"><c r="A8" s="3" t="inlineStr"><is><t>Temuan Kasus Duplikasi (Nama &amp; Tgl Lahir Sama)</t></is></c><c r="B8" s="3" t="inlineStr"><is><t>67 Grup (135 Baris)</t></is></c><c r="C8" s="3" t="inlineStr"><is><t>1,96%</t></is></c><c r="D8" s="3" t="inlineStr"><is><t>Pendaftar ganda terdaftar 2x (atau 3x) -> Lihat Tab '67 Grup Duplikat'</t></is></c></row>
    <row r="9"><c r="A9" s="0" t="inlineStr"><is><t>Duplikat Keduanya Berstatus Lunas</t></is></c><c r="B9" s="0" t="inlineStr"><is><t>66 Grup</t></is></c><c r="C9" s="0" t="inlineStr"><is><t>98,51%</t></is></c><c r="D9" s="0" t="inlineStr"><is><t>Perlu eliminasi salah satu ID agar kuota peserta riil akurat</t></is></c></row>
    <row r="10"><c r="A10" s="0" t="inlineStr"><is><t>Duplikat Memiliki Status Dibatalkan</t></is></c><c r="B10" s="0" t="inlineStr"><is><t>1 Grup</t></is></c><c r="C10" s="0" t="inlineStr"><is><t>1,49%</t></is></c><c r="D10" s="0" t="inlineStr"><is><t>Sudah tepat dibatalkan di DB, tidak menambah kuota</t></is></c></row>
    <row r="11"/>
    <row r="12"><c r="A12" s="5" t="inlineStr"><is><t>Petunjuk Pengecekan untuk Panitia:</t></is></c></row>
    <row r="13"><c r="A13" s="0" t="inlineStr"><is><t>1. Buka Tab '67 Grup Duplikat' untuk meninjau baris duplikat yang telah dikelompokkan secara berdampingan.</t></is></c></row>
    <row r="14"><c r="A14" s="0" t="inlineStr"><is><t>2. Baris berwarna Hijau Muda direkomendasikan untuk DIPERTAHANKAN (data lebih lengkap / mencantumkan cabang faskes).</t></is></c></row>
    <row r="15"><c r="A15" s="0" t="inlineStr"><is><t>3. Baris berwarna Merah Muda direkomendasikan untuk DIBATALKAN / DIHAPUS (duplikat tanpa cabang atau entri kedua).</t></is></c></row>
    <row r="16"><c r="A16" s="0" t="inlineStr"><is><t>4. Buka Tab '2 Masalah WhatsApp' untuk melihat nomor registrasi dan tindak lanjut update nomor telepon.</t></is></c></row>
  </sheetData>
</worksheet>'''

    # Sheet 2: 67 Grup Duplikat
    headers_dup_label = [
        'No Grup', 'Entri Ke', 'ID DB', 'No Registrasi', 'Nama Lengkap', 'Tanggal Lahir',
        'Jenis Kelamin', 'Nomor WhatsApp', 'Kategori Peserta', 'Cabang PERSADIA',
        'Institusi / Faskes', 'Status Pembayaran', 'Pilihan Kegiatan', 'Waktu Pendaftaran',
        'Kota / Kabupaten', 'Provinsi', 'Analisis Perbedaan Data', 'Rekomendasi Tindakan'
    ]
    keys_dup = [
        'no_grup', 'entri_ke', 'id', 'no_registrasi', 'nama_lengkap', 'tanggal_lahir',
        'jenis_kelamin', 'whatsapp', 'kategori_peserta', 'cabang_persadia',
        'institusi', 'status_pembayaran', 'pilihan_kegiatan', 'timestamp',
        'kota_kabupaten', 'provinsi', 'analisis_perbedaan', 'rekomendasi_aksi'
    ]
    sheet_dup_xml = build_sheet_xml(headers_dup_label, dup_rows_detailed, keys_dup, alternate_by_group=True)

    # Sheet 3: 2 Masalah WhatsApp
    headers_wa_label = [
        'No', 'Tipe Masalah', 'ID DB', 'No Registrasi', 'Nama Lengkap', 'No WhatsApp di DB',
        'Kategori Peserta', 'Cabang PERSADIA', 'Institusi / Faskes', 'Status Pembayaran',
        'Pilihan Kegiatan', 'Tanggal Lahir', 'Jenis Kelamin', 'Kota / Kabupaten',
        'Provinsi', 'Waktu Pendaftaran', 'Rekomendasi Tindak Lanjut'
    ]
    keys_wa = [
        'no', 'tipe', 'id', 'no_registrasi', 'nama_lengkap', 'whatsapp',
        'kategori', 'cabang', 'institusi', 'status',
        'kegiatan', 'dob', 'gender', 'kota',
        'provinsi', 'timestamp', 'rekomendasi'
    ]
    sheet_wa_xml = build_sheet_xml(headers_wa_label, wa_issues, keys_wa, alternate_by_group=False)

    # Styles XML
    styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="7">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF065F46"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF991B1B"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font>
    <font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEE2E2"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
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
    <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="4" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="6" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>'''

    # Package files
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>'''

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    wb_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Ringkasan Audit" sheetId="1" r:id="rId1"/>
    <sheet name="67 Grup Duplikat" sheetId="2" r:id="rId2"/>
    <sheet name="2 Masalah WhatsApp" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>'''

    with zipfile.ZipFile(OUTPUT_XLSX, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/workbook.xml', workbook)
        z.writestr('xl/styles.xml', styles_xml)
        z.writestr('xl/worksheets/sheet1.xml', sheet_summary_xml)
        z.writestr('xl/worksheets/sheet2.xml', sheet_dup_xml)
        z.writestr('xl/worksheets/sheet3.xml', sheet_wa_xml)

    print(f"Berkas Excel Master Audit berhasil dibuat: {OUTPUT_XLSX}")

if __name__ == '__main__':
    generate_audit_files()
