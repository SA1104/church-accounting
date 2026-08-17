import { Target, AlertTriangle } from 'lucide-react';

export default function InvestmentThesisPanel() {
  return (
    <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-5 md:p-6 space-y-4">
      <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4">
        <Target size={16} /> 투자 시나리오 및 근거 (UI 예시)
      </h3>
      
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>1. 기술적 분석: 주요 지지선 돌파 및 거래량 동반 상승 예상</p>
        <p>2. 기본적 분석: 분기 실적 턴어라운드 전망 및 동종업계 대비 저평가</p>
        <p>3. 거시적 환경: 금리 인하 수혜주로 수급 개선 기대</p>
      </div>

      <div className="mt-5 p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
          <AlertTriangle size={14} /> 리스크 요소
        </div>
        <p className="text-xs text-slate-400">경쟁사 신제품 출시로 인한 단기 점유율 하락 가능성 존재. 손절가 이탈 시 즉각 대응.</p>
      </div>
    </div>
  );
}
