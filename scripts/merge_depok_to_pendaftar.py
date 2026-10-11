#!/usr/bin/env python3
"""
scripts/merge_depok_to_pendaftar.py
=============================================================================
Memproses data peserta WDD & HKN 2026 Depok (2.750 orang) dari:
  Data peserta/DATA_PESERTA_WDD_HKN_2026_DEPOK_TERSTRUKTUR_RAPI.xlsx
Dan memetakannya ke format tabel `pendaftar` Supabase (38 kolom) sesuai
struktur referensi:
  Data peserta/pendaftar_rows(3).csv

Menghasilkan:
1. Data peserta/pendaftar_depok_siap_import_supabase.csv
   (Khusus 2.750 data baru Depok untuk langsung diimpor ke Supabase Table Editor)
2. Data peserta/pendaftar_rows(3)_gabungan.csv
   (Gabungan 2.888 data lama + 2.750 data baru = 5.638 data)
3. Data peserta/pendaftar_rows(3).xlsx
   (File Excel multi-tab dengan:
    - Tab 1: "pendaftar_rows(3)" [2.888 baris data eksisting]
    - Tab 2: "pendaftar_depok_baru" [2.750 baris data Depok]
    - Tab 3: "pendaftar_gabungan_semua" [5.638 baris gabungan])
=============================================================================
"""

import os
import re
import csv
import io
import random
import zipfile
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_SRC = os.path.join(BASE_DIR, 'Data peserta', 'pendaftar_rows(3).csv')
XLSX_DEPOK = os.path.join(BASE_DIR, 'Data peserta', 'DATA_PESERTA_WDD_HKN_2026_DEPOK_TERSTRUKTUR_RAPI.xlsx')

OUT_CSV_DEPOK = os.path.join(BASE_DIR, 'Data peserta', 'pendaftar_depok_siap_import_supabase.csv')
OUT_CSV_GABUNGAN = os.path.join(BASE_DIR, 'Data peserta', 'pendaftar_rows(3)_gabungan.csv')
OUT_XLSX_MULTITAB = os.path.join(BASE_DIR, 'Data peserta', 'pendaftar_rows(3).xlsx')

def col_letter(col_idx):
    res = ''
    while col_idx >= 0:
        res = chr(col_idx % 26 + 65) + res
        col_idx = col_idx // 26 - 1
    return res

def clean_phone(raw_phone):
    if not raw_phone or raw_phone.strip() in ['-', '', 'None']:
        return '-'
    digits = re.sub(r'\D', '', raw_phone)
    if digits.startswith('62'):
        digits = '0' + digits[2:]
    elif not digits.startswith('0') and len(digits) >= 8:
        digits = '0' + digits
    return digits if len(digits) >= 8 else raw_phone.strip()

def build_sheet_xml(headers, rows):
    out = io.StringIO()
    out.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n')
    out.write('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n')
    
    # Auto column widths
    out.write('  <cols>\n')
    for ci in range(len(headers)):
        col_num = ci + 1
        width = 18
        if ci in [0, 9]: width = 10 # id, total_tagihan
        elif ci in [1, 16]: width = 28 # timestamp, waktu_registrasi_onsite
        elif ci == 2: width = 20 # no_registrasi
        elif ci == 4: width = 26 # nama_lengkap
        elif ci in [5, 6]: width = 22 # email, whatsapp
        elif ci in [7, 8]: width = 22 # kategori_peserta, pilihan_kegiatan
        elif ci == 12: width = 45 # cabang_persadia
        elif ci == 36: width = 36 # nama_ketua_cabang
        out.write(f'    <col min="{col_num}" max="{col_num}" width="{width}" customWidth="1"/>\n')
    out.write('  </cols>\n')
    
    out.write('  <sheetData>\n')
    # Header
    out.write('    <row r="1">\n')
    for ci, h in enumerate(headers):
        ref = f'{col_letter(ci)}1'
        out.write(f'      <c r="{ref}" t="inlineStr"><is><t>{escape(str(h))}</t></is></c>\n')
    out.write('    </row>\n')
    
    # Rows
    for ri, row in enumerate(rows, start=2):
        out.write(f'    <row r="{ri}">\n')
        for ci, val in enumerate(row):
            if val == '' or val is None:
                continue
            ref = f'{col_letter(ci)}{ri}'
            val_str = str(val)
            out.write(f'      <c r="{ref}" t="inlineStr"><is><t>{escape(val_str)}</t></is></c>\n')
        out.write('    </row>\n')
    
    out.write('  </sheetData>\n')
    out.write('</worksheet>\n')
    return out.getvalue().encode('utf-8')

def main():
    print("=" * 70)
    print("MEMULAI PROSES KONVERSI & PENGGABUNGAN DATA PESERTA DEPOK KE TABEL PENDAFTAR")
    print("=" * 70)

    # 1. Baca data eksisting pendaftar_rows(3).csv
    print(f"\n1. Membaca data referensi: {CSV_SRC}")
    with open(CSV_SRC, mode='r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        existing_rows = list(reader)

    print(f"   -> Kolom header: {len(header)} kolom")
    print(f"   -> Baris data eksisting: {len(existing_rows)} baris")

    existing_ids = set()
    for r in existing_rows:
        if r[0].isdigit():
            existing_ids.add(int(r[0]))
    max_id = max(existing_ids) if existing_ids else 0
    print(f"   -> Max ID saat ini: {max_id}")

    existing_noregs = set(r[2].strip() for r in existing_rows if r[2].strip())
    print(f"   -> Total no_registrasi unik eksisting: {len(existing_noregs)}")

    # 2. Baca data terstruktur Depok dari Sheet 2 Excel
    print(f"\n2. Membaca data Depok: {XLSX_DEPOK} [Sheet 2]")
    with zipfile.ZipFile(XLSX_DEPOK, 'r') as z:
        sheet2_xml = z.read('xl/worksheets/sheet2.xml')

    tree = ET.fromstring(sheet2_xml)
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    xml_rows = tree.findall('.//s:row', ns)

    depok_raw_list = []
    for r in xml_rows:
        r_num = int(r.get('r'))
        if r_num >= 4:
            cells = {}
            for c in r.findall('s:c', ns):
                col = ''.join(filter(str.isalpha, c.get('r')))
                is_elem = c.find('s:is/s:t', ns)
                v_elem = c.find('s:v', ns)
                val = is_elem.text if is_elem is not None else (v_elem.text if v_elem is not None else '')
                cells[col] = (val or '').strip()
            depok_raw_list.append(cells)

    print(f"   -> Ditemukan {len(depok_raw_list)} data peserta Depok valid.")

    # 3. Generate no_registrasi unik dan petakan ke 38 kolom tabel pendaftar
    print("\n3. Memetakan data Depok ke struktur 38 kolom Supabase...")
    random.seed(20261011)
    used_noregs = set(existing_noregs)
    new_depok_rows = []
    cur_id = max_id + 1

    for p in depok_raw_list:
        # Generate no_registrasi unik acak 8-digit
        while True:
            digits = random.randint(10000000, 99999999)
            noreg = f"KNS2026-{digits}"
            if noreg not in used_noregs:
                used_noregs.add(noreg)
                break

        nama = p.get('F', '')
        hp = clean_phone(p.get('M', ''))
        dob_raw = p.get('I', '')
        # Konversi DD/MM/YYYY ke YYYY-MM-DD
        if len(dob_raw) == 10 and dob_raw[2] == '/' and dob_raw[5] == '/':
            dob_iso = f"{dob_raw[6:10]}-{dob_raw[3:5]}-{dob_raw[0:2]}"
        else:
            dob_iso = dob_raw

        jk_raw = p.get('G', '').upper()
        jk = 'Laki-laki' if jk_raw == 'L' else 'Perempuan'
        unit_name = p.get('D', '')

        row_38 = [
            str(cur_id),                                      # 1: id
            '2026-10-11 12:00:00.000+00',                     # 2: timestamp
            noreg,                                            # 3: no_registrasi
            'Lunas',                                          # 4: status_pembayaran
            nama,                                             # 5: nama_lengkap
            '-',                                              # 6: email
            hp,                                               # 7: whatsapp
            'Anggota PERSADIA',                               # 8: kategori_peserta
            'Pesta Rakyat',                                   # 9: pilihan_kegiatan
            '0',                                              # 10: total_tagihan
            '-',                                              # 11: institusi
            '-',                                              # 12: nim
            f'PERSADIA Cabang Kota Depok - {unit_name}',      # 13: cabang_persadia
            dob_iso,                                          # 14: tanggal_lahir
            jk,                                               # 15: jenis_kelamin
            '',                                               # 16: registrasi_onsite
            '',                                               # 17: waktu_registrasi_onsite
            '',                                               # 18: tinggi_badan
            '',                                               # 19: berat_badan
            '',                                               # 20: tensi
            '',                                               # 21: lingkar_perut
            '',                                               # 22: cek_gula_darah
            '',                                               # 23: gula_darah
            '',                                               # 24: makan_siang_pesta_rakyat
            'false',                                          # 25: ikut_health_talk
            'false',                                          # 26: bersedia_anggota_persadia
            '-',                                              # 27: alamat_lengkap
            '-',                                              # 28: kelurahan
            '-',                                              # 29: kecamatan
            '-',                                              # 30: kota_kabupaten
            '-',                                              # 31: provinsi
            'Tidak',                                          # 32: kesediaan_data
            'Tidak',                                          # 33: gejala_neuropati
            '',                                               # 34: pengambilan_merchandise
            '-',                                              # 35: kode_voucher
            '',                                               # 36: makan_siang_hari_1
            'dr. Agoes Kooshartoro, Sp.PD-KKV, FINASIM',      # 37: nama_ketua_cabang
            'Onsite'                                          # 38: mode_kehadiran
        ]
        new_depok_rows.append(row_38)
        cur_id += 1

    print(f"   -> Berhasil membuat {len(new_depok_rows)} baris data Depok baru.")
    print(f"   -> Rentang ID baru: {new_depok_rows[0][0]} s/d {new_depok_rows[-1][0]}")

    # Validasi collision
    new_ids = set(int(r[0]) for r in new_depok_rows)
    id_collisions = new_ids.intersection(existing_ids)
    print(f"   -> Pengecekan Bentrok ID: {len(id_collisions)} bentrok (HARUS 0)")
    assert len(id_collisions) == 0, "ID BENTROK!"

    new_regs = set(r[2] for r in new_depok_rows)
    noreg_collisions = new_regs.intersection(existing_noregs)
    print(f"   -> Pengecekan Bentrok No. Registrasi: {len(noreg_collisions)} bentrok (HARUS 0)")
    assert len(noreg_collisions) == 0, "NO REGISTRASI BENTROK!"
    assert len(new_regs) == len(new_depok_rows), "DUPLIKAT NO REGISTRASI DI INTERNAL DATA BARU!"

    # 4. Tulis File CSV Siap Import Supabase (Hanya 2.750 baris baru)
    print(f"\n4. Menulis file CSV Siap Import Supabase: {OUT_CSV_DEPOK}")
    with open(OUT_CSV_DEPOK, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(new_depok_rows)
    print(f"   -> Selesai! Ukuran file: {os.path.getsize(OUT_CSV_DEPOK):,} bytes")

    # 5. Tulis File CSV Gabungan (2.888 lama + 2.750 baru = 5.638 baris)
    print(f"\n5. Menulis file CSV Gabungan: {OUT_CSV_GABUNGAN}")
    all_combined_rows = existing_rows + new_depok_rows
    with open(OUT_CSV_GABUNGAN, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_combined_rows)
    print(f"   -> Selesai! Total baris: {len(all_combined_rows):,} baris. Ukuran: {os.path.getsize(OUT_CSV_GABUNGAN):,} bytes")

    # 6. Bangun File Excel Multi-Tab (pendaftar_rows(3).xlsx)
    print(f"\n6. Membangun file Excel Multi-Tab: {OUT_XLSX_MULTITAB}")
    # Mengambil base template dari XLSX_DEPOK
    with zipfile.ZipFile(XLSX_DEPOK, 'r') as z_in:
        base_files = {name: z_in.read(name) for name in z_in.namelist()}

    # Generate XML untuk masing-masing tab
    sheet1_xml = build_sheet_xml(header, existing_rows)
    sheet2_xml = build_sheet_xml(header, new_depok_rows)
    sheet3_xml = build_sheet_xml(header, all_combined_rows)

    base_files['xl/worksheets/sheet1.xml'] = sheet1_xml
    base_files['xl/worksheets/sheet2.xml'] = sheet2_xml
    base_files['xl/worksheets/sheet3.xml'] = sheet3_xml

    # Update xl/workbook.xml dengan 3 tab
    wb_tree = ET.fromstring(base_files['xl/workbook.xml'])
    ns_uri = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    r_ns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    sheets_elem = wb_tree.find(f'{{{ns_uri}}}sheets')
    for s in list(sheets_elem):
        sheets_elem.remove(s)

    tabs_meta = [
        ('pendaftar_rows(3)', '1', 'rId1'),
        ('pendaftar_depok_baru', '2', 'rId2'),
        ('pendaftar_gabungan_semua', '3', 'rId3')
    ]
    for tab_name, s_id, r_id in tabs_meta:
        ET.SubElement(sheets_elem, f'{{{ns_uri}}}sheet', {
            'name': tab_name,
            'sheetId': s_id,
            'state': 'visible',
            f'{{{r_ns}}}id': r_id
        })

    dn_elem = wb_tree.find(f'{{{ns_uri}}}definedNames')
    if dn_elem is not None:
        wb_tree.remove(dn_elem)

    base_files['xl/workbook.xml'] = ET.tostring(wb_tree, encoding='utf-8', xml_declaration=True)

    # Update xl/_rels/workbook.xml.rels
    rels_ns = 'http://schemas.openxmlformats.org/package/2006/relationships'
    wb_rels_root = ET.Element(f'{{{rels_ns}}}Relationships')
    for tab_name, s_id, r_id in tabs_meta:
        ET.SubElement(wb_rels_root, f'{{{rels_ns}}}Relationship', {
            'Type': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet',
            'Target': f'/xl/worksheets/sheet{s_id}.xml',
            'Id': r_id
        })
    ET.SubElement(wb_rels_root, f'{{{rels_ns}}}Relationship', {
        'Type': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles',
        'Target': 'styles.xml',
        'Id': 'rId4'
    })
    ET.SubElement(wb_rels_root, f'{{{rels_ns}}}Relationship', {
        'Type': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme',
        'Target': 'theme/theme1.xml',
        'Id': 'rId5'
    })
    base_files['xl/_rels/workbook.xml.rels'] = ET.tostring(wb_rels_root, encoding='utf-8', xml_declaration=True)

    # Simpan zip output
    with zipfile.ZipFile(OUT_XLSX_MULTITAB, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
        for fname, fbytes in base_files.items():
            z_out.writestr(fname, fbytes)

    print(f"   -> Selesai! Ukuran file XLSX: {os.path.getsize(OUT_XLSX_MULTITAB):,} bytes")
    print("\n" + "=" * 70)
    print("SEMUA PROSES SELESAI DENGAN SUKSES!")
    print("=" * 70)

if __name__ == '__main__':
    main()
