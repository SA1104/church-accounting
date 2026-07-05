with open("backend/server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "categories" in line:
        print(f"Line {i+1}: {line.strip().encode('utf-8', errors='ignore').decode('ascii', errors='ignore')}")
