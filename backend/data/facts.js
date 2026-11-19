'use strict';
/**
 * BoozaThink 2026–2027 마스터 팩트 데이터 (단일 진실 공급원)
 * - 단순 연도 치환이 아닌, 현행(2026년 적용) 수치와 정부 확정 고시(2027.1.1 시행) 수치를 병기·전환 지원한다.
 * - 날짜(시스템 시각)에 따라 연말 전환기 안내 및 2027년 도래 시 기본값 자동 전환을 수행한다.
 */

const VERIFIED_AT = '2026-11-19';

function currentYearMode(now) {
  const d = now || new Date();
  return d.getFullYear() >= 2027 ? 2027 : 2026;
}

function getSeasonContext(now) {
  const d = now || new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  if (y === 2026 && m >= 11) {
    return {
      badge: '2026 연말결산 · 2027 확정고시 반영',
      headline: '2027.1.1 최저시급 10,700원·국민연금 10% 시행 확정 & 1월 부가세·상반기 정책자금 준비 시즌',
      detail: '현재(2026년 말) 급여·정산에는 2026년 기준이 적용되며, 2027년 1월 1일 근무분부터 최저시급 10,700원(고용노동부 고시 제2026-60호)과 국민연금 10%(사업주 5.0%), 장기요양 13.90%가 적용됩니다. 정책자금은 당해연도 예산 소진 여부를 확인하고 1~2월 상반기 1차 본공고 서류를 미리 준비하세요.'
    };
  }
  if (y >= 2027 && m <= 2) {
    return {
      badge: '2027 시행 기준 적용 중',
      headline: '2027 최저시급 10,700원 시행 · 1월 부가세 확정신고 & 상반기 정책자금 본공고 시즌',
      detail: '2027년 1월 1일부터 최저시급 10,700원·국민연금 10%가 적용됩니다. 1월 25일까지 직전 과세기간 부가가치세 확정신고 기한이며, 소진공·지역신보·스마트상점 상반기 1차 공고가 순차 오픈됩니다.'
    };
  }
  return {
    badge: `${y} 최신 고시 반영`,
    headline: `${y}년 공식 수수료·세법·최저임금·정책자금 데이터 기준`,
    detail: '플랫폼 공시 요율 및 정부 부처 고시 기준 데이터를 바탕으로 시뮬레이션합니다.'
  };
}

const DELIVERY_PLANS = [
  { id: 'baemin-78', name: '배민 상생요금제 1구간 (매출 상위 35%)', fee: 7.8, dfee: 3400, note: '중개이용료 7.8% · 업주부담 배달비 2,400~3,400원 (VAT 별도, 상생요금제 합의안 유지)' },
  { id: 'baemin-68a', name: '배민 상생요금제 2구간 (상위 35~50%)', fee: 6.8, dfee: 3100, note: '중개이용료 6.8% · 배달비 2,100~3,100원' },
  { id: 'baemin-68b', name: '배민 상생요금제 3구간 (상위 50~80%)', fee: 6.8, dfee: 2900, note: '중개이용료 6.8% · 배달비 1,900~2,900원' },
  { id: 'baemin-20', name: '배민 상생요금제 4구간 (하위 20%)', fee: 2.0, dfee: 1900, note: '중개이용료 2.0% · 배달비 1,900~2,900원' },
  { id: 'baemin-store', name: '배민 가게배달 (오픈리스트형)', fee: 6.8, dfee: 0, note: '중개이용료 6.8% · 배달대행비는 사장님이 별도 계약(대행비 입력)' },
  { id: 'coupang-98', name: '쿠팡이츠 스마트요금제 (기존 9.8%)', fee: 9.8, dfee: 2900, note: '구 스마트요금제 기준 9.8%. 상생요금제 적용 시 2.0~7.8% 구간(월 마감 후 차액 환급)' },
  { id: 'yogiyo-97', name: '요기요 기본 중개수수료 9.7%', fee: 9.7, dfee: 2900, note: '요기요 기본형 9.7% (요기배달 이용 시 배달비 별도)' },
  { id: 'custom', name: '직접 입력', fee: 7.0, dfee: 3000, note: '사장님 계약서상 요율을 직접 입력' }
];

const MARKETS = [
  { id: 'ss-naver', name: '네이버 스마트스토어 (네이버 유입)', feeRate: 3.63 + 3.0, fixedPerUnit: 0, logistics: false, note: 'Npay 주문관리 3.63%(일반, VAT포함) + 판매수수료 3%(VAT포함, 공급가 2.73%)' },
  { id: 'ss-mkt', name: '네이버 스마트스토어 (판매자 마케팅 유입)', feeRate: 3.63 + 1.0, fixedPerUnit: 0, logistics: false, note: 'Npay 주문관리 3.63% + 판매자 마케팅 판매수수료 1%(공급가 0.91%)' },
  { id: 'ss-small', name: '스마트스토어 영세(반기매출 3억 이하)', feeRate: 1.947 + 3.0, fixedPerUnit: 0, logistics: false, note: 'Npay 주문관리 1.947%(영세) + 판매수수료 3%' },
  { id: 'cp-wing', name: '쿠팡 윙 (판매자 배송)', feeRate: 10.8, fixedPerUnit: 0, logistics: false, note: '카테고리별 판매수수료 4~10.9%(대부분 10.8%, VAT 별도). 월 매출 100만원↑ 시 서버이용료 월 5.5만원' },
  { id: 'cp-rg', name: '쿠팡 로켓그로스', feeRate: 10.8, fixedPerUnit: 3100, logistics: true, note: '판매수수료 + 입출고·배송비(소형 기준 약 2,800~3,400원/개) + 보관료(일 단위)' }
];

// 2026 현행 vs 2027 확정 고시(고용노동부 고시 제2026-60호) 최저임금
const WAGE_BY_YEAR = {
  2026: { year: 2026, minHourly: 10320, monthly209h: 2156880, yoyPct: 2.9, status: '2026.1.1~12.31 현행 적용' },
  2027: { year: 2027, minHourly: 10700, monthly209h: 2236300, yoyPct: 3.7, status: '2027.1.1 시행 확정 (고용노동부 고시 제2026-60호)' }
};

const WAGE = {
  minHourly2025: 10030,
  minHourly2026: 10320,
  minHourly2027: 10700,
  monthly209h2026: 2156880,
  monthly209h2027: 2236300,
  weeksPerMonth: 4.345,
  holidayThresholdHours: 15
};

// 2026 vs 2027 4대보험 사업주 부담률 (%, 근로자 보수 대비)
function buildEmployerIns(pensionHalf, healthHalf, ltcOfHealthPct) {
  const longTermCare = +(healthHalf * ltcOfHealthPct / 100).toFixed(4);
  const employment = 1.15; // 실업급여 0.9% + 고용안정·직능 0.25%(150인 미만)
  const accident = 0.9;    // 산재 업종별 상이(음식·도소매 대표값 약 0.9%)
  const total = +(pensionHalf + healthHalf + longTermCare + employment + accident).toFixed(3);
  return { pension: pensionHalf, health: healthHalf, longTermCareOfHealth: ltcOfHealthPct, longTermCare, employment, accident, total };
}

const INSURANCE_BY_YEAR = {
  2026: buildEmployerIns(4.75, 3.595, 13.14), // 국민연금 총 9.5%, 건보 7.19%, 장기요양 건보료의 13.14% -> 사업주 합계 10.867%
  2027: buildEmployerIns(5.00, 3.595, 13.90)  // 국민연금 총 10.0%(연금개혁 +0.5%p), 건보 7.19%(동결), 장기요양 13.90% -> 사업주 합계 11.145%
};
const INSURANCE_EMPLOYER = INSURANCE_BY_YEAR[2026];

// 부가가치세 & 종합소득세 마스터 (국세청 기준)
const VAT_VALUE_RATES = [
  { id: 'food', name: '음식점·카페·배달외식 (부가가치율 15%)', rate: 15, cardCreditEligible: true },
  { id: 'retail', name: '소매업·스마트스토어·쿠팡 셀러 (부가가치율 15%)', rate: 15, cardCreditEligible: true },
  { id: 'mfg', name: '제조업·제과점·소공인 (부가가치율 20%)', rate: 20, cardCreditEligible: true },
  { id: 'service', name: '개인서비스·미용·세탁·숙박외 (부가가치율 30%)', rate: 30, cardCreditEligible: true },
  { id: 'rent', name: '부동산임대·전문서비스 (부가가치율 40%, 간이 배제 주의)', rate: 40, cardCreditEligible: false }
];

// 종합소득세 8단계 과세표준 구간 (단위: 원, 세율 %, 누진공제액 원)
const INCOME_TAX_BRACKETS = [
  { upTo: 14000000, rate: 6, deduction: 0 },
  { upTo: 50000000, rate: 15, deduction: 1260000 },
  { upTo: 88000000, rate: 24, deduction: 5760000 },
  { upTo: 150000000, rate: 35, deduction: 15440000 },
  { upTo: 300000000, rate: 38, deduction: 19940000 },
  { upTo: 500000000, rate: 40, deduction: 25940000 },
  { upTo: 1000000000, rate: 42, deduction: 35940000 },
  { upTo: Infinity, rate: 45, deduction: 65940000 }
];

// 노란우산공제 소득공제 한도 (사업소득금액 기준)
const YELLOW_UMBRELLA_CAPS = [
  { maxIncome: 40000000, cap: 6000000 },
  { maxIncome: 60000000, cap: 5000000 },
  { maxIncome: 100000000, cap: 4000000 },
  { maxIncome: Infinity, cap: 2000000 }
];

// 상가건물 임대차보호법 시행령 지역별 환산보증금 기준액 (단위: 만원)
const LEASE_REGIONS = [
  { id: 'seoul', name: '서울특별시 (9억원 이하)', capManwon: 90000 },
  { id: 'metro-overcrowded', name: '수도권 과밀억제권역·부산광역시 (6억 9천만원 이하)', capManwon: 69000 },
  { id: 'metro-major', name: '광역시·세종·용인·화성·김포·안산·파주·광주 (5억 4천만원 이하)', capManwon: 54000 },
  { id: 'other', name: '그 밖의 지역 (3억 7천만원 이하)', capManwon: 37000 }
];

const POLICY = {
  refinanceRate: 4.5,
  refinanceMinCurrentRate: 7.0,
  refinanceLimitManwon: 5000,
  refinanceYears: 10,
  smartStoreSubsidyRateGeneral: 70,
  smartStoreSubsidyRateMin: 50,
  smartStoreSubsidyCapManwon: 500,
  storeDemolitionCapManwon: 600,
  vatSimplifiedThresholdManwon: 10400,
  vatExemptThresholdManwon: 4800,
  cardTaxCreditRate: 1.3,
  cardTaxCreditCapKRW: 10000000,
  commercialRentCapPct: 5.0
};

const POLICY_PROGRAMS = [
  {
    id: 'semas-general',
    name: '소진공 일반경영안정자금 (대리대출)',
    org: '소상공인시장진흥공단 → 지역신보 보증서 → 시중은행',
    limit: '업체당 최대 7,000만 원',
    rate: '정책자금 기준금리 연동 (연 3%대 중후반, 분기별 고시)',
    term: '5년 (2년 거치 3년 분할상환)',
    where: '소상공인정책자금 누리집 ols.semas.or.kr (연말 예산 소진 시 익년 1~2월 1차 공고 접수)',
    docs: ['사업자등록증명', '부가세과세표준증명 또는 매출증빙', '국세·지방세 완납증명', '임대차계약서', '신분증'],
    match: { minAge: 'lt1', industries: ['food', 'retail', 'mfg', 'service'], maxEmp: 'lt5mfg' }
  },
  {
    id: 'semas-innovation',
    name: '소진공 혁신성장촉진자금 (스마트기술 도입·수출 소공인)',
    org: '소상공인시장진흥공단 (직접대출 위주)',
    limit: '업체당 최대 2억 원 (운전 1억)',
    rate: '정책자금 기준금리 + 0.2%p 내외',
    term: '5년 (2년 거치 3년 분할)',
    where: '소상공인정책자금 누리집 ols.semas.or.kr',
    docs: ['사업자등록증명', '스마트기술 도입 견적서 또는 확인서', '재무제표/부가세증명', '납세증명'],
    match: { minAge: 'lt3', industries: ['food', 'retail', 'mfg', 'service'], needsKioskOrMfg: true }
  },
  {
    id: 'semas-refinance',
    name: '소상공인 저금리 대환대출 (연 7%↑ → 연 4.5% 고정)',
    org: '소상공인시장진흥공단 · 신용보증기금 협약은행',
    limit: '기업당 최대 5,000만 원',
    rate: '연 4.5% 고정',
    term: '10년 분할상환',
    where: '소상공인정책자금 누리집 / 협약 시중은행',
    docs: ['기존 대출 거래내역서(금리 확인)', '사업자등록증명', '부가세과세표준증명', '대표자 신분증'],
    match: { needsHighLoan: true }
  },
  {
    id: 'kodit-regional',
    name: '지역신용보증재단 소상공인 특례보증',
    org: '서울·경기·부산 등 17개 지역신보 (+ 지자체 이차보전)',
    limit: '업체당 2,000만~1억 원 (지자체별 상이)',
    rate: '은행 대출금리 – 지자체 이차보전 1.0~2.5%p, 보증료 연 0.8~1.2%',
    term: '1~5년 (일시 또는 분할)',
    where: '각 지역신용보증재단 앱(보증드림 등) / 지점',
    docs: ['사업자등록증명', '매출 증빙', '임대차계약서', '국세·지방세 완납증명'],
    match: { minAge: 'lt1' }
  },
  {
    id: 'kosmes',
    name: '중진공 신시장진출·혁신창업사업화자금',
    org: '중소벤처기업진흥공단',
    limit: '연간 최대 5억~60억 원 (사업별 상이)',
    rate: '정책자금 기준금리 ± 가산 (연 2~3%대)',
    term: '5~10년',
    where: '중소벤처24 / 중진공 지역본부',
    docs: ['사업계획서', '재무제표 3개년', '사업자등록증', '기술·인증 자료'],
    match: { industries: ['mfg', 'retail'], minSalesManwon: 30000 }
  },
  {
    id: 'smart-store',
    name: '소상공인 스마트상점 기술보급사업 (키오스크·테이블오더·서빙로봇)',
    org: '중소벤처기업부 · 소상공인시장진흥공단',
    limit: '점포당 국비 최대 500만 원 (공급가 50~70% 지원)',
    rate: '보조금 (상환 의무 없음)',
    term: '차수별 공고 접수 (통상 상반기 1차 모집 집중), 약정 후 2년 의무 사용',
    where: '소상공인 스마트상점 누리집 / 소상공인24',
    docs: ['사업자등록증명', '공급업체 견적서', '점포 사진', '국세·지방세 완납증명'],
    match: { needsKiosk: true }
  },
  {
    id: 'hope-return',
    name: '희망리턴패키지 (경영개선·폐업·재기 지원)',
    org: '소상공인시장진흥공단 · 소상공인24',
    limit: '점포철거비 최대 600만 원, 사업정리 컨설팅, 재창업·취업 교육·전직장려수당',
    rate: '보조금 / 무상 지원',
    term: '사전 신청·승인 필수 (철거 완료 후 신청 불가)',
    where: '소상공인24 sbiz24.kr / 희망리턴패키지 누리집',
    docs: ['폐업(예정) 사실증명', '임대차계약서', '철거업체 견적서', '사업자등록증명(60일 이상 운영)'],
    match: { distressed: true }
  },
  {
    id: 'startup-academy',
    name: '신사업창업사관학교 + 연계 창업자금',
    org: '소상공인시장진흥공단',
    limit: '점포경영 체험·교육 + 사업화 보조금 최대 4,000만 원(자부담 50%)',
    rate: '보조금 + 정책자금 연계',
    term: '연 1~2회 모집 (상반기 주력)',
    where: '신사업창업사관학교 누리집',
    docs: ['사업계획서', '신분증', '교육 이수 계획'],
    match: { preOnly: true }
  }
];

const SOURCES = [
  { name: '소상공인시장진흥공단 (정책자금·스마트상점·희망리턴패키지)', url: 'https://www.semas.or.kr' },
  { name: '소상공인24 (통합지원 플랫폼)', url: 'https://www.sbiz24.kr' },
  { name: '공정거래위원회 (배달플랫폼 상생협의체·가맹사업 정보공개서)', url: 'https://www.ftc.go.kr' },
  { name: '국세청 (부가가치세·간이과세·종합소득세)', url: 'https://www.nts.go.kr' },
  { name: '고용노동부 (2026·2027 최저임금 고시·근로기준법)', url: 'https://www.moel.go.kr' },
  { name: '최저임금위원회', url: 'https://www.minimumwage.go.kr' },
  { name: '국민건강보험공단 · 4대사회보험 정보연계센터', url: 'https://www.4insure.or.kr' },
  { name: '법제처 국가법령정보센터 (상가건물 임대차보호법 시행령)', url: 'https://www.law.go.kr' },
  { name: '중소기업중앙회 노란우산', url: 'https://www.8899.or.kr' }
];

const FX_FALLBACK = { CNY: 194.5, USD: 1405.0, source: 'BoozaThink 서버 폴백 환율', updated_at_kst: VERIFIED_AT };

module.exports = {
  VERIFIED_AT, currentYearMode, getSeasonContext,
  DELIVERY_PLANS, MARKETS,
  WAGE, WAGE_BY_YEAR, INSURANCE_EMPLOYER, INSURANCE_BY_YEAR,
  VAT_VALUE_RATES, INCOME_TAX_BRACKETS, YELLOW_UMBRELLA_CAPS, LEASE_REGIONS,
  POLICY, POLICY_PROGRAMS, SOURCES, FX_FALLBACK
};
