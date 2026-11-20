'use strict';

/**
 * 고객 공감 투표 및 우선 제작 대기 중인 차기 계산기 후보 목록
 * - 모든 문구는 방문자 눈높이의 쉬운 일상어로 작성한다.
 */
const SEED_TOOL_IDEAS = [
  {
    slug: 'franchise-vs-independent',
    categoryLabel: '창업 비교',
    title: '프랜차이즈 가맹점 vs 개인 독립매장 3년 실제 남는 돈 비교기',
    desc: '가맹비·교육비·본사 물류마진·로열티·강제 리모델링 비용까지 다 넣었을 때, 유명 프랜차이즈와 내 브랜드 개인 매장 중 3년 뒤 통장에 어디가 더 남는지 비교합니다.',
    baseVotes: 142,
    status: 'building'
  },
  {
    slug: 'severance-annual-leave',
    categoryLabel: '직원 · 노무',
    title: '직원 · 알바 1년 이상 근무 시 퇴직금 · 연차수당 월별 적립 계산기',
    desc: '1년 딱 채우고 퇴사할 때 목돈으로 나가는 퇴직금과 미사용 연차수당을 매달 얼마씩 미리 떼어두어야 당황하지 않는지 계산합니다.',
    baseVotes: 118,
    status: 'voting'
  },
  {
    slug: 'co-founder-equity-split',
    categoryLabel: '동업 · 지분',
    title: '공동창업(동업) 투자금 · 일하는 시간별 공정한 지분 & 수익 배분기',
    desc: '돈을 더 낸 사람과 가게에서 직접 몸으로 뛰는 사람 사이에 싸움 나지 않는 지분율, 월 급여 책정, 중도 탈퇴 시 정산 기준을 계산합니다.',
    baseVotes: 96,
    status: 'voting'
  },
  {
    slug: 'store-exit-transfer-vs-close',
    categoryLabel: '양도 · 정리',
    title: '가게 권리금 받고 넘기기 vs 정부 철거지원금 받고 정리하기 비교기',
    desc: '권리금 양도 시 내는 기타소득세·중개수수료와, 폐업 시 희망리턴패키지 철거비 지원금(최대 600만원)·원상복구 비용 중 어느 쪽이 손해를 줄이는지 따져봅니다.',
    baseVotes: 89,
    status: 'voting'
  },
  {
    slug: 'corp-conversion-breakeven',
    categoryLabel: '절세 · 법인전환',
    title: '개인사업자 유지 vs 법인 전환 세금 · 건보료 실수령 비교기',
    desc: '매출과 순이익이 어느 선을 넘을 때 높은 종합소득세(최대 45%)와 지역 건보료 대신 법인으로 바꾸어 대표자 급여·배당으로 받는 게 유리한지 찾아줍니다.',
    baseVotes: 84,
    status: 'voting'
  },
  {
    slug: 'sns-group-buy-margin',
    categoryLabel: '온라인 판매',
    title: '인스타 · 스레드 공동구매(공구) 인플루언서 수수료 정산 마진 계산기',
    desc: '인플루언서 판매 수수료(20~35%), 카드결제 대행 수수료, 무료배송 택배비, 사은품 원가를 빼고 제조·사입 사장님께 실제로 얼마가 남는지 계산합니다.',
    baseVotes: 77,
    status: 'voting'
  },
  {
    slug: 'academy-tutor-split',
    categoryLabel: '학원 · 교습소',
    title: '학원 · 교습소 · 스튜디오 수강생 수별 강사 비율제 급여 & 방학 손익 계산기',
    desc: '기본급 vs 5:5 비율제 강사료 구조와 셔틀차량·교재비, 학기 중·방학 특강 인원 변동에 따른 원장님 실제 순수익을 계산합니다.',
    baseVotes: 68,
    status: 'voting'
  },
  {
    slug: 'biz-car-lease-vs-buy',
    categoryLabel: '차량 · 경비처리',
    title: '사업자 차량(장기렌트 · 리스 · 할부 구매) 부가세 환급 & 경비처리 비교기',
    desc: '경차·9인승·화물차 부가세 10% 매입세액 공제 여부와 연간 1,500만원 업무용 승용차 경비 인정 한도를 반영해 가장 유리한 차량 이용법을 계산합니다.',
    baseVotes: 63,
    status: 'voting'
  }
];

module.exports = { SEED_TOOL_IDEAS };
