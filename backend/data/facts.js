'use strict';
/**
 * BoozaThink 2026 마스터 팩트 데이터 (단일 진실 공급원)
 * - 계산기 프리셋, 바이블 아티클, llms.txt 팩트시트가 모두 이 파일을 참조한다.
 * - 수치는 2026년 공시·공고 기준의 대표값이며, 사장님 개별 계약/공고 차수에 따라 달라질 수 있다.
 */

const VERIFIED_AT = '2026-11-19';

const DELIVERY_PLANS = [
  { id: 'baemin-78', name: '배민 상생요금제 1구간 (매출 상위 35%)', fee: 7.8, dfee: 3400, note: '중개이용료 7.8% · 업주부담 배달비 2,400~3,400원 (VAT 별도)' },
  { id: 'baemin-68a', name: '배민 상생요금제 2구간 (상위 35~50%)', fee: 6.8, dfee: 3100, note: '중개이용료 6.8% · 배달비 2,100~3,100원' },
  { id: 'baemin-68b', name: '배민 상생요금제 3구간 (상위 50~80%)', fee: 6.8, dfee: 2900, note: '중개이용료 6.8% · 배달비 1,900~2,900원' },
  { id: 'baemin-20', name: '배민 상생요금제 4구간 (하위 20%)', fee: 2.0, dfee: 1900, note: '중개이용료 2.0% · 배달비 1,900~2,900원' },
  { id: 'baemin-store', name: '배민 가게배달 (오픈리스트형)', fee: 6.8, dfee: 0, note: '중개이용료 6.8% · 배달대행비는 사장님이 별도 계약(대행비 입력)' },
  { id: 'coupang-98', name: '쿠팡이츠 스마트요금제 (기존 9.8%)', fee: 9.8, dfee: 2900, note: '구 스마트요금제 기준 9.8%. 상생요금제 전환 시 2.0~7.8% 구간 적용(월 마감 후 차액 환급)' },
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

const WAGE = {
  minHourly2026: 10320,
  minHourly2025: 10030,
  monthly209h2026: 2156880,
  weeksPerMonth: 4.345,
  holidayThresholdHours: 15
};

// 2026 4대보험 사업주 부담률 (%, 근로자 보수 대비)
const INSURANCE_EMPLOYER = {
  pension: 4.75,          // 국민연금 9.5%의 절반
  health: 3.595,          // 건강보험 7.19%의 절반
  longTermCareOfHealth: 13.14, // 장기요양 = 건강보험료 × 13.14% (반반 부담)
  employment: 0.9 + 0.25, // 실업급여 0.9% + 고용안정·직능 0.25%(150인 미만)
  accident: 0.9           // 산재 업종별 상이(음식·도소매 대표값 0.7~1.0%)
};
INSURANCE_EMPLOYER.longTermCare = +(INSURANCE_EMPLOYER.health * INSURANCE_EMPLOYER.longTermCareOfHealth / 100).toFixed(4);
INSURANCE_EMPLOYER.total = +(INSURANCE_EMPLOYER.pension + INSURANCE_EMPLOYER.health + INSURANCE_EMPLOYER.longTermCare + INSURANCE_EMPLOYER.employment + INSURANCE_EMPLOYER.accident).toFixed(3);

const POLICY = {
  refinanceRate: 4.5,
  refinanceMinCurrentRate: 7.0,
  refinanceLimitManwon: 5000,
  refinanceYears: 10,
  smartStoreSubsidyRateGeneral: 70,
  smartStoreSubsidyRateMin: 50,
  smartStoreSubsidyCapManwon: 500,
  storeDemolitionCapManwon: 600,
  vatSimplifiedThresholdManwon: 10400
};

const POLICY_PROGRAMS = [
  {
    id: 'semas-general',
    name: '소진공 일반경영안정자금 (대리대출)',
    org: '소상공인시장진흥공단 → 지역신보 보증서 → 시중은행',
    limit: '업체당 최대 7,000만 원',
    rate: '정책자금 기준금리 연동 (연 3%대 중후반, 분기 고시)',
    term: '5년 (2년 거치 3년 분할상환)',
    where: '소상공인정책자금 누리집 ols.semas.or.kr',
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
    term: '연중 차수별 공고, 약정 후 2년 의무 사용',
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
    term: '연 1~2회 모집',
    where: '신사업창업사관학교 누리집',
    docs: ['사업계획서', '신분증', '교육 이수 계획'],
    match: { preOnly: true }
  }
];

const SOURCES = [
  { name: '소상공인시장진흥공단 (정책자금·스마트상점·희망리턴패키지)', url: 'https://www.semas.or.kr' },
  { name: '소상공인24', url: 'https://www.sbiz24.kr' },
  { name: '공정거래위원회 (배달플랫폼 상생협의체·가맹사업 정보공개서)', url: 'https://www.ftc.go.kr' },
  { name: '국세청 (부가가치세·간이과세·종합소득세)', url: 'https://www.nts.go.kr' },
  { name: '고용노동부 (최저임금·주휴수당·근로기준법)', url: 'https://www.moel.go.kr' },
  { name: '최저임금위원회', url: 'https://www.minimumwage.go.kr' },
  { name: '국민건강보험공단 4대사회보험 정보연계센터', url: 'https://www.4insure.or.kr' },
  { name: '중소벤처기업진흥공단', url: 'https://www.kosmes.or.kr' }
];

const FX_FALLBACK = { CNY: 194.5, USD: 1405.0, source: 'BoozaThink 서버 폴백 환율', updated_at_kst: VERIFIED_AT };

module.exports = { VERIFIED_AT, DELIVERY_PLANS, MARKETS, WAGE, INSURANCE_EMPLOYER, POLICY, POLICY_PROGRAMS, SOURCES, FX_FALLBACK };
