import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Sparkles, Building2, TrendingUp, Home, Globe } from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleStartChurch = () => {
    if (isAuthenticated) {
      navigate('/app/church');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 select-none overflow-y-auto no-scrollbar font-sans">
      {/* Top Brand Header */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-church-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-church-500/20">
            <Sparkles size={16} className="text-white animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-wider text-slate-200">BOOZA THINK</span>
        </div>
      </div>

      {/* Main Hero & Service Cards */}
      <div className="w-full max-w-4xl mx-auto my-auto py-12 flex flex-col items-center">
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            오늘 무엇을 결정하시겠습니까?
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
            데이터를 지식으로, 지식을 통찰로 연결하여 현명한 의사결정을 돕는 Decision Intelligence Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Active Product: Church Think */}
          <div className="relative group rounded-2xl border border-church-500/20 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-church-500/50 hover:shadow-church-500/10 flex flex-col justify-between h-56">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-church-500/10 text-church-400">
                  <Building2 size={24} />
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  이용 가능
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Church Think</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                스마트 교회 회계 시스템. 투명한 전표 작성, 신속한 전자결재 프로세스 및 예산 집행에 대한 인텔리전스 분석을 지원합니다.
              </p>
            </div>
            <button
              onClick={handleStartChurch}
              className="w-full mt-4 bg-gradient-to-r from-church-600 to-indigo-600 hover:from-church-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all duration-300 shadow-md shadow-church-500/20"
            >
              시작하기
            </button>
          </div>

          {/* Future Product: Stock Think */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between h-56 opacity-75">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-500">
                  <TrendingUp size={24} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">Stock Think</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI 주식 가치 평가 분석. 뉴스 언급량, 감성 분석 및 재무제표 표준 계측 모델을 통한 의사결정 추천을 지원할 예정입니다.
              </p>
            </div>
            <div className="w-full text-center text-[10px] text-slate-600 py-2 border border-dashed border-slate-800 rounded-xl">
              서비스 준비중
            </div>
          </div>

          {/* Future Product: Estate Think */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between h-56 opacity-75">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-500">
                  <Home size={24} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">Estate Think</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI 부동산 분석 의사결정 플랫폼. 국토교통부 실거래 정보 및 시세 통계, 입지 및 학군 만족도 사분면 분석 지표를 연동합니다.
              </p>
            </div>
            <div className="w-full text-center text-[10px] text-slate-600 py-2 border border-dashed border-slate-800 rounded-xl">
              서비스 준비중
            </div>
          </div>

          {/* Future Product: Mission Think */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 flex flex-col justify-between h-56 opacity-75">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-500">
                  <Globe size={24} />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-300 mb-2">Mission Think</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                AI 선교 협력 네트워크. 선교지 국가의 치안 상태, 기후 변동성, 해외 환율 변동 추이 등을 매핑하고 후원을 연계합니다.
              </p>
            </div>
            <div className="w-full text-center text-[10px] text-slate-600 py-2 border border-dashed border-slate-800 rounded-xl">
              서비스 준비중
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="w-full text-center text-[10px] text-slate-600 font-medium tracking-wide max-w-6xl mx-auto">
        Powered by Booza Think Platform
      </div>
    </div>
  );
}
