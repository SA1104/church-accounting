import os

src_dir = r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\frontend\src"
found = []

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".js") or file.endswith(".jsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                if "export const apiClient" in content or "function apiClient" in content or "const apiClient" in content:
                    found.append(os.path.relpath(path, src_dir))

print("apiClient found in:", found)
