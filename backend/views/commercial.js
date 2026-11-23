'use strict';
const { ZONE_ARCHETYPES, DATA_PIPELINE_SPEC } = require('../data/commercial-architecture');
const { STARTUP_PROFILES, STARTUP_GROUPS } = require('../data/startup-profiles');
const E = require('../lib/calc-engine.js');
const { esc, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, freeOpenBanner } = require('./layout');
const { icon } = require('./icons');

function commercialView(q) {
  const zoneId = ZONE_ARCHETYPES.some((z) => z.id === q.zone) ? q.zone : 'apt-residential';
  const profId = STARTUP_PROFILES.some((p) => p.id === q.biz) ? q.biz : 'takeout-coffee';
  const regionId = E.STARTUP_REGIONS[q.region] ? q.region : 'seoul-res';
  const zone = ZONE_ARCHETYPES.find((z) => z.id === zoneId);
  const prof = STARTUP_PROFILES.find((p) => p.id === profId);
  const locRec = E.GROUP_LOCATION_REC[prof.group] || E.GROUP_LOCATION_REC['외식·배달'];
  const compBase = (zone.avgCompetitors300m && zone.avgCompetitors300m[profId]) || 8;
  const crumbs = [{ name: '홈', path: '/' }, { name: '우리 동네 상권 · 지도 분석', path: '/commercial-area' }];

  const faq = [
    { q: '상권 분석에서 단순 유동인구 수보다 더 중요한 지표는 무엇인가요?', a: '지나가는 사람의 목적과 체류 연령대입니다. 예를 들어 환승역 출구 앞은 하루 유동인구가 5만 명이라도 걸음을 멈추지 않고 지나치는 인구여서 홀 식당에는 불리하고 테이크아웃 커피·약국에만 유리합니다. 반면 3,000세대 아파트 입구는 사람 수는 적어 보여도 실제로 지갑을 여는 단골 소비층 비율이 훨씬 높습니다.' },
    { q: '주변에 같은 업종 경쟁가게가 아예 없는 자리가 좋은 자리인가요?', a: '오히려 위험할 수 있습니다. 치킨집·카페·미용실이 반경 500m 안에 단 하나도 없다면 그 업종을 찾는 손님 자체가 없거나 보행 동선이 끊긴 상권일 가능성이 높습니다. 경쟁점이 적당히 있으면서 기존 가게들의 피크타임 주문이 활발한 곳에 더 나은 동선과 대표 메뉴로 들어가는 것이 훨씬 안전합니다.' },
    { q: '지도에서 찍은 반경 점포 수는 어떤 기준으로 집계되나요?', a: '실시간 지도는 오픈스트리트맵(OpenStreetMap)에 등록된 반경 내 실제 상업시설 좌표를 불러와 카페·외식·뷰티/운동·생활소매 분포를 즉시 시각화해 드립니다. 골목 신규 개업 매장까지 100% 등재되지는 않으므로, 아래 상권 유형별 평균 경쟁점 통계와 현장 발품을 함께 교차 확인하시기 바랍니다.' },
    { q: '상권을 확인한 뒤 실제 월세와 1년 순수익 계산은 어떻게 연결하나요?', a: '지도나 왼쪽 설정창에서 업종을 고른 뒤 ‘이 지역·업종으로 창업 풀코스 12개월 손익 계산하기’ 버튼을 누르면 해당 지역의 평균 보증금·월세 시세가 반영된 창업 설계 화면으로 바로 이어집니다.' }
  ];

  const body = `
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
<div class="container">
  ${breadcrumbHtml(crumbs)}
  <header class="page-head">
    <span class="eyebrow">${icon('mapPin', 16)} 실제 지도 반경 탐색 · 손님 연령대 · 주변 경쟁가게 살펴보기</span>
    <h1>우리 동네 상권 · 실제 지도 입지 분석</h1>
    <p class="lead">어느 동네에 가게를 내야 할지 고민되시나요? 실제 지도에서 지하철역이나 동네 이름을 검색하거나 원하는 골목을 직접 클릭해 반경 300m~1km 안의 주변 상권 분포와 업종별 추천 자리를 바로 확인해 보세요.</p>
    ${freeOpenBanner('calc')}
  </header>

  <section class="card map-card" aria-label="실시간 상권 반경 지도">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:10px">
      <div>
        <span class="pill">실제 지도 클릭 · 반경 점포 탐색</span>
        <h2 class="card-h" style="margin:6px 0 2px;font-size:19px">원하는 역 · 동네 검색 또는 지도를 직접 클릭해 반경 상권 보기</h2>
        <p class="note" style="margin:0">지도를 클릭하면 선택한 반경(300m / 500m / 1km) 원이 그려지며 주변에 등록된 상업 점포 분포를 불러옵니다.</p>
      </div>
      <span class="pill tnum" id="cm-map-status">서울 공덕역 반경 300m 기준</span>
    </div>

    <div class="map-search-bar">
      <input type="search" id="cm-map-q" class="admin-input" placeholder="지하철역 · 동네 · 도로명 검색 (예: 성수역, 잠실새내역, 수원 광교중앙역, 부산 서면역...)" aria-label="지도 상권 위치 검색">
      <button type="button" class="btn btn-primary" id="cm-map-search-btn">지도 위치 찾기</button>
    </div>

    <div class="map-presets" id="cm-map-presets" aria-label="대표 상권 빠른 이동">
      <button type="button" class="prof-chip active" data-lat="37.5440" data-lng="126.9516" data-reg="seoul-res" data-z="office-core" data-lbl="서울 마포 공덕역">마포 공덕역(복합)</button>
      <button type="button" class="prof-chip" data-lat="37.5446" data-lng="127.0560" data-reg="seoul-core" data-z="transit-hub" data-lbl="서울 성수역·연무장길">성수역(핵심)</button>
      <button type="button" class="prof-chip" data-lat="37.4980" data-lng="127.0276" data-reg="seoul-core" data-z="office-core" data-lbl="서울 강남역">강남역(오피스·번화가)</button>
      <button type="button" class="prof-chip" data-lat="37.5575" data-lng="126.9245" data-reg="seoul-core" data-z="univ-alley" data-lbl="서울 홍대입구·연남">홍대·연남(대학·골목)</button>
      <button type="button" class="prof-chip" data-lat="37.5117" data-lng="127.0861" data-reg="seoul-res" data-z="apt-residential" data-lbl="서울 잠실새내 대단지">송파 잠실 대단지(주거)</button>
      <button type="button" class="prof-chip" data-lat="37.3948" data-lng="127.1112" data-reg="gyeonggi-incheon" data-z="office-core" data-lbl="성남 판교역">경기 판교역</button>
      <button type="button" class="prof-chip" data-lat="37.2885" data-lng="127.0515" data-reg="gyeonggi-incheon" data-z="apt-residential" data-lbl="수원 광교중앙역">수원 광교신도시</button>
      <button type="button" class="prof-chip" data-lat="35.1578" data-lng="129.0600" data-reg="metro-5" data-z="transit-hub" data-lbl="부산 서면역">부산 서면역</button>
      <button type="button" class="prof-chip" data-lat="36.3518" data-lng="127.3867" data-reg="metro-5" data-z="office-core" data-lbl="대전 둔산·시청역">대전 둔산동</button>
    </div>

    <div id="cm-map" class="map-box" role="application" aria-label="상권 반경 인터랙티브 지도"></div>

    <div class="map-poi-summary tnum" id="cm-poi-grid">
      <div class="map-poi-pill"><span>반경 내 지도 등록 카페·디저트</span><strong id="poi-cafe">-</strong></div>
      <div class="map-poi-pill"><span>반경 내 음식점·주점·분식</span><strong id="poi-food">-</strong></div>
      <div class="map-poi-pill"><span>반경 내 미용·뷰티·운동시설</span><strong id="poi-beauty">-</strong></div>
      <div class="map-poi-pill"><span>반경 내 편의점·생활소매</span><strong id="poi-retail">-</strong></div>
    </div>
  </section>

  <section class="calc" id="commercial-sim">
    <div class="calc-form card">
      <fieldset><legend>상권 유형 &amp; 창업 희망 업종 맞춤 진단</legend>
        <div class="field"><label for="cm-zone">동네 상권 성격 선택</label>
          <select id="cm-zone">
            ${ZONE_ARCHETYPES.map((z) => `<option value="${esc(z.id)}"${z.id === zoneId ? ' selected' : ''}>${esc(z.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label for="cm-biz">창업 · 운영하려는 업종 (30개 실전 업종)</label>
          <select id="cm-biz">
            ${STARTUP_GROUPS.filter((g) => g.id !== 'all').map((g) => `<optgroup label="${esc(g.label)}">${STARTUP_PROFILES.filter((p) => p.group === g.id).map((p) => `<option value="${esc(p.id)}"${p.id === profId ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</optgroup>`).join('')}
          </select>
        </div>
        <div class="field"><span class="label">지도 원 반경 &amp; 도보 거리</span>
          <div class="seg" id="cm-radius">
            <label class="seg-opt"><input type="radio" name="rad" value="300" checked><span>300m (걸어서 4분)</span></label>
            <label class="seg-opt"><input type="radio" name="rad" value="500"><span>500m (걸어서 7분)</span></label>
            <label class="seg-opt"><input type="radio" name="rad" value="1000"><span>1km (배달 생활권)</span></label>
          </div>
        </div>
      </fieldset>

      <div class="rec-box" style="margin-bottom:12px">
        <div><strong>선택 업종 추천 입지:</strong> <span id="cm-rec-best">${esc(locRec.best)}</span></div>
        <div><strong>피해야 할 자리:</strong> <span id="cm-rec-avoid">${esc(locRec.avoid)}</span></div>
        <div><strong>수익 방어 포인트:</strong> <span id="cm-rec-tip">${esc(locRec.tip)}</span></div>
      </div>

      <a class="btn btn-primary" style="width:100%" id="cm-to-startup" href="/calculators/startup-master?profile=${esc(profId)}&region=${esc(regionId)}">이 지역·업종으로 창업 풀코스 12개월 손익 계산하기 →</a>
    </div>

    <div class="calc-out">
      <div class="card result-hero" id="cm-hero" data-status="safe">
        <p class="rh-label" id="cm-zone-title">${esc(zone.name)} × ${esc(prof.name)}</p>
        <p class="rh-value tnum" id="cm-comp-val">반경 300m 평균 동종 경쟁점 약 ${compBase}곳</p>
        <p class="rh-sub" id="cm-zone-desc">${esc(zone.desc)}</p>
      </div>

      <div class="card">
        <h2 class="card-h">주력 소비 연령대 분포 &amp; 매출 골든타임 특성</h2>
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
        <h2 class="card-h">상권 × 업종 맞춤 입지 조언</h2>
        <p class="killer-text" id="cm-advice">${esc(zone.advice)}</p>
      </div>

      <div class="card" id="cm-contract-chk">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <h2 class="card-h" style="margin:0">상가 임대차 계약 도장 찍기 직전 필수 확인 6가지 점검표</h2>
          <span class="pill tnum" id="cm-chk-badge">점검 완료 0 / 6</span>
        </div>
        <p class="note" style="margin:6px 0 12px">지도와 배후 세대수가 마음에 들더라도 아래 6가지 공적장부·현장 실사 항목 중 하나라도 어긋나면 추가 공사비 폭탄이나 영업신고 불가 사유가 발생합니다.</p>
        <ul class="detail-chk">
          <li><label><input type="checkbox"><span><strong>건축물대장 주용도 &amp; 위반건축물 표기 유무</strong><span class="detail-sub">확인처: 정부24 · 음식점/카페(제2종 근생·휴게음식점) 영업신고 가능 용도인지, 노란색 위반건축물 딱지가 없는지 필히 대조</span></span></label></li>
          <li><label><input type="checkbox"><span><strong>정화조 용량 및 소방 완비증명 대상 여부</strong><span class="detail-sub">확인처: 시·군·구청 환경과/위생과 · 기존 소매점 자리를 음식점·카페로 변경할 때 정화조 인원 한도 초과 시 입점 불가</span></span></label></li>
          <li><label><input type="checkbox"><span><strong>등기부등본 갑구·을구 근저당권 및 환산보증금 비교</strong><span class="detail-sub">확인처: 인터넷등기소 · 선순위 채권최고액 + 내 보증금이 건물 시세의 60~70% 이내인지 확인 (<a href="/calculators/store-rent-breakeven">환산보증금 판독기</a> 연동)</span></span></label></li>
          <li><label><input type="checkbox"><span><strong>한전 계약전력(kW) · 도시가스 배관 · 상하수도 구경</strong><span class="detail-sub">확인처: 한전ON / 현장 계량기 · 에스프레소 머신·오븐·튀김기 동시 가동 시 최소 15~25kW 확보 여부 점검</span></span></label></li>
          <li><label><input type="checkbox"><span><strong>평일 낮 · 평일 밤 · 주말 3회 시간대별 보행 동선 실측</strong><span class="detail-sub">출근길 횡단보도 방향(우측 보행 유리), 점심 오피스 동선, 야간 배달 라이더 정차 공간을 최소 3번 직접 눈으로 확인</span></span></label></li>
          <li><label><input type="checkbox"><span><strong>임대차계약서 특약사항 방어 문구 삽입</strong><span class="detail-sub">“영업허가 불가 시 계약 무효 및 계약금 전액 반환”, “원상복구는 임차인 입점 당시 현 시설 상태 기준” 문구 명기</span></span></label></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head"><h2>상권 분석에 교차 활용하는 6가지 공식 통계 자료</h2></div>
    <p class="sec-desc">중개업소의 구두 설명에만 의존하지 않도록 아래 6가지 정부·지자체·지도 공식 자료를 함께 비교해 판단합니다.</p>
    <div class="table-scroll">
      <table class="rate-board">
        <thead><tr><th>확인 분야</th><th>참고하는 공식 통계 자료</th><th>살펴보는 핵심 숫자</th><th>우리 가게 적용 방법</th></tr></thead>
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
  <aside class="trust-box"><h2>상권 · 지도 데이터 출처 &amp; 면책 고지</h2><p>실시간 반경 점포 분포는 OpenStreetMap 공개 공간정보를 기반으로 표시되며, 상권 유형별 소비 특성·임대료 기준은 소상공인시장진흥공단 상권정보 및 국토교통부·한국부동산원 상업용부동산 임대동향 공시 자료를 참조합니다. 지도 미등재 신규 점포나 건물 개별 용도 제한이 있을 수 있으므로 임대차 계약 전 반드시 건축물대장·등기부등본 열람과 현장 실사를 병행하시기 바랍니다. (<a href="/terms-of-service">이용약관</a> · <a href="/privacy-policy">개인정보처리방침</a>)</p></aside>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function(){
  var ZONES=${JSON.stringify(ZONE_ARCHETYPES).replace(/</g, '\\u003c')};
  var PROFS=${JSON.stringify(STARTUP_PROFILES.map((p) => ({ id: p.id, name: p.name, group: p.group }))).replace(/</g, '\\u003c')};
  var RECS=${JSON.stringify(E.GROUP_LOCATION_REC).replace(/</g, '\\u003c')};
  var curRegion=${JSON.stringify(regionId)};
  var zSel=document.getElementById('cm-zone'), bSel=document.getElementById('cm-biz'), rBox=document.getElementById('cm-radius');
  var curLat=37.5440, curLng=126.9516, curPlaceLabel='서울 마포 공덕역';

  function getRad(){
    var rad=300;
    if(rBox) rBox.querySelectorAll('input').forEach(function(i){if(i.checked)rad=parseInt(i.value,10);});
    return rad;
  }

  function inferRegionFromCoord(lat, lng){
    if(lat>=37.43 && lat<=37.70 && lng>=126.80 && lng<=127.18){
      var isCore = (lat>=37.48&&lat<=37.57 && ((lng>=127.01&&lng<=127.08) || (lng>=126.91&&lng<=126.99)));
      return isCore ? 'seoul-core' : 'seoul-res';
    }
    if(lat>=37.10 && lat<=37.90 && lng>=126.55 && lng<=127.55) return 'gyeonggi-incheon';
    if((lat>=35.05&&lat<=35.30&&lng>=128.95&&lng<=129.25) || (lat>=35.80&&lat<=35.95&&lng>=128.50&&lng<=128.75) || (lat>=36.28&&lat<=36.45&&lng>=127.30&&lng<=127.48)) return 'metro-5';
    return 'local-city';
  }

  function update(){
    var z=ZONES.find(function(x){return x.id===zSel.value;})||ZONES[0];
    var b=PROFS.find(function(x){return x.id===bSel.value;})||PROFS[0];
    var rec=RECS[b.group]||RECS['외식·배달'];
    var rad=getRad();
    var base=(z.avgCompetitors300m&&z.avgCompetitors300m[b.id])||8;
    var mult=rad===300?1:(rad===500?2.4:7.5);
    var cnt=Math.round(base*mult);
    document.getElementById('cm-zone-title').textContent=z.name+' × '+b.name;
    document.getElementById('cm-comp-val').textContent='반경 '+rad+'m 평균 동종 경쟁점 약 '+cnt+'곳';
    document.getElementById('cm-zone-desc').textContent=z.desc;
    document.getElementById('cm-peak').textContent=z.peakHours;
    document.getElementById('cm-wk').textContent=z.weekdayVsWeekend;
    document.getElementById('cm-rent').textContent=z.rentLevel;
    document.getElementById('cm-advice').textContent=z.advice;
    document.getElementById('cm-rec-best').textContent=rec.best;
    document.getElementById('cm-rec-avoid').textContent=rec.avoid;
    document.getElementById('cm-rec-tip').textContent=rec.tip;
    document.getElementById('cm-to-startup').href='/calculators/startup-master?profile='+encodeURIComponent(b.id)+'&region='+encodeURIComponent(curRegion);
    document.getElementById('cm-age-bars').innerHTML=z.ageDist.map(function(a){
      return '<li><div class="sb-row"><span>'+a.group+'</span><strong>'+a.pct+'%</strong></div><div class="sb-track"><div class="sb-fill" style="width:'+a.pct+'%"></div></div></li>';
    }).join('');
    document.getElementById('cm-hero').setAttribute('data-status', base>=18?'danger':(base>=11?'caution':'safe'));
  }

  // Real Leaflet Map Initialization
  var mapEl=document.getElementById('cm-map');
  var statusEl=document.getElementById('cm-map-status');
  var map=null, centerMarker=null, radCircle=null, poiLayer=null, fetchTimer=null;

  function fetchPois(lat, lng, rad){
    if(!map || !poiLayer) return;
    poiLayer.clearLayers();
    if(statusEl) statusEl.textContent=curPlaceLabel+' · 반경 '+rad+'m 상권 불러오는 중...';
    var query='[out:json][timeout:8];(node(around:'+rad+','+lat.toFixed(5)+','+lng.toFixed(5)+')["amenity"~"cafe|restaurant|fast_food|bar|pub"];node(around:'+rad+','+lat.toFixed(5)+','+lng.toFixed(5)+')["shop"~"bakery|convenience|supermarket|hairdresser|beauty|clothes|laundry"];node(around:'+rad+','+lat.toFixed(5)+','+lng.toFixed(5)+')["leisure"~"fitness_centre|sports_centre"];);out body 160;';
    fetch('https://overpass-api.de/api/interpreter', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body:'data='+encodeURIComponent(query)
    }).then(function(r){return r.json();}).then(function(data){
      var els=(data&&data.elements)||[];
      var cCafe=0, cFood=0, cBeauty=0, cRetail=0;
      els.forEach(function(el){
        if(!el.lat || !el.lon) return;
        var tg=el.tags||{};
        var nm=tg.name||'상업 점포';
        var color='#3182f6', kind='생활·소매';
        if(tg.amenity==='cafe' || tg.shop==='bakery'){ cCafe++; color='#d97706'; kind='카페·베이커리'; }
        else if(tg.amenity==='restaurant' || tg.amenity==='fast_food' || tg.amenity==='bar' || tg.amenity==='pub'){ cFood++; color='#e5484d'; kind='외식·음식점'; }
        else if(tg.shop==='hairdresser' || tg.shop==='beauty' || tg.leisure){ cBeauty++; color='#8b5cf6'; kind='뷰티·운동'; }
        else { cRetail++; color='#0d9488'; kind='편의점·소매'; }
        window.L.circleMarker([el.lat, el.lon], { radius:5, color:color, fillColor:color, fillOpacity:0.82, weight:1 })
          .bindPopup('<strong>'+nm.replace(/[<>]/g,'')+'</strong><br><small>'+kind+'</small>')
          .addTo(poiLayer);
      });
      document.getElementById('poi-cafe').textContent=cCafe+'곳';
      document.getElementById('poi-food').textContent=cFood+'곳';
      document.getElementById('poi-beauty').textContent=cBeauty+'곳';
      document.getElementById('poi-retail').textContent=cRetail+'곳';
      if(statusEl) statusEl.textContent=curPlaceLabel+' 반경 '+rad+'m · 지도 등재 점포 총 '+els.length+'곳 표시됨';
    }).catch(function(){
      if(statusEl) statusEl.textContent=curPlaceLabel+' 반경 '+rad+'m 범위 설정됨 (지도 클릭으로 이동 가능)';
    });
  }

  function moveMapTo(lat, lng, label, zoomAdjust){
    curLat=lat; curLng=lng;
    if(label) curPlaceLabel=label;
    curRegion=inferRegionFromCoord(lat, lng);
    update();
    if(!map) return;
    var rad=getRad();
    var targetZoom = rad===300 ? 16 : (rad===500 ? 15 : 14);
    if(zoomAdjust!==false) map.setView([lat, lng], targetZoom);
    if(centerMarker) centerMarker.setLatLng([lat, lng]).bindPopup('<strong>선택한 후보지 중심</strong><br>'+curPlaceLabel.replace(/[<>]/g,''));
    if(radCircle) radCircle.setLatLng([lat, lng]).setRadius(rad);
    clearTimeout(fetchTimer);
    fetchTimer=setTimeout(function(){ fetchPois(lat, lng, rad); }, 220);
  }

  if(mapEl && window.L){
    map=window.L.map(mapEl, { scrollWheelZoom:false }).setView([curLat, curLng], 16);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    radCircle=window.L.circle([curLat, curLng], { radius:getRad(), color:'#1b64da', fillColor:'#1b64da', fillOpacity:0.11, weight:2 }).addTo(map);
    centerMarker=window.L.marker([curLat, curLng]).addTo(map).bindPopup('<strong>선택한 후보지 중심</strong><br>'+curPlaceLabel);
    poiLayer=window.L.layerGroup().addTo(map);

    map.on('click', function(e){
      document.querySelectorAll('#cm-map-presets [data-lat]').forEach(function(b){b.classList.remove('active');});
      moveMapTo(e.latlng.lat, e.latlng.lng, '선택한 지도 좌표 ('+e.latlng.lat.toFixed(4)+', '+e.latlng.lng.toFixed(4)+')', false);
      var locInput=document.getElementById('cu-loc');
      if(locInput && !locInput.value) locInput.value='위도 '+e.latlng.lat.toFixed(5)+', 경도 '+e.latlng.lng.toFixed(5)+' 인근';
    });

    fetchPois(curLat, curLng, getRad());
  }

  var presetsBox=document.getElementById('cm-map-presets');
  if(presetsBox){
    presetsBox.addEventListener('click', function(e){
      var btn=e.target.closest('[data-lat]');
      if(!btn) return;
      presetsBox.querySelectorAll('[data-lat]').forEach(function(b){b.classList.toggle('active', b===btn);});
      var zId=btn.getAttribute('data-z');
      if(zId && zSel) zSel.value=zId;
      curRegion=btn.getAttribute('data-reg')||'seoul-res';
      moveMapTo(parseFloat(btn.getAttribute('data-lat')), parseFloat(btn.getAttribute('data-lng')), btn.getAttribute('data-lbl')||'선택 지역', true);
    });
  }

  function runPlaceSearch(){
    var qEl=document.getElementById('cm-map-q');
    var q=(qEl&&qEl.value||'').trim();
    if(!q) return;
    if(statusEl) statusEl.textContent='‘'+q+'’ 위치를 찾는 중...';
    fetch('https://nominatim.openstreetmap.org/search?format=json&countrycodes=kr&limit=1&q='+encodeURIComponent(q))
      .then(function(r){return r.json();})
      .then(function(arr){
        if(arr && arr.length > 0){
          var item=arr[0];
          var shortName=(item.display_name||q).split(',').slice(0,3).join(' ');
          moveMapTo(parseFloat(item.lat), parseFloat(item.lon), shortName, true);
        } else if(statusEl) {
          statusEl.textContent='검색 결과가 없습니다. 역 이름이나 동 이름(예: 성수동, 광교중앙역)으로 검색해 보세요.';
        }
      }).catch(function(){
        if(statusEl) statusEl.textContent='위치 검색 중 일시적인 네트워크 오류가 발생했습니다.';
      });
  }
  var sBtn=document.getElementById('cm-map-search-btn'), sInp=document.getElementById('cm-map-q');
  if(sBtn) sBtn.addEventListener('click', runPlaceSearch);
  if(sInp) sInp.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); runPlaceSearch(); } });

  if(zSel){
    zSel.addEventListener('change', update);
    bSel.addEventListener('change', update);
    rBox.addEventListener('change', function(){
      update();
      moveMapTo(curLat, curLng, curPlaceLabel, true);
    });
  }
  update();

  var cc=document.getElementById('cm-contract-chk');
  if(cc){
    cc.addEventListener('change',function(){
      var t=cc.querySelectorAll('input[type="checkbox"]').length;
      var d=cc.querySelectorAll('input[type="checkbox"]:checked').length;
      var b=document.getElementById('cm-chk-badge');
      if(b)b.textContent='점검 완료 '+d+' / '+t;
    });
  }
})();
</script>`;

  return { body, jsonld: [breadcrumbLd(crumbs), faqLd(faq)] };
}

module.exports = { commercialView };
