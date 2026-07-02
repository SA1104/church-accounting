import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, UserCheck, AlertTriangle, Loader2, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../core/api';
import { useAuth } from '../../../App';

export default function InviteLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { token: authToken, user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Friendly role names
  const roleNames = {
    'system_admin': '플랫폼 관리자 (system_admin)',
    'pastor': '교역자 (pastor)',
    'elder': '장로/안수집사 (elder)',
    'finance_admin': '재정 부장 / 총무 (finance_admin)',
    'auditor': '감사 (auditor)',
    'committee_head': '위원회 위원장 (committee_head)',
    'department_head': '부서 부장 (department_head)',
    'teacher': '교사 (teacher)',
    'member': '일반 회원 (member)'
  };

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        setLoading(true);
        const data = await apiClient(`/api/church/invitations/${token}`);
        setInvite(data);
      } catch (err) {
        console.error(err);
        setError(err.message || '초대 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchInviteDetails();
  }, [token]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const result = await apiClient(`/api/church/invitations/${token}/accept`, {
        method: 'POST'
      });
      setAccepted(true);
      setTimeout(() => {
        // Redirect to Portal / Settings to see membership
        window.location.href = '/settings';
      }, 2500);
    } catch (err) {
      alert(err.message || '초대 수락 중 오류가 발생했습니다.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-church-500 animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">초대 정보 조회 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="glass max-w-sm w-full p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center text-center space-y-4">
          <AlertTriangle size={48} className="text-rose-500 animate-pulse" />
          <h3 className="text-sm font-bold text-white">초대장 로드 실패</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]"
          >
            로그인 화면으로 이동
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="glass max-w-sm w-full p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center text-center space-y-4">
          <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
          <h3 className="text-sm font-bold text-white">초대 수락 완료</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {invite.invited_name}님의 초대가 수락되었습니다.<br />
            잠시 후 설정 페이지로 이동합니다.
          </p>
        </div>
      </div>
    );
  }

  // Check login email status
  const isLoggedIn = !!authToken;
  const isCorrectEmail = isLoggedIn && user && user.email === invite.invited_email;

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center px-6 overflow-y-auto py-10 no-scrollbar">
      <div className="w-full max-w-md my-auto space-y-6">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-bold tracking-tight text-white">Church Think 초대장</h2>
          <p className="text-[10px] text-slate-500 mt-1">교회 행정 및 재정 지능화 서비스</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Decorative Gradient Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-church-500/10 rounded-full filter blur-2xl pointer-events-none" />

          {/* Invitation Card Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-church-600/10 border border-church-500/20 rounded-xl flex items-center justify-center text-church-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">초대 대상 교회</span>
                <span className="text-sm font-bold text-white block">{invite.church_name}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3.5 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">수신자</span>
                <span className="font-bold text-white">{invite.invited_name} ({invite.invited_email})</span>
              </div>
              <div className="border-t border-slate-800/60 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">배정 소속</span>
                <span className="font-bold text-white">
                  {invite.committee_name} {invite.group_name ? `> ${invite.group_name}` : ''}
                </span>
              </div>
              <div className="border-t border-slate-800/60 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">임명 직책</span>
                <span className="font-bold text-white">{invite.position_name}</span>
              </div>
              <div className="border-t border-slate-800/60 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[10px]">할당 권한</span>
                <span className="font-bold text-church-400">{roleNames[invite.role] || invite.role}</span>
              </div>
            </div>

            {invite.message && (
              <div className="p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl text-[10px] text-slate-400 italic">
                "{invite.message}"
              </div>
            )}

            <div className="text-center text-[9px] text-slate-500">
              초대 발송자: <span className="font-semibold text-slate-300">{invite.inviter_name}</span> &nbsp;|&nbsp; 만료일자: <span className="text-amber-500 font-semibold">{new Date(invite.expires_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Action buttons based on identity context */}
          <div className="space-y-3">
            {isLoggedIn ? (
              isCorrectEmail ? (
                // Flow A: Logged in with correct email -> Accept directly
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full bg-gradient-to-r from-church-600 to-church-500 hover:brightness-110 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-church-600/10 transition-all active:scale-[0.98]"
                >
                  {accepting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      초대 수락 처리 중...
                    </>
                  ) : (
                    <>
                      <UserCheck size={14} />
                      초대장 수락 완료하기
                    </>
                  )}
                </button>
              ) : (
                // Flow B: Logged in with DIFFERENT email -> Warning + Logout options
                <div className="space-y-3.5">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[10px] text-rose-400 leading-normal flex items-start gap-1.5 text-left">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>
                      현재 로그인된 계정(<strong>{user.email}</strong>)이 초대받은 이메일(<strong>{invite.invited_email}</strong>)과 일치하지 않습니다. 다른 계정으로 수락하려면 로그아웃 해주세요.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      window.location.reload();
                    }}
                    className="w-full bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/20 text-rose-400 font-semibold py-2 rounded-xl text-[10px] flex items-center justify-center gap-1 transition-all"
                  >
                    <LogOut size={12} /> 다른 계정으로 수락 (로그아웃)
                  </button>
                </div>
              )
            ) : (
              // Flow C: Not logged in -> Show Login vs Signup
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/login?redirect=/invite/${token}`)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
                >
                  기존 계정 로그인 <ArrowRight size={12} className="text-slate-500" />
                </button>
                <button
                  onClick={() => navigate(`/signup?invite=${token}`)}
                  className="bg-church-600 hover:bg-church-500 text-white font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-church-600/10 transition-all active:scale-[0.98]"
                >
                  새 회원가입 <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
