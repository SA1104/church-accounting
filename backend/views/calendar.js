'use strict';
const { MONTHLY_SURVIVAL_CALENDAR, getCurrentAndNextMonth } = require('../data/calendar-events');
const { esc, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd } = require('./layout');
const { icon } = require('./icons');
const facts = require('../data/facts');

function calendarView() {
  const { current, next } = getCurrentAndNextMonth();
  const crumbs = [{ name: '홈', path: '/' }, { name: '사업자 12개월 세무·자금 생존 캘린더', path: '/calendar' }];

  const faq = [
    { q: '매달 10일에 반복되는 원천세와 4대보험은 모든 사장님에게 해당되나요?', a: '직원과 아르바이트생(3.3% 사업소득 프리랜서·일용직 포함)에게 급여를 지급하는 모든 사업장은 지급월 다음 달 10일까지 원천징수이행상황신고서를 제출하고 원천세 및 4대보험료를 납부해야 합니다. 직원이 없는 1인 사장님은 지역가입자 건보료·연금만 납부합니다.' },
    { q: '정책자금은 왜 12월 말~2월 초에 가장 신경 써야 하나요?', a: '소상공인시장진흥공단, 중소벤처기업진흥공단, 각 지자체 신용보증재단의 연간 신규 예산이 1~2월 상반기 1차 공고에 가장 큰 폭으로 배정되기 때문입니다. 12월 말에 국세·지방세 체납이 없는 완납 상태를 만들어 두어야 오픈 즉시 접수가 가능합니다.' },
    { q: '부가세 예정고지서(4월·10월)와 종소세 중간예납 고지서(11월)는 매출이 줄어도 무조건 그대로 내야 하나요?', a: '아닙니다. 직전 기간 대비 사업 실적이 크게 악화되어 법정 기준(부가세 1/3 이하, 종소세 중간예납 30% 미달 등)에 해당하면 고지납부 대신 직접 추계·예정신고를 선택하여 당장 유출되는 현금을 합법적으로 줄일 수 있습니다.' },
    { q: '노란우산공제는 5월 종소세 신고 때 가입해도 그해 세금에서 공제되나요?', a: '안 됩니다. 5월에 신고하는 종합소득세는 직전 과세연도(1월 1일~12월 31일)에 실제로 납입한 부금에 대해서만 소득공제를 해줍니다. 따라서 반드시 12월 31일 이전에 가입 및 납입(분기 선납 활용 가능)을 마쳐야 당해 귀속 절세 혜택을 받습니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('clock', 16)} 가산세 방지 · 정책자금 선점 · 현금흐름 방어</span>
    <h1>사업자 12개월 세무 · 노무 · 정책자금 생존 캘린더</h1>
    <p class="lead">장사를 잘해 놓고도 신고 기한 하루를 넘겨 가산세를 물거나, 정책자금 오픈 시기를 놓쳐 연 8% 고금리를 쓰는 일이 없도록 1년 열두 달 사장님이 반드시 챙겨야 할 핵심 데드라인과 숨은 함정을 한눈에 정리했습니다.</p>
    <p class="footnote-meta">※ 국세청 세무일정 · 고용노동부 고시 일정 · 중소벤처기업부 연간 공고 주기 기준 (검증일 ${facts.VERIFIED_AT})</p>
  </header>

  <section class="sec">
    <div class="card killer" style="padding:24px">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">
        <span class="pill">이달의 집중 점검 (${current.month}월)</span>
        <span style="font-size:13px;color:var(--text-3)">다음 달(${next.month}월) 예고: ${esc(next.tag)}</span>
      </div>
      <h2 style="margin:0 0 8px;font-size:21px">${current.month}월 핵심: ${esc(current.headline)}</h2>
      <p style="margin:0 0 14px;color:var(--text-2);font-size:14.5px">${esc(current.hiddenTrap)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        <a class="btn btn-primary" href="${esc(current.actionHref)}">${esc(current.actionLabel)} →</a>
        <a class="btn" href="#m-${next.month}">${next.month}월 사전 대비 항목 보기</a>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>1월 ~ 12월 월별 필수 데드라인 & 실전 대처법</h2></div>
    <div class="cal-grid">
      ${MONTHLY_SURVIVAL_CALENDAR.map((m) => `
      <article class="card cal-card${m.month === current.month ? ' cal-cur' : ''}" id="m-${m.month}">
        <div class="cal-head">
          <span class="cal-m tnum">${m.month}월</span>
          <span class="pill">${esc(m.tag)}</span>
        </div>
        <h3>${esc(m.headline)}</h3>
        <ul class="cal-list">
          ${m.deadlines.map((d) => `<li>${esc(d)}</li>`).join('')}
        </ul>
        <div class="cal-trap">
          <strong>현장 주의 포인트:</strong> ${esc(m.hiddenTrap)}
        </div>
        <a class="cc-cta" href="${esc(m.actionHref)}" style="margin-top:auto;padding-top:10px">${esc(m.actionLabel)} →</a>
      </article>`).join('')}
    </div>
  </section>

  ${faqHtml(faq)}
  <aside class="trust-box"><h2>세무 · 노무 · 공고 일정 안내 및 면책 고지</h2><p>본 캘린더는 국세청 세무일정, 고용노동부 최저임금 고시 주기, 중소벤처기업부·소상공인시장진흥공단 정례 공고 일정을 기준으로 정리한 일반 안내 자료입니다(검증일 <strong>${facts.VERIFIED_AT}</strong>). 법정 공휴일 여부에 따라 실제 신고 마감일이 익영업일로 순연되거나 지원사업 예산 소진 시 조기 마감될 수 있으므로, 신고·신청 전 반드시 홈택스 및 해당 기관 최신 공고문을 확인하시기 바랍니다. (<a href="/terms-of-service">이용약관</a> · <a href="/privacy-policy">개인정보처리방침</a>)</p></aside>
</div>`;

  return { body, jsonld: [breadcrumbLd(crumbs), faqLd(faq)] };
}

module.exports = { calendarView };
