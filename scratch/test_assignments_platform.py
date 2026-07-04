import urllib.request
import urllib.parse
import json

def fetch(url, method='GET', headers=None, data=None):
    if headers is None: headers = {}
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

# 1. Login
login_data = fetch('http://localhost:3000/api/auth/login', 'POST', data={'email': 'admin@boozathink.com', 'password': 'admin'})
if not login_data or 'token' not in login_data:
    print('Login failed.')
    exit(1)

token = login_data['token']
user_id = login_data['user']['id']
auth_headers = {'Authorization': f'Bearer {token}'}
print('1. Logged in as Admin')

# 2. Profile
profile = fetch('http://localhost:3000/api/church/profile', headers=auth_headers)
print('2. Profile:', profile)

# 3. Assignments
assigns = fetch('http://localhost:3000/api/church/assignments/me', headers=auth_headers)
print(f'3. My Assignments: {len(assigns) if assigns else 0} records')

if assigns and len(assigns) > 0:
    first_assign = assigns[0]
    print(f'   First assignment ID: {first_assign.get("id")}')
    print(f'   First assignment code: {first_assign.get("assignment_code")}')
    
    # 4. PATCH Preference
    patch_data = {
        'service_id': 'church_think',
        'preference_key': 'last_context',
        'preference_value': {'assignment_id': first_assign['id']}
    }
    patch_res = fetch('http://localhost:3000/api/platform/preferences', 'PATCH', headers=auth_headers, data=patch_data)
    print('4. PATCH Preference Result:', patch_res)
    
    # 5. GET Preference
    get_pref = fetch('http://localhost:3000/api/platform/preferences/church_think/last_context', headers=auth_headers)
    print('5. GET Preference Result:', get_pref)

# 6. Create Assignment with Sequence Test
orgs = fetch('http://localhost:3000/api/church/admin/committees', headers=auth_headers)
pos = fetch('http://localhost:3000/api/church/positions', headers=auth_headers)

if orgs and pos and len(orgs) > 0 and len(pos) > 0:
    create_data = {
        'committee_id': orgs[0]['department_id'],
        'position_id': pos[0]['position_id'],
        'is_primary': False
    }
    create_res = fetch(f'http://localhost:3000/api/church/assignments/users/{user_id}', 'POST', headers=auth_headers, data=create_data)
    print('6. CREATE Assignment Result (Sequence test):', create_res)
