import codecs

with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if '<option value="DEPARTMENT_ACCOUNTANT">부서 회계 (DEPARTMENT_ACCOUNTANT)</option>' in lines[i]:
        # Add 'USER' option before 'DEPARTMENT_ACCOUNTANT'
        lines.insert(i, '                  <option value="USER">일반 사용자 (USER)</option>\n')
        print('Found and added USER to position dropdown.')
        break

with codecs.open('frontend/src/apps/church/pages/Settings.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
