const fetch = require('node-fetch');

async function testPlatformAssignments() {
  const adminTokenResult = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@boozathink.com', password: 'admin' })
  });
  const adminData = await adminTokenResult.json();
  const token = adminData.token;

  if (!token) {
    console.error('Login failed.');
    return;
  }
  console.log('1. Logged in as Admin');

  // Test Profile
  const me = await fetch('http://localhost:3000/api/church/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await me.json();
  console.log('2. Profile:', meData);

  // Test Assignments
  const assigns = await fetch('http://localhost:3000/api/church/assignments/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const assignsData = await assigns.json();
  console.log('3. My Assignments:', assignsData.length, 'records');

  if (assignsData.length > 0) {
    const firstAssign = assignsData[0];
    console.log('   First assignment code:', firstAssign.assignment_code);
    
    // Switch Preference
    const patchPref = await fetch('http://localhost:3000/api/platform/preferences', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'church_think',
        preference_key: 'last_context',
        preference_value: { assignment_id: firstAssign.id }
      })
    });
    const patchRes = await patchPref.json();
    console.log('4. PATCH Preference Result:', patchRes);
    
    // Get Preference
    const getPref = await fetch('http://localhost:3000/api/platform/preferences/church_think/last_context', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getPrefRes = await getPref.json();
    console.log('5. GET Preference Result:', getPrefRes);
  } else {
    console.log('   No assignments found for admin.');
  }

  // Create an assignment
  // Wait, we need an organization. Let's list orgs
  const orgs = await fetch('http://localhost:3000/api/church/admin/committees', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const orgData = await orgs.json();
  
  const pos = await fetch('http://localhost:3000/api/church/positions', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const posData = await pos.json();

  if (orgData.length > 0 && posData.length > 0) {
    const createAssign = await fetch(`http://localhost:3000/api/church/assignments/users/${adminData.user.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        committee_id: orgData[0].department_id,
        position_id: posData[0].position_id,
        is_primary: false
      })
    });
    const res = await createAssign.json();
    console.log('6. CREATE Assignment with sequence test:', res);
  }
}

testPlatformAssignments();
