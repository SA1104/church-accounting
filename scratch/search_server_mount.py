import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend\server.js", "r", encoding="utf-8") as f:
    for line_no, line in enumerate(f, 1):
        if "churchServiceRouter" in line:
            print(f"{line_no}: {line.strip()}")
