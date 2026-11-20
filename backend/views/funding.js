'use strict';
const E = require('../public/js/calc-engine.js');
const rates = require('../lib/rates');
const facts = require('../data/facts');
const { esc, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const { icon } = require('./icons');
const { miniCalc } = require('./pages');

const fmt = E.fmt, won = E.won, manwon = E.manwon;

function qv(q, k, def) {
  if (q[k] === undefined || q[k] === '') return def;
  const x = Number(q[k]);
  return Number.isFinite(x) ? x : def;
}

function fundingView(q) {
  const mkt = rates.getMarketRatesSummary();
  const s = {
    purpose: ['startup', 'expand', 'urgent', 'refinance'].includes(q.purpose) ? q.purpose : 'expand',
    sales: qv(q, 'sales', 18000),
    credit: ['high', 'mid', 'low', 'sub'].includes(q.credit) ? q.credit : 'mid',
    collateral: ['none', 'realestate', 'deposit', 'securities'].includes(q.collateral) ? q.collateral : 'none',
    colval: qv(q, 'colval', 0),
    debt: qv(q, 'debt', 3000),
    debtrate: qv(q, 'debtrate', 8.2),
    arrears: q.arrears === '1' ? 1 : 0,
    emp: q.emp === 'gte5' ? 'gte5' : 'lt5'
  };
  const r = E.loanDiagnose(s);
  const crumbs = [{ name: '홈', path: '/' }, { name: '사업자 대출 · 정책자금 라운지', path: '/funding' }];

  const faq = [
    { q: '급하게 돈이 필요할 때 왜 카드론·캐피탈부터 쓰면 안 되나요?', a: '제2금융권 고금리 신용대출이나 카드론을 먼저 실행하면 신용점수 하락과 함께 다중채무자로 분류되어, 원래 연 2~3%대로 받을 수 있었던 지역신용보증재단 보증서와 제1금융권 한도가 막히기 때문입니다. 단기 몇 주만 쓸 급전이라면 신용점수 영향이 적고 중도상환수수료가 없는 주거래 마이너스통장이나 보유 증권 예탁담보대출 등을 먼저 검토하고, 운전자금은 반드시 정책자금·보증서부터 신청해야 합니다.' },
    { q: '대출 한도를 합법적으로 더 늘리는 가장 확실한 방법은 무엇인가요?', a: '첫째, 지역신용보증재단 보증서 대출(대리대출) 한도와 소상공인시장진흥공단·중진공 직접대출 한도는 별도로 산정되는 경우가 많아 순서를 맞춰 조합하는 것입니다. 둘째, 부가세 과세표준증명상 매출이 누락되지 않도록 현금·간이영수증 매출까지 성실 신고하는 것이며, 셋째로 카드 가맹점 입금 계좌를 주거래 은행 하나로 통합해 가맹점 우대 한도를 확보하는 것입니다.' },
    { q: '국세나 지방세 체납이 조금 남아 있어도 정책자금 신청이 되나요?', a: '안 됩니다. 금액이 소액이라도 신청일 현재 국세·지방세 체납이나 금융권 연체 기록이 있으면 소진공·지역신보·시중은행 모두 전산 심사 1단계에서 자동 거절됩니다. 반드시 완납증명서 발급 가능 상태를 만든 뒤 접수하세요.' },
    { q: '증권사 대출은 사업자에게 어떤 경우에 유리한가요?', a: '대표자 명의로 상장주식·채권·ETF 등 금융자산을 보유하고 있을 때, 보증금 잔금이나 물품 선결제처럼 며칠~1~2개월 내 회수될 단기 브릿지 자금이 필요한 경우 당일 즉시 실행되고 중도상환수수료가 없어 유용합니다. 다만 주가 하락 시 담보유지비율(통상 140%) 미달로 반대매매 위험이 있으므로 장기 시설자금 용도로는 부적합합니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('bank', 16)} 어디서 빌려야 가장 이자가 싸고 한도가 잘 나올까?</span>
    <h1>사업자 대출 · 정책자금 비교 라운지</h1>
    <p class="lead">사업을 확장할 때나 긴급 운전자금이 필요할 때 “과연 대출이 나올지, 어디서 빌려야 가장 이자가 싼지, 어떻게 해야 한도를 더 확보할 수 있는지”를 한곳에서 진단합니다. 정책자금부터 제1금융권·증권사·대환 프로그램까지 가장 유리한 조달 순서를 먼저 확인하세요.</p>
    <p class="footnote-meta">※ 한국은행 기준금리(${mkt.bokBaseRate}%), 은행연합회·금융투자협회 및 소진공·지역신보 최신 공시 데이터 반영 (기준일 ${mkt.verifiedAt})</p>
  </header>

  <section class="sec" style="margin-top:12px">
    <div class="sec-head"><h2>금융권별 사업자 대출 평균 금리 & 실행 속도 브리핑</h2><a href="/calculators/policy-funds">정책자금 상세 매칭기 →</a></div>
    <div class="kpi-grid tnum" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">
      <div class="card" style="padding:14px"><span>정책자금 · 이차보전</span><strong>${mkt.policyBaseRange}</strong></div>
      <div class="card" style="padding:14px"><span>시중은행 사업자 담보 평균</span><strong>연 ${mkt.bankBizMortgageAvg.toFixed(2)}%</strong></div>
      <div class="card" style="padding:14px"><span>시중은행 사업자 신용 평균</span><strong>연 ${mkt.bankBizCreditAvg.toFixed(2)}%</strong></div>
      <div class="card" style="padding:14px"><span>증권사 예탁증권 담보 평균</span><strong>연 ${mkt.securitiesCollateralAvg.toFixed(2)}%</strong></div>
    </div>
    <div class="table-scroll">
      <table class="rate-board tnum">
        <thead><tr><th>조달 순위</th><th>금융 채널</th><th>공시 금리 밴드</th><th>통상 한도</th><th>소요 기간</th><th>핵심 실무 포인트</th></tr></thead>
        <tbody>
          ${mkt.bands.map((b) => `<tr>
            <td><span class="pill">${esc(b.tier)}</span></td>
            <td><strong>${esc(b.channel)}</strong><br><small style="color:var(--text-3)">${esc(b.target)}</small></td>
            <td class="rate-num">${b.rateMin === b.rateMax ? '연 ' + b.rateMin.toFixed(1) + '% 고정' : '연 ' + b.rateMin.toFixed(1) + ' ~ ' + b.rateMax.toFixed(1) + '%'}</td>
            <td>${esc(b.limitDesc)}</td>
            <td>${esc(b.speed)}</td>
            <td style="font-size:13px;color:var(--text-2)">${esc(b.note)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>내 조건 대출 가능성 · 추정 한도 · 최저금리 순서 30초 진단</h2></div>
    <div class="calc" id="calc" data-calc="loan-diagnose">
      <form class="calc-form card" id="calc-form" onsubmit="return false" novalidate>
        <fieldset><legend>1. 자금 용도 & 매출·신용</legend>
          <div class="field"><label for="f-purpose">자금 필요 목적</label>
            <select id="f-purpose" data-bind="purpose">
              <option value="expand"${s.purpose === 'expand' ? ' selected' : ''}>매장 확장 · 설비투자 · 추가 출점</option>
              <option value="urgent"${s.purpose === 'urgent' ? ' selected' : ''}>긴급 운전자금 · 물품대금 · 급전</option>
              <option value="refinance"${s.purpose === 'refinance' ? ' selected' : ''}>고금리 대출 저금리 갈아타기(대환)</option>
              <option value="startup"${s.purpose === 'startup' ? ' selected' : ''}>신규 창업 초기자금</option>
            </select>
          </div>
          <div class="field"><label for="f-sales">직전 연매출 (신고 기준)</label>
            <div class="field-row"><input type="range" id="r-sales" min="0" max="100000" step="500" value="${s.sales}" data-bind="sales"><div class="num"><input type="number" id="f-sales" min="0" step="500" value="${s.sales}" data-bind="sales"><span class="unit">만원</span></div></div>
          </div>
          <div class="field"><label for="f-credit">대표자 신용점수 구간 (NCB 기준)</label>
            <select id="f-credit" data-bind="credit">
              <option value="high"${s.credit === 'high' ? ' selected' : ''}>840점 이상 (우량 신용)</option>
              <option value="mid"${s.credit === 'mid' ? ' selected' : ''}>750 ~ 839점 (중상 신용)</option>
              <option value="low"${s.credit === 'low' ? ' selected' : ''}>650 ~ 749점 (중저 신용)</option>
              <option value="sub"${s.credit === 'sub' ? ' selected' : ''}>650점 미만 (취약·특례보증 구간)</option>
            </select>
          </div>
          <div class="field"><span class="label">상시근로자 규모</span>
            <div class="seg">
              <label class="seg-opt"><input type="radio" name="emp" value="lt5" data-bind="emp"${s.emp === 'lt5' ? ' checked' : ''}><span>5인 미만(소상공인)</span></label>
              <label class="seg-opt"><input type="radio" name="emp" value="gte5" data-bind="emp"${s.emp === 'gte5' ? ' checked' : ''}><span>5인 이상(중소기업)</span></label>
            </div>
          </div>
        </fieldset>
        <fieldset><legend>2. 보유 담보 & 기존 부채</legend>
          <div class="field"><label for="f-collateral">활용 가능한 담보 자산</label>
            <select id="f-collateral" data-bind="collateral">
              <option value="none"${s.collateral === 'none' ? ' selected' : ''}>무담보 (보증서·신용 위주)</option>
              <option value="realestate"${s.collateral === 'realestate' ? ' selected' : ''}>부동산 · 아파트 · 상가 담보</option>
              <option value="securities"${s.collateral === 'securities' ? ' selected' : ''}>주식 · 채권 · ETF 예탁증권</option>
              <option value="deposit"${s.collateral === 'deposit' ? ' selected' : ''}>우량 상가·주택 임차보증금</option>
            </select>
          </div>
          <div class="field"><label for="f-colval">담보 자산 순평가액 (선순위 차감 후)</label>
            <div class="field-row"><input type="range" id="r-colval" min="0" max="100000" step="500" value="${s.colval}" data-bind="colval"><div class="num"><input type="number" id="f-colval" min="0" step="500" value="${s.colval}" data-bind="colval"><span class="unit">만원</span></div></div>
          </div>
          <div class="field"><label for="f-debt">기존 사업자 대출 잔액</label>
            <div class="field-row"><input type="range" id="r-debt" min="0" max="50000" step="200" value="${s.debt}" data-bind="debt"><div class="num"><input type="number" id="f-debt" min="0" step="200" value="${s.debt}" data-bind="debt"><span class="unit">만원</span></div></div>
          </div>
          <div class="field"><label for="f-debtrate">기존 대출 평균 금리</label>
            <div class="field-row"><input type="range" id="r-debtrate" min="2" max="20" step="0.1" value="${s.debtrate}" data-bind="debtrate"><div class="num"><input type="number" id="f-debtrate" min="0" step="0.1" value="${s.debtrate}" data-bind="debtrate"><span class="unit">%</span></div></div>
          </div>
          <div class="field field-toggle"><label class="switch"><input type="checkbox" id="f-arrears" data-bind="arrears"${s.arrears ? ' checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">현재 국세·지방세 체납 또는 금융 연체 있음</span></label></div>
        </fieldset>
      </form>

      <div class="calc-out">
        <div class="card result-hero" data-status="${r.grade}">
          <p class="rh-label">추정 추가 조달 가능 총한도 (보증+담보+매출한도 합산)</p>
          <p class="rh-value tnum"><span data-out="netLimit">${manwon(r.netAdditionalLimit)}</span></p>
          <p class="rh-sub"><span data-out="gradeLabel">${esc(r.gradeLabel)}</span></p>
        </div>
        <div class="card">
          <h3 class="card-h">부문별 한도 여력 분해</h3>
          <div class="kpi-grid tnum">
            <div class="hl"><span>정책 · 보증서 추정 여력</span><strong><span data-out="policyCap">${manwon(r.policyCap)}</span></strong></div>
            <div><span>매출연동 신용 추정 여력</span><strong><span data-out="salesCap">${manwon(r.salesCreditCap)}</span></strong></div>
            <div><span>담보 자산 대출 여력</span><strong><span data-out="colCap">${manwon(r.collateralCap)}</span></strong></div>
            <div><span>4.5% 대환 시 연 이자절감</span><strong><span data-out="refiSave">${won(r.refiAnnualSave)}</span></strong></div>
          </div>
        </div>
        <div class="card killer">
          <h3 class="card-h">사장님 맞춤 ‘가장 이자 싼 순서’ 조달 사다리 (반드시 위에서부터 진행)</h3>
          <ol class="ladder-list" data-out-html="ladder">
            ${r.ladder.map((st) => `<li class="ladder-item"><span class="ladder-step">${st.step}</span><div><strong>${esc(st.name)}</strong> <span class="pill">${esc(st.rate)} · ${esc(st.limit)}</span><p style="margin:5px 0 0;font-size:13.5px;color:var(--text-2)">${esc(st.why)}</p></div></li>`).join('')}
          </ol>
        </div>
        <div class="calc-actions">
          <button type="button" class="btn btn-primary" data-action="copy-link">${icon('link', 16)} 내 한도·금리 진단 결과 링크 복사</button>
          <button type="button" class="btn" data-action="receipt">${icon('receipt', 16)} 자금 조달 진단서 PNG 저장</button>
          <span class="toast" role="status" aria-live="polite" data-toast></span>
        </div>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="card" id="rate-gap-sim">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div>
          <span class="pill">실시간 금융비용 격차 시뮬레이션</span>
          <h2 class="card-h" style="margin:6px 0 0;font-size:20px">같은 금액을 빌릴 때, 어디서 빌리느냐에 따라 아끼는 현금</h2>
        </div>
        <strong class="tnum" style="font-size:15px;color:var(--safe)" id="rg-save-headline">고금리 대비 최대 2,736만원 절약</strong>
      </div>
      <div class="kpi-grid" style="margin-bottom:14px">
        <div class="field" style="border:0">
          <label for="rg-amt">필요 자금 규모: <strong class="tnum" id="rg-amt-lbl">8,000만원</strong></label>
          <input type="range" id="rg-amt" min="1000" max="30000" step="500" value="8000">
        </div>
        <div class="field" style="border:0">
          <span class="label">자금 사용 예정 기간 (중도상환수수료 자동 반영)</span>
          <div class="seg" id="rg-term">
            <label class="seg-opt"><input type="radio" name="rgterm" value="0.123"><span>45일 단기 브릿지</span></label>
            <label class="seg-opt"><input type="radio" name="rgterm" value="1"><span>1년 운전자금</span></label>
            <label class="seg-opt"><input type="radio" name="rgterm" value="3" checked><span>3년 확장·시설</span></label>
          </div>
        </div>
      </div>
      <div class="table-scroll">
        <table class="rate-board tnum">
          <thead><tr><th>조달 창구</th><th>대표 실질 금리</th><th>중도상환수수료</th><th>월평균 이자</th><th>선택 기간 총 금융비용</th><th>고금리 대비 절감액</th></tr></thead>
          <tbody id="rg-tbody"></tbody>
        </table>
      </div>
      <p class="footnote-meta">※ 45일 단기 브릿지 선택 시 일반 건별 담보대출의 중도상환수수료(약 0.9% 일할)까지 합산하여 마이너스통장·증권담보 대비 실제 유불리를 보여줍니다.</p>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>최신 핵심 정책자금 · 보조금 총람표</h2><a href="/category/policy-funds-grants">정책자금·대출 심층 바이블 전체 →</a></div>
    <div class="table-scroll">
      <table class="rate-board">
        <thead><tr><th>사업명</th><th>주관 기관</th><th>지원 한도</th><th>금리 · 조건</th><th>상환 기간</th><th>접수 창구</th></tr></thead>
        <tbody>
          ${facts.POLICY_PROGRAMS.map((p) => `<tr>
            <td><strong>${esc(p.name)}</strong></td>
            <td style="font-size:13px">${esc(p.org)}</td>
            <td class="tnum"><strong>${esc(p.limit)}</strong></td>
            <td style="font-size:13px">${esc(p.rate)}</td>
            <td style="font-size:13px">${esc(p.term)}</td>
            <td style="font-size:13px">${esc(p.where)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <section class="sec">
    ${miniCalc({ type: 'guarantee-fee', title: '보증서 보증료 + 지자체 이차보전 반영 실질 금리 3초 계산기', values: { loan: 5000, rate: 4.4, gfee: 0.9, sub: 2.0 }, cta: { href: '/calculators/policy-funds', label: '정책자금·대환대출 정밀 매칭기 열기' } })}
    ${miniCalc({ type: 'apr-trap', title: '선정산 · 일수수료(하루 0.04%) ‘연환산 실질금리’ 함정 3초 판독기', values: { amt: 4000, fee: 0.8, days: 20, alt: 3.5 }, cta: { href: '/bible/early-settlement-factoring-apr-trap', label: '선정산 연환산 금리 탈출 공식 읽기' } })}
  </section>

  <section class="sec">
    <div class="sec-head"><h2>매출은 잘 나오는데 왜 부결될까? — 심사 거절 7대 사유 & 사전 통과 해법</h2></div>
    <div class="table-scroll">
      <table class="rate-board">
        <thead><tr><th>단골 거절 사유</th><th>은행·보증기관에서 거절되는 이유</th><th>접수 전 해결 방법</th></tr></thead>
        <tbody>
          <tr><td><strong>1. 세무서 구두 분납 중인 미납 세금</strong></td><td>공식 징수유예 승인서 없이는 전산상 ‘체납자’로 즉시 자동 탈락</td><td>소액 체납은 단기 여유자금으로 먼저 완납해 ‘완납증명서’ 확보 후 접수</td></tr>
          <tr><td><strong>2. 최근 3개월 현금서비스 · 카드 리볼빙</strong></td><td>금액이 적어도 초단기 유동성 위기 차주로 분류되어 한도 대폭 삭감</td><td>전액 상환 및 리볼빙 해지 후 신용정보원 반영(약 5영업일) 뒤 신청</td></tr>
          <tr><td><strong>3. 카드론 · 저축은행 선실행 후 보증 신청</strong></td><td>제2금융 고금리 차입으로 개인신용점수 급락 및 다중채무 필터 작동</td><td>순서 엄수(보증서 → 직접대출 → 시중은행), 기보유 시 4.5% 대환 선행</td></tr>
          <tr><td><strong>4. 무상임대차 · 전대차 동의서 누락</strong></td><td>실제 사업 영위 공간의 권리 안정성 미흡으로 현장 실사 반려</td><td>적정 차임 정식 임대차계약(확정일자) 또는 임대인 전대동의서 구비</td></tr>
          <tr><td><strong>5. 시설자금 · 보조금 ‘선결제’ 후 청구</strong></td><td>기지급 공사대금·중고 직거래는 정책 시설자금 집행 대상에서 원천 제외</td><td>반드시 비교견적서로 보증·공고 승인 먼저 받은 뒤 세금계산서 정식 집행</td></tr>
          <tr><td><strong>6. 결산 재무제표상 과다 인출 · 자본잠식</strong></td><td>복식부기 사업장 결산서상 순자산 마이너스 시 기업평가 등급 하락</td><td>세무대리인과 결산 전 가수금·대표자 인출 계정 정리 및 최근 부가세 소명</td></tr>
          <tr><td><strong>7. 신용점수 700점 이하 일반 창구 접수</strong></td><td>시중은행 프라임 신용 모형에 넣으면 부결 이력만 누적</td><td>처음부터 소진공 취약차주 특례보증 · 사업자 햇살론 전용 트랙으로 직행</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>사업자 대출 · 한도 증액 · 브릿지 전략 심층 바이블 (8편)</h2><a href="/category/policy-funds-grants">전체 보기 →</a></div>
    <div class="a-grid">
      <a class="a-card card" href="/bible/business-loan-approval-limit-guide"><span class="a-cat">${icon('bank', 14)} 한도 2배 공식</span><h3>개인사업자 대출 한도 2배 늘리는 실전 공식: 보증서·직접대출·가맹점 결합법</h3><p>연매출 2억 사업장이 역순 실행 대신 정석 3단 결합으로 1억 2천만원을 연 3%대에 확보하는 순서와 계산법.</p></a>
      <a class="a-card card" href="/bible/bank-securities-collateral-bridge-loan"><span class="a-cat">${icon('bank', 14)} 급전·금융권 비교</span><h3>사업자 급전·확장자금 금리 비교: 시중은행 · 인터넷은행 · 증권사 담보 · 카드론</h3><p>45일 단기 브릿지 사용 시 중도상환수수료까지 합산한 실질 비용과 증권 예탁담보 안전 활용 수칙.</p></a>
      <a class="a-card card" href="/bible/credit-score-dsr-business-loan-rejection"><span class="a-cat">${icon('shield', 14)} 부결 방어·복구</span><h3>매출은 높은데 사업자 대출이 거절되는 7가지 이유와 신용점수 700점대 통과 전략</h3><p>억울한 세금 분납 탈락을 막고 접수 30일 전 신용점수를 40~80점 복구하는 실전 프로토콜.</p></a>
      <a class="a-card card" href="/bible/early-settlement-factoring-apr-trap"><span class="a-cat">${icon('alert', 14)} 선정산 함정 탈출</span><h3>셀러·배달 선정산 수수료 ‘하루 0.04%’의 진실: 연환산 금리 14.6% 계산과 탈출 공식</h3><p>매달 빠져나가는 선정산 수수료를 연 3~5%대 보증 운전자금·마이너스통장으로 전환해 연 450만원 아끼는 법.</p></a>
      <a class="a-card card" href="/bible/regional-credit-guarantee-loan"><span class="a-cat">${icon('bank', 14)} 특례보증 정석</span><h3>지역신용보증재단 특례보증: 보증료·이차보전 넣은 실질 금리 계산법</h3><p>은행 금리에 보증료를 더하고 지자체 이차보전을 뺀 진짜 금융비용과 만기 연장 대비책.</p></a>
      <a class="a-card card" href="/bible/refinance-loan-4-5-percent"><span class="a-cat">${icon('trendUp', 14)} 금리 갈아타기</span><h3>소상공인 저금리 대환대출 연 4.5%: 고금리 사업자대출 이자 절감 계산</h3><p>연 7% 이상 고금리 사업자대출을 최대 5,000만원까지 연 4.5% 고정금리로 대환할 때의 절감 효과.</p></a>
    </div>
  </section>

  <section class="sec">
    <div class="card" id="funding-doc-chk">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
        <h2 class="card-h" style="margin:0">보증재단 · 소진공 · 시중은행 방문 전 필수 서류 9종 원클릭 준비표</h2>
        <span class="pill tnum" id="fd-chk-badge">준비 완료 0 / 9</span>
      </div>
      <p class="note" style="margin:6px 0 12px">모든 공공 증명서는 접수일 기준 <strong>최근 1개월 이내 발급분(주민등록번호 뒷자리 공개 설정)</strong>이어야 반려되지 않습니다. 방문 전 미리 체크해 두세요.</p>
      <ul class="detail-chk">
        <li><label><input type="checkbox"><span><strong>사업자등록증명원</strong><span class="detail-sub">발급처: 홈택스 / 정부24 · 단순 사본이 아닌 최근 1개월 내 발급된 ‘증명원’ 지참 권장</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>국세 납세증명서 + 지방세 납세증명서 (완납증명)</strong><span class="detail-sub">발급처: 홈택스(국세) / 정부24·위택스(지방세) · 체납액이 단 1만원이라도 있으면 심사 자동 거절</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>부가가치세 과세표준증명원 (최근 1~3개년)</strong><span class="detail-sub">발급처: 홈택스 · 면세사업자는 ‘면세사업자 수입금액증명원’으로 대체</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>소득금액증명원 (종합소득세 신고자용)</strong><span class="detail-sub">발급처: 홈택스 · 5월 종소세 신고 확정분 반영 시점(통상 7월 이후) 확인</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>사업장 및 거주지 임대차계약서 사본 (확정일자부)</strong><span class="detail-sub">자가 소유 사업장인 경우 인터넷등기소 부동산 등기사항전부증명서로 대체</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>상시근로자 확인 서류 (4대사회보험 사업장 가입자명부)</strong><span class="detail-sub">발급처: 4대사회보험 정보연계센터(4insure.or.kr) · 무직원이면 ‘가입내역 없음’ 확인서 발급</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>금융거래확인서 (기존 고금리 대출 4.5% 대환 신청 시)</strong><span class="detail-sub">발급처: 기존 대출 금융사 앱/창구 · 대출 취급일, 현재 적용 금리(연 7% 이상), 잔액 명시 필수</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>주민등록등본 · 초본(과거 주소 변동 포함) 및 신분증</strong><span class="detail-sub">발급처: 정부24 · 보증재단 현장 실사 및 대표자 본인 대조용</span></span></label></li>
        <li><label><input type="checkbox"><span><strong>시설자금·스마트상점 신청 시: 비교견적서 · 도면 · 사업계획서</strong><span class="detail-sub">주의: 반드시 선정·보증 승인 이후에 계약을 진행해야 하며 기지급 공사대금은 시설자금 제외</span></span></label></li>
      </ul>
    </div>
  </section>

  <section class="sec prose">
    <h2>같은 매출인데 왜 옆 가게 사장님은 한도가 5,000만원 더 나올까? (한도 증액 5원칙)</h2>
    <ol>
      <li><strong>신용조회 순서의 법칙:</strong> 제2금융권·카드론 한도 조회부터 누르면 보증재단 심사 등급이 떨어집니다. 무조건 지역신보·소진공 → 시중은행 → 후순위 순서로만 움직이세요.</li>
      <li><strong>보증서(대리대출)와 직접대출의 분리 활용:</strong> 지역신보 보증 한도가 찼더라도 스마트기술 도입·제조·수출 요건을 갖추면 소진공·중진공 직접대출 트랙이 별도로 열릴 수 있습니다.</li>
      <li><strong>카드매출 입금계좌 단일화:</strong> 배달앱 정산계좌와 오프라인 카드 가맹점 입금계좌를 주거래 은행 한 곳으로 최소 3~6개월 이상 모으면 사업자 우대금리와 마이너스 한도가 크게 올라갑니다.</li>
      <li><strong>부가세 과세표준 확정 직후 신청:</strong> 매출이 성장 중인 사업장은 1월·7월 부가가치세 확정신고 직후 과세표준증명원이 갱신될 때 한도 재산정을 요청하는 것이 가장 유리합니다.</li>
      <li><strong>사업자용 vs 가계용 부채 분리:</strong> 개인 신용대출(가계자금)로 사업장 인테리어를 치르면 DSR 규제에 막히고 이자 비용처리도 까다롭습니다. 처음부터 사업자 시설·운전자금 계정으로 일으키세요.</li>
    </ol>
  </section>

  <section class="sec">
    <div class="card pro-gate">
      <span class="pill">전문가 자금 설계 연계</span>
      <h2 style="margin:10px 0 8px;font-size:22px">사업 확장 · 대환 · 한도 설계 1:1 사전 검토 요청</h2>
      <p style="margin:0 0 16px;color:var(--text-2);font-size:15px">복잡한 정책자금 공고 매칭이나 담보·보증 결합 한도 설계가 필요하신 대표님께서는 현재 상황과 필요 자금 규모를 남겨 주세요. 연구소 자금 자문 파트너십을 통해 적합한 조달 루트 검토 의견을 회신드립니다. (불법 중개수수료를 요구하지 않습니다.)</p>
      <form id="funding-consult-form" class="contact-form" novalidate>
        <div class="kpi-grid" style="background:none">
          <div class="field" style="background:none;padding:0;border:0">
            <label for="fc-email">회신받을 이메일 또는 연락처</label>
            <input type="email" id="fc-email" required placeholder="ceo@example.com" class="admin-input">
          </div>
          <div class="field" style="background:none;padding:0;border:0">
            <label for="fc-amt">필요 자금 규모 · 희망 시기</label>
            <input type="text" id="fc-amt" placeholder="예: 매장 확장자금 1억원 / 2개월 내" class="admin-input">
          </div>
        </div>
        <div class="field" style="border:0">
          <label for="fc-msg">업종 · 연매출 · 보유 담보 및 궁금하신 사항</label>
          <textarea id="fc-msg" rows="3" required placeholder="예: 경기권 외식업 3년차, 연매출 3억, 기존 대출 4천만원(8.5%) 대환 및 추가 운전자금 문의" class="contact-ta"></textarea>
        </div>
        <input type="text" id="fc-hp" style="display:none" tabindex="-1" autocomplete="off">
        <button type="submit" class="btn btn-primary" id="fc-btn">자금 설계 검토 요청하기</button>
        <span class="toast" id="fc-toast" role="status" aria-live="polite"></span>
      </form>
    </div>
  </section>

  ${faqHtml(faq)}
</div>
<script>
(function(){
  var rgAmt=document.getElementById('rg-amt'), rgTerm=document.getElementById('rg-term'), rgBody=document.getElementById('rg-tbody');
  var CHANNELS=[
    {name:'1순위 · 지자체 이차보전 + 지역신보 보증', rate:2.8, prepay:0, tag:'최저금리 권장'},
    {name:'2순위 · 소진공 · 중진공 정책자금', rate:3.5, prepay:0, tag:'한도 분리 유리'},
    {name:'3순위 · 제1금융권 부동산 담보대출', rate:4.6, prepay:0.9, tag:'장기 확장 적합'},
    {name:'4순위 · 증권사 예탁증권 담보 브릿지', rate:6.2, prepay:0, tag:'당일·단기 급전 최적'},
    {name:'5순위 · 제1금융·인터넷은행 마이너스통장', rate:6.5, prepay:0, tag:'수시 입출금 편리'},
    {name:'주의 · 제2금융 신용·카드론·유료선정산', rate:14.2, prepay:0, tag:'신용하락 주의'}
  ];
  function fmtWon(v){return Math.round(v).toLocaleString('ko-KR')+'원';}
  function renderGap(){
    if(!rgAmt||!rgBody)return;
    var man=parseFloat(rgAmt.value)||8000;
    var P=man*10000;
    var yrs=3;
    rgTerm.querySelectorAll('input').forEach(function(i){if(i.checked)yrs=parseFloat(i.value);});
    document.getElementById('rg-amt-lbl').textContent=man.toLocaleString('ko-KR')+'만원';
    var worstTotal=P*(0.142*yrs);
    var bestTotal=P*(0.028*yrs);
    var maxSave=Math.max(0, worstTotal-bestTotal);
    document.getElementById('rg-save-headline').textContent='고금리 대비 최대 '+fmtWon(maxSave)+' 절약';
    rgBody.innerHTML=CHANNELS.map(function(c,idx){
      var interest=P*(c.rate/100)*yrs;
      var prepayFee=(yrs<3&&c.prepay>0)?P*(c.prepay/100)*((3-yrs)/3):0;
      var tot=interest+prepayFee;
      var mAvg=P*(c.rate/100)/12;
      var saved=worstTotal-tot;
      var isLast=idx===CHANNELS.length-1;
      return '<tr><td><strong>'+c.name+'</strong><span class="detail-sub">'+c.tag+'</span></td>'
        +'<td><strong>연 '+c.rate.toFixed(1)+'%</strong></td>'
        +'<td>'+(prepayFee>0?fmtWon(prepayFee)+' (조기상환)':'0원 (면제)')+'</td>'
        +'<td>'+fmtWon(mAvg)+'</td>'
        +'<td><strong style="color:'+(isLast?'var(--bad)':'var(--text)')+'">'+fmtWon(tot)+'</strong></td>'
        +'<td style="font-weight:800;color:'+(isLast?'var(--text-3)':(saved>=0?'var(--good)':'var(--bad)'))+'">'+(isLast?'비교 기준':(saved>=0?'−'+fmtWon(saved)+' 절감':'+'+fmtWon(Math.abs(saved))))+'</td></tr>';
    }).join('');
  }
  if(rgAmt){rgAmt.addEventListener('input',renderGap);rgTerm.addEventListener('change',renderGap);renderGap();}

  var dc=document.getElementById('funding-doc-chk');
  if(dc){
    dc.addEventListener('change',function(){
      var t=dc.querySelectorAll('input[type="checkbox"]').length;
      var d=dc.querySelectorAll('input[type="checkbox"]:checked').length;
      var b=document.getElementById('fd-chk-badge');
      if(b)b.textContent='준비 완료 '+d+' / '+t;
    });
  }
  var f=document.getElementById('funding-consult-form');
  if(!f)return;
  var btn=document.getElementById('fc-btn'), st=document.getElementById('fc-toast');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    btn.disabled=true; st.textContent='접수 중...';
    var amt=document.getElementById('fc-amt').value;
    var msg='[희망규모: '+amt+'] '+document.getElementById('fc-msg').value;
    fetch('/api/biz/contact',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({category:'funding-consult',email:document.getElementById('fc-email').value,page_url:window.location.href,website:document.getElementById('fc-hp').value,message:msg})
    }).then(function(r){return r.json();}).then(function(d){
      btn.disabled=false;
      if(d&&d.ok){st.textContent='정상 접수되었습니다. 검토 후 이메일로 안내드리겠습니다.';f.reset();}
      else{st.textContent=d&&d.error?d.error:'이메일 형식과 내용을(10자 이상) 확인해 주세요.';}
    }).catch(function(){btn.disabled=false;st.textContent='일시적인 통신 오류가 발생했습니다.';});
  });
})();
</script>`;

  return { body, jsonld: [breadcrumbLd(crumbs), faqLd(faq)] };
}

module.exports = { fundingView };
