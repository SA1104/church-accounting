'use strict';
const { esc, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE, freeOpenBanner } = require('./layout');
const { icon } = require('./icons');

function requestsView(items) {
  const list = Array.isArray(items) ? items : [];
  const crumbs = [{ name: '홈', path: '/' }, { name: '필요한 계산기 신청 · 투표', path: '/requests' }];

  const faq = [
    { q: '신청한 계산기는 실제로 만들어지나요?', a: '네, 공감 투표 수가 빠르게 모이거나 현장에서 꼭 필요한데 아직 시중에 제대로 된 계산 도구가 없는 주제부터 매주 우선순위를 정해 차례대로 제작·반영하고 있습니다.' },
    { q: '이메일을 꼭 적어야 신청할 수 있나요?', a: '아닙니다. 이메일 칸을 비워 두셔도 계산기 아이디어 신청과 공감 투표 모두 제한 없이 가능합니다. 다만 완성되었을 때 가장 먼저 무료 이용 링크를 받아보고 싶으신 분만 이메일을 남겨 주시면 됩니다.' },
    { q: '기존 계산기에 내 업종을 추가해 달라고 요청해도 되나요?', a: '물론입니다. 현재 30개 창업 업종 외에 무인 사진관, 꽃집, 세차장, 애견유치원, 스마트팜, 해외구매대행 등 추가를 원하시는 세부 업종과 현장 원가 특징을 적어 주시면 업종 기준표에 빠르게 반영해 드립니다.' },
    { q: '공감 투표는 몇 개까지 누를 수 있나요?', a: '필요하다고 생각하시는 항목 여러 개에 각각 공감하실 수 있으며, 공정한 순위 집계를 위해 같은 항목에는 하루 한 번만 반영됩니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('sliders', 16)} 사장님의 현장 고민이 다음 계산기가 됩니다</span>
    <h1>필요한 계산기 신청 · 우선 제작 투표</h1>
    <p class="lead">장사를 준비하거나 운영하면서 “이런 숫자를 한 번에 계산해 주는 곳이 있으면 얼마나 좋을까?” 하고 답답했던 순간이 있으셨나요? 가장 필요한 항목에 공감 버튼을 눌러주시거나 원하는 계산기를 직접 알려주시면 가장 먼저 만들어 반영하겠습니다.</p>
    ${freeOpenBanner('calc')}
  </header>

  <section class="sec" aria-labelledby="vote-h">
    <div class="sec-head">
      <h2 id="vote-h">다음으로 어떤 계산기를 가장 먼저 열어드릴까요? (공감순 실시간 집계)</h2>
      <a href="#req-form-sec">찾는 항목이 없다면 직접 신청하기 ↓</a>
    </div>
    <p class="sec-desc">많은 사장님이 공감해 주신 순서대로 먼저 제작해 공개합니다. 필요한 항목의 버튼을 눌러 순위를 올려주세요.</p>

    <div class="req-grid" id="vote-list">
      ${list.map((it, idx) => `
      <article class="card req-card" data-req-card="${esc(it.slug)}">
        <div class="req-card-top">
          <span class="pill">${idx + 1}위 · ${esc(it.category_label)}</span>
          ${it.status === 'building' ? '<span class="fit">우선 제작 진행 중</span>' : '<span style="font-size:12px;color:var(--text-3);font-weight:700">공감 모으는 중</span>'}
        </div>
        <h3>${esc(it.title)}</h3>
        <p>${esc(it.desc_text)}</p>
        <div class="req-card-foot">
          <button type="button" class="btn btn-vote" data-vote-btn="${esc(it.slug)}">
            <span>나도 이 계산기 필요해요</span>
            <strong class="tnum" data-vote-cnt="${esc(it.slug)}">+${Number(it.votes || 0).toLocaleString('ko-KR')}</strong>
          </button>
        </div>
      </article>`).join('')}
    </div>
  </section>

  <section class="sec" id="req-form-sec">
    <div class="card pro-gate">
      <span class="pill">원하는 계산기 · 세부 업종 직접 신청</span>
      <h2 style="margin:10px 0 8px;font-size:22px">내 가게 · 내 업종에 꼭 필요한 계산기를 알려주세요</h2>
      <p style="margin:0 0 16px;color:var(--text-2);font-size:15px">위에 없는 새로운 계산기 주제나, 창업 풀코스에 추가되었으면 하는 내 세부 업종이 있다면 편하게 적어 주세요. 현장의 디테일을 꼼꼼히 연구해 계산기로 만들어 드립니다.</p>
      <form id="tool-req-form" class="contact-form" novalidate>
        <div class="kpi-grid" style="background:none">
          <div class="field" style="background:none;padding:0;border:0">
            <label for="tr-ind">준비 중이거나 운영 중인 업종</label>
            <input type="text" id="tr-ind" placeholder="예: 무인 사진관, 꽃집, 구매대행, 고깃집, 학원 등" class="admin-input">
          </div>
          <div class="field" style="background:none;padding:0;border:0">
            <label for="tr-email">완성 시 가장 먼저 알림 받을 이메일 <span class="hint">(선택사항)</span></label>
            <input type="email" id="tr-email" placeholder="비워두셔도 정상 접수됩니다" class="admin-input">
          </div>
        </div>
        <div class="field" style="border:0">
          <label for="tr-title">원하시는 계산기 한 줄 제목 <span class="hint">(필수)</span></label>
          <input type="text" id="tr-title" required placeholder="예: 디자이너 인센티브 비율별 미용실 순수익 계산기" class="admin-input">
        </div>
        <div class="field" style="border:0">
          <label for="tr-detail">어떤 숫자들을 넣어서 무엇을 계산해 보고 싶으신가요? <span class="hint">(필수 · 10자 이상)</span></label>
          <textarea id="tr-detail" rows="4" required placeholder="예: 매출 구간별로 디자이너 프로테이지(40~50%)와 약제비 공제 방식이 다른데, 원장한테 실제로 얼마 남는지 비교해 보고 싶습니다." class="contact-ta"></textarea>
        </div>
        <input type="text" id="tr-hp" style="display:none" tabindex="-1" autocomplete="off">
        <button type="submit" class="btn btn-primary btn-lg" id="tr-btn">계산기 제작 신청하기</button>
        <span class="toast" id="tr-toast" role="status" aria-live="polite"></span>
      </form>
    </div>
  </section>

  ${faqHtml(faq)}
</div>
<script>
(function(){
  var VOTED_KEY = 'bt-voted-tools-v1';
  var voted = {};
  try { voted = JSON.parse(localStorage.getItem(VOTED_KEY) || '{}') || {}; } catch(e){ voted = {}; }

  function markVotedBtn(btn, cnt) {
    btn.classList.add('voted');
    var span = btn.querySelector('span');
    var strong = btn.querySelector('strong');
    if (span) span.textContent = '공감 완료';
    if (strong && cnt != null) strong.textContent = Number(cnt).toLocaleString('ko-KR') + '명';
  }

  document.querySelectorAll('[data-vote-btn]').forEach(function(btn){
    var slug = btn.getAttribute('data-vote-btn');
    if (voted[slug]) {
      var cur = btn.querySelector('strong');
      markVotedBtn(btn, cur ? parseInt(cur.textContent.replace(/[^0-9]/g, ''), 10) : null);
    }
    btn.addEventListener('click', function(){
      if (btn.disabled) return;
      btn.disabled = true;
      fetch('/api/biz/tool-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug })
      }).then(function(r){ return r.json(); }).then(function(d){
        btn.disabled = false;
        if (d && d.ok) {
          voted[slug] = 1;
          try { localStorage.setItem(VOTED_KEY, JSON.stringify(voted)); } catch(e){}
          markVotedBtn(btn, d.votes);
          if (window.BTTrack) window.BTTrack('tool_vote', { tool_slug: slug });
        }
      }).catch(function(){ btn.disabled = false; });
    });
  });

  var f = document.getElementById('tool-req-form');
  if (f) {
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var btn = document.getElementById('tr-btn'), st = document.getElementById('tr-toast');
      btn.disabled = true;
      st.textContent = '접수 중...';
      fetch('/api/biz/tool-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: document.getElementById('tr-ind').value,
          email: document.getElementById('tr-email').value,
          title: document.getElementById('tr-title').value,
          detail: document.getElementById('tr-detail').value,
          website: document.getElementById('tr-hp').value
        })
      }).then(function(r){ return r.json(); }).then(function(d){
        btn.disabled = false;
        if (d && d.ok) {
          st.textContent = '소중한 의견 감사합니다! 연구소에서 검토 후 우선 제작 목록에 반영하겠습니다.';
          f.reset();
        } else {
          st.textContent = (d && d.error) ? d.error : '제목과 자세한 설명(10자 이상)을 입력해 주세요.';
        }
      }).catch(function(){
        btn.disabled = false;
        st.textContent = '일시적인 통신 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      });
    });
  }
})();
</script>`;

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: '필요한 계산기 신청 · 우선 제작 투표',
      url: abs('/requests'),
      inLanguage: 'ko-KR',
      description: '예비창업자와 사장님이 현장에서 꼭 필요로 하는 다음 손익·세무·자금 계산기를 직접 투표하고 신청하는 공간입니다.',
      isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url }
    },
    breadcrumbLd(crumbs),
    faqLd(faq)
  ];

  return { body, jsonld };
}

module.exports = { requestsView };
