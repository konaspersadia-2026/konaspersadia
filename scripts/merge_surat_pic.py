#!/usr/bin/env python3
"""
Script penggabungan PDF Surat Undangan Pembicara/Moderator/Fasilitator (halaman 1-3)
dengan PDF Lampiran Briefing 'Daftar PIC' (halaman ke-4 atau ke-5).

Output disimpan di: Surat_Pembicara/Surat merge/<Nama File>.pdf
"""

import os
import shutil
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SURAT_PDF_DIR = os.path.join(BASE_DIR, 'Surat_Pembicara', 'PDF')
PIC_DIR = os.path.join(BASE_DIR, 'Surat_Pembicara', 'Daftar PIC')
OUTPUT_DIR = os.path.join(BASE_DIR, 'Surat_Pembicara', 'Surat merge')

# Pemetaan resmi: nama file PDF surat -> list file PDF lampiran PIC
MAPPING = {
    # --- Sesi 1: Plenary Lecture ---
    'Prof. dr. Putu Moda Arsana, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_B.pdf'
    ],
    # MC Plenary & Opening: B & C (5 halaman)
    'Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD.pdf': [
        'Tanggal 7 November 2026_B.pdf',
        'Tanggal 7 November 2026_C.pdf'
    ],

    # --- Sesi 2: Presidents' Lecture ---
    'Dr. dr. K. Heri Nugroho Harioseno, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_D.pdf'
    ],
    'Prof. Dr. dr. Achmad Rudijanto, Sp.PD-KEMD.pdf': [
        'Tanggal 7 November 2026_D.pdf'
    ],
    'dr. Fauzia Kirana, SpPD.pdf': [
        'Tanggal 7 November 2026_D.pdf'
    ],
    # Sesi 2 & Sesi 3: D & E (5 halaman)
    'Prof. Dr. dr. Sidartawan Soegondo, Sp.PD-KEMD.pdf': [
        'Tanggal 7 November 2026_D.pdf',
        'Tanggal 7 November 2026_E.pdf'
    ],

    # --- Sesi 3: Layanan Primer (FKTP) ---
    'dr. Baringin T A Manik, MKM.pdf': [
        'Tanggal 7 November 2026_E.pdf'
    ],
    'dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD.pdf': [
        'Tanggal 7 November 2026_E.pdf'
    ],
    'dr. Nur Rusyda Kuddah, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_E.pdf'
    ],

    # --- Sesi 4: Simposium Footsteps Leading to Neuropathy ---
    'dr. Roy Panusunan Sibarani, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_F.pdf'
    ],
    'dr. Gloria Tanjung, SpN.pdf': [
        'Tanggal 7 November 2026_F.pdf'
    ],
    'dr. William Djauhari.pdf': [
        'Tanggal 7 November 2026_F.pdf'
    ],

    # --- Sesi 4: Workshop 1 CGM ---
    'Daniel Surbakti.pdf': [
        'Tanggal 7 November 2026_G.pdf'
    ],
    'dr. Johanes Purwoto, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_G.pdf'
    ],
    'Dr. Libriansyah, MM, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_G.pdf'
    ],
    'Dr. Leny Puspitasari, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_G.pdf'
    ],

    # --- Sesi 5: Workshop 2 Semaglutide ---
    'dr. Sony Wibisono Mudjanarko, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_H.pdf'
    ],
    'dr. Khomimah, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_H.pdf'
    ],
    'dr. Nanang Miftah Fajari, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_H.pdf'
    ],

    # --- Sesi 5: Workshop 3 Nutrition in Diabetes ---
    'dr. Santi Syafril, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_I.pdf'
    ],
    'dr. Herni Basir, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_I.pdf'
    ],
    'dr. Brama Ihsan Sazli, M(Ked)PD, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_I.pdf'
    ],

    # --- Sesi 6: Workshop 4 Investigating Hypoglycemia ---
    'Dr. dr. Yuanita Langi, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_J.pdf'
    ],
    'dr. Rulli Rosandi, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_J.pdf'
    ],
    'dr. Yohana Ceria Anindita, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_J.pdf'
    ],
    'dr. Henny Megawati, SpPD.pdf': [
        'Tanggal 7 November 2026_J.pdf'
    ],

    # --- Sesi 6: Workshop 5 Pre-Diabetes ---
    'Dr. dr. Made Ratna Saraswati, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_K.pdf'
    ],
    'Dr. dr. Fabiola MS Adam, SpPD-KEMD.pdf': [
        'Tanggal 7 November 2026_K.pdf'
    ],
    'dr. Nurleny Sutanto, SpPD, SpMk, FPCP.pdf': [
        'Tanggal 7 November 2026_K.pdf'
    ],
    'dr. Pandu Sakti, SpPD, AIFO-K.pdf': [
        'Tanggal 7 November 2026_K.pdf'
    ],

    # --- Diabetes Health Forum (Ballroom 2) ---
    'dr. Boyke Dian Nugraha, Sp.OG, MARS.pdf': []
}

def get_page_count(filepath):
    res = subprocess.check_output(['pdfinfo', filepath]).decode('utf-8')
    for line in res.splitlines():
        if line.startswith('Pages:'):
            return int(line.split(':')[1].strip())
    return None

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Direktori output: {OUTPUT_DIR}\n")

    all_surat_files = sorted(os.listdir(SURAT_PDF_DIR))
    print(f"Total file surat di PDF/: {len(all_surat_files)}")
    print(f"Total entri dalam mapping: {len(MAPPING)}\n")

    # Validasi kelengkapan
    missing_in_mapping = [f for f in all_surat_files if f.endswith('.pdf') and f not in MAPPING]
    if missing_in_mapping:
        raise RuntimeError(f"Ada file surat yang belum dipetakan: {missing_in_mapping}")

    results = []
    for surat_filename, pic_list in sorted(MAPPING.items()):
        surat_path = os.path.join(SURAT_PDF_DIR, surat_filename)
        output_path = os.path.join(OUTPUT_DIR, surat_filename)

        if not os.path.exists(surat_path):
            raise FileNotFoundError(f"File surat tidak ditemukan: {surat_path}")

        if pic_list:
            pic_paths = []
            for pic_file in pic_list:
                pic_path = os.path.join(PIC_DIR, pic_file)
                if not os.path.exists(pic_path):
                    raise FileNotFoundError(f"File lampiran PIC tidak ditemukan: {pic_path}")
                pic_paths.append(pic_path)

            # Gabungkan dengan pdfunite
            cmd = ['pdfunite', surat_path] + pic_paths + [output_path]
            subprocess.check_call(cmd)
        else:
            # Tidak ada lampiran PIC (contoh: dr. Boyke Dian Nugraha), copy langsung
            shutil.copy2(surat_path, output_path)

        pages = get_page_count(output_path)
        results.append((surat_filename, pic_list, pages))

    print(f"{'No':<3} | {'Nama File Surat':<55} | {'Halaman':<8} | {'Lampiran PIC'}")
    print("-" * 110)
    for idx, (filename, pic_list, pages) in enumerate(results, 1):
        pic_desc = ", ".join(pic_list) if pic_list else "(Tanpa lampiran PIC)"
        print(f"{idx:<3} | {filename:<55} | {pages:<8} | {pic_desc}")

    print("\n[SUKSES] Seluruh file berhasil digabungkan!")

if __name__ == '__main__':
    main()
