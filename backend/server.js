'use strict';
/**
 * BoozaThink 2.0 — SSR Hybrid Express Server
 * Render: Build `cd backend && npm install` · Start `cd backend && node server.js`
 * Health: GET /__platform_health_check__ → 200 {"status":"healthy"}
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const compression = require('compression');

const content = require('./data');
const layout = require('./views/layout');
const calcViews = require('./views/calculators');
const pages = require('./views/pages');
const seo = require('./views/seo');
const fx = require('./lib/fx');
const db = require('./lib/db');
const facts = require('./data/facts');

const app = express();
const PORT = Number(process.env.PORT) || 10000;
const STARTED_AT = new Date().toISOString();

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

// 정책자금 프로그램 마스터 → 클라이언트 매칭 카드 렌더링용
app.get('/js/calc-policy-data.js', (req, res) => {
  res.type('application/javascript').set('Cache-Control', 'public, max-age=3600');
  res.send('window.__PROGRAMS__=' + JSON.stringify(facts.POLICY_PROGRAMS.map(({ match, ...p }) => p)).replace(/</g, '\\u003c') + ';');
});

// ── 5. SSR 헬퍼 ──
const HTML_CACHE = 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400';
function send(res, opts, status) {
  res.status(status || 200);
  res.set('Content-Type', 'text/html; charset=utf-8');
  if (!opts.noCache) res.set('Cache-Control', HTML_CACHE);
  res.send(layout.render(opts, content.categories));
}

// 홈
app.get('/', (req, res) => {
  const v = pages.home(content);
  send(res, { fullTitle: 'BoozaThink | 사장님·셀러 손익 연구소 — 배달앱 순수익·손익분기 ROAS·정책자금 계산기', description: layout.SITE.description, path: '/', jsonld: v.jsonld, body: v.body, current: 'home', scripts: ['/js/calc-engine.js?v=' + layout.ASSET_V, '/js/mini-calc.js?v=' + layout.ASSET_V] });
});

// 계산기
app.get('/calculators', (req, res) => {
  const v = calcViews.index(content);
  send(res, { title: '사장님·셀러 4대 실전 손익 계산기', description: '배달앱 순수익, 스마트스토어·쿠팡 손익분기 ROAS, 2026 정책자금 매칭, 주휴수당 절벽·무인화 원금회수 계산기를 무료로 제공합니다.', path: '/calculators', jsonld: v.jsonld, body: v.body });
});

const CALC_ROUTES = {
  'delivery-margin': { view: calcViews.delivery, title: '배달앱 진짜 순수익 계산기 — 배민·쿠팡이츠·요기요 수수료 & 목표 마진 메뉴가 역산', desc: '2026 배민 상생요금제 7.8%·6.8%·2.0%, 쿠팡이츠 9.8%, 요기요 9.7% 수수료와 배달비·결제수수료·부가세를 뺀 1주문 순수익과 목표 마진 메뉴 가격을 즉시 계산합니다.' },
  'seller-roas': { view: calcViews.seller, title: '셀러 마진 & 손익분기 ROAS 계산기 — 스마트스토어·쿠팡 로켓그로스·윙', desc: '위안화·달러 실시간 환율 사입원가, 스마트스토어·쿠팡 수수료, 반품 손실을 반영해 광고 전 순마진, 손익분기 ROAS, 최대 CPA, 손익분기 CPC를 신호등으로 판독합니다.' },
  'policy-funds': { view: calcViews.policy, title: '2026 소상공인 정책자금 1분 매칭기 — 4.5% 대환대출·스마트상점 보조금 계산', desc: '업종·업력·매출·고금리 대출로 2026 소진공·중진공·지역신보·희망리턴패키지 지원사업을 매칭하고 4.5% 대환 이자 절감액과 스마트상점 자부담을 계산합니다.' },
  'labor-automation': { view: calcViews.labor, title: '2026 주휴수당 절벽 vs 테이블오더 무인화 원금회수 계산기', desc: '2026 최저시급 10,320원 기준 주 14.5시간과 15시간의 주휴수당·4대보험 인건비 절벽을 비교하고, 테이블오더·키오스크 도입 원금회수 개월 수와 3년 절감액을 계산합니다.' }
};
app.get('/calculators/:slug', (req, res, next) => {
  const r = CALC_ROUTES[req.params.slug];
  if (!r) return next();
  const v = r.view(req.query, content);
  const extra = req.params.slug === 'policy-funds' ? ['/js/calc-policy-data.js?v=' + layout.ASSET_V] : [];
  send(res, {
    title: r.title, description: r.desc, path: '/calculators/' + req.params.slug, jsonld: v.jsonld, body: v.body, bodyClass: 'page-calc',
    noCache: Object.keys(req.query).length > 0,
    scripts: ['/js/calc-engine.js?v=' + layout.ASSET_V].concat(extra, ['/js/calc-core.js?v=' + layout.ASSET_V, '/js/calc-' + req.params.slug + '.js?v=' + layout.ASSET_V])
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
    scripts: ['/js/calc-engine.js?v=' + layout.ASSET_V, '/js/mini-calc.js?v=' + layout.ASSET_V]
  });
});
// 별칭: /article/:slug → /bible/:slug
app.get('/article/:slug', (req, res) => res.redirect(301, '/bible/' + encodeURIComponent(req.params.slug)));

// 법적 페이지
const LEGAL = {
  about: [pages.about, 'BoozaThink 연구소 소개 · 편집 원칙 · 공공데이터 출처', 'BoozaThink 손익 연구소의 미션, 편집 원칙, 공식 공공데이터 참조 출처와 콘텐츠 검증 방식을 소개합니다.'],
  'privacy-policy': [pages.privacy, '개인정보처리방침', 'BoozaThink 개인정보처리방침: 계산기 입력값 비저장 원칙, 익명 통계, 쿠키 및 Google AdSense DART 쿠키 안내, 이용자 권리.'],
  'terms-of-service': [pages.terms, '이용약관 · 시뮬레이션 면책조항', 'BoozaThink 이용약관: 세무·노무·대출 시뮬레이션 결과의 성격과 법적 면책조항, 지식재산권, 광고 및 외부 링크 정책.'],
  contact: [pages.contact, '제휴 및 오류 제보', 'BoozaThink 제휴 문의 및 수수료율·계산 오류·정책자금 공고 업데이트 제보 방법을 안내합니다.']
};
Object.entries(LEGAL).forEach(([slug, [fn, title, desc]]) => {
  app.get('/' + slug, (req, res) => {
    const v = fn(content);
    send(res, { title, description: desc, path: '/' + slug, jsonld: v.jsonld, body: v.body });
  });
});

// SEO / GEO
app.get('/sitemap.xml', (req, res) => { res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(seo.sitemap(content)); });
app.get('/robots.txt', (req, res) => { res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(seo.robots()); });
app.get('/llms.txt', (req, res) => { res.type('text/markdown; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(seo.llms(content)); });
app.get('/llms-full.txt', (req, res) => { res.type('text/markdown; charset=utf-8').set('Cache-Control', 'public, max-age=3600').send(seo.llmsFull(content)); });
if (process.env.ADSENSE_CLIENT) {
  app.get('/ads.txt', (req, res) => res.type('text/plain').send(`google.com, ${process.env.ADSENSE_CLIENT.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`));
}

// ── API ──
app.use('/api', express.json({ limit: '8kb' }));
app.get('/api/version', (req, res) => {
  res.set('Cache-Control', 'no-store').json({
    app: 'BoozaThink 2.0',
    version: '2.0.0',
    branch: process.env.RENDER_GIT_BRANCH || 'main',
    commitSha: process.env.RENDER_GIT_COMMIT || 'local',
    startedAt: STARTED_AT
  });
});
app.get('/api/fx', (req, res) => { res.set('Cache-Control', 'public, max-age=300').json(fx.publicRates()); });

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const h = hits.get(ip) || { n: 0, t: now };
  if (now - h.t > 60000) { h.n = 0; h.t = now; }
  h.n++;
  hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  return h.n > 30;
}
app.post('/api/biz/benchmark', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rateLimited(req.ip)) return res.status(429).json({ ok: false, error: 'too many requests' });
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
  res.json({ ...s, migrated: db.state().migrated, startedAt: STARTED_AT, articles: content.articles.length, dataVerifiedAt: facts.VERIFIED_AT });
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
    console.log(`[BoozaThink] listening on 0.0.0.0:${PORT} · articles=${content.articles.length} · fx=${fx.getRates().mode}`);
    db.init().then((s) => console.log('[db]', JSON.stringify({ enabled: s.enabled, connected: s.connected, migrated: s.migrated, projectRef: s.projectRef, error: s.lastError })));
  });
}

module.exports = app;
