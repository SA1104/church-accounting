'use strict';
const E = require('../public/js/calc-engine.js');
const { esc, CALCULATORS, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const facts = require('../data/facts');

function fmtDate(d) { const [y, m, dd] = String(d).split('-'); return `${y}년 ${Number(m)}월 ${Number(dd)}일`; }

function articleCard(a, cat) {
  return `<a class="a-card card" href="/bible/${a.slug}"><span class="a-cat">${cat ? esc(cat.icon + ' ' + cat.short) : ''}</span><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><span class="a-meta">${a.readingMinutes}분 읽기 · ${fmtDate(a.updatedAt)} 업데이트</span></a>`;
}

function miniCalc(m) {
  const def = E.MINI[m.type];
  if (!def) return '';
  const values = {};
  def.inputs.forEach((i) => { values[i[0]] = m.values && m.values[i[0]] != null ? Number(m.values[i[0]]) : (i[2] + i[3]) / 2; });
  const rows = E.mini(m.type, values);
  const id = 'mc-' + m.type;
  return `<aside class="mini-calc card" data-mini="${esc(m.type)}" id="${id}" aria-label="${esc(m.title)}">
  <div class="mc-head"><span class="pill">⚡ 3초 미니 계산기</span><h3>${esc(m.title)}</h3></div>
  <div class="mc-body">
    <div class="mc-inputs">${def.inputs.map(([k, label, min, max, step, unit]) => {
      const v = values[k];
      const lo = Math.min(min, v), hi = Math.max(max, v);
      return `<div class="mc-field"><label for="${id}-${k}">${esc(label)} <output class="tnum" data-mc-val="${k}">${E.fmt(v, 2)}${esc(unit)}</output></label><input type="range" id="${id}-${k}" data-mc="${k}" min="${lo}" max="${hi}" step="${step}" value="${v}" data-unit="${esc(unit)}"></div>`;
    }).join('')}</div>
    <dl class="mc-out tnum" data-mc-out>${rows.map((r) => `<div class="${r[2] || ''}"><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
  </div>
  <a class="btn btn-primary mc-cta" href="${esc(m.cta.href)}">${esc(m.cta.label)} →</a>
</aside>`;
}

function home(ctx) {
  const { categories, byCategory, articles } = ctx;
  const sample = E.delivery({ plan: 'baemin-78', price: 20000, cost: 7000 });
  const faq = [
    { q: 'BoozaThink는 어떤 서비스인가요?', a: 'BoozaThink는 배달·외식 사장님, 스마트스토어·쿠팡 셀러, 1인 창업가를 위한 손익 연구소입니다. 배달앱 순수익, 손익분기 ROAS, 정책자금 매칭, 2026·2027 최저시급 주휴수당 절벽과 무인화 원금회수, 개인사업자 부가세·종소세·실수령, 상가 월세·환산보증금·BEP를 계산하는 6대 시뮬레이터와 20편의 실전 바이블을 무료로 제공합니다.' },
    { q: '2026년 기준과 2027년 바뀌는 제도가 모두 반영되어 있나요?', a: '네. 현재 적용 중인 2026년 기준(최저시급 10,320원·국민연금 9.5%)과 2027년 1월 1일 시행 확정 고시(최저시급 10,700원·국민연금 10.0%·장기요양 13.90%)를 시기에 맞게 분리·비교 제공하며, 1월 부가가치세 신고와 상반기 정책자금 공고 일정까지 반영합니다.' },
    { q: '회원가입이나 비용이 필요한가요?', a: '아니요. 모든 계산기와 바이블은 회원가입 없이 무료로 이용할 수 있으며, 매출·원가 같은 민감한 입력값은 브라우저에서만 계산되고 서버에 저장되지 않습니다.' },
    { q: '계산 결과를 동업자나 세무사에게 공유할 수 있나요?', a: '각 계산기의 결과 링크 복사 버튼을 누르면 입력값이 담긴 URL이 복사되어 같은 화면을 그대로 공유할 수 있고, 손익 진단 영수증 PNG 저장 버튼으로 이미지를 만들어 단톡방이나 스레드에 올릴 수 있습니다.' }
  ];
  const body = `
<section class="hero">
  <div class="container hero-inner">
    <div class="hero-copy">
      <span class="eyebrow">2026·2027 사장님·셀러 손익 & 정책자금 인텔리전스</span>
      <h1>매출 말고, <em>남는 돈</em>을<br>계산하세요.</h1>
      <p class="lead">배민·쿠팡이츠 수수료를 뺀 1주문 순수익, 광고해도 적자 안 나는 손익분기 ROAS, 소상공인 정책자금 매칭, 2026·2027 최저시급 인건비 절벽, 1월 부가세·5월 종소세 실수령, 상가 환산보증금 5% 상한까지. 사장님의 모든 숫자를 즉시 계산합니다.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-lg" href="/calculators/delivery-margin">배달앱 순수익 계산하기</a><a class="btn btn-lg" href="/calculators/vat-income-tax">부가세·종소세 실수령 계산</a></div>
      <ul class="hero-stats tnum"><li><strong>${CALCULATORS.length}</strong><span>실전 시뮬레이터</span></li><li><strong>${articles.length}</strong><span>심층 바이블</span></li><li><strong>0원</strong><span>가입·이용료</span></li></ul>
    </div>
    <div class="hero-receipt" aria-label="예시 손익 진단 영수증">
      <div class="receipt">
        <p class="r-title">점포 손익 진단 영수증</p><p class="r-sub">배민 상생 1구간 · 2만원 메뉴</p><hr>
        <p><span>판매가</span><span>20,000</span></p><p><span>중개수수료 7.8%</span><span>-1,560</span></p><p><span>결제수수료 3%</span><span>-600</span></p><p><span>사장님 부담 배달비</span><span>-3,400</span></p><p><span>식자재·포장 원가</span><span>-7,000</span></p><p><span>부가세 1/11</span><span>-1,818</span></p><hr>
        <p class="r-total"><span>1주문 순수익</span><span>${E.fmt(Math.round(sample.net))}원</span></p><p class="r-sub">순마진율 ${E.pct(sample.margin)}</p><p class="r-foot">BOOZATHINK.COM</p>
      </div>
    </div>
  </div>
</section>
<div class="container">
  <section class="sec"><div class="sec-head"><h2>6대 실전 시뮬레이터</h2><a href="/calculators">전체 보기 →</a></div>
    <div class="calc-grid calc-grid-6">${CALCULATORS.map((c) => `<a class="calc-card card" href="/calculators/${c.slug}"><span class="cc-ico" aria-hidden="true">${c.icon}</span><h3>${esc(c.short)}</h3><p>${esc(c.desc)}</p><span class="cc-cta">바로 계산 →</span></a>`).join('')}</div>
  </section>
  <section class="sec">${miniCalc({ type: 'delivery-compare', title: '같은 메뉴, 배달앱별로 얼마 남을까? (3초 비교)', values: { price: 20000, cost: 7000 }, cta: { href: '/calculators/delivery-margin?price=20000&cost=7000', label: '내 매장 조건으로 정밀 계산하기' } })}</section>
  ${categories.map((c) => `<section class="sec"><div class="sec-head"><h2>${c.icon} ${esc(c.name)}</h2><a href="/category/${c.slug}">카테고리 전체 →</a></div><p class="sec-desc">${esc(c.description)}</p><div class="a-grid">${(byCategory[c.slug] || []).slice(0, 3).map((a) => articleCard(a, c)).join('')}</div></section>`).join('')}
  <section class="sec prose why"><h2>왜 BoozaThink인가요?</h2>
    <div class="why-grid"><div class="card"><h3>📐 공식을 숨기지 않습니다</h3><p>모든 계산기 하단에 계산 공식, 가정, 2026 현행 및 2027 확정 고시 요율표를 공개하고 40개 자동 검산 테스트로 검증합니다.</p></div><div class="card"><h3>🏛️ 공공 데이터 기준</h3><p>소상공인시장진흥공단, 공정거래위원회, 국세청, 고용노동부, 법제처 등 공식 기관의 고시와 법령을 검증일과 함께 명시합니다.</p></div><div class="card"><h3>🔒 입력값은 내 브라우저에만</h3><p>매출·원가·보증금 같은 민감한 숫자는 서버로 전송되지 않습니다. 업종별 익명 평균 비교를 위한 최소 지표만 집계합니다.</p></div></div>
  </section>
  ${faqHtml(faq)}
</div>`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'BoozaThink', alternateName: 'BoozaThink 사장님·셀러 손익 연구소', url: SITE.url, inLanguage: 'ko-KR', description: SITE.description },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'BoozaThink', url: SITE.url, logo: abs('/img/apple-touch-icon.png'), email: SITE.email },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'BoozaThink 6대 실전 계산기', itemListElement: CALCULATORS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: abs('/calculators/' + c.slug), name: c.name })) },
    faqLd(faq)
  ];
  return { body, jsonld };
}

function category(cat, ctx) {
  const list = ctx.byCategory[cat.slug] || [];
  const calcsInCat = CALCULATORS.filter((c) => c.category === cat.slug);
  const crumbs = [{ name: '홈', path: '/' }, { name: cat.name, path: '/category/' + cat.slug }];
  const body = `<div class="container">${breadcrumbHtml(crumbs)}
<header class="page-head"><span class="eyebrow">${cat.icon} 카테고리 · 바이블 ${list.length}편 · 시뮬레이터 ${calcsInCat.length}종</span><h1>${esc(cat.name)}</h1><p class="lead">${esc(cat.intro)}</p></header>
<div class="cat-calc-stack">${calcsInCat.map((calc) => `<a class="cat-calc card" href="/calculators/${calc.slug}"><span class="cc-ico" aria-hidden="true">${calc.icon}</span><div><strong>이 카테고리의 실전 시뮬레이터</strong><p>${esc(calc.name)}</p></div><span class="cc-cta">계산하기 →</span></a>`).join('')}</div>
<div class="a-grid">${list.map((a) => articleCard(a, cat)).join('')}</div>
<section class="prose"><h2>${esc(cat.short)} 바이블 읽는 순서</h2><ol>${list.map((a) => `<li><a href="/bible/${a.slug}">${esc(a.title)}</a> — ${esc(a.summary && a.summary[0] ? a.summary[0] : a.description)}</li>`).join('')}</ol>
<p>각 바이블은 공식 기관 고시와 플랫폼 공시를 기준으로 작성되었으며, 본문 중간의 3초 미니 계산기로 사장님 숫자를 바로 대입해 볼 수 있습니다.</p></section>
</div>`;
  const jsonld = [breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: cat.name, url: abs('/category/' + cat.slug), description: cat.description, inLanguage: 'ko-KR', hasPart: list.map((a) => ({ '@type': 'Article', headline: a.title, url: abs('/bible/' + a.slug) })) }];
  return { body, jsonld };
}

function article(a, ctx) {
  const cat = ctx.categoryBySlug[a.category];
  const calc = CALCULATORS.find((c) => a.miniCalc && a.miniCalc.cta && a.miniCalc.cta.href.startsWith('/calculators/' + c.slug)) || CALCULATORS.find((c) => c.slug === cat.calculator);
  const crumbs = [{ name: '홈', path: '/' }, { name: cat.name, path: '/category/' + cat.slug }, { name: a.title, path: '/bible/' + a.slug }];
  const toc = a.sections.map((s, i) => `<li><a href="#s${i + 1}">${esc(s.heading)}</a></li>`).join('') + '<li><a href="#cases">실패·성공 사례</a></li><li><a href="#faq-h">자주 묻는 질문</a></li>';
  const sections = a.sections.map((s, i) => `<section id="s${i + 1}"><h2>${esc(s.heading)}</h2>${s.html}</section>${i === a.miniCalcAfter ? miniCalc(a.miniCalc) : ''}`).join('\n');
  const cases = `<section id="cases" class="cases"><h2>실제 사장님 사례로 보는 손익</h2>${a.cases.map((c) => `<div class="case case-${c.kind === 'fail' ? 'fail' : 'success'}"><span class="case-tag">${c.kind === 'fail' ? '❌ 실패 사례' : '✅ 성공 사례'}</span><h3>${esc(c.title.replace(/^(실패|성공)\s*사례\s*[:：]\s*/, ''))}</h3>${c.html}</div>`).join('')}</section>`;
  const related = (a.related || []).map((s) => ctx.bySlug[s]).filter(Boolean);
  const moreInCat = (ctx.byCategory[a.category] || []).filter((x) => x.slug !== a.slug && !related.includes(x));
  const rel = related.concat(moreInCat).slice(0, 4);
  const body = `<div class="container article-wrap">
${breadcrumbHtml(crumbs)}
<article class="article" itemscope itemtype="https://schema.org/Article">
  <header class="a-head">
    <a class="eyebrow" href="/category/${cat.slug}">${cat.icon} ${esc(cat.name)}</a>
    <h1 itemprop="headline">${esc(a.title)}</h1>
    <p class="lead">${esc(a.lead)}</p>
    <p class="a-byline">BoozaThink 손익 연구소 · <time datetime="${a.publishedAt}" itemprop="datePublished">${fmtDate(a.publishedAt)}</time> 발행 · <time datetime="${a.updatedAt}" itemprop="dateModified">${fmtDate(a.updatedAt)}</time> 업데이트 · ${a.readingMinutes}분 읽기</p>
  </header>
  <div class="tldr card"><h2>핵심 요약</h2><ul>${a.summary.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
  <nav class="toc card" aria-label="목차"><h2>목차</h2><ol>${toc}</ol></nav>
  <div class="prose a-body" itemprop="articleBody">
    ${sections}
    ${cases}
  </div>
  <div class="cta-box card"><div><strong>${calc.icon} 내 숫자로 정밀하게 계산해 보세요</strong><p>${esc(calc.name)}</p></div><a class="btn btn-primary" href="${esc(a.miniCalc.cta.href)}">시뮬레이터 열기 →</a></div>
  ${faqHtml(a.faq)}
  <aside class="trust-box"><h2>데이터 검증 & 신뢰도 안내 (E-E-A-T)</h2>
    <p><strong>데이터 검증 기준일:</strong> ${fmtDate(a.updatedAt)} · <strong>작성·검수:</strong> BoozaThink 손익 연구소 편집팀</p>
    <p><strong>공식 참고 기관:</strong> ${a.sources.map((s) => `<a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.name)}</a>`).join(' · ')}</p>
    <p><strong>면책조항:</strong> 본 글의 수수료율·세율·보험요율·지원사업 조건은 작성 기준일의 공시와 고시를 바탕으로 한 일반 정보이며, 개별 계약·공고 차수·세무 처리에 따라 달라질 수 있습니다. 본문 계산 예시와 사례는 이해를 돕기 위해 재구성한 것으로 특정 사업장의 실제 결과를 보장하지 않으며, 세무·노무·법률·금융 자문을 대체하지 않습니다. 자세한 내용은 <a href="/terms-of-service">이용약관</a>과 <a href="/privacy-policy">개인정보처리방침</a>을 확인하세요.</p>
  </aside>
</article>
<section class="sec"><div class="sec-head"><h2>함께 읽으면 좋은 바이블</h2><a href="/category/${cat.slug}">${esc(cat.short)} 전체 →</a></div><div class="a-grid">${rel.map((x) => articleCard(x, ctx.categoryBySlug[x.category])).join('')}</div></section>
</div>`;
  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description, inLanguage: 'ko-KR',
      datePublished: a.publishedAt + 'T09:00:00+09:00', dateModified: a.updatedAt + 'T09:00:00+09:00', mainEntityOfPage: abs('/bible/' + a.slug),
      image: abs('/img/og-image.png'), articleSection: cat.name, keywords: (a.keywords || []).join(', '), wordCount: a.charCount,
      author: { '@type': 'Organization', name: 'BoozaThink 손익 연구소', url: abs('/about') },
      publisher: { '@type': 'Organization', name: 'BoozaThink', url: SITE.url, logo: { '@type': 'ImageObject', url: abs('/img/apple-touch-icon.png') } },
      citation: a.sources.map((s) => s.url)
    },
    breadcrumbLd(crumbs),
    faqLd(a.faq)
  ];
  return { body, jsonld };
}

function bibleIndex(ctx) {
  const crumbs = [{ name: '홈', path: '/' }, { name: '실전 바이블', path: '/bible' }];
  const body = `<div class="container">${breadcrumbHtml(crumbs)}
<header class="page-head"><span class="eyebrow">📚 BoozaThink 실전 바이블 ${ctx.articles.length}편</span><h1>사장님·셀러 실전 손익 바이블</h1><p class="lead">수수료 구조, 손익분기점, 정책자금 신청 순서, 2026·2027 인건비와 세금까지. 원 단위 계산 예시와 실제 사례, 3초 미니 계산기가 들어 있는 심층 가이드를 카테고리별로 정리했습니다.</p></header>
${ctx.categories.map((c) => `<section class="sec"><div class="sec-head"><h2>${c.icon} ${esc(c.name)}</h2><a href="/category/${c.slug}">카테고리 →</a></div><div class="a-grid">${(ctx.byCategory[c.slug] || []).map((a) => articleCard(a, c)).join('')}</div></section>`).join('')}
</div>`;
  return { body, jsonld: [breadcrumbLd(crumbs)] };
}

function legalPage(slug, title, desc, inner, extraLd) {
  const crumbs = [{ name: '홈', path: '/' }, { name: title, path: '/' + slug }];
  const body = `<div class="container narrow">${breadcrumbHtml(crumbs)}<article class="prose legal"><h1>${esc(title)}</h1>${inner}</article></div>`;
  return { body, jsonld: [breadcrumbLd(crumbs)].concat(extraLd || []), title, desc };
}

function about(ctx) {
  return legalPage('about', 'BoozaThink 연구소 소개', '', `
<p class="lead">BoozaThink(부자씽크)는 대한민국 700만 자영업자·1인 창업가·이커머스 셀러가 “매출”이 아니라 “남는 돈”으로 의사결정할 수 있도록 돕는 실전 손익 & 정책자금 연구소입니다.</p>
<h2>우리가 하는 일</h2>
<p>배달앱 수수료 개편, 마켓 수수료 체계 변경, 매년 바뀌는 최저임금·4대보험 요율(2026 현행 및 2027.1.1 확정 고시), 세법과 정책자금 공고는 사장님의 손익을 직접 바꾸지만 정보는 기관마다 흩어져 있습니다. BoozaThink는 이 숫자들을 단일 검증 마스터 데이터로 모아 ${CALCULATORS.length}대 실전 시뮬레이터와 ${ctx.articles.length}편의 심층 바이블로 무료 제공합니다.</p>
<h2>편집 및 수식 검증 원칙</h2>
<ol><li><strong>공식 출처 우선:</strong> 모든 요율·기준은 정부 부처 고시·법령, 플랫폼 공식 공지를 1차 출처로 하며 데이터 검증일을 명시합니다.</li><li><strong>시기별 정합성 유지:</strong> 당해연도 현행 기준과 차기연도 확정 고시 기준(예: 2026년 최저시급 10,320원 vs 2027년 확정 10,700원)을 명확히 구분하여 시기별 의사결정 착오를 막습니다.</li><li><strong>자동 수식 검산:</strong> 모든 계산기 공식은 공개되며, 국세청·고용노동부·상가임대차보호법 기준 수기 검산 테스트를 통과한 후에만 배포됩니다.</li><li><strong>이해상충 배제:</strong> 특정 금융상품·플랫폼의 대가성 위장 홍보 글을 게재하지 않으며, 광고 영역은 본문과 명확히 구분합니다.</li></ol>
<h2>공식 공공데이터 참조 출처</h2>
<ul>${facts.SOURCES.map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.name)}</a></li>`).join('')}</ul>
<h2>한계와 책임</h2>
<p>BoozaThink의 계산 결과와 콘텐츠는 일반적인 참고 정보이며 세무·노무·법률·금융 자문이 아닙니다. 중요한 계약·신고·대출 결정 전에는 세무사, 공인노무사, 변호사, 금융기관 등 전문가와 상담하시기 바랍니다. 오류 제보는 <a href="/contact">제휴·오류 제보</a> 페이지에서 접수받습니다.</p>
<p>관련 문서: <a href="/privacy-policy">개인정보처리방침</a> · <a href="/terms-of-service">이용약관</a></p>`,
  [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'BoozaThink 연구소 소개', url: abs('/about') }]);
}

function privacy() {
  return legalPage('privacy-policy', '개인정보처리방침', '', `
<p>BoozaThink(이하 “사이트”)는 「개인정보 보호법」 등 관련 법령을 준수하며 이용자의 개인정보를 보호합니다. 본 방침은 ${facts.VERIFIED_AT}부터 시행됩니다.</p>
<h2>1. 수집·처리하는 정보 및 이용 목적</h2>
<ul>
  <li><strong>시뮬레이터 입력값 비저장 원칙:</strong> 매출, 원가, 급여, 보증금, 대출액 등 이용자가 시뮬레이터에 입력하는 개별 수치는 이용자 브라우저 내에서만 연산되며 서버에 원본 형태로 저장되지 않습니다. 단, ‘결과 링크 복사’ 기능을 사용하면 입력 파라미터가 URL에 포함되므로 공유 대상은 이용자가 직접 관리해야 합니다.</li>
  <li><strong>익명 시뮬레이션 벤치마크 통계:</strong> 업종별 평균 비교 기능 제공을 위해 계산기 종류, 업종 분류, 결과 비율(순마진율·손익분기 ROAS·세부담률 등)만 개인 식별 정보 없이 익명으로 집계합니다.</li>
  <li><strong>자체 익명 방문·체류 통계:</strong> 서비스 품질 및 콘텐츠 개선을 위해 쿠키를 사용하지 않고 방문 경로, 유입 출처 도메인, 화면 체류 시간, 스크롤 비율, 기기 유형(모바일/PC)을 일 단위 단방향 해시 기반으로 익명 집계합니다(원본 IP 주소는 통계 테이블에 저장하지 않습니다).</li>
  <li><strong>제휴 및 오류 제보 접수:</strong> 이용자가 <a href="/contact">제휴·오류 제보</a> 양식을 직접 제출하는 경우 회신 및 사실 확인을 위해 이메일 주소, 관련 URL, 문의 내용을 수집하며 처리 완료 후 1년 이내 파기합니다.</li>
</ul>
<h2>2. 쿠키, 로컬 저장소 및 웹 분석 도구</h2>
<ul>
  <li>사이트는 이용자의 라이트/다크 화면 테마 설정을 기억하기 위해 브라우저 로컬 저장소(<code>localStorage</code>)를 사용합니다.</li>
  <li>사이트는 방문 트래픽 및 이용성 분석을 위해 Google Analytics 4(IP 익명화 적용) 및 Microsoft Clarity 등 웹 분석 도구를 사용할 수 있습니다. 이용자는 브라우저 쿠키 차단 설정 또는 <a href="https://tools.google.com/dlpage/gaoptout" rel="nofollow noopener" target="_blank">Google 애널리틱스 차단 브라우저 부가기능</a>을 통해 수집을 거부할 수 있습니다.</li>
</ul>
<h2>3. Google AdSense 및 제3자 광고 쿠키 안내</h2>
<p>사이트는 무료 서비스 운영을 위해 Google AdSense 등 제3자 광고 서비스를 이용할 수 있습니다. Google을 포함한 제3자 광고 사업자는 쿠키(DoubleClick DART 쿠키 등)를 사용하여 이용자의 본 사이트 및 타 웹사이트 방문 기록에 기반한 맞춤형 광고를 제공할 수 있습니다.</p>
<ul>
  <li>이용자는 <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">Google 광고 설정</a>에서 개인 맞춤 광고를 언제든지 해제할 수 있습니다.</li>
  <li>제3자 광고 사업자의 맞춤 광고 쿠키 사용은 <a href="https://www.aboutads.info/choices" rel="nofollow noopener" target="_blank">www.aboutads.info</a>에서 통합 관리할 수 있습니다.</li>
  <li>Google이 파트너 사이트의 데이터를 처리하는 방식은 <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">Google 파트너 사이트 정책</a>에서 확인할 수 있습니다.</li>
</ul>
<h2>4. 개인정보의 제3자 제공 및 인프라 위탁</h2>
<p>사이트는 법령에 근거가 있는 경우를 제외하고 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 안정적인 웹 호스팅, 데이터베이스 보안 저장, CDN 전송을 위해 검증된 클라우드 인프라 사업자(Render, Supabase, Cloudflare)를 이용하며 모든 데이터베이스 테이블에는 행 단위 보안 정책(RLS)이 강제 적용됩니다.</p>
<h2>5. 이용자의 권리 및 문의처</h2>
<p>이용자는 언제든지 본인이 제출한 문의 내역의 열람·정정·삭제를 요청할 수 있습니다. 개인정보 보호 관련 문의는 아래 창구로 연락해 주시면 지체 없이 조치합니다.</p>
<ul><li>개인정보 보호책임 및 운영팀: <a href="mailto:${SITE.email}">${SITE.email}</a> · <a href="/contact">온라인 문의 양식</a></li></ul>
<p>관련 문서: <a href="/terms-of-service">이용약관</a> · <a href="/about">연구소 소개</a></p>`);
}

function terms() {
  return legalPage('terms-of-service', '이용약관', '', `
<p>본 약관은 BoozaThink(이하 “사이트”)가 제공하는 시뮬레이터, 콘텐츠 및 제반 서비스(이하 “서비스”)의 이용 조건과 책임 범위를 규정합니다. 시행일: ${facts.VERIFIED_AT}.</p>
<h2>제1조 (서비스의 목적)</h2>
<p>서비스는 배달앱 순수익, 이커머스 손익분기 ROAS, 소상공인 정책자금 매칭, 최저임금·주휴수당·무인화 회수기간, 개인사업자 부가세·종합소득세, 상가 환산보증금·손익분기점 등 사업자 의사결정을 돕는 시뮬레이션 도구와 실무 가이드를 무료로 제공합니다.</p>
<h2>제2조 (시뮬레이션 결과의 법적 성격 및 면책)</h2>
<ol>
  <li>서비스의 모든 계산값(순수익, 마진율, 손익분기 ROAS, 부가가치세, 종합소득세, 노란우산 절세액, 주휴수당, 4대보험료, 환산보증금 판독, 대출 이자 절감액, 보조금 자부담금 등)은 공개된 일반 요율과 표준 산식에 기초한 <strong>모의 추정치</strong>이며 실제 정산액·고지세액·법적 권리·대출 승인 결과를 보증하지 않습니다.</li>
  <li>서비스는 <strong>세무사·공인회계사·공인노무사·변호사·금융기관의 전문 자문을 대체하지 않습니다.</strong> 개별 특약, 감면 요건, 지방자치단체 조례, 예산 소진 여부에 따라 실제 결과는 달라질 수 있습니다.</li>
  <li>이용자가 서비스 정보만을 근거로 행한 가격 책정, 임대차 계약, 고용, 세무 신고, 투자 등의 결과에 대하여 사이트는 고의 또는 중대한 과실이 없는 한 법적 책임을 부담하지 않습니다.</li>
</ol>
<h2>제3조 (지식재산권 및 인용)</h2>
<p>사이트의 글, 표, 계산 로직, UI 디자인에 대한 저작권은 BoozaThink에 귀속됩니다. 출처(<code>https://boozathink.com</code>)를 명시한 비상업적 공유 및 AI 검색 엔진의 <code>/llms.txt</code> 기반 출처 인용을 허용하며, 출처 없는 대량 무단 복제·전재를 금지합니다.</p>
<h2>제4조 (이용 제한 및 서비스 변경)</h2>
<p>비정상적인 자동화 부하 유발, 보안 취약점 탐색 등 정상 운영을 저해하는 행위는 차단될 수 있으며, 법령·제도 개정에 맞추어 서비스 계산식과 콘텐츠는 수시 업데이트됩니다.</p>
<h2>제5조 (준거법)</h2>
<p>본 약관은 대한민국 법령에 따라 해석됩니다. 문의: <a href="/contact">제휴·오류 제보</a> · <a href="mailto:${SITE.email}">${SITE.email}</a></p>`);
}

function contact() {
  return legalPage('contact', '제휴 및 오류 제보', '', `
<p class="lead">수수료율·세법·최저임금·정책자금 공고 변경 제보나 계산식 개선 의견, 교육·콘텐츠 제휴 문의를 아래 양식으로 남겨 주시면 연구소 편집팀이 공식 출처 대조 후 신속히 반영합니다.</p>
<div class="card contact-card">
  <h2>📩 온라인 오류 제보 · 제휴 문의 접수</h2>
  <form id="contact-form" class="contact-form" novalidate>
    <div class="field">
      <label for="c-cat">문의 유형</label>
      <select id="c-cat" name="category">
        <option value="error">수수료·세율·계산식 오류 제보</option>
        <option value="policy">신규 정책자금·공고 업데이트 요청</option>
        <option value="partnership">교육·미디어·콘텐츠 제휴 문의</option>
        <option value="general">기타 의견 및 제안</option>
      </select>
    </div>
    <div class="field">
      <label for="c-email">회신받을 이메일 <span class="hint">필수</span></label>
      <div class="num"><input type="email" id="c-email" name="email" required placeholder="you@example.com" style="text-align:left"></div>
    </div>
    <div class="field">
      <label for="c-url">관련 페이지 URL <span class="hint">선택 (계산기 공유 링크 등)</span></label>
      <div class="num"><input type="url" id="c-url" name="page_url" placeholder="https://boozathink.com/calculators/..." style="text-align:left"></div>
    </div>
    <div class="field" style="display:none" aria-hidden="true">
      <label for="c-hp">Website</label>
      <input type="text" id="c-hp" name="website" tabindex="-1" autocomplete="off">
    </div>
    <div class="field">
      <label for="c-msg">상세 내용 <span class="hint">10자 이상</span></label>
      <textarea id="c-msg" name="message" rows="5" required placeholder="확인하신 내용이나 제안 사항, 근거 공고 링크 등을 적어 주세요." class="contact-ta"></textarea>
    </div>
    <button type="submit" class="btn btn-primary btn-lg" id="c-submit">문의·제보 접수하기</button>
    <p class="toast" id="c-status" role="status" aria-live="polite"></p>
  </form>
</div>
<h2>직접 이메일 문의 및 처리 원칙</h2>
<ul>
  <li><strong>직통 이메일:</strong> <a href="mailto:${SITE.email}">${SITE.email}</a> (영업일 기준 2~3일 내 검토·회신)</li>
  <li><strong>편집 독립성 원칙:</strong> 특정 금융상품·대행사의 유료 알선이나 과장 광고 게재를 요청하는 제휴는 정중히 사양합니다.</li>
  <li>제출된 이메일과 문의 내용은 회신 및 팩트 검증 목적으로만 사용되며 <a href="/privacy-policy">개인정보처리방침</a>에 따라 안전하게 보호됩니다.</li>
</ul>
<script>
(function(){
  var f=document.getElementById('contact-form');
  if(!f)return;
  var st=document.getElementById('c-status'), btn=document.getElementById('c-submit');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    btn.disabled=true; st.textContent='전송 중...';
    fetch('/api/biz/contact',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        category:document.getElementById('c-cat').value,
        email:document.getElementById('c-email').value,
        page_url:document.getElementById('c-url').value,
        website:document.getElementById('c-hp').value,
        message:document.getElementById('c-msg').value
      })
    }).then(function(r){return r.json();}).then(function(d){
      btn.disabled=false;
      if(d&&d.ok){st.textContent='✅ 소중한 제보·문의가 정상 접수되었습니다. 검토 후 회신드리겠습니다!';f.reset();}
      else{st.textContent='⚠️ '+(d&&d.error?d.error:'접수 중 오류가 발생했습니다.');}
    }).catch(function(){btn.disabled=false;st.textContent='⚠️ 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';});
  });
})();
</script>`,
  [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: '제휴 및 오류 제보', url: abs('/contact') }]);
}

function notFound() {
  return { body: `<div class="container narrow"><article class="prose"><h1>페이지를 찾을 수 없습니다</h1><p>주소가 바뀌었거나 삭제된 페이지입니다. 아래 6대 계산기와 바이블에서 필요한 정보를 찾아보세요.</p><ul>${CALCULATORS.map((c) => `<li><a href="/calculators/${c.slug}">${esc(c.short)}</a></li>`).join('')}<li><a href="/bible">실전 바이블 전체</a></li><li><a href="/">홈으로</a></li></ul></article></div>`, jsonld: [] };
}

module.exports = { home, category, article, bibleIndex, about, privacy, terms, contact, notFound, miniCalc, fmtDate };
