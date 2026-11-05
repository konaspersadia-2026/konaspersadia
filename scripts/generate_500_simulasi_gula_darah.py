import openpyxl
from collections import OrderedDict
import qrcode
import io
import base64
import random
import os

# 1. Load Data Petugas Gula Darah
wb = openpyxl.load_workbook('Data peserta/Data petugas gula darah/DATA_GABUNGAN_PETUGAS_GULA_DARAH.xlsx')
ws = wb.active
rows = list(ws.iter_rows(values_only=True))[1:]

inst_officers = OrderedDict()
for r in rows:
    no, nama, telp, inst, jab, wil, src = r[:7]
    inst_officers.setdefault(inst, []).append({
        'nama': nama,
        'telp': telp,
        'jabatan': jab,
        'wilayah': wil,
        'sumber': src
    })

# 2. Build 500 Dummy Participants
dummy_data = []

# Stage 1: 1 ticket per officer (317 tickets)
for inst, officers in inst_officers.items():
    for idx_off, off in enumerate(officers, 1):
        dummy_data.append({
            'instansi': inst,
            'nama_petugas': off['nama'],
            'wilayah': off['wilayah'],
            'sumber': off['sumber'],
            'telp': off['telp'] if off['telp'] and off['telp'] != '-' else '081234567890',
            'tipe': f'Petugas Uji {idx_off}',
            'is_spare': False
        })

# Stage 2: 1 spare per instansi (115 tickets) -> 317 + 115 = 432
for inst, officers in inst_officers.items():
    dummy_data.append({
        'instansi': inst,
        'nama_petugas': 'Cadangan Instansi',
        'wilayah': officers[0]['wilayah'],
        'sumber': officers[0]['sumber'],
        'telp': officers[0]['telp'] if officers[0]['telp'] and officers[0]['telp'] != '-' else '081234567890',
        'tipe': 'Cadangan 1',
        'is_spare': True
    })

# Stage 3: Extra spare for instansi with 3+ officers until 500 (68 tickets)
needed = 500 - len(dummy_data)
for inst, officers in inst_officers.items():
    if needed <= 0:
        break
    if len(officers) >= 3:
        dummy_data.append({
            'instansi': inst,
            'nama_petugas': 'Cadangan Instansi',
            'wilayah': officers[0]['wilayah'],
            'sumber': officers[0]['sumber'],
            'telp': officers[0]['telp'] if officers[0]['telp'] and officers[0]['telp'] != '-' else '081234567890',
            'tipe': 'Cadangan 2',
            'is_spare': True
        })
        needed -= 1

if needed > 0:
    for inst, officers in inst_officers.items():
        if needed <= 0:
            break
        dummy_data.append({
            'instansi': inst,
            'nama_petugas': 'Cadangan Instansi',
            'wilayah': officers[0]['wilayah'],
            'sumber': officers[0]['sumber'],
            'telp': officers[0]['telp'] if officers[0]['telp'] and officers[0]['telp'] != '-' else '081234567890',
            'tipe': 'Cadangan Extra',
            'is_spare': True
        })
        needed -= 1

print(f"Total dummy items: {len(dummy_data)}")

# Enrich with full registration info
random.seed(20261108)

sample_dobs = [
    ('1965-03-12', 'Perempuan'),
    ('1970-07-24', 'Laki-laki'),
    ('1975-11-15', 'Perempuan'),
    ('1980-05-09', 'Perempuan'),
    ('1983-08-30', 'Laki-laki'),
    ('1988-12-04', 'Perempuan'),
    ('1992-02-18', 'Laki-laki'),
    ('1995-10-21', 'Perempuan'),
    ('1978-06-14', 'Perempuan'),
    ('1968-09-03', 'Laki-laki')
]

for idx, item in enumerate(dummy_data, 1):
    item['no_registrasi'] = f"KNS2026-SIM-{idx:04d}"
    item['email'] = f"simulasi.{idx:04d}@konas-persadia.id"
    item['total_tagihan'] = 0
    item['status_pembayaran'] = 'Lunas'
    item['mode_kehadiran'] = 'Onsite'
    item['pilihan_kegiatan'] = 'Pesta Rakyat & Skrining Kesehatan (Simulasi)'
    item['kategori_peserta'] = 'Anggota PERSADIA' if idx % 2 == 0 else 'Masyarakat Umum'
    
    if item['is_spare']:
        item['nama_lengkap'] = f"[{item['instansi']}] Peserta {item['tipe']}"
    else:
        item['nama_lengkap'] = f"[{item['instansi']}] {item['nama_petugas']} ({item['tipe']})"
    
    # ~15% missing DOB / JK (every 7th item) to simulate identity verification prompt in scanner
    if idx % 7 == 0:
        item['tanggal_lahir'] = None
        item['jenis_kelamin'] = None
        item['nik'] = None
    else:
        dob_tpl = sample_dobs[idx % len(sample_dobs)]
        item['tanggal_lahir'] = dob_tpl[0]
        item['jenis_kelamin'] = dob_tpl[1]
        item['nik'] = f"3201{idx:04d}{random.randint(10000000, 99999999)}"

# 3. Generate SQL Insert Script
os.makedirs('supabase', exist_ok=True)
insert_sql_path = 'supabase/INSERT_500_DUMMY_SIMULASI_GULA_DARAH.sql'

with open(insert_sql_path, 'w', encoding='utf-8') as f:
    f.write("-- ==========================================================================\n")
    f.write("-- SCRIPT PENAMBAHAN 500 DATA PESERTA DUMMY UNTUK SIMULASI SCANNER GULA DARAH\n")
    f.write("-- Konas PERSADIA 2026 — Sesi Skrining & Pemeriksaan Gula Darah Hari ke-2\n")
    f.write("-- Khusus untuk Technical Meeting & Latihan 317 Petugas Dinkes & Puskesmas\n")
    f.write("-- ==========================================================================\n\n")
    f.write("BEGIN;\n\n")
    f.write("INSERT INTO pendaftar (\n")
    f.write("    timestamp,\n")
    f.write("    no_registrasi,\n")
    f.write("    status_pembayaran,\n")
    f.write("    nama_lengkap,\n")
    f.write("    email,\n")
    f.write("    whatsapp,\n")
    f.write("    kategori_peserta,\n")
    f.write("    pilihan_kegiatan,\n")
    f.write("    total_tagihan,\n")
    f.write("    institusi,\n")
    f.write("    cabang_persadia,\n")
    f.write("    tanggal_lahir,\n")
    f.write("    jenis_kelamin,\n")
    f.write("    mode_kehadiran,\n")
    f.write("    nik,\n")
    f.write("    cek_gula_darah,\n")
    f.write("    gula_darah\n")
    f.write(") VALUES\n")
    
    val_lines = []
    for p in dummy_data:
        nama_esc = p['nama_lengkap'].replace("'", "''")
        inst_esc = p['instansi'].replace("'", "''")
        wil_esc = p['wilayah'].replace("'", "''")
        tgl_str = f"'{p['tanggal_lahir']}'" if p['tanggal_lahir'] else "NULL"
        jk_str = f"'{p['jenis_kelamin']}'" if p['jenis_kelamin'] else "NULL"
        nik_str = f"'{p['nik']}'" if p['nik'] else "NULL"
        
        val_lines.append(
            f"    (NOW(), '{p['no_registrasi']}', '{p['status_pembayaran']}', '{nama_esc}', "
            f"'{p['email']}', '{p['telp']}', '{p['kategori_peserta']}', '{p['pilihan_kegiatan']}', "
            f"{p['total_tagihan']}, '{inst_esc}', '{wil_esc}', {tgl_str}, {jk_str}, '{p['mode_kehadiran']}', "
            f"{nik_str}, NULL, NULL)"
        )
    
    f.write(",\n".join(val_lines))
    f.write(";\n\n")
    f.write("COMMIT;\n")

print(f"Generated SQL Insert: {insert_sql_path}")

# 4. Generate SQL Cleanup Script
cleanup_sql_path = 'supabase/CLEANUP_500_DUMMY_SIMULASI_GULA_DARAH.sql'
with open(cleanup_sql_path, 'w', encoding='utf-8') as f:
    f.write("-- ==========================================================================\n")
    f.write("-- SCRIPT PENGHAPUSAN BERSIH 500 DATA PESERTA DUMMY SIMULASI GULA DARAH\n")
    f.write("-- Menghapus hanya data yang memiliki awalan no_registrasi 'KNS2026-SIM-%'\n")
    f.write("-- Data riil 7.000+ peserta tetap 100% aman dan tidak tersentuh\n")
    f.write("-- ==========================================================================\n\n")
    f.write("BEGIN;\n\n")
    f.write("DELETE FROM pendaftar\n")
    f.write("WHERE no_registrasi LIKE 'KNS2026-SIM-%';\n\n")
    f.write("COMMIT;\n\n")
    f.write("-- Verifikasi: Pastikan hasil query di bawah menghasilkan angka 0 (nol)\n")
    f.write("SELECT COUNT(*) AS sisa_data_simulasi FROM pendaftar WHERE no_registrasi LIKE 'KNS2026-SIM-%';\n")

print(f"Generated SQL Cleanup: {cleanup_sql_path}")

# 5. Generate QR Codes and HTML Page
def make_qr_base64(data):
    qr = qrcode.QRCode(box_size=5, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

print("Generating 500 QR Code base64 images...")
for p in dummy_data:
    p['qr_b64'] = make_qr_base64(p['no_registrasi'])

html_path = 'Data peserta/Data petugas gula darah/LEMBAR_QR_CODE_SIMULASI_500_PETUGAS.html'

# Build Rayon Categories for filters
rayons = list(OrderedDict.fromkeys(p['wilayah'] for p in dummy_data))

html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lembar QR Code Simulasi Scanner Gula Darah - Konas PERSADIA 2026</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {{
            --primary: #0284c7;
            --primary-dark: #0369a1;
            --emerald: #059669;
            --slate-800: #1e293b;
            --slate-600: #475569;
            --slate-100: #f1f5f9;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }}
        body {{
            background-color: #f8fafc;
            color: var(--slate-800);
            padding-bottom: 80px;
        }}
        header {{
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: white;
            padding: 32px 24px;
            box-shadow: 0 4px 20px -5px rgba(0,0,0,0.2);
            position: sticky;
            top: 0;
            z-index: 40;
        }}
        .header-container {{
            max-width: 1400px;
            margin: 0 auto;
        }}
        .header-top {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 20px;
        }}
        .title-badge {{
            display: inline-block;
            background: #0ea5e9;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 6px;
        }}
        h1 {{
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }}
        .sub-desc {{
            color: #94a3b8;
            font-size: 13px;
            margin-top: 4px;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            margin-top: 16px;
        }}
        .stat-card {{
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            padding: 12px 16px;
            border-radius: 12px;
        }}
        .stat-num {{
            font-size: 20px;
            font-weight: 800;
            color: #38bdf8;
        }}
        .stat-label {{
            font-size: 11px;
            color: #94a3b8;
            font-weight: 500;
        }}
        .controls-bar {{
            background: white;
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 24px;
            position: sticky;
            top: 154px;
            z-index: 30;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }}
        .controls-container {{
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
        }}
        .search-box {{
            flex: 1;
            min-width: 280px;
            position: relative;
        }}
        .search-box input {{
            width: 100%;
            padding: 10px 14px 10px 38px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }}
        .search-box input:focus {{
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }}
        .search-icon {{
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 14px;
        }}
        .filter-tabs {{
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding-bottom: 4px;
        }}
        .filter-btn {{
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background: white;
            color: var(--slate-600);
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s;
        }}
        .filter-btn.active {{
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }}
        .container {{
            max-width: 1400px;
            margin: 24px auto;
            padding: 0 24px;
        }}
        .cards-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
            gap: 18px;
        }}
        .qr-card {{
            background: white;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            padding: 18px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;
        }}
        .qr-card:hover {{
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            border-color: #cbd5e1;
        }}
        .card-top {{
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }}
        .type-badge {{
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            text-transform: uppercase;
        }}
        .type-petugas {{
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
        }}
        .type-cadangan {{
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fde68a;
        }}
        .rayon-badge {{
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            max-width: 150px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }}
        .qr-img-wrap {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .qr-img-wrap:hover {{
            border-color: var(--primary);
            background: #f0f9ff;
        }}
        .qr-img-wrap img {{
            width: 140px;
            height: 140px;
            display: block;
        }}
        .zoom-hint {{
            font-size: 10px;
            color: #0284c7;
            font-weight: 600;
            margin-top: 4px;
        }}
        .reg-num {{
            font-family: monospace;
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 10px;
            letter-spacing: 0.5px;
            background: #f1f5f9;
            padding: 4px 10px;
            border-radius: 6px;
            display: inline-block;
        }}
        .participant-name {{
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 8px;
            line-height: 1.3;
            min-height: 34px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }}
        .instansi-name {{
            font-size: 11px;
            font-weight: 600;
            color: #0284c7;
            margin-top: 4px;
        }}
        .meta-badges {{
            display: flex;
            gap: 4px;
            margin-top: 10px;
            flex-wrap: wrap;
            justify-content: center;
        }}
        .badge-onsite {{
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
        }}
        .badge-lunas {{
            background: #ecfdf5;
            color: #047857;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
        }}
        .badge-status {{
            background: #f8fafc;
            color: #64748b;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }}

        /* Modal Zoom */
        .modal {{
            display: none;
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(4px);
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .modal.active {{
            display: flex;
        }}
        .modal-content {{
            background: white;
            padding: 28px;
            border-radius: 20px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            position: relative;
            animation: zoomIn 0.2s ease-out;
        }}
        @keyframes zoomIn {{
            from {{ transform: scale(0.9); opacity: 0; }}
            to {{ transform: scale(1); opacity: 1; }}
        }}
        .close-btn {{
            position: absolute;
            top: 14px;
            right: 14px;
            background: #f1f5f9;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            color: #475569;
        }}
        .modal-qr-img {{
            width: 250px;
            height: 250px;
            margin: 14px auto;
            display: block;
            border: 2px solid #e2e8f0;
            padding: 10px;
            border-radius: 16px;
        }}

        /* Print styles */
        @media print {{
            header, .controls-bar, .zoom-hint {{
                display: none !important;
            }}
            body {{
                background: white;
                padding: 0;
            }}
            .cards-grid {{
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 12px !important;
            }}
            .qr-card {{
                break-inside: avoid;
                border: 1px solid #94a3b8 !important;
                box-shadow: none !important;
                padding: 12px !important;
            }}
            .qr-img-wrap img {{
                width: 110px !important;
                height: 110px !important;
            }}
        }}
    </style>
</head>
<body>

    <header>
        <div class="header-container">
            <div class="header-top">
                <div>
                    <span class="title-badge">Technical Meeting & Simulasi</span>
                    <h1>Lembar QR Code Simulasi Scanner Gula Darah</h1>
                    <p class="sub-desc">500 Data Peserta Uji Coba Lapangan • Konas PERSADIA 2026 (Sabtu & Minggu)</p>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-num">500</div>
                    <div class="stat-label">Total Barcode Simulasi</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num">{len(inst_officers)}</div>
                    <div class="stat-label">Instansi / Puskesmas</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num">100%</div>
                    <div class="stat-label">Mode Onsite (Tatap Muka)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-num">LUNAS</div>
                    <div class="stat-label">Status Akses Scanner</div>
                </div>
            </div>
        </div>
    </header>

    <div class="controls-bar">
        <div class="controls-container">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input type="text" id="searchInput" placeholder="Cari Puskesmas, Nama Petugas, atau No. Reg (contoh: Nanggung, Cibinong, Taufik)..." oninput="filterCards()">
            </div>
            <div class="filter-tabs">
                <button class="filter-btn active" onclick="setRayon('ALL', this)">Semua Rayon (500)</button>
"""

for r in rayons:
    count_r = sum(1 for p in dummy_data if p['wilayah'] == r)
    # clean short label
    short_lbl = r.replace(' (Kab. Bogor)', '')
    html_content += f"""                <button class="filter-btn" onclick="setRayon('{r}', this)">{short_lbl} ({count_r})</button>\n"""

html_content += f"""            </div>
        </div>
    </div>

    <div class="container">
        <div style="margin-bottom: 14px; font-size: 13px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
            <span>Menampilkan <strong id="shownCount">500</strong> dari 500 QR Code</span>
            <span style="font-size: 12px; color: #0284c7;">💡 Klik pada gambar QR Code untuk memperbesar (Full Screen) agar mudah di-scan</span>
        </div>

        <div class="cards-grid" id="cardsGrid">
"""

for p in dummy_data:
    type_class = 'type-cadangan' if p['is_spare'] else 'type-petugas'
    type_label = p['tipe']
    missing_notice = '<span class="badge-status" style="color: #b45309; background: #fffbeb; border-color: #fde68a;">⚠️ Data Belum Lengkap</span>' if not p['tanggal_lahir'] else '<span class="badge-status">Data Lengkap</span>'
    
    html_content += f"""
            <div class="qr-card" data-instansi="{p['instansi'].lower()}" data-nama="{p['nama_lengkap'].lower()}" data-noreg="{p['no_registrasi'].lower()}" data-rayon="{p['wilayah']}">
                <div class="card-top">
                    <span class="type-badge {type_class}">{type_label}</span>
                    <span class="rayon-badge" title="{p['wilayah']}">{p['wilayah'].replace(' (Kab. Bogor)', '')}</span>
                </div>

                <div class="qr-img-wrap" onclick="openModal('{p['no_registrasi']}', '{p['nama_lengkap']}', '{p['instansi']}', '{p['qr_b64']}')">
                    <img src="data:image/png;base64,{p['qr_b64']}" alt="QR {p['no_registrasi']}">
                    <div class="zoom-hint">🔍 Klik perbesar</div>
                </div>

                <div class="reg-num">{p['no_registrasi']}</div>
                <div class="participant-name">{p['nama_lengkap']}</div>
                <div class="instansi-name">{p['instansi']}</div>

                <div class="meta-badges">
                    <span class="badge-onsite">Onsite</span>
                    <span class="badge-lunas">Lunas</span>
                    {missing_notice}
                </div>
            </div>
"""

html_content += """
        </div>
    </div>

    <!-- Modal Zoom Fullscreen -->
    <div id="qrModal" class="modal" onclick="closeModalOnBg(event)">
        <div class="modal-content">
            <button class="close-btn" onclick="closeModal()">✕</button>
            <div id="modalTypeBadge" style="display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 6px; background: #f0fdf4; color: #16a34a; margin-bottom: 8px;">SIMULASI PETUGAS</div>
            <h3 id="modalRegNum" style="font-family: monospace; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">KNS2026-SIM-0001</h3>
            <div id="modalName" style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 4px;">Nama Peserta</div>
            <div id="modalInstansi" style="font-size: 12px; font-weight: 600; color: #0284c7;">Nama Instansi</div>
            
            <img id="modalQrImg" class="modal-qr-img" src="" alt="Zoomed QR">
            
            <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
                Arahkan kamera scanner ke kode QR di atas.<br>
                <strong>Pastikan scanner berada pada mode: 'Pengambilan Gula Darah'</strong>.
            </p>
        </div>
    </div>

    <script>
        let currentRayon = 'ALL';

        function setRayon(rayon, btn) {
            currentRayon = rayon;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCards();
        }

        function filterCards() {
            const query = document.getElementById('searchInput').value.toLowerCase().trim();
            const cards = document.querySelectorAll('.qr-card');
            let count = 0;

            cards.forEach(card => {
                const inst = card.getAttribute('data-instansi') || '';
                const nama = card.getAttribute('data-nama') || '';
                const noreg = card.getAttribute('data-noreg') || '';
                const rayon = card.getAttribute('data-rayon') || '';

                const matchRayon = (currentRayon === 'ALL' || rayon === currentRayon);
                const matchQuery = !query || inst.includes(query) || nama.includes(query) || noreg.includes(query);

                if (matchRayon && matchQuery) {
                    card.style.display = 'flex';
                    count++;
                } else {
                    card.style.display = 'none';
                }
            });

            document.getElementById('shownCount').innerText = count;
        }

        function openModal(noreg, nama, instansi, b64) {
            document.getElementById('modalRegNum').innerText = noreg;
            document.getElementById('modalName').innerText = nama;
            document.getElementById('modalInstansi').innerText = instansi;
            document.getElementById('modalQrImg').src = 'data:image/png;base64,' + b64;
            document.getElementById('qrModal').classList.add('active');
        }

        function closeModal() {
            document.getElementById('qrModal').classList.remove('active');
        }

        function closeModalOnBg(e) {
            if (e.target.id === 'qrModal') {
                closeModal();
            }
        }
    </script>
</body>
</html>
"""

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated QR Code HTML Page: {html_path}")

