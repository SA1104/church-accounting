'use strict';
/**
 * BoozaThink 2.0 — SSR Hybrid Express Server (6 Simulators + Site-Kit Analytics + 2026↔2027 Intelligence)
 * Render: Build `cd backend && npm install` · Start `cd backend && node server.js`
 * Health: GET /__platform_health_check__ → 200 {"status":"healthy"}
 */
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const compression = require('compression');

const content = require('./data');
const layout = require('./views/layout');
const calcViews = require('./views/calculators');
const startupView = require('./views/startup-view');
const fundingViews = require('./views/funding');
const commercialViews = require('./views/commercial');
const calendarViews = require('./views/calendar');
const startGuideViews = require('./views/start-guide');
const requestsViews = require('./views/requests');
const datasetsViews = require('./views/datasets');
const pages = require('./views/pages');
const seo = require('./views/seo');
const adminViews = require('./views/admin');
const fx = require('./lib/fx');
const rates = require('./lib/rates');
const db = require('./lib/db');
const simGuard = require('./lib/sim-guard');
const facts = require('./data/facts');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const STARTED_AT = new Date().toISOString();
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'Booza2027!Admin';
const COOKIE_SECRET = process.env.JWT_SECRET || 'boozathink-admin-hmac-2027';

app.disable('x-powered-by');
app.set('trust proxy', true);
app.set('etag', 'strong');

// ── 1. 헬스체크: 어떤 미들웨어보다 먼저, 즉시 200 ──
app.get('/__platform_health_check__', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'healthy' });
});

app.use(compression({ threshold: 512 }));

// ── 2. 보안 헤더 ──
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  next();
});

// ── 3. www → apex, 트레일링 슬래시 정규화 ──
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (/^www\.boozathink\.com$/i.test(host)) return res.redirect(301, 'https://boozathink.com' + req.originalUrl);
  if (req.path.length > 1 && req.path.endsWith('/') && req.method === 'GET') {
    const q = req.originalUrl.slice(req.path.length);
    return res.redirect(301, req.path.replace(/\/+$/, '') + q);
  }
  next();
});

// ── 4. 정적 자원 (gzip + Cache-Control) ──
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  maxAge: '7d',
  setHeaders(res, filePath) {
    if (/\.(css|js)$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    if (/\.(png|jpg|svg|ico|webp)$/.test(filePath)) res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  }
}));

// ── 5. SSR 헬퍼 ──
const HTML_CACHE = 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400';
function send(res, opts, status) {
  res.status(status || 200);
  res.set('Content-Type', 'text/html; charset=utf-8');
  if (opts.noindex) res.set('X-Robots-Tag', 'noindex, nofollow');
  if (opts.noCache) res.set('Cache-Control', 'no-store');
  else res.set('Cache-Control', HTML_CACHE);
  if (opts.scripts && opts.scripts.length && !opts.simToken) {
    opts.simToken = simGuard.issueSimToken();
  }
  res.send(layout.render(opts, content.categories));
}

// 홈
app.get('/', (req, res) => {
  const v = pages.home(content);
  send(res, {
    fullTitle: 'BoozaThink | 창업 풀코스 손익 설계 · 사업자 대출·정책자금 · 배달·셀러·세무 연구소',
    description: layout.SITE.description,
    path: '/',
    jsonld: v.jsonld,
    body: v.body,
    current: 'home',
    scripts: ['/js/bt-client.js?v=' + layout.ASSET_V, '/js/mini-calc.js?v=' + layout.ASSET_V]
  });
});

// 개인사업자 계약 전 ~ 첫 1년 할 일 순서표
app.get('/start-guide', (req, res) => {
  const v = startGuideViews.startGuideView(req.query);
  send(res, {
    title: '계약 전부터 첫 세금 신고까지 — 개인사업자 1년 할 일 순서표 (사업자등록·통장·카드·부가세·종소세)',
    description: '상가 계약 전 정화조·전기 확인과 방어 문구부터 일반과세 사업자등록, 사업자 통장·카드 홈택스 등록, 한전 부가세 전환, 조기환급, 원천세, 부가세, 노란우산, 5월 종소세까지 1년의 전 과정을 쉬운 그림과 순서표로 안내합니다.',
    path: '/start-guide',
    jsonld: v.jsonld,
    body: v.body,
    current: 'start-guide',
    noCache: Object.keys(req.query).length > 0
  });
});

// 필요한 계산기 신청 · 우선 제작 투표
app.get('/requests', async (req, res) => {
  const items = await db.getPublicToolRequests();
  const v = requestsViews.requestsView(items);
  send(res, {
    title: '필요한 계산기 신청 · 우선 제작 투표 — 사장님의 고민을 계산기로 만들어 드립니다',
    description: '프랜차이즈 vs 개인창업 비교, 퇴직금 적립, 공동창업 지분 설계, 법인 전환 등 다음으로 가장 필요한 계산기에 투표하거나 원하는 새 계산기와 세부 업종을 직접 신청하세요.',
    path: '/requests',
    jsonld: v.jsonld,
    body: v.body,
    current: 'requests',
    noCache: true
  });
});

// 업종별 평균 비용 · 세율 · 금리 공개 기준표
app.get('/datasets', async (req, res) => {
  const liveIdx = await datasetsViews.buildLiveBenchmarkDataset(db);
  const v = datasetsViews.datasetsView(liveIdx);
  send(res, {
    title: '업종별 평균 비용 · 세율 · 금리 공개 기준표 — 30대 창업 업종 데이터 모음',
    description: '대한민국 30대 창업 업종 평균 초기비용·원가율·계절 변화, 소상공인 세법·4대보험·대출금리 기준, 개인사업자 1년 할 일 순서표를 엑셀(CSV)·JSON으로 투명하게 공개합니다.',
    path: '/datasets',
    jsonld: v.jsonld,
    body: v.body,
    current: 'datasets'
  });
});

// 사업자 대출 · 정책자금 전략 라운지
app.get('/funding', (req, res) => {
  const v = fundingViews.fundingView(req.query);
  send(res, {
    title: '사업자 대출 · 정책자금 전략 라운지 — 금융권 평균 금리 비교 & 최저금리 한도 진단',
    description: '정책자금·지역신보 이차보전·4.5% 대환·제1금융권 담보/신용·증권사 담보대출·인터넷은행 평균 금리를 비교하고, 내 사업장 조건의 대출 가능 한도와 가장 이자가 싼 조달 순서를 진단합니다.',
    path: '/funding',
    jsonld: v.jsonld,
    body: v.body,
    bodyClass: 'page-calc',
    current: 'funding',
    noCache: Object.keys(req.query).length > 0,
    scripts: ['/js/bt-client.js?v=' + layout.ASSET_V, '/js/mini-calc.js?v=' + layout.ASSET_V, '/js/calc-core.js?v=' + layout.ASSET_V, '/js/calc-loan-diagnose.js?v=' + layout.ASSET_V]
  });
});

// 사업자 12개월 세무·노무·정책자금 생존 캘린더
app.get('/calendar', (req, res) => {
  const v = calendarViews.calendarView();
  send(res, {
    title: '사업자 12개월 세무 · 노무 · 정책자금 생존 캘린더 — 월별 신고 기한 & 공고 오픈 일정',
    description: '1월·7월 부가가치세, 2월 면세 현황신고, 3월 스마트상점 보조금, 5월 종합소득세, 8월 최저임금 고시, 11월 중간예납, 12월 노란우산 절세 마감까지 1년 12개월 사업자 필수 데드라인 캘린더.',
    path: '/calendar',
    jsonld: v.jsonld,
    body: v.body,
    current: 'calendar'
  });
});

// 상권 · 입지 · 경쟁가게 분석
app.get('/commercial-area', (req, res) => {
  const v = commercialViews.commercialView(req.query);
  send(res, {
    title: '우리 동네 상권 · 입지 · 경쟁가게 분석 — 손님 연령대 & 주변 경쟁점 확인',
    description: '들어가려는 상권 유형과 업종·반경을 선택하면 주요 소비 연령대 분포, 손님 몰리는 시간대, 주변 동종 경쟁가게 수와 살아남는 운영 방법을 알려드립니다.',
    path: '/commercial-area',
    jsonld: v.jsonld,
    body: v.body,
    current: 'commercial',
    noCache: Object.keys(req.query).length > 0
  });
});

// 계산기 목록
app.get('/calculators', (req, res) => {
  const v = calcViews.index(content);
  send(res, {
    title: '창업 풀코스 설계 & 6대 상황별 손익·세무·정책자금 계산기',
    description: '업종별 12개월 계절 손익 창업 풀코스 설계부터 배달앱 순수익, 스마트스토어·쿠팡 손익분기 ROAS, 정책자금 매칭, 주휴수당 절벽·무인화 회수, 부가세·종소세 실수령, 상가 환산보증금·BEP 계산기.',
    path: '/calculators',
    jsonld: v.jsonld,
    body: v.body
  });
});

const CALC_ROUTES = {
  'startup-master': { view: startupView.startupMasterView, current: 'startup-master', title: '창업 풀코스 A-to-Z 시뮬레이터 — 30대 업종 초기자금 · 12개월 계절 손익 · 대출원리금 통합 설계', desc: '30대 창업 업종별 보증금·인테리어·권리금·스마트상점 국비보조, 계절별 12개월 매출 변동, 부가세·종합소득세, 정책자금 대출 원리금까지 1년 실수익을 빈틈없이 계산합니다.' },
  'delivery-margin': { view: calcViews.delivery, title: '배달앱 진짜 순수익 계산기 — 배민·쿠팡이츠·요기요 수수료 & 목표 마진 메뉴가 역산', desc: '업종별 표준 원가율 비교와 함께 배민 상생요금제·쿠팡이츠·요기요 수수료, 배달비, 결제수수료, 부가세를 뺀 1주문 순수익과 목표 마진 메뉴 가격을 즉시 계산합니다.' },
  'seller-roas': { view: calcViews.seller, title: '셀러 마진 & 손익분기 ROAS 계산기 — 스마트스토어·쿠팡 로켓그로스·윙', desc: '위안화·달러 환율 연동 사입원가, 스마트스토어·쿠팡 수수료, 반품 손실을 반영해 광고 전 순마진, 손익분기 ROAS, 최대 CPA, 손익분기 CPC를 판독합니다.' },
  'policy-funds': { view: calcViews.policy, title: '소상공인 정책자금 매칭기 — 4.5% 대환대출 · 스마트상점 보조금 계산', desc: '업종·업력·매출·고금리 대출로 소진공·중진공·지역신보·희망리턴패키지 지원사업을 매칭하고 4.5% 대환 이자 절감액과 스마트상점 자부담을 계산합니다.' },
  'labor-automation': { view: calcViews.labor, title: '최저시급 주휴수당 15시간 절벽 vs 테이블오더 무인화 원금회수 계산기', desc: '최신 최저임금 및 4대보험 확정 고시 기준 주 14.5시간 vs 15시간 인건비 절벽과 무인기기 도입 시 원금회수 개월 수를 비교합니다.' },
  'vat-income-tax': { view: calcViews.vatIncome, title: '개인사업자 부가세(간이·일반) & 종합소득세·노란우산 실수령 계산기', desc: '간이·일반과세 부가가치세 비교(4,800만 면제·1억400만 기준·카드 1.3% 공제)부터 종합소득세 8단계 누진세율, 노란우산 절세액, 세후 월 실수령액까지 통합 계산합니다.' },
  'store-rent-breakeven': { view: calcViews.storeLease, title: '상가 월세·환산보증금 5% 상한 판독 & 매장 손익분기점·권리금 회수 계산기', desc: '상가건물 임대차보호법 지역별 환산보증금(서울 9억·과밀 6.9억 등) 5% 상한 보호 여부와 일 손익분기 매출(BEP), 권리금·인테리어 원금회수 기간을 계산합니다.' }
};
app.get('/calculators/:slug', (req, res, next) => {
  const r = CALC_ROUTES[req.params.slug];
  if (!r) return next();
  const v = r.view(req.query, content);
  send(res, {
    title: r.title, description: r.desc, path: '/calculators/' + req.params.slug, jsonld: v.jsonld, body: v.body, bodyClass: 'page-calc',
    current: r.current || 'calc',
    noCache: Object.keys(req.query).length > 0,
    scripts: ['/js/bt-client.js?v=' + layout.ASSET_V, '/js/calc-core.js?v=' + layout.ASSET_V, '/js/calc-' + req.params.slug + '.js?v=' + layout.ASSET_V]
  });
});

// 카테고리
app.get('/category/:slug', (req, res, next) => {
  const cat = content.categoryBySlug[req.params.slug];
  if (!cat) return next();
  const v = pages.category(cat, content);
  send(res, { title: `${cat.name} — 실전 바이블 ${(content.byCategory[cat.slug] || []).length}편`, description: cat.description, path: '/category/' + cat.slug, jsonld: v.jsonld, body: v.body, current: 'cat:' + cat.slug });
});

// 바이블
app.get('/bible', (req, res) => {
  const v = pages.bibleIndex(content);
  send(res, { title: '사장님·셀러 실전 손익 바이블 전체 목록', description: '배달·외식 손익, 스마트스토어·쿠팡 셀러 마진, 소상공인 정책자금, 인건비·세무 실전 바이블을 원 단위 계산 예시와 사례로 정리했습니다.', path: '/bible', jsonld: v.jsonld, body: v.body });
});
app.get('/bible/:slug', (req, res, next) => {
  const a = content.bySlug[req.params.slug];
  if (!a) return next();
  const v = pages.article(a, content);
  send(res, {
    title: a.title, description: a.description, path: '/bible/' + a.slug, type: 'article', jsonld: v.jsonld, body: v.body, keywords: a.keywords,
    published: a.publishedAt, modified: a.updatedAt, current: 'cat:' + a.category, bodyClass: 'page-article',
    scripts: ['/js/bt-client.js?v=' + layout.ASSET_V, '/js/mini-calc.js?v=' + layout.ASSET_V]
  });
});
app.get('/article/:slug', (req, res) => res.redirect(301, '/bible/' + encodeURIComponent(req.params.slug)));

// 법적 페이지
const LEGAL = {
  about: [pages.about, 'BoozaThink 연구소 소개 · 편집 원칙 · 공공데이터 출처', 'BoozaThink 손익 연구소의 미션, 편집 원칙, 공식 공공데이터 참조 출처와 수식 검증 방식을 소개합니다.'],
  'privacy-policy': [pages.privacy, '개인정보처리방침', 'BoozaThink 개인정보처리방침: 시뮬레이터 입력값 비저장 원칙, 익명 방문·벤치마크 통계, GA4 및 Google AdSense 쿠키 안내, 이용자 권리.'],
  'terms-of-service': [pages.terms, '이용약관 · 시뮬레이션 면책조항', 'BoozaThink 이용약관: 세무·노무·임대차·대출 시뮬레이션 결과의 성격과 법적 면책조항, 지식재산권 정책.'],
  contact: [pages.contact, '제휴 및 오류 제보', 'BoozaThink 제휴 문의 및 수수료율·세법·계산식·정책자금 공고 업데이트 온라인 제보 창구입니다.']
};
Object.entries(LEGAL).forEach(([slug, [fn, title, desc]]) => {
  app.get('/' + slug, (req, res) => {
    const v = fn(content);
    send(res, { title, description: desc, path: '/' + slug, jsonld: v.jsonld, body: v.body });
  });
});

// SEO / GEO / AdSense ads.txt
app.get('/sitemap.xml', (req, res) => { res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(seo.sitemap(content)); });
app.get('/robots.txt', (req, res) => { res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(seo.robots()); });
app.get('/llms.txt', (req, res) => { res.type('text/markdown; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(seo.llms(content)); });
app.get('/llms-full.txt', (req, res) => res.redirect(301, '/llms.txt'));
if (process.env.ADSENSE_CLIENT) {
  app.get('/ads.txt', (req, res) => res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(`google.com, ${process.env.ADSENSE_CLIENT.trim().replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`));
}

// ── Admin (Site-Kit 상황판 · 검색엔진 완전 비노출) ──
function makeAdminToken() {
  return crypto.createHmac('sha256', COOKIE_SECRET).update('bt-admin:' + ADMIN_PASSCODE).digest('hex');
}
function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}
function isAdminAuthed(req) {
  const cookies = parseCookies(req.headers.cookie);
  const tok = cookies.bt_admin || '';
  const expected = makeAdminToken();
  if (tok.length !== expected.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(tok), Buffer.from(expected)); } catch (e) { return false; }
}

const loginAttempts = new Map();
function isLoginBlocked(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { n: 0, t: now };
  if (now - rec.t > 600000) { rec.n = 0; rec.t = now; }
  rec.n++;
  loginAttempts.set(ip, rec);
  if (loginAttempts.size > 2000) loginAttempts.clear();
  return rec.n > 8;
}

app.get('/admin', async (req, res) => {
  if (!isAdminAuthed(req)) {
    return send(res, { title: '관리자 로그인', path: '/admin', body: adminViews.loginView(req.query.err ? '패스코드가 올바르지 않습니다.' : ''), noindex: true, noCache: true, skipAnalytics: true });
  }
  const summary = await db.getAnalyticsSummary(req.query.days);
  const envStatus = {
    ga4: Boolean(process.env.GA_MEASUREMENT_ID),
    ga4Id: process.env.GA_MEASUREMENT_ID || '',
    gsc: Boolean(process.env.GOOGLE_SITE_VERIFICATION),
    naver: Boolean(process.env.NAVER_SITE_VERIFICATION),
    clarity: Boolean(process.env.CLARITY_PROJECT_ID),
    adsense: Boolean(process.env.ADSENSE_CLIENT)
  };
  send(res, { title: 'Site Kit 상황판', path: '/admin', body: adminViews.dashboardView(summary, content, envStatus), noindex: true, noCache: true, skipAnalytics: true });
});

app.post('/admin/login', express.urlencoded({ extended: false, limit: '4kb' }), (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  if (isLoginBlocked(req.ip)) return res.status(429).type('text/plain').send('로그인 시도가 너무 많습니다. 10분 후 다시 시도해 주세요.');
  const input = String((req.body && req.body.passcode) || '');
  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_PASSCODE);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.redirect(303, '/admin?err=1');
  const secureFlag = req.secure || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `bt_admin=${makeAdminToken()}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=604800${secureFlag}`);
  res.redirect(303, '/admin');
});

app.post('/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'bt_admin=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0');
  res.redirect(303, '/admin');
});

// ── API ──
app.use('/api', express.json({ limit: '12kb', type: ['application/json', 'text/plain'] }));

app.get('/api/version', (req, res) => {
  res.set('Cache-Control', 'no-store').json({
    app: 'BoozaThink 2.0',
    version: '2.7.0',
    simulators: layout.CALCULATORS.length,
    articles: content.articles.length,
    branch: process.env.RENDER_GIT_BRANCH || 'main',
    commitSha: process.env.RENDER_GIT_COMMIT || 'local',
    startedAt: STARTED_AT
  });
});

app.get('/api/fx', (req, res) => { res.set('Cache-Control', 'public, max-age=300').json(fx.publicRates()); });
app.get('/api/rates', (req, res) => { res.set('Cache-Control', 'public, max-age=300').json(rates.getMarketRatesSummary()); });

// ── 서버 전용 블랙박스 계산 API (서명 토큰 + 출처 검증 + 자동화 수집 차단) ──
app.post('/api/sim/eval', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const guard = simGuard.verifySimRequest(req, 180);
  if (!guard.ok) return res.status(guard.status).json({ ok: false, error: guard.error });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const out = simGuard.evaluateSimulatorPayload(body);
    return res.status(out.ok ? 200 : 400).json(out);
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'invalid simulation payload' });
  }
});

app.get('/api/sim/profile/:id', (req, res) => {
  res.set('Cache-Control', 'private, max-age=300');
  const guard = simGuard.verifySimRequest(req, 120);
  if (!guard.ok) return res.status(guard.status).json({ ok: false, error: guard.error });
  const out = simGuard.getSingleStartupProfileDefaults(
    String(req.params.id || '').slice(0, 48),
    String(req.query.region || 'recommend').slice(0, 32),
    String(req.query.intmode || 'turnkey').slice(0, 16)
  );
  return res.json({ ok: true, ...out });
});

// 일괄 원본 데이터 파일 추출 차단 (웹 기준표 /datasets 로 안내)
app.use('/api/datasets', (req, res) => {
  res.set('Cache-Control', 'no-store').status(403).json({
    ok: false,
    error: '원본 데이터 일괄 파일 제공이 종료되었습니다. 웹 기준표(https://boozathink.com/datasets) 및 시뮬레이터를 이용해 주세요.'
  });
});

const hits = new Map();
function rateLimited(key, limitPerMin) {
  const now = Date.now();
  const h = hits.get(key) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++;
  hits.set(key, h);
  if (hits.size > 5000) hits.clear();
  return h.n > (limitPerMin || 40);
}

app.post('/api/biz/collect', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rateLimited('c:' + req.ip, 90)) return res.status(204).end();
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    await db.collectEvent(body, { ip: req.ip, ua: req.headers['user-agent'] || '' });
  } catch (e) { /* swallow beacon parse errors */ }
  res.status(204).end();
});

app.post('/api/biz/contact', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rateLimited('q:' + req.ip, 5)) return res.status(429).json({ ok: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
  const body = req.body || {};
  if (body.website) return res.json({ ok: true }); // 스팸 봇 허니팟
  try {
    const out = await db.createInquiry(body);
    res.status(out.ok ? 200 : 400).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: '접수 처리 중 일시적인 오류가 발생했습니다.' });
  }
});

app.post('/api/biz/tool-vote', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rateLimited('v:' + req.ip, 25)) return res.status(429).json({ ok: false, error: '잠시 후 다시 시도해 주세요.' });
  try {
    const out = await db.voteToolRequest((req.body && req.body.slug) || '', { ip: req.ip, ua: req.headers['user-agent'] || '' });
    res.status(out.ok ? 200 : 400).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: '공감 반영 중 일시적인 오류가 발생했습니다.' });
  }
});

app.post('/api/biz/tool-request', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rateLimited('tr:' + req.ip, 5)) return res.status(429).json({ ok: false, error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' });
  const body = req.body || {};
  if (body.website) return res.json({ ok: true }); // 스팸 봇 허니팟
  try {
    const out = await db.submitToolRequest(body);
    res.status(out.ok ? 200 : 400).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: '접수 처리 중 일시적인 오류가 발생했습니다.' });
  }
});

app.post('/api/biz/benchmark', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rateLimited('b:' + req.ip, 35)) return res.status(429).json({ ok: false, error: 'too many requests' });
  try {
    const out = await db.record(req.body || {});
    res.status(out.ok ? 200 : 400).json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: 'benchmark unavailable' });
  }
});
app.get('/api/biz/benchmark', (req, res) => res.status(405).json({ ok: false, error: 'use POST with {calculator, industry, metric}' }));

app.get('/api/biz/db-status', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const s = await db.rlsStatus();
  res.json({ ...s, migrated: db.state().migrated, startedAt: STARTED_AT, simulators: layout.CALCULATORS.length, articles: content.articles.length, dataVerifiedAt: facts.VERIFIED_AT });
});
app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'not found' }));

// 404
app.use((req, res) => {
  const v = pages.notFound();
  send(res, { title: '페이지를 찾을 수 없습니다', path: req.path, body: v.body, noindex: true, noCache: true }, 404);
});

// 에러 핸들러
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[error]', req.method, req.url, err && err.stack);
  if (res.headersSent) return;
  res.status(500).type('text/plain').send('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BoozaThink] listening on 0.0.0.0:${PORT} · simulators=${layout.CALCULATORS.length} · articles=${content.articles.length} · fx=${fx.getRates().mode}`);
    db.init().then((s) => console.log('[db]', JSON.stringify({ enabled: s.enabled, connected: s.connected, migrated: s.migrated, projectRef: s.projectRef, error: s.lastError })));
  });
}

module.exports = app;
