import openpyxl, re
from datetime import datetime

# Helper functions
def parse_date(d_str):
    if not d_str or str(d_str).strip() in ["-", "None", ""]:
        return "-"
    s = str(d_str).strip()
    if isinstance(d_str, datetime):
        return d_str.strftime("%d/%m/%Y")
    
    # Try formats
    for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d-%b-%y", "%d-%b-%Y"]:
        try:
            dt = datetime.strptime(s[:10], fmt)
            return dt.strftime("%d/%m/%Y")
        except:
            pass
            
    m_clean = re.search(r"(\d{1,2})[\s/-]+([A-Za-z]+|\d{1,2})[\s/-]+(\d{2,4})", s)
    if m_clean:
        d, m, y = m_clean.groups()
        if len(y) == 2:
            y = "19" + y if int(y) > 30 else "20" + y
        month_map = {
            "jan": "01", "januari": "01", "feb": "02", "februari": "02",
            "mar": "03", "maret": "03", "apr": "04", "april": "04",
            "mei": "05", "may": "05", "jun": "06", "juni": "06",
            "jul": "07", "juli": "07", "agu": "08", "agustus": "08", "aug": "08",
            "sep": "09", "september": "09", "okt": "10", "oktober": "10", "oct": "10",
            "nop": "11", "november": "11", "nov": "11", "des": "12", "desember": "12", "dec": "12"
        }
        if m.lower() in month_map:
            m = month_map[m.lower()]
        elif m.isdigit():
            m = f"{int(m):02d}"
        else:
            return s
        return f"{int(d):02d}/{m}/{y}"
    return s

def levenshtein(s1, s2):
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2: return 0
    if not s1: return len(s2)
    if not s2: return len(s1)
    dp = [[0] * (len(s2) + 1) for _ in range(len(s1) + 1)]
    for i in range(len(s1) + 1): dp[i][0] = i
    for j in range(len(s2) + 1): dp[0][j] = j
    for i in range(1, len(s1) + 1):
        for j in range(1, len(s2) + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    return dp[len(s1)][len(s2)]

def clean_phone_digits(p):
    if not p: return ""
    d = re.sub(r"[^\d]", "", str(p))
    if d.startswith("62"): d = "0" + d[2:]
    elif d.startswith("8"): d = "0" + d
    return d

def get_year(d_str):
    if not d_str or d_str == "-": return None
    p = parse_date(d_str)
    m = re.search(r"\d{4}", p)
    return int(m.group(0)) if m else None

# Evaluate similarity and scale
def calculate_scale(nama_sah, nama_kun, hp_sah, hp_kun, bd_sah_raw, bd_kun_raw):
    # 1. Name Evaluation
    n_sah_c = re.sub(r"\(.*?\)", "", nama_sah).strip().lower()
    n_kun_c = re.sub(r"\(.*?\)", "", nama_kun).strip().lower()
    # strip titles
    for title in ["dr.", "hj.", "h.", "ns.", "sp.pd", "mars", "bu", "oma", "b."]:
        n_sah_c = re.sub(rf"\b{re.escape(title)}\b", "", n_sah_c).strip()
        n_kun_c = re.sub(rf"\b{re.escape(title)}\b", "", n_kun_c).strip()
    n_sah_c = re.sub(r"\s+", " ", n_sah_c).strip()
    n_kun_c = re.sub(r"\s+", " ", n_kun_c).strip()
    
    dist_name = levenshtein(n_sah_c, n_kun_c)
    max_len_n = max(len(n_sah_c), len(n_kun_c), 1)
    sim_name_pct = round((1 - dist_name / max_len_n) * 100, 1)
    
    # Known alias/panggilan
    is_alias = False
    known_aliases = [
        ("ci emi", "emmy winata"), ("ati", "kusmiati"), ("oma mega", "megawati"),
        ("nunung", "suparmi"), ("mimin", "racun"), ("wiwik aryani", "wiwik maryanah"),
        ("oma rina", "oma tina"), ("siti sunarti", "iing sunarti")
    ]
    for a1, a2 in known_aliases:
        if (a1 in n_sah_c and a2 in n_kun_c) or (a2 in n_sah_c and a1 in n_kun_c):
            is_alias = True
            break
            
    if n_sah_c == n_kun_c:
        eval_nama = f"Sama Persis (100%)"
    elif dist_name <= 2:
        eval_nama = f"Potensi Typo {dist_name} Huruf ({sim_name_pct}%: '{nama_sah}' vs '{nama_kun}')"
    elif is_alias:
        eval_nama = f"Variasi Nama Panggilan/Alias ('{nama_sah}' vs '{nama_kun}')"
    else:
        eval_nama = f"Beda Jauh ({sim_name_pct}%: '{nama_sah}' vs '{nama_kun}')"
        
    # 2. Phone Evaluation
    p_sah = clean_phone_digits(hp_sah)
    # in case of multiple phones in kun
    p_kun_list = [clean_phone_digits(x) for x in hp_kun.split("/") if clean_phone_digits(x)]
    
    exact_phone = False
    dist_hp_min = 99
    matched_p_kun = p_kun_list[0] if p_kun_list else ""
    for pk in p_kun_list:
        if p_sah == pk and p_sah != "":
            exact_phone = True
            dist_hp_min = 0
            matched_p_kun = pk
            break
        d_p = levenshtein(p_sah, pk)
        if d_p < dist_hp_min:
            dist_hp_min = d_p
            matched_p_kun = pk
            
    if exact_phone:
        eval_hp = "Sama Persis (Nomor HP Identik)"
    elif dist_hp_min <= 2:
        eval_hp = f"Potensi Typo {dist_hp_min} Digit ({p_sah} vs {matched_p_kun})"
    elif not p_sah or not p_kun_list:
        eval_hp = "Nomor Tidak Lengkap"
    else:
        eval_hp = f"Beda Total ({p_sah} vs {matched_p_kun})"
        
    # 3. Birth Date Evaluation
    bd_sah = parse_date(bd_sah_raw)
    bd_kun_items = [parse_date(x) for x in str(bd_kun_raw).split("/") if parse_date(x) != "-"]
    bd_kun = " / ".join(bd_kun_items) if bd_kun_items else "-"
    
    exact_bd = False
    for bk in bd_kun_items:
        if bd_sah == bk and bd_sah != "-":
            exact_bd = True
            break
            
    y_sah = get_year(bd_sah)
    diff_years = []
    for bk in bd_kun_items:
        yk = get_year(bk)
        if y_sah and yk:
            diff_years.append(abs(y_sah - yk))
            
    min_diff_year = min(diff_years) if diff_years else None
    
    if exact_bd:
        eval_bd = f"Sama Persis ({bd_sah})"
    elif bd_sah == "-" or not bd_kun_items or bd_kun == "-":
        eval_bd = "Data Tgl Lahir Tidak Lengkap"
    elif min_diff_year == 0:
        eval_bd = f"Tahun Sama, Beda Tanggal ({bd_sah} vs {bd_kun})"
    else:
        eval_bd = f"Beda Tanggal & Tahun (Selisih ~{min_diff_year} thn: {bd_sah} vs {bd_kun})"
        
    # 4. Scale Calculation (1 to 5)
    # Start baseline
    scale = 3
    if exact_bd and (exact_phone or dist_hp_min <= 2) and (dist_name <= 2 or is_alias or n_sah_c == n_kun_c):
        scale = 5 # Identik / Typo Ringan Terbukti
    elif exact_phone and (n_sah_c == n_kun_c or is_alias or dist_name <= 2):
        scale = 4 # Kuat kemungkinan orang sama
    elif exact_bd and (n_sah_c == n_kun_c or dist_name <= 2):
        scale = 4 # Tgl lahir sama persis & nama sama
    elif exact_phone and dist_name > 2 and not is_alias:
        scale = 3 # Nomor bersama / kolektif
    elif (n_sah_c == n_kun_c or dist_name <= 2) and min_diff_year is not None and min_diff_year >= 2 and dist_hp_min > 2:
        scale = 2 # Nama sama tapi HP beda total dan Tgl Lahir beda tahun -> Homonim
    elif dist_name > 2 and dist_hp_min > 2 and min_diff_year is not None and min_diff_year >= 2:
        scale = 1 # Sangat rendah, nama/HP/tgl beda
    elif min_diff_year is not None and min_diff_year >= 2 and dist_hp_min > 2:
        scale = 2
    else:
        scale = 3
        
    # Categories
    categories = {
        5: "5 - SANGAT KUAT (Identik / Typo Terbukti)",
        4: "4 - KUAT (Kemungkinan Besar Orang Sama)",
        3: "3 - SEDANG (Perlu Cek: Nomor Bersama/Data Parsial)",
        2: "2 - RENDAH (Indikasi Homonim / Orang Berbeda)",
        1: "1 - SANGAT RENDAH (Hampir Pasti Berbeda)",
    }
    
    # Detailed reasoning
    reasons = []
    if scale == 5:
        reasons.append("Tgl lahir sama persis dan kontak/nama selaras kuat (indikasi kuat satu orang yang sama).")
    elif scale == 4:
        reasons.append("Kontak utama identik dan nama selaras (indikasi kuat orang yang sama).")
    elif scale == 3:
        if exact_phone:
            reasons.append("No. HP sama persis tetapi nama/tgl lahir berbeda (indikasi nomor kontak bersama/keluarga).")
        else:
            reasons.append("Data tidak lengkap di salah satu berkas untuk memastikan kepastian identitas.")
    elif scale == 2:
        reasons.append(f"Nama memiliki kemiripan, namun No. HP beda total dan Tgl Lahir terbukti selisih ~{min_diff_year or '?'} tahun (indikasi kuat homonim/orang berbeda).")
    elif scale == 1:
        reasons.append("Nama, nomor telepon, dan tanggal lahir seluruhnya berbeda.")
        
    return {
        "eval_nama": eval_nama,
        "eval_hp": eval_hp,
        "eval_bd": eval_bd,
        "bd_sah": bd_sah,
        "bd_kun": bd_kun,
        "scale": scale,
        "kategori": categories[scale],
        "pertimbangan": " ".join(reasons),
    }

# Test sample
t1 = calculate_scale("Rosmida FS Simbolon", "Rosmida Simbolon", "085865192885", "085865292885", "01/09/1970", "01/09/1970")
print("Rosmida:", t1)

t2 = calculate_scale("Acih", "Acih", "0895392465088", "082299247083", "13/05/1975", "12/07/1965")
print("\nAcih:", t2)

t3 = calculate_scale("CI EMI", "Emmy Winata", "081808510044", "081808510044", "1965-01-11", "10/10/1960")
print("\nCI EMI:", t3)

