'use strict';
const fs = require('fs');
const path = require('path');
const categories = require('./categories');

const DIR = path.join(__dirname, 'articles');
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');

function load() {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.js')) : [];
  const list = [];
  for (const f of files) {
    try {
      const a = require(path.join(DIR, f));
      if (!a || !a.slug || !categories.find((c) => c.slug === a.category)) continue;
      let text = (a.lead || '') + (a.summary || []).join('');
      for (const s of a.sections || []) text += s.heading + strip(s.html);
      for (const c of a.cases || []) text += c.title + strip(c.html);
      for (const q of a.faq || []) text += q.q + q.a;
      a.charCount = text.replace(/\s+/g, '').length;
      a.readingMinutes = a.readingMinutes || Math.max(5, Math.round(a.charCount / 500));
      list.push(a);
    } catch (e) {
      console.error('[articles] failed to load', f, e.message);
    }
  }
  const ORDER = ['baemin-sangsaeng-fee-2026', 'delivery-app-fee-comparison', 'delivery-menu-price-formula', 'food-cost-ratio-packaging', 'restaurant-breakeven-daily-orders',
    'break-even-roas-formula', 'coupang-rocket-growth-vs-wing', 'smartstore-fee-structure-2026', 'china-sourcing-landed-cost', 'return-rate-margin-killer', 'early-settlement-factoring-apr-trap',
    'business-loan-approval-limit-guide', 'bank-securities-collateral-bridge-loan', 'credit-score-dsr-business-loan-rejection',
    'soho-policy-fund-2026-guide', 'refinance-loan-4-5-percent', 'smart-store-tech-subsidy', 'hope-return-package-closure', 'regional-credit-guarantee-loan',
    'weekly-holiday-pay-15-hours', 'employer-insurance-cost-2026', 'table-order-kiosk-payback', 'simplified-vs-general-vat', 'franchise-startup-payback'];
  list.sort((a, b) => (ORDER.indexOf(a.slug) + 1 || 99) - (ORDER.indexOf(b.slug) + 1 || 99));
  return list;
}

const articles = load();
const bySlug = Object.fromEntries(articles.map((a) => [a.slug, a]));
const byCategory = Object.fromEntries(categories.map((c) => [c.slug, articles.filter((a) => a.category === c.slug)]));

module.exports = { categories, articles, bySlug, byCategory, categoryBySlug: Object.fromEntries(categories.map((c) => [c.slug, c])) };
