import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, KeyRound, AlertCircle, CheckCircle2, PenTool, Type } from 'lucide-react';

const fallbackPositions = [
  { name: '회계', role: 'DEPARTMENT_ACCOUNTANT' },
  { name: '부장', role: 'DEPARTMENT_HEAD' },
  { name: '위원장', role: 'FINANCE_MANAGER' },
  { name: '총무', role: 'DEPARTMENT_ACCOUNTANT' },
  { name: '교역자', role: 'AUDITOR' },
  { name: '기타', role: 'DEPARTMENT_ACCOUNTANT' }
];

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [availablePositions, setAvailablePositions] = useState(fallbackPositions);
  const [position, setPosition] = useState('회계');
  const [role, setRole] = useState('DEPARTMENT_ACCOUNTANT');
  const [organizations, setOrganizations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 새로운 교회 생성 온보딩 정보 (TEAM C)
  const [onboardingMode, setOnboardingMode] = useState('join'); // 'join' or 'create'
  const [churchName, setChurchName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [region, setRegion] = useState('');
  const [managerName, setManagerName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#38669b');
  const [homepage, setHomepage] = useState('');
  const [representativeImage, setRepresentativeImage] = useState('');

  // 서명 상태
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'text'
  const [signatureText, setSignatureText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchOrganizations();
    fetchGroups();
  }, []);

  // 사용자 이름 입력 시 글자 서명 기본값 동기화
  useEffect(() => {
    if (name) {
      setSignatureText(`${name} (인)`);
    } else {
      setSignatureText('');
    }
  }, [name]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].organization_id.toString());
        }
      } else {
        console.error('Failed to fetch organizations:', data.message || 'Unknown error');
        setOrganizations([]);
      }
    } catch (err) {
      console.error(err);
      setOrganizations([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setGroups(data);
      } else {
        console.error('Failed to fetch groups:', data.message || 'Unknown error');
        setGroups([]);
      }
    } catch (err) {
      console.error(err);
      setGroups([]);
    }
  };

  useEffect(() => {
    if (selectedOrgId) {
      const filtered = groups.filter(g => g.organization_id.toString() === selectedOrgId);
      if (filtered.length > 0) {
        setSelectedGroupId(filtered[0].group_id.toString());
      } else {
        setSelectedGroupId('');
      }
    }
  }, [selectedOrgId, groups]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchPositions(selectedGroupId);
    } else {
      setAvailablePositions(fallbackPositions);
      setPosition(fallbackPositions[0].name);
      setRole(fallbackPositions[0].role);
    }
  }, [selectedGroupId]);

  const fetchPositions = async (groupId) => {
    try {
      const response = await fetch(`/api/public/groups/${groupId}/positions`);
      const data = await response.json();
      if (response.ok && Array.isArray(data) && data.length > 0) {
        setAvailablePositions(data);
        setPosition(data[0].name);
        setRole(data[0].role);
      } else {
        setAvailablePositions(fallbackPositions);
        setPosition(fallbackPositions[0].name);
        setRole(fallbackPositions[0].role);
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err);
      setAvailablePositions(fallbackPositions);
      setPosition(fallbackPositions[0].name);
      setRole(fallbackPositions[0].role);
    }
  };

  const handlePositionChange = (posName) => {
    setPosition(posName);
    const matched = availablePositions.find(p => p.name === posName);
    if (matched) {
      setRole(matched.role);
    } else {
      if (posName === '회계') setRole('DEPARTMENT_ACCOUNTANT');
      else if (posName === '부장') setRole('DEPARTMENT_HEAD');
      else if (posName === '위원장') setRole('FINANCE_MANAGER');
      else if (posName === '교역자') setRole('AUDITOR');
      else setRole('DEPARTMENT_ACCOUNTANT');
    }
  };

  // Canvas 드로잉 핸들러
  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#38bdf8'; // Sky 400
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password || !name) {
      setError('모든 필수 항목을 입력해 주세요.');
      return;
    }

    if (onboardingMode === 'join' && !selectedGroupId) {
      setError('소속 그룹을 선택해 주세요.');
      return;
    }

    if (onboardingMode === 'create' && !churchName) {
      setError('교회명을 입력해 주세요.');
      return;
    }

    let signatureVal = '';
    if (signatureMode === 'draw') {
      if (!hasDrawn) {
        setError('서명 패드에 친필 서명을 작성해 주세요.');
        return;
      }
      const canvas = canvasRef.current;
      signatureVal = canvas.toDataURL('image/png');
    } else {
      if (!signatureText.trim()) {
        setError('글자 서명 내용을 입력해 주세요.');
        return;
      }
      signatureVal = signatureText.trim();
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          name,
          role,
          position,
          group_id: onboardingMode === 'join' ? parseInt(selectedGroupId, 10) : 1, // Default to Administration for new church
          signature: signatureVal,
          churchInfo: onboardingMode === 'create' ? {
            churchName,
            denomination,
            region,
            managerName: managerName || name,
            primaryColor,
            homepage,
            representativeImage
          } : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '가입 신청에 실패했습니다.');
      }

      setSuccess(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <div className="p-2 rounded-xl bg-white/10 border border-slate-800 shadow-md mb-3 flex items-center justify-center max-w-[200px] h-16">
            <img src="/church_logo.png" alt="신길교회" className="h-full object-contain" />
          </div>
          <h2 className="text-md font-bold tracking-tight text-white">회원가입 신청</h2>
          <p className="text-[10px] text-slate-500 mt-1">길을 만드는 사람들 · 신길교회 스마트 회계</p>
        </div>

        <div className="glass p-6 rounded-2xl shadow-xl">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-500 animate-bounce" />
              <h3 className="text-sm font-bold text-white">가입 신청 완료</h3>
              <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{success}</p>
              <p className="text-[10px] text-church-400 font-bold">잠시 후 로그인 창으로 이동합니다...</p>
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">사용자 아이디 *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ID 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">비밀번호 *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-church-500"
                />
              </div>

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

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">직책 선택 *</label>
                <select
                  value={position}
                  onChange={(e) => handlePositionChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                >
                  {availablePositions.map((pos, idx) => (
                    <option key={idx} value={pos.name}>{pos.name}</option>
                  ))}
                </select>
              </div>

              {/* 가입 방식 선택 (TEAM C) */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">온보딩 유형 선택 *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode('join')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      onboardingMode === 'join'
                        ? 'bg-church-600/20 border-church-500 text-church-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    기존 교회 가입
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingMode('create')}
                    className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      onboardingMode === 'create'
                        ? 'bg-church-600/20 border-church-500 text-church-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    새로운 교회 생성
                  </button>
                </div>
              </div>

              {onboardingMode === 'join' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">소속 위원회/기관 *</label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="" disabled>선택</option>
                      {organizations.map(o => (
                        <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">소속 그룹(찬양팀) *</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="" disabled>선택</option>
                      {groups
                        .filter(g => g.organization_id.toString() === selectedOrgId)
                        .map(g => (
                          <option key={g.group_id} value={g.group_id}>{g.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/40">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400">교회명 *</label>
                    <input
                      type="text"
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      placeholder="예: 신길교회"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">교단 (선택)</label>
                      <input
                        type="text"
                        value={denomination}
                        onChange={(e) => setDenomination(e.target.value)}
                        placeholder="예: 성결교"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">지역 (선택)</label>
                      <input
                        type="text"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="예: 서울 영등포"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">대표 담당자 (선택)</label>
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="실명 입력"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">대표 색상 (선택)</label>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl h-8 p-1 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">홈페이지 (선택)</label>
                      <input
                        type="text"
                        value={homepage}
                        onChange={(e) => setHomepage(e.target.value)}
                        placeholder="URL 입력"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">대표 이미지 (선택)</label>
                      <input
                        type="text"
                        value={representativeImage}
                        onChange={(e) => setRepresentativeImage(e.target.value)}
                        placeholder="이미지 URL"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 서명 등록 섹션 */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[11px] font-semibold text-slate-400">자필 서명/사인 등록 *</label>
                  <p className="text-[8px] text-amber-500 font-bold leading-normal">
                    ※ 등록하시는 서명은 전표 기안 등록 및 결재 승인 시 사용자의 디지털 인장(서명)으로 자동 사용됩니다.
                  </p>
                </div>

                {/* 서명 방식 토글 탭 */}
                <div className="flex gap-1 p-0.5 bg-slate-900/80 rounded-lg border border-slate-800/60 select-none">
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    className={`flex-1 py-1 rounded-md text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                      signatureMode === 'draw' ? 'bg-church-600/30 text-church-400 border border-church-500/20' : 'text-slate-500'
                    }`}
                  >
                    <PenTool size={10} /> 그림 서명
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('text')}
                    className={`flex-1 py-1 rounded-md text-[9px] font-bold flex items-center justify-center gap-1 transition-all ${
                      signatureMode === 'text' ? 'bg-church-600/30 text-church-400 border border-church-500/20' : 'text-slate-500'
                    }`}
                  >
                    <Type size={10} /> 글자 서명
                  </button>
                </div>

                {signatureMode === 'draw' ? (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={340}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[120px] bg-slate-950 border border-slate-800 rounded-xl cursor-crosshair touch-none"
                      />
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute right-2 bottom-2 bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded text-[8px] font-bold"
                      >
                        지우기
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-500 text-center">드로잉 패드 영역에 손가락이나 펜으로 직접 서명을 그려주세요.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="예: 홍길동 (인)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-church-500 font-semibold"
                    />
                    <p className="text-[8px] text-slate-500">결재 시 텍스트 도장 형태로 노출될 기본 인장 텍스트를 입력해주세요.</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-church-600 to-church-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus size={15} /> {loading ? '신청서 제출 중...' : '가입 신청서 제출'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
