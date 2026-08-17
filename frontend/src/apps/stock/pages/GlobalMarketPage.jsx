import { SectionHeader } from '../components/SectionHeader';

export default function GlobalMarketPage() {
  return (
    <div className="space-y-8 pb-10">
      <SectionHeader title="글로벌 시장" description="미국 시장 지수 및 거시경제 지표" />
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        데이터 연동 준비 중입니다.
      </div>
    </div>
  );
}
