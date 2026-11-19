'use strict';
const SITE = {
  url: (process.env.SITE_URL || 'https://boozathink.com').replace(/\/$/, ''),
  name: 'BoozaThink',
  tagline: '사장님·셀러 손익 연구소',
  description: '배달앱 수수료 순수익, 스마트스토어·쿠팡 손익분기 ROAS, 2026 소상공인 정책자금 매칭, 주휴수당 절벽과 무인화 원금회수까지. 700만 사장님과 셀러를 위한 실전 손익 시뮬레이터 & 정책자금 바이블.',
  email: 'contact@boozathink.com',
  locale: 'ko_KR'
};

const CALCULATORS = [
  { slug: 'delivery-margin', short: '배달앱 순수익 계산기', name: '배민·쿠팡이츠·요기요 배달앱 진짜 순수익 & 목표 마진 메뉴가 역산기', icon: '🛵', desc: '중개수수료·배달비·결제수수료·부가세를 뺀 1주문 순수익과 목표 마진 메뉴가를 역산합니다.', category: 'delivery-store-profit' },
  { slug: 'seller-roas', short: '셀러 손익분기 ROAS', name: '스마트스토어·쿠팡(로켓그로스/윙) 셀러 마진 & 손익분기 ROAS 계산기', icon: '📦', desc: '실시간 환율 사입원가부터 마켓 수수료·반품까지 반영한 손익분기 ROAS와 최대 CPA를 판독합니다.', category: 'ecommerce-seller-lab' },
  { slug: 'policy-funds', short: '정책자금 1분 매칭', name: '2026 소상공인 정책자금·4.5% 대환대출·스마트상점 보조금 1분 매칭기', icon: '🏦', desc: '업종·업력·매출로 받을 수 있는 정책자금을 매칭하고 대환 이자 절감액과 보조금 자부담을 계산합니다.', category: 'policy-funds-grants' },
  { slug: 'labor-automation', short: '주휴수당 절벽 & 무인화', name: '2026 알바 주휴수당 절벽 vs 테이블오더·무인화 원금회수(Payback) 계산기', icon: '🧾', desc: '주 15시간 인건비 절벽과 테이블오더·키오스크 도입 시 원금회수 개월 수, 3년 절감액을 비교합니다.', category: 'labor-tax-franchise' }
];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function jsonLd(obj) {
  return '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';
}
function abs(p) { return SITE.url + (p.startsWith('/') ? p : '/' + p); }

function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) }))
  };
}
function faqLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  };
}

function breadcrumbHtml(items) {
  return '<nav class="crumbs" aria-label="breadcrumb"><ol>' + items.map((it, i) =>
    i === items.length - 1 ? `<li aria-current="page">${esc(it.name)}</li>` : `<li><a href="${esc(it.path)}">${esc(it.name)}</a></li>`
  ).join('') + '</ol></nav>';
}

function faqHtml(faq, title) {
  return `<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">${esc(title || '자주 묻는 질문')}</h2>` +
    faq.map((f, i) => `<details class="faq-item"${i === 0 ? ' open' : ''}><summary><span class="q">Q.</span> ${esc(f.q)}</summary><div class="faq-a"><p>${esc(f.a)}</p></div></details>`).join('') +
    '</section>';
}

function gnb(categories, current) {
  const calcItems = CALCULATORS.map((c) => `<li><a href="/calculators/${c.slug}" role="menuitem"><span class="dd-ico" aria-hidden="true">${c.icon}</span><span><strong>${esc(c.short)}</strong><small>${esc(c.desc)}</small></span></a></li>`).join('');
  const catLinks = categories.map((c) => `<li><a href="/category/${c.slug}"${current === 'cat:' + c.slug ? ' aria-current="page"' : ''}>${esc(c.short)}</a></li>`).join('');
  return `
<header class="gnb" id="top">
  <div class="gnb-inner">
    <a class="logo" href="/" aria-label="BoozaThink 홈">
      <span class="logo-mark" aria-hidden="true">B</span>
      <span class="logo-text"><strong>BoozaThink</strong><span class="logo-sep">|</span><span class="logo-sub">사장님·셀러 손익 연구소</span></span>
    </a>
    <nav class="gnb-nav" id="gnb-nav" aria-label="주요 메뉴">
      <ul class="gnb-list">
        <li class="has-dd">
          <button class="dd-btn" aria-expanded="false" aria-haspopup="true" aria-controls="dd-calc">4대 실전 계산기 <span aria-hidden="true">▾</span></button>
          <ul class="dd" id="dd-calc" role="menu">${calcItems}<li class="dd-all"><a href="/calculators">전체 계산기 보기 →</a></li></ul>
        </li>
        ${catLinks}
        <li class="gnb-bible"><a href="/bible">바이블</a></li>
      </ul>
    </nav>
    <div class="gnb-actions">
      <button class="icon-btn" id="theme-toggle" type="button" aria-label="다크 모드 전환" title="라이트/다크 모드"><span class="i-sun" aria-hidden="true">☀️</span><span class="i-moon" aria-hidden="true">🌙</span></button>
      <button class="icon-btn menu-btn" id="menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="gnb-nav">☰</button>
    </div>
  </div>
</header>`;
}

function footer(categories) {
  const year = new Date().getFullYear();
  return `
<footer class="footer">
  <div class="footer-inner">
    <div class="f-brand">
      <a class="logo" href="/"><span class="logo-mark" aria-hidden="true">B</span><span class="logo-text"><strong>BoozaThink</strong></span></a>
      <p>대한민국 700만 자영업자·1인 창업가·이커머스 셀러를 위한 실전 손익 & 정책자금 인텔리전스 플랫폼. 모든 계산은 브라우저에서 즉시 수행되며 입력값은 서버에 저장되지 않습니다.</p>
    </div>
    <div class="f-col"><h3>4대 실전 계산기</h3><ul>${CALCULATORS.map((c) => `<li><a href="/calculators/${c.slug}">${esc(c.short)}</a></li>`).join('')}</ul></div>
    <div class="f-col"><h3>카테고리</h3><ul>${categories.map((c) => `<li><a href="/category/${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul></div>
    <div class="f-col"><h3>연구소</h3><ul><li><a href="/about">BoozaThink 소개</a></li><li><a href="/privacy-policy">개인정보처리방침</a></li><li><a href="/terms-of-service">이용약관</a></li><li><a href="/contact">제휴·오류 제보</a></li><li><a href="/llms.txt">AI 팩트시트 (llms.txt)</a></li></ul></div>
  </div>
  <div class="footer-src">
    <p><strong>데이터 기준 출처</strong> · 소상공인시장진흥공단 · 공정거래위원회 · 국세청 · 고용노동부 · 최저임금위원회 · 4대사회보험 정보연계센터 · 중소벤처기업진흥공단 (기준일 2026-11-19)</p>
    <p class="f-legal">본 사이트의 시뮬레이션 결과는 일반적인 참고용 추정치이며 세무·노무·법률·금융 자문이 아닙니다. 실제 수수료·세액·대출 조건은 계약서, 공고문, 전문가 상담으로 확인하세요. · <a href="/about">소개</a> · <a href="/privacy-policy">개인정보처리방침</a> · <a href="/terms-of-service">이용약관</a> · <a href="/contact">문의</a></p>
    <p class="f-copy">© ${year} BoozaThink. All rights reserved.</p>
  </div>
</footer>`;
}

/**
 * opts: { title, description, path, type('website'|'article'), jsonld:[], body, current, scripts:[], noindex, published, modified, keywords }
 */
function render(opts, categories) {
  const title = opts.fullTitle || (opts.title ? `${opts.title} | BoozaThink` : `BoozaThink | ${SITE.tagline}`);
  const desc = opts.description || SITE.description;
  const canonical = abs(opts.path || '/');
  const ogImage = abs('/img/og-image.png');
  const ld = (opts.jsonld || []).map(jsonLd).join('\n');
  const scripts = (opts.scripts || []).map((s) => `<script src="${s}" defer></script>`).join('\n');
  const adsense = process.env.ADSENSE_CLIENT ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(process.env.ADSENSE_CLIENT)}" crossorigin="anonymous"></script>` : '';
  return `<!doctype html>
<html lang="ko" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${opts.keywords ? `<meta name="keywords" content="${esc(opts.keywords.join(', '))}">` : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${opts.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1'}">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="${opts.type || 'website'}">
<meta property="og:site_name" content="BoozaThink">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(opts.ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
${opts.published ? `<meta property="article:published_time" content="${opts.published}T09:00:00+09:00">` : ''}
${opts.modified ? `<meta property="article:modified_time" content="${opts.modified}T09:00:00+09:00">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(opts.ogTitle || title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<link rel="alternate" type="text/markdown" title="llms.txt" href="/llms.txt">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" media="print" onload="this.media='all'">
<link rel="stylesheet" href="/css/app.css?v=${ASSET_V}">
<script>(function(){try{var t=localStorage.getItem('bt-theme');if(!t){t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();</script>
${ld}
${adsense}
</head>
<body class="${opts.bodyClass || ''}">
<a class="skip" href="#main">본문 바로가기</a>
${gnb(categories, opts.current)}
<main id="main" class="main">
${opts.body}
</main>
${footer(categories)}
<script src="/js/app.js?v=${ASSET_V}" defer></script>
${scripts}
</body>
</html>`;
}

const ASSET_V = '20261119b';

module.exports = { SITE, CALCULATORS, esc, jsonLd, abs, breadcrumbLd, faqLd, breadcrumbHtml, faqHtml, render, ASSET_V };
