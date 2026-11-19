'use strict';
/**
 * BoozaThink 6대 시뮬레이터 & 16종 미니 계산기 수학·세법·노무 정밀 검산 테스트 (verify_math.js)
 */
const E = require('../public/js/calc-engine.js');

let passed = 0;
let failed = 0;

function approx(actual, expected, tol, label) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= tol;
  if (ok) {
    passed++;
    console.log(`  [PASS] ${label}: ${actual} ≈ ${expected}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label}: got ${actual}, expected ${expected} (±${tol})`);
  }
}

function equal(actual, expected, label) {
  if (actual === expected) {
    passed++;
    console.log(`  [PASS] ${label}: ${actual}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label}: got ${actual}, expected ${expected}`);
  }
}

console.log('=== 1. 배달앱 순수익 & 역산 검산 ===');
// 20,000원, 중개 7.8%(1,560), 결제 3%(600), 배달비 3,400, 원가 7,000, 부가세 20000/11(1,818.18) -> 순수익 5,621.82원
const d1 = E.delivery({ plan: 'baemin-78', price: 20000, cost: 7000, card: 3, vat: 1, promo: 0, target: 25 });
approx(d1.net, 20000 - 1560 - 600 - 3400 - 7000 - 20000 / 11, 0.01, '배민1구간 2만원 메뉴 1주문 순수익');
// 목표 순마진 25% 역산가격을 재대입하면 순마진율 >= 25.0% 이어야 함
const d1Check = E.delivery({ plan: 'baemin-78', price: d1.targetPrice, cost: 7000, card: 3, vat: 1, promo: 0 });
equal(d1Check.margin >= 25.0 && d1Check.margin < 25.6, true, `역산 메뉴가(${d1.targetPrice}원) 재대입 시 순마진율 25% 충족(${d1Check.margin.toFixed(2)}%)`);

console.log('\n=== 2. 셀러 손익분기 ROAS & CPA 검산 ===');
const s1 = E.seller({ cur: 'CNY', unit: 25, ship: 1500, market: 'ss-naver', fee: 6.63, price: 20000, pack: 3000, ret: 0, cpc: 200, cvr: 2.5 }, { CNY: 200, USD: 1400 });
// 원가 25*200=5,000 + 물류 1,500 = 6,500, 수수료 20000*0.0663=1,326, 배송 3,000 -> 잔여 9,174 -> 부가세 9174/11=834 -> 순마진 8,340원
approx(s1.preAd, 8340, 0.5, '중국 25위안 사입 2만원 판매 광고전 순마진');
approx(s1.beRoas, (20000 / 8340) * 100, 0.1, '손익분기 ROAS = 판매가 / 순마진 * 100');
approx(s1.beCpc, 8340 * 0.025, 0.1, '손익분기 CPC = 최대CPA * 전환율');

console.log('\n=== 3. 정책자금 4.5% 대환 & 스마트상점 보조금 검산 ===');
const p1 = E.policy({ ind: 'food', age: 'lt3', emp: 'lt5', hiloan: 6000, hirate: 9.5, kiosk: 1, devcost: 800, srate: 70 });
equal(p1.refinance.amount, 5000, '대환대출 기업당 최대 5,000만원 한도 캡 작동');
approx(p1.refinance.annual, 50000000 * (9.5 - 4.5) / 100, 1, '연 9.5% -> 4.5% 첫해 이자절감액 250만원');
equal(p1.smart.subsidy, 500, '스마트상점 800만*70%=560만 -> 국비 500만원 한도 캡 작동');
equal(p1.smart.selfPay, 300, '스마트상점 한도 적용 후 실자부담 300만원');

console.log('\n=== 4. 2026 vs 2027 최저시급·주휴수당·4대보험 절벽 검산 ===');
equal(E.MIN_WAGE_2026, 10320, '2026 최저시급 10,320원');
equal(E.MIN_WAGE_2027, 10700, '2027 확정 최저시급 10,700원 (고용노동부 고시 제2026-60호)');
// 주 15시간 주휴수당 = (15/40)*8*시급 = 3*시급
const w26 = E.weeklyPay(10320, 15);
equal(w26.holiday, 3 * 10320, '2026 주 15시간 주휴수당 30,960원');
const w27 = E.weeklyPay(10700, 15);
equal(w27.holiday, 3 * 10700, '2027 주 15시간 주휴수당 32,100원');
const l26 = E.labor({ year: 2026, wage: 10320, hours: 20, staff: 2, ins: 1, cut: 14.5, devices: 4, mode: 'buy', devcost: 450000 });
const l27 = E.labor({ year: 2027, wage: 10700, hours: 20, staff: 2, ins: 1, cut: 14.5, devices: 4, mode: 'buy', devcost: 450000 });
approx(E.WAGE_YEARS[2026].insTotal, 4.75 + 3.595 + 3.595 * 0.1314 + 1.15 + 0.9, 0.001, '2026 사업주 4대보험 합계 10.867%');
approx(E.WAGE_YEARS[2027].insTotal, 5.00 + 3.595 + 3.595 * 0.1390 + 1.15 + 0.9, 0.001, '2027 사업주 4대보험 합계 11.145%');
equal(l27.before.total > l26.before.total, true, '2027년 전환 시 동일 근무시간 인건비 상승 확인');
approx(l26.hike2027Monthly, (l27.before.total - l26.before.total) * 2, 1, '2026->2027 월 인건비 추가 상승액 일치');

console.log('\n=== 5. 개인사업자 부가세(간이·일반) & 종합소득세·노란우산 검산 ===');
// (a) 연매출 4,500만원 음식점 -> 간이과세 납부면제(4,800만원 미만) 부가세 0원
const tExempt = E.vatIncome({ ind: 'food', regime: 'auto', sales: 4500, buy: 40, labor: 600, cardpct: 90, deps: 1, umb: 0 });
equal(tExempt.vatExempt, true, '연매출 4,500만원 간이과세 부가세 납부면제 판정');
equal(tExempt.actualVatPayable, 0, '납부면제 대상 부가세 0원');

// (b) 연매출 12,000만원 음식점 -> 1억 400만원 이상이므로 간이 신청해도 일반과세 강제 전환
const tGeneral = E.vatIncome({ ind: 'food', regime: 'simplified', sales: 12000, buy: 44, labor: 3000, cardpct: 0, deps: 1, umb: 0 });
equal(tGeneral.effectiveRegime, 'general', '연매출 1.2억 -> 1억 400만원 초과로 일반과세 자동 전환');
equal(tGeneral.forcedGeneral, true, '간이 불가 플래그 작동');
// 매출세액 1.2억/11 - 매입세액 5,280만/11 = 6,720만/11 = 6,109,090.9원
approx(tGeneral.vatGeneral, (120000000 - 52800000) / 11, 1, '일반과세 부가세(무카드공제시) 매출세액-매입세액 정확 일치');

// (c) 종합소득세 8단계 과세표준 구간 검산
approx(E.progressiveTax(14000000).tax, 840000, 1, '과세표준 1,400만원 -> 6% = 84만원');
approx(E.progressiveTax(50000000).tax, 50000000 * 0.15 - 1260000, 1, '과세표준 5,000만원 -> 624만원');
approx(E.progressiveTax(88000000).tax, 88000000 * 0.24 - 5760000, 1, '과세표준 8,800만원 -> 1,536만원');
approx(E.progressiveTax(150000000).tax, 150000000 * 0.35 - 15440000, 1, '과세표준 1.5억원 -> 3,706만원');

// (d) 노란우산공제 한도 및 절세액 검산 (사업소득 3,800만원 이하 -> 한도 600만원)
const tUmb0 = E.vatIncome({ ind: 'retail', regime: 'general', sales: 11000, buy: 50, labor: 1000, cardpct: 0, deps: 1, umb: 0 });
const tUmb50 = E.vatIncome({ ind: 'retail', regime: 'general', sales: 11000, buy: 50, labor: 1000, cardpct: 0, deps: 1, umb: 50 });
// 공급가 1억 - 매입공급가 5,000만 - 인건비 1,000만 = 사업소득 4,000만원 -> 노란우산 한도 600만원!
equal(tUmb50.bizIncome, 40000000, '사업소득금액 4,000만원 정확 계산');
equal(tUmb50.umbCap, 6000000, '사업소득 4,000만원 이하 노란우산 소득공제 한도 600만원');
equal(tUmb50.umbDeduct, 6000000, '월 50만원(연 600만원) 납입 시 600만원 전액 공제');
// 과표 3,850만 -> 3,250만 (15% 구간, 지방세 포함 16.5%): 600만 * 16.5% = 99만원 절세!
approx(tUmb50.umbTaxSaved, 6000000 * 0.165, 1, '노란우산 600만원 공제 시 종소세+지방소득세(16.5%) 99만원 절세 일치');
approx(tUmb0.totalIncomeTax - tUmb50.totalIncomeTax, 990000, 1, '납입 전후 세액 차감 검산 일치');

console.log('\n=== 6. 상가 환산보증금·5% 상한·매장 손익분기점(BEP) 검산 ===');
// 서울 보증금 1억(10,000만) + 월세 700만*100 = 8억(80,000만) <= 9억(90,000만) -> 이하!
const stUnder = E.storeLease({ region: 'seoul', deposit: 10000, rent: 700, maint: 100, labor: 500, ticket: 20000, varpct: 50, days: 25, sunk: 6000, orders: 60 });
equal(stUnder.convertedDeposit, 80000, '환산보증금 = 1억 + 700만×100 = 8억원(80,000만원)');
equal(stUnder.underCap, true, '서울 9억 이하 상가임대차 5% 상한 보호 대상 판정');
equal(stUnder.maxRentNext5Pct, 735, '법정 5% 상한 적용 시 최대 월세 735만원');
// 고정비 = (700+100+500)=1,300만원, 객단가 2만*공헌이익률 50% = 1만원/건 -> 월 BEP 1,300건, 일 BEP 1300/25 = 52건!
equal(stUnder.bepMonthlyOrders, 1300, '월 손익분기 주문수 1,300건');
equal(stUnder.bepDailyOrders, 52, '일 손익분기 주문수 52건');
// 일 60건 * 25일 = 1,500건 -> 월매출 3,000만원, 공헌이익 1,500만 - 고정비 1,300만 = 월순익 200만원 -> 창업비 6,000만 / 200만 = 30개월!
equal(stUnder.expMonthlyProfit, 2000000, '예상 월 영업순이익 200만원');
approx(stUnder.paybackMonths, 30, 0.01, '매몰 창업비 6,000만원 회수기간 30.0개월');

const stOver = E.storeLease({ region: 'metro-overcrowded', deposit: 10000, rent: 600 });
equal(stOver.convertedDeposit, 70000, '환산보증금 7억원');
equal(stOver.underCap, false, '과밀억제·부산 기준(6.9억) 초과 정확 판정');

console.log('\n=== 7. 창업 풀코스 A-to-Z & 12개월 계절 시뮬레이터 검산 ===');
const { STARTUP_PROFILES } = require('../data/startup-profiles');
const sm = E.startupMaster({ profile: 'takeout-coffee', season: 1, kiosk: 1, subsidy: 1, own: 6000, loantype: 'policy', loanrate: 3.5, loanyears: 5 }, STARTUP_PROFILES);
// 보증금 3000 + 인테리어(12*210=2520) + 설비 2800 + 권리금 1500 + 키오스크 자부담(240 - 168 = 72) = 9892만원
equal(sm.kioskSubsidy, 168, '키오스크 240만 × 70% = 168만원 스마트상점 국비 차감');
equal(sm.totalStartup, 3000 + 2520 + 2800 + 1500 + 72, '총 소요 창업자금 9,892만원 합산 일치');
equal(sm.sunkStartup, 2520 + 2800 + 1500 + 72, '보증금 제외 매몰 투자금 6,892만원 일치');
equal(sm.loanNeeded, 9892 - 6000, '자기자본 6,000만원 차감 후 필요 대출액 3,892만원 일치');
equal(sm.months.length, 12, '12개월 계절 시뮬레이션 배열 길이 12');
equal(sm.bestMonth.month === 7 && sm.worstMonth.month === 1, true, '테이크아웃 커피 성수기(7월)·비수기(1월) 계절 피크 판독 일치');
equal(STARTUP_PROFILES.length, 30, '창업 풀코스 30대 세부 업종 프로파일 전수 등록 확인');
const allProfValid = STARTUP_PROFILES.every((prof) => {
  const res = E.startupMaster({ profile: prof.id, season: 1 }, STARTUP_PROFILES);
  return Number.isFinite(res.totalStartup) && Number.isFinite(res.annualCashFlow) && res.months.length === 12 && Array.isArray(prof.tips) && prof.tips.length >= 4;
});
equal(allProfValid, true, '30대 전 업종 12개월 현금흐름·세금·원리금 무결성 검산 완료');

console.log('\n=== 8. 사업자 대출 가승인·한도·금리사다리 & 선정산 APR 검산 ===');
const ldBlock = E.loanDiagnose({ arrears: 1, sales: 30000, credit: 'high' });
equal(ldBlock.grade, 'danger', '세금 체납 시 즉시 보류 판정');
equal(ldBlock.netAdditionalLimit, 0, '세금 체납 시 추가 한도 0원');
const ldOk = E.loanDiagnose({ purpose: 'expand', sales: 20000, credit: 'high', collateral: 'realestate', colval: 20000, debt: 4000, debtrate: 8.5, arrears: 0, emp: 'lt5' });
equal(ldOk.grade, 'safe', '우량 신용 + 부동산 담보 보유 시 우수 판정');
equal(ldOk.collateralCap, 14000, '부동산 담보 2억 × LTV 70% = 1억 4,000만원 여력 산출');
approx(ldOk.refiAnnualSave, 40000000 * (8.5 - 4.5) / 100, 1, '기존 8.5% 4,000만원 -> 4.5% 대환 시 연 160만원 이자 절감');
const aprMini = E.mini('apr-trap', { amt: 4000, fee: 0.8, days: 20, alt: 3.5 });
equal(aprMini[0][1], '14.6%', '선정산 20일 0.8% 수수료 -> 연환산 실질금리 14.60% 정확 산출');
equal(aprMini[3][1], '4,440,000원', '4,000만원 선정산 대신 3.5% 전환 시 연간 444만원 절감 일치');

console.log(`\n========================================`);
console.log(` MATH AUDIT: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================`);
process.exit(failed ? 1 : 0);
