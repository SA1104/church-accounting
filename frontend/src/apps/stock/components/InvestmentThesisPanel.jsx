import { Target, AlertTriangle } from 'lucide-react';

export default function InvestmentThesisPanel() {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-4">
        <Target size={16} /> 투자 시나리오 및 근거 (UI 예시)
      </h3>
      
      <div className="space-y-4 text-sm text-indigo-900/80 leading-relaxed">
        <p>1. 기술적 분석: 주요 지지선 돌파 및 거래량 수반 상승 예상</p>
        <p>2. 기본적 분석: 분기 실적 턴어라운드 전망 및 동종업계 대비 저평가</p>
        <p>3. 거시적 환경: 금리 인하 수혜주로 수급 개선 기대</p>
      </div>

      <div className="mt-5 p-4 bg-white rounded-xl border border-rose-100 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
          <AlertTriangle size={14} /> 리스크 요소
        </div>
        <p className="text-xs text-slate-600">경쟁사 신제품 출시로 인한 단기 점유율 하락 가능성 존재. 손절가 이탈 시 즉각 대응.</p>
      </div>
    </div>
  );
}
