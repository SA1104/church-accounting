import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../App';
import { apiClient } from '../../../core/api';
import { 
  Settings as SettingsIcon, Plus, Users, User, FolderTree, Landmark, ShieldCheck,
  Loader2, CheckCircle2, AlertTriangle, Clock, RefreshCw, Play, Tag, FileText, Trash2,
  Edit2, Save, X, ToggleLeft, ToggleRight, Fingerprint
} from 'lucide-react';

const isAdminUser = (user) => {
  if (!user) return false;

  const email = user.email || user.username || '';
  const role = user.role || '';
  const roles = user.roles || {};
  const platformRole = roles.platform || '';
  const churchRole = roles.church_think || '';
  const accountingRole = user.accounting?.role || '';

  return (
    email === 'admin@boozathink.com' ||
    email === 'admin' ||
    role === 'admin' ||
    role === 'SYSTEM_ADMIN' ||
    platformRole === 'SYSTEM_ADMIN' ||
    churchRole === 'super_admin' ||
    churchRole === 'admin' ||
    accountingRole === 'admin' ||
    accountingRole === 'finance_admin' ||
    user.isAdmin === true
  );
};

export default function Settings() {
  const { token, user, fontScale, setFontScale, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Tab States
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMembership, setProfileMembership] = useState(null);
  const [profileAssignments, setProfileAssignments] = useState([]);
  const [profileCommittees, setProfileCommittees] = useState([]);
  const [profilePositions, setProfilePositions] = useState([]);
  const [profileSelectedCommId, setProfileSelectedCommId] = useState('');
  const [profileSelectedGroupId, setProfileSelectedGroupId] = useState('');
  const [profileSelectedPosId, setProfileSelectedPosId] = useState('');
  const [profileGroups, setProfileGroups] = useState([]);
  const [profileApplySuccess, setProfileApplySuccess] = useState('');
  const [profileApplyError, setProfileApplyError] = useState('');
  const [profileApplyLoading, setProfileApplyLoading] = useState(false);

  // Invitation & History States
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteCommId, setInviteCommId] = useState('');
  const [inviteGroupId, setInviteGroupId] = useState('');
  const [invitePosId, setInvitePosId] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteExpiresDays, setInviteExpiresDays] = useState(7);
  const [inviteGroupOptions, setInviteGroupOptions] = useState([]);
  const [inviteLinkResult, setInviteLinkResult] = useState(null);

  // Church Application States
  const [churches, setChurches] = useState([]);
  const [selectedApplyChurchId, setSelectedApplyChurchId] = useState('');
  const [applyChurchMemo, setApplyChurchMemo] = useState('');
  const [churchApplyLoading, setChurchApplyLoading] = useState(false);
  const [churchApplySuccess, setChurchApplySuccess] = useState('');
  const [churchApplyError, setChurchApplyError] = useState('');

  // 리스트 상태
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [groups, setGroups] = useState([]);

  // OCR 큐 상태
  const [ocrQueue, setOcrQueue] = useState([]);
  const [ocrQueueLoading, setOcrQueueLoading] = useState(false);

  // 1. 계정과목 추가 폼
  const [newCatType, setNewCatType] = useState('EXPENSE');
  const [newCatParent, setNewCatParent] = useState('');
  const [newCatChild, setNewCatChild] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // 2. 위원회 추가 폼
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');

  // 3. 소속 그룹(찬양팀 등) 추가 폼
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // 4. 사용자 추가 폼 (직책 position 콤보 및 비밀번호 창 포함)
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('DEPARTMENT_ACCOUNTANT');
  const [newUserPosition, setNewUserPosition] = useState('회계'); // 디폴트 '회계'
  const [newUserGroup, setNewUserGroup] = useState('');

  // 5. 결산 마감 및 데이터 관리 폼
  const [locks, setLocks] = useState([]);
  const [periodType, setPeriodType] = useState('MONTH');
  const [lockYear, setLockYear] = useState(new Date().getFullYear().toString());
  const [lockMonth, setLockMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [lockHalf, setLockHalf] = useState('1');
  const [backupFile, setBackupFile] = useState(null);

  // 직책 설정 상태
  const [selectedPosGroupId, setSelectedPosGroupId] = useState('');
  const [groupPositions, setGroupPositions] = useState([]);
  const [newPosName, setNewPosName] = useState('');
  const [newPosRole, setNewPosRole] = useState('DEPARTMENT_ACCOUNTANT');

  // 다중 소속 관리 상태
  const [allAssignments, setAllAssignments] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [newAssignCommitteeId, setNewAssignCommitteeId] = useState('');
  const [newAssignGroupId, setNewAssignGroupId] = useState('');
  const [newAssignPositionId, setNewAssignPositionId] = useState('');
  const [newAssignGroupOptions, setNewAssignGroupOptions] = useState([]);

  // 다교회 SaaS 위원회/그룹 관리 상태 및 에디터 폼
  const [adminOrgs, setAdminOrgs] = useState([]);
  const [selectedAdminOrgId, setSelectedAdminOrgId] = useState('');
  const [adminGroups, setAdminGroups] = useState([]);
  const [newGroupSort, setNewGroupSort] = useState(0);

  const [editingOrgId, setEditingOrgId] = useState(null);
  const [editingOrgName, setEditingOrgName] = useState('');
  const [editingOrgDesc, setEditingOrgDesc] = useState('');
  const [editingOrgActive, setEditingOrgActive] = useState(true);

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupDesc, setEditingGroupDesc] = useState('');
  const [editingGroupSort, setEditingGroupSort] = useState(0);
  const [editingGroupActive, setEditingGroupActive] = useState(true);

  // 비밀번호 변경 기능 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState(null);
  const [passwordChangeError, setPasswordChangeError] = useState(null);

  // Passkey 생체인증 로그인 상태 및 훅
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('내 생체인증 기기');

  const fetchPasskeys = async () => {
    try {
      const data = await apiClient('/api/auth/passkey/credentials');
      setPasskeys(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfileInfo = async () => {
    setProfileLoading(true);
    setProfileApplySuccess('');
    setProfileApplyError('');
    try {
      const profile = await apiClient('/api/church/profile');
      setProfileData(profile);

      const membership = await apiClient('/api/church/membership/status');
      setProfileMembership(membership);

      const assigns = await apiClient('/api/church/assignments/me');
      setProfileAssignments(assigns || []);

      const comms = await apiClient('/api/church/admin/committees');
      setProfileCommittees(comms || []);

      const positions = await apiClient('/api/church/positions');
      setProfilePositions(positions || []);

      if (membership?.status === 'none' || membership?.status === 'rejected') {
        const churchList = await apiClient('/api/churches');
        setChurches(churchList || []);
      }
    } catch (err) {
      console.error('Error fetching profile settings data:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAssignmentHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiClient('/api/church/invitations/history');
      setAssignmentHistory(data || []);
    } catch (err) {
      console.error('Error fetching assignment history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const data = await apiClient('/api/church/invitations');
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    } finally {
      setInvitationsLoading(false);
    }
  };

  useEffect(() => {
    if (['profile', 'belonging', 'apply-church', 'apply-assignment', 'apply-status', 'invitations'].includes(activeTab)) {
      fetchProfileInfo();
    }
    if (activeTab === 'belonging') {
      fetchAssignmentHistory();
    }
    if (activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!profileSelectedCommId) {
      setProfileGroups([]);
      return;
    }
    const fetchGroups = async () => {
      try {
        const data = await apiClient(`/api/church/admin/committees/${profileSelectedCommId}/groups`);
        setProfileGroups(data || []);
      } catch (err) {
        console.error('Error fetching groups:', err);
      }
    };
    fetchGroups();
  }, [profileSelectedCommId]);

  useEffect(() => {
    if (!inviteCommId) {
      setInviteGroupOptions([]);
      return;
    }
    const fetchInviteGroups = async () => {
      try {
        const data = await apiClient(`/api/church/admin/committees/${inviteCommId}/groups`);
        setInviteGroupOptions(data || []);
      } catch (err) {
        console.error('Error fetching invite groups:', err);
      }
    };
    fetchInviteGroups();
  }, [inviteCommId]);

  useEffect(() => {
    if (activeTab === 'passkey') {
      fetchPasskeys();
    }
  }, [activeTab]);

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      
      // 1. Get options
      const options = await apiClient('/api/auth/passkey/register/options', {
        method: 'POST'
      });

      // 2. Perform browser registration
      const regResponse = await startRegistration(options);

      // 3. Verify
      const verifyResult = await apiClient('/api/auth/passkey/register/verify', {
        method: 'POST',
        body: JSON.stringify({ regResponse, deviceName: newDeviceName })
      });

      if (verifyResult.success) {
        alert('지문/Face ID 기기 등록 완료!');
        fetchPasskeys();
      } else {
        throw new Error(verifyResult.message || '인증 기기 등록 실패');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || '기기 등록 중 오류가 발생했습니다.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (id) => {
    if (!window.confirm('이 기기를 삭제해도 이메일/비밀번호로 로그인할 수 있습니다.\n정말 이 기기를 삭제하시겠습니까?')) {
      return;
    }
    try {
      const result = await apiClient(`/api/auth/passkey/credentials/${id}`, {
        method: 'DELETE'
      });
      if (result.success) {
        alert('생체인증 기기가 삭제되었습니다.');
        fetchPasskeys();
      }
    } catch (err) {
      alert(err.message || '기기 삭제 실패');
    }
  };

  const getStandardizedRole = () => {
    if (isAdminUser(user)) return 'system_admin';
    const primary = profileAssignments?.find(a => a.is_primary && a.is_active && a.status === 'approved');
    if (!primary) return 'member';
    const role = primary.role_code;
    if (role === 'PASTOR') return 'pastor';
    if (role === 'ELDER') return 'elder';
    if (role === 'FINANCE_MANAGER') return 'finance_admin';
    if (role === 'AUDITOR') return 'auditor';
    if (role === 'COMMITTEE_CHAIR') return 'committee_head';
    if (role === 'GROUP_LEADER') return 'department_head';
    if (role === 'TEACHER') return 'teacher';
    return 'member';
  };

  const canAccessTab = (tabKey) => {
    if (isAdminUser(user)) return true;
    if (['profile', 'belonging', 'apply-church', 'apply-assignment', 'apply-status', 'display', 'passkey'].includes(tabKey)) return true;
    if (tabKey === 'invitations') {
      const std = getStandardizedRole();
      return ['system_admin', 'pastor', 'elder', 'finance_admin', 'committee_head', 'department_head'].includes(std);
    }
    if (['categories', 'users', 'orgs', 'positions', 'ocr-queue', 'locks', 'database'].includes(tabKey)) {
      const role = user?.role || '';
      return role === 'SYSTEM_ADMIN' || role === 'AUDITOR';
    }
    return false;
  };

  const handleTabClick = (tabKey) => {
    if (canAccessTab(tabKey)) {
      setActiveTab(tabKey);
    } else {
      alert('이 기능은 관리자 권한이 필요합니다.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeMessage(null);
    setPasswordChangeError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError('모든 필드를 입력해 주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordChangeError('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordChangeError('새 비밀번호는 현재 비밀번호와 다르게 설정해야 합니다.');
      return;
    }

    try {
      setPasswordChangeLoading(true);
      const data = await apiClient('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      setPasswordChangeMessage('비밀번호가 변경되었습니다. 다음 로그인부터 새 비밀번호를 사용해 주세요.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordChangeError(err.message === '현재 비밀번호가 올바르지 않습니다.' ? '현재 비밀번호가 올바르지 않습니다.' : err.message);
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchOrganizations();
    fetchGroups();
    fetchLocks();
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'AUDITOR') {
      fetchUsers();
    }
  }, [token]);

  // OCR Queue tab load
  useEffect(() => {
    if (activeTab === 'ocr-queue') {
      fetchOcrQueue();
    }
  }, [activeTab, token]);

  // 다교회 SaaS 어드민 조직/그룹 관리 훅
  const fetchAdminOrgs = async () => {
    try {
      const data = await apiClient('/api/church/admin/committees');
      console.log('[FETCH DEPARTMENTS RESPONSE]', data);
      if (Array.isArray(data)) {
        setAdminOrgs(data);
        if (data.length > 0 && !selectedAdminOrgId) {
          setSelectedAdminOrgId(data[0].department_id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminGroups = async (deptId) => {
    if (!deptId) return;
    try {
      const data = await apiClient(`/api/church/admin/committees/${deptId}/groups`);
      console.log('[FETCH GROUPS RESPONSE]', data);
      if (Array.isArray(data)) {
        setAdminGroups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'orgs' && isAdminOrAuditor) {
      fetchAdminOrgs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedAdminOrgId) {
      fetchAdminGroups(selectedAdminOrgId);
    } else {
      setAdminGroups([]);
    }
  }, [selectedAdminOrgId]);

  // SSE Real-time Updates for OCR Queue
  useEffect(() => {
    if (activeTab !== 'ocr-queue' || !token) return;
    const eventSource = new EventSource(`/api/vouchers/sse?token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE OCR Update in Settings Queue Manager:', data);

        setOcrQueue(prev => prev.map(att => {
          if (att.attachment_id === data.attachment_id) {
            return {
              ...att,
              ocr_status: data.ocr_status,
              ocr_result: data.ocr_result || att.ocr_result,
              ocr_error: data.ocr_error || null,
              tags: data.tags ? data.tags.join(',') : att.tags
            };
          }
          return att;
        }));
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE disconnected, closing EventSource:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeTab, token]);

  const fetchOcrQueue = async () => {
    setOcrQueueLoading(true);
    try {
      const data = await apiClient('/api/vouchers/ocr-queue/list');
      setOcrQueue(data);
    } catch (err) {
      console.error('Fetch OCR queue error:', err);
    } finally {
      setOcrQueueLoading(false);
    }
  };

  const handleReprocessOcr = async (attachmentId) => {
    try {
      const data = await apiClient(`/api/vouchers/ocr-queue/${attachmentId}/reprocess`, {
        method: 'POST'
      });
      alert(data.message);
      fetchOcrQueue();
    } catch (err) {
      alert(`❌ 재분석 요청 실패: ${err.message}`);
    }
  };

  const fetchLocks = async () => {
    try {
      const data = await apiClient('/api/period-locks');
      setLocks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLockPeriod = async (e) => {
    e.preventDefault();
    let val = '';
    if (periodType === 'MONTH') {
      val = `${lockYear}-${lockMonth}`;
    } else if (periodType === 'HALF') {
      val = `${lockYear}-${lockHalf}`;
    } else {
      val = lockYear;
    }

    try {
      const data = await apiClient('/api/period-locks/lock', {
        method: 'POST',
        body: JSON.stringify({ periodType, periodValue: val })
      });
      
      alert(data.message);
      fetchLocks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnlockPeriod = async (type, val) => {
    if (!window.confirm(`정말 ${val} 기간의 마감을 해제하시겠습니까?`)) return;

    try {
      const data = await apiClient('/api/period-locks/unlock', {
        method: 'POST',
        body: JSON.stringify({ periodType: type, periodValue: val })
      });

      alert(data.message);
      fetchLocks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const blob = await apiClient('/api/system/backup', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `church_backup_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestoreBackup = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      alert('복원할 백업 ZIP 파일을 선택해 주세요.');
      return;
    }

    if (!window.confirm('⚠️ 경고: 데이터 복원 시 현재의 모든 데이터베이스와 업로드 영수증 파일이 지워지고 백업 데이터로 대체됩니다. 복원 성공 시 백엔드 서버가 종료되므로 재가동이 필요합니다. 계속 진행하시겠습니까?')) {
      return;
    }

    const formData = new FormData();
    formData.append('backupFile', backupFile);

    try {
      const data = await apiClient('/api/system/restore', {
        method: 'POST',
        body: formData
      });

      alert(data.message);
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiClient('/api/categories');
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const data = await apiClient('/api/organizations');
      if (Array.isArray(data)) {
        setOrganizations(data);
        if (data.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data[0].organization_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await apiClient('/api/groups');
      if (Array.isArray(data)) {
        setGroups(data);
        if (data.length > 0 && !newUserGroup) {
          setNewUserGroup(data[0].group_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await apiClient('/api/users');
      if (Array.isArray(data)) {
        setUsers(data);
      }
      const assignments = await apiClient('/api/church/assignments/me');
      if (Array.isArray(assignments)) {
        setAllAssignments(assignments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatParent || !newCatChild) return;

    try {
      await apiClient('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          type: newCatType,
          parent_category: newCatParent,
          child_category: newCatChild,
          description: newCatDesc
        })
      });

      setNewCatParent('');
      setNewCatChild('');
      setNewCatDesc('');
      fetchCategories();
      alert('계정과목 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return;

    try {
      await apiClient('/api/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: newOrgName,
          description: newOrgDesc
        })
      });

      setNewOrgName('');
      setNewOrgDesc('');
      fetchOrganizations();
      alert('위원회 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!selectedOrgId || !newGroupName) return;

    try {
      await apiClient('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: parseInt(selectedOrgId, 10),
          name: newGroupName,
          description: newGroupDesc
        })
      });

      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
      alert('소속 그룹(찬양팀) 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddAdminOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return;
    const payload = { name: newOrgName, description: newOrgDesc };
    console.log('[CREATE DEPARTMENT PAYLOAD]', payload);
    try {
      const result = await apiClient('/api/church/admin/committees', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setNewOrgName('');
      setNewOrgDesc('');
      
      if (result.department) {
        const newDept = {
          department_id: result.department.id,
          name: result.department.name,
          description: newOrgDesc,
          is_active: true
        };
        setAdminOrgs(prev => {
          const exists = prev.some(item => item.department_id === newDept.department_id);
          return exists ? prev : [...prev, newDept];
        });
        setSelectedAdminOrgId(newDept.department_id.toString());
      }
      
      await fetchAdminOrgs();
      alert('부서(위원회) 등록 성공');
    } catch (err) {
      const errData = err.data || {};
      const errorMessage =
        errData.details ||
        errData.sqlMessage ||
        errData.constraint ||
        err.message ||
        errData.message ||
        errData.error ||
        '위원회 등록 중 알 수 없는 오류가 발생했습니다.';
      alert(`위원회 등록 실패:\n${errorMessage}`);
    }
  };

  const handleUpdateAdminOrg = async (e) => {
    e.preventDefault();
    if (!editingOrgName) return;
    try {
      await apiClient(`/api/church/admin/committees/${editingOrgId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingOrgName,
          description: editingOrgDesc,
          is_active: editingOrgActive
        })
      });
      setEditingOrgId(null);
      fetchAdminOrgs();
      alert('부서 정보 수정 완료');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAdminOrg = async (deptId) => {
    if (!window.confirm('정말 이 부서를 비활성화하시겠습니까?')) return;
    try {
      await apiClient(`/api/church/admin/committees/${deptId}`, {
        method: 'DELETE'
      });
      fetchAdminOrgs();
      alert('부서 비활성화 완료');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddAdminGroup = async (e) => {
    e.preventDefault();
    if (!selectedAdminOrgId || !newGroupName) return;
    const payload = {
      department_id: parseInt(selectedAdminOrgId, 10),
      name: newGroupName,
      description: newGroupDesc,
      sort_order: parseInt(newGroupSort || 0, 10)
    };
    console.log('[CREATE DEPARTMENT PAYLOAD]', payload);
    try {
      const result = await apiClient('/api/church/admin/groups', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupSort(0);
      
      if (result.department) {
        const newGroup = {
          group_id: result.department.id,
          department_id: parseInt(selectedAdminOrgId, 10),
          name: result.department.name,
          description: newGroupDesc,
          is_active: true
        };
        setAdminGroups(prev => {
          const exists = prev.some(item => item.group_id === newGroup.group_id);
          return exists ? prev : [...prev, newGroup];
        });
      }
      
      await fetchAdminGroups(selectedAdminOrgId);
      alert('소속 그룹 등록 성공');
    } catch (err) {
      const errData = err.data || {};
      const errorMessage =
        errData.details ||
        errData.sqlMessage ||
        errData.constraint ||
        err.message ||
        errData.message ||
        errData.error ||
        '그룹 등록 중 알 수 없는 오류가 발생했습니다.';
      alert(`소속 그룹 등록 실패:\n${errorMessage}`);
    }
  };

  const handleUpdateAdminGroup = async (e) => {
    e.preventDefault();
    if (!editingGroupName) return;
    try {
      await apiClient(`/api/church/admin/groups/${editingGroupId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingGroupName,
          description: editingGroupDesc,
          sort_order: parseInt(editingGroupSort || 0, 10),
          is_active: editingGroupActive
        })
      });
      setEditingGroupId(null);
      fetchAdminGroups(selectedAdminOrgId);
      alert('그룹 정보 수정 완료');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAdminGroup = async (groupId) => {
    if (!window.confirm('정말 이 그룹을 비활성화하시겠습니까?')) return;
    try {
      await apiClient(`/api/church/admin/groups/${groupId}`, {
        method: 'DELETE'
      });
      fetchAdminGroups(selectedAdminOrgId);
      alert('그룹 비활성화 완료');
    } catch (err) {
      alert(err.message);
    }
  };


  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserUsername || !newUserPassword || !newUserName) return;

    try {
      await apiClient('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUserUsername,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole,
          position: newUserPosition,
          group_id: parseInt(newUserGroup, 10)
        })
      });

      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserName('');
      fetchUsers();
      alert('사용자 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApproveUser = async (userId) => {
    if (!window.confirm('해당 사용자의 가입 신청을 승인하시겠습니까?')) return;
    try {
      await apiClient(`/api/users/${userId}/approve`, {
        method: 'POST'
      });
      
      alert('사용자 가입 승인이 완료되었습니다.');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !inviteCommId || !invitePosId || !inviteRole) {
      alert('필수 입력 항목을 채워주세요.');
      return;
    }
    try {
      const data = await apiClient('/api/church/invitations', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          phone: invitePhone,
          committee_id: inviteCommId,
          group_id: inviteGroupId || null,
          position_id: invitePosId,
          role: inviteRole,
          message: inviteMessage,
          expires_in_days: inviteExpiresDays
        })
      });
      
      const commName = profileCommittees.find(c => c.department_id === parseInt(inviteCommId, 10))?.name || '';
      const grpName = inviteGroupOptions.find(g => g.group_id === parseInt(inviteGroupId, 10))?.name || '';
      const posName = profilePositions.find(p => p.position_id === invitePosId)?.name || '';
      const churchName = profileMembership?.churchName || '우리교회';

      const url = `${window.location.origin}/invite/${data.token}`;
      const msg = `[${churchName}] Church Think에 임명되셨습니다.
임명 소속: ${commName} ${grpName ? '> ' + grpName : ''}
임명 직책: ${posName}
아래 초대 링크를 클릭하여 가입 또는 로그인 후 수락을 진행해 주세요.
초대 링크: ${url}`;

      setInviteLinkResult({ url, message: msg });
      fetchInvitations();
    } catch (err) {
      alert(err.message || '초대 생성 실패');
    }
  };

  const handleRevokeInvitation = async (id) => {
    if (!window.confirm('정말 이 초대 링크를 취소(폐기)하시겠습니까?')) return;
    try {
      await apiClient(`/api/church/invitations/${id}/revoke`, {
        method: 'POST'
      });
      alert('초대가 취소되었습니다.');
      fetchInvitations();
    } catch (err) {
      alert(err.message || '초대 취소 실패');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`⚠️ 경고: 정말 사용자 '${name}' 계정을 영구 삭제하시겠습니까? 관련 데이터가 깨질 수 있습니다.`)) {
      return;
    }
    try {
      const data = await apiClient(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      alert(data.message);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = async (userId, assignmentId) => {
    if (!window.confirm('정말 이 소속/직책 배정을 제거하시겠습니까?')) return;
    try {
      await apiClient(`/api/church/assignments/users/${userId}/${assignmentId}`, {
        method: 'DELETE'
      });
      fetchUsers();
      alert('소속이 제거되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAssignment = async (e, userId) => {
    e.preventDefault();
    if (!newAssignCommitteeId || !newAssignPositionId) {
      alert('위원회와 직책은 필수 선택 사항입니다.');
      return;
    }
    try {
      await apiClient(`/api/church/assignments/users/${userId}`, {
        method: 'POST',
        body: JSON.stringify({
          committee_id: parseInt(newAssignCommitteeId, 10),
          group_id: newAssignGroupId ? parseInt(newAssignGroupId, 10) : null,
          position_id: newAssignPositionId
        })
      });
      
      setNewAssignCommitteeId('');
      setNewAssignGroupId('');
      setNewAssignPositionId('');
      setNewAssignGroupOptions([]);
      fetchUsers();
      alert('소속이 배정되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignCommitteeChange = async (value) => {
    setNewAssignCommitteeId(value);
    setNewAssignGroupId('');
    setNewAssignGroupOptions([]);
    if (value) {
      try {
        const data = await apiClient(`/api/church/admin/committees/${value}/groups`);
        if (Array.isArray(data)) {
          setNewAssignGroupOptions(data);
        }
      } catch (err) {
        console.error('Fetch groups error:', err);
      }
    }
  };

  const handleDeleteOrg = async (orgId, name) => {
    if (!window.confirm(`⚠️ 경고: 정말 위원회 '${name}'(을)를 삭제하시겠습니까? 산하의 모든 소속 그룹도 함께 삭제됩니다.`)) {
      return;
    }
    try {
      const data = await apiClient(`/api/organizations/${orgId}`, {
        method: 'DELETE'
      });

      alert(data.message);
      fetchOrganizations();
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteGroup = async (groupId, name) => {
    if (!window.confirm(`⚠️ 경고: 정말 소속 그룹 '${name}'(을)를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      const data = await apiClient(`/api/groups/${groupId}`, {
        method: 'DELETE'
      });

      alert(data.message);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchAdminPositions = async () => {
    try {
      const data = await apiClient('/api/church/positions?include_inactive=true');
      if (Array.isArray(data)) {
        setGroupPositions(data);
      } else {
        setGroupPositions([]);
      }
    } catch (err) {
      console.error(err);
      setGroupPositions([]);
    }
  };

  const handleAddPosition = async (e) => {
    e.preventDefault();
    if (!newPosName) return;
    try {
      await apiClient('/api/church/positions', {
        method: 'POST',
        body: JSON.stringify({ name: newPosName, role_code: newPosRole })
      });
      
      setNewPosName('');
      fetchAdminPositions();
      alert('직책 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePosition = async (posId) => {
    if (!window.confirm('정말 이 직책을 비활성화하시겠습니까?')) return;
    try {
      await apiClient(`/api/church/positions/${posId}`, {
        method: 'DELETE'
      });

      fetchAdminPositions();
      alert('직책이 비활성화되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'positions') {
      fetchAdminPositions();
    }
  }, [activeTab]);

  const isAdminOrAuditor = isAdminUser(user) || user.role === 'SYSTEM_ADMIN' || user.role === 'AUDITOR';

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-16">
      <div className="flex items-center gap-2">
        <SettingsIcon size={16} className="text-church-400" />
        <h2 className="text-sm font-bold text-slate-300">회계 마스터 설정 및 관리</h2>
      </div>

      {/* 가로 스크롤 대응 반응형 탭 컨테이너 */}
      <div className="flex gap-1 overflow-x-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 no-scrollbar select-none">
        {[
          { key: 'profile', label: '내 프로필' },
          { key: 'belonging', label: '내 소속' },
          (profileMembership?.status === 'none' || profileMembership?.status === 'rejected') && { key: 'apply-church', label: '교회 신청' },
          profileMembership?.status === 'approved' && { key: 'apply-assignment', label: '위원회/부서 신청' },
          { key: 'apply-status', label: '신청현황' },
          { key: 'invitations', label: '초대 관리' },
          { key: 'categories', label: '계정과목' },
          { key: 'display', label: '화면설정' },
          { key: 'marketplace', label: '마켓플레이스' },
          { key: 'users', label: '사용자' },
          { key: 'orgs', label: '조직' },
          { key: 'positions', label: '직책설정' },
          { key: 'ocr-queue', label: 'AI 분석 현황' },
          { key: 'locks', label: '결산마감' },
          { key: 'database', label: '데이터' },
          { key: 'passkey', label: '생체인증' }
        ].filter(Boolean).filter(tab => canAccessTab(tab.key)).map(tab => {
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 ${
                activeTab === tab.key ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 내 프로필 탭 */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2">플랫폼 사용자 정보</h3>
            {profileLoading ? (
              <div className="text-[10px] text-slate-500 py-4 text-center">프로필 로딩 중...</div>
            ) : (
              <div className="space-y-3 text-[11px]">
                <div className="grid grid-cols-2 gap-2 text-slate-400 font-semibold font-sans">
                  <div>이름:</div>
                  <div className="text-white text-right font-medium">{profileData?.display_name || user?.name}</div>
                  <div>아이디:</div>
                  <div className="text-white text-right font-mono">{profileData?.username || user?.username}</div>
                  <div>이메일:</div>
                  <div className="text-white text-right font-mono">{profileData?.email || user?.email}</div>
                  <div>휴대폰:</div>
                  <div className="text-white text-right">{profileData?.phone || '미등록'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 내 소속 탭 */}
      {activeTab === 'belonging' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2">현재 승인된 소속 정보</h3>
            {profileLoading ? (
              <div className="text-[10px] text-slate-500 py-4 text-center">소속 정보 조회 중...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">가입 교회명</span>
                  <span className="text-white font-bold text-xs">{profileMembership?.churchName || '소속 없음'}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[10.5px] font-bold text-slate-400 block mt-2">배정된 위원회 및 부서</span>
                  {profileAssignments.filter(a => a.status === 'approved').length === 0 ? (
                    <p className="text-[10px] text-slate-500 py-3 text-center bg-slate-900/20 rounded-xl border border-slate-805/40">승인된 조직 배정 내역이 없습니다.</p>
                  ) : (
                    profileAssignments.filter(a => a.status === 'approved').map(a => (
                      <div key={a.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex justify-between items-center text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">{a.committee_name} {a.group_name ? `> ${a.group_name}` : ''}</span>
                          <span className="text-[9px] text-slate-500">{a.position_name} · {a.role_code}</span>
                        </div>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          승인됨
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 소속/직책 변경 이력 Timeline */}
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2">소속 및 직책 변경 이력</h3>
            {historyLoading ? (
              <div className="text-[10px] text-slate-500 py-4 text-center">이력 로딩 중...</div>
            ) : assignmentHistory.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-3 text-center bg-slate-900/20 rounded-xl border border-slate-800/40">기록된 이력이 없습니다.</p>
            ) : (
              <div className="space-y-4 pl-2 border-l border-slate-800 relative font-sans max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {assignmentHistory.map((h, idx) => {
                  const dateStr = new Date(h.created_at).toLocaleDateString();
                  
                  const actionLabels = {
                    'invited': '초대 발송',
                    'accepted': '초대 수락',
                    'approved': '부서 배정 승인',
                    'changed': '직책 변경',
                    'transferred': '부서 전입/전출',
                    'ended': '임기 종료/해제',
                    'revoked': '배정 취소/폐기'
                  };

                  return (
                    <div key={h.id || idx} className="relative pl-4 space-y-1">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-church-500 border border-slate-950" />
                      
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-white uppercase tracking-wider">{actionLabels[h.change_type] || h.change_type}</span>
                        <span className="text-[9px] text-slate-500">{dateStr}</span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {h.change_type === 'invited' && `${h.new_committee_name} ${h.new_group_name ? '> ' + h.new_group_name : ''} (${h.new_position_name}) 으로 초대장이 발송되었습니다.`}
                        {h.change_type === 'accepted' && `${h.new_committee_name} ${h.new_group_name ? '> ' + h.new_group_name : ''} (${h.new_position_name}) 초대 수락 완료.`}
                        {h.change_type === 'approved' && (
                          h.prev_position_name 
                            ? `직책 변경: ${h.prev_committee_name} (${h.prev_position_name}) ➔ ${h.new_committee_name} (${h.new_position_name})`
                            : `신규 배정 승인: ${h.new_committee_name} ${h.new_group_name ? '> ' + h.new_group_name : ''} (${h.new_position_name})`
                        )}
                        {h.change_type === 'ended' && `임기 종료: ${h.prev_committee_name} ${h.prev_group_name ? '> ' + h.prev_group_name : ''} (${h.prev_position_name})`}
                        {h.change_type === 'revoked' && `취소/폐기됨.`}
                        {h.reason && <span className="block text-[9px] text-slate-500 mt-0.5">사유: {h.reason}</span>}
                      </p>
                      
                      <div className="text-[9px] text-slate-500">
                        조치자: <span className="font-semibold text-slate-400">{h.changer_name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 교회 신청 탭 */}
      {activeTab === 'apply-church' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2">교회 가입 신청</h3>
            
            {churchApplyError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-450 text-[10px] font-bold">
                {churchApplyError}
              </div>
            )}
            {churchApplySuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 text-[10px] font-bold">
                {churchApplySuccess}
              </div>
            )}

            {profileMembership?.status === 'approved' ? (
              <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-emerald-450 text-[10.5px] leading-relaxed font-semibold">
                ✓ 이미 **{profileMembership?.churchName}** 소속 가입이 승인되었습니다.
              </div>
            ) : profileMembership?.status === 'pending' ? (
              <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-450 text-[10.5px] leading-relaxed font-semibold">
                ⌛ **{profileMembership?.churchName}** 가입 승인 대기 중입니다. 관리자 승인을 기다려주세요.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">신청할 교회 선택 *</label>
                  <select
                    value={selectedApplyChurchId}
                    onChange={(e) => setSelectedApplyChurchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
                  >
                    <option value="">교회를 선택하세요</option>
                    {churches.map(c => (
                      <option key={c.church_id} value={c.project_id}>{c.church_name} ({c.denomination} · {c.region})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">가입 신청 사유 / 메모</label>
                  <textarea
                    value={applyChurchMemo}
                    onChange={(e) => setApplyChurchMemo(e.target.value)}
                    placeholder="관리자가 확인할 수 있도록 직책 신청 사유를 간단히 적어주세요."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none resize-none font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedApplyChurchId) {
                      setChurchApplyError('가입할 교회를 선택해 주세요.');
                      return;
                    }
                    setChurchApplyLoading(true);
                    setChurchApplyError('');
                    setChurchApplySuccess('');
                    try {
                      const selectedChurch = churches.find(c => c.project_id === selectedApplyChurchId);
                      const res = await apiClient('/api/church/membership/apply', {
                        method: 'POST',
                        body: JSON.stringify({
                          churchProfileId: selectedChurch?.church_id
                        })
                      });
                      if (res.success) {
                        setChurchApplySuccess(res.message);
                        setSelectedApplyChurchId('');
                        setApplyChurchMemo('');
                        fetchProfileInfo();
                      } else {
                        setChurchApplyError(res.message || '가입 신청 실패');
                      }
                    } catch (err) {
                      setChurchApplyError(err.message || '신청 중 오류가 발생했습니다.');
                    } finally {
                      setChurchApplyLoading(false);
                    }
                  }}
                  disabled={churchApplyLoading}
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] mt-2"
                >
                  {churchApplyLoading ? '제출 중...' : '교회 가입 신청서 제출'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 위원회/부서 신청 탭 */}
      {activeTab === 'apply-assignment' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2">새 조직 배정 신청</h3>
            {profileApplyError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-450 text-[10px] font-bold">
                {profileApplyError}
              </div>
            )}
            {profileApplySuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 text-[10px] font-bold">
                {profileApplySuccess}
              </div>
            )}

            {profileMembership?.status !== 'approved' ? (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[10.5px] leading-relaxed font-semibold">
                ⚠️ 교회 소속 가입 승인이 완료되어야 부서/위원회 배정 신청이 가능합니다.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">신청할 위원회/기관 *</label>
                  <select
                    value={profileSelectedCommId}
                    onChange={(e) => {
                      setProfileSelectedCommId(e.target.value);
                      setProfileSelectedGroupId('');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
                  >
                    <option value="">선택하세요</option>
                    {profileCommittees.map(c => (
                      <option key={c.department_id} value={c.department_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 font-sans">소속 그룹 / 부서</label>
                  <select
                    value={profileSelectedGroupId}
                    onChange={(e) => setProfileSelectedGroupId(e.target.value)}
                    disabled={!profileSelectedCommId || profileGroups.length === 0}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                  >
                    <option value="">선택 안 함 (위원회 직속)</option>
                    {profileGroups.map(g => (
                      <option key={g.group_id} value={g.group_id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 font-sans">희망 직책 *</label>
                  <select
                    value={profileSelectedPosId}
                    onChange={(e) => setProfileSelectedPosId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
                  >
                    <option value="">선택하세요</option>
                    {profilePositions.map(p => (
                      <option key={p.position_id} value={p.position_id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!profileSelectedCommId || !profileSelectedPosId) {
                      setProfileApplyError('위원회와 직책을 모두 선택해 주세요.');
                      return;
                    }
                    setProfileApplyLoading(true);
                    setProfileApplyError('');
                    setProfileApplySuccess('');
                    try {
                      const res = await apiClient('/api/church/assignments/apply', {
                        method: 'POST',
                        body: JSON.stringify({
                          committee_id: profileSelectedCommId,
                          group_id: profileSelectedGroupId || null,
                          position_id: profileSelectedPosId
                        })
                      });
                      if (res.success) {
                        setProfileApplySuccess(res.message);
                        setProfileSelectedCommId('');
                        setProfileSelectedGroupId('');
                        setProfileSelectedPosId('');
                        fetchProfileInfo();
                      } else {
                        setProfileApplyError(res.message || '신청 실패');
                      }
                    } catch (err) {
                      setProfileApplyError(err.message || '신청 중 오류가 발생했습니다.');
                    } finally {
                      setProfileApplyLoading(false);
                    }
                  }}
                  disabled={profileApplyLoading}
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] mt-2"
                >
                  {profileApplyLoading ? '제출 중...' : '부서/직책 배정 신청서 제출'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 신청현황 탭 */}
      {activeTab === 'apply-status' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white mb-2">가입 및 배정 신청 현황</h3>
            {profileLoading ? (
              <div className="text-[10px] text-slate-500 py-4 text-center">신청현황 조회 중...</div>
            ) : (
              <div className="space-y-4">
                {/* 교회 신청 */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">교회 소속 가입 상태</h4>
                  {!profileMembership || profileMembership.status === 'none' ? (
                    <p className="text-[10px] text-slate-500 bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">교회 소속 가입 신청 이력이 없습니다.</p>
                  ) : (
                    <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex justify-between items-center text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-white">{profileMembership.churchName}</span>
                        <span className="text-[9px] text-slate-500 font-sans">교회 가입 신청</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        profileMembership.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        profileMembership.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {profileMembership.status === 'approved' ? '승인됨' : profileMembership.status === 'pending' ? '대기중' : '반려됨'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 부서 신청 */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">부서/직책 배정 신청 내역</h4>
                  {profileAssignments.length === 0 ? (
                    <p className="text-[10px] text-slate-500 bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">조직 배정 신청 내역이 없습니다.</p>
                  ) : (
                    profileAssignments.map(a => (
                      <div key={a.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex justify-between items-center text-[11px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">{a.committee_name} {a.group_name ? `> ${a.group_name}` : ''}</span>
                          <span className="text-[9px] text-slate-500 font-sans">{a.position_name} · {a.role_code}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          a.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          a.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {a.status === 'approved' ? '승인됨' : a.status === 'pending' ? '대기중' : '반려됨'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 화면설정 (글자 크기 조절) */}
      {activeTab === 'display' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-white">글자 크기 조절</h3>
              <p className="text-[9px] text-slate-500">60대 이상 어르신분들도 편리하게 보실 수 있도록 글자 크기를 조절합니다.</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { level: 'normal', label: '보통 크기', desc: '17.5px (기본)' },
                { level: 'large', label: '큰 글씨', desc: '21px (추천)' },
                { level: 'xlarge', label: '아주 큰 글씨', desc: '24.5px' }
              ].map(opt => (
                <button
                  key={opt.level}
                  type="button"
                  onClick={() => setFontScale(opt.level)}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    fontScale === opt.level
                      ? 'bg-church-600/20 border-church-500 text-church-400 font-bold shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs">{opt.label}</span>
                  <span className="text-[8px] opacity-60 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* 글자 크기 미리보기 카드 */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">글자 크기 미리보기</span>
              <div className="glass p-3 rounded-lg space-y-1.5">
                <h4 className="text-xs font-bold text-white">[운영비] 식비및간식비</h4>
                <p className="text-[10px] text-slate-300">적요: 부서 회의 다과 구입</p>
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-semibold pt-1 border-t border-slate-900">
                  <span>금액: 32,500원</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[8px] font-bold">승인 완료</span>
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 카드 */}
            <form onSubmit={handlePasswordChange} className="glass p-5 rounded-2xl space-y-4 border border-slate-800 mt-4 shadow-md">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-bold text-white">비밀번호 변경</h3>
                <p className="text-[9px] text-slate-500">보안을 위해 비밀번호는 최소 8자 이상으로 설정해 주세요.</p>
              </div>

              {passwordChangeError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[9px] font-bold leading-normal flex items-start gap-1.5">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              {passwordChangeMessage && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-bold leading-normal flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                  <span>{passwordChangeMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block">현재 비밀번호</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-church-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 (최소 8자)"
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-church-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-church-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordChangeLoading}
                className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {passwordChangeLoading && <Loader2 size={12} className="animate-spin" />}
                비밀번호 변경
              </button>
            </form>
          </div>
        </div>
      )}
      {/* 마켓플레이스 설정 (타 서비스 토글) (TEAM F) */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-white">플랫폼 마켓플레이스 연동 설정</h3>
              <p className="text-[9px] text-slate-500">Booza Think 플랫폼의 다른 AI 의사결정 모듈들을 활성화하거나 제어합니다.</p>
            </div>

            <div className="space-y-3">
              {/* Stock Think Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Stock Think 연동</h4>
                  <p className="text-[9px] text-slate-500">AI 주식 가치 평가 분석 모듈 활성화</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-church-600"></div>
                </label>
              </div>

              {/* Estate Think Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Estate Think 연동</h4>
                  <p className="text-[9px] text-slate-500">AI 부동산 분석 의사결정 모듈 활성화</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-church-600"></div>
                </label>
              </div>

              {/* Mission Think Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Mission Think 연동</h4>
                  <p className="text-[9px] text-slate-500">AI 선교 협력 네트워크 모듈 활성화</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" disabled />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-church-600"></div>
                </label>
              </div>
            </div>
            
            <p className="text-[8px] text-amber-500 font-semibold leading-normal">
              ※ 마켓플레이스 연동 스위치는 현재 준비중(Coming Soon) 모드 상태이므로 비활성화 상태가 유지됩니다. 서비스 공식 오픈 시 구독 등급에 맞춰 잠금 해제 가능합니다.
            </p>
          </div>
        </div>
      )}

      {/* 초대 관리 탭 */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl space-y-4 shadow-md border border-slate-800">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white">교회 멤버 초대 현황</h3>
              <button
                onClick={() => {
                  setInviteEmail('');
                  setInviteName('');
                  setInvitePhone('');
                  setInviteCommId(profileCommittees[0]?.department_id || '');
                  setInviteGroupId('');
                  setInvitePosId(profilePositions[0]?.position_id || '');
                  setInviteRole('member');
                  setInviteMessage('');
                  setInviteExpiresDays(7);
                  setInviteLinkResult(null);
                  setShowInviteModal(true);
                }}
                className="bg-church-600 hover:bg-church-500 text-white font-semibold py-1.5 px-3 rounded-lg text-[9px] flex items-center gap-1 transition-all active:scale-[0.98]"
              >
                <Plus size={12} /> 신규 초대장 발송
              </button>
            </div>

            {invitationsLoading ? (
              <div className="text-[10px] text-slate-500 py-4 text-center">초대 목록 로딩 중...</div>
            ) : invitations.length === 0 ? (
              <p className="text-[10px] text-slate-500 py-4 text-center bg-slate-900/20 rounded-xl border border-slate-800/40">발송한 초대장이 없습니다.</p>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                {invitations.map(invite => {
                  const statusColors = {
                    'pending': 'bg-amber-500/10 text-amber-450 border border-amber-500/20',
                    'accepted': 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20',
                    'expired': 'bg-slate-800 text-slate-500 border border-slate-800/50',
                    'revoked': 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                  };
                  
                  const statusLabels = {
                    'pending': '대기 중',
                    'accepted': '수락 완료',
                    'expired': '만료됨',
                    'revoked': '취소됨'
                  };

                  return (
                    <div key={invite.id} className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl space-y-2 text-[10.5px] text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-white block">{invite.invited_name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{invite.invited_email}</span>
                        </div>
                        <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${statusColors[invite.status] || 'bg-slate-800 text-slate-400'}`}>
                          {statusLabels[invite.status] || invite.status}
                        </span>
                      </div>

                      <div className="text-[9.5px] text-slate-400">
                        임명: {invite.committee_name} {invite.group_name ? `> ${invite.group_name}` : ''} ({invite.position_name} · {invite.role})
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800/50 pt-2 mt-1">
                        <span>만료: {new Date(invite.expires_at).toLocaleDateString()}</span>
                        {invite.status === 'pending' && (
                          <button
                            onClick={() => handleRevokeInvitation(invite.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold"
                          >
                            초대 취소
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. 계정과목 관리 */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          {isAdminOrAuditor && (
            <form onSubmit={handleAddCategory} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-1">
                <Plus size={14} className="text-church-400" /> 신규 계정과목 추가
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-semibold">구분</span>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="EXPENSE">지출 (EXPENSE)</option>
                    <option value="INCOME">수입 (INCOME)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-semibold">대분류</span>
                  <input
                    type="text"
                    value={newCatParent}
                    onChange={(e) => setNewCatParent(e.target.value)}
                    placeholder="예: 예배비"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-semibold">중분류</span>
                  <input
                    type="text"
                    value={newCatChild}
                    onChange={(e) => setNewCatChild(e.target.value)}
                    placeholder="예: 성가대소품비"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-semibold">설명</span>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="상세 설명"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
                등록
              </button>
            </form>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <FolderTree size={13} className="text-church-400" /> 현재 계정과목 리스트
            </h3>
            <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2">
              {categories.map((c) => (
                <div key={c.category_id} className="glass p-3 rounded-2xl flex items-center justify-between border border-slate-800/40">
                  <div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      c.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {c.type === 'INCOME' ? '수입' : '지출'}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">
                      [{c.parent_category}] {c.child_category}
                    </h4>
                  </div>
                  <span className="text-[9px] text-slate-500 italic">{c.description || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. 사용자 관리 */}
      {activeTab === 'users' && isAdminOrAuditor && (
        <div className="space-y-3">
          <form onSubmit={handleAddUser} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <Plus size={14} className="text-church-400" /> 신규 사용자 등록
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">아이디 *</span>
                <input
                  type="text"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="ID 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">비밀번호 *</span>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="PW 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">이름 *</span>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="실명 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">직책 지정 *</span>
                <select
                  value={newUserPosition}
                  onChange={(e) => setNewUserPosition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="회계">회계</option>
                  <option value="부장">부장</option>
                  <option value="위원장">위원장</option>
                  <option value="총무">총무</option>
                  <option value="교역자">교역자</option>
                  <option value="기타">기타</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">권한 역할</span>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="DEPARTMENT_ACCOUNTANT">부서 회계</option>
                  <option value="DEPARTMENT_HEAD">위원회/부서장</option>
                  <option value="FINANCE_MANAGER">재정부장 (회계팀장)</option>
                  <option value="AUDITOR">감사</option>
                  <option value="SYSTEM_ADMIN">시스템 관리자</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속 찬양팀/그룹</span>
                <select
                  value={newUserGroup}
                  onChange={(e) => setNewUserGroup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  {groups.map(g => (
                    <option key={g.group_id} value={g.group_id}>[{g.organization_name}] {g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
              가입 및 계정 생성
            </button>
          </form>

          {users.some(u => u.is_active === 0) && (
            <div className="space-y-2 mb-4">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Users size={13} /> 가입 승인 대기 사용자 ({users.filter(u => u.is_active === 0).length})
              </h3>
              <div className="space-y-2 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/20">
                {users.filter(u => u.is_active === 0).map((u) => (
                  <div key={u.user_id} className="glass p-3 rounded-xl flex items-center justify-between border border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {u.name} <span className="text-slate-400 text-[10px]">({u.position})</span>
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-1">
                        ID: {u.username} · 소속: [{u.organization_name || (u.custom_department_name ? `요청: ${u.custom_department_name}` : '기타')}] {u.group_name || (u.custom_group_name ? `요청: ${u.custom_group_name}` : '-')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApproveUser(u.user_id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] shadow-sm transition-all active:scale-95"
                    >
                      가입 승인
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Users size={13} className="text-church-400" /> 현재 사용자 목록
            </h3>
            <div className="max-h-[350px] overflow-y-auto no-scrollbar space-y-2">
              {users.filter(u => u.is_active === 1).map((u) => {
                const userAssigns = allAssignments.filter(a => a.user_id === u.user_id);
                const isExpanded = expandedUserId === u.user_id;

                return (
                  <div key={u.user_id} className="glass p-3 rounded-2xl border border-slate-800/40 space-y-3">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        setExpandedUserId(isExpanded ? null : u.user_id);
                        setNewAssignCommitteeId('');
                        setNewAssignGroupId('');
                        setNewAssignPositionId('');
                        setNewAssignGroupOptions([]);
                      }}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {u.name} <span className="text-slate-500 text-[10px] ml-1">({u.username})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {userAssigns.map(a => (
                            <span 
                              key={a.assignment_id} 
                              className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border ${
                                a.is_primary 
                                  ? 'bg-church-500/10 border-church-500/30 text-church-400' 
                                  : 'bg-slate-800/50 border-slate-700/40 text-slate-400'
                              }`}
                            >
                              {a.committee_name}{a.group_name ? ` > ${a.group_name}` : ''} ({a.position_name})
                            </span>
                          ))}
                          {userAssigns.length === 0 && (
                            <span className="text-[8px] text-slate-500">배정된 소속 없음</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-bold text-church-400 bg-church-500/10 px-2 py-0.5 rounded border border-church-500/20">
                          {u.role}
                        </span>
                        {u.user_id !== user.userId && (
                          <button
                            onClick={() => handleDeleteUser(u.user_id, u.name)}
                            className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors active:scale-90"
                            title="사용자 삭제"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-800/60 pt-3 space-y-3">
                        {/* 소속 배정 목록 */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 block">배정된 소속 목록 ({userAssigns.length})</span>
                          <div className="space-y-1">
                            {userAssigns.map(a => (
                              <div key={a.assignment_id} className="bg-slate-900/60 border border-slate-800/50 rounded-xl px-3 py-2 flex items-center justify-between text-[11px]">
                                <div className="text-slate-300">
                                  <span className="font-semibold text-white">{a.committee_name}</span>
                                  {a.group_name && <span className="text-slate-500 mx-1">/</span>}
                                  {a.group_name && <span className="text-slate-400">{a.group_name}</span>}
                                  <span className="mx-1.5 text-slate-500">·</span>
                                  <span className="text-church-400 font-bold">{a.position_name}</span>
                                  {a.is_primary && (
                                    <span className="ml-2 text-[8px] bg-church-500/20 text-church-300 px-1 py-0.2 rounded font-bold">대표</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(u.user_id, a.assignment_id)}
                                  className="text-[9px] text-rose-400 hover:text-rose-300 font-semibold"
                                >
                                  제거
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 신규 소속 추가 폼 */}
                        <form onSubmit={(e) => handleCreateAssignment(e, u.user_id)} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40 space-y-2">
                          <span className="text-[9px] font-bold text-church-400 block">➕ 신규 소속 및 직책 배정</span>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newAssignCommitteeId}
                              onChange={(e) => handleAssignCommitteeChange(e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value="">위원회 선택</option>
                              {organizations.map(o => (
                                <option key={o.department_id} value={o.department_id}>{o.name}</option>
                              ))}
                            </select>

                            <select
                              value={newAssignGroupId}
                              onChange={(e) => setNewAssignGroupId(e.target.value)}
                              className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                              disabled={!newAssignCommitteeId}
                            >
                              <option value="">그룹 선택 (전체)</option>
                              {newAssignGroupOptions.map(g => (
                                <option key={g.group_id} value={g.group_id}>{g.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <select
                              value={newAssignPositionId}
                              onChange={(e) => setNewAssignPositionId(e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value="">직책 선택</option>
                              {groupPositions.filter(p => p.is_active).map(p => (
                                <option key={p.position_id} value={p.position_id}>{p.name}</option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="bg-church-600 hover:bg-church-500 text-white font-bold px-3 py-1 rounded-lg text-[9px] transition-all"
                            >
                              추가
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. 조직 및 그룹 관리 */}
      {activeTab === 'orgs' && isAdminOrAuditor && (
        <div className="space-y-4 text-slate-300">
          
          {/* 부서(위원회) 추가 폼 */}
          <form onSubmit={handleAddAdminOrg} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus size={14} className="text-church-400" /> 신규 위원회/기관 추가
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">위원회/기관명 *</span>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="예: 예배위원회"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">설명</span>
                <input
                  type="text"
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="설명 기재"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
              위원회 등록
            </button>
          </form>

          {/* 소속 그룹 추가 폼 */}
          <form onSubmit={handleAddAdminGroup} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus size={14} className="text-church-400" /> 위원회 산하 소속그룹 추가
            </h3>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-semibold block">대상 위원회 선택 *</span>
              <select
                value={selectedAdminOrgId}
                onChange={(e) => setSelectedAdminOrgId(e.target.value)}
                disabled={!adminOrgs.length}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500 disabled:opacity-50"
              >
                <option value="" disabled>선택하세요</option>
                {adminOrgs.map(o => (
                  <option key={o.department_id} value={o.department_id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1 col-span-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속그룹명 *</span>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="예: 시온찬양대"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
              <div className="space-y-1 col-span-1">
                <span className="text-[9px] text-slate-500 font-semibold">설명</span>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="설명 기재"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
              <div className="space-y-1 col-span-1">
                <span className="text-[9px] text-slate-500 font-semibold">정렬 순서</span>
                <input
                  type="number"
                  value={newGroupSort}
                  onChange={(e) => setNewGroupSort(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
              소속그룹 등록
            </button>
          </form>

          {/* 위원회(부서) 목록 및 편집 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Landmark size={13} className="text-church-400" /> 위원회 및 기관 목록
            </h3>
            
            <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-2">
              {adminOrgs.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">등록된 위원회가 없습니다.</p>
              ) : (
                adminOrgs.map((o) => (
                  <div key={o.department_id} className="glass p-3.5 rounded-2xl border border-slate-800/60">
                    {editingOrgId === o.department_id ? (
                      <form onSubmit={handleUpdateAdminOrg} className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editingOrgName}
                            onChange={(e) => setEditingOrgName(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                            placeholder="위원회명"
                          />
                          <input
                            type="text"
                            value={editingOrgDesc}
                            onChange={(e) => setEditingOrgDesc(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                            placeholder="설명"
                          />
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <span className="text-slate-500">활성화 여부:</span>
                            <button
                              type="button"
                              onClick={() => setEditingOrgActive(!editingOrgActive)}
                              className="text-church-400 focus:outline-none"
                            >
                              {editingOrgActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} className="text-slate-600" />}
                            </button>
                          </label>
                          <div className="flex items-center gap-2">
                            <button type="submit" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5">
                              <Save size={12} /> 저장
                            </button>
                            <button type="button" onClick={() => setEditingOrgId(null)} className="text-slate-500 hover:text-white flex items-center gap-0.5">
                              <X size={12} /> 취소
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{o.name}</span>
                            {!o.is_active && (
                              <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] px-1 py-0.2 rounded">비활성</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{o.description || '설명 없음'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingOrgId(o.department_id);
                              setEditingOrgName(o.name);
                              setEditingOrgDesc(o.description || '');
                              setEditingOrgActive(!!o.is_active);
                            }}
                            className="text-slate-500 hover:text-white p-1"
                            title="부서 수정"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdminOrg(o.department_id)}
                            className="text-rose-500 hover:text-rose-400 p-1"
                            title="부서 비활성화"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 소속 그룹 목록 및 편집 */}
          <div className="space-y-3 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <FolderTree size={13} className="text-church-400" /> 위원회 산하 소속 그룹 관리
              </h3>
              <select
                value={selectedAdminOrgId}
                onChange={(e) => setSelectedAdminOrgId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-white focus:outline-none"
              >
                <option value="" disabled>위원회 선택</option>
                {adminOrgs.map(o => (
                  <option key={o.department_id} value={o.department_id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-2">
              {!selectedAdminOrgId ? (
                <p className="text-[10px] text-slate-500 text-center py-4">조회할 위원회를 먼저 선택해 주세요.</p>
              ) : adminGroups.length === 0 ? (
                <p className="text-[10px] text-slate-500 text-center py-4">이 위원회 아래 등록된 소속 그룹이 없습니다.</p>
              ) : (
                adminGroups.map((g) => (
                  <div key={g.group_id} className="glass p-3.5 rounded-2xl border border-slate-800/60">
                    {editingGroupId === g.group_id ? (
                      <form onSubmit={handleUpdateAdminGroup} className="space-y-2.5">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                            placeholder="그룹명"
                          />
                          <input
                            type="text"
                            value={editingGroupDesc}
                            onChange={(e) => setEditingGroupDesc(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                            placeholder="설명"
                          />
                          <input
                            type="number"
                            value={editingGroupSort}
                            onChange={(e) => setEditingGroupSort(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                            placeholder="정렬순서"
                          />
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <span className="text-slate-500">활성화 여부:</span>
                            <button
                              type="button"
                              onClick={() => setEditingGroupActive(!editingGroupActive)}
                              className="text-church-400 focus:outline-none"
                            >
                              {editingGroupActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} className="text-slate-600" />}
                            </button>
                          </label>
                          <div className="flex items-center gap-2">
                            <button type="submit" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5">
                              <Save size={12} /> 저장
                            </button>
                            <button type="button" onClick={() => setEditingGroupId(null)} className="text-slate-500 hover:text-white flex items-center gap-0.5">
                              <X size={12} /> 취소
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{g.name}</span>
                            <span className="text-[8px] bg-slate-800 text-slate-400 border border-slate-700 px-1 rounded">정렬: {g.sort_order}</span>
                            {!g.is_active && (
                              <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] px-1 py-0.2 rounded">비활성</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">{g.description || '설명 없음'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingGroupId(g.group_id);
                              setEditingGroupName(g.name);
                              setEditingGroupDesc(g.description || '');
                              setEditingGroupSort(g.sort_order || 0);
                              setEditingGroupActive(!!g.is_active);
                            }}
                            className="text-slate-500 hover:text-white p-1"
                            title="그룹 수정"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdminGroup(g.group_id)}
                            className="text-rose-500 hover:text-rose-400 p-1"
                            title="그룹 비활성화"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3-2. 직책 설정 및 관리 */}
      {activeTab === 'positions' && isAdminOrAuditor && (
        <div className="space-y-4">
          <form onSubmit={handleAddPosition} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <Plus size={14} className="text-church-400" /> 신규 직책 추가
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">직책명 *</span>
                <input
                  type="text"
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  placeholder="예: 지휘자, 회계"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">권한 역할 매핑</span>
                <select
                  value={newPosRole}
                  onChange={(e) => setNewPosRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="DEPARTMENT_ACCOUNTANT">부서 회계 (DEPARTMENT_ACCOUNTANT)</option>
                  <option value="FINANCE_MANAGER">총무 권한 (FINANCE_MANAGER)</option>
                  <option value="GROUP_LEADER">부장 권한 (GROUP_LEADER)</option>
                  <option value="COMMITTEE_CHAIR">위원장 권한 (COMMITTEE_CHAIR)</option>
                  <option value="PASTOR">교역자 권한 (PASTOR)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
              직책 추가
            </button>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <ShieldCheck size={13} className="text-church-400" /> 등록된 직책 목록
            </h3>
            <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-2">
              {groupPositions.length === 0 ? (
                <p className="text-[9px] text-slate-500 text-center py-6">등록된 직책이 없습니다.</p>
              ) : (
                groupPositions.map((pos) => (
                  <div key={pos.position_id} className="glass p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-800/40">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white">{pos.name}</h4>
                        {!pos.is_active && (
                          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[8px] font-bold">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 mt-1">권한: {pos.role_code || pos.role}</p>
                    </div>
                    {pos.is_active && (
                      <button
                        onClick={() => handleDeletePosition(pos.position_id)}
                        className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors active:scale-90"
                        title="직책 비활성화"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AI 영수증 분석 대기열 관리 (OCR Queue Manager) */}
      {activeTab === 'ocr-queue' && isAdminOrAuditor && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <RefreshCw size={13} className="text-church-400 animate-spin-slow" /> AI 백그라운드 분석 큐 (Queue)
            </h3>
            <button
              onClick={fetchOcrQueue}
              className="text-[9px] font-bold text-church-400 bg-church-500/10 border border-church-500/20 rounded px-2.5 py-1 hover:bg-church-500/20 active:scale-95 transition-all flex items-center gap-1"
            >
              <RefreshCw size={9} /> 새로고침
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto no-scrollbar space-y-2">
            {ocrQueueLoading ? (
              <div className="text-center py-10 text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-church-400" size={20} />
                <span>AI 영수증 분석 현황 로딩 중...</span>
              </div>
            ) : ocrQueue.length === 0 ? (
              <div className="glass p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-800 text-center">
                대기열에 등록된 영수증이 존재하지 않습니다.
              </div>
            ) : (
              ocrQueue.map((item) => (
                <div 
                  key={item.attachment_id} 
                  className="glass p-3 rounded-2xl flex gap-3 items-center border border-slate-800"
                >
                  {/* 썸네일 */}
                  <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                    <img src={item.url} className="w-full h-full object-cover" alt="썸네일" />
                  </div>

                  {/* 세부정보 */}
                  <div className="flex-grow min-w-0 text-[10px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white truncate block max-w-[150px]">
                        {item.voucher_summary || '임시 전표'}
                      </span>
                      {/* 상태 배지 */}
                      {item.ocr_status === 'PENDING' && (
                        <span className="bg-slate-800 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-0.5">
                          <Clock size={8} /> 대기
                        </span>
                      )}
                      {item.ocr_status === 'PROCESSING' && (
                        <span className="bg-blue-500/10 text-blue-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-0.5 animate-pulse">
                          <Loader2 size={8} className="animate-spin" /> 분석 중
                        </span>
                      )}
                      {item.ocr_status === 'COMPLETED' && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5">
                          <CheckCircle2 size={8} /> 완료
                        </span>
                      )}
                      {item.ocr_status === 'FAILED' && (
                        <span className="bg-rose-500/10 text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20 flex items-center gap-0.5" title={item.ocr_error}>
                          <AlertTriangle size={8} /> 실패
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[9px]">기안자: {item.writer_name} · 일자: {new Date(item.created_at).toLocaleDateString()}</p>
                    {item.ocr_error && (
                      <p className="text-rose-400/90 text-[8px] truncate leading-tight mt-0.5">에러: {item.ocr_error}</p>
                    )}
                    {item.tags && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {item.tags.split(',').map((tag, tIdx) => (
                          <span key={tIdx} className="bg-slate-900 text-slate-400 text-[8px] px-1 rounded">#{tag.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 재분석 제어 단추 */}
                  <button
                    onClick={() => handleReprocessOcr(item.attachment_id)}
                    disabled={item.ocr_status === 'PROCESSING'}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors shrink-0 disabled:opacity-40"
                    title="AI 다시 분석 실행"
                  >
                    <Play size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. 결산 마감 관리 */}
      {activeTab === 'locks' && isAdminOrAuditor && (
        <div className="space-y-4">
          <form onSubmit={handleLockPeriod} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <Landmark size={14} className="text-church-400" /> 신규 결산 마감(Lock) 설정
            </h3>
            
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-semibold block">마감 구분 선택 *</span>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="MONTH">월별 결산 마감</option>
                <option value="HALF">반기별 결산 마감</option>
                <option value="YEAR">연도별 결산 마감</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold block">기준 연도 *</span>
                <input
                  type="number"
                  value={lockYear}
                  onChange={(e) => setLockYear(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              {periodType === 'MONTH' && (
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-semibold block">기준 월 *</span>
                  <select
                    value={lockMonth}
                    onChange={(e) => setLockMonth(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                </div>
              )}

              {periodType === 'HALF' && (
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-semibold block">반기 구분 *</span>
                  <select
                    value={lockHalf}
                    onChange={(e) => setLockHalf(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="1">상반기 (1~6월)</option>
                    <option value="2">하반기 (7~12월)</option>
                  </select>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95 shadow">
              선택 기간 마감(🔒 Lock) 실행
            </button>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
              🔒 현재 결산 마감된 기간 목록
            </h3>
            <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-2">
              {locks.length === 0 ? (
                <p className="text-[9px] text-slate-500 text-center py-6">마감 완료된 결산 기간이 없습니다.</p>
              ) : (
                locks.map((l) => (
                  <div key={l.lock_id} className="glass p-3 rounded-2xl flex items-center justify-between text-xs border border-rose-500/10">
                    <div>
                      <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                        <span>🔒 {l.period_value}</span>
                        <span className="text-[8px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 text-rose-300">
                          {l.period_type === 'MONTH' && '월간'}
                          {l.period_type === 'HALF' && '반기'}
                          {l.period_type === 'YEAR' && '년간'} 마감
                        </span>
                      </h4>
                      <p className="text-[9px] text-slate-500 mt-1">마감 일시: {new Date(l.locked_at).toLocaleString('ko-KR')}</p>
                    </div>
                    {user.role === 'SYSTEM_ADMIN' ? (
                      <button
                        onClick={() => handleUnlockPeriod(l.period_type, l.period_value)}
                        className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 font-bold px-2.5 py-1.5 rounded-lg text-[9px] transition-all"
                      >
                        마감 해제
                      </button>
                    ) : (
                      <span className="text-[8px] text-slate-500 font-semibold bg-slate-900 border border-slate-800 px-2 py-1 rounded">해제 권한 없음</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. 데이터 관리 */}
      {activeTab === 'database' && isAdminOrAuditor && (
        <div className="space-y-4">
          <div className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              💾 전체 데이터 백업
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              교회의 모든 회계 거래 이력(데이터베이스)과 업로드된 증빙 영수증 이미지 폴더 전체를 하나의 ZIP 파일로 패킹하여 로컬 드라이브에 안전하게 다운로드합니다.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
            >
              전체 데이터 백업 다운로드 (.ZIP)
            </button>
          </div>

          <form onSubmit={handleRestoreBackup} className="glass p-4 rounded-2xl space-y-3.5 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              📤 백업 파일 복원 (Restore)
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              ⚠️ 주의: 데이터 복원 시 현재 시스템 내의 모든 정보가 복원 파일 내용으로 영구히 대체(Overwrite)되며 이전 상태로 되돌릴 수 없습니다.
            </p>

            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 font-semibold block">백업 ZIP 파일 선택 *</label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setBackupFile(e.target.files[0])}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              선택한 파일로 데이터 복원 실행
            </button>
          </form>
        </div>
      )}

      {/* 7. Passkey / 생체인증 로그인 설정 */}
      {activeTab === 'passkey' && (
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Fingerprint size={14} className="text-indigo-400" />
              <span>Passkey / 생체인증 로그인 설정</span>
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              아이디와 비밀번호 대신 지문, Face ID, Windows Hello 등을 이용해 안전하게 로그인할 수 있습니다. 
              기기를 등록한 뒤 바로 로그인 화면에서 사용해 보세요.
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400">기기 이름 (예: 내 노트북, 스마트폰)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="기기 별칭 입력"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={passkeyLoading || !window.PublicKeyCredential}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  {passkeyLoading ? '등록 중...' : '기기 등록'}
                </button>
              </div>
              {!window.PublicKeyCredential && (
                <p className="text-[10px] text-rose-400">
                  ⚠️ 이 브라우저는 생체인증(Passkey)을 지원하지 않습니다.
                </p>
              )}
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">등록된 기기 목록</h4>
            {passkeys.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-[10px]">
                등록된 생체인증 기기가 없습니다.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="p-3 text-[10px]">기기 이름</th>
                      <th className="p-3 text-[10px]">등록일</th>
                      <th className="p-3 text-[10px]">마지막 사용</th>
                      <th className="p-3 text-[10px] text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passkeys.map(pk => (
                      <tr key={pk.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300">
                        <td className="p-3 font-medium text-[10px]">{pk.device_name}</td>
                        <td className="p-3 text-[9px] text-slate-500">{new Date(pk.created_at).toLocaleDateString()}</td>
                        <td className="p-3 text-[9px] text-slate-500">
                          {pk.last_used_at ? new Date(pk.last_used_at).toLocaleDateString() : '사용 이력 없음'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeletePasskey(pk.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold text-[10px]"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 사용자 프로필 및 로그아웃 카드 (모바일 접근성 강화) */}
      <div className="glass p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-lg mt-6">
        <div className="flex items-center gap-1.5 text-slate-300">
          <User size={14} className="text-church-400" />
          <h3 className="text-xs font-bold">내 계정 정보</h3>
        </div>
        <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-900/80">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white leading-none">
              {isAdminUser(user) ? '관리자' : user?.name} <span className="text-[9px] text-slate-400 font-medium">({isAdminUser(user) ? '마스터' : (user?.position || '기타')})</span>
            </p>
            <p className="text-[9px] text-church-400 font-bold mt-1.5 leading-none">
              {isAdminUser(user) ? (user?.groupName || '전체 조직') : (user?.groupName || '소속 부서 없음')}
            </p>
            <p className="text-[7.5px] text-slate-500 font-semibold tracking-wider pt-1.5">
              권한 등급: {isAdminUser(user) ? '전체 관리자' : (user?.role || '일반 사용자')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                logout();
                window.location.href = '/login';
              }
            }}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-[10px] font-extrabold transition-all active:scale-[0.97]"
          >
            로그아웃
          </button>
        </div>
      {/* 초대 모달 다이얼로그 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="glass max-w-md w-full p-5 rounded-3xl border border-slate-800 shadow-2xl max-h-[92vh] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-church-500/10 rounded-full filter blur-xl pointer-events-none" />

            {/* 헤더 */}
            <div className="flex justify-between items-center shrink-0 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white">신규 멤버 초대장 작성</h3>
                <p className="text-[8.5px] text-slate-500 mt-0.5">초대를 받을 분의 정보와 임명 내용을 입력해주세요</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-500 hover:text-white transition-colors shrink-0 ml-3"
              >
                <X size={16} />
              </button>
            </div>

            {/* 콘텐츠 영역 */}
            {inviteLinkResult ? (
              /* 생성 완료 화면 */
              <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar text-left">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-[10.5px] leading-relaxed font-semibold">
                  ✓ 초대장 생성 완료! 아래 링크를 복사하여 임명 대상자에게 전달해주세요.
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">초대 링크 (대상자에게 전달)</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={inviteLinkResult.url}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-slate-300 font-mono focus:outline-none"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLinkResult.url);
                        alert('초대 링크가 클립보드에 복사되었습니다.');
                      }}
                      className="shrink-0 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 font-bold px-3 rounded-xl text-[9px] transition-all"
                    >
                      복사
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 font-bold block">안내 메세지 템플릿</span>
                  <textarea
                    readOnly
                    rows={5}
                    value={inviteLinkResult.message}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-slate-400 font-sans focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLinkResult.message);
                      alert('안내 메시지가 클립보드에 복사되었습니다.');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-[9px] transition-all"
                  >
                    메시지 복사
                  </button>
                  <a
                    href={`sms:?body=${encodeURIComponent(inviteLinkResult.message)}`}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-2 rounded-xl text-[9px] transition-all text-center flex items-center justify-center"
                  >
                    SMS 공유
                  </a>
                  <a
                    href={`https://sharer.kakao.com/talk/friends/picker/link?link=${encodeURIComponent(inviteLinkResult.url)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-[9px] transition-all text-center flex items-center justify-center"
                  >
                    카카오 공유
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all mt-1"
                >
                  닫기
                </button>
              </div>
            ) : profileCommittees.length === 0 ? (
              /* 위원회 없을 때 안내 */
              <div className="py-8 text-center space-y-4 flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                  <AlertTriangle size={28} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white mb-1">위원회 또는 부서 설정이 필요합니다</p>
                  <p className="text-[9.5px] text-slate-400 leading-relaxed">
                    초대장을 발송하려면 먼저 소속될<br />
                    <span className="text-amber-400 font-bold">위원회(부서)</span>를 하나 이상 등록해야 합니다.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => { setShowInviteModal(false); setActiveTab('orgs'); }}
                    className="bg-church-600 hover:bg-church-500 text-white font-bold py-2.5 rounded-xl text-[10px] transition-all"
                  >
                    부서/위원회 설정으로
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-[10px] transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              /* 초대장 작성 폼 */
              <form onSubmit={handleCreateInvitation} className="space-y-3.5 overflow-y-auto flex-1 pr-1 no-scrollbar text-left">

                {/* 발송 대상자 */}
                <p className="text-[8px] font-black text-church-400 uppercase tracking-widest">발송 대상자 정보</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">받는 사람 이름 <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">받는 사람 이메일 <span className="text-rose-400">*</span></label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="예: hong@gmail.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500 font-mono"
                  />
                  <p className="text-[8.5px] text-slate-500">이 이메일로 초대 링크가 발송됩니다 (계정 가입 시에도 사용)</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">받는 사람 휴대폰 번호</label>
                  <input
                    type="text"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="예: 010-1234-5678 (선택)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                </div>

                {/* 임명 내용 */}
                <p className="text-[8px] font-black text-church-400 uppercase tracking-widest pt-1 border-t border-slate-800/60">임명 내용</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">소속 위원회 <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={inviteCommId}
                    onChange={(e) => { setInviteCommId(e.target.value); setInviteGroupId(''); }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value="">— 위원회를 선택하세요 —</option>
                    {profileCommittees.map(c => (
                      <option key={c.department_id} value={c.department_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">
                    소속 부서/그룹
                    <span className="text-[8.5px] text-slate-500 font-normal ml-1">(위원회 선택 후 선택 가능)</span>
                  </label>
                  <select
                    value={inviteGroupId}
                    onChange={(e) => setInviteGroupId(e.target.value)}
                    disabled={!inviteCommId || inviteGroupOptions.length === 0}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500 disabled:opacity-50"
                  >
                    <option value="">
                      {!inviteCommId ? '위원회 먼저 선택' : inviteGroupOptions.length === 0 ? '하위 부서 없음 (위원회 직속)' : '— 부서 선택 안 함 (위원회 직속) —'}
                    </option>
                    {inviteGroupOptions.map(g => (
                      <option key={g.group_id} value={g.group_id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">임명 직첸 <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={invitePosId}
                    onChange={(e) => setInvitePosId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value="">— 직첸을 선택하세요 —</option>
                    {profilePositions.map(p => (
                      <option key={p.position_id} value={p.position_id}>{p.name}</option>
                    ))}
                  </select>
                  {profilePositions.length === 0 && (
                    <p className="text-[8.5px] text-amber-400">
                      ⚠ 등록된 직첸이 없습니다.{' '}
                      <button type="button" onClick={() => { setShowInviteModal(false); setActiveTab('positions'); }} className="underline">직첸 설정으로 이동</button>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">부여할 시스템 권한 <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value="member">일반 회원 — 기본 열람 권한</option>
                    <option value="teacher">교사 — 부서 활동 참여</option>
                    <option value="department_head">부서 부장 — 부서 관리 권한</option>
                    <option value="committee_head">위원장 — 위원회 전체 관리</option>
                    <option value="auditor">감사위원 — 재정 열람 전용</option>
                    <option value="finance_admin">재정 부장/총무 — 재정 입력·결산</option>
                    <option value="elder">장로/안수집사 — 의결 참여 권한</option>
                    <option value="pastor">교역자 — 전체 열람 및 보고</option>
                  </select>
                  <p className="text-[8.5px] text-slate-500">※ 플랫폼 관리자 권한은 초대로 부여할 수 없습니다</p>
                </div>

                {/* 발송 옵션 */}
                <p className="text-[8px] font-black text-church-400 uppercase tracking-widest pt-1 border-t border-slate-800/60">발송 옵션</p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">초대 메시지 (선택)</label>
                  <textarea
                    rows={2}
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="대상자에게 전달할 개인 메시지를 입력하세요 (생략 가능)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-church-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">초대 링크 유효 기간 <span className="text-rose-400">*</span></label>
                  <select
                    required
                    value={inviteExpiresDays}
                    onChange={(e) => setInviteExpiresDays(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-church-500"
                  >
                    <option value={1}>1일 (긴급 발송)</option>
                    <option value={3}>3일 이내 수낙</option>
                    <option value={7}>7일 이내 수낙 (기본 권장)</option>
                    <option value={30}>30일 이내 수낙 (장기)</option>
                  </select>
                </div>

                {/* 확인/취소 버튼 */}
                <div className="grid grid-cols-2 gap-2 pt-2 shrink-0 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-church-600 to-church-500 hover:brightness-110 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-[0.98]"
                  >
                    초대장 생성 및 링크 발급
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
