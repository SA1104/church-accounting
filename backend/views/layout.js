'use strict';
const facts = require('../data/facts');

const SITE = {
  url: (process.env.SITE_URL || 'https://boozathink.com').replace(/\/$/, ''),
  name: 'BoozaThink',
  tagline: '사장님·셀러 손익 연구소',
  description: '배달앱 순수익, 스마트스토어·쿠팡 손익분기 ROAS, 소상공인 정책자금 매칭, 2026·2027 최저임금 주휴수당 절벽과 무인화 원금회수, 부가세·종합소득세, 상가 환산보증금·손익분기점까지. 700만 사장님과 셀러를 위한 6대 손익 시뮬레이터 & 바이블.',
  email: 'contact@boozathink.com',
  locale: 'ko_KR'
};

const CALCULATORS = [
  { slug: 'delivery-margin', short: '배달앱 순수익 계산기', name: '배민·쿠팡이츠·요기요 배달앱 진짜 순수익 & 목표 마진 메뉴가 역산기', icon: '🛵', desc: '중개수수료·배달비·결제수수료·부가세를 뺀 1주문 순수익과 목표 마진 메뉴가를 역산합니다.', category: 'delivery-store-profit' },
  { slug: 'seller-roas', short: '셀러 손익분기 ROAS', name: '스마트스토어·쿠팡(로켓그로스/윙) 셀러 마진 & 손익분기 ROAS 계산기', icon: '📦', desc: '실시간 환율 사입원가부터 마켓 수수료·반품까지 반영한 손익분기 ROAS와 최대 CPA를 판독합니다.', category: 'ecommerce-seller-lab' },
  { slug: 'policy-funds', short: '정책자금·대환 1분 매칭', name: '소상공인 정책자금·4.5% 대환대출·스마트상점 보조금 1분 매칭기', icon: '🏦', desc: '업종·업력·매출로 정책자금·상반기 본공고 대상을 매칭하고 대환 이자 절감액과 보조금 자부담을 계산합니다.', category: 'policy-funds-grants' },
  { slug: 'labor-automation', short: '주휴수당 절벽 & 무인화', name: '2026·2027 최저시급 주휴수당 절벽 vs 테이블오더 무인화 원금회수 계산기', icon: '🧾', desc: '2026(10,320원)·2027 확정(10,700원) 기준 주 15시간 인건비 절벽과 무인기기 원금회수 개월 수를 비교합니다.', category: 'labor-tax-franchise' },
  { slug: 'vat-income-tax', short: '부가세·종소세·실수령', name: '개인사업자 부가세(간이·일반) & 5월 종합소득세·노란우산 실수령 계산기', icon: '💰', desc: '간이·일반 부가세 비교부터 종합소득세 8단계 세율, 노란우산 절세액, 세후 월 실수령액까지 한 번에 계산합니다.', category: 'labor-tax-franchise' },
  { slug: 'store-rent-breakeven', short: '상가 월세·환산보증금·BEP', name: '상가 월세·환산보증금 5% 상한 판독 & 매장 손익분기점·권리금 회수 계산기', icon: '🏪', desc: '상가임대차보호법 환산보증금(5% 상한 여부), 일매출 손익분기점(BEP), 권리금·인테리어 회수 개월 수를 진단합니다.', category: 'delivery-store-profit' }
];

const ASSET_V = '20261119c';

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
  const season = facts.getSeasonContext();
  return `
<div class="season-bar"><div class="container season-inner"><span class="season-pill">${esc(season.badge)}</span><span class="season-msg">${esc(season.headline)}</span><a class="season-link" href="/calculators/labor-automation?year=2027">2027 인건비 미리 계산 →</a></div></div>
<header class="gnb" id="top">
  <div class="gnb-inner">
    <a class="logo" href="/" aria-label="BoozaThink 홈">
      <span class="logo-mark" aria-hidden="true">B</span>
      <span class="logo-text"><strong>BoozaThink</strong><span class="logo-sep">|</span><span class="logo-sub">사장님·셀러 손익 연구소</span></span>
    </a>
    <nav class="gnb-nav" id="gnb-nav" aria-label="주요 메뉴">
      <ul class="gnb-list">
        <li class="has-dd">
          <button class="dd-btn" aria-expanded="false" aria-haspopup="true" aria-controls="dd-calc">6대 실전 계산기 <span aria-hidden="true">▾</span></button>
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
      <p>대한민국 700만 자영업자·1인 창업가·이커머스 셀러를 위한 실전 손익 & 정책자금 인텔리전스 플랫폼. 모든 계산은 브라우저에서 즉시 수행되며 민감한 입력값은 서버에 저장되지 않습니다.</p>
    </div>
    <div class="f-col"><h3>6대 실전 계산기</h3><ul>${CALCULATORS.map((c) => `<li><a href="/calculators/${c.slug}">${esc(c.short)}</a></li>`).join('')}</ul></div>
    <div class="f-col"><h3>카테고리</h3><ul>${categories.map((c) => `<li><a href="/category/${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul></div>
    <div class="f-col"><h3>연구소</h3><ul><li><a href="/about">BoozaThink 소개</a></li><li><a href="/privacy-policy">개인정보처리방침</a></li><li><a href="/terms-of-service">이용약관</a></li><li><a href="/contact">제휴·오류 제보</a></li><li><a href="/llms.txt">AI 팩트시트 (llms.txt)</a></li></ul></div>
  </div>
  <div class="footer-src">
    <p><strong>데이터 기준 출처</strong> · 소상공인시장진흥공단 · 공정거래위원회 · 국세청 · 고용노동부(2026·2027 최저임금 고시) · 국민건강보험공단 · 법제처(상가임대차보호법) · 중소기업중앙회 노란우산 (검증일 ${facts.VERIFIED_AT})</p>
    <p class="f-legal">본 사이트의 시뮬레이션 결과는 공개 법령·고시 요율에 기반한 일반 참고용 추정치이며 세무·노무·법률·금융 자문이 아닙니다. 실제 정산액·세액·대출 조건은 계약서, 공고문, 전문가 상담으로 최종 확인하세요. · <a href="/about">소개</a> · <a href="/privacy-policy">개인정보처리방침</a> · <a href="/terms-of-service">이용약관</a> · <a href="/contact">문의</a></p>
    <p class="f-copy">© ${year} BoozaThink. All rights reserved.</p>
  </div>
</footer>`;
}

function externalTrackingHead() {
  const out = [];
  if (process.env.GOOGLE_SITE_VERIFICATION) {
    out.push(`<meta name="google-site-verification" content="${esc(process.env.GOOGLE_SITE_VERIFICATION)}">`);
  }
  if (process.env.NAVER_SITE_VERIFICATION) {
    out.push(`<meta name="naver-site-verification" content="${esc(process.env.NAVER_SITE_VERIFICATION)}">`);
  }
  if (process.env.GA_MEASUREMENT_ID) {
    const gid = esc(process.env.GA_MEASUREMENT_ID.trim());
    out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${gid}"></script>`);
    out.push(`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gid}',{anonymize_ip:true});</script>`);
  }
  if (process.env.CLARITY_PROJECT_ID) {
    const cid = esc(process.env.CLARITY_PROJECT_ID.trim());
    out.push(`<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${cid}");</script>`);
  }
  if (process.env.ADSENSE_CLIENT) {
    out.push(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(process.env.ADSENSE_CLIENT.trim())}" crossorigin="anonymous"></script>`);
  }
  return out.join('\n');
}

function render(opts, categories) {
  const title = opts.fullTitle || (opts.title ? `${opts.title} | BoozaThink` : `BoozaThink | ${SITE.tagline}`);
  const desc = opts.description || SITE.description;
  const canonical = abs(opts.path || '/');
  const ogImage = abs('/img/og-image.png');
  const ld = (opts.jsonld || []).map(jsonLd).join('\n');
  const scripts = (opts.scripts || []).map((s) => `<script src="${s}" defer></script>`).join('\n');
  const robotContent = opts.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const analyticsScript = opts.skipAnalytics ? '' : `<script src="/js/analytics.js?v=${ASSET_V}" defer></script>`;
  return `<!doctype html>
<html lang="ko" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${opts.keywords ? `<meta name="keywords" content="${esc(opts.keywords.join(', '))}">` : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta name="robots" content="${robotContent}">
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
${opts.skipAnalytics ? '' : externalTrackingHead()}
</head>
<body class="${opts.bodyClass || ''}">
<a class="skip" href="#main">본문 바로가기</a>
${gnb(categories, opts.current)}
<main id="main" class="main">
${opts.body}
</main>
${footer(categories)}
<script src="/js/app.js?v=${ASSET_V}" defer></script>
${analyticsScript}
${scripts}
</body>
</html>`;
}

module.exports = { SITE, CALCULATORS, esc, jsonLd, abs, breadcrumbLd, faqLd, breadcrumbHtml, faqHtml, render, ASSET_V };
