import React from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

export default function StockDashboard() {
  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-6 mt-12">
      <div className="p-4 bg-church-500/10 border border-church-500/20 rounded-2xl inline-flex items-center justify-center">
        <TrendingUp size={48} className="text-church-400 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          Stock Think <Sparkles size={16} className="text-amber-400" />
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          인공지능 기반 주식 시황 및 종목 분석 서비스가 준비 중입니다.<br />
          향후 실시간 시장 데이터와 AI Engine을 결합하여 최적의 투자 의사결정을 돕습니다.
        </p>
      </div>
      <div className="glass p-4 rounded-xl text-[10px] text-slate-500">
        Status: Under Construction (Phase 5 Stub)
      </div>
    </div>
  );
}
