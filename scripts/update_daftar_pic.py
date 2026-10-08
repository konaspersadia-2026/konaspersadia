#!/usr/bin/env python3
"""
Script sinkronisasi dan perbaikan nama pembicara, moderator, dan fasilitator
pada file briefing/rundown 'Daftar PIC' agar sesuai dengan 'Surat Pembicara' (surat_data.py).
"""

import os
import zipfile
import xml.etree.ElementTree as ET

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIC_DIR = os.path.join(BASE_DIR, 'Surat_Pembicara', 'Daftar PIC')

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ET.register_namespace('w', W_NS)

# Pemetaan perbaikan nama per file
# Format: { filename: [ (kata_kunci_pencarian, nama_baru_sesuai_surat) ] }
CHANGES = {
    'Tanggal 7 November 2026_B.docx': [
        ('Rudi', 'Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD'),
        ('Putu Moda', 'Prof. dr. Putu Moda Arsana, SpPD-KEMD'),
    ],
    'Tanggal 7 November 2026_C.docx': [
        ('Rudi', 'Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD'),
        ('Dante', 'Prof. dr. Dante Saksono Harbuwono, Sp.PD-KEMD, Ph.D.'),
        ('Roy Panusunan', 'dr. Roy Panusunan Sibarani, SpPD-KEMD'),
    ],
    'Tanggal 7 November 2026_D.docx': [
        ('Fauziah', 'dr. Fauzia Kirana, SpPD'),
        ('Sidartawan', 'Prof. Dr. dr. Sidartawan Soegondo, Sp.PD-KEMD'),
        ('Heri', 'Dr. dr. K. Heri Nugroho Harioseno, SpPD-KEMD'),
        ('Rudijanto', 'Prof. Dr. dr. Achmad Rudijanto, Sp.PD-KEMD'),
    ],
    'Tanggal 7 November 2026_E.docx': [
        ('Nur Rusyda', 'dr. Nur Rusyda Kuddah, SpPD-KEMD'),
        ('Sidartawan', 'Prof. Dr. dr. Sidartawan Soegondo, Sp.PD-KEMD'),
        ('Dicky', 'dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD'),
        ('Baringin', 'dr. Baringin T A Manik, MKM'),
    ],
    'Tanggal 7 November 2026_F.docx': [
        ('William', 'dr. William Djauhari'),
        ('Roy Panusunan', 'dr. Roy Panusunan Sibarani, SpPD-KEMD'),
        ('Gloria', 'dr. Gloria Tanjung, SpN'),
    ],
    'Tanggal 7 November 2026_G.docx': [
        ('Kartika', 'dr. Kartika, SpPD'),
        ('Johannes', 'dr. Johanes Purwoto, SpPD-KEMD'),
        ('Surbekti', 'Daniel Surbakti'),
        ('Libbriansyah', 'Dr. Libriansyah, MM, SpPD-KEMD'),
        ('Leny', 'Dr. Leny Puspitasari, SpPD-KEMD'),
    ],
    'Tanggal 7 November 2026_H.docx': [
        ('Sonny', 'dr. Sony Wibisono Mudjanarko, SpPD-KEMD'),
        ('Khomimah', 'dr. Khomimah, SpPD-KEMD'),
        ('Nanang', 'dr. Nanang Miftah Fajari, SpPD-KEMD'),
    ],
    'Tanggal 7 November 2026_I.docx': [
        ('Santi', 'dr. Santi Syafril, SpPD-KEMD'),
        ('Herni', 'dr. Herni Basir, SpPD-KEMD'),
        ('Brama', 'dr. Brama Ihsan Sazli, M(Ked)PD, SpPD-KEMD'),
    ],
    'Tanggal 7 November 2026_J.docx': [
        ('Yuanita', 'Dr. dr. Yuanita Langi, SpPD-KEMD'),
        ('Rulli', 'dr. Rulli Rosandi, SpPD-KEMD'),
        ('Yohana', 'dr. Yohana Ceria Anindita, SpPD-KEMD'),
    ],
    'Tanggal 7 November 2026_K.docx': [
        ('Made Ratna', 'Dr. dr. Made Ratna Saraswati, SpPD-KEMD'),
        ('Fabiola', 'Dr. dr. Fabiola MS Adam, SpPD-KEMD'),
        ('Nurleny', 'dr. Nurleny Sutanto, SpPD, SpMk, FPCP'),
    ],
}

def get_text_with_tabs(p):
    parts = []
    for elem in p.iter():
        if elem.tag == f'{{{W_NS}}}t':
            parts.append(elem.text or '')
        elif elem.tag == f'{{{W_NS}}}tab':
            parts.append('\t')
    return ''.join(parts)

def update_paragraph(p, prefix_type, new_name):
    """
    Membangun ulang elemen paragraph secara bersih:
    Mempertahankan pPr asli, menyusun ulang prefix (role + tab),
    dan menambahkan satu w:r berisi nama lengkap resmi berukuran 14pt (sz=28).
    """
    pPr = p.find(f'{{{W_NS}}}pPr')
    p.clear()
    if pPr is not None:
        p.append(pPr)
    else:
        pPr_new = ET.SubElement(p, f'{{{W_NS}}}pPr')
        rPr_p = ET.SubElement(pPr_new, f'{{{W_NS}}}rPr')
        ET.SubElement(rPr_p, f'{{{W_NS}}}sz', {f'{{{W_NS}}}val': '28'})
        ET.SubElement(rPr_p, f'{{{W_NS}}}szCs', {f'{{{W_NS}}}val': '28'})

    # Helper membuat w:r
    def make_run():
        r = ET.SubElement(p, f'{{{W_NS}}}r')
        rPr = ET.SubElement(r, f'{{{W_NS}}}rPr')
        ET.SubElement(rPr, f'{{{W_NS}}}sz', {f'{{{W_NS}}}val': '28'})
        ET.SubElement(rPr, f'{{{W_NS}}}szCs', {f'{{{W_NS}}}val': '28'})
        return r

    # 1. Bangun prefix berdasarkan tipenya
    if prefix_type == 'MC':
        r_mc = make_run()
        ET.SubElement(r_mc, f'{{{W_NS}}}t').text = 'MC'
        for _ in range(3):
            r_tab = make_run()
            ET.SubElement(r_tab, f'{{{W_NS}}}tab')
    elif prefix_type == 'Pembicara':
        r_spk = make_run()
        ET.SubElement(r_spk, f'{{{W_NS}}}t').text = 'Pembicara'
        for _ in range(2):
            r_tab = make_run()
            ET.SubElement(r_tab, f'{{{W_NS}}}tab')
    elif prefix_type == 'MC/ Moderator':
        r_mod = make_run()
        ET.SubElement(r_mod, f'{{{W_NS}}}t').text = 'MC/ Moderator'
        r_tab = make_run()
        ET.SubElement(r_tab, f'{{{W_NS}}}tab')
    elif prefix_type == 'continuation':
        for _ in range(3):
            r_tab = make_run()
            ET.SubElement(r_tab, f'{{{W_NS}}}tab')
    elif prefix_type == 'Fasilitator':
        for _ in range(3):
            r_tab = make_run()
            ET.SubElement(r_tab, f'{{{W_NS}}}tab')
        r_fas = make_run()
        t_fas = ET.SubElement(r_fas, f'{{{W_NS}}}t', {'{http://www.w3.org/XML/1998/namespace}space': 'preserve'})
        t_fas.text = 'Fasilitator '

    # 2. Bangun nama
    r_name = make_run()
    t_name = ET.SubElement(r_name, f'{{{W_NS}}}t', {'{http://www.w3.org/XML/1998/namespace}space': 'preserve'})
    t_name.text = new_name

def determine_prefix_type(text):
    if text.startswith('MC/ Moderator\t'):
        return 'MC/ Moderator'
    elif text.startswith('MC\t\t\t'):
        return 'MC'
    elif text.startswith('Pembicara\t\t'):
        return 'Pembicara'
    elif text.startswith('\t\t\tFasilitator '):
        return 'Fasilitator'
    elif text.startswith('\t\t\t'):
        return 'continuation'
    return None

def process_file(filename, file_changes):
    filepath = os.path.join(PIC_DIR, filename)
    print(f"\nMemproses: {filename}")
    
    with zipfile.ZipFile(filepath, 'r') as zin:
        xml_content = zin.read('word/document.xml')
        tree = ET.fromstring(xml_content)

        updated_count = 0
        for key, new_name in file_changes:
            found = False
            for p in tree.iter(f'{{{W_NS}}}p'):
                raw_text = get_text_with_tabs(p)
                if key in raw_text:
                    prefix_type = determine_prefix_type(raw_text)
                    if prefix_type:
                        update_paragraph(p, prefix_type, new_name)
                        after_text = get_text_with_tabs(p)
                        print(f"  [OK] {repr(raw_text)}")
                        print(f"    -> {repr(after_text)}")
                        updated_count += 1
                        found = True
                        break
                    else:
                        print(f"  [WARN] Prefix tidak dikenali untuk {repr(raw_text)}")
            if not found:
                print(f"  [ERROR] Kunci {key} tidak ditemukan di {filename}!")

        new_xml = ET.tostring(tree, encoding='utf-8', xml_declaration=True)

        temp_path = filepath + '.tmp'
        with zipfile.ZipFile(temp_path, 'w', zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename == 'word/document.xml':
                    zout.writestr(item, new_xml)
                else:
                    zout.writestr(item, zin.read(item.filename))

    os.replace(temp_path, filepath)
    print(f"  -> Selesai: {updated_count}/{len(file_changes)} nama diperbarui.")

def main():
    total_files = len(CHANGES)
    total_names = sum(len(v) for v in CHANGES.values())
    print(f"Memulai sinkronisasi nama: {total_files} file DOCX, {total_names} nama.")

    for filename, file_changes in CHANGES.items():
        process_file(filename, file_changes)

    print("\nSinkronisasi selesai 100%!")

if __name__ == '__main__':
    main()
