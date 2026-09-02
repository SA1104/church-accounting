import { DataFreshnessBadge } from "../components/StockBadges";
import StockAnalysis from "../../../components/services/StockAnalysis";

export default function StockAnalysisPage() {
  const analysisModules = [
    { title: '한국시장 흐름', desc: '코스피/코스닥 지수 흐름 및 시장 자금 동향 분석', dataReq: 'KRX 지수, 시장 거래대금', status: '제공 중' },
    { title: '업종별 비교', desc: '주요 섹터별 수익률 및 수급 변화 비교', dataReq: 'KRX 섹터 지수, 업종별 외국인/기관 순매수', status: '개발 예정' },
    { title: '단일 종목 비교', desc: '특정 종목과 경쟁사, 지수 간의 상관관계 분석', dataReq: '종목 주가 시계열 데이터', status: '개발 예정' },
    { title: '가격·거래량 흐름', desc: 'VPA(Volume Price Analysis) 기반 수급 분석', dataReq: '일봉/주봉 거래량 및 가격', status: '개발 예정' },
    { title: '투자자 수급', desc: '외국인, 기관, 개인 매매동향 및 누적 순매수', dataReq: 'KRX 투자자별 매매동향', status: '개발 예정' },
    { title: '기업 실적·재무', desc: '분기별 매출, 영업이익 추이 및 성장성 분석', dataReq: 'DART 재무제표 API', status: '데이터 연동 준비 중' },
    { title: '밸류에이션', desc: '과거 PER/PBR 밴드 대비 현재 수준 평가', dataReq: '기업 실적 및 주가 시계열', status: '설계 중' },
    { title: '거시경제 영향', desc: '금리, 환율, 원자재 가격이 시장에 미치는 영향', dataReq: 'FRED, ECOS 거시 지표', status: '개발 예정' },
  ];

  return (
    <div>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-white">투자 분석 도구</h1>
            <p className="text-xs text-slate-400">데이터 기반의 다양한 분석 도구를 준비 중입니다.</p>
          </div>
          <DataFreshnessBadge timestamp={new Date().toISOString()} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 mb-4">
          <h2 className="text-sm font-bold text-white mb-2">현재 제공 상태 (안내)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            분석 메뉴는 2A 단계 외부 API 및 DB 연동을 거쳐 순차적으로 오픈됩니다. <br/>
            자동 생성된 매수/매도 점수나 목표가격은 제공하지 않으며, 투자자 스스로 판단할 수 있는 시각적 근거만을 제공합니다.
          </p>
        </div>

        {/* New Real-time Chart */}
        <div className="mb-8">
          <StockAnalysis />
        </div>

        <h2 className="text-lg font-bold text-white mb-4 mt-8">분석 모듈 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysisModules.map((mod, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start z-10">
                <h3 className="font-bold text-white text-sm">{mod.title}</h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${mod.status === '제공 중' ? 'bg-blue-900/50 text-blue-400 border-blue-800' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{mod.status}</span>
              </div>
              <p className="text-xs text-slate-400 z-10 leading-relaxed">{mod.desc}</p>
              <div className="mt-auto pt-3 border-t border-slate-800/50 z-10">
                <p className="text-[10px] text-slate-500 font-semibold mb-1">필요 데이터:</p>
                <p className="text-[10px] text-slate-400">{mod.dataReq}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
