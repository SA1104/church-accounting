'use strict';
/**
 * 바이블 아티클 품질 게이트 (작성자용)
 * 사용: node backend/scripts/check_articles.js [slug ...]
 * - 스키마 검증 + 순수 본문 글자 수(태그·공백 제거) 측정
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data', 'articles');
const CATS = ['delivery-store-profit', 'ecommerce-seller-lab', 'policy-funds-grants', 'labor-tax-franchise'];
const MINI_TYPES = ['delivery-net', 'delivery-compare', 'target-price', 'breakeven-daily', 'roas-breakeven', 'landed-cost', 'return-loss', 'refinance', 'subsidy', 'weekly-holiday', 'employer-cost', 'payback', 'vat', 'franchise-payback', 'loan-payment', 'guarantee-fee'];
const CALC_PATHS = ['/calculators/delivery-margin', '/calculators/seller-roas', '/calculators/policy-funds', '/calculators/labor-automation'];

const strip = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
const pureLen = (s) => strip(s).replace(/\s+/g, '').length;

function bodyText(a) {
  let t = (a.lead || '') + ' ' + (a.summary || []).join(' ');
  for (const s of a.sections || []) t += ' ' + s.heading + ' ' + s.html;
  for (const c of a.cases || []) t += ' ' + c.title + ' ' + c.html;
  for (const f of a.faq || []) t += ' ' + f.q + ' ' + f.a;
  return t;
}

function check(a, file) {
  const errs = [];
  const req = ['slug', 'category', 'title', 'description', 'lead', 'publishedAt', 'updatedAt', 'summary', 'sections', 'cases', 'faq', 'miniCalc', 'sources'];
  for (const k of req) if (a[k] === undefined) errs.push('missing ' + k);
  if (a.slug && path.basename(file, '.js') !== a.slug) errs.push('filename != slug');
  if (!CATS.includes(a.category)) errs.push('bad category');
  if (a.description && (a.description.length < 70 || a.description.length > 170)) errs.push('description length ' + a.description.length + ' (70~170)');
  if (!Array.isArray(a.sections) || a.sections.length < 5) errs.push('sections < 5');
  const allHtml = (a.sections || []).map((s) => s.html).join('\n') + (a.cases || []).map((c) => c.html).join('\n');
  const tables = (allHtml.match(/<table/g) || []).length;
  if (tables < 2) errs.push('tables < 2 (' + tables + ')');
  if (/style=/.test(allHtml)) errs.push('inline style not allowed');
  if (/<h1|<h2/.test(allHtml)) errs.push('h1/h2 not allowed inside html (use h3)');
  if (!Array.isArray(a.cases) || a.cases.length < 2) errs.push('cases < 2');
  if (a.cases && !a.cases.some((c) => c.kind === 'fail')) errs.push('need a fail case');
  if (a.cases && !a.cases.some((c) => c.kind === 'success')) errs.push('need a success case');
  if (!Array.isArray(a.faq) || a.faq.length < 4) errs.push('faq < 4');
  if (a.faq && a.faq.some((f) => /</.test(f.a) || /</.test(f.q))) errs.push('faq must be plain text');
  const m = a.miniCalc || {};
  if (!MINI_TYPES.includes(m.type)) errs.push('bad miniCalc.type ' + m.type);
  if (!m.title || !m.cta || !m.cta.href || !m.cta.label) errs.push('miniCalc needs title & cta{href,label}');
  if (m.cta && m.cta.href && !CALC_PATHS.some((p) => m.cta.href.startsWith(p + '?'))) errs.push('miniCalc.cta.href must start with a calculator path + ?preset');
  if (typeof a.miniCalcAfter !== 'number' || a.miniCalcAfter < 1 || a.miniCalcAfter >= (a.sections || []).length) errs.push('miniCalcAfter must be 1..sections-1');
  const links = (allHtml.match(/href="([^"]+)"/g) || []).map((h) => h.slice(6, -1));
  for (const l of links) if (!l.startsWith('/') && !l.startsWith('https://')) errs.push('bad link ' + l);
  const len = pureLen(bodyText(a));
  if (len < 3400) errs.push('pure text length ' + len + ' < 3400');
  return { len, tables, errs };
}

const only = process.argv.slice(2);
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.js')) : [];
let bad = 0;
for (const f of files) {
  const slug = path.basename(f, '.js');
  if (only.length && !only.includes(slug)) continue;
  const p = path.join(DIR, f);
  delete require.cache[require.resolve(p)];
  let a;
  try { a = require(p); } catch (e) { console.log('FAIL', slug, 'syntax:', e.message); bad++; continue; }
  const r = check(a, p);
  if (r.errs.length) bad++;
  console.log(r.errs.length ? 'FAIL' : 'PASS', slug.padEnd(42), 'chars=' + r.len, 'tables=' + r.tables, r.errs.join('; '));
}
console.log(files.length + ' files, ' + bad + ' failing');
process.exit(bad ? 1 : 0);
