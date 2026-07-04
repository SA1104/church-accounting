import codecs
with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'await apiClient(/api/church/assignments/users/, {' in lines[i]:
        lines[i] = lines[i].replace('await apiClient(/api/church/assignments/users/, {', 'await apiClient(`/api/church/assignments/users/${res.userId}`, {')
        print('Found and replaced exactly.')

with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
