import urllib.request
import re

url = 'https://booza-church-think.onrender.com/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    print("HTML Length:", len(html))
    match = re.search(r'src=\"/assets/(index-[A-Za-z0-9]*\.js)\"', html)
    if match:
        js_file = match.group(1)
        print('Live JS File:', js_file)
        
        js_url = f'https://booza-church-think.onrender.com/assets/{js_file}'
        req_js = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
        js_res = urllib.request.urlopen(req_js)
        js_content = js_res.read().decode('utf-8')
        print("JS Bundle Length:", len(js_content))
        
        search_terms = [
            "일반 사용자",
            "소속 위원회",
            "newUserCommitteeId",
            "committee_id",
            "위원회 선택 전 그룹 비활성화"
        ]
        
        for term in search_terms:
            found = term in js_content
            # Check occurrences
            count = js_content.count(term)
            print(f"Term '{term}': {'FOUND' if found else 'NOT FOUND'} (count: {count})")
    else:
        print('Could not find JS bundle in HTML')
except Exception as e:
    print(e)
