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
        if hasattr(e, 'read'):
            print("Error response:", e.read().decode('utf-8'))
        return None

queries = [
    {
        'name': 'Check church_departments columns',
        'sql': "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'church_departments'"
    }
]

for q in queries:
    print(f"\n=== Running: {q['name']} ===")
    res = run_query(q['sql'])
    if res and res.get('success'):
        print(f"Success! Result count: {len(res['result'])}")
        # Print up to 10 rows
        for row in res['result'][:10]:
            print("  ", row)
    else:
        print("Failed:", res)
