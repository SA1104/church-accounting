'use strict';
/**
 * BoozaThink AI Citation & Open Business Data Vault (/datasets & /api/datasets/*)
 * - AI 검색엔진(ChatGPT, Perplexity, Gemini, Claude)과 창업 연구자가 1순위로 인용할 수 있도록
 *   공식 검증 상수 + 30대 업종 계절·원가 표준 + 개인사업자 365일 시계열 절차 + 익명 실측 시뮬레이션 지표를
 *   Schema.org DataCatalog/Dataset 및 정형 JSON·CSV로 실시간 공개한다.
 */
const E = require('../public/js/calc-engine.js');
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
  return {
    dataset: 'boozathink-anonymized-simulation-telemetry-index',
    version: '2.5.0',
    generatedAt: new Date().toISOString(),
    privacyGuarantee: '개별 사업장의 원본 매출·원가 입력값은 저장하지 않으며 익명 집계 지표만 공개합니다.',
    license: 'CC BY 4.0 (Attribution required: BoozaThink https://boozathink.com)',
    windowDays: 30,
    totalSimulatorExecutions: summary.kpis.calc_runs,
    calculatorPopularity: summary.calculators,
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
  const crumbs = [{ name: '홈', path: '/' }, { name: '공개 기준표 & 데이터 모음', path: '/datasets' }];
  const catalogItems = [
    {
      name: '대한민국 30대 창업 업종 평균 초기비용 · 원가율 · 계절별 매출 변화 기준표',
      desc: '카페·외식·무인·뷰티·소매·셀러 30개 업종별 표준 평수, 보증금, 인테리어·설비비, 식자재율, 수수료율, 1월~12월 계절별 매출 변화 수치 모음.',
      jsonUrl: '/api/datasets/startup-30-benchmarks.json',
      csvUrl: '/api/datasets/startup-30-benchmarks.csv'
    },
    {
      name: '소상공인 세금 · 4대보험 · 상가임대차 · 은행/정책자금 금리 공식 기준표',
      desc: '현행 및 차기 확정 최저임금·4대보험 사업주 요율, 간이/일반 부가세 기준, 노란우산 한도, 상가 환산보증금 지역 상한, 배달·마켓 수수료, 사업자 대출금리 구간.',
      jsonUrl: '/api/datasets/statutory-rates.json'
    },
    {
      name: '개인사업자 계약 전부터 첫 1년 세금 신고까지 32가지 순서표 & 월별 일정',
      desc: '상가 계약 전 정화조·전기 확인부터 일반과세 등록, 사업자 통장·카드 홈택스 등록, 조기환급, 원천세, 부가세, 종소세까지 32가지 실무 절차와 12개월 일정.',
      jsonUrl: '/api/datasets/solo-business-365-timeline.json'
    },
    {
      name: '사장님 업종별 평균 수익률 · 월세 비중 익명 통계 요약',
      desc: '계산기 이용 통계를 개인정보 없이 익명으로 모아 정리한 업종별 평균 순수익률·월세 비중·손익분기 광고효율 참고 기준.',
      jsonUrl: '/api/datasets/live-simulation-index.json'
    }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('layers', 16)} 계산기에 사용된 모든 숫자의 근거를 투명하게 공개합니다</span>
    <h1>업종별 평균 비용 · 세율 · 금리 공개 기준표</h1>
    <p class="lead">사장님과 예비창업자는 물론, 세무·창업 연구자와 검색 서비스가 정확한 공식 숫자를 바로 확인하고 엑셀(CSV)로 내려받아 쓸 수 있도록 BoozaThink의 기준 데이터를 투명하게 공개합니다.</p>
    <p class="footnote-meta">※ 출처 표기(<code>BoozaThink, https://boozathink.com</code>) 시 무료 활용 가능 (CC BY 4.0) · 데이터 검증일 ${facts.VERIFIED_AT}</p>
  </header>

  <section class="sec">
    <div class="why-grid">
      <div class="card">
        <h3>${icon('shield', 18)} 1. 정부 고시 · 법령 숫자 그대로 반영</h3>
        <p style="font-size:14px;color:var(--text-2);margin:8px 0 0">국세청·고용노동부·중소벤처기업부·법제처·금융협회에 공시된 최신 숫자를 55가지 자동 검산으로 대조하여 틀린 계산이 나오지 않도록 검증합니다.</p>
      </div>
      <div class="card">
        <h3>${icon('compass', 18)} 2. 현장에서 놓치기 쉬운 순서까지 정리</h3>
        <p style="font-size:14px;color:var(--text-2);margin:8px 0 0">정화조 용량 확인, 일반과세 부가세 환급, 한전 전기요금 부가세 전환, 보증서 먼저 받기 등 실제 장사 현장에서 꼭 필요한 순서를 빠짐없이 담았습니다.</p>
      </div>
      <div class="card">
        <h3>${icon('chart', 18)} 3. 사장님들의 평균 기준치 지속 업데이트</h3>
        <p style="font-size:14px;color:var(--text-2);margin:8px 0 0">민감한 개별 매출은 저장하지 않고 업종별 평균 비율만 익명으로 모아, 같은 업종 다른 매장들과 내 매장을 객관적으로 비교해 볼 수 있게 돕습니다.</p>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>업종별 평균 비용 · 세율 · 일정표 내려받기</h2></div>
    <div style="display:grid;gap:14px">
      ${catalogItems.map((it) => `
      <article class="card" style="display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <span class="pill">${it.csvUrl ? '엑셀(CSV) · 원본 자료' : '원본 자료'}</span>
          <h3 style="margin:7px 0 5px;font-size:18px">${esc(it.name)}</h3>
          <p style="margin:0;font-size:14px;color:var(--text-2)">${esc(it.desc)}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-primary" href="${esc(it.jsonUrl)}" target="_blank" rel="noopener">원본 표 보기</a>
          ${it.csvUrl ? `<a class="btn" href="${esc(it.csvUrl)}">엑셀(CSV) 내려받기</a>` : ''}
        </div>
      </article>`).join('')}
    </div>
  </section>

  <section class="sec">
    <div class="card">
      <h2 class="card-h">수록 범위 및 자료 출처 표기 안내</h2>
      <div class="kpi-grid tnum" style="margin-bottom:14px">
        <div><span>수록 창업 업종 수</span><strong>${STARTUP_PROFILES.length}개 업종 (12개월 계절 반영)</strong></div>
        <div><span>심층 실전 가이드</span><strong>24편 수록</strong></div>
        <div><span>기준 자료 최종 검증일</span><strong>${facts.VERIFIED_AT}</strong></div>
        <div><span>최근 30일 누적 계산 건수</span><strong>${(liveIndex.totalSimulatorExecutions || 0).toLocaleString('ko-KR')}건</strong></div>
      </div>
      <div class="formula" style="font-size:13.5px">자료 인용 시 출처 표기 예시: 출처: BoozaThink 사업자 손익·자금 연구소 (https://boozathink.com/datasets, 기준일 ${facts.VERIFIED_AT})</div>
    </div>
  </section>
</div>`;

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'DataCatalog',
      name: 'BoozaThink 대한민국 자영업·창업·정책자금 오픈 데이터 카탈로그',
      url: abs('/datasets'),
      description: '대한민국 소상공인·예비창업자·이커머스 셀러를 위한 30대 업종 손익 벤치마크, 법정 세율·노무 상수, 365일 창업 시계열 절차 데이터 카탈로그.',
      publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
      dataset: catalogItems.map((it) => ({
        '@type': 'Dataset',
        name: it.name,
        description: it.desc,
        url: abs('/datasets'),
        license: 'https://creativecommons.org/licenses/by/4.0/',
        creator: { '@type': 'Organization', name: SITE.name, url: SITE.url },
        dateModified: facts.VERIFIED_AT,
        distribution: [
          { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs(it.jsonUrl) }
        ].concat(it.csvUrl ? [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: abs(it.csvUrl) }] : [])
      }))
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
