import os
import sys

# Set standard output encoding to utf-8 to avoid encoding errors on print
sys.stdout.reconfigure(encoding='utf-8')

search_dir = r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend"

for root, dirs, files in os.walk(search_dir):
    # skip node_modules
    if "node_modules" in root:
        continue
    for file in files:
        if file.endswith(".js"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for line_no, line in enumerate(f, 1):
                    if "email" in line:
                        print(f"{os.path.relpath(filepath, search_dir)}:{line_no}: {line.strip()}")
