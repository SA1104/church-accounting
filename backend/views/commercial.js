'use strict';
const { ZONE_ARCHETYPES, DATA_PIPELINE_SPEC } = require('../data/commercial-architecture');
const { STARTUP_PROFILES, STARTUP_GROUPS } = require('../data/startup-profiles');
const { esc, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd } = require('./layout');
const { icon } = require('./icons');

function commercialView(q) {
  const zoneId = ZONE_ARCHETYPES.some((z) => z.id === q.zone) ? q.zone : 'apt-residential';
  const profId = STARTUP_PROFILES.some((p) => p.id === q.biz) ? q.biz : 'takeout-coffee';
  const zone = ZONE_ARCHETYPES.find((z) => z.id === zoneId);
  const prof = STARTUP_PROFILES.find((p) => p.id === profId);
  const compBase = (zone.avgCompetitors300m && zone.avgCompetitors300m[profId]) || 8;
  const crumbs = [{ name: '홈', path: '/' }, { name: '상권 · 입지 컨설팅 Lab', path: '/commercial-area' }];

  const faq = [
    { q: '상권 분석에서 단순 유동인구 수보다 더 중요한 지표는 무엇인가요?', a: '유동인구의 목적과 체류 연령대입니다. 예를 들어 환승역 출구 앞은 하루 유동인구가 5만 명이라도 걸음을 멈추지 않는 통과 인구여서 홀 식당에는 불리하고 테이크아웃 커피·약국에만 유리합니다. 반면 배후 3,000세대 아파트 입구는 유동인구 총량은 적어도 실제 지갑을 여는 거주 소비층 비율이 훨씬 높습니다.' },
    { q: '경쟁업체가 아예 없는 자리가 좋은 자리인가요?', a: '오히려 위험할 수 있습니다. 치킨집·카페·미용실이 반경 500m 안에 단 하나도 없다면 그 업종의 수요 자체가 없거나 동선이 끊긴 죽은 상권일 가능성이 높습니다. 경쟁점이 적당히 있으면서 기존 매장들의 피크타임 웨이팅과 배달 주문량이 활발한 상권에 차별화된 포지셔닝으로 진입하는 것이 생존율이 높습니다.' },
    { q: '핀포인트 주소 기반 Pro 정밀 컨설팅은 어떻게 열람할 수 있나요?', a: '개별 번지(위경도 좌표) 반경 상가업소 공공데이터·연령대 유동인구·추정 매출을 결합하는 Pro 정밀 리포트는 단건 유료 열람 패스 또는 커뮤니티·SNS(스레드·블로그·단톡방) 홍보 인증을 통한 무료 열람권 부여 방식으로 순차 제공됩니다.' },
    { q: '상권 분석 후 손익 시뮬레이션은 어디서 연결되나요?', a: '선택하신 상권의 임대료 시세와 목표 객단가를 창업 풀코스 A-to-Z 시뮬레이터(/calculators/startup-master) 및 상가 환산보증금·손익분기점 계산기(/calculators/store-rent-breakeven)로 바로 넘겨 12개월 실수익을 검증하실 수 있습니다.' }
  ];

  const body = `
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('mapPin', 16)} 상권 · 배후연령 · 경쟁밀도 컨설팅 Lab</span>
    <h1>상권 · 입지 · 경쟁점 인텔리전스 Lab</h1>
    <p class="lead">내가 들어가려는 상권에 어떤 연령대가 머무르고, 반경 내 동종 경쟁업체가 몇 개나 포진해 있으며, 어떤 메뉴·시간대 전략을 써야 살아남는지를 진단합니다. 아래 인터랙티브 상권 시뮬레이터로 상권별 궁합을 먼저 확인해 보세요.</p>
  </header>

  <section class="calc" id="commercial-sim">
    <div class="calc-form card">
      <fieldset><legend>1. 목표 상권 유형 & 업종 선택</legend>
        <div class="field"><label for="cm-zone">입점 검토 상권 유형</label>
          <select id="cm-zone">
            ${ZONE_ARCHETYPES.map((z) => `<option value="${esc(z.id)}"${z.id === zoneId ? ' selected' : ''}>${esc(z.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label for="cm-biz">창업 · 운영 업종 (30대 실전 업종)</label>
          <select id="cm-biz">
            ${STARTUP_GROUPS.filter((g) => g.id !== 'all').map((g) => `<optgroup label="${esc(g.label)}">${STARTUP_PROFILES.filter((p) => p.group === g.id).map((p) => `<option value="${esc(p.id)}"${p.id === profId ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}
          </select>
        </div>
        <div class="field"><span class="label">분석 반경</span>
          <div class="seg" id="cm-radius">
            <label class="seg-opt"><input type="radio" name="rad" value="300" checked><span>반경 300m (도보 4분)</span></label>
            <label class="seg-opt"><input type="radio" name="rad" value="500"><span>반경 500m (도보 7분)</span></label>
            <label class="seg-opt"><input type="radio" name="rad" value="1000"><span>반경 1km (배달권)</span></label>
          </div>
        </div>
        <div class="field"><label for="cm-addr">검토 중인 후보지 지역 · 역 이름 (선택 메모)</label>
          <input type="text" id="cm-addr" placeholder="예: 서울 마포구 공덕역 인근 / 수원 광교중앙역" class="admin-input">
        </div>
      </fieldset>
      <a class="btn btn-primary" style="width:100%" id="cm-to-startup" href="/calculators/startup-master?profile=${esc(profId)}">이 업종으로 창업 풀코스 12개월 손익 계산하기 →</a>
    </div>

    <div class="calc-out">
      <div class="card result-hero" id="cm-hero" data-status="safe">
        <p class="rh-label" id="cm-zone-title">${esc(zone.name)} × ${esc(prof.name)}</p>
        <p class="rh-value tnum" id="cm-comp-val">반경 300m 평균 경쟁점 약 ${compBase}곳</p>
        <p class="rh-sub" id="cm-zone-desc">${esc(zone.desc)}</p>
      </div>

      <div class="card">
        <h2 class="card-h">주력 소비 연령대 분포 & 피크타임 특성</h2>
        <ul class="stat-bars tnum" id="cm-age-bars">
          ${zone.ageDist.map((a) => `<li><div class="sb-row"><span>${esc(a.group)}</span><strong>${a.pct}%</strong></div><div class="sb-track"><div class="sb-fill" style="width:${a.pct}%"></div></div></li>`).join('')}
        </ul>
        <div class="kpi-grid" style="margin-top:14px">
          <div><span>핵심 매출 골든타임</span><strong style="font-size:14px" id="cm-peak">${esc(zone.peakHours)}</strong></div>
          <div><span>평일 vs 주말 매출 비중</span><strong style="font-size:15px" id="cm-wk">${esc(zone.weekdayVsWeekend)}</strong></div>
          <div class="wide"><span>임대료 · 권리금 시세 특성</span><strong style="font-size:14.5px" id="cm-rent">${esc(zone.rentLevel)}</strong></div>
        </div>
      </div>

      <div class="card killer">
        <h2 class="card-h">상권 × 업종 맞춤 입지 컨설팅 어드바이스</h2>
        <p class="killer-text" id="cm-advice">${esc(zone.advice)}</p>
      </div>

      <div class="card pro-gate">
        <span class="pill">Pro 핀포인트 위치 리포트 (얼리액세스)</span>
        <h2 style="margin:10px 0 8px;font-size:20px">특정 지번·도로명 반경 실측 경쟁점 & 배후인구 정밀 리포트</h2>
        <p style="margin:0 0 14px;font-size:14.5px;color:var(--text-2)">원하시는 정확한 후보지 주소의 반경 내 실제 영업 업종 분포, 연령별 유동인구, 적정 월세 상한선 컨설팅 리포트를 준비 중입니다. <strong>Pro 유료 패스</strong> 출시 전까지는 <strong>스레드·블로그·창업 커뮤니티에 BoozaThink 계산기를 소개한 링크를 인증</strong>해 주시는 분께 우선 무료 리포트를 보내 드립니다.</p>
        <form id="cm-unlock-form" class="contact-form" novalidate>
          <div class="kpi-grid" style="background:none">
            <div class="field" style="background:none;padding:0;border:0">
              <label for="cu-email">리포트 수령 이메일</label>
              <input type="email" id="cu-email" required placeholder="founder@example.com" class="admin-input">
            </div>
            <div class="field" style="background:none;padding:0;border:0">
              <label for="cu-share">홍보 인증 게시글 URL (또는 유료출시 알림 신청)</label>
              <input type="text" id="cu-share" placeholder="https://threads.net/... 또는 '출시알림'" class="admin-input">
            </div>
          </div>
          <div class="field" style="border:0">
            <label for="cu-loc">분석 희망 주소지 & 창업 예정 업종</label>
            <input type="text" id="cu-loc" required placeholder="예: 서울시 성동구 성수동2가 OO빌딩 1층 / 베이커리 카페 20평" class="admin-input">
          </div>
          <input type="text" id="cu-hp" style="display:none" tabindex="-1" autocomplete="off">
          <button type="submit" class="btn btn-primary" id="cu-btn">무료 홍보인증 / Pro 리포트 우선 신청</button>
          <span class="toast" id="cu-toast" role="status" aria-live="polite"></span>
        </form>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>상권 인텔리전스 6대 공공·민간 데이터 설계 아키텍처</h2></div>
    <p class="sec-desc">BoozaThink 상권 컨설팅 엔진은 감이나 중개업소의 구두 설명이 아니라 아래 6개 공식 데이터 레이어를 교차 검증하도록 설계되어 있습니다.</p>
    <div class="table-scroll">
      <table class="rate-board">
        <thead><tr><th>데이터 레이어</th><th>연동 공공·민간 원천 데이터</th><th>추출 핵심 지표</th><th>창업 컨설팅 활용 로직</th></tr></thead>
        <tbody>
          ${DATA_PIPELINE_SPEC.map((d) => `<tr>
            <td><strong>${esc(d.layer)}</strong></td>
            <td style="font-size:13px">${esc(d.source)}</td>
            <td style="font-size:13px;color:var(--text-2)">${esc(d.fields)}</td>
            <td style="font-size:13.5px">${esc(d.usage)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </section>

  ${faqHtml(faq)}
</div>
<script>
(function(){
  var ZONES=${JSON.stringify(ZONE_ARCHETYPES).replace(/</g, '\\u003c')};
  var PROFS=${JSON.stringify(STARTUP_PROFILES.map((p) => ({ id: p.id, name: p.name, group: p.group }))).replace(/</g, '\\u003c')};
  var zSel=document.getElementById('cm-zone'), bSel=document.getElementById('cm-biz'), rBox=document.getElementById('cm-radius');
  function update(){
    var z=ZONES.find(function(x){return x.id===zSel.value;})||ZONES[0];
    var b=PROFS.find(function(x){return x.id===bSel.value;})||PROFS[0];
    var rad=300;
    rBox.querySelectorAll('input').forEach(function(i){if(i.checked)rad=parseInt(i.value,10);});
    var base=(z.avgCompetitors300m&&z.avgCompetitors300m[b.id])||8;
    var mult=rad===300?1:(rad===500?2.4:7.5);
    var cnt=Math.round(base*mult);
    document.getElementById('cm-zone-title').textContent=z.name+' × '+b.name;
    document.getElementById('cm-comp-val').textContent='반경 '+rad+'m 예상 동종 경쟁점 약 '+cnt+'곳';
    document.getElementById('cm-zone-desc').textContent=z.desc;
    document.getElementById('cm-peak').textContent=z.peakHours;
    document.getElementById('cm-wk').textContent=z.weekdayVsWeekend;
    document.getElementById('cm-rent').textContent=z.rentLevel;
    document.getElementById('cm-advice').textContent=z.advice;
    document.getElementById('cm-to-startup').href='/calculators/startup-master?profile='+encodeURIComponent(b.id);
    document.getElementById('cm-age-bars').innerHTML=z.ageDist.map(function(a){
      return '<li><div class="sb-row"><span>'+a.group+'</span><strong>'+a.pct+'%</strong></div><div class="sb-track"><div class="sb-fill" style="width:'+a.pct+'%"></div></div></li>';
    }).join('');
    document.getElementById('cm-hero').setAttribute('data-status', base>=18?'danger':(base>=11?'caution':'safe'));
  }
  if(zSel){zSel.addEventListener('change',update);bSel.addEventListener('change',update);rBox.addEventListener('change',update);}

  var uf=document.getElementById('cm-unlock-form');
  if(uf){
    uf.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=document.getElementById('cu-btn'), st=document.getElementById('cu-toast');
      btn.disabled=true; st.textContent='접수 중...';
      var loc=document.getElementById('cu-loc').value;
      var sh=document.getElementById('cu-share').value;
      fetch('/api/biz/contact',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({category:'commercial-unlock',email:document.getElementById('cu-email').value,page_url:sh,website:document.getElementById('cu-hp').value,message:'[상권리포트 신청] 후보지 및 업종: '+loc+' / 인증링크: '+sh})
      }).then(function(r){return r.json();}).then(function(d){
        btn.disabled=false;
        if(d&&d.ok){st.textContent='신청이 접수되었습니다! 인증 확인 후 이메일로 리포트를 발송해 드립니다.';uf.reset();}
        else{st.textContent=d&&d.error?d.error:'이메일과 후보지 내용을(10자 이상) 입력해 주세요.';}
      }).catch(function(){btn.disabled=false;st.textContent='일시적인 통신 오류가 발생했습니다.';});
    });
  }
})();
</script>`;

  return { body, jsonld: [breadcrumbLd(crumbs), faqLd(faq)] };
}

module.exports = { commercialView };
