import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, KeyRound, AlertCircle, CheckCircle2, PenTool, Type, Search, Plus, Check } from 'lucide-react';

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

  // 사용자 기본 필드
  const [username, setUsername] = useState(''); // 이메일 주소로 사용됨
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // 직책 필드
  const [availablePositions, setAvailablePositions] = useState(fallbackPositions);
  const [position, setPosition] = useState('회계');
  const [role, setRole] = useState('DEPARTMENT_ACCOUNTANT');

  // 다교회 온보딩 필드
  const [churches, setChurches] = useState([]);
  const [selectedChurchId, setSelectedChurchId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isChurchDropdownOpen, setIsChurchDropdownOpen] = useState(false);
  
  // 부서 및 그룹 (Cascading)
  const [organizations, setOrganizations] = useState([]); // 부서 (department)
  const [groups, setGroups] = useState([]); // 소속 그룹 (group)
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');

  // 신규 교회 등록 신청 모드
  const [showChurchCreate, setShowChurchCreate] = useState(false);
  const [newChurchName, setNewChurchName] = useState('');
  const [newDenomination, setNewDenomination] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newHomepage, setNewHomepage] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newMemo, setNewMemo] = useState('');

  // 공통 상태
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 서명 상태
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' or 'text'
  const [signatureText, setSignatureText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);
  const searchContainerRef = useRef(null);

  // 이메일 유효성 및 패스워드 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(username);
  const isPasswordMatch = password === confirmPassword;
  const isPasswordLengthValid = password.length >= 8;

  // 1. 전국 교회 목록 조회 및 신길교회 기본값 바인딩
  useEffect(() => {
    fetchChurches();
    
    // 외부 클릭 시 검색창 닫기
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsChurchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchChurches = async () => {
    try {
      const response = await fetch('/api/churches');
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setChurches(data);
        const singil = data.find(c => c.church_name === '신길교회');
        if (singil) {
          setSelectedChurchId(singil.church_id);
          setSearchQuery(`${singil.church_name} · ${singil.denomination} · ${singil.region}`);
        } else if (data.length > 0) {
          setSelectedChurchId(data[0].church_id);
          setSearchQuery(`${data[0].church_name} · ${data[0].denomination} · ${data[0].region}`);
        }
      }
    } catch (err) {
      console.error('Fetch churches error:', err);
    }
  };

  // 2. 교회 선택 시 ➡️ 부서(위원회/기관) 목록 조회 (Cascading 1단계)
  useEffect(() => {
    if (selectedChurchId) {
      fetchDepartments(selectedChurchId);
    } else {
      setOrganizations([]);
      setSelectedOrgId('');
    }
  }, [selectedChurchId]);

  const fetchDepartments = async (churchId) => {
    try {
      const response = await fetch(`/api/churches/${churchId}/departments`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].department_id.toString());
        } else {
          setSelectedOrgId('');
        }
      }
    } catch (err) {
      console.error('Fetch departments error:', err);
      setOrganizations([]);
      setSelectedOrgId('');
    }
  };

  // 3. 부서 선택 시 ➡️ 소속 그룹 목록 조회 (Cascading 2단계)
  useEffect(() => {
    if (selectedOrgId) {
      fetchGroups(selectedOrgId);
    } else {
      setGroups([]);
      setSelectedGroupId('');
    }
  }, [selectedOrgId]);

  const fetchGroups = async (deptId) => {
    try {
      const response = await fetch(`/api/departments/${deptId}/groups`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(data[0].group_id);
        } else {
          setSelectedGroupId('');
        }
      }
    } catch (err) {
      console.error('Fetch groups error:', err);
      setGroups([]);
      setSelectedGroupId('');
    }
  };

  // 사용자 이름 입력 시 글자 서명 기본값 동기화
  useEffect(() => {
    if (name) {
      setSignatureText(`${name} (인)`);
    } else {
      setSignatureText('');
    }
  }, [name]);

  const handlePositionChange = (posName) => {
    setPosition(posName);
    const matched = availablePositions.find(p => p.name === posName);
    if (matched) {
      setRole(matched.role);
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

  // 교회 자동완성 필터링
  const filteredChurches = churches.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      (c.church_name && c.church_name.toLowerCase().includes(query)) ||
      (c.denomination && c.denomination.toLowerCase().includes(query)) ||
      (c.region && c.region.toLowerCase().includes(query)) ||
      (c.address && c.address.toLowerCase().includes(query))
    );
  });

  const handleSelectChurch = (c) => {
    setSelectedChurchId(c.church_id);
    setSearchQuery(`${c.church_name} · ${c.denomination} · ${c.region}`);
    setIsChurchDropdownOpen(false);
    setShowChurchCreate(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword || !name) {
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

    if (!showChurchCreate && !selectedChurchId) {
      setError('소속 교회를 선택해 주세요.');
      return;
    }

    if (!showChurchCreate && (!selectedOrgId || !selectedGroupId)) {
      setError('소속 위원회와 그룹을 모두 선택해 주세요.');
      return;
    }

    if (showChurchCreate && (!newChurchName || !newRegion || !newManagerName || !newManagerEmail)) {
      setError('새 교회 등록 시 필수 항목(*)들을 모두 입력해 주세요.');
      return;
    }

    // 서명 데이터 추출
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

    const payload = {
      username, // email
      password,
      name,
      role,
      churchProfileId: showChurchCreate ? null : selectedChurchId,
      departmentId: showChurchCreate ? null : parseInt(selectedOrgId, 10),
      groupId: showChurchCreate ? null : selectedGroupId,
      signature: signatureVal,
      churchCreateRequest: showChurchCreate ? {
        churchName: newChurchName,
        denomination: newDenomination,
        region: newRegion,
        address: newAddress,
        phone: newPhone,
        homepage: newHomepage,
        managerName: newManagerName,
        managerEmail: newManagerEmail,
        memo: newMemo
      } : null
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '가입 신청에 실패했습니다.');
      }

      setSuccess(data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
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
          <h2 className="text-md font-bold tracking-tight text-white">Church Think 회원가입</h2>
          <p className="text-[10px] text-slate-500 mt-1">교회를 위한 스마트 회계·결재·감사 시스템</p>
        </div>

        <div className="glass p-6 rounded-2xl shadow-xl">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-500 animate-bounce" />
              <h3 className="text-sm font-bold text-white">가입 신청 접수 완료</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{success}</p>
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

              {/* 이메일 주소 필드 */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">이메일 주소 *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="example@church.com"
                  className={`w-full bg-slate-900 border rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none ${
                    username ? (isEmailValid ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-rose-500/50 focus:border-rose-500') : 'border-slate-800 focus:border-church-500'
                  }`}
                />
                <p className="text-[8px] text-slate-500">로그인에 사용할 실제 이메일 주소를 정확히 입력해 주세요.</p>
              </div>

              {/* 비밀번호 및 비밀번호 확인 필드 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">비밀번호 *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상 입력"
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
                    placeholder="동일 비밀번호"
                    className={`w-full bg-slate-900 border rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none ${
                      confirmPassword ? (isPasswordMatch ? 'border-emerald-500/50 focus:border-emerald-500' : 'border-rose-500/50 focus:border-rose-500') : 'border-slate-800 focus:border-church-500'
                    }`}
                  />
                </div>
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
                <label className="text-[11px] font-semibold text-slate-400">기본 직책 *</label>
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

              {/* 3-1. 소속 교회 선택 검색 / Autocomplete UI */}
              <div className="space-y-1" ref={searchContainerRef}>
                <label className="text-[11px] font-semibold text-slate-400">소속 교회 선택 *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsChurchDropdownOpen(true);
                      if (!e.target.value) {
                        setSelectedChurchId('');
                      }
                    }}
                    onFocus={() => setIsChurchDropdownOpen(true)}
                    placeholder="교회명 또는 주소를 입력하세요"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-church-500"
                  />
                  {/* 교회 자동완성 드롭다운 */}
                  {isChurchDropdownOpen && searchQuery.length > 0 && (
                    <div className="absolute z-50 w-full mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-[160px] overflow-y-auto no-scrollbar">
                      {filteredChurches.length > 0 ? (
                        filteredChurches.map(c => (
                          <button
                            key={c.church_id}
                            type="button"
                            onClick={() => handleSelectChurch(c)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between border-b border-slate-800/40 last:border-0"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">{c.church_name}</span>
                              <span className="text-[9px] text-slate-500">{c.denomination} · {c.region}</span>
                            </div>
                            {selectedChurchId === c.church_id && <Check size={14} className="text-church-400" />}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center space-y-2">
                          <p className="text-[10px] text-slate-500">검색 결과가 없습니다.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowChurchCreate(true);
                              setIsChurchDropdownOpen(false);
                              setSelectedChurchId('');
                              setSearchQuery('');
                            }}
                            className="text-[10px] text-church-400 hover:text-church-300 font-bold underline flex items-center gap-1 mx-auto"
                          >
                            <Plus size={12} /> 새 교회 등록 요청
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3-2. 새 교회 등록 폼 (등록되지 않았을 때 모달형 폼) */}
              {showChurchCreate && (
                <div className="space-y-3 p-3.5 rounded-xl border border-church-500/20 bg-church-500/5">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-[10px] font-bold text-church-400">⛪ 새 교회 등록 신청</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChurchCreate(false);
                        fetchChurches();
                      }}
                      className="text-[9px] text-slate-500 hover:text-white transition-colors"
                    >
                      취소
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400">교회명 *</label>
                    <input
                      type="text"
                      value={newChurchName}
                      onChange={(e) => setNewChurchName(e.target.value)}
                      placeholder="예: 신길교회"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none focus:border-church-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">교단</label>
                      <input
                        type="text"
                        value={newDenomination}
                        onChange={(e) => setNewDenomination(e.target.value)}
                        placeholder="예: 기독교대한성결교회"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">지역 *</label>
                      <input
                        type="text"
                        value={newRegion}
                        onChange={(e) => setNewRegion(e.target.value)}
                        placeholder="예: 서울 영등포구"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400">상세 주소</label>
                    <input
                      type="text"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="예: 서울시 영등포구 영등포로67길 9"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">대표전화</label>
                      <input
                        type="text"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="예: 02-831-3456"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">홈페이지</label>
                      <input
                        type="text"
                        value={newHomepage}
                        onChange={(e) => setNewHomepage(e.target.value)}
                        placeholder="http://"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2 mt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">담당자 이름 *</label>
                      <input
                        type="text"
                        value={newManagerName}
                        onChange={(e) => setNewManagerName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-400">담당자 이메일 *</label>
                      <input
                        type="text"
                        value={newManagerEmail}
                        onChange={(e) => setNewManagerEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400">신청 메모 (관리자 전송용)</label>
                    <textarea
                      value={newMemo}
                      onChange={(e) => setNewMemo(e.target.value)}
                      placeholder="추가 요청 사항 기재"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-white focus:outline-none h-12 no-scrollbar"
                    />
                  </div>
                </div>
              )}

              {/* 3-3. 소속 위원회 및 소속 그룹 드롭다운 (Cascading) */}
              {!showChurchCreate && selectedChurchId && (
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
                        <option key={o.department_id} value={o.department_id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">소속 그룹 *</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="" disabled>선택</option>
                      {groups.map(g => (
                        <option key={g.group_id} value={g.group_id}>{g.name}</option>
                      ))}
                    </select>
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
