import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\frontend\src\apps\church\pages\Settings.jsx", "r", encoding="utf-8") as f:
    for line_no, line in enumerate(f, 1):
        if "role" in line or "accounting" in line or "isAdmin" in line or "super_admin" in line or "SYSTEM_ADMIN" in line:
            if "className" not in line:
                print(f"{line_no}: {line.strip()}")
