import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Settings as SettingsIcon, Plus, Users, User, FolderTree, Landmark, ShieldCheck,
  Loader2, CheckCircle2, AlertTriangle, Clock, RefreshCw, Play, Tag, FileText, Trash2
} from 'lucide-react';

export default function Settings() {
  const { token, user, fontScale, setFontScale, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState('categories');

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
      const response = await fetch('/api/vouchers/ocr-queue/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setOcrQueue(data);
    } catch (err) {
      console.error('Fetch OCR queue error:', err);
    } finally {
      setOcrQueueLoading(false);
    }
  };

  const handleReprocessOcr = async (attachmentId) => {
    try {
      const response = await fetch(`/api/vouchers/ocr-queue/${attachmentId}/reprocess`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      alert(data.message);
      fetchOcrQueue();
    } catch (err) {
      alert(`❌ 재분석 요청 실패: ${err.message}`);
    }
  };

  const fetchLocks = async () => {
    try {
      const response = await fetch('/api/period-locks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setLocks(data);
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
      const response = await fetch('/api/period-locks/lock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ periodType, periodValue: val })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert(data.message);
      fetchLocks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnlockPeriod = async (type, val) => {
    if (!window.confirm(`정말 ${val} 기간의 마감을 해제하시겠습니까?`)) return;

    try {
      const response = await fetch('/api/period-locks/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ periodType: type, periodValue: val })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(data.message);
      fetchLocks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const response = await fetch('/api/system/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '백업 생성 실패');
      }
      const blob = await response.blob();
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
      const response = await fetch('/api/system/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(data.message);
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOrganizations(data);
        if (data.length > 0 && !selectedOrgId) {
          setSelectedOrgId(data[0].organization_id);
        }
      } else {
        console.error('Failed to fetch organizations:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setGroups(data);
        if (data.length > 0 && !newUserGroup) {
          setNewUserGroup(data[0].group_id);
        }
      } else {
        console.error('Failed to fetch groups:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Failed to fetch users:', data.message || 'Unknown error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatParent || !newCatChild) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: newCatType,
          parent_category: newCatParent,
          child_category: newCatChild,
          description: newCatDesc
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

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
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newOrgName,
          description: newOrgDesc
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

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
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_id: parseInt(selectedOrgId, 10),
          name: newGroupName,
          description: newGroupDesc
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
      alert('소속 그룹(찬양팀) 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserUsername || !newUserPassword || !newUserName) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: newUserUsername,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole,
          position: newUserPosition,
          group_id: parseInt(newUserGroup, 10)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

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
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('사용자 가입 승인이 완료되었습니다.');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`⚠️ 경고: 정말 사용자 '${name}' 계정을 영구 삭제하시겠습니까? 관련 데이터가 깨질 수 있습니다.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert(data.message);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteOrg = async (orgId, name) => {
    if (!window.confirm(`⚠️ 경고: 정말 위원회 '${name}'(을)를 삭제하시겠습니까? 산하의 모든 소속 그룹도 함께 삭제됩니다.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

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
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      alert(data.message);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchGroupPositions = async (groupId) => {
    if (!groupId) return;
    try {
      const response = await fetch(`/api/public/groups/${groupId}/positions`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
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
    if (!selectedPosGroupId || !newPosName) return;
    try {
      const response = await fetch(`/api/groups/${selectedPosGroupId}/positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPosName, role: newPosRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setNewPosName('');
      fetchGroupPositions(selectedPosGroupId);
      alert('직책 등록 성공');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePosition = async (posId) => {
    if (!window.confirm('정말 이 직책을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/positions/${posId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      fetchGroupPositions(selectedPosGroupId);
      alert('직책이 삭제되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (groups.length > 0 && !selectedPosGroupId) {
      setSelectedPosGroupId(groups[0].group_id.toString());
    }
  }, [groups]);

  useEffect(() => {
    if (selectedPosGroupId) {
      fetchGroupPositions(selectedPosGroupId);
    }
  }, [selectedPosGroupId]);

  const isAdminOrAuditor = user.role === 'SYSTEM_ADMIN' || user.role === 'AUDITOR';

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-16">
      <div className="flex items-center gap-2">
        <SettingsIcon size={16} className="text-church-400" />
        <h2 className="text-sm font-bold text-slate-300">회계 마스터 설정 및 관리</h2>
      </div>

      {/* 가로 스크롤 대응 반응형 탭 컨테이너 */}
      <div className="flex gap-1 overflow-x-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800/80 no-scrollbar select-none">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 ${
            activeTab === 'categories' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          계정과목
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 ${
            activeTab === 'display' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          화면설정
        </button>
        <button
          onClick={() => setActiveTab('users')}
          disabled={!isAdminOrAuditor}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-30 ${
            activeTab === 'users' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          사용자
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          disabled={!isAdminOrAuditor}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-30 ${
            activeTab === 'orgs' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          조직
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          disabled={!isAdminOrAuditor}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-30 ${
            activeTab === 'positions' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          직책설정
        </button>
        <button
          onClick={() => setActiveTab('ocr-queue')}
          disabled={!isAdminOrAuditor}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-30 ${
            activeTab === 'ocr-queue' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          AI 분석 현황
        </button>
        <button
          onClick={() => setActiveTab('locks')}
          disabled={!isAdminOrAuditor}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-30 ${
            activeTab === 'locks' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          결산마감
        </button>
        <button
          onClick={() => setActiveTab('database')}
          disabled={!isAdminOrAuditor}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all shrink-0 disabled:opacity-30 ${
            activeTab === 'database' ? 'bg-church-600/30 text-church-400 border border-church-500/30' : 'text-slate-500'
          }`}
        >
          데이터
        </button>
      </div>

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
                        ID: {u.username} · 소속: [{u.organization_name}] {u.group_name || '-'}
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
            <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-2">
              {users.filter(u => u.is_active === 1).map((u) => (
                <div key={u.user_id} className="glass p-3 rounded-2xl flex items-center justify-between border border-slate-800/40">
                  <div>
                    <h4 className="text-xs font-bold text-white">{u.name} <span className="text-slate-400 text-[10px]">({u.position})</span></h4>
                    <p className="text-[9px] text-slate-500 mt-1">소속: [{u.organization_name}] {u.group_name || '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
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
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. 조직 및 그룹 관리 */}
      {activeTab === 'orgs' && isAdminOrAuditor && (
        <div className="space-y-4">
          <form onSubmit={handleAddOrg} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <Plus size={14} className="text-church-400" /> 신규 위원회/기관 추가
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">위원회명 *</span>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="예: 찬양위원회"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">설명</span>
                <input
                  type="text"
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="설명 기재"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
              위원회 등록
            </button>
          </form>

          <form onSubmit={handleAddGroup} className="glass p-4 rounded-2xl space-y-3 shadow-md border border-slate-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-1">
              <Plus size={14} className="text-church-400" /> 위원회 산하 소속그룹 추가
            </h3>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-semibold block">소속 위원회 선택 *</span>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {organizations.map(o => (
                  <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">소속그룹명 *</span>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="예: 예뜰찬양팀"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-semibold">그룹 설명</span>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="설명 기재"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-church-600 hover:bg-church-500 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
              소속그룹 등록
            </button>
          </form>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Landmark size={13} className="text-church-400" /> 위원회 및 그룹 목록
            </h3>

            {/* 위원회 목록 */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-semibold block">현재 위원회 목록</span>
              <div className="max-h-[180px] overflow-y-auto no-scrollbar space-y-2">
                {organizations.length === 0 ? (
                  <p className="text-[9px] text-slate-500 text-center py-3">등록된 위원회가 없습니다.</p>
                ) : (
                  organizations.map((o) => (
                    <div key={o.organization_id} className="glass p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-800/40">
                      <div>
                        <h4 className="font-bold text-white">{o.name}</h4>
                        <p className="text-[9px] text-slate-500 mt-1">{o.description || '설명 없음'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteOrg(o.organization_id, o.name)}
                        className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors active:scale-90"
                        title="위원회 삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 그룹 목록 */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-500 font-semibold block">현재 소속 그룹 목록</span>
              <div className="max-h-[180px] overflow-y-auto no-scrollbar space-y-2">
                {groups.length === 0 ? (
                  <p className="text-[9px] text-slate-500 text-center py-3">등록된 소속 그룹이 없습니다.</p>
                ) : (
                  groups.map((g) => (
                    <div key={g.group_id} className="glass p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-800/40">
                      <div>
                        <h4 className="font-bold text-white">{g.name}</h4>
                        <p className="text-[9px] text-slate-500 mt-1">소속 위원회: {g.organization_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-500 italic mr-2">{g.description || '-'}</span>
                        <button
                          onClick={() => handleDeleteGroup(g.group_id, g.name)}
                          className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors active:scale-90"
                          title="소속 그룹 삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 font-semibold block">소속 그룹 선택 *</span>
              <select
                value={selectedPosGroupId}
                onChange={(e) => setSelectedPosGroupId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {groups.map(g => (
                  <option key={g.group_id} value={g.group_id}>[{g.organization_name}] {g.name}</option>
                ))}
              </select>
            </div>
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
                  <option value="DEPARTMENT_HEAD">부서장 (DEPARTMENT_HEAD)</option>
                  <option value="FINANCE_MANAGER">재정부장 (FINANCE_MANAGER)</option>
                  <option value="AUDITOR">감사 (AUDITOR)</option>
                  <option value="GENERAL_USER">일반 사용자 (GENERAL_USER)</option>
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
                <p className="text-[9px] text-slate-500 text-center py-6">선택한 그룹에 등록된 직책이 없습니다.</p>
              ) : (
                groupPositions.map((pos) => (
                  <div key={pos.position_id} className="glass p-3 rounded-2xl flex items-center justify-between text-xs border border-slate-800/40">
                    <div>
                      <h4 className="font-bold text-white">{pos.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-1">권한: {pos.role}</p>
                    </div>
                    <button
                      onClick={() => handleDeletePosition(pos.position_id)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors active:scale-90"
                      title="직책 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
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

      {/* 사용자 프로필 및 로그아웃 카드 (모바일 접근성 강화) */}
      <div className="glass p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-lg mt-6">
        <div className="flex items-center gap-1.5 text-slate-300">
          <User size={14} className="text-church-400" />
          <h3 className="text-xs font-bold">내 계정 정보</h3>
        </div>
        <div className="flex justify-between items-center bg-slate-950/50 p-3.5 rounded-xl border border-slate-900/80">
          <div className="space-y-1">
            <p className="text-xs font-bold text-white leading-none">
              {user?.name} <span className="text-[9px] text-slate-400 font-medium">({user?.position})</span>
            </p>
            <p className="text-[9px] text-church-400 font-bold mt-1.5 leading-none">{user?.groupName || '소속 부서 없음'}</p>
            <p className="text-[7.5px] text-slate-500 font-semibold tracking-wider pt-1.5">권한 등급: {user?.role}</p>
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
      </div>
    </div>
  );
}
