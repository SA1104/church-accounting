import os

settings_path = r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\frontend\src\apps\church\pages\Settings.jsx"
with open(settings_path, "r", encoding="utf-8") as f:
    content = f.read()

search_terms = [
    "일반 사용자",
    "소속 위원회",
    "newUserCommitteeId",
    "committee_id",
    "위원회 선택 전 그룹 비활성화"
]

print("Searching locally in Settings.jsx:")
for term in search_terms:
    found = term in content
    count = content.count(term)
    print(f"Term '{term}': {'FOUND' if found else 'NOT FOUND'} (count: {count})")
