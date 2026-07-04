import re
import codecs

with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'apiClient(' in line:
        match = re.search(r'apiClient\(\s*([^''\"`\s])', line)
        if match:
            print(f'Line {i+1}: {line.strip()}')
