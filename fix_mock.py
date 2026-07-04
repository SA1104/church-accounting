import re
text = open('backend/core/db/mock-data.js', encoding='utf-8').read()
text = re.sub(r'name: '.*?', role_code: 'DEPARTMENT_ACCOUNTANT'', 'name: \'회계\', role_code: \'DEPARTMENT_ACCOUNTANT\'', text)
text = re.sub(r'name: '.*?', role_code: 'FINANCE_MANAGER'', 'name: \'총무\', role_code: \'FINANCE_MANAGER\'', text)
text = re.sub(r'name: '.*?', role_code: 'GROUP_LEADER'', 'name: \'부장\', role_code: \'GROUP_LEADER\'', text)
text = re.sub(r'name: '.*?', role_code: 'COMMITTEE_CHAIR'', 'name: \'위원장\', role_code: \'COMMITTEE_CHAIR\'', text)
text = re.sub(r'name: '.*?', role_code: 'PASTOR'', 'name: \'교역자\', role_code: \'PASTOR\'', text)
open('backend/core/db/mock-data.js', 'w', encoding='utf-8').write(text)