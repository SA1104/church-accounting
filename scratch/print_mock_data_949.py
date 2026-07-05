with open("backend/core/db/mock-data.js", "rb") as f:
    content = f.read()

text = content.decode("utf-8", errors="replace")
lines = text.splitlines()
for idx in range(935, 960):
    if idx < len(lines):
        cleaned = lines[idx].encode("utf-8", errors="ignore").decode("ascii", errors="ignore")
        print(f"{idx+1}: {cleaned}")
