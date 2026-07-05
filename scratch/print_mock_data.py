with open("backend/core/db/mock-data.js", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx in range(830, 860):
    if idx < len(lines):
        print(f"{idx+1}: {lines[idx].rstrip().encode('utf-8', errors='ignore').decode('ascii', errors='ignore')}")
