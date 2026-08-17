import { SectionHeader } from '../components/SectionHeader';

export default function StockMyPage() {
  return (
    <div className="space-y-8 pb-10">
      <SectionHeader title="관심 항목" description="내 관심 종목 및 스크랩한 분석" />
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        데이터 연동 준비 중입니다.
      </div>
    </div>
  );
}
