'use strict';
const E = require('../public/js/calc-engine.js');
const { STARTUP_PROFILES } = require('../data/startup-profiles');
const { esc, CALCULATORS, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const { icon } = require('./icons');
const facts = require('../data/facts');

const won = E.won, pct = E.pct, fmt = E.fmt, manwon = E.manwon;

function qv(q, k, def) {
  if (q[k] === undefined || q[k] === '') return def;
  const x = Number(q[k]);
  return Number.isFinite(x) ? x : def;
}

function range(key, label, min, max, step, value, unit, hint) {
  return `<div class="field" data-field="${key}">
  <label for="f-${key}">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</label>
  <div class="field-row">
    <input type="range" id="r-${key}" min="${min}" max="${max}" step="${step}" value="${value}" data-bind="${key}" aria-label="${esc(label)} 슬라이더">
    <div class="num"><input type="number" id="f-${key}" min="0" step="${step}" value="${value}" data-bind="${key}" inputmode="decimal"><span class="unit">${esc(unit)}</span></div>
  </div>
</div>`;
}

function seg(key, label, options, value) {
  return `<div class="field" data-field="${key}"><span class="label" id="l-${key}">${esc(label)}</span>
  <div class="seg" role="radiogroup" aria-labelledby="l-${key}">${options.map(([v, t]) => `<label class="seg-opt"><input type="radio" name="${key}" value="${esc(v)}" data-bind="${key}"${String(v) === String(value) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></div>`;
}

function toggle(key, label, on, hint) {
  return `<div class="field field-toggle" data-field="${key}"><label class="switch"><input type="checkbox" id="f-${key}" data-bind="${key}"${on ? ' checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</span></label></div>`;
}

function o(key, text) { return `<span data-out="${key}">${text}</span>`; }

function renderSeasonBars(months, bestM, worstM) {
  const maxAbs = Math.max(1, ...months.map((m) => Math.abs(m.cashFlow)));
  return `<div class="season-chart tnum" data-chart="season12">` + months.map((m) => {
    const h = Math.max(8, Math.round((Math.abs(m.cashFlow) / maxAbs) * 100));
    const cls = m.cashFlow < 0 ? 'neg' : (m.month === bestM ? 'peak' : (m.month === worstM ? 'low' : ''));
    const man = Math.round(m.cashFlow / 10000);
    return `<div class="m-col"><span class="m-val">${man >= 0 ? man : '−' + Math.abs(man)}만</span><div class="m-bar-wrap"><div class="m-bar ${cls}" style="height:${h}%"></div></div><span class="m-lbl">${m.month}월</span></div>`;
  }).join('') + `</div>`;
}

function startupMasterView(q, ctx) {
  const calc = CALCULATORS[0];
  const profId = STARTUP_PROFILES.some((p) => p.id === q.profile) ? q.profile : 'takeout-coffee';
  const prof = STARTUP_PROFILES.find((p) => p.id === profId);
  const s = {
    profile: profId,
    pyeong: qv(q, 'pyeong', prof.pyeong),
    deposit: qv(q, 'deposit', prof.deposit),
    rent: qv(q, 'rent', prof.rent),
    maint: qv(q, 'maint', prof.maint),
    intmode: ['self', 'turnkey', 'takeover'].includes(q.intmode) ? q.intmode : 'turnkey',
    interior: qv(q, 'interior', Math.round(prof.pyeong * prof.interiorPerPyeong)),
    equip: qv(q, 'equip', prof.equip),
    premium: qv(q, 'premium', prof.premium),
    kiosk: q.kiosk === '0' ? 0 : (prof.kioskCount > 0 ? 1 : 0),
    kioskcnt: qv(q, 'kioskcnt', prof.kioskCount || 1),
    subsidy: q.subsidy === '0' ? 0 : 1,
    own: qv(q, 'own', 6000),
    loantype: ['policy', 'mixed', 'bank'].includes(q.loantype) ? q.loantype : 'policy',
    loanrate: qv(q, 'loanrate', 3.5),
    loanyears: qv(q, 'loanyears', 5),
    ticket: qv(q, 'ticket', prof.ticket),
    orders: qv(q, 'orders', prof.dailyOrders),
    days: qv(q, 'days', 26),
    cogs: qv(q, 'cogs', prof.cogsPct),
    fee: qv(q, 'fee', prof.feePct),
    deliv: qv(q, 'deliv', prof.delivPct),
    staff: qv(q, 'staff', prof.staffMonthly),
    season: q.season === '0' ? 0 : 1
  };
  const r = E.startupMaster(s, STARTUP_PROFILES);
  const crumbs = [{ name: '홈', path: '/' }, { name: '창업 풀코스 설계', path: '/calculators/startup-master' }];

  const form = `
<fieldset><legend>Step 1. 창업 희망 업종 선택 (특성·계절성 자동 세팅)</legend>
  <input type="hidden" name="profile" data-bind="profile" value="${esc(s.profile)}">
  <div class="profile-grid" data-profile-grid>
    ${STARTUP_PROFILES.map((p) => `<button type="button" class="prof-btn${p.id === s.profile ? ' active' : ''}" data-pick-profile="${esc(p.id)}"><span>${esc(p.name)}</span><small>${esc(p.group)} · 통상원가 ${p.cogsPct}%</small></button>`).join('')}
  </div>
  <p class="plan-note" data-season-note>${esc(prof.seasonNote)}</p>
</fieldset>

<fieldset><legend>Step 2. 점포 임대차 & 인테리어 · 초기 시설비</legend>
  ${range('pyeong', '전용 면적(평)', 5, 100, 1, s.pyeong, '평')}
  ${range('deposit', '임대 보증금 (퇴거 시 회수가능 자산)', 0, 30000, 100, s.deposit, '만원')}
  ${range('rent', '월 임대료 (부가세 별도)', 0, 1500, 10, s.rent, '만원')}
  ${range('maint', '월 관리비 · 전기 · 수도 공과금', 0, 400, 5, s.maint, '만원')}
  ${seg('intmode', '인테리어 방식', [['turnkey', '일반 턴키시공'], ['self', '분리발주(−22%)'], ['takeover', '시설양수(−58%)']], s.intmode)}
  ${range('interior', '인테리어 공사비', 0, 25000, 50, s.interior, '만원')}
  ${range('equip', '주방·머신·간판·초도물품비', 0, 15000, 50, s.equip, '만원')}
  ${range('premium', '바닥·영업 권리금', 0, 20000, 100, s.premium, '만원')}
</fieldset>

<fieldset><legend>Step 3. 무인화(키오스크·테이블오더) & 인건비</legend>
  ${toggle('kiosk', '키오스크 · 테이블오더 도입', s.kiosk === 1, '무인결제·주문 동선 단축')}
  ${range('kioskcnt', '도입 기기 대수', 0, 25, 1, s.kioskcnt, '대')}
  ${toggle('subsidy', '스마트상점 기술보급 국비 보조(70%, 최대 500만) 반영', s.subsidy === 1)}
  ${range('staff', '월 총인건비 (직원·파트타임 합계)', 0, 2500, 10, s.staff, '만원')}
</fieldset>

<fieldset><legend>Step 4. 평상월 매출 · 원가 · 수수료 · 계절성</legend>
  ${range('ticket', '평균 결제 객단가', 2000, 120000, 500, s.ticket, '원')}
  ${range('orders', '평상월 일평균 결제 건수', 3, 500, 1, s.orders, '건')}
  ${range('days', '월 영업일수', 15, 31, 1, s.days, '일')}
  ${range('cogs', '식자재 · 상품 원가율', 5, 85, 1, s.cogs, '%')}
  ${range('fee', '카드 · 플랫폼 가중 중개수수료율', 1, 20, 0.2, s.fee, '%')}
  ${range('deliv', '배달대행 · 포장용기 부대비율', 0, 25, 0.5, s.deliv, '%')}
  ${toggle('season', '업종별 12개월 계절 파동(성수기·비수기) 반영', s.season === 1)}
</fieldset>

<fieldset><legend>Step 5. 내 자본금 & 부족 자금 대출 설계</legend>
  ${range('own', '내가 보유한 순수 자기자본(현금)', 0, 40000, 100, s.own, '만원')}
  ${seg('loantype', '부족 자금 조달 방식', [['policy', '정책·보증(3.5%)'], ['mixed', '혼합조달(4.4%)'], ['bank', '일반은행(5.5%)']], s.loantype)}
  ${range('loanrate', '적용 대출 연 금리', 1.5, 15, 0.1, s.loanrate, '%')}
  ${range('loanyears', '원리금 상환 기간', 1, 10, 1, s.loanyears, '년')}
</fieldset>`;

  const out = `
<div class="card result-hero" data-status="${r.avgMonthlyCashFlow > 0 && r.deficitMonths === 0 ? 'safe' : (r.avgMonthlyCashFlow > 0 ? 'caution' : 'danger')}">
  <p class="rh-label">세금·대출원리금까지 다 뺀 월평균 실수령 현금흐름</p>
  <p class="rh-value tnum">${o('avgCash', won(r.avgMonthlyCashFlow))}</p>
  <p class="rh-sub">1년 누적 실수령 <strong class="tnum">${o('annualCash', won(r.annualCashFlow))}</strong> · 매몰 투자금 회수 <strong class="tnum">${o('payback', r.paybackMonths != null ? fmt(r.paybackMonths, 1) + '개월' : '회수 불가')}</strong></p>
</div>

<div class="card">
  <h2 class="card-h">창업 자금 조달 요약 (총 투자금 vs 내 돈 vs 필요 대출)</h2>
  <div class="kpi-grid tnum">
    <div><span>총 소요 창업자금 (보증금 포함)</span><strong>${o('totalStartup', manwon(r.totalStartup))}</strong></div>
    <div><span>회수해야 할 순수 매몰비용</span><strong>${o('sunkStartup', manwon(r.sunkStartup))}</strong></div>
    <div><span>스마트상점 국비 보조 차감</span><strong>${o('kioskSub', '−' + manwon(r.kioskSubsidy))}</strong></div>
    <div class="hl"><span>부족 자금 (필요 대출액)</span><strong>${o('loanNeeded', manwon(r.loanNeeded))}</strong></div>
    <div><span>월 대출 이자 (첫달 기준)</span><strong>${o('mInterest', won(r.monthlyInterestKRW))}</strong></div>
    <div><span>월 원리금 상환액 (${o('loanYrsTxt', r.loanYears + '년 분할')})</span><strong>${o('mDebt', won(r.monthlyDebtServiceKRW))}</strong></div>
  </div>
  <p class="footnote-meta">※ 부족한 창업자금을 가장 낮은 금리 순서로 조달하는 방법은 <a href="/funding">사업자 대출 · 정책자금 라운지</a>에서 바로 진단하실 수 있습니다.</p>
</div>

<div class="card">
  <h2 class="card-h">12개월 계절별 실수령 현금흐름 예측 (성수기 vs 비수기 버퍼 점검)</h2>
  <div class="kpi-grid tnum">
    <div class="hl"><span>최고 성수기 (${o('bestM', r.bestMonth.month + '월')})</span><strong>${o('bestVal', won(r.bestMonth.cashFlow))}</strong></div>
    <div><span>최저 비수기 (${o('worstM', r.worstMonth.month + '월')})</span><strong>${o('worstVal', won(r.worstMonth.cashFlow))}</strong></div>
    <div><span>연간 추정 매출 (${o('taxReg', r.taxRegimeLabel)})</span><strong>${o('annSales', won(r.annualSalesKRW))}</strong></div>
    <div><span>연간 부가세 + 종합소득세</span><strong>${o('annTax', won(r.annualTotalTaxKRW))}</strong></div>
  </div>
  <div data-out-html="seasonBars">${renderSeasonBars(r.months, r.bestMonth.month, r.worstMonth.month)}</div>
  <p class="note" data-out="deficitNote">${r.deficitMonths > 0 ? `주의: 연중 비수기 ${r.deficitMonths}개월 동안 현금흐름 적자가 예상됩니다. 최소 3~6개월치 월세·원리금 비상 운영자금을 별도로 남겨 두세요.` : '안정: 비수기 달에도 세금과 대출 원리금을 감당하고 흑자가 유지되는 구조입니다.'}</p>
</div>

<div class="card">
  <h2 class="card-h">빠짐없는 월평균 손익 워터폴 (매출 → 6대 비용·세금·원리금 → 실수령)</h2>
  <div class="chart" data-chart="waterfall" role="img" aria-label="창업 월평균 매출 공제 워터폴 차트"></div>
  <table class="mini-table tnum" data-table="breakdown"><tbody>${r.monthlyBreakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.annualSalesKRW > 0 ? b.value / (r.annualSalesKRW / 12) * 100 : 0)}</td></tr>`).join('')}</tbody></table>
</div>

<div class="card killer">
  <h2 class="card-h">업종 통상 마진 기준 & 손님을 더 부르는 현장 운영 디테일</h2>
  <p class="killer-text" data-out="benchMargin">${esc(prof.benchMargin)}</p>
  <ul class="tip-list" data-out-html="tips" style="margin-top:12px">${prof.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
</div>`;

  const faq = [
    { q: '창업 비용에서 보증금과 권리금·인테리어비를 왜 따로 보나요?', a: '임대 보증금은 계약 만료 시 돌려받는 자산이지만, 인테리어 공사비·철거비·간판·초기 권리금은 영업을 통해 회수하지 못하면 사라지는 매몰 비용이기 때문입니다. 따라서 투자 회수 기간은 반드시 보증금을 제외한 매몰 투자금을 기준으로 첫 임대차 계약 기간(24개월) 내에 회수 가능한지 따져야 안전합니다.' },
    { q: '왜 한 달 수익이 아니라 12개월 계절 수익을 봐야 하나요?', a: '테이크아웃 카페나 무인 아이스크림 매장은 여름 성수기 한 달 수익만 보고 창업했다가 12~2월 매출이 35% 이상 빠질 때 월세와 대출 원리금을 못 내어 무너지는 경우가 많습니다. 성수기 수익의 최소 30%는 겨울 비수기 방어 통장에 남겨 두어야 1년을 완주할 수 있습니다.' },
    { q: '인테리어 분리발주는 정말 비용이 줄어드나요?', a: '철거·전기증설·목공·도장·냉난방을 직접 비교 견적해 분리발주하면 턴키 업체 마진(통상 18~25%)을 아낄 수 있습니다. 다만 공정 간 일정 조율 경험이 없다면 공사 지연으로 렌트프리 기간을 넘겨 월세를 더 내는 역효과가 날 수 있으니 도면 확정 후 진행하세요.' },
    { q: '부족한 창업 자금은 어디서 먼저 알아봐야 하나요?', a: '신용점수가 깎이는 캐피탈·저축은행이나 카드론을 먼저 조회하면 정작 연 2~3%대 정책자금과 지역신용보증재단 보증서 심사에서 탈락할 수 있습니다. 반드시 소상공인시장진흥공단 창업자금·지역신보 특례보증 → 제1금융권 순서로 알아보시기 바랍니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head calc-head">
    <span class="eyebrow">${icon('compass', 16)} 창업 A-to-Z 마스터 시뮬레이터</span>
    <h1>${esc(calc.name)}</h1>
    <p class="lead">막연한 감으로 창업하지 마세요. 업종을 고르면 현장 통상 투자비와 원가율, 12개월 계절 파동이 자동으로 채워지며, 보증금·인테리어·수수료·키오스크 국비 보조·부가세·종소세·대출 원리금까지 빠짐없이 차감한 진짜 1년 실수익을 진단합니다.</p>
    <p class="footnote-meta">※ 세율·최저임금·스마트상점 보조한도·정책자금 금리는 최신 정부 고시 데이터를 기준으로 반영되었습니다 (검증 기준일 ${facts.VERIFIED_AT}).</p>
  </header>
  <section class="calc" id="calc" data-calc="startup-master" aria-label="창업 풀코스 시뮬레이터">
    <form class="calc-form card" id="calc-form" onsubmit="return false" novalidate>${form}</form>
    <div class="calc-out">
      ${out}
      <div class="card bench" data-bench aria-live="polite"><div class="bench-head"><span class="pill">실시간 벤치마크</span><span class="bench-src" data-bench-src>익명 시뮬레이션 통계</span></div><p class="bench-text" data-bench-text>업종별 예비창업자 시뮬레이션 평균 수익률과 비교해 드립니다.</p></div>
      <div class="calc-actions" role="group" aria-label="결과 공유">
        <button type="button" class="btn btn-primary" data-action="copy-link">${icon('link', 16)} 내 창업 설계 링크 복사</button>
        <button type="button" class="btn" data-action="receipt">${icon('receipt', 16)} 창업 손익 종합 진단서 PNG 저장</button>
        <a class="btn" href="/funding">${icon('bank', 16)} 부족 자금 최저금리 조달법 보기</a>
        <button type="button" class="btn btn-ghost" data-action="reset">초기화</button>
        <span class="toast" role="status" aria-live="polite" data-toast></span>
      </div>
    </div>
  </section>
  ${faqHtml(faq)}
</div>
<script>window.__STARTUP_PROFILES__=${JSON.stringify(STARTUP_PROFILES).replace(/</g, '\\u003c')};</script>`;

  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: calc.name, url: abs('/calculators/startup-master'),
      applicationCategory: 'BusinessApplication', operatingSystem: 'Any (Web browser)', inLanguage: 'ko-KR', description: calc.desc,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' }, publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }
    },
    breadcrumbLd(crumbs),
    faqLd(faq)
  ];
  return { body, jsonld };
}

module.exports = { startupMasterView };
