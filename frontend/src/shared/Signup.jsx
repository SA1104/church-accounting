import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle2, Fingerprint } from 'lucide-react';
import { apiClient } from '../core/api';

export default function Signup() {
  const navigate = useNavigate();

  // Basic Platform Signup Fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+82');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [termsAgree, setTermsAgree] = useState(false);

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    setPhone(''); // Reset phone when country changes
  };

  const formatPhoneNumber = (value, code) => {
    const nums = value.replace(/\D/g, ''); // Keep digits only
    if (code === '+82') {
      if (nums.length <= 3) return nums;
      if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
      return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
    } else if (code === '+1') {
      if (nums.length <= 3) return nums;
      if (nums.length <= 6) return `(${nums.slice(0, 3)}) ${nums.slice(3)}`;
      return `(${nums.slice(0, 3)}) ${nums.slice(3, 6)}-${nums.slice(6, 10)}`;
    } else if (code === '+81') {
      if (nums.length <= 3) return nums;
      if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
      return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
    }
    return nums; // Default: raw numbers
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    const formatted = formatPhoneNumber(val, countryCode);
    setPhone(formatted);
  };

  const getPhonePlaceholder = (code) => {
    if (code === '+82') return '010-0000-0000';
    if (code === '+1') return '(123) 456-7890';
    if (code === '+81') return '080-0000-0000';
    if (code === '+86') return '130-0000-0000';
    return '휴대폰 번호 입력';
  };

  // Common UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Email typo warning
  const [emailTypoWarning, setEmailTypoWarning] = useState('');

  // Passkey signup state
  const [showPasskeySignupStep, setShowPasskeySignupStep] = useState(false);
  const [passkeyUserId, setPasskeyUserId] = useState('');
  const [passkeyDeviceName, setPasskeyDeviceName] = useState('지문 기기');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySuccess, setPasskeySuccess] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');

  // Regular expressions for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordMatch = password === confirmPassword;
  const isPasswordLengthValid = password.length >= 8;

  const handleEmailChange = (val) => {
    setEmail(val);
    if (!val) {
      setEmailTypoWarning('');
      return;
    }
    const domain = val.split('@')[1];
    if (domain) {
      const typos = ['gamil.com', 'gml.com', 'gamil.co', 'gmail.co', 'gmaill.com', 'gmai.com', 'gmap.com'];
      if (typos.includes(domain.toLowerCase())) {
        setEmailTypoWarning(`${domain}으로 입력하셨습니다. gmail.com이 맞나요?`);
      } else {
        setEmailTypoWarning('');
      }
    } else {
      setEmailTypoWarning('');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !phone) {
      setError('모든 필수 항목을 입력해 주세요.');
      return;
    }

    if (!isEmailValid) {
      setError('올바른 이메일 주소 형식을 입력해 주세요.');
      return;
    }

    if (!isPasswordLengthValid) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (!isPasswordMatch) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!termsAgree) {
      setError('이용약관 및 개인정보 처리방침에 동의해 주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Platform-level user signup (Booza Think Signup)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          username: email,
          password,
          phone: `${countryCode} ${phone}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }

      const userId = data.user?.id;

      setSuccess(`Booza Think 계정이 생성되었습니다.
이제 로그인 후 원하는 서비스를 이용할 수 있습니다.
Church Think를 이용하려면 설정 → 교회 소속 신청을 진행해주세요.`);
      setPasskeyUserId(userId);
      setShowPasskeySignupStep(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSignupPasskey = async () => {
    setPasskeyLoading(true);
    setPasskeyError('');
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      
      // 1. Get options
      const options = await apiClient('/api/auth/passkey/register/signup-flow/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: passkeyUserId })
      });

      // 2. Perform browser registration
      const regResponse = await startRegistration(options);

      // 3. Verify
      const verifyResult = await apiClient('/api/auth/passkey/register/signup-flow/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: passkeyUserId,
          regResponse,
          deviceName: passkeyDeviceName || '가입시 등록 기기'
        })
      });

      if (verifyResult.success) {
        setPasskeySuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        throw new Error(verifyResult.message || '인증 기기 등록 실패');
      }
    } catch (err) {
      console.error(err);
      setPasskeyError(err.message || '지문/Face ID 등록 중 오류가 발생했습니다.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-slate-950 px-6 py-10 select-none no-scrollbar flex flex-col items-center">
      <div className="w-full max-w-sm my-auto">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1 text-slate-500 hover:text-white text-xs font-semibold mb-4 transition-colors focus:outline-none"
        >
          <ArrowLeft size={14} /> 로그인으로 돌아가기
        </button>

        <div className="flex flex-col items-center mb-6">
          <h2 className="text-md font-bold tracking-tight text-white">BOOZA THINK 회원가입</h2>
          <p className="text-[10px] text-slate-500 mt-1">자산과 업무를 지능화하는 스마트 플랫폼</p>
        </div>

        <div className="glass p-6 rounded-2xl shadow-xl">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <CheckCircle2 size={40} className="text-emerald-500 animate-bounce" />
              <h3 className="text-sm font-bold text-white">플랫폼 가입 완료</h3>
              <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{success}</p>
              
              {showPasskeySignupStep && (
                <div className="w-full pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-200 font-bold">
                    <Fingerprint size={15} className="text-indigo-400" />
                    <span>생체인증(지문) 등록 신청</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    향후 빠르고 안전하게 로그인할 수 있도록 지금 이 기기의 지문/생체 인식을 등록하시겠습니까?
                  </p>

                  <div className="space-y-1.5 text-left">
                    <input
                      type="text"
                      value={passkeyDeviceName}
                      onChange={(e) => setPasskeyDeviceName(e.target.value)}
                      placeholder="기기 이름 입력 (예: 내 폰, 노트북)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  {passkeyError && (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-[9px] text-center font-bold">
                      {passkeyError}
                    </div>
                  )}

                  {passkeySuccess ? (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] text-center font-bold">
                      ✓ 생체인증 등록 성공! 로그인 창으로 이동합니다...
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRegisterSignupPasskey}
                        disabled={passkeyLoading || !window.PublicKeyCredential}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-[10px] flex items-center justify-center gap-1 transition-all"
                      >
                        {passkeyLoading ? '등록 중...' : '지문/Face ID 등록'}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold py-2.5 rounded-xl text-[10px] border border-slate-800 transition-all active:scale-95"
                      >
                        건너뛰기
                      </button>
                    </div>
                  )}
                  {!window.PublicKeyCredential && (
                    <p className="text-[9px] text-rose-400 text-center">
                      ⚠️ 이 브라우저는 생체인증(Passkey)을 지원하지 않습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 이름 */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">이름 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>

              {/* 이메일 */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">이메일 주소 *</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="example@gmail.com"
                  className={`w-full bg-slate-900 border rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none ${
                    email ? (isEmailValid ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-rose-500/50 focus:border-rose-500') : 'border-slate-800 focus:border-church-500'
                  }`}
                />
                {emailTypoWarning && (
                  <p className="text-[10px] text-amber-500 font-semibold mt-0.5">{emailTypoWarning}</p>
                )}
              </div>


              {/* 비밀번호 및 비밀번호 확인 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">비밀번호 *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상"
                    className={`w-full bg-slate-900 border rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none ${
                      password ? (isPasswordLengthValid ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-rose-500/50 focus:border-rose-500') : 'border-slate-800 focus:border-church-500'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">비밀번호 확인 *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className={`w-full bg-slate-900 border rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none ${
                      confirmPassword ? (isPasswordMatch ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-rose-500/50 focus:border-rose-500') : 'border-slate-800 focus:border-church-500'
                    }`}
                  />
                </div>
              </div>

              {/* 휴대폰 번호 */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">휴대폰 번호 *</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={handleCountryChange}
                    className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-church-500 w-28 shrink-0 font-sans"
                  >
                    <option value="+82">🇰🇷 한국 (+82)</option>
                    <option value="+1">🇺🇸 미국 (+1)</option>
                    <option value="+81">🇯🇵 일본 (+81)</option>
                    <option value="+86">🇨🇳 중국 (+86)</option>
                    <option value="+44">🇬🇧 영국 (+44)</option>
                    <option value="+84">🇻🇳 베트남 (+84)</option>
                    <option value="+63">🇵🇭 필리핀 (+63)</option>
                  </select>
                  <input
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder={getPhonePlaceholder(countryCode)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="termsAgree"
                  checked={termsAgree}
                  onChange={(e) => setTermsAgree(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-slate-800 bg-slate-900 text-church-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="termsAgree" className="text-[10px] text-slate-400 leading-snug cursor-pointer select-none">
                  <span onClick={() => setShowPrivacyModal(true)} className="underline text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">개인정보 처리방침</span> 및 <span onClick={() => setShowTermsModal(true)} className="underline text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">BOOZA THINK 플랫폼 이용약관</span>에 동의합니다. *
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-church-600 to-church-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus size={15} /> {loading ? '가입 진행 중...' : '회원가입 완료'}
              </button>
            </form>
          )}
        </div>
      </div>
      {/* 법무팀 검토: 이용약관 및 개인정보처리방침 모달 */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="text-sm font-bold text-white shrink-0">BOOZA THINK 플랫폼 이용약관</h3>
            <div className="overflow-y-auto pr-2 text-[10px] text-slate-450 leading-relaxed space-y-3 font-sans max-h-[50vh] no-scrollbar">
              <p className="text-white font-bold">제 1 조 (목적)</p>
              <p>본 약관은 BOOZA THINK 플랫폼(이하 "플랫폼")이 제공하는 의사결정 지원 및 지능화 서비스(이하 "서비스")의 이용 조건과 회원 및 플랫폼 간의 권리와 의무를 규정함을 목적으로 합니다.</p>
              
              <p className="text-white font-bold">제 2 조 (용어의 정의)</p>
              <p>1. "회원"이란 플랫폼에 가입하여 서비스를 이용하는 사용자를 말합니다.<br />2. "Capability"란 플랫폼 내에서 특정 업무 영역(예: 회계, 투자)을 위해 제공되는 개별 기능 모듈을 의미합니다.<br />3. "Workspace"란 Capability가 구동되는 개별 데이터 관리 단위를 뜻합니다.</p>
              
              <p className="text-white font-bold">제 3 조 (이용계약의 체결)</p>
              <p>1. 회원가입은 이용자가 본 약관 및 개인정보 처리방침에 동의하고 가입 신청 양식을 제출하면, 플랫폼이 이를 승인함으로써 체결됩니다.<br />2. 가입 시 허위 정보를 기재하거나 명의를 도용한 경우 회원 자격이 정지될 수 있습니다.</p>
              
              <p className="text-white font-bold">제 4 조 (회원의 의무)</p>
              <p>1. 회원은 본인의 로그인 식별 정보 및 비밀번호를 관리할 책임이 있으며, 제3자에게 누설하거나 공유해서는 안 됩니다.<br />2. 플랫폼 내 제공되는 정보 및 분석 결과물에 대한 권한 외 무단 배포나 상업적 전재를 금지합니다.</p>
              
              <p className="text-white font-bold">제 5 조 (의사결정 및 면책에 대한 법적 효력)</p>
              <p className="text-amber-500 font-bold leading-normal">
                ※ 중요: 본 플랫폼이 제공하는 분석, 예측, 지표 및 AI 시뮬레이션 결과물은 의사결정을 보조하기 위한 정보 제공 목적일 뿐이며, 법적 투자 자문이나 회계 결산의 최종 검증 역할을 대체하지 않습니다. 회원의 최종 결정에 따른 모든 법적, 물질적 책임은 회원 본인에게 귀속됩니다.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shrink-0"
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <h3 className="text-sm font-bold text-white shrink-0">개인정보 처리방침</h3>
            <div className="overflow-y-auto pr-2 text-[10px] text-slate-455 leading-relaxed space-y-3 font-sans max-h-[50vh] no-scrollbar">
              <p className="text-white font-bold">1. 수집하는 개인정보 항목</p>
              <p>플랫폼은 최초 가입 시 다음과 같은 필수 개인정보를 수집합니다:<br />- 이름, 이메일 주소(아이디), 비밀번호, 휴대폰 번호, 국가(국적)</p>
              
              <p className="text-white font-bold">2. 개인정보의 수집 및 이용 목적</p>
              <p>수집된 개인정보는 다음 목적에 한하여 이용됩니다:<br />- 회원 가입 확인 및 플랫폼 서비스 식별자 발급<br />- 각 Capability(예: Church Think) 가입 신청 및 소속 배정 절차 처리<br />- 비인증 접근 시도 차단 및 불법 사용 감시 등 보안성 강화</p>
              
              <p className="text-white font-bold">3. 개인정보의 보유 및 이용 기간</p>
              <p>원칙적으로 회원의 개인정보는 회원 탈퇴 시 지체 없이 파기됩니다. 다만, 부정 가입 방지 및 관련 관계법령(전자상거래법 등)에 의거하여 일정 기간 법적으로 정보 보존이 필요할 경우 해당 기한 동안 보존됩니다.</p>
              
              <p className="text-white font-bold">4. 개인정보 제공 및 위탁</p>
              <p>플랫폼은 회원의 개인정보를 제3자에게 임의로 제공하거나 외부 업체에 위탁하지 않습니다. 단, 회원이 명시적으로 동의하거나 법령의 규정에 의거한 수사기관의 공식 요청이 있는 경우는 예외로 합니다.</p>
              
              <p className="text-white font-bold">5. 개인정보 보호 책임자</p>
              <p>성명: BOOZA THINK 플랫폼 준법감시부 (법무팀)<br />문의 연락처: legal@boozathink.com</p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] shrink-0"
            >
              확인 및 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
