let mockPasskeyCredentials = [];
let mockPasskeyChallenges = [];

let mockProfiles = [
  { user_id: 'admin-uuid-placeholder', username: 'admin', display_name: '관리자', phone: null, is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() },
  { user_id: 'finance-uuid-placeholder', username: 'finance', display_name: '재정담당자', phone: null, is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() },
  { user_id: 'accountant-uuid-placeholder', username: 'accountant', display_name: '회계담당자', phone: null, is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() },
  { user_id: 'depthead-uuid-placeholder', username: 'depthead', display_name: '부장', phone: null, is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() },
  { user_id: 'auditor-uuid-placeholder', username: 'auditor', display_name: '감사', phone: null, is_active: 1, signup_status: 'approved', created_at: new Date().toISOString() }
];
let mockRoleAssignments = [
  { user_id: 'admin-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'SYSTEM_ADMIN' },
  { user_id: 'finance-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'FINANCE_MANAGER' },
  { user_id: 'accountant-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'user' },
  { user_id: 'depthead-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'user' },
  { user_id: 'auditor-uuid-placeholder', service_id: 'church_think', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', role_id: 'service_admin' }
];
let mockUserMetadata = [
  { user_id: 'admin-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: null, position: '마스터', signature: '관리자' },
  { user_id: 'finance-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: 11, position: '위원장', signature: '재정담당자' },
  { user_id: 'accountant-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: 2, position: '회계', signature: '회계담당자' },
  { user_id: 'depthead-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: 2, position: '부장', signature: '부장' },
  { user_id: 'auditor-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', department_id: null, position: '교역자', signature: '감사' }
];
let mockDepartments = [
  { department_id: 11, parent_id: null, name: '예배위원회', description: '예배 위원회', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 3, parent_id: null, name: '교육위원회', description: '교육 위원회', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 5, parent_id: null, name: '선교위원회', description: '선교 위원회', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 1, parent_id: 11, name: '시온찬양대', description: '시온찬양대', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true },
  { department_id: 2, parent_id: 11, name: '늘찬찬양대', description: '늘찬찬양대', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', is_active: true }
];
let mockVouchers = [];
let mockVoucherItems = [];
let mockApprovalLines = [];
let mockApprovalActions = [];
let mockPeriodLocks = [];
let mockInvitations = [];
let mockAssignmentHistory = [];

let mockPositions = [
  { position_id: 'pos-1', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', name: '회계', role_code: 'DEPARTMENT_ACCOUNTANT', is_active: true },
  { position_id: 'pos-2', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', name: '총무', role_code: 'FINANCE_MANAGER', is_active: true },
  { position_id: 'pos-3', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', name: '부장', role_code: 'GROUP_LEADER', is_active: true },
  { position_id: 'pos-4', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', name: '위원장', role_code: 'COMMITTEE_CHAIR', is_active: true },
  { position_id: 'pos-5', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', name: '교역자', role_code: 'PASTOR', is_active: true }
];
let mockUserAssignments = [
  { id: 'assign-1', user_id: 'finance-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', committee_id: 11, group_id: null, position_id: 'pos-4', role_code: 'COMMITTEE_CHAIR', is_primary: true, is_active: true, status: 'approved' },
  { id: 'assign-2', user_id: 'finance-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', committee_id: 3, group_id: null, position_id: 'pos-4', role_code: 'COMMITTEE_CHAIR', is_primary: false, is_active: true, status: 'approved' },
  { id: 'assign-3', user_id: 'finance-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', committee_id: 11, group_id: 2, position_id: 'pos-1', role_code: 'DEPARTMENT_ACCOUNTANT', is_primary: false, is_active: true, status: 'approved' },
  { id: 'assign-4', user_id: 'accountant-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', committee_id: 11, group_id: 2, position_id: 'pos-1', role_code: 'DEPARTMENT_ACCOUNTANT', is_primary: true, is_active: true, status: 'approved' },
  { id: 'assign-5', user_id: 'depthead-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', committee_id: 11, group_id: 2, position_id: 'pos-3', role_code: 'GROUP_LEADER', is_primary: true, is_active: true, status: 'approved' },
  { id: 'assign-6', user_id: 'auditor-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', committee_id: 11, group_id: null, position_id: 'pos-5', role_code: 'AUDITOR', is_primary: true, is_active: true, status: 'approved' }
];
let mockSignupAssignmentRequests = [];
let mockPlatformMemberships = [
  { membership_id: 'memb-1', user_id: 'admin-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', capability: 'church', status: 'approved', created_at: new Date().toISOString() },
  { membership_id: 'memb-2', user_id: 'finance-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', capability: 'church', status: 'approved', created_at: new Date().toISOString() },
  { membership_id: 'memb-3', user_id: 'accountant-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', capability: 'church', status: 'approved', created_at: new Date().toISOString() },
  { membership_id: 'memb-4', user_id: 'depthead-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', capability: 'church', status: 'approved', created_at: new Date().toISOString() },
  { membership_id: 'memb-5', user_id: 'auditor-uuid-placeholder', project_id: '8a510c4f-c006-4442-8924-f3c75ab73cf6', capability: 'church', status: 'approved', created_at: new Date().toISOString() }
];

function runMockQuery(sql, params) {
  const sqlNormalized = sql.toLowerCase().trim();

  // Positions Master Interceptions
  if (sqlNormalized.includes('from public.church_positions') || sqlNormalized.includes('from church_positions')) {
    if (sqlNormalized.includes('is_active = true') || sqlNormalized.includes('is_active = 1')) {
      return mockPositions.filter(p => p.is_active);
    }
    return mockPositions;
  }
  if (sqlNormalized.startsWith('insert into public.church_positions') || sqlNormalized.startsWith('insert into church_positions')) {
    const projId = params[0];
    const name = params[1];
    const roleCode = params[2];
    const newPos = {
      position_id: `pos-${Math.random()}`,
      project_id: projId,
      name,
      role_code: roleCode,
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockPositions.push(newPos);
    return [{ position_id: newPos.position_id }];
  }
  if (sqlNormalized.includes('update public.church_positions') || sqlNormalized.includes('update church_positions')) {
    const posId = params[0];
    const found = mockPositions.find(p => p.position_id === posId);
    if (found) {
      found.is_active = false;
    }
    return [];
  }

  // Platform Role Assignments SELECT Interceptions
  if (sqlNormalized.includes('from public.platform_role_assignments') || sqlNormalized.includes('from platform_role_assignments')) {
    if (sqlNormalized.includes('user_id = ?') && sqlNormalized.includes('project_id = ?')) {
      const uId = params[0];
      const pId = params[1];
      return mockRoleAssignments.filter(r => r.user_id === uId && r.project_id === pId);
    }
    if (sqlNormalized.includes('user_id = ?')) {
      const uId = params[0];
      return mockRoleAssignments.filter(r => r.user_id === uId);
    }
    if (sqlNormalized.includes('project_id = ?')) {
      const pId = params[0];
      return mockRoleAssignments.filter(r => r.project_id === pId);
    }
    return mockRoleAssignments;
  }

  // Platform Memberships Interceptions
  if (sqlNormalized.includes('from public.platform_memberships') || sqlNormalized.includes('from platform_memberships')) {
    if (sqlNormalized.includes('platform_projects')) {
      const uId = params[0];
      const userMemberships = mockPlatformMemberships.filter(m => m.user_id === uId);
      return userMemberships.map(m => ({
        ...m,
        church_name: '?좉만援먰쉶'
      }));
    }
    if (sqlNormalized.includes('user_id = ?') && sqlNormalized.includes('project_id = ?')) {
      const uId = params[0];
      const pId = params[1];
      return mockPlatformMemberships.filter(m => m.user_id === uId && m.project_id === pId);
    }
    if (sqlNormalized.includes('user_id = ?')) {
      const uId = params[0];
      return mockPlatformMemberships.filter(m => m.user_id === uId);
    }
    if (sqlNormalized.includes('workspace_id = ?') && sqlNormalized.includes('status = \'pending\'')) {
      const wsId = params[0];
      return mockPlatformMemberships.filter(m => m.workspace_id === wsId && m.status === 'pending');
    }
    if (sqlNormalized.includes('workspace_id = ?')) {
      const wsId = params[0];
      return mockPlatformMemberships.filter(m => m.workspace_id === wsId);
    }
    return mockPlatformMemberships;
  }
  if (sqlNormalized.startsWith('insert into public.platform_memberships') || sqlNormalized.startsWith('insert into platform_memberships')) {
    const uId = params[0];
    const wsId = params[1];
    const cap = params[2];
    const status = params[3] || 'pending';
    
    const existing = mockPlatformMemberships.find(m => m.user_id === uId && m.workspace_id === wsId && m.capability === cap);
    if (existing) {
      existing.status = status;
      existing.updated_at = new Date().toISOString();
      return [{ membership_id: existing.membership_id }];
    }
    
    const newMemb = {
      membership_id: `memb-${Math.random().toString(36).substring(7)}`,
      user_id: uId,
      workspace_id: wsId,
      capability: cap,
      status: status,
      created_at: new Date().toISOString(),
      changer_name: '\uad00\ub9ac\uc790', // 관리자
      prev_committee_name: prevCommId ? '\uc608\ubc30\uc758\uc6d0\ud68c' : null, // 예배의원회
      prev_group_name: prevGrpId ? '\ucc2c\uc591\ud300' : null, // 찬양팀
      prev_position_name: prevPosId ? '\ubd80\uc7a5' : null, // 부장
      new_committee_name: newCommId ? '\uc608\ubc30\uc758\uc6d0\ud68c' : null, // 예배의원회
      new_group_name: newGrpId ? '\ucc2c\uc591\ud300' : null, // 찬양팀
      new_position_name: newPosId ? '\ubd80\uc7a5' : null // 부장
    };
    mockAssignmentHistory.push(newLog);
    return [{ id: newLog.id }];
  }

  if (sqlNormalized.includes('church_ledgers')) {
    return { balance: 5200000 };
  }

  return [];
}



const defaultUsers = [
  { username: 'admin', name: '관리자', password: 'admin123', role: 'SYSTEM_ADMIN', position: '기본', groupName: '재정지원실' },
  { username: 'accountant', name: '김회계 담당자', password: 'acc123', role: 'DEPARTMENT_ACCOUNTANT', position: '회계', groupName: '늘찬찬양대' },
  { username: 'depthead', name: '박부장 부장', password: 'head123', role: 'DEPARTMENT_HEAD', position: '부장', groupName: '늘찬찬양대' },
  { username: 'finance', name: '이재정 위원장', password: 'fin123', role: 'FINANCE_MANAGER', position: '위원장', groupName: '재정지원실' },
  { username: 'auditor', name: '최감사 교역자', password: 'aud123', role: 'AUDITOR', position: '교역자', groupName: '재정지원실' }
];

const defaultPositions = [
  { name: '회계', role_code: 'DEPARTMENT_ACCOUNTANT' },
  { name: '총무', role_code: 'FINANCE_MANAGER' },
  { name: '부장', role_code: 'GROUP_LEADER' },
  { name: '위원장', role_code: 'COMMITTEE_CHAIR' },
  { name: '교역자', role_code: 'PASTOR' }
];

module.exports = { runMockQuery, defaultUsers, defaultPositions };

