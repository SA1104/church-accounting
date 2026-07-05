import os

search_dir = r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\deploy\supabase"
query = "church_positions"

for filename in os.listdir(search_dir):
    if filename.endswith(".sql"):
        filepath = os.path.join(search_dir, filename)
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for line_no, line in enumerate(f, 1):
                if query in line:
                    print(f"{filename}:{line_no}: {line.strip()}")
