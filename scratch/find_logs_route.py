with open("backend/server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "api/logs" in line:
        print(f"Line {i+1}: {line.strip().encode('utf-8', errors='ignore').decode('ascii', errors='ignore')}")
        start = max(0, i-5)
        end = min(len(lines), i+6)
        for j in range(start, end):
            cleaned = lines[j].strip().encode('utf-8', errors='ignore').decode('ascii', errors='ignore')
            print(f"  {j+1}: {cleaned}")
