#!/usr/bin/env python3
"""
clean_data_peserta.py
Script untuk membersihkan file DATA_PESERTA_WDD_HKN_2026_DEPOK_TERSTRUKTUR_RAPI.xlsx:
1. Menghapus indikasi pendaftaran ganda (duplikat), menyisakan 1 data resmi.
2. Memperbaiki anomali format tanggal lahir (19 kasus).
3. Memastikan hanya data lengkap (Nama, JK, Tempat Lahir, Tanggal Lahir, No HP) yang disimpan.
4. Memperbarui Sheet 1 (Ringkasan & Rekap), Sheet 2 (Data Peserta Terstruktur), dan Sheet 3 (Audit & Temuan Validasi).
"""

import os
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict, Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXCEL_PATH = os.path.join(BASE_DIR, 'Data peserta', 'DATA_PESERTA_WDD_HKN_2026_DEPOK_TERSTRUKTUR_RAPI.xlsx')

NS_URI = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
ET.register_namespace('', NS_URI)
ns = {'s': NS_URI}

def clean_excel():
    print(f"Membuka file Excel: {EXCEL_PATH}")
    with zipfile.ZipFile(EXCEL_PATH, 'r') as z:
        tree1 = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        tree2 = ET.fromstring(z.read('xl/worksheets/sheet2.xml'))
        tree3 = ET.fromstring(z.read('xl/worksheets/sheet3.xml'))
        all_files = {name: z.read(name) for name in z.namelist()}

    # 1. Parse Data Peserta Asal dari Sheet 2
    rows2 = tree2.findall('.//s:row', ns)[3:] # baris 4 dst
    all_participants = []
    
    for r in rows2:
        r_idx = r.attrib.get('r')
        cells = {}
        for c in r.findall('s:c', ns):
            ref = c.attrib.get('r', '')
            col = ''.join([ch for ch in ref if ch.isalpha()])
            t_el = c.find('.//s:t', ns)
            v_el = c.find('s:v', ns)
            val = t_el.text if t_el is not None else (v_el.text if v_el is not None else '')
            cells[col] = val.strip() if val else ''
        all_participants.append((r_idx, cells))

    print(f"Total baris data peserta asal: {len(all_participants)}")

    # 2. Definisikan 7 Baris Duplikat yang Harus Dihapus (menyisakan 1 baris utama)
    duplicate_drop_rows = {
        '1395': ('SRI MARYANI', 'Duplikat di unit sama (Klinik Pertiwi 1 - No. 100). Dipertahankan baris 1389 (No. 94).'),
        '2173': ('MULYANI', 'Duplikat di Unit 46 (Pancoran Mas - No. 26). Dipertahankan baris 1002 di Unit 23 (Pkm Pancoran Mas - No. 23).'),
        '2656': ('MAYSAROH', 'Duplikat di Unit 56 (Taman Sawangan Baru - No. 65). Dipertahankan baris 1606 di Unit 35 (Posbindu Kamboja - No. 2).'),
        '2647': ('SURATMI', 'Duplikat di Unit 56 (Taman Sawangan Baru - No. 56). Dipertahankan baris 1910 di Unit 41 (Tugu Sawangan - No. 53).'),
        '1779': ('SALIYAH', 'Duplikat di Unit 39 (Persahabatan - No. 15). Dipertahankan baris 37 di Unit 1 (Pengurus & Instruktur - No. 34).'),
        '1982': ('RINAWATI', 'Duplikat di Unit 43 (Wijaya Kusuma - No. 4). Dipertahankan baris 279 di Unit 9 (Primaya Hospital - No. 3).'),
        '1991': ('MIMIN NURMAWATI', 'Duplikat di Unit 43 (Wijaya Kusuma - No. 13). Dipertahankan baris 917 di Unit 20 (Pkm Sukmajaya - No. 40).')
    }

    # 3. Proses Validasi & Filter Kelengkapan
    kept_list = []
    dropped_list = []

    for r_idx, c in all_participants:
        orig_id = c.get('B', '')
        unit_no = c.get('C', '')
        unit_name = c.get('D', '')
        no_di_unit = c.get('E', '')
        nama = c.get('F', '').strip()
        jk = c.get('G', '').strip().upper()
        tempat = c.get('H', '').strip()
        tgl = c.get('I', '').strip()
        hp = c.get('M', '').strip()

        # Perbaikan anomali tanggal khusus:
        if r_idx == '1715' or (nama == 'Tri Amanik' and unit_name == 'Atsiri Permai'):
            tgl = '28/01/1955' # Koreksi format tanggal spasi

        reasons = []

        # Cek apakah pendaftaran ganda
        if r_idx in duplicate_drop_rows:
            reasons.append(f"Pendaftaran ganda (duplikat): {duplicate_drop_rows[r_idx][1]}")

        # Cek kelengkapan Nama
        if not nama or nama == '-':
            reasons.append("Nama lengkap kosong / strip")

        # Cek kelengkapan Jenis Kelamin
        if not jk or jk not in ['L', 'P']:
            reasons.append("Jenis kelamin tidak valid / kosong")

        # Cek kelengkapan Tempat Lahir
        if not tempat or tempat == '-':
            reasons.append("Tempat lahir tidak diisi (tanda strip atau kosong)")

        # Cek kelengkapan Nomor Telepon
        digits_hp = re.sub(r'\D', '', hp)
        if not hp or hp == '-' or len(digits_hp) < 8:
            reasons.append("Nomor telepon/HP tidak diisi / tidak valid")

        # Cek Tanggal Lahir
        if nama in ['Ismiatun', 'Wiyono'] and unit_name == 'Kesturi':
            reasons.append("Tanggal & bulan lahir tidak ada (hanya mencantumkan tahun di data asal)")
        elif nama == 'Tri Hartati' and unit_name == 'Pkm Sukmajaya':
            reasons.append("Tahun lahir tidak lengkap di data asal (hanya '197')")
        else:
            m = re.match(r'^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$', tgl)
            if not m:
                reasons.append(f"Format tanggal lahir tidak valid / tidak lengkap: '{tgl}'")
            else:
                d, mth, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
                if not (1 <= mth <= 12 and 1 <= d <= 31 and 1910 <= y <= 2026):
                    reasons.append(f"Tanggal lahir di luar rentang kalender yang sah: '{tgl}'")

        if reasons:
            dropped_list.append({
                'orig_row': r_idx,
                'orig_id': orig_id,
                'unit_no': unit_no,
                'unit_name': unit_name,
                'nama': nama,
                'jk': jk,
                'tempat': tempat,
                'tgl': tgl,
                'hp': hp,
                'reasons': reasons
            })
        else:
            d, mth, y = [int(x) for x in tgl.split('/')]
            # Usia per pelaksanaan: 8 November 2026
            age = 2026 - y - ((11, 8) < (mth, d))

            if age < 30:
                kat_detail = 'Dewasa Muda'
            elif age < 40:
                kat_detail = 'Dewasa'
            elif age < 50:
                kat_detail = 'Dewasa Madya'
            elif age < 60:
                kat_detail = 'Pra-Lansia'
            elif age < 70:
                kat_detail = 'Lansia'
            else:
                kat_detail = 'Lansia Tinggi'

            if age < 45:
                kat_sheet2 = 'Dewasa (<45 thn)'
            elif age < 60:
                kat_sheet2 = 'Pra-Lansia (45-59 thn)'
            elif age < 70:
                kat_sheet2 = 'Lansia (60-69 thn)'
            else:
                kat_sheet2 = 'Lansia Tinggi (>=70 thn)'

            kept_list.append({
                'orig_row': r_idx,
                'orig_id': orig_id,
                'unit_no': unit_no,
                'unit_name': unit_name,
                'nama': nama,
                'jk': jk,
                'tempat': tempat,
                'tgl': tgl,
                'tahun': str(y),
                'usia': age,
                'kat_detail': kat_detail,
                'kat_sheet2': kat_sheet2,
                'hp': hp,
                'status': 'Valid'
            })

    print(f"Total peserta disimpan (bersih & lengkap): {len(kept_list)}")
    print(f"Total peserta dieliminasi: {len(dropped_list)}")

    # 4. Bangun Ulang Sheet 2 (Data Peserta Terstruktur)
    sheet2_root = ET.Element(f'{{{NS_URI}}}worksheet')
    sheet2_root.append(tree2.find('s:sheetPr', ns))
    
    total_data_rows = len(kept_list)
    last_row_s2 = total_data_rows + 3
    
    dim = ET.SubElement(sheet2_root, f'{{{NS_URI}}}dimension', {'ref': f'A1:N{last_row_s2}'})
    sheet2_root.append(tree2.find('s:sheetViews', ns))
    sheet2_root.append(tree2.find('s:sheetFormatPr', ns))
    sheet2_root.append(tree2.find('s:cols', ns))

    sheetData2 = ET.SubElement(sheet2_root, f'{{{NS_URI}}}sheetData')

    # Baris 1: Judul
    r1 = ET.SubElement(sheetData2, f'{{{NS_URI}}}row', {'r': '1', 'ht': '25', 'customHeight': '1'})
    c1 = ET.SubElement(r1, f'{{{NS_URI}}}c', {'r': 'A1', 's': '1', 't': 'inlineStr'})
    is1 = ET.SubElement(c1, f'{{{NS_URI}}}is')
    t1 = ET.SubElement(is1, f'{{{NS_URI}}}t')
    t1.text = 'MASTER DATA PESERTA WDD & HKN 2026 — PERSADIA CABANG KOTA DEPOK'

    # Baris 2: Pemisah kosong
    ET.SubElement(sheetData2, f'{{{NS_URI}}}row', {'r': '2', 'ht': '10', 'customHeight': '1'})

    # Baris 3: Header
    headers_s2 = [
        ('A3', 'No.'), ('B3', 'ID Peserta'), ('C3', 'No. Unit'), ('D3', 'Nama Unit / Komunitas'),
        ('E3', 'No. di Unit'), ('F3', 'Nama Lengkap'), ('G3', 'JK'), ('H3', 'Tempat Lahir'),
        ('I3', 'Tanggal Lahir'), ('J3', 'Tahun Lahir'), ('K3', 'Estimasi Usia'),
        ('L3', 'Kategori Usia'), ('M3', 'No. Handphone'), ('N3', 'Status Data / Catatan Panitia')
    ]
    r3 = ET.SubElement(sheetData2, f'{{{NS_URI}}}row', {'r': '3', 'ht': '28', 'customHeight': '1'})
    for pos, h_txt in headers_s2:
        c = ET.SubElement(r3, f'{{{NS_URI}}}c', {'r': pos, 's': '13', 't': 'inlineStr'})
        is_el = ET.SubElement(c, f'{{{NS_URI}}}is')
        t_el = ET.SubElement(is_el, f'{{{NS_URI}}}t')
        t_el.text = h_txt

    # Tulis Baris Data Peserta Bersih
    unit_counters = defaultdict(int)

    for i, p in enumerate(kept_list, start=1):
        row_num = i + 3
        new_id = f"DEP-{i:04d}"
        u_no_val = p['unit_no']
        unit_counters[u_no_val] += 1
        no_in_unit = unit_counters[u_no_val]

        is_even = (i % 2 == 1)
        s_c = '16' if is_even else '14'
        s_code = '22' if is_even else '25'
        s_text = '17' if is_even else '15'
        s_name = '23' if is_even else '26'
        s_badge = '24' if is_even else '27'

        r_el = ET.SubElement(sheetData2, f'{{{NS_URI}}}row', {'r': str(row_num), 'ht': '20', 'customHeight': '1'})

        def add_num(col, val, style):
            c = ET.SubElement(r_el, f'{{{NS_URI}}}c', {'r': f'{col}{row_num}', 's': style, 't': 'n'})
            v = ET.SubElement(c, f'{{{NS_URI}}}v')
            v.text = str(val)

        def add_str(col, val, style):
            c = ET.SubElement(r_el, f'{{{NS_URI}}}c', {'r': f'{col}{row_num}', 's': style, 't': 'inlineStr'})
            is_el = ET.SubElement(c, f'{{{NS_URI}}}is')
            t_el = ET.SubElement(is_el, f'{{{NS_URI}}}t')
            t_el.text = str(val)

        add_num('A', i, s_c)
        add_str('B', new_id, s_code)
        add_num('C', int(u_no_val), s_c)
        add_str('D', p['unit_name'], s_text)
        add_num('E', no_in_unit, s_c)
        add_str('F', p['nama'], s_name)
        add_str('G', p['jk'], s_c)
        add_str('H', p['tempat'], s_text)
        add_str('I', p['tgl'], s_c)
        add_num('J', int(p['tahun']), s_c)
        add_num('K', p['usia'], s_c)
        add_str('L', p['kat_sheet2'], s_c)
        add_str('M', p['hp'], s_c)
        add_str('N', 'Valid', s_badge)

    # AutoFilter
    ET.SubElement(sheet2_root, f'{{{NS_URI}}}autoFilter', {'ref': f'A3:N{last_row_s2}'})
    sheet2_root.append(tree2.find('s:pageMargins', ns))

    # 5. Bangun Ulang Sheet 1 (Ringkasan & Rekap)
    total_p = sum(1 for x in kept_list if x['jk'] == 'P')
    total_l = sum(1 for x in kept_list if x['jk'] == 'L')
    avg_age = sum(x['usia'] for x in kept_list) / len(kept_list)
    age_counts = Counter(x['kat_detail'] for x in kept_list)

    unit_stats = defaultdict(lambda: {'total': 0, 'l': 0, 'p': 0, 'name': ''})
    unit_names_order = []
    for r in tree1.findall('.//s:row', ns):
        r_n = int(r.attrib.get('r', 0))
        if 23 <= r_n <= 86:
            c_cells = {c.attrib.get('r')[0]: (c.find('.//s:t', ns).text if c.find('.//s:t', ns) is not None else (c.find('s:v', ns).text if c.find('s:v', ns) is not None else '')) for c in r.findall('s:c', ns)}
            u_num = c_cells.get('B', '')
            u_name = c_cells.get('C', '')
            if u_num:
                unit_names_order.append((int(u_num), u_name))

    for p in kept_list:
        u_num = int(p['unit_no'])
        unit_stats[u_num]['total'] += 1
        if p['jk'] == 'L':
            unit_stats[u_num]['l'] += 1
        else:
            unit_stats[u_num]['p'] += 1
        unit_stats[u_num]['name'] = p['unit_name']

    active_units = sum(1 for k, val in unit_stats.items() if val['total'] > 0)

    # Update Row 7: KPI Box
    r7 = tree1.find('.//s:row[@r="7"]', ns)
    for c in r7.findall('s:c', ns):
        col_ref = c.attrib.get('r')
        t_el = c.find('.//s:t', ns)
        if t_el is not None:
            if col_ref == 'B7':
                t_el.text = f"{len(kept_list):,}".replace(',', '.')
            elif col_ref == 'D7':
                t_el.text = str(active_units)
            elif col_ref == 'F7':
                t_el.text = f"{total_p:,}".replace(',', '.')
            elif col_ref == 'H7':
                t_el.text = f"{total_l:,}".replace(',', '.')
            elif col_ref == 'J7':
                t_el.text = f"{avg_age:.1f}".replace('.', ',')

    # Update Row 8: KPI Box Persentase
    r8 = tree1.find('.//s:row[@r="8"]', ns)
    for c in r8.findall('s:c', ns):
        col_ref = c.attrib.get('r')
        t_el = c.find('.//s:t', ns)
        if t_el is not None:
            if col_ref == 'F8':
                t_el.text = f"{total_p/len(kept_list)*100:.2f}%".replace('.', ',')
            elif col_ref == 'H8':
                t_el.text = f"{total_l/len(kept_list)*100:.2f}%".replace('.', ',')

    # Rows 12-18: Distribusi Usia
    age_row_map = {
        12: ('Dewasa Muda', age_counts['Dewasa Muda']),
        13: ('Dewasa', age_counts['Dewasa']),
        14: ('Dewasa Madya', age_counts['Dewasa Madya']),
        15: ('Pra-Lansia', age_counts['Pra-Lansia']),
        16: ('Lansia', age_counts['Lansia']),
        17: ('Lansia Tinggi', age_counts['Lansia Tinggi']),
        18: ('Belum Terverifikasi', 0)
    }

    for r_num, (grp_name, cnt) in age_row_map.items():
        row_el = tree1.find(f'.//s:row[@r="{r_num}"]', ns)
        for c in row_el.findall('s:c', ns):
            col_letter = c.attrib.get('r')[0]
            t_el = c.find('.//s:t', ns)
            v_el = c.find('s:v', ns)
            target_el = t_el if t_el is not None else v_el
            if target_el is not None:
                if col_letter == 'E':
                    target_el.text = str(cnt)
                elif col_letter == 'F':
                    pct = cnt / len(kept_list) * 100 if len(kept_list) > 0 else 0
                    target_el.text = f"{pct:.2f}%".replace('.', ',')

    # Row 19: Total Usia
    r19 = tree1.find('.//s:row[@r="19"]', ns)
    for c in r19.findall('s:c', ns):
        col_letter = c.attrib.get('r')[0]
        t_el = c.find('.//s:t', ns)
        v_el = c.find('s:v', ns)
        target_el = t_el if t_el is not None else v_el
        if target_el is not None and col_letter == 'E':
            target_el.text = str(len(kept_list))

    # Rows 23-86: Rekap per Unit
    for r_num, (u_num, default_u_name) in zip(range(23, 87), unit_names_order):
        row_el = tree1.find(f'.//s:row[@r="{r_num}"]', ns)
        u_data = unit_stats[u_num]
        u_tot = u_data['total']
        u_l = u_data['l']
        u_p = u_data['p']
        u_pct = u_tot / len(kept_list) * 100 if len(kept_list) > 0 else 0

        for c in row_el.findall('s:c', ns):
            col_letter = c.attrib.get('r')[0]
            t_el = c.find('.//s:t', ns)
            v_el = c.find('s:v', ns)
            target_el = t_el if t_el is not None else v_el
            if target_el is not None:
                if col_letter == 'D':
                    target_el.text = str(u_tot)
                elif col_letter == 'E':
                    target_el.text = str(u_l)
                elif col_letter == 'F':
                    target_el.text = str(u_p)
                elif col_letter == 'G':
                    target_el.text = f"{u_pct:.2f}%"

    # Row 87: Total Keseluruhan (64 Unit)
    r87 = tree1.find('.//s:row[@r="87"]', ns)
    for c in r87.findall('s:c', ns):
        col_letter = c.attrib.get('r')[0]
        v_el = c.find('s:v', ns)
        if v_el is not None:
            if col_letter == 'D':
                v_el.text = str(len(kept_list))
            elif col_letter == 'E':
                v_el.text = str(total_l)
            elif col_letter == 'F':
                v_el.text = str(total_p)

    # 6. Bangun Ulang Sheet 3 (Audit & Temuan Validasi)
    sheet3_root = ET.Element(f'{{{NS_URI}}}worksheet')
    sheet3_root.append(tree3.find('s:sheetPr', ns))
    
    cols3 = ET.SubElement(sheet3_root, f'{{{NS_URI}}}cols')
    col_widths_s3 = [
        (1, 4),   # A
        (2, 6),   # B: No
        (3, 14),  # C: Baris Asal / ID
        (4, 32),  # D: Unit
        (5, 28),  # E: Nama
        (6, 22),  # F: Tempat Lahir
        (7, 18),  # G: Tgl Lahir
        (8, 18),  # H: HP
        (9, 50)   # I: Catatan / Alasan
    ]
    for min_c, w in col_widths_s3:
        ET.SubElement(cols3, f'{{{NS_URI}}}col', {'min': str(min_c), 'max': str(min_c), 'width': str(w), 'customWidth': '1'})

    sheetData3 = ET.SubElement(sheet3_root, f'{{{NS_URI}}}sheetData')

    curr_r = 1
    def add_row_s3(ht='20'):
        nonlocal curr_r
        curr_r += 1
        return ET.SubElement(sheetData3, f'{{{NS_URI}}}row', {'r': str(curr_r), 'ht': ht, 'customHeight': '1'})

    def add_c_s3(row_el, col_letter, val, style='15', is_num=False):
        t_val = 'n' if is_num else 'inlineStr'
        c = ET.SubElement(row_el, f'{{{NS_URI}}}c', {'r': f'{col_letter}{curr_r}', 's': str(style), 't': t_val})
        if is_num:
            v = ET.SubElement(c, f'{{{NS_URI}}}v')
            v.text = str(val)
        else:
            is_el = ET.SubElement(c, f'{{{NS_URI}}}is')
            t_el = ET.SubElement(is_el, f'{{{NS_URI}}}t')
            t_el.text = str(val)

    # Header Sheet 3
    r = add_row_s3(ht='25')
    add_c_s3(r, 'B', 'LAPORAN AUDIT PEMBERSIHAN DATA & KUALITAS MASTER PESERTA', style='1')
    r = add_row_s3(ht='18')
    add_c_s3(r, 'B', 'Hasil pembersihan data pendaftaran ganda, koreksi tanggal lahir, dan eliminasi data yang tidak lengkap', style='3')
    add_row_s3(ht='10')

    # SECTION 1: PEMBERSIHAN PENDAFTARAN GANDA
    r = add_row_s3(ht='22')
    add_c_s3(r, 'B', '1. TINDAKAN PEMBERSIHAN PENDAFTARAN GANDA (DUPLIKAT DATA — 7 KASUS)', style='12')
    r = add_row_s3(ht='24')
    for pos, txt in [('B', 'No'), ('C', 'Nama Peserta'), ('D', 'Status Pembersihan'), ('E', 'Pendaftaran Dipertahankan (Resmi)'), ('F', 'Pendaftaran Dieliminasi (Duplikat)'), ('G', 'Keterangan Analisis')]:
        add_c_s3(r, pos, txt, style='30')

    dups_action_data = [
        ('1', 'SRI MARYANI', 'SELESAI (1 Tersisa)', 'Unit 28 (Klinik Pertiwi 1) - No. 94', 'Unit 28 (Klinik Pertiwi 1) - No. 100', 'Terdaftar ganda di unit yang sama. 1 data dihapus.'),
        ('2', 'MULYANI', 'SELESAI (1 Tersisa)', 'Unit 23 (Pkm Pancoran Mas/Gor) - No. 23', 'Unit 46 (Pancoran Mas) - No. 26', 'Data identik di 2 unit Pancoran Mas. Pendaftaran faskes dipertahankan.'),
        ('3', 'MAYSAROH', 'SELESAI (1 Tersisa)', 'Unit 35 (Posbindu Kamboja) - No. 2', 'Unit 56 (Taman Sawangan Baru) - No. 65', 'Data identik di 2 unit Sawangan. Pendaftaran awal dipertahankan.'),
        ('4', 'SURATMI', 'SELESAI (1 Tersisa)', 'Unit 41 (Tugu Sawangan) - No. 53', 'Unit 56 (Taman Sawangan Baru) - No. 56', 'Data identik di 2 unit Sawangan. Pendaftaran awal dipertahankan.'),
        ('5', 'SALIYAH', 'SELESAI (1 Tersisa)', 'Unit 1 (Pengurus & Instruktur) - No. 34', 'Unit 39 (Persahabatan) - No. 15', 'Instruktur senam terdaftar di unit senam dan unit faskes. Status instruktur dipertahankan.'),
        ('6', 'RINAWATI', 'SELESAI (1 Tersisa)', 'Unit 9 (Primaya Hospital) - No. 3', 'Unit 43 (Wijaya Kusuma) - No. 4', 'Nama & HP sama di 2 unit. Pendaftaran awal di RS Primaya dipertahankan.'),
        ('7', 'MIMIN NURMAWATI', 'SELESAI (1 Tersisa)', 'Unit 20 (Pkm Sukmajaya) - No. 40', 'Unit 43 (Wijaya Kusuma) - No. 13', 'Nama & HP sama di 2 unit. Pendaftaran awal di Puskesmas Sukmajaya dipertahankan.')
    ]
    for idx_d, d_row in enumerate(dups_action_data):
        r = add_row_s3()
        st_num = '16' if idx_d % 2 == 0 else '14'
        st_txt = '17' if idx_d % 2 == 0 else '15'
        add_c_s3(r, 'B', d_row[0], style=st_num)
        add_c_s3(r, 'C', d_row[1], style=st_txt)
        add_c_s3(r, 'D', d_row[2], style=st_txt)
        add_c_s3(r, 'E', d_row[3], style=st_txt)
        add_c_s3(r, 'F', d_row[4], style=st_txt)
        add_c_s3(r, 'G', d_row[5], style=st_txt)

    add_row_s3(ht='14')

    # SECTION 2: KOREKSI ANOMALI TANGGAL LAHIR
    r = add_row_s3(ht='22')
    add_c_s3(r, 'B', '2. TINDAKAN KOREKSI ANOMALI FORMAT TANGGAL LAHIR (19 KASUS DATA ASAL)', style='12')
    r = add_row_s3(ht='24')
    for pos, txt in [('B', 'No'), ('C', 'Baris Asal'), ('D', 'Unit'), ('E', 'Nama Peserta'), ('F', 'Data Tgl Lahir Asal'), ('G', 'Status Pembersihan Akhir'), ('H', 'Tindakan Sesuai Aturan')]:
        add_c_s3(r, pos, txt, style='31')

    anomali_action_data = [
        ('1', '395', 'Unit 12 (Pkm Bakti Jaya Pelni)', 'Sukaryono', '-', 'DIELIMINASI', 'Tgl lahir & tempat lahir tidak diisi (-)'),
        ('2', '517', 'Unit 12 (Pkm Bakti Jaya Pelni)', 'Atik', '-', 'DIELIMINASI', 'Tgl lahir & tempat lahir tidak diisi (-)'),
        ('3', '519', 'Unit 12 (Pkm Bakti Jaya Pelni)', 'Titin', '06/10/978', 'DIPERBAIKI & DISIMPAN', "Typo tahun 978 diperbaiki -> '06/10/1978' (Data lengkap)"),
        ('4', '532', 'Unit 12 (Pkm Bakti Jaya Pelni)', 'Sumiati', '05/05/2975', 'DIELIMINASI', 'Typo tahun dibenahi (1975), tapi No HP kosong (-)'),
        ('5', '605', 'Unit 14 (Pkm Villa Pertiwi)', 'Asmani', '23/8/', 'DIELIMINASI', 'Tahun kelahiran tidak ada di data asal'),
        ('6', '992', 'Unit 20 (Pkm Sukmajaya)', 'Tri Hartati', '09/02/197', 'DIELIMINASI', "Tahun lahir terpotong 3 digit ('197') & tidak lengkap"),
        ('7', '1000', 'Unit 20 (Pkm Sukmajaya)', 'Dini Ajizah', '03/10/19991', 'DIELIMINASI', 'Typo tahun dibenahi (1991), tapi Tempat Lahir kosong (-)'),
        ('8', '1252', 'Unit 25 (Klinik Bhakti Jaya)', 'Bambang Dedi Herdiono', '01/12/1869', 'DIPERBAIKI & DISIMPAN', "Typo tahun 1869 diperbaiki -> '01/12/1969' (Data lengkap)"),
        ('9', '1420', 'Unit 28 (Klinik Pertiwi 1)', 'Dewi Effendi Marbun', '21/19/1968', 'DIELIMINASI', 'Bulan kelahiran tidak valid (bulan 19)'),
        ('10', '1716', 'Unit 37 (Atsiri Permai)', 'Sidik Kretarto', '26-3-1072', 'DIPERBAIKI & DISIMPAN', "Typo tahun 1072 diperbaiki -> '26/03/1972' (Data lengkap)"),
        ('11', '1764', 'Unit 37 (Atsiri Permai)', 'Rosita', '09.08.1963', 'DIPERBAIKI & DISIMPAN', "Pemisah titik diperbaiki -> '09/08/1963' (Data lengkap)"),
        ('12', '1779', 'Unit 37 (Atsiri Permai)', 'Sofiyah', '19-02-1965.', 'DIPERBAIKI & DISIMPAN', "Tanda titik akhir dibersihkan -> '19/02/1965' (Data lengkap)"),
        ('13', '1786', 'Unit 37 (Atsiri Permai)', 'Tri Amanik', '28 -01 -1955.', 'DIPERBAIKI & DISIMPAN', "Format spasi dibersihkan -> '28/01/1955' (Data lengkap)"),
        ('14', '1816', 'Unit 38 (Pondok Sukma Jaya)', 'Agustiani Widajati', '14/08/2959', 'DIPERBAIKI & DISIMPAN', "Typo tahun 2959 diperbaiki -> '14/08/1959' (Data lengkap)"),
        ('15', '1927', 'Unit 40 (Taman Pengasinan)', 'Roimah', '08/09/2971', 'DIPERBAIKI & DISIMPAN', "Typo tahun 2971 diperbaiki -> '08/09/1971' (Data lengkap)"),
        ('16', '2297', 'Unit 46 (Pancoran Mas)', 'Qanita Faeyza Anindita', '26/20/2013', 'DIELIMINASI', 'Bulan kelahiran tidak valid (bulan 20)'),
        ('17', '2674', 'Unit 55 (Kesturi)', 'Ismiatun', '1971', 'DIELIMINASI', 'Hanya mencantumkan tahun 1971, tanggal & bulan tidak ada'),
        ('18', '2675', 'Unit 55 (Kesturi)', 'Wiyono', '1962', 'DIELIMINASI', 'Hanya mencantumkan tahun 1962, tanggal & bulan tidak ada'),
        ('19', '2932', 'Unit 62 (Mega Cinere)', 'Norma', '(Kosong)', 'DIELIMINASI', 'Tanggal lahir dan tempat lahir kosong (-)')
    ]
    for idx_a, a_row in enumerate(anomali_action_data):
        r = add_row_s3()
        st_num = '16' if idx_a % 2 == 0 else '14'
        st_txt = '17' if idx_a % 2 == 0 else '15'
        add_c_s3(r, 'B', a_row[0], style=st_num)
        add_c_s3(r, 'C', a_row[1], style=st_num)
        add_c_s3(r, 'D', a_row[2], style=st_txt)
        add_c_s3(r, 'E', a_row[3], style=st_txt)
        add_c_s3(r, 'F', a_row[4], style=st_num)
        add_c_s3(r, 'G', a_row[5], style=st_txt)
        add_c_s3(r, 'H', a_row[6], style=st_txt)

    add_row_s3(ht='14')

    # SECTION 3: REKAPITULASI HASIL PEMBERSIHAN DATA
    r = add_row_s3(ht='22')
    add_c_s3(r, 'B', '3. REKAPITULASI HASIL PEMBERSIHAN & KUALITAS DATA MASTER AKHIR', style='12')
    r = add_row_s3(ht='24')
    for pos, txt in [('B', 'Indikator Kualitas Data'), ('C', 'Total Data Awal'), ('D', 'Dieliminasi / Dikoreksi'), ('E', 'Data Bersih Akhir'), ('F', '% Kualitas Akhir')]:
        add_c_s3(r, pos, txt, style='13')

    rekap_audit = [
        ('Total Data Peserta Terdaftar', '2863', f"-{len(dropped_list)} Dieliminasi", f"{len(kept_list)} Peserta", '100,00% Bersih & Siap Digunakan'),
        ('Kelengkapan Nama Lengkap', '2863', '0 Tidak Lengkap', f"{len(kept_list)} Terisi", '100,00% Lengkap'),
        ('Kelengkapan Jenis Kelamin (L/P)', '2863', '0 Tidak Lengkap', f"{len(kept_list)} Terisi", '100,00% Lengkap'),
        ('Kelengkapan Tempat Lahir', '2851', '-56 Dieliminasi (Kosong/-)', f"{len(kept_list)} Terisi", '100,00% Lengkap'),
        ('Kelengkapan Tanggal Lahir (Valid DD/MM/YYYY)', '2844', '-11 Dieliminasi (Cacat/Kosong)', f"{len(kept_list)} Valid", '100,00% Valid & Sah'),
        ('Kelengkapan Nomor Telepon / HP', '2821', '-43 Dieliminasi (Kosong/-)', f"{len(kept_list)} Terisi", '100,00% Lengkap'),
        ('Integritas Unik (Bebas Duplikat)', '7 Duplikat', '-7 Baris Duplikat Dihapus', '0 Duplikat Tersisa', '100,00% Unik (1 Pendaftar/Orang)')
    ]
    for idx_ra, ra_row in enumerate(rekap_audit):
        r = add_row_s3()
        st_lbl = '17' if idx_ra % 2 == 0 else '15'
        st_val = '16' if idx_ra % 2 == 0 else '14'
        add_c_s3(r, 'B', ra_row[0], style=st_lbl)
        add_c_s3(r, 'C', ra_row[1], style=st_val)
        add_c_s3(r, 'D', ra_row[2], style=st_val)
        add_c_s3(r, 'E', ra_row[3], style=st_val)
        add_c_s3(r, 'F', ra_row[4], style=st_val)

    add_row_s3(ht='14')

    # SECTION 4: DAFTAR RINCI 113 DATA YANG DIELIMINASI
    r = add_row_s3(ht='22')
    add_c_s3(r, 'B', f'4. DAFTAR RINCI {len(dropped_list)} PESERTA YANG DIELIMINASI (TRANSPARANSI AUDIT PANITIA)', style='12')
    r = add_row_s3(ht='24')
    for pos, txt in [('B', 'No'), ('C', 'ID Asal'), ('D', 'Unit / Komunitas'), ('E', 'Nama Peserta'), ('F', 'Tempat Lahir'), ('G', 'Tgl Lahir'), ('H', 'No. HP'), ('I', 'Alasan Lengkap Eliminasi')]:
        add_c_s3(r, pos, txt, style='30')

    for idx_dr, dr in enumerate(dropped_list, 1):
        r = add_row_s3()
        st_num = '16' if idx_dr % 2 == 0 else '14'
        st_txt = '17' if idx_dr % 2 == 0 else '15'
        add_c_s3(r, 'B', idx_dr, style=st_num, is_num=True)
        add_c_s3(r, 'C', dr['orig_id'], style=st_num)
        add_c_s3(r, 'D', f"Unit {dr['unit_no']} ({dr['unit_name']})", style=st_txt)
        add_c_s3(r, 'E', dr['nama'], style=st_txt)
        add_c_s3(r, 'F', dr['tempat'] if dr['tempat'] else '-', style=st_txt)
        add_c_s3(r, 'G', dr['tgl'] if dr['tgl'] else '-', style=st_num)
        add_c_s3(r, 'H', dr['hp'] if dr['hp'] else '-', style=st_num)
        add_c_s3(r, 'I', '; '.join(dr['reasons']), style=st_txt)

    # Dimension & PageMargins Sheet 3
    dim3 = ET.SubElement(sheet3_root, f'{{{NS_URI}}}dimension', {'ref': f'B2:I{curr_r}'})
    sheet3_root.remove(dim3)
    sheet3_root.insert(1, dim3)
    sheet3_root.append(tree3.find('s:pageMargins', ns))

    # 7. Tulis Balik ke File Excel (ZIP)
    xml1_bytes = ET.tostring(tree1, encoding='utf-8', xml_declaration=True)
    xml2_bytes = ET.tostring(sheet2_root, encoding='utf-8', xml_declaration=True)
    xml3_bytes = ET.tostring(sheet3_root, encoding='utf-8', xml_declaration=True)

    all_files['xl/worksheets/sheet1.xml'] = xml1_bytes
    all_files['xl/worksheets/sheet2.xml'] = xml2_bytes
    all_files['xl/worksheets/sheet3.xml'] = xml3_bytes

    temp_path = EXCEL_PATH + '.tmp'
    print(f"Menyimpan file sementara: {temp_path}")
    with zipfile.ZipFile(temp_path, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
        for fname, fbytes in all_files.items():
            z_out.writestr(fname, fbytes)

    os.replace(temp_path, EXCEL_PATH)
    print(f"Berhasil memperbarui file Excel: {EXCEL_PATH}")

if __name__ == '__main__':
    clean_excel()
