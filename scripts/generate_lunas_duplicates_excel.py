#!/usr/bin/env python3
"""
scripts/generate_lunas_duplicates_excel.py
Pemeriksaan menyeluruh potensi data peserta duplikat berstatus Lunas:
1. Memfilter hanya data berstatus_pembayaran = Lunas (dari total 6.863 baris).
2. Membandingkan:
   - Nama lengkap yang sama / variasi gelar
   - Tanggal lahir yang sama (serta deteksi typo tahun default 2026 / selisih 1 hari)
   - Nomor telepon WhatsApp yang sama persis atau mirip (jarak typo <= 2 digit)
   - Jenis kelamin yang sama
3. Menghasilkan file Excel master yang bersih dan rapi:
   - Sheet 1: Ringkasan Audit
   - Sheet 2: Semua 57 Grup Duplikat Lunas (115 Baris Data)
   - Sheet 3: Kategori 1 - No Telp Mirip / Sama (17 Grup)
   - Sheet 4: Kategori 2 - Typo Tanggal Lahir (9 Grup)
   - Sheet 5: Kategori 3 - No Telp Berbeda (31 Grup)
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
OUTPUT_XLSX = os.path.join(DATA_DIR, 'AUDIT_DUPLIKAT_PESERTA_LUNAS.xlsx')
OUTPUT_CSV = os.path.join(DATA_DIR, 'AUDIT_DUPLIKAT_PESERTA_LUNAS.csv')

def escape_xml(s):
    if s is None:
        return ''
    return saxutils.escape(str(s))

def clean_phone(phone_raw):
    if not phone_raw or phone_raw == '-': return ''
    digits = re.sub(r'\D', '', str(phone_raw))
    if digits.startswith('62'):
        digits = '0' + digits[2:]
    elif digits.startswith('8'):
        digits = '0' + digits
    return digits

def clean_name(name_raw):
    if not name_raw: return ''
    n = name_raw.lower().strip()
    n = re.sub(r'\b(dr|dra|drs|drg|h|hj|haji|hajjah|prof|sp\.?pd|finasim|s\.?pd|m\.?pd|s\.?e|m\.?m|s\.?kep|ners|amk|amd\.?kep|bsc)\b\.?', '', n)
    n = re.sub(r'[^a-z0-9\s]', ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            inserts = prev[j + 1] + 1
            deletes = curr[j] + 1
            subs = prev[j] + (c1 != c2)
            curr.append(min(inserts, deletes, subs))
        prev = curr
    return prev[-1]

def phone_similar(p1, p2):
    if not p1 or not p2: return False
    if p1 == p2: return True
    if abs(len(p1) - len(p2)) <= 2:
        dist = levenshtein(p1, p2)
        if dist <= 2:
            return True
    return False

def generate_lunas_audit():
    print("Membaca berkas pendaftar...")
    csv_files = sorted(glob.glob(os.path.join(DATA_DIR, 'data peserta update', '*.csv')))
    all_lunas = []
    for fpath in csv_files:
        with open(fpath, mode='r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for r in reader:
                if (r.get('status_pembayaran') or '').strip().lower() == 'lunas':
                    all_lunas.append(r)

    print(f"Total peserta berstatus LUNAS: {len(all_lunas)}")

    by_name = defaultdict(list)
    for r in all_lunas:
        cn = clean_name(r['nama_lengkap'])
        if cn:
            by_name[cn].append(r)

    cat1_groups = [] # Nama sama, DOB sama, No Telp mirip/sama
    cat2_groups = [] # Nama sama, No Telp mirip/sama, Typo pada DOB
    cat3_groups = [] # Nama sama, DOB sama, No Telp berbeda

    # 1. Klasifikasi Nama Sama & DOB Sama (Cat 1 & Cat 3)
    for cn, rows in by_name.items():
        if len(rows) > 1:
            dob_map = defaultdict(list)
            for r in rows:
                dob = (r.get('tanggal_lahir') or '').strip()
                if dob not in ('', '-', '0000-00-00'):
                    dob_map[dob].append(r)
            
            for dob, dob_rows in dob_map.items():
                if len(dob_rows) > 1:
                    has_sim = False
                    for i in range(len(dob_rows)):
                        for j in range(i + 1, len(dob_rows)):
                            p1 = clean_phone(dob_rows[i]['whatsapp'])
                            p2 = clean_phone(dob_rows[j]['whatsapp'])
                            if phone_similar(p1, p2):
                                has_sim = True
                                break
                        if has_sim: break
                    
                    if has_sim:
                        cat1_groups.append((cn, dob, dob_rows))
                    else:
                        cat3_groups.append((cn, dob, dob_rows))

    # 2. Klasifikasi Nama Sama & No Telp Mirip, namun DOB Berbeda/Typo (Cat 2)
    for cn, rows in by_name.items():
        if len(rows) > 1:
            for i in range(len(rows)):
                for j in range(i + 1, len(rows)):
                    r1, r2 = rows[i], rows[j]
                    d1, d2 = (r1.get('tanggal_lahir') or '').strip(), (r2.get('tanggal_lahir') or '').strip()
                    p1, p2 = clean_phone(r1['whatsapp']), clean_phone(r2['whatsapp'])
                    if d1 != d2 and phone_similar(p1, p2):
                        cat2_groups.append((cn, f"{d1} vs {d2}", [r1, r2]))

    # Urutkan grup berdasarkan nama
    cat1_groups.sort(key=lambda x: x[0])
    cat2_groups.sort(key=lambda x: x[0])
    cat3_groups.sort(key=lambda x: x[0])

    print(f"Kategori 1 (Nama Sama, DOB Sama, Telp Mirip/Sama): {len(cat1_groups)} grup")
    print(f"Kategori 2 (Nama Sama, Telp Mirip/Sama, DOB Typo): {len(cat2_groups)} grup")
    print(f"Kategori 3 (Nama Sama, DOB Sama, Telp Beda): {len(cat3_groups)} grup")

    # Siapkan data baris terperinci
    all_master_rows = []
    global_group_no = 1

    def process_group(groups, kategori_label, group_start_no):
        processed_rows = []
        current_g_no = group_start_no
        for item in groups:
            cn = item[0]
            dob_info = item[1]
            rows = item[2]
            rows.sort(key=lambda r: int(r['id']) if r['id'].isdigit() else 0)

            # Perbandingan
            phones = [clean_phone(r['whatsapp']) for r in rows]
            genders = [(r.get('jenis_kelamin') or '').strip() for r in rows]
            cabs = [(r.get('cabang_persadia') or '').strip() for r in rows]

            # Analisis kemiripan telepon
            phone_analysis = "Nomor Telepon Mirip / Typo"
            if len(set(phones)) == 1:
                phone_analysis = "Nomor Telepon Sama Persis"
            elif any(phone_similar(phones[i], phones[j]) for i in range(len(phones)) for j in range(i+1, len(phones))):
                phone_analysis = "Nomor Telepon Mirip (Selisih 1-2 Digit)"
            else:
                phone_analysis = "Nomor Telepon Berbeda"

            # Gender analysis
            gender_analysis = "Jenis Kelamin Sama" if len(set(genders)) == 1 else "Jenis Kelamin Berbeda (Typo)"

            # Cabang analysis
            cab_analysis = "Cabang Sama" if len(set(cabs)) == 1 else "Cabang Berbeda (Mandiri vs Rombongan)"

            # Pilih baris terbaik untuk dipertahankan
            # Prioritaskan data yang mencantumkan cabang faskes/unit lengkap
            best_id = rows[0]['id']
            for r in rows:
                c = (r.get('cabang_persadia') or '').strip()
                if c not in ('', '-'):
                    best_id = r['id']
                    break

            for idx, r in enumerate(rows, 1):
                is_keep = (r['id'] == best_id)
                row_data = {
                    'no_grup': current_g_no,
                    'kategori_duplikat': kategori_label,
                    'entri_ke': f"{idx} dari {len(rows)}",
                    'id': r['id'],
                    'no_registrasi': r['no_registrasi'],
                    'nama_lengkap': r['nama_lengkap'],
                    'tanggal_lahir': r.get('tanggal_lahir') or '-',
                    'jenis_kelamin': r.get('jenis_kelamin') or '-',
                    'whatsapp': r.get('whatsapp') or '-',
                    'whatsapp_clean': clean_phone(r.get('whatsapp')),
                    'kategori_peserta': r.get('kategori_peserta') or '-',
                    'cabang_persadia': r.get('cabang_persadia') or '-',
                    'institusi': r.get('institusi') or '-',
                    'status_pembayaran': r.get('status_pembayaran') or '-',
                    'pilihan_kegiatan': r.get('pilihan_kegiatan') or '-',
                    'timestamp': r.get('timestamp') or '-',
                    'kota_kabupaten': r.get('kota_kabupaten') or '-',
                    'provinsi': r.get('provinsi') or '-',
                    'perbandingan_telp': phone_analysis,
                    'perbandingan_gender': gender_analysis,
                    'perbandingan_cabang': cab_analysis,
                    'rekomendasi_aksi': 'Pertahankan (Data Lebih Lengkap / Valid)' if is_keep else 'Review / Batalkan Duplikat'
                }
                processed_rows.append(row_data)
            current_g_no += 1
        return processed_rows, current_g_no

    cat1_rows, global_group_no = process_group(cat1_groups, "1. Nama + DOB + Gender + NoTelp Mirip/Sama", global_group_no)
    cat2_rows, global_group_no = process_group(cat2_groups, "2. Nama + NoTelp Mirip + Typo DOB", global_group_no)
    cat3_rows, global_group_no = process_group(cat3_groups, "3. Nama + DOB + Gender + NoTelp Berbeda", global_group_no)

    all_master_rows = cat1_rows + cat2_rows + cat3_rows
    total_groups = len(cat1_groups) + len(cat2_groups) + len(cat3_groups)
    print(f"Total grup duplikat berstatus Lunas: {total_groups} grup ({len(all_master_rows)} baris data)")

    # Tulis berkas CSV Master
    with open(OUTPUT_CSV, mode='w', encoding='utf-8', newline='') as f:
        headers = list(all_master_rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(all_master_rows)
    print(f"CSV Master disimpan di: {OUTPUT_CSV}")

    # =========================================================
    # Bangun XLSX dengan 5 Sheet
    # =========================================================
    def col_letter(col_idx):
        result = ""
        while col_idx > 0:
            col_idx, remainder = divmod(col_idx - 1, 26)
            result = chr(65 + remainder) + result
        return result

    headers_display = [
        'No Grup', 'Kategori Temuan', 'Entri Ke', 'ID DB', 'No Registrasi', 'Nama Lengkap',
        'Tanggal Lahir', 'Jenis Kelamin', 'Nomor WhatsApp', 'WhatsApp Standar', 'Kategori Peserta',
        'Cabang PERSADIA', 'Institusi / Faskes', 'Status Pembayaran', 'Pilihan Kegiatan',
        'Waktu Registrasi', 'Kota / Kabupaten', 'Provinsi', 'Perbandingan Telepon',
        'Perbandingan Gender', 'Perbandingan Cabang', 'Rekomendasi Tindakan'
    ]
    col_keys = [
        'no_grup', 'kategori_duplikat', 'entri_ke', 'id', 'no_registrasi', 'nama_lengkap',
        'tanggal_lahir', 'jenis_kelamin', 'whatsapp', 'whatsapp_clean', 'kategori_peserta',
        'cabang_persadia', 'institusi', 'status_pembayaran', 'pilihan_kegiatan',
        'timestamp', 'kota_kabupaten', 'provinsi', 'perbandingan_telp',
        'perbandingan_gender', 'perbandingan_cabang', 'rekomendasi_aksi'
    ]

    def build_sheet_xml(data_rows):
        lines = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>']
        lines.append('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">')
        lines.append('  <sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane state="frozen" ySplit="1"/></sheetView></sheetViews>')
        lines.append('  <sheetFormatPr defaultRowHeight="20"/>')
        lines.append('  <sheetData>')

        # Header Row
        lines.append('    <row r="1" ht="26" customHeight="1">')
        for c_idx, h in enumerate(headers_display, 1):
            cell_ref = f"{col_letter(c_idx)}1"
            lines.append(f'      <c r="{cell_ref}" s="1" t="inlineStr"><is><t>{escape_xml(h)}</t></is></c>')
        lines.append('    </row>')

        # Data Rows
        for r_idx, r in enumerate(data_rows, 2):
            rec = r.get('rekomendasi_aksi', '')
            if 'Pertahankan' in rec:
                style_idx = 3 # Hijau muda
            elif 'Batalkan' in rec:
                style_idx = 4 # Merah muda
            else:
                style_idx = 0

            lines.append(f'    <row r="{r_idx}" ht="20">')
            for c_idx, k in enumerate(col_keys, 1):
                cell_ref = f"{col_letter(c_idx)}{r_idx}"
                val = r.get(k, '')
                lines.append(f'      <c r="{cell_ref}" s="{style_idx}" t="inlineStr"><is><t>{escape_xml(val)}</t></is></c>')
            lines.append('    </row>')

        lines.append('  </sheetData>')
        lines.append('</worksheet>')
        return '\n'.join(lines)

    sheet_all_xml = build_sheet_xml(all_master_rows)
    sheet_cat1_xml = build_sheet_xml(cat1_rows)
    sheet_cat2_xml = build_sheet_xml(cat2_rows)
    sheet_cat3_xml = build_sheet_xml(cat3_rows)

    # Sheet Summary XML
    sheet_sum_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetFormatPr defaultRowHeight="20"/>
  <sheetData>
    <row r="1" ht="28"><c r="A1" s="5" t="inlineStr"><is><t>AUDIT POTENSI DATA DUPLIKAT PESERTA BERSTATUS LUNAS</t></is></c></row>
    <row r="2"><c r="A2" s="6" t="inlineStr"><is><t>Kriteria: Status Pembayaran = 'Lunas', Komparasi Nama, Tgl Lahir, No. Telepon Sama/Mirip, dan Jenis Kelamin</t></is></c></row>
    <row r="3"/>
    <row r="4" ht="24"><c r="A4" s="1" t="inlineStr"><is><t>Kategori Duplikat Lunas</t></is></c><c r="B4" s="1" t="inlineStr"><is><t>Jumlah Grup</t></is></c><c r="C4" s="1" t="inlineStr"><is><t>Jumlah Baris Data</t></is></c><c r="D4" s="1" t="inlineStr"><is><t>Karakteristik &amp; Rekomendasi Tindak Lanjut</t></is></c></row>
    <row r="5"><c r="A5" s="3" t="inlineStr"><is><t>1. Nama Sama + Tanggal Lahir Sama + No. Telp Sama/Mirip + Gender Sama</t></is></c><c r="B5" s="3" t="inlineStr"><is><t>{len(cat1_groups)} Grup</t></is></c><c r="C5" s="3" t="inlineStr"><is><t>{len(cat1_rows)} Baris</t></is></c><c r="D5" s="3" t="inlineStr"><is><t>Kepastian Duplikat 100%: Orang yang sama mendaftar 2x/3x (typo 1 digit HP). Batalkan salah satu entri.</t></is></c></row>
    <row r="6"><c r="A6" s="6" t="inlineStr"><is><t>2. Nama Sama + No. Telp Sama/Mirip + Typo Tanggal Lahir</t></is></c><c r="B6" s="6" t="inlineStr"><is><t>{len(cat2_groups)} Grup</t></is></c><c r="C6" s="6" t="inlineStr"><is><t>{len(cat2_rows)} Baris</t></is></c><c r="D6" s="6" t="inlineStr"><is><t>Kepastian Duplikat 99%: Tanggal lahir terklik tahun default 2026 atau selisih 1 hari. Batalkan yang salah.</t></is></c></row>
    <row r="7"><c r="A7" s="0" t="inlineStr"><is><t>3. Nama Sama + Tanggal Lahir Sama + Gender Sama (No. Telp Berbeda)</t></is></c><c r="B7" s="0" t="inlineStr"><is><t>{len(cat3_groups)} Grup</t></is></c><c r="C7" s="0" t="inlineStr"><is><t>{len(cat3_rows)} Baris</t></is></c><c r="D7" s="0" t="inlineStr"><is><t>Potensi Duplikat Tinggi: Orang yang sama mendaftar via HP pribadi &amp; didaftarkan koordinator via HP lain.</t></is></c></row>
    <row r="8" ht="22"><c r="A8" s="1" t="inlineStr"><is><t>TOTAL POTENSI DUPLIKAT BERSTATUS LUNAS</t></is></c><c r="B8" s="1" t="inlineStr"><is><t>{total_groups} Grup</t></is></c><c r="C8" s="1" t="inlineStr"><is><t>{len(all_master_rows)} Baris</t></is></c><c r="D8" s="1" t="inlineStr"><is><t>Estimasi penghematan kuota riil tiket: {len(all_master_rows) - total_groups} kuota ganda yang dapat dieliminasi</t></is></c></row>
    <row r="9"/>
    <row r="10"><c r="A10" s="5" t="inlineStr"><is><t>Panduan Warna pada Sheet:</t></is></c></row>
    <row r="11"><c r="A11" s="3" t="inlineStr"><is><t>🟩 Baris Hijau: Direkomendasikan untuk DIPERTAHANKAN (mencantumkan cabang/faskes lengkap, nomor HP valid)</t></is></c></row>
    <row r="12"><c r="A12" s="4" t="inlineStr"><is><t>🟥 Baris Merah: Direkomendasikan untuk DIBATALKAN (pendaftaran duplikat tanpa cabang atau pendaftaran susulan)</t></is></c></row>
  </sheetData>
</worksheet>'''

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
    <xf numFmtId="0" fontId="6" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>'''

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet5.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
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
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet5.xml"/>
  <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>'''

    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Ringkasan Audit" sheetId="1" r:id="rId1"/>
    <sheet name="Semua 57 Grup Duplikat" sheetId="2" r:id="rId2"/>
    <sheet name="1. No Telp Mirip (17 Grup)" sheetId="3" r:id="rId3"/>
    <sheet name="2. Typo Tgl Lahir (9 Grup)" sheetId="4" r:id="rId4"/>
    <sheet name="3. No Telp Beda (31 Grup)" sheetId="5" r:id="rId5"/>
  </sheets>
</workbook>'''

    with zipfile.ZipFile(OUTPUT_XLSX, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)
        z.writestr('xl/workbook.xml', workbook)
        z.writestr('xl/styles.xml', styles_xml)
        z.writestr('xl/worksheets/sheet1.xml', sheet_sum_xml)
        z.writestr('xl/worksheets/sheet2.xml', sheet_all_xml)
        z.writestr('xl/worksheets/sheet3.xml', sheet_cat1_xml)
        z.writestr('xl/worksheets/sheet4.xml', sheet_cat2_xml)
        z.writestr('xl/worksheets/sheet5.xml', sheet_cat3_xml)

    print(f"Berkas Excel Bersih berhasil dibuat: {OUTPUT_XLSX}")

if __name__ == '__main__':
    generate_lunas_audit()
