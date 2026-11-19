'use strict';
/**
 * BoozaThink 2.2 Launch & AdSense Gatekeeper (verify_boozathink_launch.js)
 * Usage:
 *   node verify_boozathink_launch.js                       # Runs math suite + local SSR/API/link/AdSense audit
 *   node verify_boozathink_launch.js https://boozathink.com # Runs full audit against live production domain
 */
const http = require('http');
const path = require('path');
const { execFileSync } = require('child_process');

const EXPECTED_CALCS = [
  'startup-master',
  'delivery-margin',
  'seller-roas',
  'policy-funds',
  'labor-automation',
  'vat-income-tax',
  'store-rent-breakeven'
];
const EXPECTED_CATS = ['delivery-store-profit', 'ecommerce-seller-lab', 'policy-funds-grants', 'labor-tax-franchise'];
const EXPECTED_LEGAL = ['about', 'privacy-policy', 'terms-of-service', 'contact'];
const EXPECTED_ARTICLES = [
  'baemin-sangsaeng-fee-2026', 'delivery-app-fee-comparison', 'delivery-menu-price-formula', 'food-cost-ratio-packaging', 'restaurant-breakeven-daily-orders',
  'break-even-roas-formula', 'coupang-rocket-growth-vs-wing', 'smartstore-fee-structure-2026', 'china-sourcing-landed-cost', 'return-rate-margin-killer', 'early-settlement-factoring-apr-trap',
  'business-loan-approval-limit-guide', 'bank-securities-collateral-bridge-loan', 'credit-score-dsr-business-loan-rejection',
  'soho-policy-fund-2026-guide', 'refinance-loan-4-5-percent', 'smart-store-tech-subsidy', 'hope-return-package-closure', 'regional-credit-guarantee-loan',
  'weekly-holiday-pay-15-hours', 'employer-insurance-cost-2026', 'table-order-kiosk-payback', 'simplified-vs-general-vat', 'franchise-startup-payback'
];

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, label, detail) {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${label}${detail ? ' — ' + detail : ''}`);
  } else {
    failed++;
    const msg = `${label}${detail ? ' — ' + detail : ''}`;
    failures.push(msg);
    console.error(`  [FAIL] ${msg}`);
  }
}

function stripTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ');
}

function extractArticlePureLength(fullHtml) {
  const m = /<article[^>]*class="article"[\s\S]*?<\/article>/i.exec(fullHtml);
  const target = m ? m[0] : fullHtml;
  return stripTags(target).replace(/\s+/g, '').length;
}

function extractInternalUrls(html) {
  const urls = new Set();
  const re = /\b(?:href|src)="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let u = m[1].trim();
    if (!u || u.startsWith('#') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('javascript:') || u.startsWith('data:')) continue;
    if (u.startsWith('https://boozathink.com/')) u = u.slice('https://boozathink.com'.length);
    else if (u.startsWith('https://boozathink.com')) u = '/';
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('//')) continue;
    const hashIdx = u.indexOf('#');
    if (hashIdx >= 0) u = u.slice(0, hashIdx);
    if (u) urls.add(u);
  }
  return Array.from(urls);
}

async function fetchRes(baseUrl, urlPath, opts) {
  const res = await fetch(baseUrl + urlPath, Object.assign({ redirect: 'follow' }, opts || {}));
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || '';
  const text = /text|json|xml|javascript|svg|markdown/i.test(ct) ? buf.toString('utf8') : '';
  return { status: res.status, ct, headers: res.headers, text, size: buf.length };
}

async function main() {
  // 0. Statutory Math Unit Test Suite
  console.log('0) Statutory Tax / Labor / Lease / Startup / Loan Math Suite');
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, 'backend', 'scripts', 'verify_math.js')], { encoding: 'utf8' });
    const m = /(\d+)\s+PASSED,\s+(\d+)\s+FAILED/.exec(out);
    assert(m && Number(m[2]) === 0 && Number(m[1]) >= 51, 'verify_math.js (51 statutory & financial formulas)', m ? `${m[1]} PASSED, ${m[2]} FAILED` : 'exact match');
  } catch (e) {
    assert(false, 'verify_math.js failed', e.message);
  }

  const externalBase = process.argv[2] ? process.argv[2].replace(/\/$/, '') : null;
  const isLiveMode = !!externalBase;
  let server = null;
  let baseUrl = externalBase;

  const db = require(path.join(__dirname, 'backend', 'lib', 'db.js'));

  if (!externalBase) {
    const app = require(path.join(__dirname, 'backend', 'server.js'));
    await db.init();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }

  console.log(`\n============================================================`);
  console.log(` BoozaThink 2.2 Gatekeeper — Target: ${baseUrl}`);
  console.log(`============================================================\n`);

  try {
    // 1. Render Platform Health Check
    console.log('1) Platform Health Check');
    const hc = await fetchRes(baseUrl, '/__platform_health_check__');
    let hcJson = null;
    try { hcJson = JSON.parse(hc.text); } catch (e) { hcJson = null; }
    assert(hc.status === 200 && hcJson && hcJson.status === 'healthy', 'GET /__platform_health_check__', `HTTP ${hc.status} ${hc.text.trim()}`);

    // 2. Core Pages, 7 Calculators, Funding Lounge, Commercial Lab, Categories, Legal & UI Bug Fixes
    console.log('\n2) Core Routes (7 Simulators + Funding Lounge + Commercial Lab) & UI Integrity');
    const corePages = [
      '/',
      '/funding',
      '/commercial-area',
      '/calendar',
      '/calculators',
      ...EXPECTED_CALCS.map((s) => `/calculators/${s}`),
      ...EXPECTED_CATS.map((s) => `/category/${s}`),
      '/bible',
      ...EXPECTED_LEGAL.map((s) => `/${s}`)
    ];

    const discoveredInternalLinks = new Set();

    for (const p of corePages) {
      const r = await fetchRes(baseUrl, p);
      const hasTitle = /<title>[^<]{8,}<\/title>/.test(r.text);
      const hasDesc = /<meta name="description" content="[^"]{30,}">/.test(r.text);
      const hasCanon = /<link rel="canonical" href="https:\/\/boozathink\.com/.test(r.text);
      const visibleText = stripTags(r.text);
      const noUndefined = !/\bundefined\b/.test(visibleText);
      const ldMatches = [...r.text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      let ldValid = ldMatches.length > 0;
      for (const lm of ldMatches) {
        try { JSON.parse(lm[1]); } catch (e) { ldValid = false; }
      }
      assert(r.status === 200 && hasTitle && hasDesc && hasCanon && ldValid && noUndefined, `SSR Page ${p}`, `HTTP ${r.status}, JSON-LD=${ldMatches.length}, noUndefined=${noUndefined}`);
      extractInternalUrls(r.text).forEach((u) => discoveredInternalLinks.add(u));
    }

    // Verify Screenshot 1 CSS Fix & Screenshot 2 Industry Feedback Box
    const cssRes = await fetchRes(baseUrl, '/css/app.css');
    assert(cssRes.status === 200 && cssRes.text.includes('.field > label.switch') && cssRes.text.includes('flex: 0 0 44px'), 'Screenshot 1 Fix: Toggle Switch Flex Specificity (.field > label.switch)');

    const delivPage = await fetchRes(baseUrl, '/calculators/delivery-margin?biz=chicken');
    assert(delivPage.status === 200 && delivPage.text.includes('data-biz-feedback') && delivPage.text.includes('data-apply-biz') && delivPage.text.includes('치킨·피자·야식'), 'Screenshot 2 Fix: Delivery Industry Live Diagnostics & Preset Fill');

    const masterPage = await fetchRes(baseUrl, '/calculators/startup-master?profile=coin-laundry');
    const profBtnCount = (masterPage.text.match(/data-pick-profile="/g) || []).length;
    assert(masterPage.status === 200 && profBtnCount === 30 && masterPage.text.includes('season12') && masterPage.text.includes('무인 코인세탁소'), 'Startup Master 30 Industry Profiles & 12-Month Seasonality', `profiles=${profBtnCount}`);

    const fundPage = await fetchRes(baseUrl, '/funding');
    assert(fundPage.status === 200 && fundPage.text.includes('id="rate-gap-sim"') && fundPage.text.includes('data-mini="apr-trap"') && fundPage.text.includes('business-loan-approval-limit-guide'), 'Funding Hub: 6-Channel Rate Gap Sim + APR Trap + Rejection Matrix');

    // Check 2027 Year Mode Preset on Labor Calculator
    const y2027Check = await fetchRes(baseUrl, '/calculators/labor-automation?year=2027');
    assert(y2027Check.status === 200 && y2027Check.text.includes('value="10700"') && y2027Check.text.includes('제2026-60호'), 'Next-Year Statutory Wage (10,700원) & Pension (10%) Footnote');

    // Check AdSense Isolation on /admin & Contact Form on /contact & Privacy Disclosures
    const adminLogin = await fetchRes(baseUrl, '/admin');
    const xRobots = adminLogin.headers.get('x-robots-tag') || '';
    assert(adminLogin.status === 200 && xRobots.includes('noindex') && adminLogin.text.includes('noindex, nofollow') && !/\bundefined\b/.test(stripTags(adminLogin.text)), 'Site-Kit /admin Isolation (X-Robots-Tag: noindex)', xRobots);

    const contactPage = await fetchRes(baseUrl, '/contact');
    assert(contactPage.text.includes('id="contact-form"') && contactPage.text.includes('/api/biz/contact'), 'AdSense E-E-A-T Working Contact Form (/contact)');

    const privacyPage = await fetchRes(baseUrl, '/privacy-policy');
    assert(privacyPage.text.includes('Google AdSense') && privacyPage.text.includes('Google Analytics 4') && privacyPage.text.includes('adssettings.google.com'), 'AdSense & GA4 Privacy Policy Disclosures');

    // Check sitemap.xml, robots.txt, llms.txt, llms-full.txt
    const sm = await fetchRes(baseUrl, '/sitemap.xml');
    const smCount = (sm.text.match(/<loc>/g) || []).length;
    assert(
      sm.status === 200 && smCount >= 39 && sm.text.includes('/calculators/startup-master') && sm.text.includes('/funding') && sm.text.includes('/commercial-area') && !sm.text.includes('/admin'),
      'GET /sitemap.xml',
      `${smCount} URLs indexed (7 calculators + funding + commercial-area + 20 bibles, /admin excluded)`
    );

    const rb = await fetchRes(baseUrl, '/robots.txt');
    assert(rb.status === 200 && rb.text.includes('Mediapartners-Google') && rb.text.includes('Disallow: /admin'), 'GET /robots.txt', 'Mediapartners-Google allowed, /admin disallowed');

    const llms = await fetchRes(baseUrl, '/llms.txt');
    assert(llms.status === 200 && llms.text.includes('/funding') && llms.text.includes('/commercial-area') && llms.text.includes('startup-master'), 'GET /llms.txt', `${llms.size} bytes`);

    const llmsFull = await fetchRes(baseUrl, '/llms-full.txt');
    assert(llmsFull.status === 200 && llmsFull.size > 80000, 'GET /llms-full.txt', `${llmsFull.size} bytes`);

    // 3. All 20 Bible Articles
    console.log('\n3) 20 Bible Articles SSR Content & Quality Audit');
    for (const slug of EXPECTED_ARTICLES) {
      const p = `/bible/${slug}`;
      const r = await fetchRes(baseUrl, p);
      const pureChars = extractArticlePureLength(r.text);
      const noUndef = !/\bundefined\b/.test(stripTags(r.text));
      const tables = (r.text.match(/<table/g) || []).length;
      const hasMini = /data-mini="[a-z-]+"/.test(r.text);
      const hasCases = r.text.includes('case-fail') && r.text.includes('case-success');
      const faqCount = (r.text.match(/class="faq-item"/g) || []).length;
      const hasTrust = r.text.includes('class="trust-box"') && r.text.includes('/privacy-policy') && r.text.includes('/terms-of-service');
      assert(
        r.status === 200 && noUndef && pureChars >= 3000 && tables >= 2 && hasMini && hasCases && faqCount >= 4 && hasTrust,
        `Bible ${slug}`,
        `chars=${pureChars}, tables=${tables}, mini=${hasMini}, faq=${faqCount}`
      );
      extractInternalUrls(r.text).forEach((u) => discoveredInternalLinks.add(u));
    }

    // 4. Broken Internal Link Audit
    console.log(`\n4) Internal Link & Static Asset Integrity (${discoveredInternalLinks.size} unique internal targets)`);
    let brokenLinks = [];
    for (const u of discoveredInternalLinks) {
      const r = await fetchRes(baseUrl, u);
      if (r.status !== 200) brokenLinks.push(`${u} (HTTP ${r.status})`);
    }
    assert(brokenLinks.length === 0, 'Zero Broken Internal Links & Assets', brokenLinks.length ? brokenLinks.join(', ') : `${discoveredInternalLinks.size} checked, 0 broken`);

    // 5. FX Bus, Market Lending Rates API, Benchmark API & Beacon Collector
    console.log('\n5) Real-time FX, Market Lending Rates, 7-Simulator Benchmark & Analytics API');
    const fxRes = await fetchRes(baseUrl, '/api/fx');
    const fxJson = JSON.parse(fxRes.text);
    assert(fxRes.status === 200 && fxJson.CNY > 100 && fxJson.USD > 900, 'GET /api/fx', `mode=${fxJson.mode}, CNY=${fxJson.CNY}, USD=${fxJson.USD}`);

    const ratesRes = await fetchRes(baseUrl, '/api/rates');
    const ratesJson = JSON.parse(ratesRes.text);
    assert(ratesRes.status === 200 && Array.isArray(ratesJson.bands) && ratesJson.bands.length >= 7, 'GET /api/rates (Bank/Securities/Policy Rates)', `bands=${ratesJson.bands.length}, bokBase=${ratesJson.bokBaseRate}%`);

    const bmStartup = await fetchRes(baseUrl, '/api/biz/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calculator: 'startup-master', industry: 'food', net_margin_pct: 19.5 })
    });
    const bmStartupJson = JSON.parse(bmStartup.text);
    assert(bmStartup.status === 200 && bmStartupJson.ok === true && typeof bmStartupJson.topPercent === 'number', 'POST /api/biz/benchmark (startup-master)', `storage=${bmStartupJson.storage}, top=${bmStartupJson.topPercent}%`);

    const colRes = await fetchRes(baseUrl, '/api/biz/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0' },
      body: JSON.stringify({ mode: 'enter', vid: 'verifyv220test', path: '/funding', ref: 'https://www.google.com/', scroll: 52, dwell: 0 })
    });
    assert(colRes.status === 204, 'POST /api/biz/collect (Analytics Beacon)', `HTTP ${colRes.status}`);

    // 6. Supabase RLS Verification across ALL public tables
    console.log('\n6) Supabase (booza-think) Row Level Security Audit');
    const ddlHasRls = db.MIGRATION_SQL.includes('ALTER TABLE public.biz_simulator_runs ENABLE ROW LEVEL SECURITY') &&
      db.MIGRATION_SQL.includes('ALTER TABLE public.biz_page_events ENABLE ROW LEVEL SECURITY') &&
      db.MIGRATION_SQL.includes('ALTER TABLE public.biz_inquiries ENABLE ROW LEVEL SECURITY');
    assert(ddlHasRls, 'Migration DDL Enforces RLS on biz_simulator_runs, biz_page_events & biz_inquiries');

    const dbRes = await fetchRes(baseUrl, '/api/biz/db-status');
    const dbJson = JSON.parse(dbRes.text);
    if (isLiveMode || dbJson.connected) {
      assert(
        dbJson.connected === true && dbJson.bizSimulatorRunsRls === true && dbJson.bizPageEventsRls === true && dbJson.bizInquiriesRls === true && dbJson.rlsDisabledCount === 0,
        'Live Supabase public tables relrowsecurity = true (RLS ON)',
        `project=${dbJson.projectRef}, publicTables=${dbJson.publicTables}, rlsDisabled=${dbJson.rlsDisabledCount}, sim_rls=${dbJson.bizSimulatorRunsRls}, events_rls=${dbJson.bizPageEventsRls}, inq_rls=${dbJson.bizInquiriesRls}`
      );
    } else {
      assert(dbJson.rlsEnforcedInDdl === true, 'Local DB Fallback & RLS DDL Verified');
    }
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await db.close();
  }

  console.log(`\n============================================================`);
  console.log(` RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`============================================================\n`);
  if (failed > 0) {
    console.error('Failures:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
