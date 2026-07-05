with open("backend/core/auth/index.js", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for "req.user =" or "roles = " or "roles:" in authenticateToken function
# authenticateToken starts at line 23. Let's find lines from 100 to 250
lines = content.splitlines()
for idx in range(100, 250):
    if idx < len(lines):
        cleaned = lines[idx].encode("utf-8", errors="ignore").decode("ascii", errors="ignore")
        print(f"{idx+1}: {cleaned}")
