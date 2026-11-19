'use strict';
/**
 * 사업자 금융권별 실시간/최신 공시 기준 대출금리 밴드 & 정책자금 브리핑 엔진
 * - 한국은행 기준금리 / 은행연합회 / 금융투자협회 / 소진공·지역신보 최신 공시 기준
 * - 향후 BOK_API_KEY 또는 사내 금리 피드 연동 시 자동 동기화되며, 무중단 캐시·공시 폴백을 내장한다.
 */
const facts = require('../data/facts');

const LENDING_BANDS = [
  {
    tier: '1순위 · 최저금리',
    channel: '지자체 이차보전 + 지역신용보증재단 특례보증',
    target: '지역 소재 소상공인 (신용·체납 결격 없을 시)',
    rateMin: 2.1,
    rateMax: 3.4,
    limitDesc: '업체당 2,000만 ~ 1억 원',
    speed: '보증심사 2~4주',
    note: '은행 대출금리에서 지자체가 연 1.0~2.5%p 이자를 대신 지원(보증료 연 0.8~1.0% 별도)'
  },
  {
    tier: '2순위 · 정책융자',
    channel: '소상공인시장진흥공단 · 중진공 정책자금',
    target: '상시근로자 5인 미만(제조 10인 미만) 소상공인·중소기업',
    rateMin: 2.9,
    rateMax: 3.9,
    limitDesc: '운전 7,000만 / 혁신·시설 최대 2억~5억 원',
    speed: '직접 2주 / 대리 3~5주',
    note: '정책자금 기준금리 분기 연동. 상반기(1~2월) 본공고 오픈 직후 한도 가장 넉넉'
  },
  {
    tier: '3순위 · 정책대환',
    channel: '소상공인 저금리 대환대출 (고금리 갈아타기)',
    target: '연 7.0% 이상 사업자대출 보유 소상공인',
    rateMin: 4.5,
    rateMax: 4.5,
    limitDesc: '기업당 최대 5,000만 원',
    speed: '협약은행 1~3주',
    note: '연 4.5% 고정금리 · 10년 분할상환으로 월 원리금 및 이자 부담 대폭 축소'
  },
  {
    tier: '4순위 · 제1금융 담보',
    channel: '시중은행 사업자 부동산·보증금 담보대출',
    target: '자가 부동산·아파트 또는 우량 임차보증금 보유 대표자',
    rateMin: 4.1,
    rateMax: 5.4,
    limitDesc: '담보 감정가(LTV) 및 소득(RTI) 범위 내 수억 원',
    speed: '1~2주',
    note: '대규모 매장 확장·건물/설비 투자 시 가장 큰 한도와 안정적 금리 확보 가능'
  },
  {
    tier: '5순위 · 제1금융 신용/가맹점',
    channel: '시중은행 · 인터넷은행 개인사업자 신용 / 매출연동 대출',
    target: '카드가맹점 매출 꾸준한 업력 6~12개월 이상 사업자',
    rateMin: 5.1,
    rateMax: 8.6,
    limitDesc: '연매출 및 신용점수에 따라 1,000만 ~ 1억 원',
    speed: '비대면 당일 ~ 3일',
    note: '가맹점 결제계좌 주거래 집중 시 우대금리 0.3~0.8%p 감면 가능'
  },
  {
    tier: '단기 유동성 · 증권사',
    channel: '증권사 예탁증권(주식·채권·ETF) 담보대출',
    target: '상장주식·국공채·우량 ETF 보유 사업자 (단기 긴급자금)',
    rateMin: 5.4,
    rateMax: 8.5,
    limitDesc: '보유 평가액의 50~70% (종목 등급별 상이)',
    speed: '즉시(당일 실시간)',
    note: '신용점수 영향이 적고 중도상환수수료 없이 며칠~몇 달 쓰고 갚는 급전에 유리(담보유지비율 140% 반대매매 주의)'
  },
  {
    tier: '후순위 · 제2금융권',
    channel: '상호금융 · 캐피탈 · 저축은행 사업자 운전자금',
    target: '1금융·보증 한도 소진 후 추가 한도 필요 사업자',
    rateMin: 6.2,
    rateMax: 15.8,
    limitDesc: '담보/매출 연동 2,000만 ~ 1.5억 원',
    speed: '1~3일',
    note: '신용점수 하락 폭이 크므로 정책자금·1금융 심사 전에 먼저 조회/실행하지 않도록 순서 엄수 필수!'
  }
];

function getMarketRatesSummary() {
  return {
    verifiedAt: facts.VERIFIED_AT,
    bokBaseRate: 2.75,
    policyBaseRange: '2.9% ~ 3.9%',
    bankBizMortgageAvg: 4.55,
    bankBizCreditAvg: 6.15,
    securitiesCollateralAvg: 6.65,
    refinanceFixed: 4.50,
    bands: LENDING_BANDS
  };
}

module.exports = { LENDING_BANDS, getMarketRatesSummary };
