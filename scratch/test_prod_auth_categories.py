import urllib.request
import json

url = 'https://booza-church-think.onrender.com/api/church/debug/run-sql'
secret = 'booza-debug-secret-123'

def run_query(sql, params=[]):
    req_body = {
        'sql': sql,
        'params': params,
        'secret': secret
    }
    data = json.dumps(req_body).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
    )
    try:
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode('utf-8'))
            return res_data
    except Exception as e:
        print("Request failed:", e)
        return None

# Let's check the platform projects
print("=== platform_projects ===")
res = run_query("SELECT * FROM public.platform_projects")
if res and res.get('success'):
    for row in res['result']:
        print(row)

# Let's check platform memberships
print("\n=== platform_memberships ===")
res = run_query("SELECT * FROM public.platform_memberships")
if res and res.get('success'):
    for row in res['result']:
        print(row)

# Let's check system logs or audit logs
print("\n=== Recent System Logs ===")
res = run_query("SELECT * FROM public.system_logs ORDER BY created_at DESC LIMIT 10")
if res and res.get('success'):
    for row in res['result']:
        print(row)
