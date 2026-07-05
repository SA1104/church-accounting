with open("frontend/src/apps/church/pages/Settings.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "apiClient" in line and "categories" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print surrounding lines
        start = max(0, i-5)
        end = min(len(lines), i+6)
        for j in range(start, end):
            print(f"  {j+1}: {lines[j].strip()}")
