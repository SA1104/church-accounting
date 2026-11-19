'use strict';
const E = require('../public/js/calc-engine.js');
const { esc, CALCULATORS, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const facts = require('../data/facts');

const won = E.won, pct = E.pct, fmt = E.fmt;

function qv(q, key, def) {
  const v = q[key];
  if (v === undefined || v === '') return def;
  const nn = Number(v);
  return Number.isFinite(nn) ? nn : def;
}
function qs(q, key, allowed, def) { return allowed.includes(q[key]) ? q[key] : def; }

function range(key, label, min, max, step, value, unit, hint) {
  return `<div class="field" data-field="${key}">
  <label for="f-${key}">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</label>
  <div class="field-row">
    <input type="range" id="r-${key}" min="${min}" max="${max}" step="${step}" value="${value}" data-bind="${key}" aria-label="${esc(label)} 슬라이더">
    <div class="num"><input type="number" id="f-${key}" min="0" step="${step}" value="${value}" data-bind="${key}" inputmode="decimal"><span class="unit">${esc(unit)}</span></div>
  </div>
</div>`;
}
function select(key, label, options, value, hint) {
  return `<div class="field" data-field="${key}">
  <label for="f-${key}">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</label>
  <select id="f-${key}" data-bind="${key}">${options.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
</div>`;
}
function seg(key, label, options, value) {
  return `<div class="field" data-field="${key}"><span class="label" id="l-${key}">${esc(label)}</span>
  <div class="seg" role="radiogroup" aria-labelledby="l-${key}">${options.map(([v, t]) => `<label class="seg-opt"><input type="radio" name="${key}" value="${esc(v)}" data-bind="${key}"${String(v) === String(value) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></div>`;
}
function toggle(key, label, on, hint) {
  return `<div class="field field-toggle" data-field="${key}"><label class="switch"><input type="checkbox" id="f-${key}" data-bind="${key}"${on ? ' checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</span></label></div>`;
}
function o(key, text, cls) { return `<span data-out="${key}"${cls ? ` class="${cls}"` : ''}>${text}</span>`; }

function actions() {
  return `<div class="calc-actions" role="group" aria-label="결과 공유">
  <button type="button" class="btn btn-primary" data-action="copy-link">🔗 내 매장 시뮬레이션 결과 링크 복사</button>
  <button type="button" class="btn" data-action="receipt">🧾 손익 진단 영수증 PNG 저장</button>
  <button type="button" class="btn btn-ghost" data-action="reset">초기화</button>
  <span class="toast" role="status" aria-live="polite" data-toast></span>
</div>`;
}
function benchBox() {
  return `<div class="card bench" data-bench aria-live="polite"><div class="bench-head"><span class="pill">실시간 벤치마크</span><span class="bench-src" data-bench-src>익명 시뮬레이션 통계</span></div><p class="bench-text" data-bench-text>계산이 끝나면 같은 업종 사장님들의 익명 시뮬레이션 평균과 비교해 드립니다.</p></div>`;
}

function pageShell(calc, q, formHtml, outHtml, guideHtml, faq, related) {
  const crumbs = [{ name: '홈', path: '/' }, { name: '실전 계산기', path: '/calculators' }, { name: calc.short, path: '/calculators/' + calc.slug }];
  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head calc-head">
    <span class="eyebrow">${calc.icon} BoozaThink 실전 계산기 · 데이터 기준일 ${facts.VERIFIED_AT}</span>
    <h1>${esc(calc.name)}</h1>
    <p class="lead">${esc(calc.lead)}</p>
    <ul class="badges"><li>⚡ 입력 즉시 실시간 재계산</li><li>🔗 결과 링크 공유</li><li>🧾 영수증 이미지 저장</li><li>🔒 입력값 서버 미저장</li></ul>
  </header>
  <section class="calc" id="calc" data-calc="${calc.slug}" aria-label="${esc(calc.short)}">
    <form class="calc-form card" id="calc-form" onsubmit="return false" novalidate>
      ${formHtml}
    </form>
    <div class="calc-out">
      ${outHtml}
      ${benchBox()}
      ${actions()}
    </div>
  </section>
  <article class="prose calc-guide">
    ${guideHtml}
    <h2>관련 실전 바이블</h2>
    <ul class="rel-list">${related.map((a) => `<li><a href="/bible/${a.slug}">${esc(a.title)}</a></li>`).join('')}</ul>
  </article>
  ${faqHtml(faq)}
  <aside class="trust-box"><h2>데이터 검증 & 면책 안내</h2><p>데이터 검증 기준일: <strong>${facts.VERIFIED_AT}</strong>. 공식 참고 기관: 소상공인시장진흥공단, 공정거래위원회, 국세청, 고용노동부, 4대사회보험 정보연계센터. 본 계산기는 공개된 요율과 일반적인 회계 관행을 기반으로 한 추정 시뮬레이션이며, 실제 정산액·세액·대출 조건은 플랫폼 계약서와 기관 공고문에 따라 달라질 수 있습니다. 자세한 내용은 <a href="/terms-of-service">이용약관</a>과 <a href="/privacy-policy">개인정보처리방침</a>을 확인하세요.</p></aside>
</div>
<script>window.__FX__=${JSON.stringify(require('../lib/fx').publicRates())};</script>`;
  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: calc.name, url: abs('/calculators/' + calc.slug),
      applicationCategory: 'BusinessApplication', operatingSystem: 'Any (Web browser)', inLanguage: 'ko-KR', description: calc.lead,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' }, publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }, dateModified: facts.VERIFIED_AT
    },
    breadcrumbLd(crumbs),
    faqLd(faq)
  ];
  return { body, jsonld };
}

/* ───────────────────────── 1. 배달앱 ───────────────────────── */
function delivery(q, ctx) {
  const calc = { ...CALCULATORS[0], lead: '메뉴 판매가에서 배민·쿠팡이츠·요기요 중개수수료, 사장님 부담 배달비, 결제수수료, 식자재·포장 원가, 부가세를 차례로 빼면 실제로 사장님 통장에 남는 1주문 순수익이 나옵니다. 목표 순마진율이나 월 목표 순익을 넣으면 필요한 메뉴 가격과 절감액을 역산해 드립니다.' };
  const plan = qs(q, 'plan', Object.keys(E.DELIVERY_PLANS), 'baemin-78');
  const P = E.DELIVERY_PLANS[plan];
  const s = {
    plan, price: qv(q, 'price', 20000), fee: qv(q, 'fee', P.fee), dfee: qv(q, 'dfee', P.dfee), card: qv(q, 'card', 3), cost: qv(q, 'cost', 7000),
    vat: q.vat === '0' ? 0 : 1, promo: qv(q, 'promo', 0), orders: qv(q, 'orders', 40), days: qv(q, 'days', 26), fixed: qv(q, 'fixed', 3000000),
    target: qv(q, 'target', 25), goal: qv(q, 'goal', 5000000), biz: qs(q, 'biz', ['food', 'cafe'], 'food')
  };
  const r = E.delivery(s);
  const form = `
<fieldset><legend>① 메뉴 & 플랫폼</legend>
${select('plan', '배달앱 요금제 프리셋', facts.DELIVERY_PLANS.map((p) => [p.id, `${p.name} · ${p.fee}%`]), plan, '2026 기준')}
<p class="plan-note" data-plan-note>${esc(facts.DELIVERY_PLANS.find((p) => p.id === plan).note)}</p>
${range('price', '메뉴 판매가', 5000, 60000, 100, s.price, '원', '고객 결제가·VAT 포함')}
${range('fee', '중개수수료율', 0, 15, 0.1, s.fee, '%')}
${range('dfee', '사장님 부담 배달비', 0, 4000, 100, s.dfee, '원', '1주문당')}
${range('card', '결제수수료', 0, 5, 0.1, s.card, '%')}
</fieldset>
<fieldset><legend>② 원가 & 판촉</legend>
${range('cost', '식자재 + 포장용기 원가', 0, 40000, 100, s.cost, '원')}
${range('promo', '쿠폰·광고비 (주문당)', 0, 5000, 100, s.promo, '원')}
${toggle('vat', '부가세 10% 자동 역산 (일반과세자)', s.vat === 1, '판매가의 1/11')}
</fieldset>
<fieldset><legend>③ 매장 규모 & 목표</legend>
${seg('biz', '업종 (벤치마크용)', [['food', '외식·배달'], ['cafe', '카페·디저트']], s.biz)}
${range('orders', '일 평균 주문 건수', 1, 300, 1, s.orders, '건')}
${range('days', '월 영업일', 1, 31, 1, s.days, '일')}
${range('fixed', '월 임대료·고정비 (차감 옵션)', 0, 30000000, 100000, s.fixed, '원', '0원이면 미차감')}
${range('target', '목표 순마진율', 5, 40, 1, s.target, '%')}
${range('goal', '월 목표 순익', 0, 30000000, 100000, s.goal, '원')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="${r.net >= 0 ? (r.margin >= 15 ? 'safe' : 'caution') : 'danger'}">
  <p class="rh-label">1주문당 실제 순수익</p>
  <p class="rh-value tnum">${o('net', won(r.net))}</p>
  <p class="rh-sub">순마진율 <strong class="tnum">${o('margin', pct(r.margin))}</strong> · ${o('planName', esc(r.planName))}</p>
</div>
<div class="card"><h2 class="card-h">항목별 공제 워터폴</h2><div class="chart" data-chart="waterfall" role="img" aria-label="판매가에서 각 비용을 공제해 순수익에 이르는 워터폴 차트"></div>
<table class="mini-table tnum" data-table="breakdown"><tbody>${r.breakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.price ? b.value / r.price * 100 : 0)}</td></tr>`).join('')}</tbody></table></div>
<div class="card"><h2 class="card-h">월 예상 매출 vs 사장님이 가져가는 순수익</h2>
<div class="kpi-grid tnum"><div><span>월 주문</span><strong>${o('monthlyOrders', fmt(r.monthlyOrders) + '건')}</strong></div><div><span>월 예상 매출</span><strong>${o('monthlyRevenue', won(r.monthlyRevenue))}</strong></div><div><span>고정비 차감</span><strong>${o('fixed', won(r.fixed))}</strong></div><div class="hl"><span>월 실제 순수익</span><strong>${o('monthlyNet', won(r.monthlyNet))}</strong></div></div>
<div class="chart" data-chart="monthly" role="img" aria-label="월 매출 대비 순수익 비교 막대"></div></div>
<div class="card killer"><h2 class="card-h">🎯 킬러 역산 박스</h2><p class="killer-text" data-out-html="killer">사장님이 목표 순마진율 <strong>${pct(r.target, 0)}</strong>를 남기려면, 배달앱 메뉴 가격을 <strong class="tnum">${r.targetPrice ? won(r.targetPrice) : '수수료 구조상 달성 불가'}</strong>으로 세팅하거나 원가·배달비에서 <strong class="tnum">${won(r.saveNeeded)}</strong>을 절감해야 합니다.</p>
<p class="killer-text sub" data-out-html="killer2">월 순익 <strong>${won(r.goal)}</strong>이 목표라면 메뉴가 <strong class="tnum">${r.goalPrice ? won(r.goalPrice) : '-'}</strong> 또는 하루 <strong class="tnum">${r.goalOrders ? fmt(r.goalOrders) + '건' : '-'}</strong> 주문이 필요합니다.</p></div>`;
  const guide = `
<h2>배달앱 순수익은 이렇게 계산됩니다</h2>
<p>배달 매출 2만 원짜리 주문 한 건이 들어오면 사장님 통장에는 2만 원이 들어오지 않습니다. 플랫폼은 판매가 기준으로 중개이용료를 떼고, 결제대행(PG)사는 결제수수료를 떼며, 배민1플러스·쿠팡이츠 같은 플랫폼 배달은 업주 부담 배달비를 별도로 정산합니다. 여기에 일반과세자라면 고객이 낸 금액의 1/11은 원래 국가에 낼 부가세이므로 사장님 돈이 아닙니다. 마지막으로 식자재와 포장용기 원가까지 빼야 비로소 “진짜 순수익”이 보입니다.</p>
<div class="formula">1주문 순수익 = 판매가 − (판매가 × 중개수수료율) − (판매가 × 결제수수료율) − 사장님 부담 배달비 − 식자재·포장 원가 − 쿠폰·광고비 − 판매가 ÷ 11(부가세)</div>
<p>예를 들어 판매가 20,000원, 배민 상생요금제 1구간(7.8%), 배달비 3,400원, 결제수수료 3%, 원가 7,000원이라면 중개이용료 1,560원 + 결제수수료 600원 + 배달비 3,400원 + 원가 7,000원 + 부가세 1,818원을 빼고 <strong>순수익은 5,622원(순마진율 28.1%)</strong>입니다. 여기서 쿠폰 2,000원만 얹어도 순마진율은 18%대로 떨어집니다. 계산기 상단의 슬라이더를 움직이며 어떤 항목이 사장님 마진을 가장 많이 갉아먹는지 워터폴 차트로 확인해 보세요.</p>
<h2>2026 배달앱 요금제 프리셋 한눈에 보기</h2>
<table><thead><tr><th>요금제</th><th>중개수수료</th><th>업주 부담 배달비(대표값)</th><th>비고</th></tr></thead><tbody>
${facts.DELIVERY_PLANS.filter((p) => p.id !== 'custom').map((p) => `<tr><td>${esc(p.name)}</td><td>${p.fee}%</td><td>${p.dfee ? fmt(p.dfee) + '원' : '대행 별도'}</td><td>${esc(p.note)}</td></tr>`).join('')}
</tbody></table>
<p>상생요금제 구간은 배민의 경우 3개월 단위 일평균 배달 매출로 산정되고, 쿠팡이츠는 1구간 요율로 먼저 정산한 뒤 월 마감 후 실제 구간과의 차액을 환급합니다. 따라서 매출 하위 구간 사장님도 정산서상으로는 한동안 높은 수수료가 찍힐 수 있습니다. 계약서상 요율과 지역별 배달비가 다르면 ‘직접 입력’을 선택해 수정하세요.</p>
<h2>목표 마진 메뉴가 역산 공식</h2>
<p>원하는 순마진율을 t라고 할 때, 판매가 P는 다음 등식을 만족해야 합니다. 부가세를 판매가에서 분리(P ÷ 1.1)하고, 판매가에 비례하는 비용(중개·결제수수료)과 고정 금액 비용(배달비·원가·쿠폰)을 나누면 깔끔하게 역산됩니다.</p>
<div class="formula">목표 메뉴가 P = (배달비 + 원가 + 쿠폰) ÷ (1/1.1 − 중개수수료율 − 결제수수료율 − 목표 순마진율)</div>
<p>위 예시(원가 7,000원·배달비 3,400원·7.8%·3%)에서 순마진 25%를 원하면 분모는 0.9091 − 0.078 − 0.03 − 0.25 = 0.5511, 분자는 10,400원이므로 P ≈ 18,872원 → 100원 단위 올림 <strong>18,900원</strong>이 됩니다. 반대로 분모가 0 이하가 되면 어떤 가격으로도 목표 마진을 달성할 수 없다는 뜻이므로, 수수료가 낮은 요금제로 바꾸거나 원가 구조를 먼저 손봐야 합니다. 더 자세한 가격 전략은 <a href="/bible/delivery-menu-price-formula">배달 메뉴가 역산 공식 바이블</a>에서 다룹니다.</p>
<h2>이 계산기를 200% 활용하는 3가지 방법</h2>
<ol><li><strong>요금제 시나리오 비교:</strong> 같은 메뉴로 요금제 프리셋만 바꿔 가며 1주문 순수익 차이를 확인하고, 월 주문 수를 곱해 연간 차이를 계산하세요.</li><li><strong>쿠폰 손익분기 점검:</strong> 쿠폰·광고비 슬라이더를 올려 순마진이 10% 아래로 떨어지는 지점을 찾으면 감당 가능한 최대 쿠폰 금액이 나옵니다.</li><li><strong>링크 공유:</strong> ‘결과 링크 복사’ 버튼을 누르면 현재 입력값이 URL에 그대로 담겨, 동업자·세무사·가족 단톡방에 같은 화면을 공유할 수 있습니다.</li></ol>`;
  const faq = [
    { q: '배달앱 수수료에 부가세가 붙나요?', a: '플랫폼 중개이용료와 업주 부담 배달비는 대부분 VAT 별도로 고지됩니다. 일반과세자는 이 부가세를 매입세액으로 공제받기 때문에 실질 비용은 고지 금액과 같고, 이 계산기도 그 기준으로 계산합니다. 간이과세자나 면세사업자는 부가세 역산 토글을 끄고 비교해 보세요.' },
    { q: '순마진율은 몇 %가 적정한가요?', a: '배달 전문 매장의 경우 임대료·인건비를 빼기 전 1주문 순마진율이 20~30%는 되어야 월 고정비를 감당하고 사장님 인건비가 남는 경우가 많습니다. 15% 미만이라면 요금제·메뉴가·원가 중 하나를 반드시 조정해야 하는 신호입니다.' },
    { q: '상생요금제 구간은 어떻게 확인하나요?', a: '배민은 배민셀프서비스의 요금제 안내에서 직전 3개월 일평균 배달 매출 기준 구간을, 쿠팡이츠는 월 정산 내역의 환급 항목에서 실제 적용 구간을 확인할 수 있습니다. 구간이 불확실하면 1구간(가장 높은 요율)으로 보수적으로 계산하는 것을 권장합니다.' },
    { q: '입력한 매출 정보가 저장되나요?', a: '아니요. 모든 계산은 사장님 브라우저 안에서 수행되며, 입력값 자체는 저장되지 않습니다. 벤치마크 비교를 위해 업종과 순마진율 같은 익명 통계 수치만 집계되며 개인을 식별할 수 있는 정보는 수집하지 않습니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['delivery-store-profit'] || []);
}

/* ───────────────────────── 2. 셀러 ROAS ───────────────────────── */
function seller(q, ctx) {
  const calc = { ...CALCULATORS[1], lead: '중국·미국 사입 원가를 실시간 환율로 원화 환산하고, 관부가세·물류비, 스마트스토어·쿠팡 윙·로켓그로스 수수료, 부가세, 반품 손실까지 뺀 광고 전 순마진을 구합니다. 그 마진으로 광고를 돌려도 적자가 나지 않는 손익분기 ROAS와 최대 CPA, 손익분기 CPC를 신호등으로 판독합니다.' };
  const fx = require('../lib/fx').publicRates();
  const market = qs(q, 'market', Object.keys(E.MARKETS), 'ss-naver');
  const M = E.MARKETS[market];
  const cur = qs(q, 'cur', ['KRW', 'CNY', 'USD'], 'CNY');
  const s = {
    cur, unit: qv(q, 'unit', cur === 'KRW' ? 6000 : cur === 'CNY' ? 25 : 4), ship: qv(q, 'ship', 1500), market, fee: qv(q, 'fee', M.feeRate), price: qv(q, 'price', 19900),
    pack: qv(q, 'pack', M.defLogi), ret: qv(q, 'ret', 3), cpc: qv(q, 'cpc', 350), cvr: qv(q, 'cvr', 2.5)
  };
  const r = E.seller(s, fx);
  const unitRange = cur === 'KRW' ? [0, 200000, 100] : cur === 'CNY' ? [0, 1000, 0.5] : [0, 200, 0.1];
  const statusText = { safe: '🟢 안전 — 현재 CPC로 광고해도 마진이 남습니다', caution: '🟡 주의 — 손익분기 CPC에 근접했습니다', danger: '🔴 적자위험 — 광고할수록 손해입니다' }[r.status];
  const form = `
<fieldset><legend>① 사입 원가 (실시간 환율)</legend>
${seg('cur', '사입 통화', [['KRW', '🇰🇷 KRW'], ['CNY', '🇨🇳 CNY 위안'], ['USD', '🇺🇸 USD 달러']], cur)}
<p class="fx-note" data-fx-note>적용 환율: 1 CNY = <strong class="tnum">${fmt(fx.CNY, 2)}원</strong> · 1 USD = <strong class="tnum">${fmt(fx.USD, 2)}원</strong> <small>(${esc(fx.source)}${fx.updated_at_kst ? ' · ' + esc(fx.updated_at_kst.slice(0, 16).replace('T', ' ')) : ''})</small></p>
${range('unit', '개당 사입 원가', unitRange[0], unitRange[1], unitRange[2], s.unit, cur === 'KRW' ? '원' : cur === 'CNY' ? '¥' : '$')}
${range('ship', '개당 관부가세 + 해운·물류비', 0, 20000, 50, s.ship, '원')}
</fieldset>
<fieldset><legend>② 판매 마켓 & 가격</legend>
${select('market', '판매 마켓 프리셋', Object.entries(E.MARKETS).map(([k, m]) => [k, `${m.name} · ${m.feeRate}%`]), market)}
<p class="plan-note" data-plan-note>${esc(facts.MARKETS.find((m) => m.id === market).note)}</p>
${range('fee', '실효 판매수수료 (VAT 포함)', 0, 30, 0.01, s.fee, '%')}
${range('price', '판매가', 1000, 300000, 100, s.price, '원')}
${range('pack', M.logistics === 'rg' ? '로켓그로스 입출고·배송비' : '포장·택배비', 0, 10000, 50, s.pack, '원', '개당')}
${range('ret', '평균 반품·불량 손실률', 0, 30, 0.5, s.ret, '%', '매출 대비')}
</fieldset>
<fieldset><legend>③ 광고 지표</legend>
${range('cpc', '광고 클릭당 단가 (CPC)', 50, 3000, 10, s.cpc, '원')}
${range('cvr', '구매 전환율 (CVR)', 0.1, 20, 0.1, s.cvr, '%')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="${r.status}">
  <p class="rh-label">손익분기 ROAS (Break-Even ROAS)</p>
  <p class="rh-value tnum">${o('beRoas', r.beRoas ? pct(r.beRoas, 0) : '적자 구조')}</p>
  <p class="rh-sub signal" data-out="status">${statusText}</p>
</div>
<div class="card"><h2 class="card-h">🚦 핵심 판독기</h2>
<div class="signal-row" data-signal="${r.status}"><span class="sig sig-safe">안전</span><span class="sig sig-caution">주의</span><span class="sig sig-danger">적자위험</span></div>
<div class="kpi-grid tnum">
<div><span>광고 전 개당 순마진</span><strong>${o('preAd', won(r.preAd))}</strong></div>
<div><span>광고 전 순마진율</span><strong>${o('margin', pct(r.margin))}</strong></div>
<div class="hl"><span>최대 허용 CPA</span><strong>${o('maxCpa', won(r.maxCpa))}</strong></div>
<div><span>손익분기 CPC</span><strong>${o('beCpc', won(r.beCpc))}</strong></div>
<div><span>현재 CPA (CPC÷CVR)</span><strong>${o('cpa', won(r.cpa))}</strong></div>
<div><span>예상 ROAS</span><strong>${o('expRoas', r.expRoas ? pct(r.expRoas, 0) : '-')}</strong></div>
<div class="wide"><span>광고 후 개당 순이익</span><strong>${o('postAd', won(r.postAd))}</strong></div>
</div></div>
<div class="card"><h2 class="card-h">판매가 분해 워터폴</h2><div class="chart" data-chart="waterfall" role="img" aria-label="판매가 구성 워터폴 차트"></div>
<table class="mini-table tnum" data-table="breakdown"><tbody>${r.breakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.price ? b.value / r.price * 100 : 0)}</td></tr>`).join('')}</tbody></table></div>`;
  const guide = `
<h2>손익분기 ROAS란 무엇이고 왜 셀러의 생명선인가</h2>
<p>ROAS(Return On Ad Spend)는 광고비 1원당 매출이 몇 원 발생했는지를 나타내는 지표입니다. 광고 관리자 화면에 ROAS 300%가 찍히면 좋아 보이지만, 그 상품의 광고 전 마진율이 25%라면 손익분기 ROAS는 400%이기 때문에 실제로는 팔수록 적자입니다. 그래서 광고를 켜기 전에 반드시 “내 상품의 손익분기 ROAS”를 먼저 알아야 합니다.</p>
<div class="formula">손익분기 ROAS(%) = 판매가 ÷ 광고 전 개당 순마진 × 100 = 1 ÷ 광고 전 순마진율 × 100</div>
<div class="formula">최대 허용 CPA = 광고 전 개당 순마진 · 손익분기 CPC = 최대 CPA × 구매 전환율</div>
<p>예를 들어 판매가 19,900원 상품의 광고 전 순마진이 6,000원이라면 손익분기 ROAS는 19,900 ÷ 6,000 × 100 = 약 332%입니다. 전환율이 2.5%라면 클릭 40번에 1개가 팔리므로, 클릭당 150원(6,000원 × 2.5%)을 넘게 쓰면 적자가 됩니다. 이 계산기는 현재 입력한 CPC와 전환율로 예상 ROAS와 광고 후 개당 순이익까지 계산해 신호등으로 보여 줍니다.</p>
<h2>마켓별 수수료 프리셋 (2026 기준)</h2>
<table><thead><tr><th>마켓</th><th>실효 수수료(VAT 포함)</th><th>물류</th><th>설명</th></tr></thead><tbody>
${facts.MARKETS.map((m) => `<tr><td>${esc(m.name)}</td><td>${E.MARKETS[m.id] ? E.MARKETS[m.id].feeRate + '%' : '-'}</td><td>${m.logistics ? '쿠팡 풀필먼트' : '판매자 직접'}</td><td>${esc(m.note)}</td></tr>`).join('')}
</tbody></table>
<p>쿠팡 윙·로켓그로스의 카테고리 판매수수료는 VAT 별도로 고지되므로(대부분 10.8%), 계산기는 VAT를 포함한 실효율 11.88%를 기본값으로 씁니다. 패션·가전 등 카테고리별 요율이 다르면 ‘실효 판매수수료’를 직접 수정하세요.</p>
<h2>환율 1%가 사입 원가에 미치는 영향</h2>
<p>위안화 25위안짜리 상품을 1,000개 사입할 때 환율이 194.5원에서 199.6원으로 약 2.6% 오르면 개당 원가는 4,863원에서 4,990원으로 127원, 총 12만 7천 원 늘어납니다. 마진이 얇은 상품일수록 환율 변동이 손익분기 ROAS를 크게 흔들기 때문에, 이 계산기는 BoozaThink 환율 버스(자매 서비스 실시간 환율)를 우선 적용하고 연결이 없을 때는 서버 폴백 환율로 끊김 없이 계산합니다.</p>
<table><thead><tr><th>시나리오</th><th>판매가</th><th>광고 전 순마진</th><th>손익분기 ROAS</th><th>판독</th></tr></thead><tbody>
<tr><td>고마진 자체 브랜드</td><td>29,900원</td><td>12,000원</td><td>249%</td><td>광고 공격 가능</td></tr>
<tr><td>일반 위탁·사입 상품</td><td>19,900원</td><td>5,000원</td><td>398%</td><td>키워드 선별 필수</td></tr>
<tr><td>저가 경쟁 상품</td><td>9,900원</td><td>1,500원</td><td>660%</td><td>광고 비추천, 자연유입 위주</td></tr>
</tbody></table>
<p>손익분기 ROAS 공식의 유도 과정과 실제 셀러 사례는 <a href="/bible/break-even-roas-formula">손익분기 ROAS 완전 가이드</a>에서, 로켓그로스 물류비 구조는 <a href="/bible/coupang-rocket-growth-vs-wing">로켓그로스 vs 윙 비교</a>에서 자세히 다룹니다.</p>`;
  const faq = [
    { q: '손익분기 ROAS는 몇 % 이하여야 안전한가요?', a: '정답은 상품마다 다르지만, 손익분기 ROAS가 300% 이하면 광고로 확장하기 유리한 구조, 300~500%는 키워드와 소재를 선별해야 하는 구조, 500%를 넘으면 광고보다 상세페이지·가격 구조 개선이 먼저인 경우가 많습니다.' },
    { q: '광고 관리자의 ROAS와 이 계산기의 ROAS가 다른 이유는?', a: '광고 관리자의 ROAS는 광고로 발생한 매출 ÷ 광고비로 계산되며, 반품·수수료·원가를 고려하지 않습니다. 이 계산기의 손익분기 ROAS는 그 광고 ROAS가 최소 얼마 이상이어야 적자가 아닌지를 알려 주는 기준선입니다.' },
    { q: '로켓그로스 보관료는 어떻게 반영하나요?', a: '보관료는 재고 회전 일수에 따라 달라지므로, 개당 평균 보관료를 추정해 입출고·배송비 입력값에 더해 넣는 방식을 권장합니다. 회전이 느린 상품일수록 보관료가 마진을 크게 깎습니다.' },
    { q: '환율은 언제 기준인가요?', a: '계산기 상단에 표시된 출처와 시각의 환율이 적용됩니다. 실시간 환율 버스에 연결되지 않은 환경에서는 서버 폴백 환율이 사용되므로, 실제 송금 환율과 차이가 있다면 원화(KRW)로 전환해 실제 원가를 직접 입력하세요.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['ecommerce-seller-lab'] || []);
}

/* ───────────────────────── 3. 정책자금 ───────────────────────── */
const REGIONS = [['seoul', '서울'], ['gyeonggi', '경기'], ['incheon', '인천'], ['busan', '부산'], ['daegu', '대구'], ['gwangju', '광주'], ['daejeon', '대전'], ['ulsan', '울산'], ['sejong', '세종'], ['gangwon', '강원'], ['chungbuk', '충북'], ['chungnam', '충남'], ['jeonbuk', '전북'], ['jeonnam', '전남'], ['gyeongbuk', '경북'], ['gyeongnam', '경남'], ['jeju', '제주']];

function programCards(r) {
  return r.matches.map((m, i) => {
    const p = facts.POLICY_PROGRAMS.find((x) => x.id === m.id);
    const name = m.id === 'kodit-regional' ? p.name.replace('지역신용보증재단', r.regionGuarantee) : p.name;
    return `<li class="prog"><div class="prog-head"><span class="prog-rank">${i + 1}</span><h3>${esc(name)}</h3><span class="fit" title="조건 적합도">${m.fit}%</span></div>
<p class="prog-why">✅ ${esc(m.why)}</p>
<dl class="prog-dl"><div><dt>지원 한도</dt><dd>${esc(p.limit)}</dd></div><div><dt>금리·조건</dt><dd>${esc(p.rate)}</dd></div><div><dt>기간</dt><dd>${esc(p.term)}</dd></div><div><dt>신청처</dt><dd>${esc(p.where)}</dd></div></dl>
<details class="docs"><summary>필요 서류 체크리스트 (${p.docs.length})</summary><ul class="checklist">${p.docs.map((d) => `<li><label><input type="checkbox"> ${esc(d)}</label></li>`).join('')}</ul></details></li>`;
  }).join('');
}

function policy(q, ctx) {
  const calc = { ...CALCULATORS[2], lead: '업종·지역·업력·연매출·상시근로자 수·고금리 대출 보유액·무인기기 도입 계획만 넣으면, 2026년 소진공·중진공·지역신보·희망리턴패키지 핵심 지원사업 중 조건에 맞는 사업을 적합도 순으로 매칭하고, 연 4.5% 대환대출 이자 절감액과 스마트상점 보조금 적용 후 자부담금을 즉시 계산합니다.' };
  const s = {
    ind: qs(q, 'ind', ['food', 'retail', 'mfg', 'service'], 'food'), region: qs(q, 'region', REGIONS.map((x) => x[0]), 'seoul'), age: qs(q, 'age', ['pre', 'lt1', 'lt3', 'lt7', 'gte7'], 'lt3'),
    sales: qv(q, 'sales', 15000), emp: qs(q, 'emp', ['lt5', 'gte5'], 'lt5'), hiloan: qv(q, 'hiloan', 3000), hirate: qv(q, 'hirate', 9.5), kiosk: q.kiosk === '0' ? 0 : 1, devcost: qv(q, 'devcost', 600), srate: qv(q, 'srate', 70)
  };
  const r = E.policy(s);
  const form = `
<fieldset><legend>① 사업장 기본 정보</legend>
${select('ind', '업종', [['food', '외식·카페'], ['retail', '도소매·온라인셀러'], ['mfg', '제조·수리 (소공인)'], ['service', '개인서비스 (미용·세탁 등)']], s.ind)}
${select('region', '지역', REGIONS, s.region)}
${select('age', '업력', [['pre', '예비창업'], ['lt1', '1년 미만'], ['lt3', '1~3년 미만'], ['lt7', '3~7년 미만'], ['gte7', '7년 이상']], s.age)}
${range('sales', '연매출 규모', 0, 100000, 500, s.sales, '만원')}
${seg('emp', '상시근로자 수', [['lt5', '5인 미만'], ['gte5', '5인 이상']], s.emp)}
</fieldset>
<fieldset><legend>② 고금리 대출 대환</legend>
${range('hiloan', '연 7% 이상 고금리 사업자대출 보유액', 0, 20000, 100, s.hiloan, '만원')}
${range('hirate', '현재 대출 금리', 0, 20, 0.1, s.hirate, '%')}
</fieldset>
<fieldset><legend>③ 무인기기 도입 (스마트상점)</legend>
${toggle('kiosk', '키오스크·테이블오더·서빙로봇 도입 계획 있음', s.kiosk === 1)}
${range('devcost', '도입 장비 공급가 합계', 0, 2000, 10, s.devcost, '만원')}
${range('srate', '국비 지원율', 50, 80, 5, s.srate, '%', '일반 50~70%, 우대 상향')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="safe">
  <p class="rh-label">조건 부합 지원사업</p>
  <p class="rh-value tnum">${o('count', r.matches.length + '건')}</p>
  <p class="rh-sub">${o('sohoText', r.soho ? '소상공인 요건 충족 (상시근로자 5인 미만·제조 10인 미만)' : '소상공인 요건 초과 → 중소기업 자금 위주 검토')}</p>
</div>
<div class="card"><h2 class="card-h">💸 고금리 → 연 4.5% 대환 이자 절감</h2>
<div class="kpi-grid tnum"><div class="hl"><span>연간 이자 절감</span><strong>${o('annual', won(r.refinance.annual))}</strong></div><div><span>월 평균 절감</span><strong>${o('monthly', won(r.refinance.monthly))}</strong></div><div><span>10년 분할 총이자 절감</span><strong>${o('tenYear', won(r.refinance.tenYear))}</strong></div><div><span>대환 적용액</span><strong>${o('refAmt', fmt(r.refinance.amount) + '만원')}</strong></div></div>
<p class="note" data-out="refNote">${r.refinance.eligible ? (r.refinance.over > 0 ? `한도 5,000만원 초과분 ${fmt(r.refinance.over)}만원은 대환 대상에서 제외됩니다.` : '연 7% 이상 고금리 사업자대출 전액이 대환 한도 내입니다.') : '연 7% 이상 고금리 대출이 없거나 사업자 요건 미충족으로 대환 대상이 아닙니다.'}</p>
<div class="chart" data-chart="refi" role="img" aria-label="현재 금리와 4.5% 대환 금리의 연간 이자 비교"></div></div>
<div class="card"><h2 class="card-h">🤖 스마트상점 보조금 적용 자부담</h2>
<div class="kpi-grid tnum"><div><span>장비 공급가</span><strong>${o('devcostOut', fmt(r.smart.devcost) + '만원')}</strong></div><div class="hl"><span>국비 지원액</span><strong>${o('subsidy', fmt(r.smart.subsidy) + '만원')}</strong></div><div><span>사장님 자부담</span><strong>${o('selfPay', fmt(r.smart.selfPay) + '만원')}</strong></div><div><span>한도</span><strong>${o('capText', r.smart.capped ? '500만원 한도 적용' : '한도 내')}</strong></div></div></div>
<div class="card"><h2 class="card-h">📋 2026 맞춤 지원사업 매칭 리스트</h2><ol class="prog-list" data-out-html="programs">${programCards(r)}</ol></div>`;
  const guide = `
<h2>2026 소상공인 정책자금, 이 순서로 확인하세요</h2>
<p>정책자금은 크게 ① 갚아야 하는 융자(소진공 정책자금, 중진공 자금, 지역신보 보증부 대출), ② 갚지 않아도 되는 보조금(스마트상점 기술보급, 희망리턴패키지 점포철거비 등), ③ 기존 고금리 부채의 이자를 낮추는 대환 프로그램으로 나뉩니다. 대부분의 사장님은 ①만 알고 있지만, 실제로 현금흐름을 가장 빠르게 개선하는 것은 ③ 대환과 ② 보조금인 경우가 많습니다.</p>
<table><thead><tr><th>구분</th><th>대표 사업</th><th>핵심 조건</th><th>사장님이 얻는 것</th></tr></thead><tbody>
<tr><td>대환</td><td>소상공인 저금리 대환대출</td><td>연 7% 이상 사업자대출 보유</td><td>연 4.5% 고정, 최대 5,000만원, 10년 분할</td></tr>
<tr><td>융자</td><td>소진공 일반경영안정자금</td><td>상시근로자 5인 미만(제조 10인 미만)</td><td>최대 7,000만원, 정책 기준금리 연동</td></tr>
<tr><td>융자</td><td>지역신보 특례보증</td><td>지역 소재 사업자</td><td>보증서 대출 + 지자체 이차보전 1.0~2.5%p</td></tr>
<tr><td>보조금</td><td>스마트상점 기술보급</td><td>영업 중인 점포, 공급사 견적</td><td>공급가 50~70% 국비, 최대 500만원</td></tr>
<tr><td>보조금</td><td>희망리턴패키지</td><td>폐업(예정)·60일 이상 운영·유상임차</td><td>점포철거비 최대 600만원, 재기 교육</td></tr>
</tbody></table>
<h2>대환대출 이자 절감은 이렇게 계산합니다</h2>
<div class="formula">첫해 연간 이자 절감 ≈ 대환 적용액(최대 5,000만원) × (현재 금리 − 4.5%)</div>
<p>연 9.5% 사업자대출 3,000만 원을 연 4.5%로 갈아타면 첫해 이자는 285만 원에서 135만 원으로 줄어 <strong>연 150만 원, 월 12만 5천 원</strong>이 절감됩니다. 10년 원리금균등 분할 기준 총이자로 비교하면 약 927만 원의 차이가 납니다. 다만 기존 대출의 중도상환수수료, 대표자 신용점수(NCB 919점 이하) 요건, 대상 채무의 취급 시점 요건을 반드시 공고문으로 확인해야 합니다. 상세한 신청 순서는 <a href="/bible/refinance-loan-4-5-percent">4.5% 대환대출 바이블</a>에 정리했습니다.</p>
<h2>스마트상점 보조금 자부담 계산법</h2>
<div class="formula">자부담 = 장비 공급가 − min(공급가 × 국비 지원율, 500만원)</div>
<p>테이블오더 10대와 키오스크 1대의 공급가가 600만 원이고 국비 지원율이 70%라면 국비 420만 원, 자부담 180만 원입니다. 공급가가 900만 원이라면 70%는 630만 원이지만 한도 500만 원이 적용되어 자부담은 400만 원이 됩니다. 보조금은 보통 약정 후 2년 의무 사용 조건이 붙으므로, 렌탈 약정 기간과 겹치지 않게 계약하세요. 인건비 절감 효과까지 함께 보려면 <a href="/calculators/labor-automation">주휴수당 절벽 & 무인화 Payback 계산기</a>를 이어서 사용해 보세요.</p>
<div class="callout warn">⚠️ 매칭 결과는 공개 공고의 일반 요건을 기반으로 한 1차 스크리닝입니다. 실제 지원 가능 여부는 신용점수, 연체·체납 여부, 업종 제한(유흥·사행업 등), 예산 소진 여부에 따라 달라지므로 소상공인24와 각 기관 공고문에서 최종 확인하세요.</div>`;
  const faq = [
    { q: '정책자금과 대환대출을 동시에 받을 수 있나요?', a: '사업별로 중복 제한이 다르지만, 일반적으로 신규 운전자금 성격의 정책자금과 기존 고금리 채무를 바꾸는 대환대출은 목적이 달라 병행 검토가 가능한 경우가 많습니다. 다만 보증기관 한도를 공유하는 경우가 있어 신청 순서를 상담 시 반드시 확인하세요.' },
    { q: '예비창업자도 받을 수 있는 지원이 있나요?', a: '사업자등록 전에는 대부분의 정책 융자를 받을 수 없지만, 신사업창업사관학교 같은 교육·점포체험·사업화 지원은 예비창업자가 대상입니다. 사업자등록 후에는 업력 1년 미만 전용 자금도 열리므로 등록 시점을 전략적으로 잡는 것이 좋습니다.' },
    { q: '스마트상점 보조금은 렌탈도 지원되나요?', a: '2026년 기술보급사업은 구입형 외에 렌탈형 지원 유형도 운영되는 것이 일반적입니다. 렌탈형은 약정 기간 렌탈료 일부를 지원하는 방식이므로, 총 렌탈료와 의무 사용 기간을 함께 비교해야 합니다.' },
    { q: '매칭 적합도 %는 무엇을 의미하나요?', a: '입력한 업종·업력·매출·고용·부채 조건이 각 사업의 대표적인 지원 요건과 얼마나 맞는지를 BoozaThink 기준으로 점수화한 값입니다. 승인 확률이 아니라 우선 검토 순서를 정하기 위한 참고 지표입니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['policy-funds-grants'] || []);
}

/* ───────────────────────── 4. 인건비 & 무인화 ───────────────────────── */
function labor(q, ctx) {
  const calc = { ...CALCULATORS[3], lead: '2026년 최저시급 10,320원 기준으로 알바 주당 근무시간이 15시간을 넘는 순간 생기는 주휴수당과 4대보험 사업주 부담의 인건비 절벽을 실측하고, 근무시간을 단축하고 테이블오더·키오스크를 도입할 때 몇 개월 만에 기기 원금을 회수하는지, 3년간 총 얼마가 절약되는지 교차 차트로 보여 줍니다.' };
  const s = {
    wage: qv(q, 'wage', 10320), hours: qv(q, 'hours', 20), staff: qv(q, 'staff', 2), ins: q.ins === '0' ? 0 : 1, cut: qv(q, 'cut', 14.5), devices: qv(q, 'devices', 4),
    mode: qs(q, 'mode', ['buy', 'rent'], 'buy'), devcost: qv(q, 'devcost', 450000), rent: qv(q, 'rent', 25000), subsidy: qv(q, 'subsidy', 0), biz: qs(q, 'biz', ['food', 'cafe', 'retail', 'service'], 'food')
  };
  const r = E.labor(s);
  const form = `
<fieldset><legend>① 알바 인건비</legend>
${range('wage', '시급', 10320, 20000, 10, s.wage, '원', '2026 최저 10,320원')}
<div class="preset-row"><button type="button" class="chip" data-preset="wage:10320">2026 최저시급 10,320원</button><button type="button" class="chip" data-preset="wage:11000">11,000원</button><button type="button" class="chip" data-preset="wage:12000">12,000원</button></div>
${range('hours', '알바 1인 주당 근무시간 (현재)', 1, 40, 0.5, s.hours, '시간')}
${range('staff', '알바 인원수', 1, 20, 1, s.staff, '명')}
${toggle('ins', '4대보험 사업주 부담분 반영', s.ins === 1, '주 15시간↑ 약 10.87%')}
${seg('biz', '업종 (벤치마크용)', [['food', '외식'], ['cafe', '카페'], ['retail', '소매'], ['service', '서비스']], s.biz)}
</fieldset>
<fieldset><legend>② 무인화 도입 시나리오</legend>
${range('cut', '도입 후 1인 주당 근무시간', 0, 40, 0.5, s.cut, '시간', '14.5시간 = 주휴 미발생')}
${range('devices', '테이블오더·키오스크 대수', 0, 30, 1, s.devices, '대')}
${seg('mode', '도입 방식', [['buy', '구매 (초기비용)'], ['rent', '월 렌탈']], s.mode)}
${range('devcost', '대당 구매가', 0, 3000000, 10000, s.devcost, '원')}
${range('rent', '대당 월 렌탈료', 0, 100000, 1000, s.rent, '원')}
${range('subsidy', '스마트상점 국비 지원율 (구매 시)', 0, 80, 5, s.subsidy, '%', '최대 500만원')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="${r.payback != null && r.payback <= 12 ? 'safe' : 'caution'}">
  <p class="rh-label">기기 원금회수 기간 (Payback Period)</p>
  <p class="rh-value tnum">${o('payback', r.payback == null ? '회수 불가' : r.mode === 'rent' ? '즉시 (렌탈)' : fmt(r.payback, 1) + '개월')}</p>
  <p class="rh-sub">3년 누적 순절감 <strong class="tnum">${o('save36', won(r.save36))}</strong></p>
</div>
<div class="card"><h2 class="card-h">⚠️ 주 14.5시간 vs 15시간 인건비 절벽 (1인 월)</h2>
<div class="kpi-grid tnum"><div><span>주 14.5시간</span><strong>${o('c145', won(r.cliff.at145.total))}</strong></div><div><span>주 15시간</span><strong>${o('c15', won(r.cliff.at15.total))}</strong></div><div class="hl"><span>단 0.5시간 차이의 월 절벽</span><strong>${o('jump', '+' + won(r.cliff.jump))}</strong></div><div><span>증가율</span><strong>${o('jumpPct', '+' + pct(r.cliff.jumpPct))}</strong></div></div>
<div class="chart" data-chart="cliff" role="img" aria-label="주당 근무시간별 1인 월 인건비 곡선, 15시간 지점 절벽 표시"></div></div>
<div class="card"><h2 class="card-h">현재 vs 도입 후 월 인건비</h2>
<div class="kpi-grid tnum"><div><span>현재 1인 월 인건비</span><strong>${o('beforeTotal', won(r.before.total))}</strong></div><div><span>도입 후 1인 월 인건비</span><strong>${o('afterTotal', won(r.after.total))}</strong></div><div><span>월 인건비 절감 (전체)</span><strong>${o('laborSave', won(r.laborSave))}</strong></div><div><span>기기 초기비용 (자부담)</span><strong>${o('initial', won(r.initial))}</strong></div><div><span>월 렌탈료</span><strong>${o('monthlyDevice', won(r.monthlyDevice))}</strong></div><div class="hl"><span>월 순절감</span><strong>${o('netMonthly', won(r.netMonthly))}</strong></div></div></div>
<div class="card"><h2 class="card-h">36개월 누적 비용 손익 교차 차트</h2><div class="chart" data-chart="cross" role="img" aria-label="현행 인건비 누적과 무인화 도입 후 누적 비용의 36개월 교차 차트"></div></div>`;
  const guide = `
<h2>주 15시간이 ‘인건비 절벽’인 이유</h2>
<p>근로기준법상 1주 소정근로시간이 15시간 이상이고 그 주를 개근한 근로자에게는 유급 주휴일, 즉 주휴수당을 줘야 합니다. 동시에 월 60시간(주 약 15시간) 이상 근로자는 국민연금·건강보험·고용보험 가입 대상이 되어 사업주 부담분이 추가됩니다. 그래서 주 14.5시간과 주 15시간은 근무시간 차이는 0.5시간뿐인데 월 인건비는 수십 % 차이가 납니다.</p>
<div class="formula">주휴수당(주) = (1주 소정근로시간 ÷ 40) × 8시간 × 시급 (주 15시간 이상·개근 시, 최대 8시간분)</div>
<div class="formula">1인 월 인건비 = (시급 × 주 근무시간 + 주휴수당) × 4.345주 × (1 + 사업주 4대보험 부담률)</div>
<table><thead><tr><th>주 근무시간</th><th>주휴수당(주)</th><th>월 급여(주휴 포함)</th><th>사업주 4대보험</th><th>1인 월 총인건비</th></tr></thead><tbody>
${[10, 14.5, 15, 20, 30, 40].map((h) => { const m = E.staffMonthly(10320, h, true); const w = E.weeklyPay(10320, h); return `<tr><td>${h}시간</td><td>${won(w.holiday)}</td><td>${won(m.pay)}</td><td>${won(m.ins)}</td><td><strong>${won(m.total)}</strong></td></tr>`; }).join('')}
</tbody></table>
<p>2026년 최저시급 10,320원 기준으로 주 14.5시간 알바의 월 인건비는 약 ${won(E.staffMonthly(10320, 14.5, true).total)}, 주 15시간은 약 ${won(E.staffMonthly(10320, 15, true).total)}입니다. 0.5시간을 더 쓰는 대가로 매달 약 ${won(E.staffMonthly(10320, 15, true).total - E.staffMonthly(10320, 14.5, true).total)}이 추가되는 셈입니다. 위 표의 4대보험은 2026년 사업주 부담률(국민연금 4.75%, 건강보험 3.595%, 장기요양 건강보험료의 13.14%, 고용보험 1.15%, 산재 약 0.9%) 합계 약 ${E.INS_TOTAL.toFixed(2)}%를 적용했습니다(주 15시간 미만은 산재만 반영).</p>
<h2>무인화 Payback 계산 원리</h2>
<div class="formula">원금회수 기간(개월) = 기기 초기 자부담 ÷ (월 인건비 절감액 − 월 렌탈료)</div>
<p>예를 들어 알바 2명의 주 근무시간을 20시간에서 14.5시간으로 줄이면 1인당 월 약 54만 원, 2명이면 약 107만 원의 인건비가 줄어듭니다. 테이블오더 4대를 대당 45만 원에 구매(180만 원)하면 약 1.7개월 만에 원금을 회수하고, 이후는 고스란히 절감액이 됩니다. 렌탈이라면 초기비용은 0원이지만 월 렌탈료만큼 절감액이 줄어듭니다. 단, 근무시간 단축은 업무량과 서비스 품질이 유지되는 범위에서 설계해야 하며, 주휴수당 회피만을 목적으로 한 ‘쪼개기 계약’은 분쟁 위험이 있으니 근로계약서를 명확히 작성하세요. 자세한 내용은 <a href="/bible/weekly-holiday-pay-15-hours">주휴수당 15시간 절벽 바이블</a>과 <a href="/bible/table-order-kiosk-payback">테이블오더 원금회수 바이블</a>에서 확인할 수 있습니다.</p>`;
  const faq = [
    { q: '주 15시간 미만 알바는 4대보험이 전혀 없나요?', a: '월 60시간 미만(주 15시간 미만) 초단시간 근로자는 국민연금·건강보험·고용보험이 원칙적으로 적용 제외되지만, 산재보험은 근로시간과 무관하게 적용됩니다. 다만 3개월 이상 계속 근로 등 예외 요건이 있어 고용보험이 적용되는 경우도 있습니다.' },
    { q: '주휴수당은 결근하면 안 줘도 되나요?', a: '주휴수당은 1주 소정근로일을 개근한 경우에 발생합니다. 지각·조퇴는 결근이 아니므로 주휴수당 지급 대상이며, 결근이 있으면 그 주의 주휴수당은 발생하지 않습니다. 이 계산기는 개근을 가정해 계산합니다.' },
    { q: '테이블오더 렌탈과 구매 중 무엇이 유리한가요?', a: '사용 기간이 길고 매장 운영이 안정적이라면 구매가 3년 총비용 측면에서 유리한 경우가 많고, 초기 현금이 부족하거나 폐업·이전 가능성이 있다면 렌탈이 유연합니다. 스마트상점 보조금은 구매형 지원율이 높게 책정되는 경우가 많아 구매 시나리오도 꼭 비교해 보세요.' },
    { q: '2026년 최저시급은 얼마인가요?', a: '2026년 최저시급은 시간당 10,320원으로 2025년 10,030원보다 2.9% 인상되었습니다. 주 40시간 근무 시 주휴시간을 포함한 월 209시간 기준 월 환산액은 2,156,880원입니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['labor-tax-franchise'] || []);
}

function index(ctx) {
  const crumbs = [{ name: '홈', path: '/' }, { name: '실전 계산기', path: '/calculators' }];
  const body = `<div class="container">${breadcrumbHtml(crumbs)}
<header class="page-head"><span class="eyebrow">BoozaThink 4대 실전 계산기</span><h1>사장님·셀러 4대 실전 손익 계산기</h1><p class="lead">배달앱 순수익, 셀러 손익분기 ROAS, 정책자금 매칭, 주휴수당 절벽과 무인화 원금회수까지. 매일 확인해야 할 숫자를 0.01초 만에 계산하고, 결과를 링크와 영수증 이미지로 공유하세요.</p></header>
<div class="calc-grid">${CALCULATORS.map((c) => `<a class="calc-card card" href="/calculators/${c.slug}"><span class="cc-ico" aria-hidden="true">${c.icon}</span><h2>${esc(c.name)}</h2><p>${esc(c.desc)}</p><span class="cc-cta">계산 시작 →</span></a>`).join('')}</div>
<section class="prose"><h2>BoozaThink 계산기는 무엇이 다른가요?</h2><p>모든 계산기는 2026년 공시된 플랫폼 요금제, 최저임금, 4대보험 요율, 정책자금 공고를 단일 마스터 데이터로 관리하며, 입력 즉시 브라우저에서 재계산됩니다. 입력값은 URL에 담겨 동업자·세무사와 같은 화면을 공유할 수 있고, 감열지 영수증 스타일의 손익 진단 이미지로 저장해 단톡방에 바로 올릴 수 있습니다. 계산 공식과 가정은 각 계산기 하단에 모두 공개합니다.</p></section></div>`;
  return { body, jsonld: [breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: CALCULATORS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: abs('/calculators/' + c.slug), name: c.name })) }] };
}

module.exports = { delivery, seller, policy, labor, index, programCards };
