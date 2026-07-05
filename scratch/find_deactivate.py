with open("frontend/src/apps/church/pages/Settings.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "비활성화" in line:
        print(f"Line {i+1}: {line.strip()}")
