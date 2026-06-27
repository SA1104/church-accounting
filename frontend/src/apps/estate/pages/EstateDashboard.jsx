import React from 'react';
import { Home, Sparkles } from 'lucide-react';

export default function EstateDashboard() {
  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-6 mt-12">
      <div className="p-4 bg-church-500/10 border border-church-500/20 rounded-2xl inline-flex items-center justify-center">
        <Home size={48} className="text-church-400 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          Estate Think <Sparkles size={16} className="text-amber-400" />
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          부동산 시세 분석 및 자산 추적 서비스가 준비 중입니다.<br />
          향후 국토교통부 실거래 데이터 및 지역 트렌드 AI 분석을 지원합니다.
        </p>
      </div>
      <div className="glass p-4 rounded-xl text-[10px] text-slate-500">
        Status: Under Construction (Phase 5 Stub)
      </div>
    </div>
  );
}
