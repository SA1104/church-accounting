'use strict';
const { esc, CALCULATORS } = require('./layout');
const { icon } = require('./icons');

const SOURCE_LABELS = {
  google: 'Google 검색',
  naver: 'Naver 검색',
  threads_insta: 'Threads · Instagram',
  kakao: '카카오톡 · 다음',
  ai_search: 'AI 검색 (ChatGPT·Perplexity)',
  youtube: 'YouTube',
  other: '기타 외부 링크',
  direct: '직접 접속 · 공유링크'
};

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
  if (pathStr === '/funding') return '[자금라운지] 사업자 대출 · 정책자금 전략 라운지';
  if (pathStr === '/commercial-area') return '[상권Lab] 상권 · 입지 컨설팅 Lab';
  if (pathStr === '/bible') return '실전 바이블 전체 목록';
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
    <h1>BoozaThink Site Kit 상황판</h1>
    <p class="lead">실시간 조회수, 평균 체류시간, 인기 시뮬레이터·바이블 순위, 유입 경로, 자금상담·상권리포트·제보 접수 내역을 한눈에 확인합니다.</p>
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
  const { days, kpis, daily, topPages, sources, devices, calculators, inquiries, storage } = data;
  const maxDailyPv = Math.max(1, ...daily.map((d) => d.pv));
  const totalSrc = Math.max(1, sources.reduce((a, s) => a + s.cnt, 0));
  const totalDev = Math.max(1, devices.reduce((a, d) => a + d.cnt, 0));

  const envItems = [
    ['자체 내장 분석 (Supabase)', storage === 'supabase-pg', storage === 'supabase-pg' ? '실시간 적재 중 (RLS ON)' : '로컬 메모리 모드'],
    ['Google Analytics 4 (GA_MEASUREMENT_ID)', envStatus.ga4, envStatus.ga4 ? envStatus.ga4Id : '미설정 (환경변수 추가 시 자동 활성)'],
    ['Google Search Console (GOOGLE_SITE_VERIFICATION)', envStatus.gsc, envStatus.gsc ? '소유권 메타태그 활성' : '미설정'],
    ['네이버 서치어드바이저 (NAVER_SITE_VERIFICATION)', envStatus.naver, envStatus.naver ? '소유권 메타태그 활성' : '미설정'],
    ['Microsoft Clarity 히트맵 (CLARITY_PROJECT_ID)', envStatus.clarity, envStatus.clarity ? '세션 리플레이 활성' : '미설정'],
    ['Google AdSense (ADSENSE_CLIENT)', envStatus.adsense, envStatus.adsense ? '스크립트 + /ads.txt 활성' : '심사 신청 시 ca-pub-... 입력']
  ];

  return `
<div class="container admin-wrap">
  <header class="admin-head">
    <div>
      <span class="pill">${icon('chart', 14)} BoozaThink Site Kit · ${storage === 'supabase-pg' ? 'Live Supabase' : 'Local Memory'}</span>
      <h1>실시간 방문 · 체류 · 인기 페이지 상황판</h1>
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
    <div class="card"><span class="ak-label">시뮬레이터 실행</span><strong class="ak-val">${kpis.calc_runs.toLocaleString('ko-KR')}회</strong><small>${CALCULATORS.length}대 계산기 연산 수</small></div>
    <div class="card"><span class="ak-label">바이럴 공유 액션</span><strong class="ak-val">${kpis.shares.toLocaleString('ko-KR')}회</strong><small>링크복사 ${kpis.copy_clicks} · 영수증 ${kpis.receipt_downloads}</small></div>
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
      ${topPages.length === 0 ? '<p class="note">아직 집계된 방문 데이터가 없습니다. 일반 브라우저에서 페이지를 둘러보면 즉시 기록됩니다.</p>' : `
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
        <h2 class="card-h">유입 채널 분포</h2>
        ${sources.length === 0 ? '<p class="note">집계 대기 중</p>' : `<ul class="stat-bars tnum">${sources.map((s) => {
          const p = Math.round((s.cnt / totalSrc) * 100);
          return `<li><div class="sb-row"><span>${esc(SOURCE_LABELS[s.ref_source] || s.ref_source)}</span><strong>${s.cnt.toLocaleString('ko-KR')}건 (${p}%)</strong></div><div class="sb-track"><div class="sb-fill" style="width:${Math.max(3, p)}%"></div></div></li>`;
        }).join('')}</ul>`}
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
          return `<li><div class="sb-row"><span>${esc(meta ? meta.short : c.calculator)}</span><strong>${c.runs.toLocaleString('ko-KR')}회</strong></div></li>`;
        }).join('')}</ul>`}
      </section>
    </div>
  </div>

  <div class="admin-two">
    <section class="card admin-sec">
      <h2 class="card-h">외부 분석·수익화 도구 연동 현황</h2>
      <ul class="env-list">
        ${envItems.map(([name, ok, detail]) => `<li><span class="env-dot ${ok ? 'on' : 'off'}">${ok ? '활성' : '대기'}</span><div><strong>${esc(name)}</strong><small>${esc(detail)}</small></div></li>`).join('')}
      </ul>
      <p class="note">Render 대시보드 Environment 탭에 해당 키를 입력하면 코드 수정 없이 자동 활성화됩니다.</p>
    </section>

    <section class="card admin-sec">
      <h2 class="card-h">최근 자금상담 · 상권리포트 · 제보 접수함 (${inquiries.length}건)</h2>
      ${inquiries.length === 0 ? '<p class="note">/funding · /commercial-area · /contact 폼으로 접수된 신청이 여기에 표시됩니다.</p>' : `<ul class="inq-list">${inquiries.map((q) => `<li>
        <div class="inq-meta"><span class="pill">${esc(q.category)}</span><strong>${esc(q.email)}</strong><small>${esc(String(q.created_at).slice(0, 16).replace('T', ' '))}</small></div>
        ${q.page_url ? `<p class="inq-url">관련 URL: ${esc(q.page_url)}</p>` : ''}
        <p class="inq-msg">${esc(q.message)}</p>
      </li>`).join('')}</ul>`}
    </section>
  </div>
</div>`;
}

module.exports = { loginView, dashboardView };
