import openpyxl, re
from datetime import datetime

# Helper to normalize date strings to DD/MM/YYYY
def parse_date(d_str):
    if not d_str or str(d_str).strip() in ["-", "None", ""]:
        return None
    s = str(d_str).strip()
    # Check if already datetime
    if isinstance(d_str, datetime):
        return d_str.strftime("%d/%m/%Y")
    
    # Try formats
    for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d-%b-%y", "%d-%b-%Y"]:
        try:
            dt = datetime.strptime(s[:10], fmt)
            return dt.strftime("%d/%m/%Y")
        except:
            pass
            
    # Indonesian month format: e.g. "24 Mei 1954" or "Jakarta, 23/09/1967"
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

def levenshtein_distance(s1, s2):
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

# Test date parsing
print("Test 13/05/1975:", parse_date("13/05/1975"))
print("Test 1976-01-19:", parse_date("1976-01-19"))
print("Test 24 Mei 1954:", parse_date("24 Mei 1954"))
print("Test 27-Feb-93:", parse_date("27-Feb-93"))
print("Test Jakarta, 23/09/1967:", parse_date("Jakarta, 23/09/1967"))
print("Levenshtein Arsiti vs Risiti:", levenshtein_distance("Arsiti", "Risiti"))
print("Levenshtein 085865192885 vs 085865292885:", levenshtein_distance("085865192885", "085865292885"))

