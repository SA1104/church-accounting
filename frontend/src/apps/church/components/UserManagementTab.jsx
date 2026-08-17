import React, { useState, useEffect } from 'react';
import { Search, Plus, Users, Shield, UserX, Key, RefreshCw, X, ChevronRight, AlertTriangle } from 'lucide-react';
import apiClient from '../../../../utils/apiClient';

function UserManagementTab({ isAdminOrAuditor }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/platform/users');
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('[UserManagementTab] API Error:', err);
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.display_name && u.display_name.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term))
    );
  });

  const openUserDrawer = (userId) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="아이디, 이름, 폰 번호 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-church-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
        </div>
        <button onClick={fetchUsers} className="p-2 glass rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white" title="새로고침">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
          <Users size={13} className="text-church-400" /> 플랫폼 사용자 관리 {users.length > 0 && `(${filteredUsers.length})`}
        </h3>
        
        {loading ? (
          <div className="text-[10px] text-slate-500 py-10 text-center glass rounded-2xl border border-slate-800/40 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-church-400" />
            사용자 목록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="text-xs text-rose-400 py-8 text-center glass rounded-2xl border border-rose-900/40 flex flex-col items-center gap-2">
            <AlertTriangle size={24} className="text-rose-500 mb-1" />
            <span>데이터 조회 실패</span>
            <span className="text-[10px] text-rose-500/70">{error}</span>
            <button onClick={fetchUsers} className="mt-2 text-[10px] bg-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/30 transition-colors">다시 시도</button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-[11px] text-slate-400 glass rounded-2xl border border-slate-800/40 flex flex-col items-center gap-2">
            <UserX size={24} className="text-slate-600 mb-1" />
            등록된 사용자가 없습니다.
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto no-scrollbar space-y-2">
            {filteredUsers.map((u) => (
              <div 
                key={u.user_id} 
                onClick={() => openUserDrawer(u.user_id)}
                className="glass p-3 rounded-2xl border border-slate-800/40 flex items-center justify-between cursor-pointer hover:border-church-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">
                      {u.display_name || u.name} <span className="text-slate-500 text-[10px] ml-1 font-mono">({u.username})</span>
                    </h4>
                    {u.user_status === 'BLOCKED' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">차단됨</span>
                    )}
                    {u.user_status === 'WITHDRAWN' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">탈퇴함</span>
                    )}
                    {(!u.user_status || u.user_status === 'ACTIVE') && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">활성</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{u.phone || '전화번호 미등록'}</p>
                </div>
                <ChevronRight size={16} className="text-slate-500" />
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-6 text-[11px] text-slate-500 glass rounded-2xl border border-slate-800/40">
                검색 조건에 맞는 사용자가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      {isDrawerOpen && (
        <UserDetailDrawer 
          userId={selectedUserId} 
          onClose={() => setIsDrawerOpen(false)} 
          onUpdated={fetchUsers} 
          isAdminOrAuditor={isAdminOrAuditor}
        />
      )}
    </div>
  );
}

function UserDetailDrawer({ userId, onClose, onUpdated, isAdminOrAuditor }) {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const uData = await apiClient(`/api/platform/users/${userId}`);
      if (uData.user) setUser(uData.user);

      const aData = await apiClient(`/api/church/users/${userId}/assignments`);
      if (Array.isArray(aData)) setAssignments(aData);
    } catch (err) {
      console.error(err);
      alert('사용자 정보 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchDetail();
  }, [userId]);

  const handleBlock = async () => {
    if (!window.confirm('이 사용자를 차단하시겠습니까? 플랫폼 전체 접속이 제한됩니다.')) return;
    try {
      await apiClient(`/api/platform/users/${userId}/block`, { method: 'PATCH' });
      alert('차단되었습니다.');
      fetchDetail();
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnblock = async () => {
    try {
      await apiClient(`/api/platform/users/${userId}/unblock`, { method: 'PATCH' });
      alert('차단이 해제되었습니다.');
      fetchDetail();
      onUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('이 사용자의 비밀번호 초기화 메일을 발송하시겠습니까? (Mock)')) return;
    try {
      await apiClient(`/api/platform/users/${userId}/reset-password`, { method: 'PATCH' });
      alert('비밀번호 초기화가 완료되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm h-full bg-[#0B1121] border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            사용자 상세 <span className="text-[10px] text-slate-500 font-normal border border-slate-800 px-1.5 rounded">{user.username}</span>
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
          {loading ? (
            <div className="text-[11px] text-center text-slate-500 py-10">정보를 불러오는 중...</div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-400">기본 정보</h3>
                  <div className="text-[9px]">
                    {user.user_status === 'BLOCKED' ? (
                      <span className="text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">차단된 사용자</span>
                    ) : user.user_status === 'WITHDRAWN' ? (
                      <span className="text-slate-400 font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">탈퇴된 사용자</span>
                    ) : (
                      <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">정상 (활성)</span>
                    )}
                  </div>
                </div>
                <div className="glass p-3 rounded-2xl border border-slate-800/50 space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500">이름</span>
                    <span className="text-white font-medium">{user.display_name || user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-2">
                    <span className="text-slate-500">연락처</span>
                    <span className="text-white">{user.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">가입일</span>
                    <span className="text-slate-300">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] font-bold text-slate-400">Church Think 소속 관리</h3>
                <div className="space-y-2">
                  {assignments.length === 0 ? (
                    <div className="glass p-4 rounded-2xl border border-slate-800/50 text-center text-[10px] text-slate-500">
                      등록된 소속/직책이 없습니다.
                    </div>
                  ) : (
                    assignments.map(a => (
                      <div key={a.id} className={`glass p-3 rounded-2xl border flex flex-col gap-1 ${a.is_active ? 'border-church-500/30' : 'border-slate-800/50 opacity-50'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[11px] font-bold text-white">
                              {a.committee_name}{a.group_name ? ` > ${a.group_name}` : ''}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              {a.position_name} · 권한: {a.role_code}
                            </p>
                          </div>
                          {a.is_primary && (
                            <span className="text-[8px] bg-church-500/20 text-church-400 px-1.5 py-0.5 rounded font-bold">주소속</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {isAdminOrAuditor && (
                <div className="space-y-3 pt-4 border-t border-slate-800/60">
                  <h3 className="text-[11px] font-bold text-slate-400">관리자 작업</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {user.user_status !== 'BLOCKED' ? (
                      <button onClick={handleBlock} className="glass p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[10px] text-rose-400 hover:bg-rose-500/10 transition-colors border border-slate-800">
                        <UserX size={16} /> 계정 차단
                      </button>
                    ) : (
                      <button onClick={handleUnblock} className="glass p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-colors border border-slate-800">
                        <Shield size={16} /> 차단 해제
                      </button>
                    )}
                    <button onClick={handleResetPassword} className="glass p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[10px] text-amber-400 hover:bg-amber-500/10 transition-colors border border-slate-800">
                      <Key size={16} /> PW 초기화
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagementTab;
