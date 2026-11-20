'use strict';
const { esc, CALCULATORS } = require('./layout');
const { icon } = require('./icons');
const { PERSONAS } = require('../data/start-timeline');
const { STARTUP_PROFILES } = require('../data/startup-profiles');
const E = require('../public/js/calc-engine.js');

const SOURCE_LABELS = {
  google: 'Google 검색',
  naver: 'Naver 검색 · 블로그 · 카페',
  threads_insta: 'Threads · Instagram',
  x_twitter: 'X (Twitter)',
  kakao: '카카오톡 · 다음',
  ai_search: 'AI 검색 (ChatGPT·Perplexity)',
  youtube: 'YouTube · Shorts',
  other: '기타 외부 링크',
  direct: '직접 접속 · 공유링크'
};

const CAP_BAND_LABELS = {
  lt3000: '3,000만 원 미만 (소자본)',
  '3000_7000': '3,000만 ~ 7,000만 원',
  '7000_15000': '7,000만 ~ 1.5억 원',
  gte15000: '1.5억 원 이상'
};

const PROFILE_NAME_MAP = Object.fromEntries(STARTUP_PROFILES.map((p) => [p.id, p.name]));

function fmtDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s < 60) return s + '초';
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}분 ${String(rem).padStart(2, '0')}초`;
}

function resolvePageTitle(pathStr, ctx) {
  if (pathStr === '/') return '홈 (메인 랜딩)';
  if (pathStr === '/calculators') return '전체 시뮬레이터 허브';
  if (pathStr === '/funding') return '[자금라운지] 사업자 대출 · 정책자금 라운지';
  if (pathStr === '/commercial-area') return '[상권지도] 우리 동네 상권 · 지도 분석';
  if (pathStr === '/calendar') return '[생존캘린더] 사업자 12개월 세무·자금 달력';
  if (pathStr === '/start-guide') return '[창업순서표] 개인사업자 D-60~1년 할 일 순서표';
  if (pathStr === '/requests') return '[고객제안] 필요한 계산기 신청 · 투표소';
  if (pathStr === '/datasets') return '[기준자료] 업종별 비용 · 세율 공개 기준표';
  if (pathStr === '/bible') return '실전 바이블 전체 목록';
  if (pathStr.startsWith('/start-guide/persona/')) {
    const pid = pathStr.slice('/start-guide/persona/'.length);
    const pObj = PERSONAS.find((x) => x.id === pid);
    return pObj ? `[상황선택] ${pObj.adminLabel}` : pathStr;
  }
  if (pathStr.startsWith('/calculators/')) {
    const slug = pathStr.slice('/calculators/'.length);
    const c = CALCULATORS.find((x) => x.slug === slug);
    return c ? `[계산기] ${c.short}` : pathStr;
  }
  if (pathStr.startsWith('/bible/')) {
    const slug = pathStr.slice('/bible/'.length);
    const a = ctx.bySlug[slug];
    return a ? `[바이블] ${a.title}` : pathStr;
  }
  if (pathStr.startsWith('/category/')) {
    const slug = pathStr.slice('/category/'.length);
    const cat = ctx.categoryBySlug[slug];
    return cat ? `[카테고리] ${cat.name}` : pathStr;
  }
  return pathStr;
}

function loginView(errMsg) {
  return `
<div class="container narrow">
  <div class="card admin-login">
    <span class="pill">${icon('lock', 14)} 관리자 전용 (검색엔진 비노출)</span>
    <h1>BoozaThink 고객 · 데이터 인텔리전스 상황판</h1>
    <p class="lead">방문수·체류시간은 물론, 어떤 업종·자본금·대출 수요를 가진 고객이 들어오는지, 어떤 차기 계산기를 가장 원하는지 한눈에 파악합니다.</p>
    ${errMsg ? `<div class="callout warn">${esc(errMsg)}</div>` : ''}
    <form method="POST" action="/admin/login" class="admin-form">
      <div class="field">
        <label for="admin-pw">관리자 패스코드</label>
        <input type="password" id="admin-pw" name="passcode" required autocomplete="current-password" placeholder="관리자 패스코드를 입력하세요" class="admin-input">
      </div>
      <button type="submit" class="btn btn-primary btn-lg">상황판 열기 →</button>
    </form>
  </div>
</div>`;
}

function dashboardView(data, ctx, envStatus) {
  const { days, kpis, daily, topPages, sources, devices, calculators, inquiries, customerInsights, storage } = data;
  const ci = customerInsights || { topProfiles: [], regions: [], capitalBands: [], loanSummary: { total_meta: 0, need_loan: 0, has_existing_loan: 0, has_card_loan: 0 }, utmCampaigns: [], topToolVotes: [], customToolIdeas: [] };
  const ls = ci.loanSummary || { total_meta: 0, need_loan: 0, has_existing_loan: 0, has_card_loan: 0 };
  const maxDailyPv = Math.max(1, ...daily.map((d) => d.pv));
  const totalSrc = Math.max(1, sources.reduce((a, s) => a + s.cnt, 0));
  const totalDev = Math.max(1, devices.reduce((a, d) => a + d.cnt, 0));

  const envItems = [
    ['자체 내장 데이터 엔진 (Supabase)', storage === 'supabase-pg', storage === 'supabase-pg' ? '실시간 적재 중 (전 테이블 RLS ON)' : '로컬 메모리 모드'],
    ['Google Analytics 4 (GA_MEASUREMENT_ID)', envStatus.ga4, envStatus.ga4 ? envStatus.ga4Id : '미설정 (환경변수 추가 시 자동 활성)'],
    ['Google Search Console (GOOGLE_SITE_VERIFICATION)', envStatus.gsc, envStatus.gsc ? '소유권 메타태그 활성' : '미설정'],
    ['네이버 서치어드바이저 (NAVER_SITE_VERIFICATION)', envStatus.naver, envStatus.naver ? '소유권 메타태그 활성' : '미설정'],
    ['Microsoft Clarity 히트맵 (CLARITY_PROJECT_ID)', envStatus.clarity, envStatus.clarity ? '세션 리플레이 활성' : '미설정'],
    ['Google AdSense (ADSENSE_CLIENT)', envStatus.adsense, envStatus.adsense ? '스크립트 + /ads.txt 활성' : '심사 신청 시 ca-pub-... 입력']
  ];

  const needLoanPct = ls.total_meta > 0 ? Math.round((ls.need_loan / ls.total_meta) * 100) : 0;
  const hasExLoanPct = ls.total_meta > 0 ? Math.round((ls.has_existing_loan / ls.total_meta) * 100) : 0;

  return `
<div class="container admin-wrap">
  <header class="admin-head">
    <div>
      <span class="pill">${icon('chart', 14)} BoozaThink Intelligence · ${storage === 'supabase-pg' ? 'Live Supabase' : 'Local Memory'}</span>
      <h1>방문 트래픽 · 고객 프로파일 · 희망 계산기 상황판</h1>
    </div>
    <div class="admin-controls">
      <div class="seg">
        <a class="seg-link${days === 1 ? ' active' : ''}" href="/admin?days=1">오늘(24h)</a>
        <a class="seg-link${days === 7 ? ' active' : ''}" href="/admin?days=7">최근 7일</a>
        <a class="seg-link${days === 30 ? ' active' : ''}" href="/admin?days=30">최근 30일</a>
      </div>
      <form method="POST" action="/admin/logout"><button type="submit" class="btn btn-ghost">로그아웃</button></form>
    </div>
  </header>

  <section class="admin-kpis tnum">
    <div class="card"><span class="ak-label">페이지 조회수 (PV)</span><strong class="ak-val">${kpis.pv.toLocaleString('ko-KR')}</strong><small>봇·크롤러 제외 실방문</small></div>
    <div class="card"><span class="ak-label">순 방문 세션 (UV)</span><strong class="ak-val">${kpis.uv.toLocaleString('ko-KR')}</strong><small>일 단위 익명 해시 기준</small></div>
    <div class="card"><span class="ak-label">평균 체류시간</span><strong class="ak-val">${fmtDuration(kpis.avg_dwell)}</strong><small>활성 탭 머문 시간 실측</small></div>
    <div class="card"><span class="ak-label">평균 스크롤 깊이</span><strong class="ak-val">${kpis.avg_scroll}%</strong><small>본문 완독률 지표</small></div>
    <div class="card"><span class="ak-label">시뮬레이터 실행</span><strong class="ak-val">${kpis.calc_runs.toLocaleString('ko-KR')}회</strong><small>익명 세그먼트 누적</small></div>
    <div class="card"><span class="ak-label">저장 · 공유 액션</span><strong class="ak-val">${kpis.shares.toLocaleString('ko-KR')}회</strong><small>링크복사 ${kpis.copy_clicks} · 이미지저장 ${kpis.receipt_downloads}</small></div>
  </section>

  <section class="card admin-sec" style="border:2px solid var(--brand)">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
      <div>
        <span class="pill">고유 고객 데이터 인텔리전스 (개인정보 비저장 익명 구간 집계)</span>
        <h2 class="card-h" style="margin:6px 0 0;font-size:19px">어떤 고객이 우리 서비스를 쓰고 있는가? (업종 · 지역 · 자본금 · 대출수요 분석)</h2>
      </div>
      <span class="bench-src tnum">분석 표본 ${ls.total_meta.toLocaleString('ko-KR')}건</span>
    </div>

    <div class="kpi-grid tnum" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
      <div class="hl"><span>신규 창업·운전자금 대출 필요층</span><strong>${ls.need_loan.toLocaleString('ko-KR')}건 (${needLoanPct}%)</strong></div>
      <div><span>기존 대출 보유 사업자·예비창업자</span><strong>${ls.has_existing_loan.toLocaleString('ko-KR')}건 (${hasExLoanPct}%)</strong></div>
      <div><span>카드론·2금융 보유 (대환 시급층)</span><strong>${ls.has_card_loan.toLocaleString('ko-KR')}건</strong></div>
      <div><span>직접 접수된 상담·리포트·제안</span><strong>${inquiries.length.toLocaleString('ko-KR')}건</strong></div>
    </div>

    <div class="admin-two">
      <div>
        <h3 class="sub-h" style="margin-top:0">고객 관심 창업 업종 TOP 10</h3>
        ${ci.topProfiles.length === 0 ? '<p class="note">아직 집계된 세부 업종 실행 기록이 없습니다. 창업 풀코스 실행 시 실시간 누적됩니다.</p>' : `<ul class="stat-bars tnum">${ci.topProfiles.map((p) => {
          const maxP = Math.max(1, ci.topProfiles[0].cnt);
          return `<li><div class="sb-row"><span>${esc(PROFILE_NAME_MAP[p.profile] || p.profile)}</span><strong>${p.cnt.toLocaleString('ko-KR')}회</strong></div><div class="sb-track"><div class="sb-fill" style="width:${Math.max(4, Math.round(p.cnt / maxP * 100))}%"></div></div></li>`;
        }).join('')}</ul>`}
      </div>
      <div>
        <h3 class="sub-h" style="margin-top:0">창업 희망 지역 & 보유 자기자본 구간</h3>
        ${ci.regions.length === 0 ? '<p class="note">집계 대기 중</p>' : `<ul class="stat-bars tnum" style="margin-bottom:14px">${ci.regions.map((r) => {
          const rName = (E.STARTUP_REGIONS && E.STARTUP_REGIONS[r.region] && E.STARTUP_REGIONS[r.region].name.split('(')[0].trim()) || r.region;
          return `<li><div class="sb-row"><span>${esc(rName)}</span><strong>${r.cnt.toLocaleString('ko-KR')}건</strong></div></li>`;
        }).join('')}</ul>`}
        ${ci.capitalBands.length === 0 ? '' : `<ul class="stat-bars tnum">${ci.capitalBands.map((cb) => `<li><div class="sb-row"><span>자기자본: ${esc(CAP_BAND_LABELS[cb.band] || cb.band)}</span><strong>${cb.cnt.toLocaleString('ko-KR')}건</strong></div></li>`).join('')}</ul>`}
      </div>
    </div>
  </section>

  ${daily.length ? `
  <section class="card admin-sec">
    <h2 class="card-h">일별 조회수(PV) · 순방문(UV) 추이 (KST)</h2>
    <div class="daily-bars tnum">
      ${daily.map((d) => {
        const hPct = Math.max(4, Math.round((d.pv / maxDailyPv) * 100));
        return `<div class="d-col"><span class="d-num">${d.pv}</span><div class="d-bar-wrap"><div class="d-bar" style="height:${hPct}%"></div></div><span class="d-day">${esc(d.day)}</span><small>UV ${d.uv}</small></div>`;
      }).join('')}
    </div>
  </section>` : ''}

  <div class="admin-two">
    <section class="card admin-sec">
      <h2 class="card-h">인기 페이지 TOP 20 (조회수 · 체류시간 · 스크롤)</h2>
      ${topPages.length === 0 ? '<p class="note">아직 집계된 방문 데이터가 없습니다.</p>' : `
      <div class="table-scroll">
        <table class="mini-table admin-table tnum">
          <thead><tr><th>순위 · 페이지</th><th>조회수</th><th>방문자</th><th>평균 체류</th><th>스크롤</th></tr></thead>
          <tbody>
            ${topPages.map((p, idx) => `<tr>
              <th><a href="${esc(p.path)}" target="_blank">${idx + 1}. ${esc(resolvePageTitle(p.path, ctx))}</a><small class="path-sub">${esc(p.path)}</small></th>
              <td>${p.pv.toLocaleString('ko-KR')}</td>
              <td>${p.uv.toLocaleString('ko-KR')}</td>
              <td>${fmtDuration(p.avg_dwell)}</td>
              <td>${p.avg_scroll}%</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
    </section>

    <div class="admin-side">
      <section class="card admin-sec">
        <h2 class="card-h">유입 채널 & UTM 홍보 캠페인 성과</h2>
        ${sources.length === 0 ? '<p class="note">집계 대기 중</p>' : `<ul class="stat-bars tnum">${sources.map((s) => {
          const p = Math.round((s.cnt / totalSrc) * 100);
          return `<li><div class="sb-row"><span>${esc(SOURCE_LABELS[s.ref_source] || s.ref_source)}</span><strong>${s.cnt.toLocaleString('ko-KR')}건 (${p}%)</strong></div><div class="sb-track"><div class="sb-fill" style="width:${Math.max(3, p)}%"></div></div></li>`;
        }).join('')}</ul>`}
        ${ci.utmCampaigns.length ? `<h3 class="sub-h">UTM 캠페인별 유입</h3><ul class="stat-bars tnum">${ci.utmCampaigns.map((u) => `<li><div class="sb-row"><span>${esc(u.utm_source)} / ${esc(u.utm_campaign)}</span><strong>${u.cnt}건</strong></div></li>`).join('')}</ul>` : ''}
        <h3 class="sub-h">기기 비율</h3>
        <ul class="stat-bars tnum">${devices.map((d) => {
          const p = Math.round((d.cnt / totalDev) * 100);
          return `<li><div class="sb-row"><span>${d.device === 'mobile' ? '모바일' : '데스크톱(PC)'}</span><strong>${d.cnt.toLocaleString('ko-KR')} (${p}%)</strong></div></li>`;
        }).join('')}</ul>
      </section>

      <section class="card admin-sec">
        <h2 class="card-h">시뮬레이터별 실행 인기 순위</h2>
        ${calculators.length === 0 ? '<p class="note">최근 기간 계산기 실행 내역 없음</p>' : `<ul class="stat-bars tnum">${calculators.map((c) => {
          const meta = CALCULATORS.find((x) => x.slug === c.calculator);
          const lbl = c.calculator === 'loan-diagnose' ? '사업자 대출 한도·금리 진단' : (meta ? meta.short : c.calculator);
          return `<li><div class="sb-row"><span>${esc(lbl)}</span><strong>${c.runs.toLocaleString('ko-KR')}회</strong></div></li>`;
        }).join('')}</ul>`}
      </section>
    </div>
  </div>

  <div class="admin-two">
    <section class="card admin-sec">
      <h2 class="card-h">차기 계산기 고객 공감 투표 순위 (/requests)</h2>
      <ul class="stat-bars tnum">
        ${ci.topToolVotes.map((t, i) => `<li><div class="sb-row"><span><strong>${i + 1}위.</strong> ${esc(t.title)}</span><strong>${Number(t.votes).toLocaleString('ko-KR')}표</strong></div></li>`).join('')}
      </ul>
      ${ci.customToolIdeas.length ? `<h3 class="sub-h">고객 직접 신청 계산기 아이디어 (${ci.customToolIdeas.length}건)</h3><ul class="inq-list">${ci.customToolIdeas.map((idea) => `<li><div class="inq-meta"><span class="pill">${esc(idea.category_label)}</span><strong>${esc(idea.title)}</strong></div><p class="inq-msg">${esc(idea.desc_text)}</p></li>`).join('')}</ul>` : ''}
    </section>

    <section class="card admin-sec">
      <h2 class="card-h">최근 자금상담 · 상권리포트 · 계산기제안 · 제보 접수함 (${inquiries.length}건)</h2>
      ${inquiries.length === 0 ? '<p class="note">/funding · /commercial-area · /requests · /contact 폼으로 접수된 내역이 여기에 표시됩니다.</p>' : `<ul class="inq-list">${inquiries.map((q) => `<li>
        <div class="inq-meta"><span class="pill">${esc(q.category)}</span><strong>${esc(q.email)}</strong><small>${esc(String(q.created_at).slice(0, 16).replace('T', ' '))}</small></div>
        ${q.page_url ? `<p class="inq-url">경로: ${esc(q.page_url)}</p>` : ''}
        <p class="inq-msg">${esc(q.message)}</p>
      </li>`).join('')}</ul>`}
    </section>
  </div>

  <section class="card admin-sec">
    <h2 class="card-h">[내부 분석 전용] 6대 고객군(페르소나)별 니즈 · 트래픽 모니터링</h2>
    <div class="table-scroll">
      <table class="mini-table admin-table">
        <thead><tr><th>내부 페르소나 분류</th><th style="text-align:left">핵심 모니터링 질문</th><th>연계 트래픽 지수</th><th style="text-align:left">핵심 연결 도구</th></tr></thead>
        <tbody>
          ${PERSONAS.map((ps) => {
            const matchPaths = ps.mustDoNow.map((m) => m.href.split('#')[0].split('?')[0]);
            const score = topPages.filter((tp) => matchPaths.includes(tp.path)).reduce((a, b) => a + b.pv, 0);
            return `<tr>
              <th><strong>${esc(ps.adminLabel || ps.badge)}</strong><span class="path-sub">고객 노출명: ${esc(ps.tabLabel)}</span></th>
              <td style="text-align:left;font-weight:500;font-size:13px">${esc(ps.monitoredQuestions[0])}</td>
              <td class="tnum">${score.toLocaleString('ko-KR')} PV</td>
              <td style="text-align:left;font-size:12.5px"><a href="${esc(ps.mustDoNow[0].href)}" target="_blank">${esc(ps.mustDoNow[0].label)}</a></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </section>

  <section class="card admin-sec">
    <h2 class="card-h">외부 분석·수익화 도구 연동 현황</h2>
    <ul class="env-list">
      ${envItems.map(([name, ok, detail]) => `<li><span class="env-dot ${ok ? 'on' : 'off'}">${ok ? '활성' : '대기'}</span><div><strong>${esc(name)}</strong><small>${esc(detail)}</small></div></li>`).join('')}
    </ul>
  </section>
</div>`;
}

module.exports = { loginView, dashboardView };
