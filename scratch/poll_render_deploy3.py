import urllib.request
import json
import time

url = 'https://booza-church-think.onrender.com/api/ping'
expected_commit = '09b2db11'
max_attempts = 45 # 45 * 10 = 450 seconds (7.5 mins)

print(f"Polling {url} until commit matches {expected_commit}...")

for attempt in range(1, max_attempts + 1):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            current_commit = data.get('commit', 'unknown')
            timestamp = data.get('timestamp', '')
            print(f"[Attempt {attempt}/{max_attempts}] Live Commit: {current_commit} (Time: {timestamp})")
            if current_commit.startswith(expected_commit):
                print("SUCCESS: Deployed commit matches expected commit!")
                break
    except Exception as e:
        print(f"[Attempt {attempt}/{max_attempts}] Request failed: {e}")
    time.sleep(10)
else:
    print("TIMEOUT: Render did not deploy the expected commit in 7.5 minutes.")
