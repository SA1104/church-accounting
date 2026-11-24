'use strict';
const facts = require('../data/facts');
const { icon } = require('./icons');
const { getCurrentAndNextMonth } = require('../data/calendar-events');

const SITE = {
  url: (process.env.SITE_URL || 'https://boozathink.com').replace(/\/$/, ''),
  name: 'BoozaThink',
  tagline: '사장님·셀러 손익 & 자금 연구소',
  description: '창업 초기 보증금·인테리어·계절별 1년 수익 시뮬레이션부터 배달앱 순수익, 셀러 손익분기 ROAS, 주휴수당·무인화, 부가세·종소세, 상가 환산보증금, 사업자 대출·정책자금 비교까지. 현장 경험과 정밀 데이터로 만든 사업자 의사결정 플랫폼.',
  email: 'contact@boozathink.com',
  locale: 'ko_KR'
};

const CALCULATORS = [
  { slug: 'startup-master', short: '창업 풀코스 A-to-Z 설계', name: '업종별 창업 초기자금 · 12개월 계절 손익 · 대출원리금 통합 시뮬레이터', iconKey: 'compass', desc: '업종 선택부터 보증금·인테리어·원가·수수료·키오스크 보조금·세금·대출 이자까지 1년 실수익을 빈틈없이 설계합니다.', category: 'delivery-store-profit', featured: true },
  { slug: 'delivery-margin', short: '배달앱 순수익 · 메뉴가 역산', name: '배민·쿠팡이츠·요기요 배달앱 진짜 순수익 & 목표 마진 메뉴가 역산기', iconKey: 'delivery', desc: '업종별 표준 원가율 비교와 함께 중개·결제수수료, 배달비, 부가세를 뺀 1주문 순수익과 목표 메뉴가를 역산합니다.', category: 'delivery-store-profit' },
  { slug: 'seller-roas', short: '셀러 마진 · 손익분기 ROAS', name: '스마트스토어·쿠팡(로켓그로스/윙) 셀러 마진 & 손익분기 ROAS 계산기', iconKey: 'parcel', desc: '환율 연동 사입원가부터 마켓 수수료·반품 손실까지 반영한 손익분기 ROAS와 최대 허용 CPA를 판독합니다.', category: 'ecommerce-seller-lab' },
  { slug: 'labor-automation', short: '주휴수당 절벽 · 무인화 회수', name: '알바 주휴수당 15시간 절벽 vs 테이블오더·키오스크 원금회수 계산기', iconKey: 'clock', desc: '최신 최저임금·4대보험 고시 기준 주 15시간 인건비 절벽과 무인기기 도입 시 원금회수 개월 수를 비교합니다.', category: 'labor-tax-franchise' },
  { slug: 'vat-income-tax', short: '부가세 · 종소세 · 세후 실수령', name: '개인사업자 부가세(간이·일반) & 종합소득세·노란우산 실수령 계산기', iconKey: 'tax', desc: '간이·일반 부가세 비교부터 종합소득세 8단계 세율, 노란우산 절세액, 세후 월 실수령액까지 통합 계산합니다.', category: 'labor-tax-franchise' },
  { slug: 'store-rent-breakeven', short: '상가 환산보증금 · 손익분기', name: '상가 월세·환산보증금 5% 상한 판독 & 매장 손익분기점·권리금 회수 계산기', iconKey: 'store', desc: '상가임대차보호법 환산보증금(5% 상한 여부), 일매출 손익분기점(BEP), 권리금·시설비 회수 기간을 진단합니다.', category: 'delivery-store-profit' },
  { slug: 'policy-funds', short: '정책자금 · 저금리 대환 매칭', name: '소상공인 정책자금 · 4.5% 대환대출 · 스마트상점 보조금 매칭기', iconKey: 'bank', desc: '업종·업력·매출 조건에 맞는 정책자금을 매칭하고 고금리 대환 이자 절감액과 보조금 자부담을 계산합니다.', category: 'policy-funds-grants' }
];

const ASSET_V = '20261123a';

function normalizeAdSenseClient(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const digits = s.replace(/^(?:ca-)?pub-/i, '').trim();
  if (!/^\d{10,20}$/.test(digits)) return null;
  return { caPub: `ca-pub-${digits}`, pub: `pub-${digits}` };
}

function yearEndFreeInfo() {
  const kstNow = new Date(Date.now() + 9 * 3600 * 1000);
  const year = kstNow.getUTCFullYear();
  const endUtcMs = Date.UTC(year, 11, 31, 23, 59, 59);
  const daysLeft = Math.max(0, Math.ceil((endUtcMs - kstNow.getTime()) / 86400000));
  const dBadge = daysLeft > 0 ? `D-${daysLeft}` : '상시 제공';
  return { year, daysLeft, dBadge };
}

function freeOpenBanner(mode) {
  if (mode === 'hero') {
    return `<div class="free-open-box" data-free-open="hero">
      <span class="free-open-badge">회원가입 없이 즉시 계산 · A·B·C안 비교</span>
      <div class="free-open-body"><strong>30개 창업 업종 12개월 손익 설계부터 배달·셀러·세금·정책자금 한도 진단까지 별도 가입 없이 바로 이용할 수 있습니다.</strong> 고민 중인 조건을 A·B·C안으로 저장해 나란히 비교하고 결과 영수증 이미지와 링크로 보관해 두세요.</div>
    </div>`;
  }
  return `<div class="free-open-box" data-free-open="calc">
    <span class="free-open-badge">회원가입 없이 즉시 계산 · 조건 저장·비교</span>
    <div class="free-open-body"><strong>모든 세부 항목 설정과 A·B·C안 조건 비교, 고해상도 비교표·영수증 이미지 저장을 바로 이용할 수 있습니다.</strong> 입력하신 개별 수치는 서버 데이터베이스에 저장되지 않습니다.</div>
  </div>`;
}

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
  const partCalcs = CALCULATORS.filter((c) => !c.featured);
  const calcItems = partCalcs.map((c) => `<li><a href="/calculators/${c.slug}" role="menuitem"><span class="ico-box-sm">${icon(c.iconKey, 17)}</span><span><strong>${esc(c.short)}</strong><small>${esc(c.desc)}</small></span></a></li>`).join('');
  const catItems = categories.map((c) => `<li><a href="/category/${c.slug}" role="menuitem"><span class="ico-box-sm">${icon('book', 16)}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.description)}</small></span></a></li>`).join('');
  return `
<header class="gnb" id="top">
  <div class="gnb-inner">
    <a class="logo" href="/" aria-label="BoozaThink 홈">
      <span class="logo-mark" aria-hidden="true">B</span>
      <span class="logo-text"><strong>BoozaThink</strong><span class="logo-sep">|</span><span class="logo-sub">사업자 손익·자금 연구소</span></span>
    </a>
    <nav class="gnb-nav" id="gnb-nav" aria-label="주요 메뉴">
      <ul class="gnb-list">
        <li><a href="/start-guide"${current === 'start-guide' ? ' aria-current="page"' : ''}>첫 창업 1년 순서표</a></li>
        <li><a href="/calculators/startup-master"${current === 'startup-master' ? ' aria-current="page"' : ''}>창업 전체 수익 계산</a></li>
        <li class="has-dd">
          <button class="dd-btn" aria-expanded="false" aria-haspopup="true" aria-controls="dd-calc">상황별 손익 계산기 <span aria-hidden="true">▾</span></button>
          <ul class="dd" id="dd-calc" role="menu">
            ${calcItems}
            <li><a href="/requests" role="menuitem"><span class="ico-box-sm">${icon('sliders', 16)}</span><span><strong>필요한 계산기 신청 · 투표</strong><small>원하는 새 계산기·업종을 투표하거나 직접 제안</small></span></a></li>
            <li class="dd-all"><a href="/calculators">전체 계산기 한눈에 보기 →</a></li>
          </ul>
        </li>
        <li><a href="/funding"${current === 'funding' ? ' aria-current="page"' : ''}>사업자 대출·정책자금</a></li>
        <li><a href="/commercial-area"${current === 'commercial' ? ' aria-current="page"' : ''}>상권·입지 분석</a></li>
        <li class="has-dd">
          <button class="dd-btn" aria-expanded="false" aria-haspopup="true" aria-controls="dd-bible" style="color:var(--text-2)">실전 가이드 <span aria-hidden="true">▾</span></button>
          <ul class="dd" id="dd-bible" role="menu">
            <li><a href="/calendar" role="menuitem"><span class="ico-box-sm">${icon('clock', 16)}</span><span><strong>12개월 세무·자금 달력</strong><small>매달 챙길 부가세·종소세·정책자금 일정</small></span></a></li>
            <li><a href="/datasets" role="menuitem"><span class="ico-box-sm">${icon('layers', 16)}</span><span><strong>업종별 비용 · 세율 · 금리 공개 기준표</strong><small>법정 세율 · 최저임금 · 임대차 상한 공식 기준 열람</small></span></a></li>
            ${catItems}
            <li class="dd-all"><a href="/bible">실전 가이드 전체 보기 →</a></li>
          </ul>
        </li>
      </ul>
    </nav>
    <div class="gnb-actions">
      <button class="icon-btn" id="theme-toggle" type="button" aria-label="다크 모드 전환" title="라이트/다크 모드"><span class="i-sun">${icon('sun', 17)}</span><span class="i-moon">${icon('moon', 17)}</span></button>
      <button class="icon-btn menu-btn" id="menu-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="gnb-nav">☰</button>
    </div>
  </div>
</header>`;
}

function seasonBar() {
  const { current } = getCurrentAndNextMonth();
  return `<div class="season-bar" role="region" aria-label="이달의 세무·자금 점검 안내">
  <div class="container season-inner">
    <span class="season-pill">${current.month}월 사업자 필수 점검</span>
    <span class="season-msg">${esc(current.headline)} — 30개 업종 12개월 손익 · 배달 · 세금 · 정책자금 한도를 회원가입 없이 바로 비교해 보세요</span>
    <a class="season-link" href="/calculators/startup-master">창업·손익 계산하기 →</a>
  </div>
</div>`;
}

function footer(categories) {
  const year = new Date().getFullYear();
  return `
<footer class="footer">
  <div class="footer-inner">
    <div class="f-brand">
      <a class="logo" href="/"><span class="logo-mark" aria-hidden="true">B</span><span class="logo-text"><strong>BoozaThink</strong></span></a>
      <p>창업 초기부터 매장 운영, 세무, 확장 자금 조달까지 — 현장 사업·금융 실무자의 경험과 정밀 데이터 계산 엔진을 결합해 진심을 담아 만든 부자생각(BoozaThink) 의사결정 연구소입니다. 입력하신 개별 수치는 서버 데이터베이스에 저장되지 않습니다.</p>
    </div>
    <div class="f-col"><h3>핵심 시뮬레이터</h3><ul>${CALCULATORS.slice(0, 5).map((c) => `<li><a href="/calculators/${c.slug}">${esc(c.short)}</a></li>`).join('')}<li><a href="/calculators">전체 계산기 보기</a></li><li><a href="/requests">필요한 계산기 신청 · 투표</a></li></ul></div>
    <div class="f-col"><h3>창업 · 자금 · 상권</h3><ul><li><a href="/start-guide">첫 창업 1년 할 일 순서표</a></li><li><a href="/funding">사업자 대출 · 정책자금 라운지</a></li><li><a href="/commercial-area">우리 동네 상권 · 지도 분석</a></li><li><a href="/calendar">12개월 세무 · 자금 달력</a></li>${categories.slice(0, 2).map((c) => `<li><a href="/category/${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul></div>
    <div class="f-col"><h3>기준 자료 · 이용 안내</h3><ul><li><a href="https://www.youtube.com/@BoozaThink" target="_blank" rel="noopener">공식 유튜브 · 부자생각</a></li><li><a href="/datasets">업종별 평균 비용 · 세율 기준표</a></li><li><a href="/about">서비스 소개 & 데이터 원칙</a></li><li><a href="/privacy-policy">개인정보처리방침</a></li><li><a href="/terms-of-service">이용약관 · 면책고지</a></li><li><a href="/contact">제휴 · 오류 제보</a></li></ul></div>
  </div>
  <div class="footer-src">
    <p><strong>공식 데이터 출처 및 각주</strong> · 소상공인시장진흥공단 · 공정거래위원회 · 국세청 · 고용노동부(현행 및 차기 확정 최저임금 고시 반영) · 한국은행·은행연합회·금융투자협회 공시 지표 · 법제처(상가건물 임대차보호법) · 중소기업중앙회 (최신 검증 기준일 ${facts.VERIFIED_AT} · 77개 핵심 수식 자동 검산 완료)</p>
    <p class="f-legal">본 플랫폼의 시뮬레이션 결과는 최신 공개 법령·고시 요율에 기반한 참고용 추정치이며 세무·노무·법률·금융 자문이나 대출 승인을 보장하지 않습니다. 중요한 의사결정 전에는 반드시 계약서·공고문 확인 및 전문가 상담을 진행하세요. · <a href="/about">소개</a> · <a href="/privacy-policy">개인정보처리방침</a> · <a href="/terms-of-service">이용약관</a> · <a href="/contact">문의</a></p>
    <p class="f-copy">© ${year} BoozaThink Lab. Crafted with field experience & precision modeling.</p>
  </div>
</footer>`;
}

function extractMetaToken(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const m = /content=["']([^"']+)["']/i.exec(s);
  return (m ? m[1] : s).replace(/[<>"'\s]/g, '').slice(0, 120);
}

function externalTrackingHead(runtimeCfg) {
  const cfg = runtimeCfg && typeof runtimeCfg === 'object' ? runtimeCfg : { adsense: runtimeCfg };
  const out = [];
  const gscTok = extractMetaToken(process.env.GOOGLE_SITE_VERIFICATION || cfg.gsc);
  const navTok = extractMetaToken(process.env.NAVER_SITE_VERIFICATION || cfg.naver);
  if (gscTok) out.push(`<meta name="google-site-verification" content="${esc(gscTok)}">`);
  if (navTok) out.push(`<meta name="naver-site-verification" content="${esc(navTok)}">`);
  if (process.env.GA_MEASUREMENT_ID) {
    const gid = esc(process.env.GA_MEASUREMENT_ID.trim());
    out.push(`<script async src="https://www.googletagmanager.com/gtag/js?id=${gid}"></script>`);
    out.push(`<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gid}',{anonymize_ip:true});</script>`);
  }
  if (process.env.CLARITY_PROJECT_ID) {
    const cid = esc(process.env.CLARITY_PROJECT_ID.trim());
    out.push(`<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${cid}");</script>`);
  }
  const ads = normalizeAdSenseClient(process.env.ADSENSE_CLIENT || cfg.adsense);
  if (ads) {
    out.push(`<meta name="google-adsense-account" content="${esc(ads.caPub)}">`);
    out.push(`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ads.caPub)}" crossorigin="anonymous"></script>`);
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
${opts.simToken ? `<meta name="bt-sim-token" content="${esc(opts.simToken)}">` : ''}
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
${opts.skipAnalytics ? '' : externalTrackingHead(opts.runtimeCfg)}
</head>
<body class="${opts.bodyClass || ''}">
<a class="skip" href="#main">본문 바로가기</a>
${gnb(categories, opts.current)}
${opts.skipAnalytics ? '' : seasonBar()}
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

module.exports = { SITE, CALCULATORS, esc, jsonLd, abs, breadcrumbLd, faqLd, breadcrumbHtml, faqHtml, render, ASSET_V, yearEndFreeInfo, freeOpenBanner, normalizeAdSenseClient, extractMetaToken };
