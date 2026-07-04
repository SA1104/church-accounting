import urllib.request
import re

url = 'https://booza-church-think.onrender.com/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    response = urllib.request.urlopen(req)
    html = response.read().decode('utf-8')
    match = re.search(r'src=\"/assets/(index-[A-Za-z0-9]*\.js)\"', html)
    if match:
        js_file = match.group(1)
        print('JS File:', js_file)
        
        js_url = f'https://booza-church-think.onrender.com/assets/{js_file}'
        req_js = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
        js_res = urllib.request.urlopen(req_js)
        js_content = js_res.read().decode('utf-8')
        
        if '일반 사용자' in js_content or 'DEPARTMENT_ACCOUNTANT' in js_content:
            print('Found expected strings in JS bundle.')
        else:
            print('Strings NOT found in JS bundle!')
    else:
        print('Could not find JS bundle in HTML')
except Exception as e:
    print(e)
