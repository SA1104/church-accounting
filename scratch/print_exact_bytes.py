with open("backend/core/db/mock-data.js", "rb") as f:
    content = f.read()

text = content.decode("utf-8", errors="replace")
lines = text.splitlines()
for idx in range(945, 957):
    print(f"{idx+1}: {lines[idx].encode('utf-8', errors='ignore')}")
