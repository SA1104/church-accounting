with open("backend/core/auth/index.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function requireRole" in line or "const requireRole" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print surrounding lines
        start = max(0, i-5)
        end = min(len(lines), i+30)
        for j in range(start, end):
            cleaned = lines[j].strip().encode('utf-8', errors='ignore').decode('ascii', errors='ignore')
            print(f"  {j+1}: {cleaned}")
