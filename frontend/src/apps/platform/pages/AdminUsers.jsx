import React, { useState, useEffect } from 'react';
import { Search, Shield, UserX, UserCheck, KeyRound, AlertTriangle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tempPassword, setTempPassword] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const fetchUsers = async (search = searchTerm) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/platform/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    if (!window.confirm(`계정을 ${currentStatus ? '비활성화' : '활성화'} 하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/platform/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTempPassword = async (userId) => {
    if (!window.confirm('임시 비밀번호를 발급하시겠습니까? 기존 비밀번호는 사용할 수 없게 됩니다.')) return;
    try {
      const res = await fetch(`/api/platform/admin/users/${userId}/temp-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setTempPassword({ userId, password: data.tempPassword });
      } else {
        alert(data.message || '임시 비밀번호 발급 실패');
      }
    } catch (err) {
      console.error(err);
      alert('서버 오류 발생');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Shield className="text-indigo-400" /> 플랫폼 회원 관리
          </h1>
          <p className="text-slate-400 text-sm mt-1">전체 Booza Think 회원의 계정 상태와 인증을 관리합니다.</p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="이름, 아이디, 이메일 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold">검색</button>
        </form>
      </div>

      {tempPassword && (
        <div className="bg-emerald-900/40 border border-emerald-500/50 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-emerald-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-emerald-300 font-bold mb-1">임시 비밀번호 발급 완료</h3>
            <p className="text-emerald-100/70 text-sm">사용자에게 다음 임시 비밀번호를 안전하게 전달해 주세요. 로그인 시 비밀번호 변경 화면으로 강제 이동됩니다.</p>
            <div className="mt-3 flex items-center gap-2">
              <code className="bg-emerald-950 px-3 py-1.5 rounded-lg text-emerald-300 font-mono text-lg font-bold border border-emerald-800">
                {tempPassword.password}
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword.password);
                  alert('복사되었습니다.');
                }}
                className="text-xs bg-emerald-800/50 hover:bg-emerald-700/50 px-2 py-1 rounded text-emerald-200"
              >복사</button>
              <button onClick={() => setTempPassword(null)} className="text-xs ml-auto text-emerald-400 hover:text-emerald-300">닫기</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">이름/ID</th>
                <th className="px-4 py-3">이메일/연락처</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">데이터를 불러오는 중입니다...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-500">검색 결과가 없습니다.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.user_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        {u.display_name} 
                        {u.system_role === 'SYSTEM_ADMIN' && <Shield size={12} className="text-rose-400" title="시스템 관리자" />}
                      </div>
                      <div className="text-xs text-slate-500">{u.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300">{u.email || '-'}</div>
                      <div className="text-xs text-slate-500">{u.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.is_active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button 
                        onClick={() => handleTempPassword(u.user_id)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="임시 비밀번호 발급"
                      ><KeyRound size={16} /></button>
                      <button 
                        onClick={() => handleStatusToggle(u.user_id, u.is_active)}
                        className={`p-1.5 rounded transition-colors ${
                          u.is_active ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                        }`}
                        title={u.is_active ? '계정 정지' : '계정 활성화'}
                      >
                        {u.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}