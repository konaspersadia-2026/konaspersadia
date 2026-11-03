import openpyxl, re
from datetime import datetime

def clean_phone_digits(p):
    if not p: return ""
    d = re.sub(r"[^\d]", "", str(p))
    if d.startswith("62"): d = "0" + d[2:]
    elif d.startswith("8"): d = "0" + d
    return d

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

def get_year(d_str):
    if not d_str or d_str == "-": return None
    p = parse_date(d_str)
    m = re.search(r"\d{4}", p)
    return int(m.group(0)) if m else None

def evaluate_scale_detailed(nama_sah, nama_kun, hp_sah, hp_kun, bd_sah_raw, bd_kun_raw):
    # Standardize dates
    bd_sah = parse_date(bd_sah_raw)
    
    # Check if multiple dates separated by // or ;
    if "//" in str(bd_kun_raw) or ";" in str(bd_kun_raw):
        parts_k = re.split(r"//|;", str(bd_kun_raw))
        bd_kun_list = [parse_date(x) for x in parts_k if parse_date(x) != "-"]
    else:
        bd_kun_list = [parse_date(bd_kun_raw)]
    bd_kun = " // ".join(bd_kun_list)

    # 1. Evaluate Name
    n_sah_clean = re.sub(r"\(.*?\)", "", nama_sah).strip().lower()
    n_kun_clean = re.sub(r"\(.*?\)", "", nama_kun).strip().lower()
    for title in ["dr.", "hj.", "h.", "ns.", "sp.pd", "mars", "bu", "oma", "b.", "r."]:
        n_sah_clean = re.sub(rf"\b{re.escape(title)}\b", "", n_sah_clean).strip()
        n_kun_clean = re.sub(rf"\b{re.escape(title)}\b", "", n_kun_clean).strip()
    n_sah_clean = re.sub(r"[^\w\s]", "", n_sah_clean)
    n_kun_clean = re.sub(r"[^\w\s]", "", n_kun_clean)
    n_sah_clean = re.sub(r"\s+", " ", n_sah_clean).strip()
    n_kun_clean = re.sub(r"\s+", " ", n_kun_clean).strip()
    
    words_sah = set(n_sah_clean.split())
    words_kun = set(n_kun_clean.split())
    
    dist_name = levenshtein(n_sah_clean, n_kun_clean)
    max_len = max(len(n_sah_clean), len(n_kun_clean), 1)
    sim_pct = round((1 - dist_name / max_len) * 100, 1)
    
    known_aliases = [
        ("ci emi", "emmy winata"), ("ati", "kusmiati"), ("oma mega", "megawati"),
        ("nunung", "suparmi"), ("mimin", "racun"), ("wiwik aryani", "wiwik maryanah"),
        ("oma rina", "oma tina"), ("siti sunarti", "iing sunarti")
    ]
    is_alias = any((a1 in n_sah_clean and a2 in n_kun_clean) or (a2 in n_sah_clean and a1 in n_kun_clean) for a1, a2 in known_aliases)
    is_subset = words_sah.issubset(words_kun) or words_kun.issubset(words_sah)
    
    if n_sah_clean == n_kun_clean:
        eval_nama = f"Sama Persis ('{nama_sah}')"
        status_nama_code = "IDENTIK"
    elif is_subset:
        eval_nama = f"Nama Selaras / Singkatan ('{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "SELARAS"
    elif dist_name <= 2:
        eval_nama = f"Potensi Typo {dist_name} Huruf ({sim_pct}%: '{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "TYPO_NAMA"
    elif is_alias:
        eval_nama = f"Variasi Nama Panggilan/Alias ('{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "ALIAS"
    else:
        eval_nama = f"Beda Jauh ({sim_pct}%: '{nama_sah}' vs '{nama_kun}')"
        status_nama_code = "BEDA_JAUH"
        
    # 2. Evaluate Phone
    p_sah = clean_phone_digits(hp_sah)
    # Check if multiple phones
    if "//" in str(hp_kun) or "/" in str(hp_kun):
        p_kun_list = [clean_phone_digits(x) for x in re.split(r"//|/", str(hp_kun)) if clean_phone_digits(x)]
    else:
        p_kun_list = [clean_phone_digits(hp_kun)]
        
    min_dist_hp = 99
    exact_hp = False
    best_p_kun = p_kun_list[0] if p_kun_list else ""
    for pk in p_kun_list:
        if p_sah == pk and p_sah != "":
            exact_hp = True
            min_dist_hp = 0
            best_p_kun = pk
            break
        d_p = levenshtein(p_sah, pk)
        if d_p < min_dist_hp:
            min_dist_hp = d_p
            best_p_kun = pk
            
    if exact_hp:
        eval_hp = f"Sama Persis ({p_sah})"
        status_hp_code = "IDENTIK"
    elif min_dist_hp <= 2:
        eval_hp = f"Potensi Typo {min_dist_hp} Digit ({p_sah} vs {best_p_kun})"
        status_hp_code = "TYPO_HP"
    elif not p_sah or not p_kun_list or not best_p_kun:
        eval_hp = "Nomor Tidak Lengkap"
        status_hp_code = "KOSONG"
    else:
        eval_hp = f"Beda Total ({p_sah} vs {best_p_kun})"
        status_hp_code = "BEDA_TOTAL"

    # 3. Evaluate Birth Date
    exact_bd = False
    for bk in bd_kun_list:
        if bd_sah == bk and bd_sah != "-":
            exact_bd = True
            break
            
    y_sah = get_year(bd_sah)
    diff_years = []
    for bk in bd_kun_list:
        yk = get_year(bk)
        if y_sah and yk:
            diff_years.append(abs(y_sah - yk))
    min_diff_year = min(diff_years) if diff_years else None
    
    if exact_bd:
        eval_bd = f"Sama Persis ({bd_sah})"
        status_bd_code = "IDENTIK"
    elif bd_sah == "-" or not bd_kun_list or bd_kun == "-":
        eval_bd = "Data Tidak Lengkap"
        status_bd_code = "KOSONG"
    elif min_diff_year == 0:
        eval_bd = f"Tahun Sama, Beda Tanggal ({bd_sah} vs {bd_kun})"
        status_bd_code = "BEDA_HARI"
    else:
        eval_bd = f"Beda Tahun (Selisih ~{min_diff_year} thn: {bd_sah} vs {bd_kun})"
        status_bd_code = "BEDA_TAHUN"

    # 4. Scale Calculation (1 - 5)
    # Logic:
    # Scale 5: Very strong indication of SAME person.
    #   - BD identical + (Phone identical or typo <= 2) + (Name identical or typo <= 2 or alias/subset)
    #   - Example: Rosmida Simbolon (BD same, Phone typo 1 digit 52 vs 51, Name subset)
    #   - Example: Mimi Sopiati (BD same, Phone same, Name same)
    #   - Example: Kusmiati (BD same, Phone same, Name alias Ati)
    #   - Example: Ita Juwita (BD same, Phone in ODS same, Name same)
    if status_bd_code == "IDENTIK" and status_hp_code in ["IDENTIK", "TYPO_HP"] and status_nama_code in ["IDENTIK", "SELARAS", "TYPO_NAMA", "ALIAS"]:
        scale = 5
    elif status_hp_code == "IDENTIK" and status_nama_code in ["IDENTIK", "SELARAS", "ALIAS", "TYPO_NAMA"]:
        scale = 4 # Strong: Phone identical + Name match
    elif status_bd_code == "IDENTIK" and status_nama_code in ["IDENTIK", "SELARAS", "TYPO_NAMA"]:
        scale = 4 # Strong: Birthdate identical + Name match (even if phone differs)
    elif status_hp_code == "IDENTIK" and status_nama_code == "BEDA_JAUH":
        scale = 3 # Moderate: Same phone but different person name -> Family/Collective number
    elif status_hp_code == "TYPO_HP" and status_nama_code in ["IDENTIK", "SELARAS"]:
        scale = 4 # Typo in phone but name matches
    elif status_bd_code == "KOSONG" and status_nama_code in ["IDENTIK", "SELARAS"] and status_hp_code == "BEDA_TOTAL":
        scale = 3 # Incomplete verification
    elif status_bd_code == "BEDA_TAHUN" and min_diff_year >= 2 and status_hp_code == "BEDA_TOTAL":
        # Name may be similar/same, but Phone is totally different and Birthdate is different by years!
        # Very high likelihood of HOMONYM (different people)!
        scale = 2
    elif status_nama_code == "BEDA_JAUH" and status_hp_code == "BEDA_TOTAL" and status_bd_code == "BEDA_TAHUN":
        scale = 1 # Almost certainly different people
    else:
        scale = 2 if (status_bd_code == "BEDA_TAHUN" or status_hp_code == "BEDA_TOTAL") else 3

    categories = {
        5: "5 - SANGAT KUAT (Identik / Typo Terbukti)",
        4: "4 - KUAT (Kemungkinan Besar Sama)",
        3: "3 - SEDANG (Perlu Cek: Nomor Bersama/Data Parsial)",
        2: "2 - RENDAH (Indikasi Homonim / Orang Berbeda)",
        1: "1 - SANGAT RENDAH (Hampir Pasti Berbeda)",
    }

    # Pertimbangan / Reasoning text
    if scale == 5:
        pertimbangan = "Sangat kuat orang yang sama: Tanggal lahir sama persis, nomor telepon selaras/typo ringan, dan nama cocok."
    elif scale == 4:
        if status_hp_code == "IDENTIK":
            pertimbangan = "Kemungkinan besar orang yang sama: Nomor kontak identik dan nama selaras/alias pendaftaran (meski tgl lahir ada selisih pencatatan)."
        elif status_bd_code == "IDENTIK":
            pertimbangan = "Kemungkinan besar orang yang sama: Tanggal lahir sama persis dan nama cocok (meski kontak telepon tercatat berbeda)."
        else:
            pertimbangan = "Kemungkinan besar orang yang sama dengan indikasi typo ringan pada kontak atau nama."
    elif scale == 3:
        if status_hp_code == "IDENTIK":
            pertimbangan = "Perhatian khusus: Nomor telepon sama persis tetapi nama dan tanggal lahir berbeda, berpotensi kuat merupakan pendaftaran kolektif / nomor bersama (keluarga/kerabat)."
        else:
            pertimbangan = "Data pada salah satu berkas tidak lengkap sehingga memerlukan konfirmasi fisik ke koordinator unit."
    elif scale == 2:
        pertimbangan = f"Potensi kuat orang berbeda (homonim): Meskipun nama sama/mirip, nomor telepon berbeda total dan tanggal lahir terbukti selisih ~{min_diff_year} tahun."
    else:
        pertimbangan = "Hampir pasti orang yang berbeda: Nama, nomor telepon, dan tanggal lahir seluruhnya tidak cocok."

    return {
        "bd_sah": bd_sah,
        "bd_kun": bd_kun,
        "eval_nama": eval_nama,
        "eval_hp": eval_hp,
        "eval_bd": eval_bd,
        "scale": scale,
        "kategori": categories[scale],
        "pertimbangan": pertimbangan,
    }

# Run on sample
print("Rosmida test:", evaluate_scale_detailed("Rosmida FS Simbolon", "Rosmida Simbolon", "085865192885", "085865292885", "01/09/1970", "01/09/1970"))
print("\nAcih test:", evaluate_scale_detailed("Acih", "Acih", "0895392465088", "082299247083", "13/05/1975", "12/07/1965"))
print("\nCI EMI test:", evaluate_scale_detailed("CI EMI", "Emmy Winata", "081808510044", "081808510044", "1965-01-11", "10/10/1960"))
print("\nMimi Sopiati test:", evaluate_scale_detailed("Mimi Supiati", "MIMI SOPIATI", "081386214460", "081386214460", "11/03/1959", "11/03/1959"))

