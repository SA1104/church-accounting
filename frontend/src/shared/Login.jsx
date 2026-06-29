import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { KeyRound, User, Lock, AlertCircle, Fingerprint } from 'lucide-react';
import { apiClient } from '../core/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsPasskeySupported(!!window.PublicKeyCredential);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await apiClient('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!username) {
      setError('생체인증 로그인을 위해 아이디(이메일)를 먼저 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      
      // 1. Get options
      const options = await apiClient('/api/auth/passkey/login/options', {
        method: 'POST',
        body: JSON.stringify({ email: username })
      });

      // 2. Browser biometric challenge
      const authResponse = await startAuthentication(options);

      // 3. Verify
      const result = await apiClient('/api/auth/passkey/login/verify', {
        method: 'POST',
        body: JSON.stringify({ email: username, authResponse })
      });

      if (result.success) {
        login(result.token, result.user);
        navigate('/');
      } else {
        throw new Error(result.message || 'Passkey 인증에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || '지문/Face ID 로그인에 실패했습니다. 비밀번호 로그인을 사용해 주세요.');
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
        {/* BOOZA THINK 플랫폼 타이틀 표시 */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-widest bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-200 bg-clip-text text-transparent">BOOZA THINK</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Decision Intelligence Platform</p>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">오늘 무엇을 결정하시겠습니까?</p>
        </div>

        {/* 로그인 카드 */}
        <div className="glass p-6 rounded-2xl shadow-xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md">
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
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
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
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-2 rounded-xl text-xs shadow-md shadow-indigo-500/10 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>

            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={loading || !isPasskeySupported}
              className={`w-full flex items-center justify-center gap-2 border border-slate-700 text-white font-semibold py-2 rounded-xl text-xs shadow-md transition-all active:scale-[0.98] ${
                isPasskeySupported 
                  ? 'bg-slate-800/80 hover:bg-slate-700/80' 
                  : 'bg-slate-900/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Fingerprint size={15} className={isPasskeySupported ? 'text-indigo-400' : 'text-slate-600'} />
              <span>지문 / Face ID로 로그인</span>
            </button>

            {!isPasskeySupported && (
              <p className="text-[10px] text-rose-400 text-center mt-1">
                이 브라우저에서는 생체인증 로그인을 지원하지 않습니다.<br />
                기존 비밀번호 로그인을 사용해 주세요.
              </p>
            )}
          </form>

          <div className="mt-4 text-center flex flex-col gap-2">
            <button
              onClick={() => navigate('/signup')}
              className="text-[10px] text-slate-400 hover:text-white transition-colors underline font-medium"
            >
              아직 계정이 없으신가요? 회원가입 신청
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-[9px] text-slate-500 hover:text-slate-300 transition-colors font-medium mt-1"
            >
              ← 플랫폼 홈(Decision Hub)으로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
