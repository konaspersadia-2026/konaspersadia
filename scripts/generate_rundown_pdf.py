#!/usr/bin/env python3
import os

class PDFBuilder:
    def __init__(self, filename):
        self.filename = filename
        self.pages = []
        self.width = 595.28   # A4 Width in points
        self.height = 841.89  # A4 Height in points

    def new_page(self):
        page = PDFPage(self.width, self.height, len(self.pages) + 1)
        self.pages.append(page)
        return page

    def save(self):
        total_pages = len(self.pages)
        for p in self.pages:
            p.draw_footer(total_pages)

        objs = {}
        next_id = 5
        page_obj_ids = []

        for page in self.pages:
            p_id = next_id
            c_id = next_id + 1
            next_id += 2
            page_obj_ids.append((p_id, c_id, page))

        # 1: Catalog
        objs[1] = "<< /Type /Catalog /Pages 2 0 R >>"
        # 2: Pages root
        kids_str = " ".join([f"{p_id} 0 R" for p_id, _, _ in page_obj_ids])
        objs[2] = f"<< /Type /Pages /Kids [{kids_str}] /Count {total_pages} >>"
        # 3: Helvetica
        objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
        # 4: Helvetica-Bold
        objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"

        for p_id, c_id, page in page_obj_ids:
            stream_data = page.get_stream()
            stream_len = len(stream_data.encode('latin1'))
            objs[p_id] = f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {self.width:.2f} {self.height:.2f}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {c_id} 0 R >>"
            objs[c_id] = f"<< /Length {stream_len} >>\nstream\n{stream_data}\nendstream"

        os.makedirs(os.path.dirname(os.path.abspath(self.filename)), exist_ok=True)
        with open(self.filename, "wb") as f:
            f.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
            offsets = {}
            for obj_id in sorted(objs.keys()):
                offsets[obj_id] = f.tell()
                f.write(f"{obj_id} 0 obj\n{objs[obj_id]}\nendobj\n".encode('latin1'))

            xref_pos = f.tell()
            f.write(f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode('latin1'))
            for obj_id in sorted(objs.keys()):
                f.write(f"{offsets[obj_id]:010d} 00000 n \n".encode('latin1'))

            f.write(f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode('latin1'))


def get_char_width(c, font_size, is_bold=False):
    """Estimate proportional character width for Helvetica in points."""
    if c in "ijl:;.,!|' ":
        base = 0.27
    elif c in "frtI()[]-`":
        base = 0.35
    elif c in "mwMW@":
        base = 0.80
    elif c.isupper():
        base = 0.64
    elif c in "0123456789":
        base = 0.54
    else:
        base = 0.50
    if is_bold:
        base *= 1.10
    return base * font_size


def get_str_width(s, font_size, is_bold=False):
    return sum(get_char_width(c, font_size, is_bold) for c in s)


def wrap_text_line(text, max_width, font_size, is_bold=False, indent=8):
    """
    Wrap text into multiple lines that strictly fit within max_width.
    If wrapped, continuation lines are prefixed with indent spaces.
    """
    if not text:
        return []
    words = text.split(" ")
    lines = []
    curr_line = []
    curr_w = 0

    for word in words:
        w_word = get_str_width(word, font_size, is_bold)
        w_space = get_char_width(" ", font_size, is_bold) if curr_line else 0
        limit = max_width if len(lines) == 0 else (max_width - indent)

        if (curr_w + w_space + w_word <= limit) or not curr_line:
            curr_line.append(word)
            curr_w += w_space + w_word
        else:
            lines.append(" ".join(curr_line))
            curr_line = [word]
            curr_w = w_word

    if curr_line:
        lines.append(" ".join(curr_line))
    return lines


class PDFPage:
    def __init__(self, width, height, page_num):
        self.width = width
        self.height = height
        self.page_num = page_num
        self.ops = []
        self.curr_y = height - 35

    def rect(self, x, y, w, h, fill_rgb=None, stroke_rgb=None, line_width=1):
        s = "q\n"
        if line_width != 1:
            s += f"{line_width:.2f} w\n"
        if fill_rgb:
            r, g, b = fill_rgb
            s += f"{r:.3f} {g:.3f} {b:.3f} rg\n"
        if stroke_rgb:
            r, g, b = stroke_rgb
            s += f"{r:.3f} {g:.3f} {b:.3f} RG\n"
        s += f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re\n"
        if fill_rgb and stroke_rgb:
            s += "B\n"
        elif fill_rgb:
            s += "f\n"
        elif stroke_rgb:
            s += "S\n"
        s += "Q\n"
        self.ops.append(s)

    def line(self, x1, y1, x2, y2, stroke_rgb=(0,0,0), line_width=1):
        r, g, b = stroke_rgb
        s = f"q\n{line_width:.2f} w\n{r:.3f} {g:.3f} {b:.3f} RG\n{x1:.2f} {y1:.2f} m\n{x2:.2f} {y2:.2f} l\nS\nQ\n"
        self.ops.append(s)

    def escape(self, text):
        text = (
            text.replace('•', '\x95')
                .replace('–', '-')
                .replace('—', '-')
                .replace('“', '"')
                .replace('”', '"')
                .replace("’", "'")
                .replace("‘", "'")
        )
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def text(self, x, y, text, font="F1", size=10, rgb=(0,0,0)):
        r, g, b = rgb
        esc = self.escape(text)
        s = f"BT\n/{font} {size:.2f} Tf\n{r:.3f} {g:.3f} {b:.3f} rg\n1 0 0 1 {x:.2f} {y:.2f} Tm\n({esc}) Tj\nET\n"
        self.ops.append(s)

    def draw_header_banner(self):
        w = self.width - 70
        h = 66
        x = 35
        y = self.height - 35 - h
        # Dark navy background
        self.rect(x, y, w, h, fill_rgb=(0.043, 0.239, 0.369), stroke_rgb=(0.000, 0.706, 0.675), line_width=1.5)
        # Accent teal line
        self.rect(x, y, w, 3.5, fill_rgb=(0.000, 0.706, 0.675))

        self.text(x + 16, y + 45, "SUSUNAN / RUNDOWN ACARA RESMI", font="F2", size=14, rgb=(1, 1, 1))
        self.text(x + 16, y + 29, "KONGRES NASIONAL PERSADIA XI & KONFERENSI GABUNGAN 2026", font="F2", size=9, rgb=(0.85, 0.95, 1.0))
        self.text(x + 16, y + 14, "Novotel Bogor Golf Resort & GOR Pakansari Cibinong  |  7 - 8 November 2026", font="F1", size=8, rgb=(0.75, 0.9, 0.95))
        self.curr_y = y - 14

    def draw_page_top_bar(self, title):
        w = self.width - 70
        x = 35
        y = self.height - 38
        self.rect(x, y, w, 20, fill_rgb=(0.043, 0.239, 0.369))
        self.text(x + 10, y + 5.5, title, font="F2", size=8.5, rgb=(1, 1, 1))
        self.text(x + w - 145, y + 5.5, "KONAS PERSADIA 2026", font="F1", size=8, rgb=(0.8, 0.9, 0.95))
        self.curr_y = y - 14

    def draw_section_heading(self, title, subtitle=None):
        w = self.width - 70
        x = 35
        y = self.curr_y - 18
        # Teal left highlight
        self.rect(x, y, 3.5, 16, fill_rgb=(0.000, 0.706, 0.675))
        self.text(x + 10, y + 3, title, font="F2", size=10, rgb=(0.043, 0.239, 0.369))
        if subtitle:
            self.text(x + 10, y - 9.5, subtitle, font="F1", size=7.5, rgb=(0.4, 0.45, 0.5))
            self.curr_y = y - 16
        else:
            self.curr_y = y - 6

    def draw_table_header(self):
        w = self.width - 70
        x = 35
        h = 16
        y = self.curr_y - h
        self.rect(x, y, w, h, fill_rgb=(0.91, 0.935, 0.965), stroke_rgb=(0.82, 0.86, 0.90), line_width=0.75)
        
        c1_w = 80
        c2_w = 115
        self.line(x + c1_w, y, x + c1_w, y + h, stroke_rgb=(0.82, 0.86, 0.90), line_width=0.75)
        self.line(x + c1_w + c2_w, y, x + c1_w + c2_w, y + h, stroke_rgb=(0.82, 0.86, 0.90), line_width=0.75)
        
        self.text(x + 6, y + 4.5, "WAKTU", font="F2", size=7.5, rgb=(0.1, 0.2, 0.3))
        self.text(x + c1_w + 6, y + 4.5, "SESI & RUANGAN", font="F2", size=7.5, rgb=(0.1, 0.2, 0.3))
        self.text(x + c1_w + c2_w + 6, y + 4.5, "AGENDA / MATERI & NARASUMBER", font="F2", size=7.5, rgb=(0.1, 0.2, 0.3))
        self.curr_y = y

    def draw_table_row(self, time_str, col2_title, col2_sub, lines, bg_alt=False):
        """
        Draw a table row with automatic line-wrapping so text NEVER leaks out of cells.
        """
        w = self.width - 70
        x = 35
        c1_w = 80
        c2_w = 115
        c3_w = w - c1_w - c2_w  # 525 - 80 - 115 = 330 pt
        c3_max_text_w = c3_w - 14 # 316 pt max text width

        # 1. Prepare Column 2 lines (Wrap if needed)
        c2_title_wrapped = wrap_text_line(col2_title, c2_w - 12, 8, is_bold=True)
        c2_sub_wrapped = wrap_text_line(col2_sub, c2_w - 12, 7, is_bold=False) if col2_sub else []
        c2_total_lines = len(c2_title_wrapped) + len(c2_sub_wrapped)

        # 2. Prepare Column 3 lines (Strict wrapping to prevent horizontal leak)
        c3_rendered = []
        for line in lines:
            is_bold = line.startswith("•") or line.startswith("Topik") or line.startswith("Speaker") or line.startswith("ROOM ") or line.startswith("Narasumber")
            font = "F2" if is_bold and not line.startswith("  ") else "F1"
            color = (0.043, 0.239, 0.369) if font == "F2" else (0.18, 0.22, 0.26)
            
            # Wrap within available column width
            wrapped = wrap_text_line(line, c3_max_text_w, 7.5, is_bold=(font == "F2"), indent=8)
            for idx, w_line in enumerate(wrapped):
                c3_rendered.append({
                    "text": w_line,
                    "font": font,
                    "color": color,
                    "is_cont": (idx > 0)
                })

        # 3. Calculate exact row height
        c3_h = 10 + (len(c3_rendered) * 10)
        c2_h = 10 + (len(c2_title_wrapped) * 10) + (len(c2_sub_wrapped) * 8.5)
        row_h = max(22, c3_h, c2_h)
        y = self.curr_y - row_h

        # 4. Draw Row Cell Background and Outer Border
        bg_rgb = (0.97, 0.98, 0.99) if bg_alt else (1.0, 1.0, 1.0)
        self.rect(x, y, w, row_h, fill_rgb=bg_rgb, stroke_rgb=(0.86, 0.88, 0.91), line_width=0.75)

        # 5. Draw Vertical Column Dividers
        self.line(x + c1_w, y, x + c1_w, y + row_h, stroke_rgb=(0.86, 0.88, 0.91), line_width=0.75)
        self.line(x + c1_w + c2_w, y, x + c1_w + c2_w, y + row_h, stroke_rgb=(0.86, 0.88, 0.91), line_width=0.75)

        # 6. Draw Col 1: Time
        self.text(x + 6, y + row_h - 13, time_str, font="F2", size=8, rgb=(0.043, 0.239, 0.369))

        # 7. Draw Col 2: Session & Room
        cur_c2_y = y + row_h - 13
        for t_line in c2_title_wrapped:
            self.text(x + c1_w + 6, cur_c2_y, t_line, font="F2", size=8, rgb=(0.12, 0.16, 0.20))
            cur_c2_y -= 10
        cur_c2_y -= 1
        for s_line in c2_sub_wrapped:
            self.text(x + c1_w + 6, cur_c2_y, s_line, font="F1", size=7, rgb=(0.42, 0.47, 0.52))
            cur_c2_y -= 8.5

        # 8. Draw Col 3: Agenda / Content Lines
        c3_x = x + c1_w + c2_w + 6
        cur_c3_y = y + row_h - 13
        for item in c3_rendered:
            indent_offset = 6 if item["is_cont"] else 0
            self.text(c3_x + indent_offset, cur_c3_y, item["text"], font=item["font"], size=7.5, rgb=item["color"])
            cur_c3_y -= 10

        self.curr_y = y

    def draw_footer(self, total_pages):
        x = 35
        w = self.width - 70
        y = 18
        self.line(x, y + 14, x + w, y + 14, stroke_rgb=(0.85, 0.88, 0.92), line_width=0.5)
        self.text(x, y + 7, "* Jadwal dan susunan pembicara dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu.", font="F1", size=6.5, rgb=(0.6, 0.4, 0.15))
        self.text(x, y, "Kongres Nasional PERSADIA XI & Konferensi Gabungan 2026", font="F1", size=7, rgb=(0.45, 0.5, 0.55))
        page_str = f"Halaman {self.page_num} dari {total_pages}"
        self.text(x + w - 75, y, page_str, font="F2", size=7, rgb=(0.4, 0.45, 0.5))

    def get_stream(self):
        return "".join(self.ops)


def build_pdf():
    pdf = PDFBuilder("public/rundown-konas-persadia-2026.pdf")

    # ================= PAGE 1 =================
    p1 = pdf.new_page()
    p1.draw_header_banner()
    p1.draw_section_heading(
        "A. JADWAL SIMPOSIUM & WORKSHOP MEDIS (SABTU, 7 NOV 2026)",
        "Venue: Novotel Bogor Golf Resort  |  Room Gede & Room Pangrango"
    )
    p1.draw_table_header()

    p1.draw_table_row(
        "08.00 - 08.30", "Registrasi", "Foyer Novotel",
        ["Registrasi Ulang Peserta Simposium & Workshop Medis di Foyer Novotel Bogor"],
        bg_alt=True
    )

    p1.draw_table_row(
        "08.30 - 09.00", "SESI 1: Plenary", "Room Gede",
        [
            "Topik: Good Habit for a Better Life",
            "Speaker: Prof. dr. Putu Moda Arsana, SpPD-KEMD",
            "MC: Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD",
            "08.50 - 09.00: Opening Ceremony Resmi KONAS PERSADIA 2026"
        ]
    )

    p1.draw_table_row(
        "09.00 - 10.30", "SESI 2: Presidents", "Room Gede",
        [
            "09.00 - 09.20: Obesity - Prof. dr. Sidartawan Soegondo, SpPD-KEMD",
            "09.20 - 09.40: Tirzepatide: Beyond Numbers - Dr. dr. K. Heri Nugroho, SpPD-KEMD",
            "09.40 - 10.00: Diabetes Update Treatment - Prof. Dr. dr. Achmad Rudijanto, SpPD-KEMD",
            "Moderator: dr. Fauzia Kirana, SpPD",
            "10.00 - 10.30: DISCUSSION + COFFEE BREAK"
        ],
        bg_alt=True
    )

    p1.draw_table_row(
        "10.30 - 11.30", "SESI 3: Dokter FKTP", "Room Gede",
        [
            "10.30 - 10.50: My Life in FKTP - dr. Baringin T A Manik, MKM",
            "10.50 - 11.10: Diabetes Approach in FKTP - dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD",
            "Moderator: dr. Maria Sen",
            "11.10 - 11.30: DISCUSSION & Tanya Jawab Kasus Layanan Primer"
        ]
    )

    p1.draw_table_row(
        "11.30 - 12.30", "SESI 4: Paralel", "Room Gede & Pangrango",
        [
            "ROOM GEDE: Footsteps Leading to Neuropathy",
            "• Upstream (Endocrinologist POV): dr. Roy Panusunan Sibarani, SpPD-KEMD",
            "• Downstream (Neurologist POV): dr. Gloria Tanjung, SpN (Mod: dr. William Djauhari)",
            "ROOM PANGRANGO: Workshop 1 - Diabetes Technology: CGM",
            "• Doctor's POV: dr. Johanes Purwoto, SpPD-KEMD (AGP reports, clinical decisions in T1D/T2D)",
            "• Patient's POV: Daniel Surbakti",
            "• HANDS ON: Case-based CGM Workshop - Solving real-world glycemic profiles"
        ]
    )

    p1.draw_table_row(
        "12.30 - 14.00", "ISHOMA", "Restoran / Ballroom 2",
        ["Istirahat, Sholat, dan Makan Siang Bersama"],
        bg_alt=True
    )

    # ================= PAGE 2 =================
    p2 = pdf.new_page()
    p2.draw_page_top_bar("RUNDOWN SIMPOSIUM, WORKSHOP & HEALTH FORUM (7 NOV 2026)")

    p2.draw_section_heading(
        "LANJUTAN WORKSHOP MEDIS (SABTU SIANG, 7 NOV 2026)",
        "Venue: Novotel Bogor  |  Room Gede & Room Pangrango"
    )
    p2.draw_table_header()

    p2.draw_table_row(
        "14.00 - 15.00", "SESI 5: Paralel WS", "Room Gede & Pangrango",
        [
            "ROOM GEDE: Workshop 2 - Semaglutide on Prediabetes",
            "• Speaker: dr. Sony Wibisono Mudjanarko, SpPD-KEMD (Metabolic risk & dosing)",
            "• HANDS ON: Navigating Real-World Prediabetes with Semaglutide",
            "ROOM PANGRANGO: Workshop 3 - Nutrition in Diabetes",
            "• Speaker: dr. Santi Syafril, SpPD-KEMD (Mediterranean, Low-Carb, IF, Carb Counting)",
            "• HANDS ON: Meal planning & case-based diets (shift worker, obesity, elderly)"
        ]
    )

    p2.draw_table_row(
        "15.00 - 16.00", "SESI 6: Paralel WS", "Room Gede & Pangrango",
        [
            "ROOM GEDE: Workshop 4 - Investigating Hypoglycemia",
            "• Speaker: Dr. dr. Yuanita Langi, SpPD-KEMD (Unawareness, special populations)",
            "• HANDS ON: Case-based complex hypoglycemia (dr. Henny Megawati, SpPD)",
            "ROOM PANGRANGO: Workshop 5 - Pre-Diabetes: Counting the Time",
            "• Speaker: Dr. dr. Made Ratna Saraswati, SpPD-KEMD (Early detection & balance)",
            "• HANDS ON: Personalizing prediabetes management (dr. Pandu Sakti, SpPD, AIFO-K)"
        ],
        bg_alt=True
    )

    p2.draw_table_row(
        "16.00 - 18.30", "ISHOMA", "Novotel Bogor",
        ["Istirahat, Sholat & Persiapan Acara Malam Keakraban"]
    )

    p2.draw_table_row(
        "18.30 - 21.00", "Malam Keakraban", "Grand Ballroom Novotel",
        [
            "Gala Dinner, Kata Sambutan Pimpinan & Dewan Penasehat",
            "Sesi Diskusi Reflektif & Ramah Tamah Lintas Cabang",
            "Penampilan Lagu dan Tari Lilin-Lilin Kecil (Host: Tamara Geraldine)"
        ],
        bg_alt=True
    )

    p2.draw_section_heading(
        "B. DIABETES HEALTH FORUM (SABTU, 7 NOV 2026)",
        "Venue: Ballroom 2 Novotel Bogor  |  Khusus Awam, Keluarga & Komunitas"
    )
    p2.draw_table_header()

    p2.draw_table_row(
        "08.30 - 08.40", "Pembukaan", "Ballroom 2",
        ["Pembukaan Resmi Diabetes Health Forum oleh MC & Tim Edukasi PERSADIA"]
    )

    p2.draw_table_row(
        "08.40 - 09.55", "Sesi Edukasi & Q&A", "Ballroom 2",
        [
            "Topik: 'Masih muda, kok diabetes?' - Mengupas lonjakan diabetes usia muda",
            "Faktor risiko gaya hidup vs genetik & langkah preventif dini",
            "09.25 - 09.55: Sesi Tanya Jawab Interaktif Narasumber & Peserta"
        ],
        bg_alt=True
    )

    p2.draw_table_row(
        "09.55 - 10.35", "Bincang & Break", "Ballroom 2",
        [
            "Temu 6 Tokoh Senior Penyandang Diabetes: Kiat Hidup Berkualitas & Mandiri",
            "10.25 - 10.35: Coffee Break & Kudapan Sehat Seimbang"
        ]
    )

    p2.draw_table_row(
        "10.35 - 11.50", "Talkshow Spesial", "Ballroom 2",
        [
            "Topik: 'Cantik, Bugar, Bergairah'",
            "Narasumber: dr. Boyke Dian Nugraha, SpOG, MARS (Pakar Seksologi & Pasutri)",
            "11.20 - 11.50: Tanya Jawab Terbuka Seputar Vitalitas & Keharmonisan Pasutri"
        ],
        bg_alt=True
    )

    p2.draw_table_row(
        "11.50 - Selesai", "Penutupan & Lunch", "Ballroom 2 / Restoran",
        [
            "Penutupan, Sesi Foto Bersama, Ramah Tamah dan Makan Siang Bersama"
        ]
    )

    # ================= PAGE 3 =================
    p3 = pdf.new_page()
    p3.draw_page_top_bar("RAPAT ORGANISASI (7 NOV) & PESTA RAKYAT (8 NOV 2026)")

    p3.draw_section_heading(
        "C. JADWAL RAPAT ORGANISASI PERSADIA, PEDI & PERKENI",
        "Venue: Novotel Bogor  |  Sabtu, 7 November 2026"
    )
    p3.draw_table_header()

    p3.draw_table_row(
        "14.00 - 17.00", "Raker PERSADIA", "Karang-Sanggar",
        [
            "Rapat Kerja Nasional PERSADIA",
            "Ruang Breakout Sidang: Ruang Karang, Ruang Sanggar, Ruang Geulis"
        ]
    )

    p3.draw_table_row(
        "14.00 - 15.00", "KONKER Bersama", "Ballroom 2 Novotel",
        [
            "Konferensi Kerja Koordinasi Bersama Pengurus Pusat PERSADIA & PEDI"
        ],
        bg_alt=True
    )

    p3.draw_table_row(
        "14.00 - 17.00", "Raker PEDI", "Ruang Kencana",
        [
            "Rapat Kerja Perkumpulan Edukator Diabetes Indonesia (PEDI)"
        ]
    )

    p3.draw_table_row(
        "18.00 - 19.00", "Sinergi Organisasi", "Ballroom 2 Novotel",
        [
            "Rapat Koordinasi & Sinergi Program Kerja PB PERKENI & PEDI"
        ],
        bg_alt=True
    )

    p3.draw_section_heading(
        "D. PESTA RAKYAT & SENAM SEHAT NUSANTARA",
        "Venue: GOR Pakansari Cibinong, Kabupaten Bogor  |  Minggu, 8 November 2026"
    )
    p3.draw_table_header()

    p3.draw_table_row(
        "05.00 - 06.00", "Registrasi", "Pintu 8 Pakansari",
        ["Pengambilan snack pagi dan Goodie Bag Peserta per koordinator wilayah"]
    )

    p3.draw_table_row(
        "06.00 - 07.00", "Parade & Skrining", "Area Lapangan GOR",
        [
            "Parade Kontingen Cabang PERSADIA se-Indonesia (Yell-yell & Mars)",
            "Pemeriksaan Gula Darah Massal Gratis Target 5.000 Peserta"
        ],
        bg_alt=True
    )

    p3.draw_table_row(
        "07.00 - 07.30", "Pembukaan Resmi", "Panggung Utama",
        ["Menyanyikan Indonesia Raya, Sambutan Pimpinan PERSADIA & Pejabat Daerah"]
    )

    p3.draw_table_row(
        "07.30 - 08.30", "Senam Bersama", "Lapangan Utama",
        ["Senam Sehat Diabetesi Nusantara bersama instruktur profesional KORMI & PERSADIA"],
        bg_alt=True
    )

    p3.draw_table_row(
        "08.30 - 10.00", "Showcase Senam", "Panggung & Lapangan",
        ["Peragaan Variasi Senam Kesehatan Daerah perwakilan delegasi cabang"]
    )

    p3.draw_table_row(
        "10.00 - 11.00", "Panggung Hiburan", "Panggung Utama",
        ["Pertunjukan Musik, Panggung Gembira & Pengundian Doorprize Utama"],
        bg_alt=True
    )

    p3.draw_table_row(
        "11.00 - 12.00", "Makan Siang", "Area Tribun & Lapangan",
        ["Pembagian dan Santap Makan Siang Bersama Seluruh Peserta"]
    )

    p3.draw_table_row(
        "12.00 - Selesai", "Penutupan Resmi", "GOR Pakansari",
        ["Acara Pesta Rakyat Selesai Resmi. Sampai jumpa di event PERSADIA berikutnya!"],
        bg_alt=True
    )

    # Page 3 Disclaimer Box
    disc_y = p3.curr_y - 12
    p3.rect(35, disc_y - 26, p3.width - 70, 32, fill_rgb=(0.99, 0.98, 0.95), stroke_rgb=(0.9, 0.8, 0.6), line_width=0.75)
    p3.text(45, disc_y - 2, "* CATATAN PENTING & DISCLAIMER:", font="F2", size=7, rgb=(0.7, 0.35, 0.05))
    p3.text(45, disc_y - 12, "Seluruh susunan jadwal acara, pembagian ruangan, dan daftar narasumber/pembicara dapat berubah sewaktu-waktu", font="F1", size=6.5, rgb=(0.4, 0.3, 0.1))
    p3.text(45, disc_y - 20, "tanpa pemberitahuan terlebih dahulu menyesuaikan dengan dinamika teknis di lokasi acara. Informasi terbaru via website resmi.", font="F1", size=6.5, rgb=(0.4, 0.3, 0.1))

    pdf.save()
    print("PDF generated successfully: public/rundown-konas-persadia-2026.pdf")

if __name__ == "__main__":
    build_pdf()
