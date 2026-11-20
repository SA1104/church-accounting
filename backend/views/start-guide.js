'use strict';
const { PERSONAS, TIMELINE_STAGES, COMIC_EPISODES } = require('../data/start-timeline');
const { esc, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const { icon } = require('./icons');
const facts = require('../data/facts');

function comicCharacterSvg(mood) {
  if (mood === 'excited') {
    return `<svg viewBox="0 0 120 84" class="cm-ill" aria-hidden="true">
      <rect x="6" y="8" width="108" height="68" rx="10" fill="#eef5ff" stroke="#1b64da" stroke-width="2"/>
      <circle cx="38" cy="42" r="16" fill="#fff" stroke="#191f28" stroke-width="2.2"/>
      <path d="M31 39q3-4 6 0M41 39q3-4 6 0" stroke="#191f28" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M32 47q6 6 12 0" stroke="#1b64da" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M22 68c3-9 29-9 32 0" fill="#3182f6" stroke="#191f28" stroke-width="2"/>
      <rect x="68" y="22" width="34" height="42" rx="4" fill="#fff" stroke="#191f28" stroke-width="2"/>
      <path d="M74 32h22M74 40h18M74 48h22" stroke="#3182f6" stroke-width="2" stroke-linecap="round"/>
      <circle cx="96" cy="54" r="5" fill="#e5484d"/>
    </svg>`;
  }
  if (mood === 'shock') {
    return `<svg viewBox="0 0 120 84" class="cm-ill" aria-hidden="true">
      <rect x="6" y="8" width="108" height="68" rx="10" fill="#fff7ed" stroke="#d97706" stroke-width="2"/>
      <path d="M18 18l8 6M102 18l-8 6M60 12v8" stroke="#d97706" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="40" cy="44" r="16" fill="#fff" stroke="#191f28" stroke-width="2.2"/>
      <circle cx="35" cy="41" r="2.2" fill="#191f28"/><circle cx="45" cy="41" r="2.2" fill="#191f28"/>
      <ellipse cx="40" cy="50" rx="4.5" ry="5.5" fill="none" stroke="#dc2626" stroke-width="2.2"/>
      <rect x="68" y="22" width="36" height="42" rx="4" fill="#fff" stroke="#dc2626" stroke-width="2"/>
      <path d="M75 33h22M75 41h16" stroke="#191f28" stroke-width="2"/>
      <path d="M82 49l8 8M90 49l-8 8" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`;
  }
  if (mood === 'panic') {
    return `<svg viewBox="0 0 120 84" class="cm-ill" aria-hidden="true">
      <rect x="6" y="8" width="108" height="68" rx="10" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
      <circle cx="40" cy="45" r="16" fill="#fff" stroke="#191f28" stroke-width="2.2"/>
      <path d="M32 39l6 4-6 3M48 39l-6 4 6 3" stroke="#191f28" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M33 52q7-5 14 0" stroke="#dc2626" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M58 30q3 6 0 10q-3-4 0-10z" fill="#3182f6"/>
      <polyline points="68,28 80,38 88,34 102,56" fill="none" stroke="#dc2626" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="94,56 102,56 102,48" fill="none" stroke="#dc2626" stroke-width="2.6" stroke-linecap="round"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 120 84" class="cm-ill" aria-hidden="true">
    <rect x="6" y="8" width="108" height="68" rx="10" fill="#ecfdf5" stroke="#0e9f6e" stroke-width="2"/>
    <circle cx="38" cy="43" r="16" fill="#fff" stroke="#191f28" stroke-width="2.2"/>
    <circle cx="33" cy="40" r="2" fill="#191f28"/><circle cx="43" cy="40" r="2" fill="#191f28"/>
    <path d="M32 48q6 5 12 0" stroke="#0e9f6e" stroke-width="2.3" fill="none" stroke-linecap="round"/>
    <path d="M84 20l16 7v13c0 11-7 18-16 22-9-4-16-11-16-22V27l16-7z" fill="#fff" stroke="#0e9f6e" stroke-width="2.2"/>
    <polyline points="77,40 82,45 92,34" fill="none" stroke="#0e9f6e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function renderComicEpisode(ep) {
  return `<div class="comic-board" data-ep-panel="${esc(ep.id)}">
    <div class="comic-top">
      <div>
        <span class="pill">${esc(ep.badge || ep.tag)}</span>
        <h3 style="margin:6px 0 4px;font-size:20px">${esc(ep.title)}</h3>
        <p style="margin:0;font-size:14px;color:var(--text-2)">${esc(ep.hook)}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" data-download-comic="${esc(ep.id)}">${icon('receipt', 16)} 이미지로 저장 · 공유하기</button>
        <a class="btn btn-primary" href="${esc(ep.ctaHref)}">${esc(ep.ctaLabel)} →</a>
      </div>
    </div>
    <div class="comic-grid">
      ${ep.panels.map((pn) => `
      <div class="comic-cell comic-${esc(pn.mood)}">
        <div class="comic-cell-head">
          <span class="comic-num">${esc(pn.num)}</span>
          <strong>${esc(pn.sceneTitle)}</strong>
        </div>
        ${comicCharacterSvg(pn.mood)}
        <div class="comic-bubble">
          <span class="comic-spk">${esc(pn.speaker)}</span>
          <p>${esc(pn.line)}</p>
        </div>
        <p class="comic-cap">${esc(pn.caption)}</p>
      </div>`).join('')}
    </div>
  </div>`;
}

function startGuideView(q) {
  const totalItems = TIMELINE_STAGES.reduce((acc, st) => acc + st.items.length, 0);
  const selPersonaId = PERSONAS.some((p) => p.id === q.persona) ? q.persona : PERSONAS[0].id;
  const crumbs = [{ name: '홈', path: '/' }, { name: '첫 창업 1년 할 일 순서표', path: '/start-guide' }];

  const faq = [
    { q: '상가 임대차계약이 먼저인가요, 사업자등록 신청이 먼저인가요?', a: '반드시 상가 임대차계약(정화조·용도·전기 확인 및 인허가 불가 시 계약금 반환 특약 포함)이 먼저입니다. 사업자등록 신청서에는 확정된 사업장 소재지 임대차계약서 사본(허가·신고 업종은 구청 영업신고증 포함)이 첨부되어야 세무서에서 사업자등록증이 발급되기 때문입니다. 단, 인테리어 본공사 대금 결제 전에는 일반과세 사업자등록증을 먼저 내고 사업자번호로 세금계산서를 받아야 부가세 10% 환급이 매끄럽습니다.' },
    { q: '초기 창업자는 무조건 간이과세자가 세금이 적어서 유리하지 않나요?', a: '가장 위험한 오해입니다. 간이과세자는 부가세 납부 부담이 적은 대신 매입세액이 매출세액보다 많아도 부가가치세 환급이 단 1원도 나오지 않습니다. 따라서 인테리어·간판·주방설비·초도물품에 3,000만~1억 원을 투자하는 창업 첫해에는 일반과세자로 등록해 수백만 원의 부가세를 조기환급받는 것이 훨씬 유리한 경우가 많습니다.' },
    { q: '사업용 계좌와 사업용 카드는 은행에서 발급받으면 자동으로 국세청에 연결되나요?', a: '아닙니다! 은행·카드사에서 사업자 통장과 카드를 발급받았더라도 대표자가 직접 국세청 홈택스(전자세금계산서·현금영수증·신용카드 메뉴)에 접속해 사업용 계좌 신고 및 사업용 신용카드 등록을 별도로 완료해야 부가세·종소세 경비 집계에 자동 반영됩니다.' },
    { q: '전기요금이나 휴대폰·인터넷 요금도 부가가치세 환급이 되나요?', a: '네, 일반과세 사업자가 한국전력(국번 없이 123), 도시가스사, 통신사 고객센터에 사업자등록증 사본을 제출해 사업자 명의 전자세금계산서 수취 등록을 해두면 매달 납부하는 요금의 부가세 10%를 평생 매입세액으로 공제받습니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('compass', 16)} 덜컥 계약하기 전에 꼭 확인하세요 · 계약 전부터 첫 세금 신고까지</span>
    <h1>계약 전부터 첫 세금 신고까지 — 개인사업자 1년 할 일 순서표</h1>
    <p class="lead">자금이 준비되었다고 서둘러 상가 계약서부터 찍으면 정화조 공사비, 인테리어 부가세 환급 누락, 가산세, 비싼 대출 이자로 시작부터 수천만 원이 샙니다. 지금 내 상황에 맞는 필수 확인 사항과 개업 두 달 전부터 첫 1년 세금 결산까지 꼭 챙겨야 할 ${totalItems}가지 순서를 하나씩 따라가 보세요.</p>
    <p class="footnote-meta">※ 국세청 홈택스 · 시군구청 인허가 · 4대사회보험 · 근로기준법 현행 실무 절차 기준 (검증일 ${facts.VERIFIED_AT})</p>
  </header>

  <section class="sec" id="personas">
    <div class="sec-head">
      <h2>지금 어떤 상황이신가요? 내 상황에 꼭 맞는 준비 순서부터 골라보세요</h2>
    </div>
    <p class="sec-desc">현재 내 상황과 가장 가까운 버튼을 누르면, 같은 고민을 하시는 분들이 가장 많이 실수하는 부분과 바로 써볼 수 있는 계산기를 모아서 보여드립니다.</p>
    <div class="persona-tabs" role="tablist" aria-label="내 현재 상황 선택">
      ${PERSONAS.map((p) => `<button type="button" class="prof-chip${p.id === selPersonaId ? ' active' : ''}" data-persona-btn="${esc(p.id)}">${esc(p.tabLabel)}</button>`).join('')}
    </div>
    ${PERSONAS.map((p) => `
    <div class="card persona-panel" data-persona-panel="${esc(p.id)}"${p.id === selPersonaId ? '' : ' hidden'}>
      <span class="pill">${esc(p.badge)}</span>
      <h3 style="margin:8px 0 6px;font-size:21px">${esc(p.title)}</h3>
      <p style="margin:0 0 14px;color:var(--text-2);font-size:14.5px">${esc(p.profile)}</p>
      <div class="callout warn" style="margin:0 0 16px">
        <strong>가장 많이 아차 하는 실수:</strong> ${esc(p.blindSpot)}
      </div>
      <div class="kpi-grid" style="align-items:start">
        <div>
          <strong style="font-size:14.5px;display:block;margin-bottom:8px">같은 상황의 사장님들이 가장 궁금해하는 질문</strong>
          <ul style="margin:0;padding-left:18px;font-size:13.5px;color:var(--text-2);display:grid;gap:6px;line-height:1.5">
            ${p.monitoredQuestions.map((mq) => `<li>${esc(mq)}</li>`).join('')}
          </ul>
        </div>
        <div class="hl">
          <strong style="font-size:14.5px;display:block;margin-bottom:8px">지금 바로 해볼 수 있는 3단계</strong>
          <div style="display:grid;gap:8px">
            ${p.mustDoNow.map((act, i) => `<a class="btn" style="justify-content:flex-start;background:var(--bg-elev)" href="${esc(act.href)}"><strong>${i + 1}.</strong> ${esc(act.label)} →</a>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('')}
  </section>

  <section class="sec" id="comics">
    <div class="sec-head">
      <h2>주변에서 흔히 겪는 세 가지 아찔한 순간</h2>
    </div>
    <p class="sec-desc">처음 시작할 때 미처 몰라서 수백만 원씩 손해 보는 실제 상황들입니다. 창업을 준비하는 가족이나 지인이 있다면 함께 살펴보세요.</p>
    <div class="prof-chips" style="margin-bottom:12px" data-comic-tabs>
      ${COMIC_EPISODES.map((ep, idx) => `<button type="button" class="prof-chip${idx === 0 ? ' active' : ''}" data-comic-tab="${esc(ep.id)}">${esc(ep.tag)}</button>`).join('')}
    </div>
    ${COMIC_EPISODES.map((ep, idx) => `<div data-comic-wrap="${esc(ep.id)}"${idx === 0 ? '' : ' hidden'}>${renderComicEpisode(ep)}</div>`).join('')}
  </section>

  <section class="sec" id="timeline">
    <div class="card killer" style="position:sticky;top:calc(var(--gnb-h) + 8px);z-index:15;padding:16px 20px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div>
          <strong style="font-size:16px">내 창업 · 세무 준비 진행표 (자동 저장)</strong>
          <span style="display:block;font-size:12.5px;color:var(--text-2)">끝낸 항목을 체크해 두면 다음에 다시 들어와도 그대로 남아 있습니다.</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="pill tnum" id="tl-prog-txt" style="font-size:13.5px">0 / ${totalItems} 완료 (0%)</span>
          <button type="button" class="btn-xs" id="tl-reset-btn">체크 초기화</button>
        </div>
      </div>
      <div class="sb-track" style="margin-top:10px;height:9px"><div class="sb-fill" id="tl-prog-bar" style="width:0%"></div></div>
    </div>

    <div class="tl-stack" id="tl-root">
      ${TIMELINE_STAGES.map((st) => `
      <article class="card tl-stage">
        <div class="tl-stage-head">
          <div>
            <span class="pill">${esc(st.step)} · ${esc(st.period)}</span>
            <h2 style="margin:8px 0 4px;font-size:21px">${esc(st.title)}</h2>
            <p style="margin:0;color:var(--text-2);font-size:14px">${esc(st.subtitle)}</p>
          </div>
          <a class="btn" href="${esc(st.toolHref)}">${esc(st.toolLabel)} →</a>
        </div>
        <ul class="detail-chk" style="margin-top:14px">
          ${st.items.map((it) => `
          <li>
            <label>
              <input type="checkbox" data-tl-id="${esc(it.id)}">
              <span>
                <strong>${esc(it.head)}</strong>
                <span class="detail-sub" style="font-size:13px;line-height:1.6;color:var(--text-2);margin-top:4px">${esc(it.detail)}</span>
              </span>
            </label>
          </li>`).join('')}
        </ul>
      </article>`).join('')}
    </div>
  </section>

  ${faqHtml(faq)}
</div>
<script>
(function(){
  var EPISODES=${JSON.stringify(COMIC_EPISODES).replace(/</g, '\\u003c')};

  // 1. 페르소나 전환 + 익명 수요 모니터링 이벤트 전송
  document.querySelectorAll('[data-persona-btn]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var pid=btn.getAttribute('data-persona-btn');
      document.querySelectorAll('[data-persona-btn]').forEach(function(b){b.classList.toggle('active',b===btn);});
      document.querySelectorAll('[data-persona-panel]').forEach(function(p){p.hidden=p.getAttribute('data-persona-panel')!==pid;});
      try{
        fetch('/api/biz/collect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'action',event:'persona_pick',persona:pid,path:'/start-guide',dwell:0,scroll:0})});
      }catch(e){}
    });
  });

  // 2. 4컷 만화 탭 전환 & 인스타/스레드 광고용 1080x1080 PNG 생성기
  document.querySelectorAll('[data-comic-tab]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var cid=btn.getAttribute('data-comic-tab');
      document.querySelectorAll('[data-comic-tab]').forEach(function(b){b.classList.toggle('active',b===btn);});
      document.querySelectorAll('[data-comic-wrap]').forEach(function(w){w.hidden=w.getAttribute('data-comic-wrap')!==cid;});
    });
  });

  function wrapLines(ctx, text, maxW) {
    var words = text.split(' ');
    var lines = [], cur = '';
    words.forEach(function(w){
      var test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function downloadComicPng(epId) {
    var ep = EPISODES.find(function(x){return x.id===epId;});
    if(!ep) return;
    var S = 1080;
    var canvas = document.createElement('canvas');
    canvas.width = S; canvas.height = S;
    var ctx = canvas.getContext('2d');
    var font = '"Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, S, S);

    // Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = '800 22px ' + font;
    ctx.fillText(ep.tag + '  |  BOOZATHINK.COM', 52, 58);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 33px ' + font;
    ctx.fillText(ep.title, 52, 104, S - 104);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px ' + font;
    ctx.fillText(ep.hook, 52, 138, S - 104);

    // 2x2 Comic Panels
    var gap = 22, px0 = 48, py0 = 166;
    var cw = (S - px0 * 2 - gap) / 2;
    var ch = 382;
    var accents = ['#2563eb', '#d97706', '#dc2626', '#059669'];
    var bgs = ['#f8fbff', '#fffbeb', '#fef2f2', '#ecfdf5'];

    ep.panels.forEach(function(pn, idx){
      var col = idx % 2, row = Math.floor(idx / 2);
      var x = px0 + col * (cw + gap), y = py0 + row * (ch + gap);
      ctx.fillStyle = bgs[idx];
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, cw, ch, 18) : ctx.rect(x, y, cw, ch);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = accents[idx];
      ctx.stroke();

      // Badge
      ctx.fillStyle = accents[idx];
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x + 20, y + 18, 66, 34, 8) : ctx.rect(x + 20, y + 18, 66, 34);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '800 19px ' + font;
      ctx.fillText(pn.num, x + 35, y + 41);

      ctx.fillStyle = '#0f172a';
      ctx.font = '800 22px ' + font;
      ctx.fillText(pn.sceneTitle, x + 98, y + 42, cw - 116);

      // Speech Bubble
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x + 20, y + 70, cw - 40, 210, 14) : ctx.rect(x + 20, y + 70, cw - 40, 210);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.fillStyle = accents[idx];
      ctx.font = '800 18px ' + font;
      ctx.fillText(pn.speaker, x + 36, y + 102);

      ctx.fillStyle = '#1e293b';
      ctx.font = '700 21px ' + font;
      var lines = wrapLines(ctx, pn.line, cw - 76);
      lines.slice(0, 5).forEach(function(ln, li){
        ctx.fillText(ln, x + 36, y + 138 + li * 30);
      });

      // Bottom caption
      ctx.fillStyle = '#475569';
      ctx.font = '600 17px ' + font;
      var capLines = wrapLines(ctx, pn.caption, cw - 44);
      capLines.slice(0, 2).forEach(function(cl, ci){
        ctx.fillText(cl, x + 22, y + 314 + ci * 24);
      });
    });

    // Footer CTA Bar
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, S - 78, S, 78);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 22px ' + font;
    ctx.fillText('창업·세무·정책자금 무료 실전 시뮬레이터  →  https://boozathink.com', 52, S - 31);

    canvas.toBlob(function(blob){
      if(!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'boozathink-story-' + ep.id + '.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);}, 500);
    }, 'image/png');
  }

  document.querySelectorAll('[data-download-comic]').forEach(function(btn){
    btn.addEventListener('click',function(){
      downloadComicPng(btn.getAttribute('data-download-comic'));
    });
  });

  // 3. 체크리스트 localStorage 영구 저장 & 진행률 바
  var KEY = 'bt-timeline-v1';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ saved = {}; }
  var boxes = document.querySelectorAll('[data-tl-id]');
  var progTxt = document.getElementById('tl-prog-txt');
  var progBar = document.getElementById('tl-prog-bar');

  function syncProgress() {
    var done = 0;
    boxes.forEach(function(cb){ if(cb.checked) done++; });
    var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    if(progTxt) progTxt.textContent = done + ' / ' + boxes.length + ' 완료 (' + pct + '%)';
    if(progBar) progBar.style.width = pct + '%';
  }

  boxes.forEach(function(cb){
    var id = cb.getAttribute('data-tl-id');
    if(saved[id]) cb.checked = true;
    cb.addEventListener('change', function(){
      saved[id] = cb.checked ? 1 : 0;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch(e){}
      syncProgress();
    });
  });
  syncProgress();

  var rst = document.getElementById('tl-reset-btn');
  if(rst) rst.addEventListener('click', function(){
    saved = {};
    try { localStorage.removeItem(KEY); } catch(e){}
    boxes.forEach(function(cb){ cb.checked = false; });
    syncProgress();
  });
})();
</script>`;

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: '개인사업자 계약 전부터 첫 1년 세금 신고까지 할 일 순서표',
      description: '상가 계약 전 정화조·전기 확인부터 일반과세 사업자등록, 사업용 통장·카드 홈택스 등록, 원천세, 부가세 조기환급, 노란우산, 5월 종합소득세까지 8단계 절차.',
      step: TIMELINE_STAGES.map((st, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: `${st.period}: ${st.title}`,
        text: st.items.map((x) => x.head).join(' · '),
        url: abs('/start-guide#timeline')
      })),
      publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }
    },
    breadcrumbLd(crumbs),
    faqLd(faq)
  ];

  return { body, jsonld };
}

module.exports = { startGuideView };
