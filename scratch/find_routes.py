import os
import re

backend_dir = r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend"
routes = []

for root, dirs, files in os.walk(backend_dir):
    if "node_modules" in root:
        continue
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                # Find all route mappings like router.get, app.get, etc.
                for match in re.finditer(r"\.(get|post|put|delete|patch|use)\s*\(\s*['\"`](/[^'\"`]*)['\"`]", content):
                    routes.append((os.path.relpath(path, backend_dir), match.group(1), match.group(2)))

print(f"Found {len(routes)} routes:")
for r in sorted(routes):
    print(f"{r[0]}: {r[1].upper()} {r[2]}")
