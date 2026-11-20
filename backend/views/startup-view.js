'use strict';
const E = require('../public/js/calc-engine.js');
const { STARTUP_PROFILES, STARTUP_GROUPS } = require('../data/startup-profiles');
const { esc, CALCULATORS, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE, freeOpenBanner } = require('./layout');
const { icon } = require('./icons');
const facts = require('../data/facts');

const won = E.won, pct = E.pct, fmt = E.fmt, manwon = E.manwon;

function qv(q, k, def) {
  if (q[k] === undefined || q[k] === '') return def;
  const x = Number(q[k]);
  return Number.isFinite(x) ? x : def;
}

function tipHtml(tipText) {
  if (!tipText) return '';
  return ` <span class="tip-wrap"><button type="button" class="tip-btn" aria-label="용어 쉬운 설명 보기">?</button><span class="tip-pop" role="tooltip">${esc(tipText)}</span></span>`;
}

function range(key, label, min, max, step, value, unit, hint, tip) {
  return `<div class="field" data-field="${key}">
  <label for="f-${key}">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}${tipHtml(tip)}</label>
  <div class="field-row">
    <input type="range" id="r-${key}" min="${min}" max="${max}" step="${step}" value="${value}" data-bind="${key}" aria-label="${esc(label)} 슬라이더">
    <div class="num"><input type="number" id="f-${key}" min="0" step="${step}" value="${value}" data-bind="${key}" inputmode="decimal"><span class="unit">${esc(unit)}</span></div>
  </div>
</div>`;
}

function seg(key, label, options, value, tip) {
  return `<div class="field" data-field="${key}"><span class="label" id="l-${key}">${esc(label)}${tipHtml(tip)}</span>
  <div class="seg" role="radiogroup" aria-labelledby="l-${key}">${options.map(([v, t]) => `<label class="seg-opt"><input type="radio" name="${key}" value="${esc(v)}" data-bind="${key}"${String(v) === String(value) ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div></div>`;
}

function selectField(key, label, options, value, tip) {
  return `<div class="field" data-field="${key}">
  <label for="f-${key}">${esc(label)}${tipHtml(tip)}</label>
  <select id="f-${key}" data-bind="${key}">${options.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>
</div>`;
}

function toggle(key, label, on, hint, tip) {
  return `<div class="field field-toggle" data-field="${key}"><label class="switch"><input type="checkbox" id="f-${key}" data-bind="${key}"${on ? ' checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}${tipHtml(tip)}</span></label></div>`;
}

function miniNum(key, label, value, unit, tip) {
  return `<div class="mini-num-field" data-field="${key}">
    <label for="f-${key}">${esc(label)}${tipHtml(tip)}</label>
    <div class="num"><input type="number" id="f-${key}" min="0" step="100" value="${value}" data-bind="${key}" inputmode="decimal"><span class="unit">${esc(unit)}</span></div>
  </div>`;
}

function o(key, text) { return `<span data-out="${key}">${text}</span>`; }

function defaultDelivPreset(prof) {
  const g = prof.group || '';
  if (g === '외식·배달') return { dshare: 45, pshare: 15, dappfee: 7.8, drider: 3300, dpack: 900, dpromo: 500 };
  if (g === '카페·디저트') return { dshare: 20, pshare: 45, dappfee: 7.8, drider: 3000, dpack: 450, dpromo: 300 };
  if (g === '도소매·생활밀착') return { dshare: 10, pshare: 20, dappfee: 7.8, drider: 3000, dpack: 300, dpromo: 200 };
  if (g === '이커머스·B2B') return { dshare: 0, pshare: 0, dappfee: 6.8, drider: 0, dpack: 600, dpromo: 300 };
  return { dshare: 0, pshare: 0, dappfee: 7.8, drider: 3000, dpack: 400, dpromo: 0 };
}

function parseMenuData(str, fallbackProf) {
  if (str && typeof str === 'string') {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, 10);
    } catch (_) {}
  }
  return E.defaultCategoriesForProfile(fallbackProf);
}

function intModeNoteText(mode) {
  if (mode === 'self') return '목수·전기·설비·간판 기술자를 사장님이 직접 따로 불러 시공하는 방식입니다. 업체 종합 관리마진(약 20~25%)을 아낄 수 있지만, 도면과 공사 순서를 직접 챙겨야 합니다.';
  if (mode === 'takeover') return '이전에 같은 업종을 하던 가게의 주방·에어컨·바닥 공사를 그대로 넘겨받고 간판과 도색만 손보는 방식입니다. 초기 투자비를 절반 이하로 줄일 수 있어 초보 창업자에게 가장 안전합니다.';
  return '인테리어 전문 업체 한 곳에 철거부터 목공·전기·마감까지 통째로 맡기는 가장 흔한 방식입니다. 몸은 편하지만 업체 이윤이 포함되므로 최소 3곳 이상 상세 내역서를 비교하세요.';
}

function renderSeasonBars(months, bestM, worstM) {
  const maxAbs = Math.max(1, ...months.map((m) => Math.abs(m.cashFlow)));
  return `<div class="season-chart tnum" data-chart="season12">` + months.map((m) => {
    const h = Math.max(8, Math.round((Math.abs(m.cashFlow) / maxAbs) * 100));
    const cls = m.cashFlow < 0 ? 'neg' : (m.month === bestM ? 'peak' : (m.month === worstM ? 'low' : ''));
    const man = Math.round(m.cashFlow / 10000);
    return `<div class="m-col"><span class="m-val">${man >= 0 ? man : '−' + Math.abs(man)}만</span><div class="m-bar-wrap"><div class="m-bar ${cls}" style="height:${h}%"></div></div><span class="m-lbl">${m.month}월</span></div>`;
  }).join('') + `</div>`;
}

function startupMasterView(q) {
  const calc = CALCULATORS[0];
  const profId = STARTUP_PROFILES.some((p) => p.id === q.profile) ? q.profile : 'takeout-coffee';
  const prof = STARTUP_PROFILES.find((p) => p.id === profId);
  const regionKey = E.STARTUP_REGIONS[q.region] ? q.region : 'recommend';
  const regInfo = E.STARTUP_REGIONS[regionKey];
  const dp = defaultDelivPreset(prof);
  const initMenu = parseMenuData(q.menudata, prof);

  const s = {
    profile: profId,
    region: regionKey,
    pyeong: qv(q, 'pyeong', prof.pyeong),
    deposit: qv(q, 'deposit', Math.round(prof.deposit * regInfo.depMult)),
    rent: qv(q, 'rent', Math.round(prof.rent * regInfo.rentMult)),
    maint: qv(q, 'maint', prof.maint),
    intmode: ['self', 'turnkey', 'takeover'].includes(q.intmode) ? q.intmode : 'turnkey',
    interior: qv(q, 'interior', Math.round(prof.pyeong * prof.interiorPerPyeong)),
    equip: qv(q, 'equip', prof.equip),
    premium: qv(q, 'premium', prof.premium),
    kiosk: q.kiosk === '0' ? 0 : (prof.kioskCount > 0 ? 1 : 0),
    kioskcnt: qv(q, 'kioskcnt', prof.kioskCount || 1),
    subsidy: q.subsidy === '0' ? 0 : 1,
    staff: qv(q, 'staff', prof.staffMonthly),
    days: qv(q, 'days', 26),
    menudata: JSON.stringify(initMenu),
    menuItems: initMenu,
    delivmode: 'detail',
    dshare: qv(q, 'dshare', dp.dshare),
    pshare: qv(q, 'pshare', dp.pshare),
    dappfee: qv(q, 'dappfee', dp.dappfee),
    drider: qv(q, 'drider', dp.drider),
    dpack: qv(q, 'dpack', dp.dpack),
    dpromo: qv(q, 'dpromo', dp.dpromo),
    season: q.season === '0' ? 0 : 1,
    own: qv(q, 'own', 6000),
    hasloan: q.hasloan === '1' ? '1' : '0',
    expolicy: qv(q, 'expolicy', 0),
    exbank: qv(q, 'exbank', 0),
    exmort: qv(q, 'exmort', 0),
    excard: qv(q, 'excard', 0),
    exrate: qv(q, 'exrate', 6.2),
    credit: ['high', 'mid', 'low', 'sub'].includes(q.credit) ? q.credit : 'high',
    collateral: ['none', 'realestate', 'deposit'].includes(q.collateral) ? q.collateral : 'none',
    colval: qv(q, 'colval', 0),
    arrears: q.arrears === '1' ? 1 : 0,
    loantype: ['policy', 'mixed', 'bank'].includes(q.loantype) ? q.loantype : 'policy',
    loanrate: qv(q, 'loanrate', 3.5),
    loanyears: qv(q, 'loanyears', 5)
  };

  const r = E.startupMaster(s, STARTUP_PROFILES);
  const crumbs = [{ name: '홈', path: '/' }, { name: '창업 풀코스 설계', path: '/calculators/startup-master' }];
  const regionOptions = Object.keys(E.STARTUP_REGIONS).map((k) => [k, E.STARTUP_REGIONS[k].name]);

  const form = `
<div class="stepper-wrap" data-stepper>
  <div class="stepper-top">
    <span class="stepper-status" data-step-status>현재 1 / 5 단계 진행 중 · 업종 &amp; 창업 지역 고르기</span>
    <button type="button" class="btn-xs" data-step-expand>전체 단계 한눈에 펼치기</button>
  </div>
  <div class="stepper-bar" role="tablist" aria-label="창업 설계 5단계 진행 표시줄">
    <button type="button" class="step-tab active" role="tab" aria-selected="true" data-step-btn="1"><span class="step-num">1</span><span class="step-lbl">업종·지역</span></button>
    <span class="step-arrow" aria-hidden="true">›</span>
    <button type="button" class="step-tab" role="tab" aria-selected="false" data-step-btn="2"><span class="step-num">2</span><span class="step-lbl">가게·인테리어</span></button>
    <span class="step-arrow" aria-hidden="true">›</span>
    <button type="button" class="step-tab" role="tab" aria-selected="false" data-step-btn="3"><span class="step-num">3</span><span class="step-lbl">기기·인건비</span></button>
    <span class="step-arrow" aria-hidden="true">›</span>
    <button type="button" class="step-tab" role="tab" aria-selected="false" data-step-btn="4"><span class="step-num">4</span><span class="step-lbl">메뉴·배달</span></button>
    <span class="step-arrow" aria-hidden="true">›</span>
    <button type="button" class="step-tab" role="tab" aria-selected="false" data-step-btn="5"><span class="step-num">5</span><span class="step-lbl">내 돈·기존대출</span></button>
  </div>
</div>

<fieldset class="step-pane" data-step-pane="1">
  <div class="step-pane-head"><span class="step-badge">1단계 / 5단계</span><legend style="margin:0">창업할 업종과 희망 지역을 선택해 주세요</legend></div>
  <input type="hidden" name="profile" data-bind="profile" value="${esc(s.profile)}">
  <div class="sel-prof-banner" data-sel-prof-banner>
    <div><strong data-sel-prof-name>선택된 업종: ${esc(prof.name)}</strong><span class="detail-sub" style="color:inherit;opacity:.85" data-sel-prof-meta>아래 카드 중 원하는 업종을 클릭하면 표준 수치와 메뉴가 자동 세팅됩니다.</span></div>
  </div>
  <div class="prof-toolbar">
    <input type="search" class="prof-search" placeholder="업종 빠른 검색 (예: 커피, 미용실, 네일, 초밥, 코인세탁, 필라테스, 편의점...)" aria-label="창업 업종 검색" data-prof-search>
    <div class="prof-chips" role="tablist" aria-label="업종군 분류" data-prof-groups>
      ${STARTUP_GROUPS.map((g, idx) => `<button type="button" class="prof-chip${idx === 0 ? ' active' : ''}" data-group-filter="${esc(g.id)}">${esc(g.label)}</button>`).join('')}
    </div>
  </div>
  <div class="profile-grid" data-profile-grid role="radiogroup" aria-label="창업 업종 카드 선택">
    ${STARTUP_PROFILES.map((p) => `<button type="button" class="prof-btn${p.id === s.profile ? ' active' : ''}" data-pick-profile="${esc(p.id)}" data-prof-group="${esc(p.group)}" data-prof-name="${esc(p.name)}" aria-pressed="${p.id === s.profile ? 'true' : 'false'}"><span class="prof-radio" aria-hidden="true"></span><span class="prof-btn-body"><span>${esc(p.name)}</span><small>${esc(p.group)} · 평균원가 ${p.cogsPct}% · ${p.pyeong}평 기준</small></span></button>`).join('')}
  </div>
  <p class="plan-note" data-season-note>${esc(prof.seasonNote)}</p>

  ${selectField('region', '어느 지역에서 창업을 생각 중이신가요? (지역 시세 자동 반영)', regionOptions, s.region, '선택한 지역의 평균 상가 보증금·월세 수준과 상가임대차보호법 보호 기준이 2단계에 자동으로 맞춰집니다.')}
  <div class="rec-box" data-loc-rec-box>
    <div><strong>이 업종 추천 자리:</strong> <span data-loc-best>${esc(r.locRec.best)}</span></div>
    <div><strong>피해야 할 자리:</strong> <span data-loc-avoid>${esc(r.locRec.avoid)}</span></div>
    <div><strong>현장 팁:</strong> <span data-loc-tip>${esc(r.locRec.tip)}</span></div>
    <div style="margin-top:4px"><a class="btn-xs" style="display:inline-block;text-decoration:none" data-map-link href="/commercial-area?biz=${encodeURIComponent(s.profile)}">실제 지도로 후보지 주변 경쟁가게 · 상권 직접 찍어보기 →</a></div>
  </div>
  <div class="step-nav"><span></span><button type="button" class="btn btn-primary" data-go-step="2">다음 2단계: 가게 · 인테리어 →</button></div>
</fieldset>

<fieldset class="step-pane" data-step-pane="2" hidden>
  <div class="step-pane-head"><span class="step-badge">2단계 / 5단계</span><legend style="margin:0">가게 보증금 · 월세 · 인테리어 공사비</legend></div>
  ${range('pyeong', '가게 실제 넓이(전용 평수)', 5, 100, 1, s.pyeong, '평', '', '복도·공용화장실을 뺀 실제 우리 가게 내부 면적(전용면적)입니다. 평수를 바꾸면 아래 인테리어 예상비도 함께 계산됩니다.')}
  ${range('deposit', '가게 보증금 (나중에 돌려받는 돈)', 0, 30000, 100, s.deposit, '만원', '', '건물주에게 맡겨두었다가 계약이 끝날 때 돌려받는 금액입니다. 다만 초기 목돈이 묶이므로 총 필요 창업자금에는 포함됩니다.')}
  ${range('rent', '다달이 내는 월세 (부가세 별도)', 0, 1500, 10, s.rent, '만원', '', '상가 월세에는 보통 10% 부가세가 따로 붙습니다(일반과세자는 부가세 신고 때 환급/공제 가능).')}
  <p class="plan-note" data-lease-note>환산보증금(보증금 + 월세×100) <strong>${manwon(r.convertedDeposit)}</strong> — ${esc(r.leaseCapObj.name)} 법정 기준(${manwon(r.leaseCapObj.cap)}) ${r.underLeaseCap ? '이내여서 매년 월세 5% 상한 및 10년 계약갱신 보호를 받습니다.' : '초과 구간이라 건물주의 큰 폭 월세 인상을 막으려면 계약서 특약이 꼭 필요합니다.'}</p>
  ${range('maint', '월 상가 관리비 · 전기 · 수도요금', 0, 400, 5, s.maint, '만원', '', '집합상가는 복도·엘리베이터 공용관리비가 평당 1~3만원씩 나오는 경우가 많으니 계약 전 관리비 고지서를 꼭 확인하세요.')}
  ${seg('intmode', '인테리어는 어떻게 진행할까요?', [['turnkey', '업체 한 곳에 통째로 맡기기'], ['self', '기술자 직접 따로 부르기(−22%)'], ['takeover', '전 사장님 시설 그대로 인수(−58%)']], s.intmode, '어려운 공사 용어 대신 실제 진행 방식으로 골라보세요. 선택에 따라 평균 공사비가 자동 조정됩니다.')}
  <p class="plan-note" data-intmode-note>${esc(intModeNoteText(s.intmode))}</p>
  ${range('interior', '예상 인테리어 공사비', 0, 25000, 50, s.interior, '만원', '', '평당 공사비 외에 전기 증설·냉난방기·철거비가 빠진 견적이 많으니 여유 있게 잡는 것이 안전합니다.')}
  ${range('equip', '주방기기 · 커피머신 · 간판 · 첫 물품비', 0, 15000, 50, s.equip, '만원', '', '깨끗한 중고 주방기기·냉장고를 섞어 구매하면 신품 대비 35~50%를 아낄 수 있습니다.')}
  ${range('premium', '전 사장님께 주는 권리금', 0, 20000, 100, s.premium, '만원', '', '기존 가게의 단골·자리·시설 대가로 이전 사장님께 지급하는 돈입니다. 나중에 100% 회수한다는 보장이 없으므로 보수적으로 잡으세요.')}
  <div class="step-nav"><button type="button" class="btn btn-ghost" data-go-step="1">← 1단계(업종·지역)</button><button type="button" class="btn btn-primary" data-go-step="3">다음 3단계: 무인기기 · 인건비 →</button></div>
</fieldset>

<fieldset class="step-pane" data-step-pane="3" hidden>
  <div class="step-pane-head"><span class="step-badge">3단계 / 5단계</span><legend style="margin:0">키오스크 · 테이블오더 &amp; 직원 인건비</legend></div>
  ${toggle('kiosk', '무인 결제기(키오스크 · 테이블오더) 설치하기', s.kiosk === 1, '주문 받는 인건비 절약', '손님이 직접 주문·결제하는 기기입니다. 카운터 알바 1명을 줄이거나 피크타임 주문 누락을 막아줍니다.')}
  ${range('kioskcnt', '설치할 무인기기 대수', 0, 25, 1, s.kioskcnt, '대')}
  ${toggle('subsidy', '정부 스마트상점 기기 구매 보조금(70%, 최대 500만원) 받기', s.subsidy === 1, '', '소상공인시장진흥공단 ‘스마트상점 기술보급사업’ 공고에 선정되면 기기 공급가의 최대 70%(500만원 한도)를 국비로 지원받습니다. 반드시 선정 후 구매해야 합니다.')}
  ${range('staff', '한 달 직원 · 알바 총 인건비', 0, 2500, 10, s.staff, '만원', '사장님 본인 급여 제외', '사장님 혼자 운영(1인 매장)하면 0원으로 두세요. 주 15시간 이상 일하는 알바는 주휴수당과 4대보험 사업주 부담분(약 11%)이 추가됩니다.')}
  <div class="step-nav"><button type="button" class="btn btn-ghost" data-go-step="2">← 2단계(가게·인테리어)</button><button type="button" class="btn btn-primary" data-go-step="4">다음 4단계: 판매메뉴 · 배달 →</button></div>
</fieldset>

<fieldset class="step-pane" data-step-pane="4" hidden>
  <div class="step-pane-head"><span class="step-badge">4단계 / 5단계</span><legend style="margin:0">카테고리별 판매 메뉴 등록 &amp; 배달 · 포장 상세</legend></div>
  <input type="hidden" name="menudata" data-bind="menudata" value="${esc(s.menudata)}">
  <input type="hidden" name="delivmode" data-bind="delivmode" value="detail">

  <div class="field" style="border-bottom:0;padding-bottom:2px">
    <span class="label">우리 가게 판매 카테고리별 가격 · 하루 판매량 · 원가율 등록${tipHtml('가게에서는 한 가지 메뉴만 팔지 않으므로 주력 음료, 디저트, 식사, 사이드처럼 카테고리를 나누어 등록해 보세요. 전체 평균 결제단가와 원가율이 자동으로 합산됩니다.')}</span>
    <div class="menu-builder" data-menu-builder>
      <div class="menu-cat-head"><span>판매 카테고리명</span><span>평균 가격(원)</span><span>하루 수량(건)</span><span>원가율(%)</span><span></span></div>
      <div class="menu-cat-list" data-menu-list></div>
      <div class="menu-cat-foot">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="btn-xs" data-add-menu>+ 판매 카테고리 추가하기</button>
          <button type="button" class="btn-xs" style="border-color:var(--line-2);color:var(--text-2)" data-reset-menu>업종 기본 메뉴로 되돌리기</button>
        </div>
        <div class="menu-cat-sum tnum" data-menu-sum>하루 총 <strong>${fmt(r.dailyOrders)}건</strong> · 평균 결제 <strong>${won(r.ticket)}</strong> · 평균 원가율 <strong>${pct(r.cogsPct)}</strong></div>
      </div>
    </div>
  </div>

  ${range('days', '한 달 영업일수', 15, 31, 1, s.days, '일', '주 1회 휴무면 보통 26일')}

  <div style="margin-top:8px;padding-top:10px;border-top:2px dashed var(--line)">
    <span class="label" style="font-size:14px;color:var(--text)">배달 · 포장 주문 비중 및 건당 부대비용 상세 설정${tipHtml('뭉뚱그린 비율 대신 배달 비중, 쓰는 배달앱 수수료, 라이더 배달비, 포장용기 값을 직접 넣으면 한 달에 실제로 빠져나가는 배달·수수료 총액이 정확히 계산됩니다.')}</span>
    ${range('dshare', '전체 주문 중 배달앱 주문 비중', 0, 100, 5, s.dshare, '%', '배달 안 하면 0%')}
    ${range('pshare', '전체 주문 중 포장(픽업) 주문 비중', 0, 100, 5, s.pshare, '%', '나머지는 매장 방문 결제')}
    <div data-deliv-detail-box>
      ${selectField('dappfee', '주로 이용하는 배달앱 요금제 (중개수수료)', [
        ['7.8', '배민1 · 쿠팡이츠 기본 구간 (중개 7.8% + 결제수수료 3%)'],
        ['6.8', '배달앱 매출 상위 우대 구간 (중개 6.8% + 결제수수료 3%)'],
        ['2.0', '배달앱 영세 상생 우대 구간 (중개 2.0% + 결제수수료 3%)'],
        ['9.8', '일반 고수수료 배달앱 (중개 9.8% + 결제수수료 3%)'],
        ['1.5', '공공배달앱(땡겨요·먹깨비 등) 위주 (중개 1.5~2.0%)']
      ], String(s.dappfee))}
      ${range('drider', '배달 1건당 사장님이 부담하는 라이더 배달비', 0, 6000, 100, s.drider, '원', '보통 2,900~3,500원')}
      ${range('dpack', '배달·포장 1건당 용기 · 보온팩 · 수저 · 봉투 값', 0, 3000, 50, s.dpack, '원', '커피 350~500원 / 한식·찜 900~1,500원')}
      ${range('dpromo', '배달 1건당 평균 할인쿠폰 · 앱 광고비', 0, 3000, 100, s.dpromo, '원', '깃발·클릭광고·쿠폰 평균')}
    </div>
    <p class="plan-note tnum" data-deliv-sum>매장 방문 ${r.delivBreakdown.hallShare}% · 포장 ${r.delivBreakdown.pickupShare}% · 배달 ${r.delivBreakdown.delivShare}% → 월 카드·앱 수수료 <strong>${won(r.delivBreakdown.monthlyFeeKRW)}</strong> + 라이더 배달비 <strong>${won(r.delivBreakdown.monthlyRiderKRW)}</strong> + 용기·쿠폰 <strong>${won(r.delivBreakdown.monthlyPackKRW + r.delivBreakdown.monthlyPromoKRW)}</strong></p>
  </div>

  ${toggle('season', '업종별 1년 계절 변화(여름 성수기 · 겨울 비수기) 반영하기', s.season === 1)}
  <div class="step-nav"><button type="button" class="btn btn-ghost" data-go-step="3">← 3단계(기기·인건비)</button><button type="button" class="btn btn-primary" data-go-step="5">다음 5단계: 내 돈 · 기존대출 →</button></div>
</fieldset>

<fieldset class="step-pane" data-step-pane="5" hidden>
  <div class="step-pane-head"><span class="step-badge">5단계 / 5단계</span><legend style="margin:0">내 현금 자본금 &amp; 기존 보유 대출 · 신규 조달 진단</legend></div>
  ${range('own', '내가 지금 바로 쓸 수 있는 순수 현금(자기자본)', 0, 40000, 100, s.own, '만원', '', '대출을 제외한 내 순수 예금·현금입니다. 총 창업비용에서 이 금액을 뺀 나머지가 새로 빌려야 할 부족 자금이 됩니다.')}

  ${seg('hasloan', '현재 이미 갚고 있는 기존 대출이 있으신가요?', [['0', '기존 대출 없음'], ['1', '있음 (종류별로 입력해 한도 확인)']], s.hasloan, '기존에 어떤 대출(보증서·신용·주담대·카드론)을 얼마나 갖고 있는지에 따라 추가 창업대출 승인 여부와 한도가 완전히 달라집니다.')}

  <div data-exloan-box${s.hasloan === '1' ? '' : ' hidden'}>
    <p class="note" style="margin:0 0 6px">보유 중인 대출 잔액을 종류별로 대략 입력해 주세요 (단위: 만원)</p>
    <div class="sub-grid-2">
      ${miniNum('expolicy', '기존 보증서 · 정책자금', s.expolicy, '만원', '지역신용보증재단·소진공 등 기존 보증 대출은 신규 창업보증 한도(통상 5~7천만원)에서 1:1로 먼저 차감됩니다.')}
      ${miniNum('exbank', '1금융 신용 · 마이너스통장', s.exbank, '만원', '시중은행·인터넷은행 직장인/개인 신용대출 및 마이너스통장 사용 금액입니다.')}
      ${miniNum('exmort', '주택담보 · 전세자금대출', s.exmort, '만원', '아파트 담보대출이나 전세대출은 개인 원리금상환비율(DSR)에 영향을 줄 수 있습니다.')}
      ${miniNum('excard', '캐피탈 · 저축은행 · 카드론', s.excard, '만원', '2금융권 대출·카드론·현금서비스가 남아 있으면 보증서 및 1금융 승인이 크게 제한되므로 가장 주의해야 합니다.')}
    </div>
    ${range('exrate', '기존 신용 · 사업자대출 평균 금리', 2, 20, 0.1, s.exrate, '%')}
  </div>

  ${selectField('credit', '내 신용점수대 (카카오페이 · 토스 기준)', [
    ['high', '840점 이상 (우량 — 정책·1금융 통과 유리)'],
    ['mid', '750 ~ 839점 (보통 — 보증서 우선 확보 권장)'],
    ['low', '650 ~ 749점 (다소 낮음 — 소진공·지역신보 상담 필수)'],
    ['sub', '650점 미만 (저신용 특례보증 · 햇살론 전용 구간)']
  ], s.credit)}

  ${selectField('collateral', '추가로 맡길 수 있는 담보가 있나요?', [
    ['none', '담보 없음 (보증서 · 신용대출로만 조달)'],
    ['realestate', '본인/배우자 아파트 · 부동산 담보 여유 있음'],
    ['deposit', '우량 상가 · 임차보증금 담보 설정 가능']
  ], s.collateral)}
  <div data-colval-box${s.collateral !== 'none' ? '' : ' hidden'}>
    ${range('colval', '담보 자산 시세(평가액)', 0, 100000, 500, s.colval, '만원', '선순위 주담대는 위에서 자동 차감')}
  </div>

  ${toggle('arrears', '현재 밀린 세금(국세·지방세)이나 연체가 있음', s.arrears === 1, '', '단 10만 원이라도 세금 미납이 있으면 모든 정책자금과 은행 대출이 전산에서 자동 거절됩니다.')}

  <div class="loan-diag-inline" data-loan-diag-box data-status="${r.loanCheck.status}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
      <strong data-loan-diag-title>${esc(r.loanCheck.verdictTitle)}</strong>
      <button type="button" class="btn-xs" data-apply-est-rate>진단 예상금리(연 ${r.loanCheck.estWeightedRate.toFixed(1)}%) 적용</button>
    </div>
    <p style="margin:6px 0 0" data-loan-diag-detail>${esc(r.loanCheck.verdictDetail)}</p>
    <ul style="margin:6px 0 0;padding-left:18px;font-size:12px" data-loan-diag-warns>${r.loanCheck.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
  </div>

  ${seg('loantype', '부족한 창업자금 적용 금리 빠른 선택', [['policy', '정책·보증 위주(3.5%)'], ['mixed', '보증+은행 혼합(4.4%)'], ['bank', '일반은행·담보(5.5%)']], s.loantype)}
  ${range('loanrate', '실제 계산에 넣을 신규 대출 연 금리', 1.5, 16, 0.1, s.loanrate, '%')}
  ${range('loanyears', '대출 원금+이자 나눠 갚는 기간', 1, 10, 1, s.loanyears, '년', '', '정책·보증 창업자금은 보통 1년 거치 후 4년 분할상환(총 5년) 구조를 가장 많이 씁니다.')}
  <div class="step-nav"><button type="button" class="btn btn-ghost" data-go-step="4">← 4단계(메뉴·배달)</button><a class="btn" href="#calc-result-top">오른쪽 최종 수익 진단표 확인 ↑</a></div>
</fieldset>`;

  const out = `
<div class="card result-hero" id="calc-result-top" data-status="${r.avgMonthlyCashFlow > 0 && r.deficitMonths === 0 ? 'safe' : (r.avgMonthlyCashFlow > 0 ? 'caution' : 'danger')}">
  <p class="rh-label">세금·대출원리금까지 다 뺀 월평균 실수령 현금흐름</p>
  <p class="rh-value tnum">${o('avgCash', won(r.avgMonthlyCashFlow))}</p>
  <p class="rh-sub">1년 누적 실수령 <strong class="tnum">${o('annualCash', won(r.annualCashFlow))}</strong> · 순수 초기투자비 회수 <strong class="tnum">${o('payback', r.paybackMonths != null ? fmt(r.paybackMonths, 1) + '개월' : '회수 불가')}</strong></p>
</div>

<div class="card">
  <h2 class="card-h">창업 자금 &amp; 대출 한도 요약 (총 투자금 vs 내 돈 vs 대출 가능액)</h2>
  <div class="kpi-grid tnum">
    <div><span>총 필요 창업자금 (보증금 포함)</span><strong>${o('totalStartup', manwon(r.totalStartup))}</strong></div>
    <div><span>장사로 뽑아야 할 초기 시설·권리금</span><strong>${o('sunkStartup', manwon(r.sunkStartup))}</strong></div>
    <div><span>스마트상점 국비 보조 차감</span><strong>${o('kioskSub', '−' + manwon(r.kioskSubsidy))}</strong></div>
    <div class="hl"><span>새로 빌려야 할 부족 자금</span><strong>${o('loanNeeded', manwon(r.loanNeeded))}</strong></div>
    <div><span>기대출 반영 예상 대출가능 한도</span><strong>${o('availLoanOut', manwon(r.loanCheck.totalAvailLoan))}</strong></div>
    <div><span>매달 갚을 신규 원리금 (${o('loanYrsTxt', r.loanYears + '년 분할')})</span><strong>${o('mDebt', won(r.monthlyDebtServiceKRW))}</strong></div>
    <div><span>월매출 대비 월세+관리비 비중</span><strong>${o('rentRatioOut', pct(r.annualSalesKRW > 0 ? ((r.rent + r.maint) * 10000 * 12 / r.annualSalesKRW) * 100 : 0) + (r.annualSalesKRW > 0 && ((r.rent + r.maint) * 10000 * 12 / r.annualSalesKRW) * 100 <= 12 ? ' (안정)' : ' (주의)'))}</strong></div>
    <div><span>기존 신용·사업자대출 월 이자(별도)</span><strong>${o('exIntOut', r.loanCheck.exMonthlyInterestKRW > 0 ? won(r.loanCheck.exMonthlyInterestKRW) : '없음(0원)')}</strong></div>
  </div>
  <p class="footnote-meta">※ 부족한 창업자금과 기존 고금리 대출을 가장 이자 싼 순서로 묶는 상세 전략은 <a href="/funding">사업자 대출 · 정책자금 라운지</a>에서 바로 이어서 확인하실 수 있습니다.</p>
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
  <h2 class="card-h">한 달 매출에서 원가·배달비·월세·세금·대출금이 빠지고 남는 순서</h2>
  <div class="chart" data-chart="waterfall" role="img" aria-label="창업 월평균 매출 공제 차트"></div>
  <table class="mini-table tnum" data-table="breakdown"><tbody>${r.monthlyBreakdown.map((b) => `<tr><th>${esc(b.label)}</th><td>${won(b.value)}</td><td>${pct(r.annualSalesKRW > 0 ? b.value / (r.annualSalesKRW / 12) * 100 : 0)}</td></tr>`).join('')}</tbody></table>
</div>

<div class="card killer">
  <h2 class="card-h">이 업종 평균 마진 &amp; 손님을 더 부르는 현장 운영 디테일</h2>
  <p class="killer-text" data-out="benchMargin">${esc(prof.benchMargin)}</p>
  <ul class="tip-list" data-out-html="tips" style="margin-top:12px">${prof.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
</div>

<div class="card" data-startup-chk>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
    <h2 class="card-h" style="margin:0">초보 창업자가 견적서에서 가장 많이 빠뜨리는 숨은 비용 8가지 점검표</h2>
    <span class="pill tnum" data-chk-count>점검 완료 0 / 8</span>
  </div>
  <p class="note" style="margin:6px 0 10px">인테리어 ‘평당 단가’에는 아래 별도 공사가 빠져 있는 경우가 대부분입니다. 계약 전 하나씩 직접 체크해 예산 구멍(통상 1,500만~3,000만 원)을 막으세요.</p>
  <ul class="detail-chk">
    <li><label><input type="checkbox"><span><strong>전기 승압 공사비 (한전 불입금 + 내선 증설)</strong><span class="detail-sub">커피머신·오븐·튀김기·냉동고가 들어가는 매장은 기본 5kW로 부족합니다. 15~30kW 증설 시 kW당 약 15~22만 원 별도 발생.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>도시가스 배관 인입 · 계량기 등급 증설비</strong><span class="detail-sub">기존 상가에 가스 배관이 없거나 용량이 작으면 인입 공사비로 150만~400만 원이 추가될 수 있습니다.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>천장형 냉난방기 · 주방 급배기 후드/닥트 입상관</strong><span class="detail-sub">고깃집·치킨·로스터리 매장은 옥상 입상 닥트 및 제연기 미설치 시 오픈 직후 냄새 민원으로 재시공하는 사례가 많습니다.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>건축물대장 용도(제1·2종 근린생활시설) 및 정화조 용량</strong><span class="detail-sub">일반소매점 자리를 음식점·카페로 바꿀 때 정화조 인원 용량이 부족하면 영업신고 자체가 반려됩니다. 임대차 계약 전 필히 확인.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>기존 점포 철거 · 폐기물 반출 및 추후 원상복구 범위</strong><span class="detail-sub">계약서 특약에 ‘현 시설 상태 인도’ 문구를 넣지 않으면 폐업 시 이전 임차인이 해둔 시설까지 철거해 줘야 하는 폭탄을 맞습니다.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>외부 전면 간판 · 어닝 · 유리 시트지 · 도로점용 허가</strong><span class="detail-sub">인테리어 본견적에서 외부 사인물이 별도인지, 지자체 돌출간판 규격 제한 구역인지 반드시 확인하세요.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>POS · 인터넷 · CCTV · 정수기 ‘무상 지원’ 위약금 독소조항</strong><span class="detail-sub">기기 무상 임대를 조건으로 3년 약정 및 중도 해지 시 수백만 원 위약금을 물리는 계약을 피하고 단말기 공기계 구매와 비교하세요.</span></span></label></li>
    <li><label><input type="checkbox"><span><strong>초도 식자재·포장재 발주비 + 최소 3개월 비상 운전자금</strong><span class="detail-sub">오픈 날 통장 잔고가 0원이면 첫 비수기에 무너집니다. 최소 월세+원리금 3~6개월치를 별도 계좌에 남겨 두세요.</span></span></label></li>
  </ul>
</div>`;

  const faq = [
    { q: '창업 비용에서 보증금과 권리금·인테리어비를 왜 따로 보나요?', a: '가게 보증금은 계약이 끝날 때 건물주에게 돌려받는 내 돈이지만, 인테리어 공사비·철거비·간판·초기 권리금은 장사를 해서 벌지 못하면 사라지는 비용이기 때문입니다. 따라서 투자비 회수 기간은 반드시 보증금을 뺀 순수 시설·권리금이 첫 계약 기간(24개월) 안에 회수되는지로 따져야 안전합니다.' },
    { q: '인테리어를 업체 한 곳에 맡기는 것과 기술자를 직접 부르는 것은 무엇이 다른가요?', a: '업체 한 곳에 통째로 맡기면(종합 시공) 일정 조율이 편한 대신 전체 공사비의 18~25%가 업체 관리이윤으로 붙습니다. 반면 도면을 먼저 그린 뒤 철거·전기·목공·도장·에어컨 기술자를 직접 따로 부르면 수백만~천만 원 이상 아낄 수 있습니다. 가장 돈을 아끼는 방법은 같은 업종을 하던 가게의 시설을 그대로 인수해 간판만 바꾸는 것입니다.' },
    { q: '기존에 직장인 신용대출이나 카드론이 있으면 창업 대출이 안 나오나요?', a: '기존 보증서 대출은 신규 창업보증 한도에서 그대로 차감되며, 특히 카드론·현금서비스·저축은행 대출이 남아 있으면 보증재단과 1금융권 심사에서 거절되거나 한도가 크게 깎입니다. 내 현금 중 일부로 카드론부터 먼저 상환해 신용점수를 올린 뒤 연 2~3%대 정책·보증자금을 신청하는 것이 훨씬 이득입니다.' },
    { q: '배달 비중이 높은 매장은 자리를 어디에 얻는 것이 유리한가요?', a: '배달 주문이 절반 이상이라면 보증금과 권리금이 비싼 대로변 1층 코너에 들어갈 필요가 없습니다. 배달 라이더가 오토바이를 잠시 세우기 편한 이면도로 1층 소형 매장에서 월세를 100만 원 아끼는 것이 1년 순수익을 1,200만 원 늘리는 가장 확실한 전략입니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head calc-head">
    <span class="eyebrow">${icon('compass', 16)} 1단계부터 5단계까지 차근차근 완성하는 창업 풀코스 설계</span>
    <h1>${esc(calc.name)}</h1>
    <p class="lead">업종과 창업 희망 지역을 고른 뒤, 가게 인테리어 방식, 카테고리별 판매 메뉴, 배달 부대비용, 내 현금과 기존 대출 상태까지 5단계로 입력해 보세요. 세금과 대출 원리금까지 모두 뺀 진짜 1년 실수익과 대출 승인 가능성을 한눈에 알려드립니다.</p>
    ${freeOpenBanner('calc')}
    <p class="footnote-meta">※ 세율·최저임금·스마트상점 보조한도·정책자금 금리는 최신 정부 고시 데이터를 기준으로 반영되었습니다 (검증 기준일 ${facts.VERIFIED_AT}).</p>
  </header>
  <section class="calc" id="calc" data-calc="startup-master" aria-label="창업 풀코스 시뮬레이터">
    <form class="calc-form card" id="calc-form" onsubmit="return false" novalidate>${form}</form>
    <div class="calc-out">
      ${out}
      <div class="card bench" data-bench aria-live="polite"><div class="bench-head"><span class="pill">같은 업종 평균과 비교</span><span class="bench-src" data-bench-src>익명 계산 통계</span></div><p class="bench-text" data-bench-text>같은 업종을 계산해 본 예비창업자 평균 수익률과 비교해 드립니다.</p></div>
      <p class="free-save-tip">올해 무료 개방 기간에 저장해 둔 진단표 이미지와 계산 링크는 기간이 지나도 제한 없이 다시 확인하실 수 있습니다.</p>
      <div class="calc-actions" role="group" aria-label="결과 공유">
        <button type="button" class="btn btn-primary" data-action="copy-link">${icon('link', 16)} 내 창업 설계 링크 복사</button>
        <button type="button" class="btn" data-action="receipt">${icon('receipt', 16)} 창업 손익 진단표 이미지 저장</button>
        <a class="btn" href="/funding">${icon('bank', 16)} 부족 자금 최저금리 조달법 보기</a>
        <button type="button" class="btn btn-ghost" data-action="reset">초기화</button>
        <span class="toast" role="status" aria-live="polite" data-toast></span>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>30대 핵심 창업 업종별 초기자금 · 원가율 · 계절 편차 총람표</h2></div>
    <p class="sec-desc">원하시는 업종 이름을 클릭하면 해당 업종의 현장 표준 임대료·시설비·기본 판매 메뉴와 12개월 계절지수가 위 시뮬레이터에 즉시 세팅됩니다.</p>
    <div class="table-scroll">
      <table class="rate-board tnum">
        <thead><tr><th>업종군 · 세부 업종</th><th>표준 평수</th><th>추정 총창업비(보증금 포함)</th><th>식자재·상품 원가율</th><th>최고/최저 계절 편차</th><th>현장 통상 수익 기준</th></tr></thead>
        <tbody>
          ${STARTUP_PROFILES.map((p) => {
            const estInterior = Math.round(p.pyeong * p.interiorPerPyeong);
            const estKiosk = Math.max(0, (p.kioskCount || 0) * (p.kioskUnitManwon || 0) - Math.min(Math.round((p.kioskCount || 0) * (p.kioskUnitManwon || 0) * 0.7), 500));
            const estTotal = p.deposit + estInterior + p.equip + p.premium + estKiosk;
            const maxS = Math.max(...p.seasonality);
            const minS = Math.min(...p.seasonality);
            return `<tr>
              <td><a href="/calculators/startup-master?profile=${encodeURIComponent(p.id)}"><strong>${esc(p.name)}</strong></a><span class="detail-sub">${esc(p.group)}</span></td>
              <td>${p.pyeong}평</td>
              <td><strong>${manwon(estTotal)}</strong><span class="detail-sub">보증금 ${manwon(p.deposit)} 포함</span></td>
              <td>${p.cogsPct}%</td>
              <td>${Math.round(minS * 100)}% ~ ${Math.round(maxS * 100)}%</td>
              <td style="font-size:13px">${esc(p.benchMargin)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
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
