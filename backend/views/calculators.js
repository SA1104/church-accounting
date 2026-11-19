'use strict';
const E = require('../public/js/calc-engine.js');
const { esc, CALCULATORS, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const { icon } = require('./icons');
const facts = require('../data/facts');

const won = E.won, pct = E.pct, fmt = E.fmt, manwon = E.manwon;

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
  <button type="button" class="btn btn-primary" data-action="copy-link">${icon('link', 16)} 내 매장 시뮬레이션 링크 복사</button>
  <button type="button" class="btn" data-action="receipt">${icon('receipt', 16)} 손익 진단 영수증 PNG 저장</button>
  <button type="button" class="btn btn-ghost" data-action="reset">초기화</button>
  <span class="toast" role="status" aria-live="polite" data-toast></span>
</div>`;
}
function benchBox() {
  return `<div class="card bench" data-bench aria-live="polite"><div class="bench-head"><span class="pill">동종업계 익명 벤치마크</span><span class="bench-src" data-bench-src>실시간 시뮬레이션 비교</span></div><p class="bench-text" data-bench-text>계산이 끝나면 같은 업종 사장님들의 익명 시뮬레이션 평균과 비교해 드립니다.</p></div>`;
}

function pageShell(calc, q, formHtml, outHtml, guideHtml, faq, related, footnote) {
  const crumbs = [{ name: '홈', path: '/' }, { name: '부분별 손익 계산기', path: '/calculators' }, { name: calc.short, path: '/calculators/' + calc.slug }];
  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head calc-head">
    <span class="eyebrow">${icon(calc.iconKey || 'sliders', 16)} BoozaThink 정밀 시뮬레이터</span>
    <h1>${esc(calc.name)}</h1>
    <p class="lead">${esc(calc.lead)}</p>
    <p class="footnote-meta">${esc(footnote || `※ 최신 정부 고시 및 플랫폼 공식 요율 기준 반영 (데이터 검증일 ${facts.VERIFIED_AT})`)}</p>
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
    <h2>함께 읽으면 좋은 실전 바이블</h2>
    <ul class="rel-list">${related.map((a) => `<li><a href="/bible/${a.slug}">${esc(a.title)}</a></li>`).join('')}</ul>
  </article>
  ${faqHtml(faq)}
  <aside class="trust-box"><h2>데이터 기준 각주 & 면책 고지</h2><p>공식 참조 출처: 소상공인시장진흥공단, 공정거래위원회, 국세청, 고용노동부(현행 2026년 및 2027.1.1 시행 확정 최저임금 고시 포함), 4대사회보험 정보연계센터, 법제처(상가건물 임대차보호법 시행령). 검증 기준일: <strong>${facts.VERIFIED_AT}</strong>. 본 계산기는 공개된 법령·고시 요율에 기초한 참고용 추정치이며, 실제 정산액·세액·대출 조건은 개별 계약서와 공고문, 세무·노무 전문가 상담으로 최종 확인하시기 바랍니다. (<a href="/terms-of-service">이용약관</a> · <a href="/privacy-policy">개인정보처리방침</a>)</p></aside>
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

/* ───────────────────────── 1. 배달앱 순수익 (업종별 즉시 진단 피드백 완비!) ───────────────────────── */
function delivery(q, ctx) {
  const calc = { ...CALCULATORS.find((c) => c.slug === 'delivery-margin'), lead: '메뉴 판매가에서 배민·쿠팡이츠·요기요 중개수수료, 사장님 부담 배달비, 결제수수료, 식자재·포장 원가, 부가세를 차례로 빼면 실제로 통장에 남는 1주문 순수익이 나옵니다. 업종을 선택하면 해당 업종의 통상 원가율과 비교 진단하고 목표 마진 메뉴가를 역산합니다.' };
  const plan = qs(q, 'plan', Object.keys(E.DELIVERY_PLANS), 'baemin-78');
  const P = E.DELIVERY_PLANS[plan];
  const biz = qs(q, 'biz', Object.keys(E.DELIVERY_BIZ_SPECS), 'food');
  const bSpec = E.DELIVERY_BIZ_SPECS[biz];
  const s = {
    plan, biz, price: qv(q, 'price', 20000), fee: qv(q, 'fee', P.fee), dfee: qv(q, 'dfee', P.dfee), card: qv(q, 'card', 3), cost: qv(q, 'cost', 7000),
    vat: q.vat === '0' ? 0 : 1, promo: qv(q, 'promo', 0), orders: qv(q, 'orders', 40), days: qv(q, 'days', 26), fixed: qv(q, 'fixed', 3000000),
    target: qv(q, 'target', 25), goal: qv(q, 'goal', 5000000)
  };
  const r = E.delivery(s);
  const curCogsPct = s.price > 0 ? (s.cost / s.price) * 100 : 0;
  const form = `
<fieldset><legend>1. 세부 업종 & 플랫폼 선택</legend>
${seg('biz', '내 매장 업종 (원가율 진단 & 평균 프리셋 연동)', [['food', '한식·분식'], ['chicken', '치킨·피자'], ['meat', '고기·족발'], ['cafe', '카페·디저트']], s.biz)}
<div class="biz-feedback" data-biz-feedback>
  <div class="biz-feedback-top">
    <strong data-biz-title>${esc(bSpec.name)} 통상 원가율 ${bSpec.cogsRange[0]}~${bSpec.cogsRange[1]}% (현재 ${curCogsPct.toFixed(1)}%)</strong>
    <button type="button" class="btn-xs" data-apply-biz>이 업종 평균 단가·원가 채우기</button>
  </div>
  <span data-biz-tip>${esc(bSpec.tip)}</span>
</div>
${select('plan', '배달앱 요금제 프리셋', facts.DELIVERY_PLANS.map((p) => [p.id, `${p.name} · ${p.fee}%`]), plan, '최신 상생요금제 반영')}
<p class="plan-note" data-plan-note>${esc(facts.DELIVERY_PLANS.find((p) => p.id === plan).note)}</p>
${range('price', '메뉴 판매가', 5000, 60000, 100, s.price, '원', '고객 결제가·VAT 포함')}
${range('fee', '중개수수료율', 0, 15, 0.1, s.fee, '%')}
${range('dfee', '사장님 부담 배달비', 0, 4000, 100, s.dfee, '원', '1주문당')}
${range('card', '결제수수료', 0, 5, 0.1, s.card, '%')}
</fieldset>
<fieldset><legend>2. 원가 & 판촉비</legend>
${range('cost', '식자재 + 포장용기 원가', 0, 40000, 100, s.cost, '원')}
${range('promo', '쿠폰·광고비 (주문당)', 0, 5000, 100, s.promo, '원')}
${toggle('vat', '부가세 10% 자동 역산 (일반과세자)', s.vat === 1, '판매가의 1/11')}
</fieldset>
<fieldset><legend>3. 매장 규모 & 목표 수익</legend>
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
  <p class="rh-sub">순마진율 <strong class="tnum">${o('margin', pct(r.margin))}</strong> · ${o('planName', esc(r.planName))} · ${o('bizJudge', curCogsPct > bSpec.cogsRange[1] ? '업종 평균 대비 원가율 높음' : '업종 적정 원가율 범위')}</p>
</div>
<div class="card"><h2 class="card-h">항목별 공제 워터폴</h2><div class="chart" data-chart="waterfall" role="img" aria-label="판매가에서 각 비용을 공제해 순수익에 이르는 워터폴 차트"></div>
<table class="mini-table tnum" data-table="breakdown"><tbody>${r.breakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.price ? b.value / r.price * 100 : 0)}</td></tr>`).join('')}</tbody></table></div>
<div class="card"><h2 class="card-h">월 예상 매출 vs 사장님이 가져가는 순수익</h2>
<div class="kpi-grid tnum"><div><span>월 주문</span><strong>${o('monthlyOrders', fmt(r.monthlyOrders) + '건')}</strong></div><div><span>월 예상 매출</span><strong>${o('monthlyRevenue', won(r.monthlyRevenue))}</strong></div><div><span>고정비 차감</span><strong>${o('fixed', won(r.fixed))}</strong></div><div class="hl"><span>월 실제 순수익</span><strong>${o('monthlyNet', won(r.monthlyNet))}</strong></div></div>
<div class="chart" data-chart="monthly" role="img" aria-label="월 매출 대비 순수익 비교 막대"></div></div>
<div class="card killer"><h2 class="card-h">목표 마진 달성 메뉴가 역산</h2><p class="killer-text" data-out-html="killer">사장님이 목표 순마진율 <strong>${pct(r.target, 0)}</strong>를 남기려면, 배달앱 메뉴 가격을 <strong class="tnum">${r.targetPrice ? won(r.targetPrice) : '수수료 구조상 달성 불가'}</strong>으로 세팅하거나 원가·배달비에서 <strong class="tnum">${won(r.saveNeeded)}</strong>을 절감해야 합니다.</p>
<p class="killer-text sub" data-out-html="killer2">월 순익 <strong>${won(r.goal)}</strong>이 목표라면 메뉴가 <strong class="tnum">${r.goalPrice ? won(r.goalPrice) : '-'}</strong> 또는 하루 <strong class="tnum">${r.goalOrders ? fmt(r.goalOrders) + '건' : '-'}</strong> 주문이 필요합니다.</p></div>
<div class="card"><h2 class="card-h">현장 손익 디테일 — 배달 정가 판매 vs 포장(픽업) 할인 역전 비교</h2>
<p class="killer-text sub" style="margin:0" data-out-html="pickupCompare">${(() => {
  const pDisc = Math.min(2000, Math.round(r.price * 0.1));
  const pRes = E.delivery({ ...s, price: r.price - pDisc, fee: Math.min(s.fee, 6.8), dfee: 0, promo: 0 });
  const diff = Math.round(pRes.net - r.net);
  return `포장(픽업) 고객에게 <strong class="tnum">${won(pDisc)}</strong> 즉시 할인을 걸어주더라도 사장님 부담 배달비(<strong class="tnum">${won(r.dfee)}</strong>)가 굳기 때문에 포장 1주문 순수익은 <strong class="tnum">${won(pRes.net)}</strong>으로 배달 주문보다 오히려 건당 <strong class="tnum" style="color:${diff >= 0 ? 'var(--safe)' : 'var(--danger)'}">${diff >= 0 ? '+' + won(diff) : won(diff)}</strong> ${diff >= 0 ? '더 남습니다. 매장 전면과 영수증에 픽업 할인을 적극 홍보하세요.' : '차이가 납니다.'}`;
})()}</p></div>`;
  const guide = `
<h2>배달앱 순수익은 이렇게 계산됩니다</h2>
<p>배달 매출 2만 원짜리 주문 한 건이 들어오면 플랫폼은 판매가 기준으로 중개이용료를 떼고, 결제대행(PG)사는 결제수수료를 떼며, 플랫폼 배달은 업주 부담 배달비를 별도로 정산합니다. 일반과세자라면 고객 결제가의 1/11은 국가에 납부할 부가세 매출세액이므로 사장님 몫이 아닙니다. 여기에 식자재와 보온팩·용기·일회용 수저 원가까지 빼야 비로소 실제 남는 순수익이 드러납니다.</p>
<div class="formula">1주문 순수익 = 판매가 − (판매가 × 중개수수료율) − (판매가 × 결제수수료율) − 사장님 부담 배달비 − 식자재·포장 원가 − 쿠폰·광고비 − 판매가 ÷ 11(부가세)</div>
<h2>배달앱 요금제 프리셋 비교표</h2>
<table><thead><tr><th>요금제</th><th>중개수수료</th><th>업주 부담 배달비(대표값)</th><th>비고</th></tr></thead><tbody>
${facts.DELIVERY_PLANS.filter((p) => p.id !== 'custom').map((p) => `<tr><td>${esc(p.name)}</td><td>${p.fee}%</td><td>${p.dfee ? fmt(p.dfee) + '원' : '대행 별도'}</td><td>${esc(p.note)}</td></tr>`).join('')}
</tbody></table>
<h2>목표 마진 메뉴가 역산 공식</h2>
<div class="formula">목표 메뉴가 P = (배달비 + 원가 + 쿠폰) ÷ (1/1.1 − 중개수수료율 − 결제수수료율 − 목표 순마진율)</div>
<p>매장 오픈 전 보증금·인테리어·계절별 1년 손익까지 통째로 점검하려면 <a href="/calculators/startup-master">창업 풀코스 A-to-Z 시뮬레이터</a>를, 가격 역산 실무 사례는 <a href="/bible/delivery-menu-price-formula">배달 메뉴가 역산 공식 바이블</a>을 함께 활용하세요.</p>`;
  const faq = [
    { q: '업종 선택 버튼을 바꾸면 무엇이 달라지나요?', a: '한식·분식, 치킨·피자, 고기·족발, 카페·디저트마다 현장의 통상 식자재+포장 원가율 범위와 평균 객단가가 다릅니다. 업종을 선택하면 즉시 내 메뉴의 원가율이 업종 평균 대비 적정한지 진단해 드리며, 평균값 채우기 버튼으로 업종 표준 단가·원가를 바로 불러올 수 있습니다.' },
    { q: '배달앱 수수료에 부가세가 붙나요?', a: '플랫폼 중개이용료와 업주 부담 배달비는 VAT 별도로 고지됩니다. 일반과세자는 이 부가세를 매입세액으로 공제받기 때문에 실질 비용은 고지 금액과 같으며, 간이과세자라면 부가세·종소세 통합 계산기(/calculators/vat-income-tax)도 함께 확인해 보세요.' },
    { q: '순마진율은 몇 %가 적정한가요?', a: '임대료·인건비를 빼기 전 1주문 순마진율이 최소 20~28%는 확보되어야 월 고정비와 사장님 인건비가 남는 경우가 많습니다.' },
    { q: '입력한 매출 정보가 저장되나요?', a: '아니요. 개별 입력 수치는 브라우저 안에서만 연산되며 서버에 저장되지 않습니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['delivery-store-profit'] || [], `※ 배달플랫폼 상생협의체 상생요금제 기준 반영 (검증일 ${facts.VERIFIED_AT})`);
}

/* ───────────────────────── 2. 셀러 ROAS ───────────────────────── */
function seller(q, ctx) {
  const calc = { ...CALCULATORS.find((c) => c.slug === 'seller-roas'), lead: '중국·미국 사입 원가를 환율 연동으로 원화 환산하고, 관부가세·물류비, 스마트스토어·쿠팡 윙·로켓그로스 수수료, 부가세, 반품 손실까지 뺀 광고 전 순마진을 구합니다. 그 마진으로 광고를 돌려도 적자가 나지 않는 손익분기 ROAS와 최대 CPA, 손익분기 CPC를 판독합니다.' };
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
  const statusText = { safe: '안전 구간 — 현재 CPC로 광고를 집행해도 마진이 남습니다', caution: '주의 구간 — 손익분기 CPC에 근접해 전환율 관리가 필요합니다', danger: '적자 위험 — 광고를 돌릴수록 손실이 발생합니다' }[r.status];
  const form = `
<fieldset><legend>1. 사입 원가 (환율 자동 연동)</legend>
${seg('cur', '사입 통화', [['KRW', 'KRW 원화'], ['CNY', 'CNY 위안'], ['USD', 'USD 달러']], cur)}
<p class="fx-note" data-fx-note>적용 환율: 1 CNY = <strong class="tnum">${fmt(fx.CNY, 2)}원</strong> · 1 USD = <strong class="tnum">${fmt(fx.USD, 2)}원</strong> <small>(${esc(fx.source)})</small></p>
${range('unit', '개당 사입 원가', unitRange[0], unitRange[1], unitRange[2], s.unit, cur === 'KRW' ? '원' : cur === 'CNY' ? '¥' : '$')}
${range('ship', '개당 관부가세 + 해운·물류비', 0, 20000, 50, s.ship, '원')}
</fieldset>
<fieldset><legend>2. 판매 마켓 & 가격</legend>
${select('market', '판매 마켓 프리셋', Object.entries(E.MARKETS).map(([k, m]) => [k, `${m.name} · ${m.feeRate}%`]), market)}
<p class="plan-note" data-plan-note>${esc(facts.MARKETS.find((m) => m.id === market).note)}</p>
${range('fee', '실효 판매수수료 (VAT 포함)', 0, 30, 0.01, s.fee, '%')}
${range('price', '판매가', 1000, 300000, 100, s.price, '원')}
${range('pack', M.logistics === 'rg' ? '로켓그로스 입출고·배송비' : '포장·택배비', 0, 10000, 50, s.pack, '원', '개당')}
${range('ret', '평균 반품·불량 손실률', 0, 30, 0.5, s.ret, '%', '매출 대비')}
</fieldset>
<fieldset><legend>3. 광고 효율 지표</legend>
${range('cpc', '광고 클릭당 단가 (CPC)', 50, 3000, 10, s.cpc, '원')}
${range('cvr', '구매 전환율 (CVR)', 0.1, 20, 0.1, s.cvr, '%')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="${r.status}">
  <p class="rh-label">최소 손익분기 ROAS (Break-Even ROAS)</p>
  <p class="rh-value tnum">${o('beRoas', r.beRoas ? pct(r.beRoas, 0) : '적자 구조')}</p>
  <p class="rh-sub signal" data-out="status">${statusText}</p>
</div>
<div class="card"><h2 class="card-h">광고 수익성 판독기</h2>
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
<table class="mini-table tnum" data-table="breakdown"><tbody>${r.breakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.price ? b.value / r.price * 100 : 0)}</td></tr>`).join('')}</tbody></table></div>
<div class="card killer"><h2 class="card-h">셀러 객단가 디테일 — 단품 1개 vs 2개 묶음(5% 할인) 옵션 마진 점프</h2>
<p class="killer-text sub" style="margin:0" data-out-html="bundleCompare">${(() => {
  const bPack = Math.round(s.pack * (s.market === 'cp-rg' ? 1.7 : 1.15));
  const bRes = E.seller({ ...s, unit: s.unit * 2, ship: s.ship * 2, price: Math.round(s.price * 2 * 0.95), pack: bPack }, fx);
  return `상세페이지 기본 옵션을 <strong>2개 묶음(5% 할인 · ${won(bRes.price)})</strong>으로 유도하면 포장·택배비가 1회분(${won(bPack)})만 지출되어 주문당 광고 전 순마진이 <strong class="tnum">${won(r.preAd)} → ${won(bRes.preAd)}</strong>으로 뛰고, 손익분기 ROAS 커트라인은 <strong class="tnum">${r.beRoas ? pct(r.beRoas, 0) : '-'} → ${bRes.beRoas ? pct(bRes.beRoas, 0) : '-'}</strong>로 낮아져 광고 효율이 크게 개선됩니다.`;
})()}</p></div>`;
  const guide = `
<h2>손익분기 ROAS란 무엇이고 왜 셀러의 생명선인가</h2>
<p>광고 관리자 화면에 ROAS 300%가 찍히더라도 상품의 광고 전 순마진율이 25%라면 손익분기 ROAS는 400%이므로 실제로는 광고할수록 적자입니다. 캠페인을 켜기 전에 내 상품의 손익분기 ROAS와 손익분기 CPC를 먼저 확정해야 현금이 새지 않습니다.</p>
<div class="formula">손익분기 ROAS(%) = 판매가 ÷ 광고 전 개당 순마진 × 100 = 1 ÷ 광고 전 순마진율 × 100 · 최대 허용 CPA = 광고 전 개당 순마진</div>
<h2>마켓별 수수료 프리셋 비교표</h2>
<table><thead><tr><th>마켓</th><th>실효 수수료(VAT 포함)</th><th>물류</th><th>설명</th></tr></thead><tbody>
${facts.MARKETS.map((m) => `<tr><td>${esc(m.name)}</td><td>${E.MARKETS[m.id] ? E.MARKETS[m.id].feeRate + '%' : '-'}</td><td>${m.logistics ? '쿠팡 풀필먼트' : '판매자 직접'}</td><td>${esc(m.note)}</td></tr>`).join('')}
</tbody></table>
<table><thead><tr><th>시나리오</th><th>판매가</th><th>광고 전 순마진</th><th>손익분기 ROAS</th><th>판독</th></tr></thead><tbody>
<tr><td>고마진 자체 브랜드</td><td>29,900원</td><td>12,000원</td><td>249%</td><td>광고 확장 유리</td></tr>
<tr><td>일반 위탁·사입 상품</td><td>19,900원</td><td>5,000원</td><td>398%</td><td>키워드 선별 필수</td></tr>
<tr><td>저가 경쟁 상품</td><td>9,900원</td><td>1,500원</td><td>660%</td><td>자연유입·묶음구성 우선</td></tr>
</tbody></table>`;
  const faq = [
    { q: '손익분기 ROAS는 몇 % 이하여야 안전한가요?', a: '손익분기 ROAS가 300% 이하면 광고 확장에 유리한 구조, 300~500%는 전환 키워드 선별이 필요한 구조, 500% 초과는 상세페이지 전환율 개선과 묶음 객단가 상승이 선행되어야 하는 구조입니다.' },
    { q: '광고 관리자의 ROAS와 이 계산기의 ROAS가 다른 이유는?', a: '광고 관리자는 단순 광고매출 ÷ 광고비만 보여주며 원가·수수료·반품비를 차감하지 않습니다. 이 계산기의 손익분기 ROAS는 광고 관리자의 ROAS가 최소 몇 %를 넘어야 본전인지를 알려주는 커트라인입니다.' },
    { q: '로켓그로스 보관료는 어떻게 반영하나요?', a: '평균 재고 체류일수에 따른 개당 추정 보관료를 입출고·배송비 입력란에 합산해 넣으시면 정확합니다.' },
    { q: '환율은 어떻게 적용되나요?', a: '환율 버스 또는 서버 기준 환율이 자동 적용되며, 실제 송금 환율과 차이가 있을 경우 원화(KRW) 탭에서 확정 원가를 직접 입력하실 수 있습니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['ecommerce-seller-lab'] || [], `※ 네이버 스마트스토어 판매수수료 개편 및 쿠팡 카테고리 표준 요율 반영 (검증일 ${facts.VERIFIED_AT})`);
}

/* ───────────────────────── 3. 정책자금 ───────────────────────── */
const REGIONS = [['seoul', '서울'], ['gyeonggi', '경기'], ['incheon', '인천'], ['busan', '부산'], ['daegu', '대구'], ['gwangju', '광주'], ['daejeon', '대전'], ['ulsan', '울산'], ['sejong', '세종'], ['gangwon', '강원'], ['chungbuk', '충북'], ['chungnam', '충남'], ['jeonbuk', '전북'], ['jeonnam', '전남'], ['gyeongbuk', '경북'], ['gyeongnam', '경남'], ['jeju', '제주']];

function programCards(r) {
  return r.matches.map((m, i) => {
    const p = facts.POLICY_PROGRAMS.find((x) => x.id === m.id);
    const name = m.id === 'kodit-regional' ? p.name.replace('지역신용보증재단', r.regionGuarantee) : p.name;
    return `<li class="prog"><div class="prog-head"><span class="prog-rank">${i + 1}</span><h3>${esc(name)}</h3><span class="fit" title="조건 적합도">${m.fit}%</span></div>
<p class="prog-why">${esc(m.why)}</p>
<dl class="prog-dl"><div><dt>지원 한도</dt><dd>${esc(p.limit)}</dd></div><div><dt>금리·조건</dt><dd>${esc(p.rate)}</dd></div><div><dt>기간</dt><dd>${esc(p.term)}</dd></div><div><dt>신청처</dt><dd>${esc(p.where)}</dd></div></dl>
<details class="docs"><summary>필요 서류 체크리스트 (${p.docs.length})</summary><ul class="checklist">${p.docs.map((d) => `<li><label><input type="checkbox"> ${esc(d)}</label></li>`).join('')}</ul></details></li>`;
  }).join('');
}

function policy(q, ctx) {
  const calc = { ...CALCULATORS.find((c) => c.slug === 'policy-funds'), lead: '업종·지역·업력·연매출·상시근로자 수·고금리 대출 보유액·무인기기 도입 계획을 입력하면 소진공·중진공·지역신보·희망리턴패키지 핵심 지원사업을 적합도 순으로 매칭하고, 연 4.5% 대환대출 이자 절감액과 스마트상점 보조금 자부담금을 계산합니다.' };
  const s = {
    ind: qs(q, 'ind', ['food', 'retail', 'mfg', 'service'], 'food'), region: qs(q, 'region', REGIONS.map((x) => x[0]), 'seoul'), age: qs(q, 'age', ['pre', 'lt1', 'lt3', 'lt7', 'gte7'], 'lt3'),
    sales: qv(q, 'sales', 15000), emp: qs(q, 'emp', ['lt5', 'gte5'], 'lt5'), hiloan: qv(q, 'hiloan', 3000), hirate: qv(q, 'hirate', 9.5), kiosk: q.kiosk === '0' ? 0 : 1, devcost: qv(q, 'devcost', 600), srate: qv(q, 'srate', 70)
  };
  const r = E.policy(s);
  const form = `
<fieldset><legend>1. 사업장 기본 정보</legend>
${select('ind', '업종', [['food', '외식·카페'], ['retail', '도소매·온라인셀러'], ['mfg', '제조·수리 (소공인)'], ['service', '개인서비스 (미용·세탁 등)']], s.ind)}
${select('region', '지역', REGIONS, s.region)}
${select('age', '업력', [['pre', '예비창업'], ['lt1', '1년 미만'], ['lt3', '1~3년 미만'], ['lt7', '3~7년 미만'], ['gte7', '7년 이상']], s.age)}
${range('sales', '연매출 규모', 0, 100000, 500, s.sales, '만원')}
${seg('emp', '상시근로자 수', [['lt5', '5인 미만'], ['gte5', '5인 이상']], s.emp)}
</fieldset>
<fieldset><legend>2. 고금리 대출 대환</legend>
${range('hiloan', '연 7% 이상 고금리 사업자대출 보유액', 0, 20000, 100, s.hiloan, '만원')}
${range('hirate', '현재 대출 금리', 0, 20, 0.1, s.hirate, '%')}
</fieldset>
<fieldset><legend>3. 무인기기 도입 (스마트상점)</legend>
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
<div class="callout"><strong>자금 조달 통합 안내:</strong> 시중은행·증권사·인터넷은행 평균 금리 비교와 대출 가능 한도 진단까지 한꺼번에 보시려면 <a href="/funding">사업자 대출 · 정책자금 전략 라운지</a>를 함께 확인하세요.</div>
<div class="card"><h2 class="card-h">고금리 → 연 4.5% 대환 이자 절감</h2>
<div class="kpi-grid tnum"><div class="hl"><span>연간 이자 절감</span><strong>${o('annual', won(r.refinance.annual))}</strong></div><div><span>월 평균 절감</span><strong>${o('monthly', won(r.refinance.monthly))}</strong></div><div><span>10년 분할 총이자 절감</span><strong>${o('tenYear', won(r.refinance.tenYear))}</strong></div><div><span>대환 적용액</span><strong>${o('refAmt', fmt(r.refinance.amount) + '만원')}</strong></div></div>
<p class="note" data-out="refNote">${r.refinance.eligible ? (r.refinance.over > 0 ? `한도 5,000만원 초과분 ${fmt(r.refinance.over)}만원은 대환 대상에서 제외됩니다.` : '연 7% 이상 고금리 사업자대출 전액이 대환 한도 내입니다.') : '연 7% 이상 고금리 대출이 없거나 사업자 요건 미충족으로 대환 대상이 아닙니다.'}</p>
<div class="chart" data-chart="refi" role="img" aria-label="현재 금리와 4.5% 대환 금리의 연간 이자 비교"></div></div>
<div class="card"><h2 class="card-h">스마트상점 보조금 적용 자부담</h2>
<div class="kpi-grid tnum"><div><span>장비 공급가</span><strong>${o('devcostOut', fmt(r.smart.devcost) + '만원')}</strong></div><div class="hl"><span>국비 지원액</span><strong>${o('subsidy', fmt(r.smart.subsidy) + '만원')}</strong></div><div><span>사장님 자부담</span><strong>${o('selfPay', fmt(r.smart.selfPay) + '만원')}</strong></div><div><span>한도</span><strong>${o('capText', r.smart.capped ? '500만원 한도 적용' : '한도 내')}</strong></div></div></div>
<div class="card"><h2 class="card-h">맞춤 지원사업 매칭 리스트</h2><ol class="prog-list" data-out-html="programs">${programCards(r)}</ol></div>`;
  const guide = `
<h2>정책자금과 대환·보조금 핵심 구분표</h2>
<table><thead><tr><th>구분</th><th>대표 사업</th><th>핵심 조건</th><th>지원 내용</th></tr></thead><tbody>
<tr><td>대환</td><td>소상공인 저금리 대환대출</td><td>연 7% 이상 사업자대출 보유</td><td>연 4.5% 고정, 최대 5,000만원, 10년 분할</td></tr>
<tr><td>융자</td><td>소진공 일반경영안정자금</td><td>상시근로자 5인 미만(제조 10인 미만)</td><td>최대 7,000만원, 정책 기준금리 연동</td></tr>
<tr><td>융자</td><td>지역신보 특례보증</td><td>지역 소재 사업자</td><td>보증서 대출 + 지자체 이차보전 1.0~2.5%p</td></tr>
<tr><td>보조금</td><td>스마트상점 기술보급</td><td>영업 중인 점포, 사전 협약</td><td>공급가 50~70% 국비, 최대 500만원</td></tr>
<tr><td>보조금</td><td>희망리턴패키지</td><td>폐업(예정)·60일 이상 운영·유상임차</td><td>점포철거비 최대 600만원, 재기 교육</td></tr>
</tbody></table>
<div class="formula">첫해 연간 이자 절감 ≈ 대환 적용액(최대 5,000만원) × (현재 금리 − 4.5%) · 스마트상점 자부담 = 공급가 − min(공급가 × 지원율, 500만원)</div>`;
  const faq = [
    { q: '연말에 예산이 마감되면 언제 다시 접수하나요?', a: '중소벤처기업부와 소상공인시장진흥공단은 통상 매년 말~연초 통합공고 후 1~2월부터 상반기 1차 본공고 접수를 시작합니다. 미리 납세완납증명과 부가세 매출 증빙을 준비해 두면 오픈 직후 접수에 유리합니다.' },
    { q: '정책자금과 대환대출을 함께 받을 수 있나요?', a: '목적이 달라 병행 검토가 가능한 경우가 많으나, 보증기관 총한도를 공유할 수 있으므로 지역신보·공단 상담 시 순서를 먼저 확인하세요.' },
    { q: '스마트상점 보조금은 먼저 설치한 뒤 청구해도 되나요?', a: '안 됩니다. 반드시 공고 신청 → 선정 → 전자협약 체결 이후에 기기를 도입해야 국비가 지원됩니다.' },
    { q: '매칭 적합도 %는 무엇을 의미하나요?', a: '입력 조건이 각 사업의 대표 지원 요건과 부합하는 정도를 나타낸 우선순위 참고 지표입니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['policy-funds-grants'] || [], `※ 중소벤처기업부 · 소상공인시장진흥공단 최신 공고 기준 반영 (검증일 ${facts.VERIFIED_AT})`);
}

/* ───────────────────────── 4. 인건비 & 무인화 ───────────────────────── */
function labor(q, ctx) {
  const defYear = String(facts.currentYearMode());
  const year = qs(q, 'year', ['2026', '2027'], defYear);
  const defWage = year === '2027' ? 10700 : 10320;
  const calc = { ...CALCULATORS.find((c) => c.slug === 'labor-automation'), lead: '최신 최저임금 및 4대보험 사업주 요율을 기준으로 알바 주당 근무시간이 15시간을 넘는 순간 발생하는 주휴수당·4대보험 인건비 절벽을 실측하고, 테이블오더·키오스크 도입 시 몇 개월 만에 원금을 회수하는지 계산합니다.' };
  const s = {
    year: Number(year), wage: qv(q, 'wage', defWage), hours: qv(q, 'hours', 20), staff: qv(q, 'staff', 2), ins: q.ins === '0' ? 0 : 1, cut: qv(q, 'cut', 14.5), devices: qv(q, 'devices', 4),
    mode: qs(q, 'mode', ['buy', 'rent'], 'buy'), devcost: qv(q, 'devcost', 450000), rent: qv(q, 'rent', 25000), subsidy: qv(q, 'subsidy', 0), biz: qs(q, 'biz', ['food', 'cafe', 'retail', 'service'], 'food')
  };
  const r = E.labor(s);
  const form = `
<fieldset><legend>1. 급여 기준 & 알바 근무 조건</legend>
${seg('year', '고시 기준 선택 (하단 각주 참조)', [['2026', '현행 고시 (10,320원)'], ['2027', '차기 확정 고시 (10,700원)']], String(s.year))}
<p class="plan-note" data-year-note>${s.year === 2027 ? '고용노동부 고시 제2026-60호(2027.1.1 시행 확정분): 최저시급 10,700원, 국민연금 10%(사업주 5.0%), 장기요양 13.90% → 사업주 4대보험 약 11.15%' : '현행 적용분: 최저시급 10,320원, 국민연금 9.5%(사업주 4.75%), 건강보험 7.19% → 사업주 4대보험 약 10.87%'}</p>
${range('wage', '적용 시급', 10320, 22000, 10, s.wage, '원')}
<div class="preset-row"><button type="button" class="chip" data-preset="wage:10320">현행 최저 10,320원</button><button type="button" class="chip" data-preset="wage:10700">차기 확정 10,700원</button><button type="button" class="chip" data-preset="wage:12000">12,000원</button></div>
${range('hours', '알바 1인 주당 근무시간 (현재)', 1, 40, 0.5, s.hours, '시간')}
${range('staff', '알바 인원수', 1, 20, 1, s.staff, '명')}
${toggle('ins', '4대보험 사업주 부담분 반영', s.ins === 1, '주 15시간↑ 약 10.87~11.15%')}
</fieldset>
<fieldset><legend>2. 무인화 도입 시나리오</legend>
${seg('biz', '매장 유형 (권장 기기 대수 프리셋 연동)', [['food', '일반 외식(테이블오더)'], ['cafe', '카페(키오스크 1대)'], ['retail', '소매(셀프계산대)'], ['service', '예약·서비스']], s.biz)}
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
  <p class="rh-sub">3년 누적 순절감 <strong class="tnum">${o('save36', won(r.save36))}</strong> · ${o('yearBadge', s.year + '년 고시 기준')}</p>
</div>
<div class="card killer"><h2 class="card-h">차기 최저임금·국민연금 인상 시 추가 인건비 영향</h2>
<p class="killer-text">현재 근무시간(${o('curHoursTxt', s.hours + '시간')} × ${o('staffTxt', s.staff + '명')})을 유지할 경우 차기 확정 고시(시급 10,700원 · 연금 10%) 시행 시 매장 인건비가 <strong>월 <span class="tnum">${o('hikeMonthly', '+' + won(r.hike2027Monthly))}</span> (연간 <span class="tnum">${o('hikeAnnual', '+' + won(r.hike2027Annual))}</span>)</strong> 추가 상승합니다.</p></div>
<div class="card"><h2 class="card-h">주 14.5시간 vs 15시간 인건비 절벽 (1인 월)</h2>
<div class="kpi-grid tnum"><div><span>주 14.5시간</span><strong>${o('c145', won(r.cliff.at145.total))}</strong></div><div><span>주 15시간</span><strong>${o('c15', won(r.cliff.at15.total))}</strong></div><div class="hl"><span>단 0.5시간 차이의 월 절벽</span><strong>${o('jump', '+' + won(r.cliff.jump))}</strong></div><div><span>증가율</span><strong>${o('jumpPct', '+' + pct(r.cliff.jumpPct))}</strong></div></div>
<div class="chart" data-chart="cliff" role="img" aria-label="주당 근무시간별 1인 월 인건비 곡선"></div></div>
<div class="card"><h2 class="card-h">현재 vs 도입 후 월 인건비</h2>
<div class="kpi-grid tnum"><div><span>현재 1인 월 인건비</span><strong>${o('beforeTotal', won(r.before.total))}</strong></div><div><span>도입 후 1인 월 인건비</span><strong>${o('afterTotal', won(r.after.total))}</strong></div><div><span>월 인건비 절감 (전체)</span><strong>${o('laborSave', won(r.laborSave))}</strong></div><div><span>기기 초기비용 (자부담)</span><strong>${o('initial', won(r.initial))}</strong></div><div><span>월 렌탈료</span><strong>${o('monthlyDevice', won(r.monthlyDevice))}</strong></div><div class="hl"><span>월 순절감</span><strong>${o('netMonthly', won(r.netMonthly))}</strong></div></div></div>
<div class="card"><h2 class="card-h">36개월 누적 비용 손익 교차 차트</h2><div class="chart" data-chart="cross" role="img" aria-label="현행 인건비 누적과 무인화 도입 후 누적 비용의 36개월 교차 차트"></div></div>`;
  const guide = `
<h2>주 15시간 인건비 절벽 & 고시 요율 비교표</h2>
<div class="formula">주휴수당(주) = (1주 소정근로시간 ÷ 40) × 8시간 × 시급 · 1인 월 인건비 = (시급 × 주 시간 + 주휴수당) × 4.345주 × (1 + 사업주 4대보험률)</div>
<table><thead><tr><th>주 근무시간</th><th>현행 기준 월 총인건비 (10,320원)</th><th>차기 확정 고시 월 총인건비 (10,700원)</th><th>1인당 월 증가액</th></tr></thead><tbody>
${[10, 14.5, 15, 20, 30, 40].map((h) => {
  const m26 = E.staffMonthly(10320, h, true, 2026);
  const m27 = E.staffMonthly(10700, h, true, 2027);
  return `<tr><td>${h}시간</td><td>${won(m26.total)}</td><td><strong>${won(m27.total)}</strong></td><td>+${won(m27.total - m26.total)}</td></tr>`;
}).join('')}
</tbody></table>
<p class="footnote-meta">※ 각주: 현행 데이터는 2026년 적용 최저임금(10,320원)·국민연금(9.5%) 기준이며, 차기 확정 데이터는 고용노동부 고시 제2026-60호(2027.1.1 시행 최저임금 10,700원) 및 국민연금(10.0%)·장기요양(13.90%) 확정 요율 기준입니다.</p>`;
  const faq = [
    { q: '매장 유형 버튼을 바꾸면 무엇이 달라지나요?', a: '일반 외식(테이블오더 다수 설치)과 카페·소매(전면 키오스크 1~2대 설치)의 통상 기기 대수와 대당 도입 단가가 자동으로 세팅되어 현실적인 원금회수 개월 수를 바로 비교할 수 있습니다.' },
    { q: '연말 급여를 다음 해 1월에 지급하면 어느 시급이 적용되나요?', a: '지급일이 아니라 실제 근로를 제공한 날짜를 기준으로 해당 연도의 고시 최저임금이 적용됩니다.' },
    { q: '주 15시간 미만 알바는 4대보험이 전혀 없나요?', a: '월 60시간 미만 초단시간 근로자는 국민연금·건강보험·고용보험이 원칙적으로 제외되지만 산재보험은 전 근로자에게 의무 적용됩니다.' },
    { q: '테이블오더 구매 시 보조금을 받을 수 있나요?', a: '스마트상점 기술보급사업 공고 기간에 사전 신청·선정되면 공급가의 50~70%(최대 500만원) 국비 지원을 받을 수 있습니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['labor-tax-franchise'] || [], `※ 최신 고용노동부 최저임금 고시 및 4대보험 요율 기준 (현행 2026년 · 차기 2027.1.1 시행 확정분 병행 지원)`);
}

/* ───────────────────────── 5. 부가세·종소세·실수령 ───────────────────────── */
function vatIncome(q, ctx) {
  const calc = { ...CALCULATORS.find((c) => c.slug === 'vat-income-tax'), lead: '부가가치세(간이과세 vs 일반과세 · 납부면제 4,800만원 · 전환기준 1억 400만원 · 신용카드 세액공제 1.3%)부터 종합소득세(6%~45% 8단계 누진세율 + 지방소득세 10%), 노란우산공제 절세액, 그리고 1년 뒤 통장에 남는 세후 월 실수령액까지 한 화면에서 통합 계산합니다.' };
  const s = {
    ind: qs(q, 'ind', Object.keys(E.VAT_INDS), 'food'),
    regime: qs(q, 'regime', ['auto', 'general', 'simplified'], 'auto'),
    sales: qv(q, 'sales', 9600),
    buy: qv(q, 'buy', 40),
    labor: qv(q, 'labor', 2400),
    cardpct: qv(q, 'cardpct', 85),
    deps: qv(q, 'deps', 1),
    umb: qv(q, 'umb', 25)
  };
  const r = E.vatIncome(s);
  const regLabel = r.effectiveRegime === 'simplified' ? (r.vatExempt ? '간이과세자 (부가세 납부면제)' : '간이과세자') : '일반과세자';
  const form = `
<fieldset><legend>1. 업종 & 과세유형</legend>
${select('ind', '업종 (간이 부가가치율 반영)', facts.VAT_VALUE_RATES.map((x) => [x.id, x.name]), s.ind)}
${seg('regime', '과세유형', [['auto', '자동 판정'], ['simplified', '간이과세'], ['general', '일반과세']], s.regime)}
<p class="plan-note" data-tax-note>${r.forcedGeneral ? '연매출 1억 400만원 이상(또는 간이 배제업종)은 일반과세자로 자동 전환됩니다.' : '직전 연 공급대가 1억 400만원 미만 개인사업자는 간이과세 적용 대상입니다 (4,800만원 미만 부가세 납부면제).'}</p>
</fieldset>
<fieldset><legend>2. 연간 매출 & 경비</legend>
${range('sales', '연간 총매출 (VAT 포함 공급대가)', 1000, 50000, 100, s.sales, '만원')}
${range('buy', '과세 매입 비율 (식자재·사입·임차료 등)', 0, 90, 1, s.buy, '%', '매출 대비')}
${range('labor', '연간 인건비·기타 비과세 필요경비', 0, 30000, 100, s.labor, '만원', '부가세 불공제 경비')}
${range('cardpct', '카드·현금영수증 결제 비중', 0, 100, 5, s.cardpct, '%', '1.3% 세액공제')}
</fieldset>
<fieldset><legend>3. 소득공제 & 노란우산 절세</legend>
${range('deps', '본인 포함 기본 인적공제 인원', 1, 8, 1, s.deps, '명', '1인당 150만원')}
${range('umb', '노란우산공제 월 납입액', 0, 150, 5, s.umb, '만원', '소득별 최대 600만 공제')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="${r.cashNetAnnual > 0 ? 'safe' : 'danger'}">
  <p class="rh-label">연간 세금 다 떼고 사장님 세후 실수령액</p>
  <p class="rh-value tnum">${o('cashNetMonthly', '월 ' + won(r.cashNetMonthly))}</p>
  <p class="rh-sub">연간 세후 순수익 <strong class="tnum">${o('cashNetAnnual', won(r.cashNetAnnual))}</strong> · ${o('regLabel', regLabel)} · 매출대비 총세부담 <strong class="tnum">${o('effTaxRate', pct(r.effTaxRate))}</strong></p>
</div>
<div class="card"><h2 class="card-h">부가가치세 vs 종합소득세 산출 내역</h2>
<div class="kpi-grid tnum">
<div class="hl"><span>실제 납부 부가가치세 (연)</span><strong>${o('actualVat', r.vatRefund > 0 ? '환급 ' + won(r.vatRefund) : won(r.actualVatPayable))}</strong></div>
<div class="hl"><span>종합소득세 + 지방소득세(10%)</span><strong>${o('totalIncomeTax', won(r.totalIncomeTax))}</strong></div>
<div><span>일반과세 기준 부가세</span><strong>${o('vatGeneral', r.vatGeneral < 0 ? '환급 ' + won(Math.abs(r.vatGeneral)) : won(r.vatGeneral))}</strong></div>
<div><span>간이과세 기준 부가세</span><strong>${o('vatSimplified', r.vatSimplified == null ? '해당없음(1억400만↑)' : (r.vatExempt ? '0원 (납부면제)' : won(r.vatSimplified)))}</strong></div>
<div><span>신용카드 발행세액공제(1.3%)</span><strong>${o('cardCredit', '−' + won(r.cardCreditUsed))}</strong></div>
<div><span>종소세 과세표준 / 세율구간</span><strong>${o('bracket', won(r.taxBase) + ' · ' + r.bracketRate + '%')}</strong></div>
</div></div>
<div class="card killer"><h2 class="card-h">노란우산공제 절세 효과 판독</h2>
<p class="killer-text" data-out-html="umbKiller">사장님의 추정 사업소득금액(<strong class="tnum">${won(r.bizIncome)}</strong>) 기준 노란우산 소득공제 한도는 <strong class="tnum">${won(r.umbCap)}</strong>입니다. 월 <strong>${fmt(s.umb)}만원</strong>(연 ${fmt(s.umb * 12)}만원) 납입 시 <strong class="tnum">${won(r.umbDeduct)}</strong>이 공제되어 종합소득세+지방소득세가 <strong class="tnum">${won(r.umbTaxSaved)}</strong> 줄어듭니다.</p>
<p class="killer-text sub">당해 귀속 종합소득세 공제는 과세연도 12월 31일 이전 납입분까지 반영됩니다.</p></div>
<div class="card"><h2 class="card-h">매출 → 경비·세금 → 세후 실수령 워터폴</h2><div class="chart" data-chart="waterfall" role="img" aria-label="연간 매출에서 매입경비, 인건비, 부가세, 종소세를 공제해 세후 실수령에 이르는 차트"></div>
<table class="mini-table tnum" data-table="breakdown"><tbody>${r.breakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.salesKRW ? b.value / r.salesKRW * 100 : 0)}</td></tr>`).join('')}</tbody></table></div>`;
  const guide = `
<h2>부가가치세와 종합소득세 핵심 공식</h2>
<div class="formula">일반과세 부가세 = 매출세액(공급대가÷11) − 매입세액(과세매입÷11) − 신용카드 발행세액공제(1.3%, 연 1,000만원 한도)</div>
<div class="formula">간이과세 부가세 = 공급대가 × 업종별 부가가치율(15~40%) × 10% − 과세매입 공급대가 × 0.5% − 신용카드 발행세액공제</div>
<h2>종합소득세 8단계 과세표준 세율표 (지방소득세 10% 별도)</h2>
<table><thead><tr><th>과세표준 구간</th><th>기본 세율</th><th>지방소득세 포함 실효세율</th><th>누진공제액</th></tr></thead><tbody>
<tr><td>1,400만 원 이하</td><td>6%</td><td>6.6%</td><td>-</td></tr>
<tr><td>1,400만 원 초과 ~ 5,000만 원 이하</td><td>15%</td><td>16.5%</td><td>126만 원</td></tr>
<tr><td>5,000만 원 초과 ~ 8,800만 원 이하</td><td>24%</td><td>26.4%</td><td>576만 원</td></tr>
<tr><td>8,800만 원 초과 ~ 1억 5,000만 원 이하</td><td>35%</td><td>38.5%</td><td>1,544만 원</td></tr>
<tr><td>1억 5,000만 원 초과 ~ 3억 원 이하</td><td>38%</td><td>41.8%</td><td>1,994만 원</td></tr>
<tr><td>3억 원 초과 ~ 5억 원 이하</td><td>40%</td><td>44.0%</td><td>2,594만 원</td></tr>
<tr><td>5억 원 초과 ~ 10억 원 이하</td><td>42%</td><td>46.2%</td><td>3,594만 원</td></tr>
<tr><td>10억 원 초과</td><td>45%</td><td>49.5%</td><td>6,594만 원</td></tr>
</tbody></table>
<h2>사업소득 구간별 노란우산공제 한도표</h2>
<table><thead><tr><th>사업소득금액 구간</th><th>연간 소득공제 한도</th><th>절세 효과(16.5~26.4% 구간 기준)</th></tr></thead><tbody>
<tr><td>4,000만 원 이하</td><td><strong>600만 원</strong></td><td>최대 약 99만 원</td></tr>
<tr><td>4,000만 원 초과 ~ 6,000만 원 이하</td><td><strong>500만 원</strong></td><td>최대 약 132만 원</td></tr>
<tr><td>6,000만 원 초과 ~ 1억 원 이하</td><td><strong>400만 원</strong></td><td>최대 약 105.6만~154만 원</td></tr>
<tr><td>1억 원 초과</td><td><strong>200만 원</strong></td><td>최대 약 77만~99만 원</td></tr>
</tbody></table>`;
  const faq = [
    { q: '간이과세자가 무조건 유리한가요?', a: '일반 운영기에는 부가세 부담이 크게 줄어 유리하지만, 초기 인테리어·설비 투자로 매입세액이 매출세액보다 큰 창업 첫해에는 일반과세자로 등록해야 부가세 환급을 받을 수 있습니다.' },
    { q: '신용카드 매출전표 발행세액공제 1.3%는 누구나 받나요?', a: '음식·소매·숙박·개인서비스 등 소비자 상대 업종을 영위하는 직전 공급가액 10억 원 이하 개인사업자가 대상이며 연간 1,000만 원 한도가 적용됩니다.' },
    { q: '인건비는 왜 부가세 공제가 안 되나요?', a: '급여에는 부가가치세가 포함되어 있지 않아 부가세 매입세액공제 대상은 아니지만, 원천세 신고 시 종합소득세 필요경비로 전액 차감됩니다.' },
    { q: '면세농산물 의제매입세액공제도 있나요?', a: '일반과세 음식점이 농·축·수산물 원재료를 계산서·카드로 매입하면 한도 내에서 8/108(또는 9/109)을 추가 공제받을 수 있습니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['labor-tax-franchise'] || [], `※ 국세청 현행 부가가치세법(간이 기준 1억 400만원) 및 소득세법 과세표준 구간 반영 (검증일 ${facts.VERIFIED_AT})`);
}

/* ───────────────────────── 6. 상가 월세·환산보증금·BEP ───────────────────────── */
function storeLease(q, ctx) {
  const calc = { ...CALCULATORS.find((c) => c.slug === 'store-rent-breakeven'), lead: '상가 계약·재계약 전 반드시 확인해야 할 상가건물 임대차보호법 환산보증금(보증금 + 월세 × 100) 지역별 기준 초과 여부와 임대료 5% 인상 상한 적용 여부를 즉시 판독하고, 월세·관리비·인건비를 감당하는 하루 손익분기 매출(BEP)과 권리금·인테리어 원금회수 개월 수를 계산합니다.' };
  const s = {
    region: qs(q, 'region', Object.keys(E.LEASE_CAPS), 'seoul'),
    deposit: qv(q, 'deposit', 5000),
    rent: qv(q, 'rent', 300),
    maint: qv(q, 'maint', 80),
    labor: qv(q, 'labor', 450),
    ticket: qv(q, 'ticket', 18000),
    varpct: qv(q, 'varpct', 48),
    days: qv(q, 'days', 26),
    sunk: qv(q, 'sunk', 8000),
    orders: qv(q, 'orders', 45),
    biz: qs(q, 'biz', ['food', 'cafe', 'retail', 'service'], 'food')
  };
  const r = E.storeLease(s);
  const form = `
<fieldset><legend>1. 상가 임대차 조건 (환산보증금)</legend>
${select('region', '상가 소재 지역', facts.LEASE_REGIONS.map((x) => [x.id, x.name]), s.region)}
${range('deposit', '임대 보증금', 0, 50000, 500, s.deposit, '만원')}
${range('rent', '월 임대료 (부가세 별도)', 0, 2000, 10, s.rent, '만원')}
${range('maint', '월 관리비·공과금·기타 고정비', 0, 500, 10, s.maint, '만원')}
${range('labor', '월 총인건비 (직원·알바 합계)', 0, 3000, 20, s.labor, '만원')}
</fieldset>
<fieldset><legend>2. 업종별 변동비율 & 창업 투자비</legend>
${seg('biz', '업종 선택 (표준 객단가·변동비율 프리셋 연동)', [['food', '일반 외식(48%)'], ['cafe', '카페·디저트(34%)'], ['retail', '소매·마트(70%)'], ['service', '뷰티·서비스(18%)']], s.biz)}
${range('ticket', '평균 결제 객단가', 3000, 100000, 500, s.ticket, '원')}
${range('varpct', '변동비율 (원가+수수료+부가세 비중)', 10, 85, 1, s.varpct, '%', '매출 대비')}
${range('days', '월 영업일', 15, 31, 1, s.days, '일')}
${range('orders', '예상(또는 현재) 일평균 결제 건수', 5, 400, 1, s.orders, '건')}
${range('sunk', '권리금+인테리어+설비 (보증금 제외)', 0, 50000, 200, s.sunk, '만원', '매몰 초기투자')}
</fieldset>`;
  const out = `
<div class="card result-hero" data-status="${r.status}">
  <p class="rh-label">본전(손익분기점)을 넘기는 최소 일매출</p>
  <p class="rh-value tnum">${o('bepDailyOrders', '하루 ' + fmt(r.bepDailyOrders) + '건')}</p>
  <p class="rh-sub">일 손익분기 매출 <strong class="tnum">${o('bepDailySales', won(r.bepDailySales))}</strong> · 월 손익분기 <strong class="tnum">${o('bepMonthlySales', won(r.bepMonthlySales))}</strong></p>
</div>
<div class="card killer"><h2 class="card-h">상가임대차보호법 환산보증금 & 5% 상한 판독</h2>
<div class="kpi-grid tnum">
<div class="hl"><span>내 상가 환산보증금</span><strong>${o('convDep', manwon(r.convertedDeposit))}</strong></div>
<div><span>${o('regName', esc(r.regionName))} 기준액</span><strong>${o('regCap', manwon(r.regionCap))}</strong></div>
<div><span>임대료 5% 인상 상한</span><strong>${o('capBadge', r.underCap ? '법정 5% 상한 보호 대상' : '5% 상한 미적용(초과)')}</strong></div>
<div><span>5% 상한 시 최대 월세</span><strong>${o('maxRent5', fmt(r.maxRentNext5Pct, 1) + '만원 (+' + fmt(r.maxRentHike5Pct, 1) + '만)')}</strong></div>
</div>
<p class="killer-text sub" data-out="leaseNote">${r.underCap
  ? '환산보증금 기준 이하이므로 재계약 시 임대료 증액 5% 상한, 10년 계약갱신요구권, 권리금 회수기회 보호, 대항력이 모두 적용됩니다.'
  : '기준액을 ' + fmt(r.overAmount) + '만원 초과했습니다. 10년 계약갱신요구권과 권리금 보호는 여전히 적용되지만, 재계약 시 5% 임대료 인상 상한 제한이 적용되지 않으므로 특약 조항을 반드시 확인하세요.'}</p></div>
<div class="card"><h2 class="card-h">예상 월 순이익 & 권리금·인테리어 원금회수 진단</h2>
<div class="kpi-grid tnum">
<div><span>예상 월매출 (${o('ordTxt', r.dailyOrders + '건×' + r.days + '일')})</span><strong>${o('expSales', won(r.expMonthlySales))}</strong></div>
<div><span>월매출 대비 월세+관리비율</span><strong>${o('rentRatio', pct(r.rentRatioPct))}</strong></div>
<div class="hl"><span>예상 월 영업순이익</span><strong>${o('expProfit', won(r.expMonthlyProfit))}</strong></div>
<div class="hl"><span>권리금·시설 원금회수 기간</span><strong>${o('payback', r.paybackMonths != null ? fmt(r.paybackMonths, 1) + '개월' : '적자 (회수불가)')}</strong></div>
</div>
<div class="chart" data-chart="cross" role="img" aria-label="권리금·인테리어 매몰 창업비와 누적 영업순이익의 36개월 원금회수 교차 차트"></div></div>`;
  const guide = `
<h2>지역별 환산보증금 기준표 (상가건물 임대차보호법 시행령)</h2>
<div class="formula">환산보증금 = 보증금 + (월 차임 × 100) · 일 손익분기 주문 수 = 월 총고정비 ÷ [객단가 × (1 − 변동비율)] ÷ 월 영업일</div>
<table><thead><tr><th>지역 구분</th><th>환산보증금 기준액</th><th>기준 이하일 때</th><th>기준 초과일 때</th></tr></thead><tbody>
<tr><td>서울특별시</td><td><strong>9억 원 이하</strong></td><td>5% 인상 상한 · 10년 갱신 · 권리금 보호 · 최우선변제</td><td>10년 갱신 · 권리금 보호 적용, <strong>5% 상한 미적용</strong></td></tr>
<tr><td>수도권 과밀억제권역 · 부산</td><td><strong>6억 9천만 원 이하</strong></td><td>모두 적용</td><td>5% 상한 · 최우선변제 미적용</td></tr>
<tr><td>광역시 · 세종 · 용인 · 화성 · 김포 · 안산 · 파주 · 광주</td><td><strong>5억 4천만 원 이하</strong></td><td>모두 적용</td><td>5% 상한 · 최우선변제 미적용</td></tr>
<tr><td>그 밖의 지역</td><td><strong>3억 7천만 원 이하</strong></td><td>모두 적용</td><td>5% 상한 · 최우선변제 미적용</td></tr>
</tbody></table>
<h2>월매출 대비 적정 월세 비율 기준표</h2>
<table><thead><tr><th>월세+관리비 / 월매출 비율</th><th>위험도</th><th>권리금·시설 투자 회수기간 기준</th></tr></thead><tbody>
<tr><td><strong>10% 이하</strong></td><td>안정 구조</td><td>첫 임대차 계약 기간(24개월) 이내 원금회수 권장</td></tr>
<tr><td><strong>10% ~ 15%</strong></td><td>주의 구간</td><td>객단가 향상·회전율 개선 병행 필요</td></tr>
<tr><td><strong>15% 초과</strong></td><td>고위험 구간</td><td>권리금 인수 재검토 또는 임대료 조정 협상 필수</td></tr>
</tbody></table>`;
  const faq = [
    { q: '업종 선택 버튼을 바꾸면 무엇이 달라지나요?', a: '외식(변동비 48%), 카페(34%), 소매·마트(70%), 뷰티·서비스(18%)의 현장 표준 변동비율과 객단가가 즉시 반영되어 업종별 하루 손익분기 주문 수가 달라집니다.' },
    { q: '환산보증금 계산 시 부가세와 관리비도 월세에 포함하나요?', a: '부가세 별도로 약정된 부가가치세와 실비 관리비는 원칙적으로 제외합니다. 다만 차임을 관리비로 편법 분리한 경우 분쟁 소지가 있으므로 계약서에 명확히 구분하세요.' },
    { q: '환산보증금을 초과하면 10년 계약갱신요구권도 없나요?', a: '아닙니다. 상가건물 임대차보호법 제2조 제3항에 따라 기준 초과 상가도 10년 계약갱신요구권과 권리금 회수기회 보호는 동일하게 적용됩니다.' },
    { q: '보증금은 왜 원금회수 계산에서 제외하나요?', a: '보증금은 계약 만료 시 반환받는 자산이고, 권리금·인테리어·설비비는 영업이익으로 건져야 하는 매몰 비용이기 때문입니다.' }
  ];
  return pageShell(calc, q, form, out, guide, faq, ctx.byCategory['delivery-store-profit'] || [], `※ 법제처 현행 상가건물 임대차보호법 시행령 기준액 반영 (검증일 ${facts.VERIFIED_AT})`);
}

function index() {
  const crumbs = [{ name: '홈', path: '/' }, { name: '전체 시뮬레이터', path: '/calculators' }];
  const master = CALCULATORS[0];
  const parts = CALCULATORS.slice(1);
  const body = `<div class="container">${breadcrumbHtml(crumbs)}
<header class="page-head"><span class="eyebrow">${icon('sliders', 16)} BoozaThink 시뮬레이터 허브</span><h1>창업 풀코스부터 상황별 정밀 계산까지</h1><p class="lead">처음 창업하는 분을 위한 12개월 계절 손익 풀코스 설계부터, 운영 중 상황별로 즉시 점검하는 6대 정밀 계산기까지 한곳에 모았습니다.</p></header>
<a class="cat-calc card" href="/calculators/${master.slug}" style="padding:26px;margin-bottom:26px"><span class="ico-box">${icon(master.iconKey, 22)}</span><div><span class="pill">예비창업 · 신규출점 추천</span><h2 style="margin:6px 0 4px;font-size:21px">${esc(master.name)}</h2><p>${esc(master.desc)}</p></div><span class="cc-cta">풀코스 설계 시작 →</span></a>
<h2 style="font-size:20px;margin:0 0 14px">상황별로 골라 쓰는 6대 정밀 손익·세무 계산기</h2>
<div class="calc-grid calc-grid-6">${parts.map((c) => `<a class="calc-card card" href="/calculators/${c.slug}"><span class="ico-box">${icon(c.iconKey, 20)}</span><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><span class="cc-cta">계산 시작 →</span></a>`).join('')}</div>
</div>`;
  return { body, jsonld: [breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: CALCULATORS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: abs('/calculators/' + c.slug), name: c.name })) }] };
}

module.exports = { delivery, seller, policy, labor, vatIncome, storeLease, index, programCards };
