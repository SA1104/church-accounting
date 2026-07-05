import os

backend_dir = r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend"
found_files = []

for root, dirs, files in os.walk(backend_dir):
    if "node_modules" in root:
        continue
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if "require('bcrypt')" in content or 'require("bcrypt")' in content:
                        found_files.append(os.path.relpath(path, backend_dir))
            except Exception as e:
                pass

print("Files using 'bcrypt':", found_files)
