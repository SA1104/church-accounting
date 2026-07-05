with open("backend/core/db/mock-data.js", "rb") as f:
    content = f.read()

text = content.decode("utf-8", errors="replace")
lines = text.splitlines()
for idx in range(800, 860):
    if idx < len(lines):
        # print only ascii/cleaned characters to avoid crash on windows
        cleaned = lines[idx].encode("utf-8", errors="ignore").decode("ascii", errors="ignore")
        print(f"{idx+1}: {cleaned}")
