'use strict';
/**
 * BoozaThink 2.0 Launch Gatekeeper (verify_boozathink_launch.js)
 * Usage:
 *   node verify_boozathink_launch.js                       # Boots local server & runs full verification
 *   node verify_boozathink_launch.js https://boozathink.com # Verifies live deployed production domain
 */
const http = require('http');
const path = require('path');

const EXPECTED_CALCS = ['delivery-margin', 'seller-roas', 'policy-funds', 'labor-automation'];
const EXPECTED_CATS = ['delivery-store-profit', 'ecommerce-seller-lab', 'policy-funds-grants', 'labor-tax-franchise'];
const EXPECTED_LEGAL = ['about', 'privacy-policy', 'terms-of-service', 'contact'];
const EXPECTED_ARTICLES = [
  'baemin-sangsaeng-fee-2026', 'delivery-app-fee-comparison', 'delivery-menu-price-formula', 'food-cost-ratio-packaging', 'restaurant-breakeven-daily-orders',
  'break-even-roas-formula', 'coupang-rocket-growth-vs-wing', 'smartstore-fee-structure-2026', 'china-sourcing-landed-cost', 'return-rate-margin-killer',
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
  console.log(` BoozaThink 2.0 Gatekeeper — Target: ${baseUrl}`);
  console.log(`============================================================\n`);

  try {
    // 1. Render Platform Health Check
    console.log('1) Platform Health Check');
    const hc = await fetchRes(baseUrl, '/__platform_health_check__');
    let hcJson = null;
    try { hcJson = JSON.parse(hc.text); } catch (e) { hcJson = null; }
    assert(hc.status === 200 && hcJson && hcJson.status === 'healthy', 'GET /__platform_health_check__', `HTTP ${hc.status} ${hc.text.trim()}`);

    // 2. Core Pages, Calculators, Categories, Legal, SEO/GEO
    console.log('\n2) Core Routes & SEO/GEO Endpoints');
    const corePages = [
      '/',
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
      const ldMatches = [...r.text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      let ldValid = ldMatches.length > 0;
      for (const lm of ldMatches) {
        try { JSON.parse(lm[1]); } catch (e) { ldValid = false; }
      }
      assert(r.status === 200 && hasTitle && hasDesc && hasCanon && ldValid, `SSR Page ${p}`, `HTTP ${r.status}, JSON-LD=${ldMatches.length}`);
      extractInternalUrls(r.text).forEach((u) => discoveredInternalLinks.add(u));
    }

    // Check preset query binding on SSR
    const presetCheck = await fetchRes(baseUrl, '/calculators/delivery-margin?plan=coupang-98&price=25000&cost=8000');
    assert(presetCheck.status === 200 && presetCheck.text.includes('value="25000"') && presetCheck.text.includes('쿠팡이츠'), 'SSR Calculator URLSearchParams Preset', 'price=25000 & plan=coupang-98');

    // Check sitemap.xml, robots.txt, llms.txt, llms-full.txt
    const sm = await fetchRes(baseUrl, '/sitemap.xml');
    const smCount = (sm.text.match(/<loc>/g) || []).length;
    assert(sm.status === 200 && smCount >= 34 && sm.text.includes('/calculators/delivery-margin') && sm.text.includes('/bible/baemin-sangsaeng-fee-2026'), 'GET /sitemap.xml', `${smCount} URLs indexed`);

    const rb = await fetchRes(baseUrl, '/robots.txt');
    assert(rb.status === 200 && rb.text.includes('Sitemap: https://boozathink.com/sitemap.xml') && rb.text.includes('GPTBot'), 'GET /robots.txt', 'Sitemap + AI crawlers configured');

    const llms = await fetchRes(baseUrl, '/llms.txt');
    assert(llms.status === 200 && llms.text.includes('BoozaThink') && llms.text.includes('손익분기 ROAS') && llms.text.includes('10,320원'), 'GET /llms.txt', `${llms.size} bytes`);

    const llmsFull = await fetchRes(baseUrl, '/llms-full.txt');
    assert(llmsFull.status === 200 && llmsFull.size > 80000, 'GET /llms-full.txt', `${llmsFull.size} bytes`);

    // 3. All 20 Bible Articles — SSR Status, Pure Korean Body Length >= 3,000자, Inline Mini Calc, Tables, Cases, FAQ, E-E-A-T
    console.log('\n3) 20 Bible Articles SSR Content & Quality Audit');
    for (const slug of EXPECTED_ARTICLES) {
      const p = `/bible/${slug}`;
      const r = await fetchRes(baseUrl, p);
      const pureChars = extractArticlePureLength(r.text);
      const tables = (r.text.match(/<table/g) || []).length;
      const hasMini = /data-mini="[a-z-]+"/.test(r.text);
      const hasCases = r.text.includes('case-fail') && r.text.includes('case-success');
      const faqCount = (r.text.match(/class="faq-item"/g) || []).length;
      const hasTrust = r.text.includes('class="trust-box"') && r.text.includes('/privacy-policy') && r.text.includes('/terms-of-service');
      assert(
        r.status === 200 && pureChars >= 3000 && tables >= 2 && hasMini && hasCases && faqCount >= 4 && hasTrust,
        `Bible ${slug}`,
        `chars=${pureChars}, tables=${tables}, mini=${hasMini}, faq=${faqCount}`
      );
      extractInternalUrls(r.text).forEach((u) => discoveredInternalLinks.add(u));
    }

    // 4. Broken Internal Link Audit across EVERY discovered link/asset
    console.log(`\n4) Internal Link & Static Asset Integrity (${discoveredInternalLinks.size} unique internal targets)`);
    let brokenLinks = [];
    for (const u of discoveredInternalLinks) {
      const r = await fetchRes(baseUrl, u);
      if (r.status !== 200) brokenLinks.push(`${u} (HTTP ${r.status})`);
    }
    assert(brokenLinks.length === 0, 'Zero Broken Internal Links & Assets', brokenLinks.length ? brokenLinks.join(', ') : `${discoveredInternalLinks.size} checked, 0 broken`);

    // 5. FX Bus & Benchmark API
    console.log('\n5) Real-time FX Bus & Benchmark API');
    const fxRes = await fetchRes(baseUrl, '/api/fx');
    const fxJson = JSON.parse(fxRes.text);
    assert(fxRes.status === 200 && fxJson.CNY > 100 && fxJson.USD > 900, 'GET /api/fx', `mode=${fxJson.mode}, CNY=${fxJson.CNY}, USD=${fxJson.USD}`);

    const bmRes = await fetchRes(baseUrl, '/api/biz/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calculator: 'delivery-margin', industry: 'food', net_margin_pct: 24.5 })
    });
    const bmJson = JSON.parse(bmRes.text);
    assert(bmRes.status === 200 && bmJson.ok === true && typeof bmJson.topPercent === 'number', 'POST /api/biz/benchmark', `storage=${bmJson.storage}, avg=${bmJson.average}%, top=${bmJson.topPercent}%`);

    // 6. Supabase RLS Verification
    console.log('\n6) Supabase (booza-think) Row Level Security Audit');
    const ddlHasRls = db.MIGRATION_SQL.includes('ALTER TABLE public.biz_simulator_runs ENABLE ROW LEVEL SECURITY') &&
      db.ENFORCE_ALL_RLS_SQL.includes('ENABLE ROW LEVEL SECURITY');
    assert(ddlHasRls, 'Migration DDL Enforces RLS on public.biz_simulator_runs & all public tables');

    const dbRes = await fetchRes(baseUrl, '/api/biz/db-status');
    const dbJson = JSON.parse(dbRes.text);
    if (isLiveMode || dbJson.connected) {
      assert(
        dbJson.connected === true && dbJson.bizSimulatorRunsRls === true && dbJson.rlsDisabledCount === 0,
        'Live Supabase public tables relrowsecurity = true (RLS ON)',
        `project=${dbJson.projectRef}, publicTables=${dbJson.publicTables}, rlsDisabled=${dbJson.rlsDisabledCount}, biz_simulator_runs_rls=${dbJson.bizSimulatorRunsRls}`
      );
    } else {
      assert(
        dbJson.rlsEnforcedInDdl === true,
        'Local DB Fallback & RLS DDL Verified (Live Render DATABASE_URL check runs post-deploy)',
        dbJson.error || 'memory fallback'
      );
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
