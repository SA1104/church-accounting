with open("frontend/src/apps/church/pages/Settings.jsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(670, 700):
    if idx < len(lines):
        print(f"{idx+1}: {lines[idx].strip()}")
