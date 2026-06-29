import React from 'react';
import { useLocation } from 'react-router-dom';
import { Cpu, X, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AICopilotDock({ isOpen, onClose }) {
  const location = useLocation();

  if (!isOpen) return null;

  const getContextContent = () => {
    const path = location.pathname;

    if (path.startsWith('/vouchers')) {
      return {
        title: '회계 전표 관리 가이드',
        desc: '전표 작성 및 결재 진행 상태를 모니터링하고 증빙 검증 작업을 수행합니다.',
        warnings: [
          '복리후생비 및 식비 과목 지출 시 카드 영수증 증빙 확인 필수.',
          '5월 예산 초과 부서의 추가 전표 상신은 전결 승인자 사전 합의 권장.'
        ],
        actions: [
          '미첨부 전표 증빙 메일 자동 발송',
          '분기별 예산 실적 대비 분석표 출력'
        ],
        decisions: [
          '중등부 예산 초과 검토',
          '전표 승인 대기',
          '월 결산 확인'
        ]
      };
    }

    if (path.startsWith('/reports')) {
      return {
        title: '장부 및 결산 마감 분석',
        desc: '교회 통합 장부 잔액과 예산 대조 실적을 자동 분석 중입니다.',
        warnings: [
          '현재 일반회계 잔액과 주거래 은행 실 계좌 잔액 매핑 100% 정상.',
          '차기 추경 예산 편성 시 선교비 집행 비중 조정 필요 (당월 환율 영향).'
        ],
        actions: [
          '예산 통계 시각화 PDF 생성',
          '결산 마감 보고서 자동 상신'
        ],
        decisions: [
          '예산 한도액 증액 의사결정',
          '결산 마감 안건 상의'
        ]
      };
    }

    if (path.startsWith('/audit')) {
      return {
        title: '정기 감사 모니터링',
        desc: '감사 대상 전표들의 이상 징후 감지 및 내부 통제 준수 여부를 확인합니다.',
        warnings: [
          '동일 가맹점 분할 결재 건 의심 1건 감지 (회의비 과목).',
          '승인 지연 시간이 12시간을 경과한 미처리 결재선 존재.'
        ],
        actions: [
          '분할결재 의심 항목 정밀 분석',
          '감사 종합 의견서 초안 작성'
        ],
        decisions: [
          '의심 회의비 전표 불인가',
          '지연 결재 권한 위임'
        ]
      };
    }

    if (path.startsWith('/app/stock')) {
      return {
        title: 'Stock Think AI 가치평가',
        desc: '등록된 포트폴리오 자산의 실적 가치 평가 및 리스크 지수를 체크합니다.',
        warnings: [
          '관심 종목의 최근 분기 PER이 업계 평균 대비 15% 고평가 상태.',
          '외환 시장 변동성 확대에 따른 수출주 포트폴리오 리밸런싱 권장.'
        ],
        actions: [
          '기업 분기 실적 요약 리포트 생성',
          '매매 등급 의사결정 시뮬레이션'
        ],
        decisions: [
          '삼성전자 추가 포트폴리오 편입',
          '현금 비중 조정'
        ]
      };
    }

    if (path.startsWith('/app/estate')) {
      return {
        title: 'Estate Think 입지 분석',
        desc: '서울권 주요 재건축 프로젝트 시세 추이 및 부동산 거래 트렌드를 파악합니다.',
        warnings: [
          '목동 학군 지역의 평균 실거래가 갭 비율 소폭 축소 상태.',
          '지하철 신설 호재 지역의 인프라 접근성 평가 만족도 급상승.'
        ],
        actions: [
          '실거래가 변동 지도 뷰어로 전환',
          '단지별 입지 사분면 분석 자료 생성'
        ],
        decisions: [
          '목동 3단지 매매 거래 검토',
          '안전진단 통과 시점 모니터링'
        ]
      };
    }

    // Default or /app/church
    return {
      title: 'Platform OS 의사결정 요약',
      desc: 'BOOZA THINK 플랫폼을 활용해 중요한 의사결정 과제들을 검토하세요.',
      warnings: [
        '신길교회 대기 중인 전자결재 문서 3건이 있습니다.',
        '오늘의 AI 재정 통합 위험도 지수는 12% (안전) 입니다.'
      ],
      actions: [
        '전체 Workspace 활동 타임라인 확인',
        'AI Copilot 브리핑 실행'
      ],
      decisions: [
        '신길교회 예산 보정 의사결정',
        '삼성전자 배당 매수 시뮬레이션',
        '목동 아파트 매입 의사결정'
      ]
    };
  };

  const info = getContextContent();

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-slate-950/95 border-l border-slate-900 shadow-2xl z-50 transform transition-transform duration-300 flex flex-col justify-between p-5 font-sans backdrop-blur-md">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-5">
          <div className="flex items-center gap-2 text-indigo-400">
            <Cpu size={16} className="animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-200">AI Copilot Dock</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Context Content */}
        <div className="space-y-5">
          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest mb-1.5">
              Current Context
            </span>
            <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
              <Sparkles size={12} className="text-indigo-400 animate-spin" />
              {info.title}
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {info.desc}
            </p>
          </div>

          {/* Related Decisions */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">현재 화면 관련 의사결정</h4>
            <div className="space-y-1.5">
              {info.decisions.map((dec, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-indigo-950/20 rounded-xl border border-indigo-900/10 text-[9.5px] text-indigo-300 font-semibold">
                  <ShieldCheck size={11} className="text-indigo-400 shrink-0" />
                  <span>{dec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings / Analysis */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">AI 분석 경고 및 진단</h4>
            <div className="space-y-1.5">
              {info.warnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-slate-900/50 rounded-xl border border-slate-800/40 text-[9.5px] leading-relaxed text-slate-300">
                  <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">추천 자동화 작업</h4>
            <div className="space-y-1.5">
              {info.actions.map((act, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/15 hover:border-indigo-500 text-[10px] font-semibold text-indigo-300 hover:text-white transition-all flex items-center justify-between"
                >
                  <span>{act}</span>
                  <ArrowRight size={10} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[8px] text-slate-600 font-bold tracking-widest text-center pt-3 border-t border-slate-900">
        BOOZA THINK CONTEXTUAL ENGINE
      </div>
    </div>
  );
}
