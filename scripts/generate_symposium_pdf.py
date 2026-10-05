#!/usr/bin/env python3
"""
Script to generate official PDF for KONAS PERSADIA 2026
Based directly on DOKUMEN_SIMPOSIUM_WORKSHOP_KONAS_PERSADIA_2026.md
Editorial, clean, non-card-cluttered layout with large mobile-friendly typography.
Total: Exactly 5 Pages.
"""

import os
import base64
import subprocess
import sys
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
OUTPUT_PDF_PUBLIC = os.path.join(PUBLIC_DIR, "panduan-simposium-workshop-konas-persadia-2026.pdf")
HTML_FILE = os.path.join(BASE_DIR, "scratch_pdf.html")

def get_base64_image(file_path):
    if os.path.exists(file_path):
        ext = os.path.splitext(file_path)[1].replace(".", "")
        if ext == "svg":
            mime = "image/svg+xml"
        elif ext == "webp":
            mime = "image/webp"
        elif ext in ["jpg", "jpeg"]:
            mime = "image/jpeg"
        elif ext == "png":
            mime = "image/png"
        else:
            mime = "application/octet-stream"
        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
        return f"data:{mime};base64,{encoded}"
    return ""

logo_data = get_base64_image(os.path.join(PUBLIC_DIR, "logo.webp"))
qr_data = get_base64_image(os.path.join(PUBLIC_DIR, "qr_registrasi.png"))
roy_photo = get_base64_image(os.path.join(PUBLIC_DIR, "dr_roy.webp"))

html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Final Announcement - KONGRES NASIONAL PERSADIA 2026</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

  @page {{
    size: A4 portrait;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    font-size: 10pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .page {{
    width: 210mm;
    height: 297mm;
    padding: 12mm 15mm 10mm 15mm;
    margin: 0 auto;
    background: #ffffff;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }}

  .page:last-child {{
    page-break-after: avoid;
  }}

  /* Header */
  .header-strip {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2.5px solid #00B4AC;
    padding-bottom: 7px;
    margin-bottom: 11px;
    flex-shrink: 0;
  }}

  .header-left {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .logo-img {{
    height: 46px;
    object-fit: contain;
  }}

  .header-org-names {{
    font-size: 10.5pt;
    font-weight: 800;
    color: #0B3D5E;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1.25;
  }}

  .header-org-sub {{
    font-size: 8.5pt;
    color: #475569;
    font-weight: 600;
  }}

  .skp-badge {{
    background: linear-gradient(135deg, #0B3D5E 0%, #00B4AC 100%);
    color: #ffffff;
    padding: 5px 12px;
    border-radius: 7px;
    font-size: 9pt;
    font-weight: 800;
    text-align: right;
    line-height: 1.25;
  }}

  /* Footer */
  .footer-strip {{
    margin-top: auto;
    border-top: 1px solid #cbd5e1;
    padding-top: 7px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5pt;
    color: #475569;
    font-weight: 600;
    flex-shrink: 0;
  }}

  .footer-brand {{
    font-weight: 800;
    color: #0B3D5E;
  }}

  /* Section Title */
  .section-title {{
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 4px;
    margin-bottom: 9px;
    flex-shrink: 0;
  }}

  .section-title h2 {{
    font-size: 12pt;
    font-weight: 800;
    color: #0B3D5E;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }}

  .section-title span {{
    font-size: 9pt;
    color: #64748b;
    margin-left: auto;
    font-weight: 600;
  }}

  /* ================= PAGE 1 ================= */
  .hero-block {{
    background: linear-gradient(135deg, #0B3D5E 0%, #104871 65%, #008781 100%);
    border-radius: 9px;
    padding: 14px 18px;
    color: #ffffff;
    margin-bottom: 12px;
  }}

  .announcement-tag {{
    display: inline-block;
    background: #C89A2E;
    color: #ffffff;
    font-size: 8.5pt;
    font-weight: 800;
    padding: 2px 9px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }}

  .hero-main-title {{
    font-size: 20pt;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 3px;
    color: #ffffff;
    letter-spacing: -0.3px;
  }}

  .hero-main-sub {{
    font-size: 13pt;
    font-weight: 700;
    color: #5eead4;
    margin-bottom: 8px;
  }}

  .hero-theme-box {{
    background: rgba(255, 255, 255, 0.12);
    border-left: 4px solid #C89A2E;
    padding: 7px 11px;
    border-radius: 6px;
    font-size: 9.5pt;
    color: #f8fafc;
    line-height: 1.35;
  }}

  .venue-date-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
    margin-bottom: 12px;
  }}

  .venue-col {{
    background: #f8fafc;
    border-left: 4px solid #00B4AC;
    border-radius: 6px;
    padding: 9px 12px;
  }}

  .venue-col-title {{
    font-size: 10pt;
    font-weight: 800;
    color: #0B3D5E;
    margin-bottom: 2px;
  }}

  .venue-col-desc {{
    font-size: 8.5pt;
    color: #334155;
    line-height: 1.35;
  }}

  .overview-list {{
    list-style: none;
    margin-bottom: 10px;
  }}

  .overview-list li {{
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 5px;
    font-size: 9pt;
    color: #334155;
    line-height: 1.35;
  }}

  .overview-num {{
    width: 19px;
    height: 19px;
    background: #0B3D5E;
    color: #ffffff;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 8pt;
    font-weight: 800;
    flex-shrink: 0;
  }}

  .target-block {{
    background: #f1f5f9;
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 10px;
  }}

  .target-block-title {{
    font-size: 9.5pt;
    font-weight: 800;
    color: #0B3D5E;
    margin-bottom: 4px;
  }}

  .target-tags-row {{
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }}

  .target-pill {{
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 2px 9px;
    font-size: 8pt;
    font-weight: 700;
    color: #1e293b;
  }}

  .target-pill.active {{
    background: #e0f2fe;
    border-color: #0284c7;
    color: #0369a1;
  }}

  .callout-strip {{
    background: #fffbeb;
    border: 1.5px solid #C89A2E;
    border-radius: 7px;
    padding: 7px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9pt;
  }}

  .callout-strip strong {{
    color: #92400e;
    font-weight: 800;
  }}

  .callout-btn {{
    background: #0B3D5E;
    color: #ffffff;
    padding: 4px 12px;
    border-radius: 5px;
    font-size: 8.5pt;
    font-weight: 800;
    letter-spacing: 0.5px;
  }}

  /* ================= PAGE 2: SAMBUTAN ================= */
  .sambutan-header-row {{
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
    background: #f8fafc;
    border-left: 4px solid #00B4AC;
    padding: 9px 12px;
    border-radius: 7px;
  }}

  .leader-img {{
    width: 76px;
    height: 76px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #00B4AC;
    flex-shrink: 0;
  }}

  .leader-meta-title {{
    font-size: 11pt;
    font-weight: 800;
    color: #0B3D5E;
    line-height: 1.2;
  }}

  .leader-meta-role {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #0d9488;
    text-transform: uppercase;
    margin-top: 2px;
  }}

  .leader-quote-text {{
    font-size: 9.5pt;
    font-weight: 700;
    color: #0B3D5E;
    font-style: italic;
    margin-top: 3px;
    line-height: 1.3;
  }}

  .speech-text {{
    font-size: 9.5pt;
    line-height: 1.48;
    color: #1e293b;
    text-align: justify;
  }}

  .speech-text p {{
    margin-bottom: 7px;
  }}

  .two-pillars-box {{
    background: #f0fdfa;
    border-left: 4px solid #0d9488;
    padding: 7px 11px;
    margin: 7px 0;
    border-radius: 0 7px 7px 0;
  }}

  .two-pillars-title {{
    font-size: 9.5pt;
    font-weight: 800;
    color: #0f766e;
    text-transform: uppercase;
    margin-bottom: 3px;
  }}

  .two-pillars-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    font-size: 8.5pt;
    color: #134e4a;
    line-height: 1.35;
  }}

  .closing-quote {{
    font-size: 10.5pt;
    font-weight: 800;
    color: #0B3D5E;
    font-style: italic;
    text-align: center;
    margin: 8px 0 5px 0;
    padding: 5px;
    background: #f1f5f9;
    border-radius: 6px;
  }}

  .sign-box {{
    text-align: right;
    margin-top: 5px;
  }}

  .sign-box-title {{
    font-size: 8.5pt;
    color: #64748b;
  }}

  .sign-box-name {{
    font-size: 10.5pt;
    font-weight: 800;
    color: #0B3D5E;
  }}

  .sign-box-role {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #00B4AC;
  }}

  /* ================= PAGE 3: SIMPOSIUM TABLE ================= */
  .agenda-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    line-height: 1.3;
  }}

  .agenda-table th {{
    background: #0B3D5E;
    color: #ffffff;
    font-weight: 800;
    padding: 5px 7px;
    text-align: left;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }}

  .agenda-table td {{
    padding: 4px 7px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }}

  .agenda-table tr:nth-child(even) td {{
    background: #f8fafc;
  }}

  .time-col {{
    width: 85px;
    font-weight: 800;
    color: #00B4AC;
    white-space: nowrap;
    font-size: 8.5pt;
  }}

  .session-col {{
    width: 165px;
    font-weight: 800;
    color: #0B3D5E;
    font-size: 8.5pt;
  }}

  .room-badge {{
    display: inline-block;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    margin-top: 2px;
  }}

  .room-gede {{ background: #e0f2fe; color: #0369a1; }}
  .room-pangrango {{ background: #fef3c7; color: #92400e; }}
  .room-ballroom {{ background: #f3e8ff; color: #6b21a8; }}

  /* ================= PAGE 4: 5 WORKSHOPS ================= */
  .ws-item {{
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 5px;
    margin-bottom: 5px;
  }}

  .ws-item:last-child {{
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }}

  .ws-header-line {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }}

  .ws-label {{
    background: #0B3D5E;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 1.5px 6px;
    border-radius: 4px;
    text-transform: uppercase;
  }}

  .ws-meta-info {{
    font-size: 8pt;
    font-weight: 700;
    color: #64748b;
  }}

  .ws-title-text {{
    font-size: 10pt;
    font-weight: 800;
    color: #0B3D5E;
    margin-bottom: 1px;
    line-height: 1.2;
  }}

  .ws-speaker-text {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #0d9488;
    margin-bottom: 2px;
  }}

  .ws-syllabus-list {{
    font-size: 8pt;
    color: #334155;
    line-height: 1.28;
    margin-bottom: 3px;
    padding-left: 15px;
  }}

  .ws-syllabus-list li {{
    margin-bottom: 1px;
  }}

  .ws-hands-on-note {{
    background: #f0fdfa;
    border-left: 3px solid #00B4AC;
    padding: 3px 7px;
    font-size: 7.5pt;
    color: #0f766e;
    line-height: 1.25;
  }}

  /* ================= PAGE 5: PRICING & REGISTRATION ================= */
  .pricing-table-clean {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 9pt;
  }}

  .pricing-table-clean th {{
    background: #0B3D5E;
    color: #ffffff;
    font-weight: 800;
    padding: 6px 10px;
    font-size: 8.5pt;
    text-align: left;
  }}

  .pricing-table-clean th:last-child {{
    text-align: right;
  }}

  .pricing-table-clean td {{
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
  }}

  .pricing-table-clean td:first-child {{
    font-weight: 700;
    color: #0B3D5E;
  }}

  .pricing-table-clean td:last-child {{
    text-align: right;
    font-weight: 800;
    font-size: 10pt;
    color: #0d9488;
  }}

  .pricing-table-clean tr:nth-child(even) td {{
    background: #f8fafc;
  }}

  .facilities-list {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px;
    margin-bottom: 10px;
  }}

  .facility-item {{
    display: flex;
    align-items: flex-start;
    gap: 5px;
    font-size: 8.5pt;
    color: #334155;
    line-height: 1.3;
  }}

  .facility-check {{
    color: #00B4AC;
    font-weight: 800;
    font-size: 9.5pt;
  }}

  .payment-contact-container {{
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: 10px;
    margin-bottom: 9px;
  }}

  .bank-details-box {{
    background: #0B3D5E;
    color: #ffffff;
    border-radius: 7px;
    padding: 10px 14px;
  }}

  .bank-title-sm {{
    font-size: 8pt;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 700;
  }}

  .bank-name-lg {{
    font-size: 13pt;
    font-weight: 800;
    color: #fef08a;
  }}

  .bank-acc-large {{
    font-size: 18pt;
    font-weight: 800;
    font-family: monospace;
    letter-spacing: 1.5px;
    margin: 2px 0;
  }}

  .bank-owner-name {{
    font-size: 9.5pt;
    color: #e2e8f0;
    font-weight: 700;
  }}

  .qr-clean-box {{
    border: 2px solid #00B4AC;
    border-radius: 7px;
    padding: 6px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }}

  .qr-clean-img {{
    width: 78px;
    height: 78px;
    margin-bottom: 3px;
  }}

  .info-footer-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 7px;
    padding: 7px 11px;
    font-size: 8.5pt;
    color: #334155;
    line-height: 1.35;
  }}

  .info-footer-grid strong {{
    color: #0B3D5E;
  }}
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- PAGE 1: FINAL ANNOUNCEMENT & OVERVIEW -->
<!-- ========================================================================= -->
<div class="page">
  <div class="header-strip">
    <div class="header-left">
      <img src="{logo_data}" alt="Logo Kongres" class="logo-img" />
      <div>
        <div class="header-org-names">PB PERSADIA • PP PEDI • PB PERKENI</div>
        <div class="header-org-sub">Kolaborasi Ilmiah Nasional Menyehatkan Indonesia</div>
      </div>
    </div>
    <div class="skp-badge">
      TERAKREDITASI RESMI<br>
      <span style="font-size: 11pt;">SKP KEMENKES RI</span><br>
      <span style="font-size: 7pt; font-weight: 600; opacity: 0.95;">Plataran Sehat Kemenkes</span>
    </div>
  </div>

  <div class="hero-block">
    <div class="announcement-tag">FINAL ANNOUNCEMENT</div>
    <div class="hero-main-title">KONGRES NASIONAL PERSADIA 2026</div>
    <div class="hero-main-sub">SIMPOSIUM • WORKSHOP • PESTA RAKYAT</div>
    <div class="hero-theme-box">
      <strong>Tema Utama:</strong> "Pesta Rakyat Persadia, Menyehatkan Indonesia"<br>
      <strong>Fokus Kampanye:</strong> "Deteksi Dini, Hidup Lebih Baik: Bersama Melawan Diabetes dari Akar"<br>
      <span style="font-size: 8.5pt; font-style: italic; opacity: 0.9;">"Early Detection for Better Living: Standing Together Against Diabetes at Its Root"</span>
    </div>
  </div>

  <div class="venue-date-grid">
    <div class="venue-col">
      <div class="venue-col-title">📅 Hari 1: Sabtu, 7 November 2026</div>
      <div class="venue-col-desc">
        <strong>Novotel Bogor & Convention Center</strong> (08.00 – 17.00 WIB & Gala Dinner 18.30 – 21.00 WIB)<br>
        Simposium Ilmiah, 5 Workshop Hands-on, Temu 6 Tokoh Diabetisi, Rapat Kerja Organisasi, & Malam Keakraban.
      </div>
    </div>
    <div class="venue-col">
      <div class="venue-col-title">🏃 Hari 2: Minggu, 8 November 2026</div>
      <div class="venue-col-desc">
        <strong>Stadion Pakansari, Cibinong, Kabupaten Bogor</strong> (05.30 – 12.00 WIB)<br>
        Pemeriksaan & Skrining Gula Darah Massal 7.000 Peserta, Senam Bugar Diabetes Nasional Massal, Konsultasi Medis Gratis & Pameran.
      </div>
    </div>
  </div>

  <div class="section-title">
    <h2>6 Keunggulan Utama Mengapa Wajib Hadir</h2>
    <span>Nilai Tambah Ilmiah & Praktis</span>
  </div>

  <ul class="overview-list">
    <li>
      <span class="overview-num">1</span>
      <div><strong>SKP Kemenkes RI Resmi:</strong> Perolehan satuan kredit profesi resmi via Plataran Sehat Kemenkes untuk pemenuhan SKP tenaga medis.</div>
    </li>
    <li>
      <span class="overview-num">2</span>
      <div><strong>Pembaruan Terapi Mutakhir:</strong> Membahas inovasi pengobatan mutakhir seperti Tirzepatide (Dual GIP/GLP-1), Semaglutide pada fase prediabetes, dan kardioproteksi kardiometabolik.</div>
    </li>
    <li>
      <span class="overview-num">3</span>
      <div><strong>Hands-on Workshop Spesial:</strong> Praktik interaktif pembacaan sensor Continuous Glucose Monitoring (CGM / AGP report), peresepan diet medis terapan, tata laksana emergensi hipoglikemia, dan reversal prediabetes.</div>
    </li>
    <li>
      <span class="overview-num">4</span>
      <div><strong>Pakar & Guru Besar Nasional:</strong> Belajar langsung dari para Guru Besar dan Konsultan Endokrin terkemuka asal FKUI-RSCM, UNAIR, UNDIP, UB, UNUD, UNSRAT, dan USU.</div>
    </li>
    <li>
      <span class="overview-num">5</span>
      <div><strong>Fokus Kuat Layanan Primer (FKTP):</strong> Sesi khusus dokter fasilitas kesehatan tingkat pertama untuk meningkatkan deteksi dini dan mencegah komplikasi sebelum terlambat.</div>
    </li>
    <li>
      <span class="overview-num">6</span>
      <div><strong>Akses Jamuan Makan & Rangkaian Lengkap:</strong> Termasuk Welcome Coffee Morning, Lunch Buffet di Restoran Novotel, Gala Dinner Sabtu malam, serta akses Pesta Rakyat Minggu pagi.</div>
    </li>
  </ul>

  <div class="target-block">
    <div class="target-block-title">🎯 Sasaran Target Peserta:</div>
    <div class="target-tags-row">
      <span class="target-pill active">Dokter Spesialis Penyakit Dalam (Sp.PD)</span>
      <span class="target-pill active">Konsultan Endokrinologi & Metabolik (Sp.PD-KEMD)</span>
      <span class="target-pill active">Dokter Layanan Primer / Dokter Umum FKTP</span>
      <span class="target-pill">Residen / PPDS Penyakit Dalam</span>
      <span class="target-pill">Perawat Diabetes & Ahli Gizi</span>
      <span class="target-pill">Edukator Diabetes Indonesia (PEDI)</span>
      <span class="target-pill">Mahasiswa Kedokteran S1</span>
    </div>
  </div>

  <div class="callout-strip">
    <div>
      <strong>Pendaftaran Dibuka s.d. 31 Oktober 2026</strong> (Tetap dibuka selama kuota masih ada)<br>
      <span style="font-size: 8pt; color: #475569;">Hotline WA: 08980287820 & 085370716686 (Seksi Acara & Registrasi) • Email: diabetesinitiativeid@gmail.com</span>
    </div>
    <div class="callout-btn">konaspersadia.com</div>
  </div>

  <div class="footer-strip">
    <div class="footer-brand">KONGRES NASIONAL PERSADIA 2026</div>
    <div>Novotel Bogor & Convention Center • Halaman 1 dari 5</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 2: KATA SAMBUTAN KETUA UMUM -->
<!-- ========================================================================= -->
<div class="page">
  <div class="header-strip">
    <div class="header-left">
      <img src="{logo_data}" alt="Logo Kongres" class="logo-img" />
      <div>
        <div class="header-org-names">PESAN KEPEMIMPINAN • PERSATUAN DIABETES INDONESIA</div>
        <div class="header-org-sub">Pengurus Besar PERSADIA Masa Bakti 2026–2029</div>
      </div>
    </div>
    <div class="skp-badge">
      KATA SAMBUTAN<br>
      <span style="font-size: 8pt; font-weight: 600;">Ketua Umum PB PERSADIA</span>
    </div>
  </div>

  <div class="sambutan-header-row">
    <img src="{roy_photo}" alt="dr. Roy Panusunan Sibarani, Sp.PD-KEMD" class="leader-img" />
    <div>
      <div class="leader-meta-title">dr. Roy Panusunan Sibarani, Sp.PD-KEMD</div>
      <div class="leader-meta-role">Ketua Umum PB PERSADIA Masa Bakti 2026–2029 • Ketua Panitia Pelaksana</div>
      <div class="leader-quote-text">
        "Kongres Nasional PERSADIA 2026 berada tepat di jantung momentum bersejarah Hari Kesehatan Nasional dan World Diabetes Day. Bukan sekadar sebagai penonton, tapi sebagai motor penggerak deteksi dini diabetes Indonesia."
      </div>
    </div>
  </div>

  <div class="speech-text">
    <p><strong>Assalamu'alaikum Warahmatullahi Wabarakatuh,</strong><br>
    <strong>Salam Sejahtera bagi kita semua,</strong></p>

    <p>
      Dengan penuh rasa syukur, kebanggaan, dan semangat pengabdian yang tidak pernah padam, kami menyampaikan undangan terhormat kepada Rekan Sejawat Dokter Spesialis, Dokter Layanan Primer (FKTP), Residen, Perawat, dan segenap Tenaga Kesehatan untuk menjadi bagian dari momen bersejarah dalam perjalanan kesehatan bangsa: <strong>Kongres Nasional PERSADIA & Konferensi Gabungan 2026</strong>.
    </p>

    <p>
      Penyelenggaraan pada <strong>7–8 November 2026</strong> berada di antara dua momentum besar: <strong>12 November (Hari Kesehatan Nasional RI)</strong> sebagai pengingat komitmen bangsa terhadap kesehatan rakyatnya, serta <strong>14 November (World Diabetes Day)</strong>, hari lahir Frederick Banting yang pada tahun 1921 menemukan insulin dan mengubah vonis keputusasaan menjadi harapan hidup bagi jutaan penyandang diabetes. Kongres ini hadir tepat di episentrum kedua peringatan tersebut untuk memimpin perubahan nyata.
    </p>

    <p>
      Indonesia kini menempati peringkat ke-5 dunia dengan lebih dari <strong>19,5 juta penyandang diabetes</strong>. Fakta yang jauh lebih mendesak adalah jutaan masyarakat lainnya belum terdiagnosis atau sedang berada dalam fase prediabetes tanpa menyadarinya. Selaras dengan seruan global <em>International Diabetes Federation (IDF) 2026</em> dan prioritas kesehatan nasional, kami mengusung tema: <strong>"Deteksi Dini, Hidup Lebih Baik: Bersama Melawan Diabetes dari Akar"</strong> (<em>Early Detection for Better Living: Standing Together Against Diabetes at Its Root</em>).
    </p>

    <div class="two-pillars-box">
      <div class="two-pillars-title">Dua Pilar Gerakan Terpadu KONAS PERSADIA 2026:</div>
      <div class="two-pillars-grid">
        <div>
          <strong>🏛️ Hari Ke-1 (Sabtu, 7 Nov 2026 — Novotel Bogor):</strong><br>
          Simposium Ilmiah & Workshop Medis Ber-SKP Kemenkes bagi para dokter di seluruh Indonesia (inovasi Tirzepatide, Semaglutide, CGM AGP, FKTP) serta Pelantikan Pengurus PERSADIA 2026–2029 dan Deklarasi Komitmen Nasional Deteksi Dini.
        </div>
        <div>
          <strong>🏟️ Hari Ke-2 (Minggu, 8 Nov 2026 — Stadion Pakansari):</strong><br>
          Aksi nyata keberpihakan publik melalui <strong>Pemeriksaan & Skrining Gula Darah Massal bagi 7.000 Masyarakat</strong>, Senam Sehat Diabetes Massal Nusantara, dan konsultasi medis gratis.
        </div>
      </div>
    </div>

    <p>
      Kehadiran, sumbangsih pemikiran, dan partisipasi aktif Rekan Sejawat adalah energi terbesar dalam membentengi masyarakat dari komplikasi diabetes. Mari satukan langkah demi masa depan Indonesia yang lebih sehat, mandiri, dan berdaya.
    </p>

    <div class="closing-quote">
      "Bersama kita bisa. Bersama kita lebih kuat. Bersama kita bisa mengubah arah."
    </div>

    <div class="sign-box">
      <div class="sign-box-title">Wassalamu'alaikum Warahmatullahi Wabarakatuh.</div>
      <div class="sign-box-name">dr. Roy Panusunan Sibarani, Sp.PD-KEMD</div>
      <div class="sign-box-role">Ketua Umum PB PERSADIA Periode 2026–2029</div>
    </div>
  </div>

  <div class="footer-strip">
    <div class="footer-brand">KONGRES NASIONAL PERSADIA 2026</div>
    <div>Novotel Bogor & Convention Center • Halaman 2 dari 5</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 3: SUSUNAN ACARA SIMPOSIUM ILMIAH -->
<!-- ========================================================================= -->
<div class="page">
  <div class="header-strip">
    <div class="header-left">
      <img src="{logo_data}" alt="Logo Kongres" class="logo-img" />
      <div>
        <div class="header-org-names">AGENDA SIMPOSIUM ILMIAH • SABTU, 7 NOV 2026</div>
        <div class="header-org-sub">Novotel Bogor & Convention Center (Room Gede, Pangrango & Ballroom)</div>
      </div>
    </div>
    <div class="skp-badge">
      SIMPOSIUM MEDIS<br>
      <span style="font-size: 8pt; font-weight: 600;">Terakreditasi SKP Kemenkes</span>
    </div>
  </div>

  <div class="section-title">
    <h2>Susunan Acara Simposium Ilmiah & Kuliah Utama</h2>
    <span>Sabtu, 7 November 2026</span>
  </div>

  <table class="agenda-table">
    <thead>
      <tr>
        <th style="width: 85px;">Waktu</th>
        <th style="width: 165px;">Sesi Acara & Ruangan</th>
        <th>Detail Topik & Narasumber Pakar</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="time-col">08.00 – 08.30</td>
        <td>
          <div class="session-col">Registrasi Peserta</div>
          <span class="room-badge room-ballroom">Foyer Ballroom Novotel</span>
        </td>
        <td>Re-registrasi peserta Simposium & Workshop.</td>
      </tr>
      <tr>
        <td class="time-col">08.30 – 08.50</td>
        <td>
          <div class="session-col">SESI 1: Plenary Lecture</div>
          <span class="room-badge room-gede">Room Gede</span>
        </td>
        <td>
          <strong>Topik: "Good Habit for a Better Life"</strong><br>
          <strong>Narasumber:</strong> Prof. dr. Putu Moda Arsana, SpPD-KEMD <em>(Konsil Kedokteran Indonesia / PB PERKENI)</em><br>
          <span style="font-size: 8pt; color: #475569;"><strong>MC:</strong> Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD <em>(Sobat Diabet)</em></span>
        </td>
      </tr>
      <tr>
        <td class="time-col">08.50 – 09.00</td>
        <td>
          <div class="session-col">Opening Ceremony</div>
          <span class="room-badge room-gede">Room Gede</span>
        </td>
        <td>Pembukaan resmi Kongres Nasional PERSADIA & Konferensi Gabungan 2026 oleh Pimpinan Pengurus Pusat & Tamu Kehormatan.</td>
      </tr>
      <tr>
        <td class="time-col">09.00 – 10.00</td>
        <td>
          <div class="session-col">SESI 2: Presidents' Lecture</div>
          <span class="room-badge room-gede">Room Gede</span>
          <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Moderator:<br><strong>dr. Fauzia Kirana, SpPD</strong></div>
        </td>
        <td>
          • <strong>09.00 – 09.20: "Obesity: The Growing Metabolic Challenge"</strong> — Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD <em>(FKUI - RSCM / PB PERKENI)</em><br>
          • <strong>09.20 – 09.40: "Tirzepatide: Beyond the Numbers (Dual GIP/GLP-1)"</strong> — Dr. dr. K. Heri Nugroho Harioseno, SpPD-KEMD <em>(UNDIP / RSUP Dr. Kariadi)</em><br>
          • <strong>09.40 – 10.00: "Diabetes Update Treatment: Janus, The First and After"</strong> — Prof. Dr. dr. Achmad Rudijanto, SpPD-KEMD <em>(Universitas Brawijaya / PB PERKENI)</em>
        </td>
      </tr>
      <tr>
        <td class="time-col">10.00 – 10.30</td>
        <td>
          <div class="session-col">Coffee Break & Diskusi</div>
          <span class="room-badge room-ballroom">Foyer Novotel</span>
        </td>
        <td>Tanya jawab interaktif bersama pembicara Presidents' Lecture & Rehat Kopi/Kudapan Pagi.</td>
      </tr>
      <tr>
        <td class="time-col">10.30 – 11.30</td>
        <td>
          <div class="session-col">SESI 3: Sesi Dokter FKTP</div>
          <span class="room-badge room-gede">Room Gede</span>
          <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Moderator:<br><strong>dr. Nur Rusyda Kuddah, SpPD-KEMD</strong></div>
        </td>
        <td>
          • <strong>10.30 – 10.35: "Opening Speech"</strong> — Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD<br>
          • <strong>10.35 – 10.50: "My Life in FKTP: Realita & Dedikasi Layanan Primer"</strong> — dr. Baringin T A Manik, MKM <em>(Dokter Praktisi Layanan Primer)</em><br>
          • <strong>10.50 – 11.10: "Diabetes Approach in FKTP: Deteksi Cepat & Tatalaksana"</strong> — dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD <em>(FKUI - RSCM / PB PERSADIA)</em><br>
          • <strong>11.10 – 11.30: Diskusi & Tanya Jawab</strong>
        </td>
      </tr>
      <tr>
        <td class="time-col">11.30 – 12.30</td>
        <td>
          <div class="session-col">SESI 4: Simposium Paralel</div>
          <span class="room-badge room-gede">Room Gede</span>
          <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Moderator:<br><strong>dr. William Djauhari</strong></div>
        </td>
        <td>
          <strong>Topik: "Footsteps Leading to Neuropathy"</strong><br>
          • <strong>11.30 – 11.50:</strong> <em>From Upstream (Endocrinologist POV)</em> — dr. Roy Panusunan Sibarani, SpPD-KEMD <em>(Ketua Panitia / RS EMC Sentul)</em><br>
          • <strong>11.50 – 12.10:</strong> <em>To Downstream (Neurologist POV)</em> — dr. Gloria Tanjung, SpN <em>(PERDOSNI)</em><br>
          • <strong>12.10 – 12.30:</strong> Diskusi & Tanya Jawab<br>
          <span style="font-size: 7.5pt; color: #64748b;"><em>*(Catatan: Peserta paket Workshop mengikuti Workshop 1 di Room Pangrango)</em></span>
        </td>
      </tr>
      <tr>
        <td class="time-col">12.30 – 14.00</td>
        <td>
          <div class="session-col">ISHOMA</div>
          <span class="room-badge room-ballroom">Restoran Novotel</span>
        </td>
        <td>Istirahat, Sholat Dzuhur, dan Makan Siang Buffet Mewah di Restoran Novotel Bogor.</td>
      </tr>
      <tr>
        <td class="time-col">14.00 – 16.00</td>
        <td>
          <div class="session-col">Workshop Medis Paralel</div>
          <span class="room-badge room-gede">Room Gede</span> <span class="room-badge room-pangrango">Pangrango</span>
        </td>
        <td>Pelaksanaan Workshop 2, 3, 4, dan 5 secara paralel (rincian silabus & hands-on di Halaman 4).</td>
      </tr>
      <tr>
        <td class="time-col">18.30 – 21.00</td>
        <td>
          <div class="session-col">Malam Keakraban</div>
          <span class="room-badge room-ballroom">Grand Ballroom</span>
        </td>
        <td><strong>Gala Dinner & Ramah Tamah:</strong> Sambutan Pimpinan & Dewan Penasehat, Ramah Tamah Nasional Lintas Cabang se-Indonesia, dan Pagelaran Seni Budaya Tari Lilin-Lilin Kecil.</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-strip">
    <div class="footer-brand">KONGRES NASIONAL PERSADIA 2026</div>
    <div>Novotel Bogor & Convention Center • Halaman 3 dari 5</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 4: 5 WORKSHOP MEDIS HANDS-ON -->
<!-- ========================================================================= -->
<div class="page">
  <div class="header-strip">
    <div class="header-left">
      <img src="{logo_data}" alt="Logo Kongres" class="logo-img" />
      <div>
        <div class="header-org-names">PROGRAM WORKSHOP MEDIS & HANDS-ON</div>
        <div class="header-org-sub">Sabtu, 7 November 2026 | Novotel Bogor & Convention Center</div>
      </div>
    </div>
    <div class="skp-badge">
      INTENSIVE WORKSHOP<br>
      <span style="font-size: 8pt; font-weight: 600;">Hands-on Case Discussion</span>
    </div>
  </div>

  <div class="section-title">
    <h2>Kurikulum & Silabus 5 Workshop Medis Terapan (Hands-on)</h2>
    <span>Studi Kasus Riil & Bimbingan Pakar</span>
  </div>

  <!-- Workshop 1 -->
  <div class="ws-item">
    <div class="ws-header-line">
      <span class="ws-label">WORKSHOP 1</span>
      <span class="ws-meta-info">Sesi Paralel 4 | 11.30 – 12.30 WIB • Room Pangrango, Novotel Bogor</span>
    </div>
    <div class="ws-title-text">Diabetes Technology — Continuous Glucose Monitoring (CGM)</div>
    <div class="ws-speaker-text">1. dr. Johanes Purwoto, SpPD-KEMD (RS Mandaya Royal Puri / DII) &nbsp;•&nbsp; 2. Daniel Surbakti (Patient Advocate / Pegiat Diabetes)</div>
    <ul class="ws-syllabus-list">
      <li><strong>Mastering AGP:</strong> Panduan langkah demi langkah membaca dan menganalisis laporan Ambulatory Glucose Profile (AGP).</li>
      <li><strong>Clinical Decisions:</strong> Penyesuaian terapi insulin dan obat antidiabetes oral (OAD) berbasis tren sensor glukosa pada DMT1 dan DMT2.</li>
      <li><strong>Special Population:</strong> Pemanfaatan CGM pada prediabetes, kehamilan, geriatri, dan pasien rawat inap rumah sakit.</li>
    </ul>
    <div class="ws-hands-on-note">
      <strong>Hands-on Case Learning:</strong> Simulasi pemecahan kasus profil glikemik nyata, identifikasi hipoglikemia nokturnal asimtomatik, dan cara mengatasi artefak sensor.
    </div>
  </div>

  <!-- Workshop 2 -->
  <div class="ws-item">
    <div class="ws-header-line">
      <span class="ws-label">WORKSHOP 2</span>
      <span class="ws-meta-info">Sesi Paralel 5 | 14.00 – 15.00 WIB • Room Gede, Novotel Bogor</span>
    </div>
    <div class="ws-title-text">Semaglutide on Prediabetes — Beyond Weight Loss</div>
    <div class="ws-speaker-text">dr. Sony Wibisono Mudjanarko, SpPD-KEMD (UNAIR / RSUD Dr. Soetomo Surabaya)</div>
    <ul class="ws-syllabus-list">
      <li><strong>Early Metabolic Risk:</strong> Mengapa intervensi pada fase prediabetes sangat menentukan prognosis jangka panjang dan kardioproteksi.</li>
      <li><strong>Synergy with Lifestyle:</strong> Memadukan agen GLP-1 RA dengan modifikasi perilaku untuk pembalikan (reversal) prediabetes.</li>
      <li><strong>Prescribing Protocol:</strong> Seleksi pasien, panduan titrasi dosis bertahap, pencegahan efek samping GI, dan kepatuhan terapi.</li>
    </ul>
    <div class="ws-hands-on-note">
      <strong>Hands-on Case Learning:</strong> Navigasi studi kasus prediabetes riil: penyusunan rencana terapi, strategi titrasi, monitoring kepatuhan, dan protokol tapering-off.
    </div>
  </div>

  <!-- Workshop 3 -->
  <div class="ws-item">
    <div class="ws-header-line">
      <span class="ws-label">WORKSHOP 3</span>
      <span class="ws-meta-info">Sesi Paralel 5 | 14.00 – 15.00 WIB • Room Pangrango, Novotel Bogor</span>
    </div>
    <div class="ws-title-text">Nutrition in Diabetes — Practical Meal Planning & Carb Counting</div>
    <div class="ws-speaker-text">dr. Santi Syafril, SpPD-KEMD (Universitas Sumatera Utara / RSUP H. Adam Malik Medan)</div>
    <ul class="ws-syllabus-list">
      <li><strong>Dietary Patterns:</strong> Evaluasi kritis pola diet Mediterania, Low-Carb, dan Intermittent Fasting pada diabetes.</li>
      <li><strong>Carb Counting & GI:</strong> Strategi praktis menghitung karbohidrat menu makanan lokal Indonesia untuk menjaga kestabilan glukosa.</li>
      <li><strong>Counseling Tactics:</strong> Mengatasi hambatan kepatuhan pasien melalui konseling nutrisi persuasif berbasis empati.</li>
    </ul>
    <div class="ws-hands-on-note">
      <strong>Hands-on Case Learning:</strong> Merancang meal planning terapan untuk profil pasien menantang: pekerja shift malam, lansia anoreksia, dan pasien obesitas berat.
    </div>
  </div>

  <!-- Workshop 4 -->
  <div class="ws-item">
    <div class="ws-header-line">
      <span class="ws-label">WORKSHOP 4</span>
      <span class="ws-meta-info">Sesi Paralel 6 | 15.00 – 16.00 WIB • Room Gede, Novotel Bogor</span>
    </div>
    <div class="ws-title-text">Investigating Hypoglycemia — Stratification & Crisis Care</div>
    <div class="ws-speaker-text">1. Dr. dr. Yuanita Langi, SpPD-KEMD (UNSRAT / RSUP Prof. Kandou Manado)</div>
    <ul class="ws-syllabus-list">
      <li><strong>Hypoglycemia Unawareness:</strong> Mekanisme hilangnya respons otonom, stratifikasi risiko, dan teknik pemulihan kewaspadaan glukosa.</li>
      <li><strong>High-Risk Population:</strong> Kewaspadaan khusus pada pasien penurunan fungsi ginjal (CKD) dan usia lanjut.</li>
      <li><strong>Crisis Management:</strong> Algoritma kedaruratan hipoglikemia berat di klinik/IGD serta strategi pencegahan episode berulang.</li>
    </ul>
    <div class="ws-hands-on-note">
      <strong>Hands-on Case Learning:</strong> Memecahkan skenario kasus hipoglikemia berulang: identifikasi pemicu tersembunyi, de-eskalasi obat, dan edukasi keluarga (<em>Filling the gap:</em> <strong>dr. Henny Megawati, SpPD</strong>).
    </div>
  </div>

  <!-- Workshop 5 -->
  <div class="ws-item">
    <div class="ws-header-line">
      <span class="ws-label">WORKSHOP 5</span>
      <span class="ws-meta-info">Sesi Paralel 6 | 15.00 – 16.00 WIB • Room Pangrango, Novotel Bogor</span>
    </div>
    <div class="ws-title-text">Pre-Diabetes — Counting the Time to Action</div>
    <div class="ws-speaker-text">1. Dr. dr. Made Ratna Saraswati, SpPD-KEMD (UNUD / RSUP Prof. Ngoerah Denpasar)</div>
    <ul class="ws-syllabus-list">
      <li><strong>Halting Continuum:</strong> Mengidentifikasi jendela peluang emas sebelum terjadi kerusakan permanen sel beta pankreas.</li>
      <li><strong>Pharmacotherapy vs Lifestyle Modification in prediabetes:</strong> Menentukan batasan kapan cukup dengan intervensi gaya hidup dan kapan indikasi memulai terapi farmakologis.</li>
      <li><strong>Reversing Prediabetes:</strong> Resep nutrisi dan latihan fisik terukur untuk meningkatkan sensitivitas insulin.</li>
    </ul>
    <div class="ws-hands-on-note">
      <strong>Hands-on Case Learning:</strong> Menyusun program tata laksana personal untuk membalikkan diagnosis prediabetes pada pasien sindrom metabolik usia produktif (<em>Filling the gap:</em> <strong>dr. Pandu Sakti, SpPD, AIFO-K</strong>).
    </div>
  </div>

  <div class="footer-strip">
    <div class="footer-brand">KONGRES NASIONAL PERSADIA 2026</div>
    <div>Novotel Bogor & Convention Center • Halaman 4 dari 5</div>
  </div>
</div>

<!-- ========================================================================= -->
<!-- PAGE 5: TARIF, FASILITAS, REKENING & KONTAK -->
<!-- ========================================================================= -->
<div class="page">
  <div class="header-strip">
    <div class="header-left">
      <img src="{logo_data}" alt="Logo Kongres" class="logo-img" />
      <div>
        <div class="header-org-names">INVESTASI PENDAFTARAN & TATA CARA PEMBAYARAN</div>
        <div class="header-org-sub">Rekening Resmi Panitia Pelaksana KONAS PERSADIA 2026</div>
      </div>
    </div>
    <div class="skp-badge">
      PENDAFTARAN RESMI<br>
      <span style="font-size: 8pt; font-weight: 600;">Batas Akhir: 31 Okt 2026</span>
    </div>
  </div>

  <div class="section-title">
    <h2>Skema Tarif Investasi Pendaftaran</h2>
    <span>Batas akhir s.d. 31 Oktober 2026 (tetap dibuka bila kuota masih ada)</span>
  </div>

  <table class="pricing-table-clean">
    <thead>
      <tr>
        <th>Kategori Peserta Medis</th>
        <th>Pilihan Paket Kegiatan</th>
        <th>Biaya</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Dokter Spesialis <span style="font-weight: normal; font-size: 8pt; color: #64748b;">(Sp.PD, Sp.PD-KEMD)</span></td>
        <td>Symposium + Workshop</td>
        <td>Rp 2.500.000</td>
      </tr>
      <tr>
        <td>Dokter Umum <span style="font-weight: normal; font-size: 8pt; color: #64748b;">(Praktisi FKTP / Puskesmas / Klinik)</span></td>
        <td>Symposium + Workshop</td>
        <td>Rp 1.500.000</td>
      </tr>
      <tr>
        <td>Residen / PPDS <span style="font-weight: normal; font-size: 8pt; color: #64748b;">(Pendidikan Dokter Spesialis)</span></td>
        <td>Symposium + Workshop</td>
        <td>Rp 1.000.000</td>
      </tr>
      <tr>
        <td>Perawat, ahli gizi & Edukator Diabetes</td>
        <td><strong>Workshop Medis Terapan</strong></td>
        <td>Rp 400.000</td>
      </tr>
      <tr>
        <td>Mahasiswa Kedokteran S1 <span style="font-weight: normal; font-size: 8pt; color: #64748b;">(Wajib upload KTM aktif)</span></td>
        <td>Symposium + Workshop</td>
        <td>Rp 400.000</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 2px;">
    <h2>Fasilitas Peserta Ilmiah Lengkap</h2>
  </div>

  <div class="facilities-list">
    <div class="facility-item">
      <span class="facility-check">✓</span>
      <div><strong>Sertifikat Akreditasi SKP Kemenkes RI:</strong> Tercatat resmi di portal Plataran Sehat Kemenkes untuk pemenuhan SKP tenaga medis.</div>
    </div>
    <div class="facility-item">
      <span class="facility-check">✓</span>
      <div><strong>Seminar Kit:</strong> Tas kongres, panduan simposium workshop.</div>
    </div>
    <div class="facility-item">
      <span class="facility-check">✓</span>
      <div><strong>Jamuan Makan Hotel Novotel Bogor (Bintang 4):</strong> Makan siang prasmanan (buffet lunch) di restoran Novotel serta 2 kali Coffee Break (pagi dan sore).</div>
    </div>
    <div class="facility-item">
      <span class="facility-check">✓</span>
      <div><strong>Modul Hands-on Workshop:</strong> Lembar kerja kasus klinis dan bimbingan interaktif langsung bersama narasumber pakar endokrinologi.</div>
    </div>
    <div class="facility-item">
      <span class="facility-check">✓</span>
      <div><strong>Akses Malam Keakraban (Gala Dinner):</strong> Jamuan makan malam dan ramah tamah nasional lintas cabang pada Sabtu malam di Grand Ballroom Novotel.</div>
    </div>
    <div class="facility-item">
      <span class="facility-check">✓</span>
      <div><strong>Akses Bebas Hari Ke-2 (Stadion Pakansari):</strong> Bebas menghadiri Aksi Skrining Massal 7.000 Peserta, Senam Sehat Nusantara, dan Pameran Kesehatan pada Minggu pagi.</div>
    </div>
  </div>

  <div class="payment-contact-container">
    <div class="bank-details-box">
      <div class="bank-title-sm">Rekening Bank Resmi Panitia Pelaksana:</div>
      <div class="bank-name-lg">BANK VICTORIA</div>
      <div class="bank-acc-large">2101022971</div>
      <div class="bank-owner-name">Atas Nama: Perkumpulan Diabetes Inisiatif</div>
      <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 3px; line-height: 1.25;">
        ⚠️ <em>Mohon pastikan transfer menyertakan 3 digit kode unik agar pembayaran teridentifikasi otomatis oleh sistem verifikasi.</em>
      </div>
    </div>

    <div class="qr-clean-box">
      <img src="{qr_data}" alt="QR Registrasi" class="qr-clean-img" />
      <div style="font-size: 8pt; font-weight: 800; color: #0B3D5E;">Scan untuk Mendaftar</div>
      <div style="font-size: 8pt; font-weight: 800; color: #00B4AC;">konaspersadia.com/#pendaftaran</div>
      <div style="font-size: 7pt; color: #64748b; margin-top: 2px;">E-Ticket dikirim otomatis ke nomor WhatsApp</div>
    </div>
  </div>

  <div class="info-footer-grid">
    <div>
      <strong>🏨 Venue Utama & Akomodasi:</strong><br>
      <strong>Novotel Bogor Hotel & Convention Center</strong><br>
      Danau Bogor Raya, Sukaraja / Katulampa, Kota Bogor (Akses Tol Bogor Selatan / Tol Jagorawi).<br>
      <em>Rekomendasi Hotel Terdekat:</em> Ibis Styles Bogor Raya & Hotel M-One.
    </div>
    <div>
      <strong>📞 Kontak Panitia Resmi (Helpdesk):</strong><br>
      <strong>Hotline WhatsApp:</strong> 0898-0287-820 / 0853-7071-6686 (Seksi Acara & Registrasi)<br>
      <strong>Email Sekretariat:</strong> diabetesinitiativeid@gmail.com<br>
      <strong>Website:</strong> https://konaspersadia.com<br>
      <strong>Link Pendaftaran:</strong> https://konaspersadia.com/#pendaftaran
    </div>
  </div>

  <div class="footer-strip">
    <div class="footer-brand">KONGRES NASIONAL PERSADIA 2026</div>
    <div>Novotel Bogor & Convention Center • Halaman 5 dari 5</div>
  </div>
</div>

</body>
</html>
"""

with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML saved to {HTML_FILE}")

# Try to find a chrome executable
chrome_bin = None
candidates = [
    "/opt/google/chrome/google-chrome",
    "/opt/google/chrome/chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "chrome"
]
for bin_name in candidates:
    if os.path.exists(bin_name) and os.access(bin_name, os.X_OK):
        chrome_bin = bin_name
        break
    if shutil.which(bin_name):
        chrome_bin = bin_name
        break

if not chrome_bin:
    if os.path.exists(OUTPUT_PDF_PUBLIC):
        print(f"Warning: Chrome not found in environment, reusing existing PDF at {OUTPUT_PDF_PUBLIC}.")
        sys.exit(0)
    else:
        print("Warning: Chrome not found and no existing PDF found.")
        sys.exit(0)

# Invoke google-chrome headless to print to PDF
chrome_cmd = [
    chrome_bin,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--print-to-pdf-no-header",
    f"--print-to-pdf={OUTPUT_PDF_PUBLIC}",
    HTML_FILE
]

print(f"Executing {chrome_bin} headless print-to-pdf...")
result = subprocess.run(chrome_cmd, capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)

if os.path.exists(OUTPUT_PDF_PUBLIC):
    size_kb = os.path.getsize(OUTPUT_PDF_PUBLIC) / 1024
    print(f"SUCCESS! PDF created at:\n  {OUTPUT_PDF_PUBLIC} ({size_kb:.1f} KB)")
else:
    print("FAILED to create PDF.")
    sys.exit(1)
