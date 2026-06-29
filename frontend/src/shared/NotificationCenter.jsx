import React, { useState } from 'react';
import { Bell, Clock, Cpu, X, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'activity'

  const notifications = [
    { id: 1, title: 'AI 분석 완료', desc: '신길교회 6월 재정 분석 레포트 생성이 완료되었습니다.', time: '10분 전', type: 'AI', icon: <Cpu size={14} className="text-purple-400" /> },
    { id: 2, title: '전표 승인 대기', desc: '김재직 집사가 상신한 전표 1건의 최종 결재가 대기 중입니다.', time: '30분 전', type: 'Approval', icon: <FileText size={14} className="text-amber-400" /> },
    { id: 3, title: '예산 초과 경고', desc: '중등부 여름 행사 지출 금액이 예산을 12% 초과하였습니다.', time: '2시간 전', type: 'Risk Alert', icon: <AlertTriangle size={14} className="text-rose-400" /> },
    { id: 4, title: '보고서 자동 검토', desc: '분기 감사 보고서 초안에 대한 피드백 작성이 완료되었습니다.', time: '5시간 전', type: 'Report', icon: <ShieldCheck size={14} className="text-emerald-400" /> }
  ];

  const activities = [
    { time: '오늘 09:10', action: '전표 작성', detail: '교육부 간식비 지출 전표 25,000원 등록', user: '나종민 전도사' },
    { time: '오늘 09:20', action: 'AI 재정 분석', detail: '당월 지출 추이 검토 및 이상 징후 분석 완료', user: 'AI Copilot' },
    { time: '오늘 09:32', action: '결재 요청', detail: '담임목사 감사비 결재선 상신', user: '조상연 장로' },
    { time: '오늘 09:45', action: '보고서 생성', detail: '6월 재정 결산서 자동 리포트 빌드', user: '시스템 자동화' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-slate-950/95 border-l border-slate-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col justify-between p-5 font-sans backdrop-blur-md">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Bell size={16} />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-200">Platform Hub</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 mb-5 text-[10px]">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'notifications' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            알림 피드
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'activity' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            최근 활동 타임라인
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'notifications' ? (
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto no-scrollbar">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/40 text-[10px] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    {n.icon}
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    {n.type}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">{n.desc}</p>
                <div className="flex items-center gap-1 text-[8px] text-slate-500">
                  <Clock size={10} />
                  <span>{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-[420px] overflow-y-auto no-scrollbar pl-2.5 border-l border-slate-800">
            {activities.map((act, idx) => (
              <div key={idx} className="relative space-y-1">
                {/* Timeline dot */}
                <div className="absolute -left-[14.5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 border border-slate-950 shadow-lg shadow-indigo-500/20" />
                
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-indigo-400 font-mono">{act.time}</span>
                  <span className="text-[8.5px] text-slate-500 font-semibold">{act.user}</span>
                </div>
                <h4 className="text-[10px] font-bold text-slate-200">{act.action}</h4>
                <p className="text-[9.5px] text-slate-400 leading-normal">{act.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[8px] text-slate-600 font-bold tracking-widest text-center pt-3 border-t border-slate-900">
        BOOZA THINK PLATFORM SHELL
      </div>
    </div>
  );
}
