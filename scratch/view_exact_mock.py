with open("backend/core/db/mock-data.js", "rb") as f:
    content = f.read()

# Let's decode as utf-8 but replace errors to see the exact structure
text = content.decode("utf-8", errors="replace")
lines = text.splitlines()
for idx in range(840, 851):
    print(f"{idx+1}: {lines[idx]}")
