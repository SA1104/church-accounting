import urllib.request
import json

endpoints = [
    '__platform_health_check__',
    'api/ping',
    'api/health/auth',
    'ping'
]

for ep in endpoints:
    url = f'https://booza-church-think.onrender.com/{ep}'
    print(f"Requesting {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            print("Status:", res.status)
            print("Headers:", dict(res.headers))
            body = res.read().decode('utf-8')
            print("Body:", body[:500])
    except Exception as e:
        print("Error:", e)
    print('='*40)
