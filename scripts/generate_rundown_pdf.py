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
        base = 0.28
    elif c in "frtI()[]-`":
        base = 0.38
    elif c in "mwMW@":
        base = 0.85
    elif c.isupper():
        base = 0.68
    elif c in "0123456789":
        base = 0.56
    else:
        base = 0.55
    if is_bold:
        base *= 1.12
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

        self.text(x + 16, y + 45, "SUSUNAN / RUNDOWN ACARA RESMI", font="F2", size=13, rgb=(1, 1, 1))
        self.text(x + 16, y + 29, "KONGRES NASIONAL PERSADIA 2026 (PB PERSADIA • PP PEDI • PB PERKENI)", font="F2", size=8.5, rgb=(0.85, 0.95, 1.0))
        self.text(x + 16, y + 14, "Novotel Bogor Golf Resort & Stadion Pakansari, Cibinong, Kabupaten Bogor  |  7 - 8 November 2026", font="F1", size=7.5, rgb=(0.75, 0.9, 0.95))
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

    def draw_table_header(self, c1="WAKTU", c2="SESI & RUANGAN", c3="AGENDA / MATERI & NARASUMBER"):
        w = self.width - 70
        x = 35
        h = 16
        y = self.curr_y - h
        self.rect(x, y, w, h, fill_rgb=(0.91, 0.935, 0.965), stroke_rgb=(0.82, 0.86, 0.90), line_width=0.75)
        
        c1_w = 80
        c2_w = 115
        self.line(x + c1_w, y, x + c1_w, y + h, stroke_rgb=(0.82, 0.86, 0.90), line_width=0.75)
        self.line(x + c1_w + c2_w, y, x + c1_w + c2_w, y + h, stroke_rgb=(0.82, 0.86, 0.90), line_width=0.75)
        
        self.text(x + 6, y + 4.5, c1, font="F2", size=7.5, rgb=(0.1, 0.2, 0.3))
        self.text(x + c1_w + 6, y + 4.5, c2, font="F2", size=7.5, rgb=(0.1, 0.2, 0.3))
        self.text(x + c1_w + c2_w + 6, y + 4.5, c3, font="F2", size=7.5, rgb=(0.1, 0.2, 0.3))
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
        c3_max_text_w = c3_w - 18 # 312 pt max text width with generous cell padding

        # 1. Prepare Column 2 lines (Wrap if needed)
        c2_title_wrapped = wrap_text_line(col2_title, c2_w - 12, 8, is_bold=True)
        c2_sub_wrapped = wrap_text_line(col2_sub, c2_w - 12, 7, is_bold=False) if col2_sub else []

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
        self.text(x, y, "Kongres Nasional PERSADIA 2026 • Novotel Bogor & Stadion Pakansari", font="F1", size=7, rgb=(0.45, 0.5, 0.55))
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
        "Venue: Novotel Bogor Golf Resort & Convention Center (Room Gede, Room Pangrango & Room Geulis)"
    )
    p1.draw_table_header("WAKTU", "AGENDA / SESI", "DETAIL ACARA & NARASUMBER")

    p1.draw_table_row(
        "07.00 - 08.00", "Registrasi Peserta", "Foyer Ballroom Novotel",
        ["Registrasi dan re-registrasi peserta Simposium & Workshop Medis"],
        bg_alt=True
    )

    p1.draw_table_row(
        "08.00 - 08.20", "SESI 1: Plenary Lecture", "Room Gede",
        [
            "Topik: Good Habit for a Better Life",
            "Narasumber: Prof. dr. Putu Moda Arsana, SpPD-KEMD (Konsil Kedokteran Indonesia / PB PERKENI)",
            "MC: Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD (Sobat Diabet)"
        ]
    )

    p1.draw_table_row(
        "08.20 - 08.55", "Opening Ceremony", "Room Gede",
        [
            "MC: Dr. dr. Rudy Kurniawan, SpPD, MM, MARS, Dip.TH, DCD",
            "• 08.20 - 08.25: Pembacaan Doa - Pak Agus Sumitro (Persadia Depok)",
            "• 08.25 - 08.30: Lagu Kebangsaan Indonesia Raya - Ibu Susan (Persadia Bogor)",
            "• 08.30 - 08.32: Sambutan Selamat Datang Ketua Panitia - dr. Roy Panusunan Sibarani, SpPD-KEMD",
            "• 08.32 - 08.35: Sambutan Selamat Datang Presiden Persadia - DR. dr. K. Heri Nugroho Harioseno, SpPD-KEMD",
            "• 08.35 - 08.50: Sambutan Wakil Menteri Kesehatan RI - Prof. dr. Dante Saksono Harbuwono, SpPD-KEMD, PhD",
            "• 08.50 - 08.55: Pembukaan Resmi Konas Persadia, Konker PEDI, dan Konker PERKENI 2026"
        ],
        bg_alt=True
    )

    p1.draw_table_row(
        "09.00 - 10.30", "SESI 2: Presidents' Lecture", "Room Gede",
        [
            "Moderator: dr. Fauzia Kirana, SpPD",
            "• 09.00 - 09.30: Topic: Obesity: The Growing Metabolic Challenge - Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD (FKUI - RSCM / PB PERKENI)",
            "• 09.30 - 09.50: Topic: Tirzepatide: Beyond the Numbers - Dr. dr. K. Heri Nugroho Harioseno, SpPD-KEMD (UNDIP / RSUP Dr. Kariadi)",
            "• 09.50 - 10.10: Topic: Diabetes Update Treatment: Janus, The First and After - Prof. Dr. dr. Achmad Rudijanto, SpPD-KEMD (Universitas Brawijaya / PB PERKENI)",
            "• 10.10 - 10.30: Discussion + Coffee Break"
        ]
    )

    p1.draw_table_row(
        "10.30 - 11.30", "SESI 3: Dokter Layanan Primer", "Room Gede (FKTP)",
        [
            "Moderator: dr. Nur Rusyda Kuddah, SpPD-KEMD",
            "• 10.30 - 10.35: Opening Speech - Prof. Dr. dr. Sidartawan Soegondo, SpPD-KEMD",
            "• 10.35 - 10.50: Topic: My Life in FKTP: Realita & Dedikasi Layanan Primer - dr. Baringin T A Manik, MKM",
            "• 10.50 - 11.20: Topic: Diabetes Approach in FKTP: Deteksi Cepat & Tatalaksana - dr. Dicky Levenus Tahapary, SpPD-KEMD, PhD (FKUI - RSCM / PB PERSADIA)",
            "• 11.20 - 11.30: Discussion & Tanya Jawab"
        ],
        bg_alt=True
    )

    p1.draw_table_row(
        "11.30 - 12.30", "SESI 4: Paralel 3 Ruang", "Gede, Pangrango, Geulis",
        [
            "ROOM GEDE: Footsteps Leading to Neuropathy (Mod: dr. William Djauhari)",
            "• 11.40 - 12.00: From Upstream: Endocrinologist POV - dr. Roy Panusunan Sibarani, SpPD-KEMD",
            "• 12.00 - 12.20: To Downstream: Neurologist POV - dr. Gloria Tanjung, SpN (PERDOSNI)",
            "• 12.20 - 12.30: Discussion & Tanya Jawab",
            "ROOM PANGRANGO: Workshop 1 - Diabetes Technology: CGM (Mod: dr. Kartika, SpPD)",
            "• 11.30 - 12.00: Doctor's POV - dr. Johanes Purwoto, SpPD-KEMD",
            "• 12.00 - 12.10: Patient's POV - Daniel Surbakti (Patient Advocate)",
            "• 12.10 - 12.30: HANDS ON & Discussion: Pemasangan CGM & Studi Kasus Profil Glikemik",
            "ROOM GEULIS: Workshop 6 - Propolis Extract (Propoelix) in Obesity & Diabetes",
            "• 11.30 - 12.00: Speaker: dr. H. Harli Amir Mahmudji, SpPD-KEMD",
            "• 12.00 - 12.30: Discussion & Tanya Jawab"
        ]
    )

    p1.draw_table_row(
        "12.40 - 14.00", "ISHOMA", "Restoran Novotel",
        ["Istirahat, Sholat Dzuhur, dan Makan Siang Buffet di Restoran Novotel Bogor"],
        bg_alt=True
    )

    # ================= PAGE 2 =================
    p2 = pdf.new_page()
    p2.draw_page_top_bar("RUNDOWN SIMPOSIUM MEDIS & HEALTH FORUM (7 NOV 2026)")

    p2.draw_section_heading(
        "LANJUTAN SIMPOSIUM & WORKSHOP MEDIS (SABTU SIANG, 7 NOV 2026)",
        "Venue: Novotel Bogor  |  Room Gede & Room Pangrango"
    )
    p2.draw_table_header()

    p2.draw_table_row(
        "14.00 - 15.00", "SESI 5: Paralel WS", "Room Gede & Pangrango",
        [
            "ROOM GEDE: Workshop 2 - Semaglutide on Prediabetes",
            "• 14.00 - 14.30: Speaker: dr. Sony Wibisono Mudjanarko, SpPD-KEMD (UNAIR / RSUD Dr. Soetomo)",
            "• 14.30 - 15.00: HANDS ON: Case-Based Learning: Navigating Prediabetes with Semaglutide",
            "  Fasilitator: dr. Sony Wibisono Mudjanarko, dr. Khomimah, dr. Nanang Miftah Fajari",
            "ROOM PANGRANGO: Workshop 3 - Nutrition in Diabetes",
            "• 14.00 - 14.30: Speaker: dr. Santi Syafril, SpPD-KEMD (USU / RSUP H. Adam Malik Medan)",
            "• 14.30 - 15.00: HANDS ON: Meal Planning & Practical Diets (Shift Worker, Obesity, Elderly)",
            "  Fasilitator: dr. Santi Syafril, dr. Herni Basir, dr. Brama Ihsan Sazli"
        ]
    )

    p2.draw_table_row(
        "15.00 - 16.00", "SESI 6: Paralel WS", "Room Gede & Pangrango",
        [
            "ROOM GEDE: Workshop 4 - Investigating Hypoglycemia",
            "• 15.00 - 15.30: Speaker: Dr. dr. Yuanita Langi, SpPD-KEMD (UNSRAT / RSUP Prof. Kandou)",
            "• 15.30 - 16.00: HANDS ON: Case-based workshop: Navigating Complex Hypoglycemic Scenarios",
            "  Fasilitator: Dr. dr. Yuanita Langi, dr. Rulli Rosandi, dr. Yohana Ceria Anindita",
            "  Filling the gap: dr. Henny Megawati, SpPD",
            "ROOM PANGRANGO: Workshop 5 - Pre-Diabetes: Counting the Time",
            "• 15.00 - 15.30: Speaker: Dr. dr. Made Ratna Saraswati, SpPD-KEMD (UNUD / RSUP Prof. Ngoerah)",
            "• 15.30 - 16.00: HANDS ON: Case-based learning: Personalizing Prediabetes Management",
            "  Fasilitator: Dr. dr. Made Ratna Saraswati, Dr. dr. Fabiola MS Adam, dr. Nurleny Sutanto",
            "  Filling the gap: dr. Pandu Sakti, SpPD, AIFO-K"
        ],
        bg_alt=True
    )

    p2.draw_table_row(
        "16.00 - 18.30", "ISHOMA", "Novotel Bogor",
        ["Istirahat, Sholat, dan Persiapan Acara Malam Lilin Kecil / Rapat Organisasi"]
    )

    p2.draw_section_heading(
        "B. DIABETES HEALTH FORUM (SABTU, 7 NOV 2026)",
        "Venue: Ballroom 2 Novotel Bogor  |  Khusus Komunitas, Keluarga & Awam"
    )
    p2.draw_table_header("WAKTU", "KEGIATAN", "KETERANGAN & NARASUMBER")

    p2.draw_table_row(
        "09.10 - 09.30", "Lebih dari Cek Gula Darah", "Ballroom 2",
        [
            "Topik: Lebih dari Cek Gula Darah: Kenali Polanya, Jalani Hidup Lebih Tenang",
            "Sesi Pengenalan Inovasi Alat Pemantau Kesehatan pertama di Indonesia berbasis IoT dan AI - DiViLab",
            "Narasumber 1: Ibu Astry Tri Astuti",
            "Moderator: Bpk. Edward Christian"
        ],
        bg_alt=True
    )

    p2.draw_table_row(
        "09.35 - 10.35", "Talkshow 1", "Ballroom 2",
        [
            "Topik: Temu 6 Tokoh Senior Penyandang Diabetes",
            "Inspirasi dan keteladanan hidup sehat berkualitas puluhan tahun bersama diabetes",
            "Anchor: Ibu Manuella"
        ]
    )

    p2.draw_table_row(
        "10.40 - 11.40", "Talkshow 2 & Fashion", "Ballroom 2",
        [
            "Topik: Cantik, Bugar, Bergairah (Vitalitas & Keharmonisan Keluarga)",
            "Anchor: dr. Mayorita",
            "Narasumber 1: dr. Boyke Dian Nugraha, SpOG, MARS",
            "Narasumber 2: dr. Roy Panusunan Sibarani, SpPD-KEMD",
            "Fashion Show: Peragaan Busana Karya Pembinaan Batik Marunda"
        ],
        bg_alt=True
    )

    p2.draw_table_row(
        "11.40 - 12.00", "Doorprize & Foto", "Ballroom 2",
        ["Pengundian doorprize menarik dan sesi dokumentasi foto bersama"]
    )

    p2.draw_table_row(
        "12.00 - Selesai", "Makan Siang & Ramah Tamah", "Ballroom 2 / Resto",
        ["Santap siang bersama dan ramah tamah peserta Diabetes Health Forum"],
        bg_alt=True
    )

    # ================= PAGE 3 =================
    p3 = pdf.new_page()
    p3.draw_page_top_bar("MALAM LILIN KECIL & RAPAT ORGANISASI (7 NOV 2026)")

    p3.draw_section_heading(
        "C. MALAM LILIN KECIL / GALA DINNER (SABTU, 7 NOV 2026)",
        "Venue: Grand Ballroom Novotel Bogor  |  Waktu: 18.30 - 21.00 WIB"
    )
    p3.draw_table_header("WAKTU", "AGENDA / ACARA", "DETAIL ACARA & PENGISI ACARA")

    p3.draw_table_row(
        "18.30 - 19.30", "Makan Malam Bersama", "Grand Ballroom",
        ["Makan malam ramah tamah nasional diiringi penampilan live music AXXI 8 Band"],
        bg_alt=True
    )

    p3.draw_table_row(
        "19.15 - 19.30", "Soyjoy Menu Creation", "Panggung Utama",
        ["Presentasi demo kreasi kudapan sehat bergizi berbahan kedelai Soyjoy"]
    )

    p3.draw_table_row(
        "19.30 - 19.32", "Pembukaan Malam", "Grand Ballroom",
        ["Pembukaan resmi Malam Lilin Kecil & Gala Dinner | MC: Tamara Geraldine"],
        bg_alt=True
    )

    p3.draw_table_row(
        "19.32 - 19.35", "Ketua Umum Terpilih", "Panggung Utama",
        ["Perkenalan Ketua Umum Terpilih PB PERSADIA Periode 2026 - 2029: dr. Roy Panusunan Sibarani, SpPD-KEMD"]
    )

    p3.draw_table_row(
        "19.35 - 19.45", "Product Launching CGM", "Panggung Utama",
        [
            "Dreisam - CGM S1 Pro: Mr. Chawn Hu (Marketing Director)",
            "Pemutaran Video & Prosesi Pemencetan Tombol Production Launching"
        ],
        bg_alt=True
    )

    p3.draw_table_row(
        "19.45 - 20.00", "Penampilan Musik", "Panggung Utama",
        ["AXXI 8 Band: Lagu 'Yang Terbaik', 'September Ceria', 'Astaga'"]
    )

    p3.draw_table_row(
        "20.00 - 20.10", "Pembacaan Sajak", "Panggung Utama",
        ["Pembacaan Sajak 'Life Is Too Sweet for Giving Up': Anita Sabidin dan Pak Imam Soeseno"],
        bg_alt=True
    )

    p3.draw_table_row(
        "20.10 - 20.25", "Penampilan Musik", "Panggung Utama",
        ["AXXI 8 Band: Lagu 'Amburadul' (AXXI 8) & 'Tuhan Ada Dimana-mana' (Tulus)"]
    )

    p3.draw_table_row(
        "20.25 - 20.40", "Fashion Show Batik", "Panggung Utama",
        ["Fashion Show Batik Marunda: Peragaan busana karya pembinaan pembatik Marunda"],
        bg_alt=True
    )

    p3.draw_table_row(
        "20.40 - 20.45", "Narasi Puitis Cinta", "Panggung Utama",
        ["Narasi puitis tentang ketabahan dan cinta kasih dibawakan oleh Tamara Geraldine"]
    )

    p3.draw_table_row(
        "20.45 - 20.55", "Lagu Lilin Lilin Kecil", "Grand Ballroom",
        ["Penampilan khidmat Paduan Suara Pria GKI Pengadilan Bogor menyanyikan 'Lilin-Lilin Kecil'"],
        bg_alt=True
    )

    p3.draw_table_row(
        "20.55 - 21.00", "Penutupan & Foto", "Grand Ballroom",
        ["Ucapan terima kasih, sesi foto bersama seluruh jajaran pimpinan & penutupan resmi acara malam"]
    )

    p3.draw_section_heading(
        "D. JADWAL RAPAT ORGANISASI PERSADIA, PEDI & PERKENI",
        "Venue: Novotel Bogor Golf Resort  |  Sabtu, 7 November 2026"
    )
    p3.draw_table_header("WAKTU", "ORGANISASI", "RUANGAN & DETAIL AGENDA KERJA")

    p3.draw_table_row(
        "13.00 - 17.00", "PERSADIA", "Kencana-Sanggar",
        [
            "Rapat Kerja Nasional PERSADIA",
            "Ruang Breakout Sidang Komisi: Ruang Kencana, Ruang Sanggar, Ruang Geulis"
        ],
        bg_alt=True
    )

    p3.draw_table_row(
        "13.00 - 17.00", "PEDI", "Ruang Karang",
        ["Rapat Kerja Pengurus Perkumpulan Edukator Diabetes Indonesia (PEDI)"]
    )

    p3.draw_table_row(
        "18.00 - 21.15", "PERKENI", "Ballroom 2 Novotel",
        ["Rapat Kerja Perkumpulan Endokrinologi Indonesia (PERKENI)"],
        bg_alt=True
    )

    # ================= PAGE 4 =================
    p4 = pdf.new_page()
    p4.draw_page_top_bar("PESTA RAKYAT & SENAM BERSAMA NUSANTARA (8 NOV 2026)")

    p4.draw_section_heading(
        "E. PESTA RAKYAT & SENAM BERSAMA NUSANTARA (MINGGU, 8 NOV 2026)",
        "Venue: Stadion Pakansari, Cibinong, Kabupaten Bogor  |  Target: 7.000 Peserta"
    )
    p4.draw_table_header("WAKTU", "KEGIATAN", "KETERANGAN & DETAIL ACARA")

    p4.draw_table_row(
        "05.00 - 06.00", "Registrasi Peserta", "Pintu 8 Pakansari",
        ["Pengambilan snack box & paket peserta di Pintu 8 Stadion Pakansari"],
        bg_alt=True
    )

    p4.draw_table_row(
        "06.00 - 07.00", "Parade & Skrining", "Area Stadion",
        [
            "Parade Kontingen Cabang PERSADIA se-Indonesia & Defile",
            "Pemeriksaan Gula Darah Massal Gratis (Target 7.000 Peserta)"
        ]
    )

    p4.draw_table_row(
        "07.00 - 07.30", "Pembukaan Acara", "Panggung Utama",
        [
            "Menyanyikan Lagu Kebangsaan Indonesia Raya",
            "Sambutan Pimpinan Pengurus Pusat PERSADIA & Pejabat Pemerintahan / Tamu Kehormatan"
        ],
        bg_alt=True
    )

    p4.draw_table_row(
        "07.30 - 08.30", "Senam Bugar Massal", "Lapangan Utama",
        [
            "Senam Bugar Diabetes Nasional Massal bersama instruktur profesional nasional",
            "(Pelaksanaan paralel dengan Skrining Massal Gula Darah)"
        ]
    )

    p4.draw_table_row(
        "08.30 - 10.00", "Showcase Senam Daerah", "Panggung & Lapangan",
        [
            "Peragaan variasi senam kebugaran perwakilan kontingen cabang daerah se-Indonesia",
            "(Pelaksanaan paralel dengan Skrining Massal Gula Darah)"
        ],
        bg_alt=True
    )

    p4.draw_table_row(
        "10.00 - 11.00", "Panggung Hiburan", "Panggung Utama",
        [
            "Hiburan panggung musik rakyat & pengumuman undian doorprize hadiah utama",
            "(Pelaksanaan paralel dengan Skrining Massal Gula Darah)"
        ]
    )

    p4.draw_table_row(
        "11.00 - 12.00", "Makan Siang", "Area Tribun & Lapangan",
        ["Pembagian dan santap makan siang bersama seluruh peserta Pesta Rakyat"],
        bg_alt=True
    )

    p4.draw_table_row(
        "12.00 - Selesai", "Penutupan Acara", "Stadion Pakansari",
        ["Penutupan resmi seluruh rangkaian kegiatan Kongres Nasional PERSADIA 2026"]
    )

    # Page 4 Information & Disclaimer Box
    disc_y = p4.curr_y - 18
    p4.rect(35, disc_y - 75, p4.width - 70, 75, fill_rgb=(0.985, 0.99, 1.0), stroke_rgb=(0.043, 0.239, 0.369), line_width=1)
    # Inner decorative bar
    p4.rect(35, disc_y - 75, 4, 75, fill_rgb=(0.000, 0.706, 0.675))

    p4.text(48, disc_y - 14, "INFORMASI RESMI & CATATAN PANITIA PELAKSANA:", font="F2", size=8, rgb=(0.043, 0.239, 0.369))
    p4.text(48, disc_y - 27, "1. Seluruh jadwal acara, pembagian ruangan sidang, serta nama pengisi sesi bersifat mengikat namun dapat disesuaikan", font="F1", size=7, rgb=(0.25, 0.30, 0.35))
    p4.text(48, disc_y - 37, "   secara dinamis di lokasi apabila terdapat arahan khusus dari Dewan Pertimbangan dan Panitia Pusat.", font="F1", size=7, rgb=(0.25, 0.30, 0.35))
    p4.text(48, disc_y - 48, "2. Re-registrasi barcode digital dibuka di Foyer Ballroom Novotel (Hari ke-1) dan Pintu 8 Stadion Pakansari (Hari ke-2).", font="F1", size=7, rgb=(0.25, 0.30, 0.35))
    p4.text(48, disc_y - 59, "3. Informasi pembaruan jadwal dan panduan resmi dapat diakses melalui portal resmi KONAS PERSADIA 2026.", font="F1", size=7, rgb=(0.25, 0.30, 0.35))

    pdf.save()
    print("PDF generated successfully: public/rundown-konas-persadia-2026.pdf")

if __name__ == "__main__":
    build_pdf()
