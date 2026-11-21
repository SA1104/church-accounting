'use strict';
/**
 * BoozaThink AI Citation & Open Business Data Vault (/datasets & /api/datasets/*)
 * - AI 검색엔진(ChatGPT, Perplexity, Gemini, Claude)과 창업 연구자가 1순위로 인용할 수 있도록
 *   공식 검증 상수 + 30대 업종 계절·원가 표준 + 개인사업자 365일 시계열 절차 + 익명 실측 시뮬레이션 지표를
 *   Schema.org DataCatalog/Dataset 및 정형 JSON·CSV로 실시간 공개한다.
 */
const E = require('../lib/calc-engine.js');
const facts = require('../data/facts');
const rates = require('../lib/rates');
const { STARTUP_PROFILES } = require('../data/startup-profiles');
const { PERSONAS, TIMELINE_STAGES } = require('../data/start-timeline');
const { MONTHLY_SURVIVAL_CALENDAR } = require('../data/calendar-events');
const { esc, breadcrumbHtml, breadcrumbLd, abs, SITE } = require('./layout');
const { icon } = require('./icons');

function buildStartup30Dataset() {
  return {
    dataset: 'boozathink-korea-startup-30-industry-benchmarks',
    version: '2.5.0',
    verifiedAt: facts.VERIFIED_AT,
    license: 'CC BY 4.0 (Attribution required: BoozaThink https://boozathink.com)',
    citation: 'BoozaThink 사업자 손익·자금 연구소 (https://boozathink.com/datasets)',
    count: STARTUP_PROFILES.length,
    industries: STARTUP_PROFILES.map((p) => {
      const sim = E.startupMaster({ profile: p.id, season: 1, kiosk: p.kioskCount > 0 ? 1 : 0, subsidy: 1, own: 6000, loantype: 'policy', loanrate: 3.5, loanyears: 5 }, STARTUP_PROFILES);
      return {
        id: p.id,
        name: p.name,
        group: p.group,
        standardAreaPyeong: p.pyeong,
        depositManwon: p.deposit,
        monthlyRentManwon: p.rent,
        monthlyMaintManwon: p.maint,
        totalStartupCapexManwon: sim.totalStartup,
        sunkCapexExclDepositManwon: sim.sunkStartup,
        avgTicketKRW: p.ticket,
        normalDailyOrders: p.dailyOrders,
        cogsRatioPct: p.cogsPct,
        platformCardFeePct: p.feePct,
        deliveryPackagingPct: p.delivPct,
        seasonality12Months: p.seasonality,
        estimatedAnnualSalesKRW: Math.round(sim.annualSalesKRW),
        estimatedAnnualTaxKRW: Math.round(sim.annualTotalTaxKRW),
        benchmarkNote: p.benchMargin,
        simulatorUrl: abs('/calculators/startup-master?profile=' + p.id)
      };
    })
  };
}

function buildStartup30Csv() {
  const ds = buildStartup30Dataset();
  const header = ['id', 'group', 'name', 'pyeong', 'deposit_manwon', 'rent_manwon', 'total_startup_manwon', 'sunk_capex_manwon', 'ticket_krw', 'daily_orders', 'cogs_pct', 'fee_pct', 'deliv_pct', 'peak_season_mult', 'low_season_mult', 'simulator_url'];
  const rows = ds.industries.map((x) => [
    x.id,
    `"${x.group}"`,
    `"${x.name}"`,
    x.standardAreaPyeong,
    x.depositManwon,
    x.monthlyRentManwon,
    x.totalStartupCapexManwon,
    x.sunkCapexExclDepositManwon,
    x.avgTicketKRW,
    x.normalDailyOrders,
    x.cogsRatioPct,
    x.platformCardFeePct,
    x.deliveryPackagingPct,
    Math.max(...x.seasonality12Months),
    Math.min(...x.seasonality12Months),
    x.simulatorUrl
  ].join(','));
  return '\uFEFF' + [header.join(',')].concat(rows).join('\n') + '\n';
}

function buildStatutoryDataset() {
  return {
    dataset: 'boozathink-korea-soho-statutory-rates-and-lending',
    version: '2.5.0',
    verifiedAt: facts.VERIFIED_AT,
    license: 'CC BY 4.0 (Attribution required: BoozaThink https://boozathink.com)',
    citation: 'BoozaThink 사업자 손익·자금 연구소 (https://boozathink.com/datasets)',
    minimumWageAndInsurance: {
      2026: { hourlyKRW: E.MIN_WAGE_2026, monthly209hKRW: E.MIN_WAGE_2026 * 209, employerInsurancePct: Number(E.WAGE_YEARS[2026].insTotal.toFixed(3)), breakdown: facts.INSURANCE_BY_YEAR[2026] },
      2027: { hourlyKRW: E.MIN_WAGE_2027, monthly209hKRW: E.MIN_WAGE_2027 * 209, legalBasis: '고용노동부 고시 제2026-60호 (2027.1.1 시행)', employerInsurancePct: Number(E.WAGE_YEARS[2027].insTotal.toFixed(3)), breakdown: facts.INSURANCE_BY_YEAR[2027] }
    },
    taxThresholds: {
      simplifiedVatLimitKRW: 104000000,
      simplifiedVatExemptLimitKRW: 48000000,
      cardIssuanceTaxCreditRatePct: 1.3,
      cardIssuanceTaxCreditAnnualCapKRW: 10000000,
      yellowUmbrellaDeductionCapsKRW: [
        { maxBizIncomeKRW: 40000000, deductionCapKRW: 6000000 },
        { maxBizIncomeKRW: 60000000, deductionCapKRW: 5000000 },
        { maxBizIncomeKRW: 100000000, deductionCapKRW: 4000000 },
        { maxBizIncomeKRW: null, deductionCapKRW: 2000000 }
      ],
      simplifiedValueAddedRates: facts.VAT_VALUE_RATES
    },
    commercialLeaseProtectionCapsManwon: facts.LEASE_REGIONS,
    deliveryPlatformPlans: facts.DELIVERY_PLANS.filter((p) => p.id !== 'custom'),
    ecommerceMarketFees: facts.MARKETS,
    lendingRateBands: rates.getMarketRatesSummary(),
    policyFundPrograms: facts.POLICY_PROGRAMS.map(({ match, ...rest }) => rest),
    officialSources: facts.SOURCES
  };
}

function buildTimelineDataset() {
  return {
    dataset: 'boozathink-korea-solo-proprietor-365-chronology',
    version: '2.5.0',
    verifiedAt: facts.VERIFIED_AT,
    license: 'CC BY 4.0 (Attribution required: BoozaThink https://boozathink.com)',
    citation: 'BoozaThink 개인사업자 시계열 로드맵 (https://boozathink.com/start-guide)',
    personas: PERSONAS,
    chronologicalStages: TIMELINE_STAGES,
    annualTaxAndFundingCalendar: MONTHLY_SURVIVAL_CALENDAR
  };
}

async function buildLiveBenchmarkDataset(db) {
  const summary = await db.getAnalyticsSummary(30);
  const ci = summary.customerInsights || {};
  return {
    dataset: 'boozathink-anonymized-simulation-telemetry-index',
    version: '2.7.0',
    generatedAt: new Date().toISOString(),
    privacyGuarantee: '개별 사업장의 원본 매출·원가 입력값은 저장하지 않으며 익명 집계 지표만 공개합니다.',
    license: 'CC BY 4.0 (Attribution required: BoozaThink https://boozathink.com)',
    windowDays: 30,
    totalSimulatorExecutions: summary.kpis.calc_runs,
    calculatorPopularity: summary.calculators,
    topExploredStartupProfiles: ci.topProfiles || [],
    topVotedUpcomingCalculators: (ci.topToolVotes || []).map((t) => ({ slug: t.slug, title: t.title, votes: t.votes, status: t.status })),
    industryReferenceBaselines: [
      { calculator: 'startup-master', metric: '세후 월평균 순수익률', referenceMeanPct: 17.5, unit: '%' },
      { calculator: 'delivery-margin', metric: '배달 1주문 순마진율', referenceMeanPct: 16.8, unit: '%' },
      { calculator: 'seller-roas', metric: '최소 손익분기 ROAS', referenceMeanPct: 410.0, unit: '%' },
      { calculator: 'labor-automation', metric: '무인기기 원금회수 기간', referenceMeanMonths: 9.4, unit: '개월' },
      { calculator: 'vat-income-tax', metric: '연매출 대비 총세부담률', referenceMeanPct: 8.6, unit: '%' },
      { calculator: 'store-rent-breakeven', metric: '월매출 대비 임차료율', referenceMeanPct: 11.8, unit: '%' }
    ]
  };
}

function datasetsView(liveIndex) {
  const crumbs = [{ name: '홈', path: '/' }, { name: '공식 검증 기준표', path: '/datasets' }];
  const catalogItems = [
    {
      name: '대한민국 30대 창업 업종 초기비용 · 원가율 · 계절 편차 기준',
      desc: '카페·외식·무인·뷰티·소매·셀러 30개 업종별 표준 평수, 보증금, 인테리어·설비비, 식자재율, 현장 숨은 비용 및 계절별 매출 편차 기준.',
      linkUrl: '/calculators/startup-master',
      linkLabel: '창업 시뮬레이터에서 바로 확인 →'
    },
    {
      name: '소상공인 세금 · 4대보험 · 상가임대차 · 정책자금 금리 공식 기준',
      desc: '현행 및 차기 확정 최저임금·4대보험 사업주 요율, 간이/일반 부가세 기준, 노란우산 한도, 상가 환산보증금 지역 상한, 배달·마켓 수수료 기준.',
      linkUrl: '/calculators/vat-income-tax',
      linkLabel: '세무 · 실수령 계산기에서 확인 →'
    },
    {
      name: '개인사업자 계약 전부터 첫 1년 세금 신고까지 32가지 실무 순서',
      desc: '상가 계약 전 정화조·전기 확인부터 일반과세 등록, 사업자 통장·카드 홈택스 등록, 조기환급, 원천세, 부가세, 종소세까지 1년 필수 순서.',
      linkUrl: '/start-guide',
      linkLabel: '첫 창업 1년 순서표 보기 →'
    },
    {
      name: '금융권별 사업자 대출 평균 금리 & 최저금리 조달 사다리',
      desc: '정책자금·지역신보 이차보전·4.5% 대환대출·제1금융권 담보/신용·증권사 브릿지 금리 구간 및 한도 산정 기준.',
      linkUrl: '/funding',
      linkLabel: '대출 · 정책자금 라운지 보기 →'
    }
  ];

  const I26 = facts.INSURANCE_BY_YEAR[2026];
  const I27 = facts.INSURANCE_BY_YEAR[2027];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('layers', 16)} 시뮬레이터에 반영된 공식 법령 · 고시 근거를 투명하게 안내합니다</span>
    <h1>업종별 평균 비용 · 법정 세율 · 금리 요약 기준표</h1>
    <p class="lead">부자생각(BoozaThink)의 모든 시뮬레이터는 국세청·고용노동부·중소벤처기업부·법제처·금융협회에 공시된 공식 수치와 현장 검증 데이터를 기준으로 작동합니다.</p>
    <p class="footnote-meta">※ 무단 자동 수집 및 일괄 원본 복제는 이용약관에 따라 제한됩니다 · 데이터 검증일 ${facts.VERIFIED_AT}</p>
  </header>

  <section class="sec">
    <div class="why-grid">
      <div class="card">
        <h3>${icon('shield', 18)} 1. 정부 고시 · 법령 숫자 그대로 반영</h3>
        <p style="font-size:14px;color:var(--text-2);margin:8px 0 0">국세청·고용노동부·중소벤처기업부·법제처·금융협회에 공시된 최신 숫자를 자동 검산 테스트로 대조하여 오차 없이 검증합니다.</p>
      </div>
      <div class="card">
        <h3>${icon('compass', 18)} 2. 현장에서 놓치기 쉬운 숨은 변수까지 반영</h3>
        <p style="font-size:14px;color:var(--text-2);margin:8px 0 0">정화조·전기 증설비, 결제 전 일반과세 부가세 조기환급, 초기 3개월 워밍업 현금 등 실제 현장에서 꼭 필요한 안전선까지 함께 판독합니다.</p>
      </div>
      <div class="card">
        <h3>${icon('chart', 18)} 3. 사장님 누적 시뮬레이션 분포 비교</h3>
        <p style="font-size:14px;color:var(--text-2);margin:8px 0 0">민감한 개별 매출은 저장하지 않고 익명 비율 분포만 집계해, 같은 업종 사장님들의 중앙값·상위 20% 기준선과 내 매장을 비교해 드립니다.</p>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>2026–2027 핵심 법정 세율 · 노무 · 임대차 요약 기준표</h2></div>
    <div class="table-scroll">
      <table class="rate-board tnum">
        <thead><tr><th>구분</th><th>항목</th><th>적용 기준 수치</th><th>공식 출처 · 비고</th></tr></thead>
        <tbody>
          <tr><td>노무 · 최저임금</td><td><strong>2026 현행 최저시급 / 4대보험</strong></td><td><strong>10,320원</strong> (사업주 보험 약 ${I26.total}%)</td><td>월 209시간 환산 2,156,880원</td></tr>
          <tr><td>노무 · 차기고시</td><td><strong>2027 확정 최저시급 / 4대보험</strong></td><td><strong>10,700원</strong> (사업주 보험 약 ${I27.total}%)</td><td>고용노동부 고시 제2026-60호 (국민연금 사업주 ${I27.pension}%)</td></tr>
          <tr><td>세무 · 부가세</td><td><strong>간이과세 기준 / 납부면제</strong></td><td><strong>연 1억 400만원 미만</strong> / 4,800만원 미만 면제</td><td>신용카드 발행세액공제 1.3% (연 1,000만원 한도)</td></tr>
          <tr><td>세무 · 절세</td><td><strong>노란우산 소득공제 한도</strong></td><td><strong>연 최대 600만원</strong> (사업소득 4천만 이하)</td><td>~6천만 500만 / ~1억 400만 / 1억 초과 200만</td></tr>
          <tr><td>임대차 보호</td><td><strong>상가 환산보증금 5% 상한 기준</strong></td><td><strong>서울 9억 · 과밀/부산 6.9억</strong></td><td>광역시·세종 등 5.4억 · 기타 지역 3.7억 이하</td></tr>
          <tr><td>정책자금 · 보조</td><td><strong>저금리 대환 / 스마트상점 국비</strong></td><td><strong>연 4.5% 고정(5천만)</strong> / 국비 최대 500만</td><td>소상공인시장진흥공단 공고 기준</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>부문별 시뮬레이터 & 실무 기준 바로가기</h2></div>
    <div style="display:grid;gap:14px">
      ${catalogItems.map((it) => `
      <article class="card" style="display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <span class="pill">웹 열람 기준</span>
          <h3 style="margin:7px 0 5px;font-size:18px">${esc(it.name)}</h3>
          <p style="margin:0;font-size:14px;color:var(--text-2)">${esc(it.desc)}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-primary" href="${esc(it.linkUrl)}">${esc(it.linkLabel)}</a>
        </div>
      </article>`).join('')}
    </div>
  </section>

  <section class="sec">
    <div class="card">
      <h2 class="card-h">수록 범위 및 출처 표기 안내</h2>
      <div class="kpi-grid tnum" style="margin-bottom:14px">
        <div><span>수록 창업 업종 수</span><strong>${STARTUP_PROFILES.length}개 업종 (12개월 계절 반영)</strong></div>
        <div><span>심층 실전 가이드</span><strong>24편 수록</strong></div>
        <div><span>기준 자료 최종 검증일</span><strong>${facts.VERIFIED_AT}</strong></div>
        <div><span>최근 30일 누적 계산 건수</span><strong>${(liveIndex.totalSimulatorExecutions || 0).toLocaleString('ko-KR')}건</strong></div>
      </div>
      <div class="formula" style="font-size:13.5px">내용 인용 시 출처 표기 예시: 출처: 부자생각 BoozaThink 사업자 손익·자금 연구소 (https://boozathink.com, 기준일 ${facts.VERIFIED_AT})</div>
    </div>
  </section>
</div>`;

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'BoozaThink 업종별 비용 · 법정 세율 · 금리 공식 기준표',
      url: abs('/datasets'),
      description: '대한민국 소상공인·예비창업자·이커머스 셀러를 위한 법정 세율·노무 상수·상가 환산보증금·정책자금 요약 기준표.',
      publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      dateModified: facts.VERIFIED_AT
    },
    breadcrumbLd(crumbs)
  ];

  return { body, jsonld };
}

module.exports = {
  buildStartup30Dataset,
  buildStartup30Csv,
  buildStatutoryDataset,
  buildTimelineDataset,
  buildLiveBenchmarkDataset,
  datasetsView
};
