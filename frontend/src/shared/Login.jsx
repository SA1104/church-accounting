import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { KeyRound, User, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-950 px-6 select-none">
      <div className="w-full max-w-sm">
        {/* 신길교회 타이틀 표시 */}
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-md font-bold tracking-tight text-white">스마트 교회 회계 시스템</h2>
          <p className="text-[10px] text-slate-500 mt-1">길을 만드는 사람들 · 기독교대한성결교회 신길교회</p>
        </div>

        {/* 로그인 카드 */}
        <div className="glass p-6 rounded-2xl shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">아이디</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User size={15} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디 입력"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">비밀번호</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-church-600 to-church-500 text-white font-semibold py-2 rounded-xl text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="text-[10px] text-slate-400 hover:text-white transition-colors underline font-medium"
            >
              아직 계정이 없으신가요? 회원가입 신청
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
