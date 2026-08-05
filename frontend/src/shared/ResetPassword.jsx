import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../core/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Supabase sets access_token in the URL hash after clicking the email link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        localStorage.setItem('token', token); // Temporarily store to call change-password
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !passwordConfirm) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiClient('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ currentPassword: '', newPassword: password })
      });
      if (data.success) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      } else {
        setError(data.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-950 px-6 select-none">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-widest bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-200 bg-clip-text text-transparent">BOOZA THINK</h1>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">새 비밀번호 설정</p>
        </div>

        <div className="glass p-6 rounded-2xl shadow-xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md">
          {success ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center">
                <CheckCircle size={32} />
                <span className="text-sm font-semibold">{success}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs transition-all"
              >
                새 비밀번호로 로그인하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">새 비밀번호</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={15} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">새 비밀번호 확인</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock size={15} />
                  </span>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-2 rounded-xl text-xs shadow-md shadow-indigo-500/10 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {loading ? '변경 중...' : '비밀번호 변경 완료'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}