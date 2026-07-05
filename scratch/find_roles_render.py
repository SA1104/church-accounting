with open("backend/core/auth/index.js", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.splitlines()
for idx in range(250, 370):
    if idx < len(lines):
        cleaned = lines[idx].encode("utf-8", errors="ignore").decode("ascii", errors="ignore")
        print(f"{idx+1}: {cleaned}")
