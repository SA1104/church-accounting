import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../core/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await apiClient('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (data.success) {
        setSuccess('비밀번호 재설정 메일이 발송되었습니다. 이메일함을 확인해주세요.');
      } else {
        setError(data.message || '요청에 실패했습니다.');
      }
    } catch (err) {
      setError(err.message || '요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-950 px-6 select-none">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-widest bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-200 bg-clip-text text-transparent">BOOZA THINK</h1>
          <p className="text-[11px] text-slate-500 mt-3 font-medium">비밀번호 찾기</p>
        </div>

        <div className="glass p-6 rounded-2xl shadow-xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md">
          {success ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center">
                <CheckCircle size={32} />
                <span className="text-sm font-semibold">{success}</span>
                <span className="text-xs text-emerald-500/80">
                  스팸 메일함도 확인해 주세요.
                </span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-xl text-xs transition-all"
              >
                로그인 화면으로 돌아가기
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

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                가입 시 등록한 이메일 주소를 입력하시면,<br/>비밀번호 재설정 링크를 보내드립니다.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">이메일</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail size={15} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="등록한 이메일 주소"
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-2 rounded-xl text-xs shadow-md shadow-indigo-500/10 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                {loading ? '메일 발송 중...' : '재설정 메일 보내기'}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[10px] text-slate-400 hover:text-white transition-colors underline font-medium"
                >
                  로그인 화면으로 돌아가기
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}