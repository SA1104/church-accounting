import React from 'react';
import { Globe, Sparkles } from 'lucide-react';

export default function MissionDashboard() {
  return (
    <div className="p-6 max-w-lg mx-auto text-center space-y-6 mt-12">
      <div className="p-4 bg-church-500/10 border border-church-500/20 rounded-2xl inline-flex items-center justify-center">
        <Globe size={48} className="text-church-400 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
          Mission Think <Sparkles size={16} className="text-amber-400" />
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          국내외 선교 현지 협력 및 선교 후원자 연동 서비스가 준비 중입니다.<br />
          지리적 선교 프로젝트 관리 및 실시간 소통 인프라를 마련할 예정입니다.
        </p>
      </div>
      <div className="glass p-4 rounded-xl text-[10px] text-slate-500">
        Status: Under Construction (Phase 5 Stub)
      </div>
    </div>
  );
}
