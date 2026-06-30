// test_membership_assignments.js
// Integration test to verify Platform Membership and Church User Assignment Refactoring

const assert = require('assert');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('==========================================================');
  console.log('Starting Membership & Assignment Integration Test...');
  console.log('==========================================================');

  try {
    // 1. Verify ullalla11 (mock account with zero assignments/memberships) has no access to data
    console.log('Testing Scenario 1: Zero-membership account data leak check...');
    const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': 'Bearer ullalla11-token' }
    });
    
    assert.strictEqual(statsRes.status, 403, 'User with no approved assignment should get 403 on dashboard stats');
    const statsData = await statsRes.json();
    console.log('✓ Stats blocked: received 403 Forbidden', statsData);

    const vouchersRes = await fetch(`${BASE_URL}/vouchers`, {
      headers: { 'Authorization': 'Bearer ullalla11-token' }
    });
    const vouchersData = await vouchersRes.json();
    assert.strictEqual(vouchersRes.ok, true, 'Vouchers list request should succeed but return empty array');
    assert.strictEqual(vouchersData.length, 0, 'Vouchers list should be empty');
    console.log('✓ Vouchers blocked: received empty array');

    // 2. Perform platform signup for a new user
    console.log('\nTesting Scenario 2: Platform Signup...');
    const uniqueId = Date.now().toString().slice(-4);
    const username = `hong_${uniqueId}`;
    const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '홍길동',
        email: `hong_${uniqueId}@gmail.com`,
        username: username,
        password: 'password123',
        phone: '010-1234-5678'
      })
    });
    
    const signupData = await signupRes.json();
    if (!signupRes.ok) {
      console.error('Signup error data:', signupData);
    }
    assert.strictEqual(signupRes.ok, true, 'Platform signup should succeed');
    const newUserId = signupData.user?.id;
    console.log(`✓ Signup successful: user_id = ${newUserId}`);

    // 3. Verify new user has no membership initially
    const statusRes = await fetch(`${BASE_URL}/church/membership/status`, {
      headers: { 'Authorization': `Bearer ${newUserId}-token` }
    });
    const statusData = await statusRes.json();
    assert.strictEqual(statusData.status, 'none', 'New user should have no membership status');
    console.log('✓ Initial membership status is "none"');

    // 4. Apply for membership
    console.log('\nTesting Scenario 3: Apply for Membership...');
    const applyRes = await fetch(`${BASE_URL}/church/membership/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newUserId}-token`
      },
      body: JSON.stringify({ workspaceId: 'platform-ws-id' }) // 신길교회 mock workspace
    });
    assert.strictEqual(applyRes.ok, true, 'Membership application should succeed');
    const applyData = await applyRes.json();
    console.log('✓ Apply membership response:', applyData.message);

    // Verify status is now pending
    const statusPendingRes = await fetch(`${BASE_URL}/church/membership/status`, {
      headers: { 'Authorization': `Bearer ${newUserId}-token` }
    });
    const statusPendingData = await statusPendingRes.json();
    assert.strictEqual(statusPendingData.status, 'pending', 'Membership status should be pending');
    console.log('✓ Membership status is now "pending"');

    // 5. Admin approves membership
    console.log('\nTesting Scenario 4: Admin approves membership...');
    // We get pending memberships
    const pendingListRes = await fetch(`${BASE_URL}/church/membership/admin/memberships/pending`, {
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    const pendingList = await pendingListRes.json();
    console.log('pendingList status:', pendingListRes.status, 'data:', pendingList);
    const myApp = pendingList.find(m => m.user_id === newUserId);
    assert.ok(myApp, 'Admin should find the pending membership application');

    // Approve the membership
    const approveRes = await fetch(`${BASE_URL}/church/membership/admin/memberships/${myApp.membership_id}/approve`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) {
      console.error('Approve membership error:', approveRes.status, approveData);
    }
    assert.strictEqual(approveRes.ok, true, 'Admin approval of membership should succeed');
    console.log('✓ Membership approved by Admin');

    // Verify status is approved
    const statusApprovedRes = await fetch(`${BASE_URL}/church/membership/status`, {
      headers: { 'Authorization': `Bearer ${newUserId}-token` }
    });
    const statusApprovedData = await statusApprovedRes.json();
    console.log('statusApprovedData:', statusApprovedData);
    assert.strictEqual(statusApprovedData.status, 'approved', 'Membership status should be approved');
    console.log('✓ Membership status is now "approved"');

    // 6. Request a new assignment
    console.log('\nTesting Scenario 5: Apply for Organization Assignment...');
    const assignApplyRes = await fetch(`${BASE_URL}/church/assignments/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newUserId}-token`
      },
      body: JSON.stringify({
        committee_id: 11, // 재정위원회
        position_id: 'pos-1' // 회계
      })
    });
    assert.strictEqual(assignApplyRes.ok, true, 'Assignment request should succeed');
    const assignApplyData = await assignApplyRes.json();
    const assignmentId = assignApplyData.assignmentId;
    console.log(`✓ Assignment requested: ID = ${assignmentId}`);

    // Verify user assignment list has a pending assignment
    const myAssignsRes = await fetch(`${BASE_URL}/church/assignments/me`, {
      headers: { 'Authorization': `Bearer ${newUserId}-token` }
    });
    const myAssigns = await myAssignsRes.json();
    const myAssign = myAssigns.find(a => a.id === assignmentId);
    assert.strictEqual(myAssign.status, 'pending', 'Assignment status should be pending');
    console.log('✓ Assignment status in user list is "pending"');

    // 7. Admin approves assignment
    console.log('\nTesting Scenario 6: Admin approves assignment...');
    const pendingAssignsRes = await fetch(`${BASE_URL}/church/assignments/admin/assignments/pending`, {
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    const pendingAssigns = await pendingAssignsRes.json();
    console.log('pendingAssigns status:', pendingAssignsRes.status, 'data:', pendingAssigns);
    const myPendingAssign = pendingAssigns.find(a => a.id === assignmentId);
    assert.ok(myPendingAssign, 'Admin should see the pending assignment request');

    const approveAssignRes = await fetch(`${BASE_URL}/church/assignments/admin/assignments/${assignmentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token' }
    });
    assert.strictEqual(approveAssignRes.ok, true, 'Admin approval of assignment should succeed');
    console.log('✓ Assignment approved by Admin');

    // Verify assignment is now approved
    const myAssignsApprovedRes = await fetch(`${BASE_URL}/church/assignments/me`, {
      headers: { 'Authorization': `Bearer ${newUserId}-token` }
    });
    const myAssignsApproved = await myAssignsApprovedRes.json();
    console.log('myAssignsApproved:', myAssignsApproved);
    const myApprovedAssign = myAssignsApproved.find(a => a.id === assignmentId);
    assert.strictEqual(myApprovedAssign.status, 'approved', 'Assignment status should now be approved');
    console.log('✓ Assignment is now active and approved');

    // 8. Verify the approved user can now view dashboard statistics
    console.log('\nTesting Scenario 7: Accessing stats with active approved assignment...');
    const activeStatsRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${newUserId}-token`,
        'X-Context-Assignment-Id': assignmentId
      }
    });
    assert.strictEqual(activeStatsRes.status, 200, 'User with approved active assignment should successfully load stats');
    const activeStatsData = await activeStatsRes.json();
    console.log('✓ Stats loaded successfully:', activeStatsData.totalUsers, 'users');

    console.log('\n==========================================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! 100% CORRECT!');
    console.log('==========================================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
