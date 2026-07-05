import urllib.request
import json

url = 'https://booza-church-think.onrender.com/api/logs'
print(f"Requesting logs from {url}...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as res:
        print("Status:", res.status)
        body = res.read().decode('utf-8')
        try:
            logs = json.loads(body)
            print("Logs count:", len(logs))
            for log in logs[-50:]: # Print last 50 log lines
                print(log)
        except Exception as e:
            print("Failed to parse JSON. Body:")
            print(body[:2000])
except Exception as e:
    print("Error:", e)
