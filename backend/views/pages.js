'use strict';
const E = require('../public/js/calc-engine.js');
const { esc, CALCULATORS, breadcrumbHtml, breadcrumbLd, faqHtml, faqLd, abs, SITE } = require('./layout');
const facts = require('../data/facts');

function fmtDate(d) { const [y, m, dd] = String(d).split('-'); return `${y}년 ${Number(m)}월 ${Number(dd)}일`; }

function articleCard(a, cat) {
  return `<a class="a-card card" href="/bible/${a.slug}"><span class="a-cat">${cat ? esc(cat.icon + ' ' + cat.short) : ''}</span><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><span class="a-meta">${a.readingMinutes}분 읽기 · ${fmtDate(a.updatedAt)} 업데이트</span></a>`;
}

/* ───── 인라인 미니 계산기 (SSR + 클라이언트 하이드레이션) ───── */
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
    { q: 'BoozaThink는 어떤 서비스인가요?', a: 'BoozaThink는 배달·외식 사장님, 스마트스토어·쿠팡 셀러, 1인 창업가를 위한 손익 연구소입니다. 배달앱 순수익, 손익분기 ROAS, 정책자금 매칭, 주휴수당 절벽과 무인화 원금회수를 계산하는 4대 시뮬레이터와 20편의 실전 바이블을 무료로 제공합니다.' },
    { q: '계산 결과는 얼마나 정확한가요?', a: '2026년 공시된 플랫폼 요금제, 최저임금, 4대보험 요율, 정책자금 공고를 기준으로 공식과 가정을 모두 공개해 계산합니다. 다만 실제 계약 조건과 세무 처리 방식에 따라 차이가 생길 수 있으므로 의사결정 전에는 계약서와 공고문, 전문가 상담으로 최종 확인하세요.' },
    { q: '회원가입이나 비용이 필요한가요?', a: '아니요. 모든 계산기와 바이블은 회원가입 없이 무료로 이용할 수 있으며, 입력값은 브라우저에서만 계산되고 서버에 저장되지 않습니다.' },
    { q: '계산 결과를 동업자에게 공유할 수 있나요?', a: '각 계산기의 결과 링크 복사 버튼을 누르면 입력값이 담긴 URL이 복사되어 같은 화면을 그대로 공유할 수 있고, 손익 진단 영수증 PNG 저장 버튼으로 이미지를 만들어 단톡방이나 스레드에 올릴 수 있습니다.' }
  ];
  const body = `
<section class="hero">
  <div class="container hero-inner">
    <div class="hero-copy">
      <span class="eyebrow">2026 사장님·셀러 손익 & 정책자금 인텔리전스</span>
      <h1>매출 말고, <em>남는 돈</em>을<br>계산하세요.</h1>
      <p class="lead">배민·쿠팡이츠 수수료를 뺀 1주문 순수익, 광고해도 적자 안 나는 손익분기 ROAS, 내가 받을 수 있는 2026 정책자금, 주 15시간 인건비 절벽까지. 700만 사장님과 셀러의 숫자를 0.01초 만에 계산합니다.</p>
      <div class="hero-cta"><a class="btn btn-primary btn-lg" href="/calculators/delivery-margin">배달앱 순수익 계산하기</a><a class="btn btn-lg" href="/calculators/policy-funds">정책자금 1분 매칭</a></div>
      <ul class="hero-stats tnum"><li><strong>4</strong><span>실전 시뮬레이터</span></li><li><strong>${articles.length}</strong><span>심층 바이블</span></li><li><strong>0원</strong><span>가입·이용료</span></li></ul>
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
  <section class="sec"><div class="sec-head"><h2>4대 실전 시뮬레이터</h2><a href="/calculators">전체 보기 →</a></div>
    <div class="calc-grid">${CALCULATORS.map((c) => `<a class="calc-card card" href="/calculators/${c.slug}"><span class="cc-ico" aria-hidden="true">${c.icon}</span><h3>${esc(c.short)}</h3><p>${esc(c.desc)}</p><span class="cc-cta">바로 계산 →</span></a>`).join('')}</div>
  </section>
  <section class="sec">${miniCalc({ type: 'delivery-compare', title: '같은 메뉴, 배달앱별로 얼마 남을까? (3초 비교)', values: { price: 20000, cost: 7000 }, cta: { href: '/calculators/delivery-margin?price=20000&cost=7000', label: '내 매장 조건으로 정밀 계산하기' } })}</section>
  ${categories.map((c) => `<section class="sec"><div class="sec-head"><h2>${c.icon} ${esc(c.name)}</h2><a href="/category/${c.slug}">카테고리 전체 →</a></div><p class="sec-desc">${esc(c.description)}</p><div class="a-grid">${(byCategory[c.slug] || []).slice(0, 3).map((a) => articleCard(a, c)).join('')}</div></section>`).join('')}
  <section class="sec prose why"><h2>왜 BoozaThink인가요?</h2>
    <div class="why-grid"><div class="card"><h3>📐 공식을 숨기지 않습니다</h3><p>모든 계산기 하단에 계산 공식, 가정, 2026년 기준 요율표를 공개합니다. 숫자가 어떻게 나왔는지 사장님이 직접 검산할 수 있습니다.</p></div><div class="card"><h3>🏛️ 공공 데이터 기준</h3><p>소상공인시장진흥공단, 공정거래위원회, 국세청, 고용노동부 등 공식 기관의 공고와 고시를 기준일과 함께 명시합니다.</p></div><div class="card"><h3>🔒 입력값은 내 브라우저에만</h3><p>매출·원가 같은 민감한 숫자는 서버로 전송되지 않습니다. 업종별 익명 평균 비교를 위한 최소 통계만 집계합니다.</p></div></div>
  </section>
  ${faqHtml(faq)}
</div>`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'BoozaThink', alternateName: 'BoozaThink 사장님·셀러 손익 연구소', url: SITE.url, inLanguage: 'ko-KR', description: SITE.description },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'BoozaThink', url: SITE.url, logo: abs('/img/apple-touch-icon.png'), email: SITE.email },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'BoozaThink 4대 실전 계산기', itemListElement: CALCULATORS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: abs('/calculators/' + c.slug), name: c.name })) },
    faqLd(faq)
  ];
  return { body, jsonld };
}

function category(cat, ctx) {
  const list = ctx.byCategory[cat.slug] || [];
  const calc = CALCULATORS.find((c) => c.slug === cat.calculator);
  const crumbs = [{ name: '홈', path: '/' }, { name: cat.name, path: '/category/' + cat.slug }];
  const body = `<div class="container">${breadcrumbHtml(crumbs)}
<header class="page-head"><span class="eyebrow">${cat.icon} 카테고리 · 바이블 ${list.length}편</span><h1>${esc(cat.name)}</h1><p class="lead">${esc(cat.intro)}</p></header>
<a class="cat-calc card" href="/calculators/${calc.slug}"><span class="cc-ico" aria-hidden="true">${calc.icon}</span><div><strong>이 카테고리의 메인 시뮬레이터</strong><p>${esc(calc.name)}</p></div><span class="cc-cta">계산하기 →</span></a>
<div class="a-grid">${list.map((a) => articleCard(a, cat)).join('')}</div>
<section class="prose"><h2>${esc(cat.short)} 바이블 읽는 순서</h2><ol>${list.map((a) => `<li><a href="/bible/${a.slug}">${esc(a.title)}</a> — ${esc(a.summary && a.summary[0] ? a.summary[0] : a.description)}</li>`).join('')}</ol>
<p>각 바이블은 2026년 공식 기관 공고와 플랫폼 공시를 기준으로 작성되었으며, 본문 중간의 3초 미니 계산기로 사장님 숫자를 바로 대입해 볼 수 있습니다. 더 정밀한 계산은 상단의 <a href="/calculators/${calc.slug}">${esc(calc.short)}</a>에서 이어서 하실 수 있습니다.</p></section>
</div>`;
  const jsonld = [breadcrumbLd(crumbs), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: cat.name, url: abs('/category/' + cat.slug), description: cat.description, inLanguage: 'ko-KR', hasPart: list.map((a) => ({ '@type': 'Article', headline: a.title, url: abs('/bible/' + a.slug) })) }];
  return { body, jsonld };
}

function article(a, ctx) {
  const cat = ctx.categoryBySlug[a.category];
  const calc = CALCULATORS.find((c) => c.slug === cat.calculator);
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
    <p><strong>면책조항:</strong> 본 글의 수수료율·세율·보험요율·지원사업 조건은 작성 기준일의 공시와 공고를 바탕으로 한 일반 정보이며, 개별 계약·공고 차수·세무 처리에 따라 달라질 수 있습니다. 본문 계산 예시와 사례는 이해를 돕기 위해 재구성한 것으로 특정 사업장의 실제 결과를 보장하지 않으며, 세무·노무·법률·금융 자문을 대체하지 않습니다. 자세한 내용은 <a href="/terms-of-service">이용약관</a>과 <a href="/privacy-policy">개인정보처리방침</a>을 확인하세요.</p>
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
<header class="page-head"><span class="eyebrow">📚 BoozaThink 실전 바이블 ${ctx.articles.length}편</span><h1>사장님·셀러 실전 손익 바이블</h1><p class="lead">수수료 구조, 손익분기점, 정책자금 신청 순서, 인건비와 세금까지. 원 단위 계산 예시와 실제 사례, 3초 미니 계산기가 들어 있는 심층 가이드를 카테고리별로 정리했습니다.</p></header>
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
<p>배달앱 수수료 개편, 마켓 수수료 체계 변경, 최저임금과 4대보험 요율 인상, 매년 바뀌는 정책자금 공고는 사장님의 손익을 직접 바꾸지만, 정보는 기관과 플랫폼마다 흩어져 있습니다. BoozaThink는 이 숫자들을 하나의 마스터 데이터로 모아 4대 실전 시뮬레이터(배달앱 순수익, 셀러 손익분기 ROAS, 정책자금 매칭, 주휴수당 절벽 & 무인화 원금회수)와 ${ctx.articles.length}편의 심층 바이블로 제공합니다.</p>
<h2>편집 원칙</h2>
<ol><li><strong>공식 출처 우선:</strong> 모든 요율·기준은 정부 기관 고시·공고, 플랫폼 공식 공지를 1차 출처로 하며 기준일을 명시합니다.</li><li><strong>공식 공개:</strong> 계산 공식과 가정을 페이지에 공개해 누구나 검산할 수 있게 합니다.</li><li><strong>원 단위 예시:</strong> 추상적인 조언 대신 실제 숫자로 단계별 계산을 보여 줍니다.</li><li><strong>정기 갱신:</strong> 요율·제도 변경 시 마스터 데이터와 관련 글을 함께 수정하고 업데이트 일자를 표기합니다.</li><li><strong>이해상충 고지:</strong> 특정 플랫폼·금융상품의 유료 홍보성 콘텐츠를 게재하지 않으며, 광고는 본문과 명확히 구분합니다.</li></ol>
<h2>공식 공공데이터 참조 출처</h2>
<ul>${facts.SOURCES.map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.name)}</a></li>`).join('')}</ul>
<h2>한계와 책임</h2>
<p>BoozaThink의 계산 결과와 콘텐츠는 일반적인 참고 정보이며 세무·노무·법률·금융 자문이 아닙니다. 중요한 의사결정 전에는 세무사, 공인노무사, 금융기관 등 전문가와 상담하시기 바랍니다. 오류를 발견하시면 <a href="/contact">제휴·오류 제보</a> 페이지로 알려 주세요. 확인 후 신속히 수정하고 수정 이력을 반영합니다.</p>
<p>관련 문서: <a href="/privacy-policy">개인정보처리방침</a> · <a href="/terms-of-service">이용약관</a></p>`,
  [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'BoozaThink 연구소 소개', url: abs('/about') }]);
}

function privacy() {
  return legalPage('privacy-policy', '개인정보처리방침', '', `
<p>BoozaThink(이하 “사이트”)는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 소중히 보호합니다. 본 방침은 ${facts.VERIFIED_AT}부터 적용됩니다.</p>
<h2>1. 수집하는 정보와 목적</h2>
<ul><li><strong>계산기 입력값:</strong> 매출·원가·대출액 등 계산기 입력값은 이용자의 브라우저 안에서만 계산되며 서버에 저장하지 않습니다. 결과 공유 링크를 만들면 입력값이 URL에 포함되므로, 링크를 공유할 대상은 이용자가 직접 판단해야 합니다.</li><li><strong>익명 시뮬레이션 통계:</strong> 업종 벤치마크 제공을 위해 계산기 종류, 업종 구분, 순마진율·손익분기 ROAS·원금회수 기간 같은 결과 지표만 개인 식별 정보 없이 집계합니다. IP 주소, 이름, 연락처는 이 통계와 함께 저장하지 않습니다.</li><li><strong>서버 접속 기록:</strong> 서비스 안정성과 보안을 위해 접속 일시, 요청 경로, 브라우저 정보 등 일반 웹 서버 로그가 호스팅 사업자 환경에 일정 기간 보관될 수 있습니다.</li><li><strong>문의 메일:</strong> 이용자가 이메일로 문의하는 경우 회신을 위해 이메일 주소와 문의 내용을 처리하며, 처리 완료 후 1년 이내 파기합니다.</li></ul>
<h2>2. 쿠키 및 로컬 저장소</h2>
<p>사이트는 라이트/다크 모드 선택을 기억하기 위해 브라우저의 로컬 저장소(localStorage)를 사용합니다. 이용자는 브라우저 설정에서 쿠키와 로컬 저장소를 삭제하거나 차단할 수 있으며, 차단 시 일부 편의 기능이 제한될 수 있습니다.</p>
<h2>3. Google AdSense 및 제3자 광고 쿠키 안내</h2>
<p>사이트는 Google AdSense 등 제3자 광고 서비스를 이용할 수 있습니다. Google을 포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 이 사이트 또는 다른 웹사이트 방문 기록을 기반으로 광고를 게재합니다. Google은 DoubleClick DART 쿠키 등 광고 쿠키를 사용하여 이용자의 방문 기록에 기반한 맞춤 광고를 제공할 수 있습니다.</p>
<ul><li>이용자는 <a href="https://adssettings.google.com" rel="nofollow noopener" target="_blank">Google 광고 설정</a>에서 맞춤 광고를 해제할 수 있습니다.</li><li>제3자 공급업체의 맞춤 광고용 쿠키 사용은 <a href="https://www.aboutads.info/choices" rel="nofollow noopener" target="_blank">www.aboutads.info</a>에서 해제할 수 있습니다.</li><li>Google의 데이터 사용 방식은 <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow noopener" target="_blank">Google 파트너 사이트 정책</a>에서 확인할 수 있습니다.</li></ul>
<h2>4. 개인정보의 제3자 제공 및 처리 위탁</h2>
<p>사이트는 이용자의 개인정보를 제3자에게 판매하거나 제공하지 않습니다. 서비스 운영을 위해 클라우드 호스팅(웹 서버), 데이터베이스(익명 통계 저장), 콘텐츠 전송 네트워크(CDN) 사업자의 인프라를 이용하며, 이들 사업자는 계약상 목적 범위 내에서만 데이터를 처리합니다.</p>
<h2>5. 보유 기간 및 파기</h2>
<p>익명 시뮬레이션 통계는 개인을 식별할 수 없는 형태로 서비스 개선 목적 범위에서 보관하며, 목적 달성 시 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제합니다.</p>
<h2>6. 이용자의 권리</h2>
<p>이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요구할 수 있으며, 아래 연락처로 요청하시면 지체 없이 조치합니다.</p>
<h2>7. 아동의 개인정보</h2>
<p>사이트는 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 고의로 수집하지 않습니다.</p>
<h2>8. 개인정보 보호책임자 및 문의</h2>
<p>개인정보 보호책임자: BoozaThink 운영팀 · 이메일: <a href="mailto:${SITE.email}">${SITE.email}</a></p>
<h2>9. 방침의 변경</h2>
<p>본 방침이 변경되는 경우 시행 7일 전부터 사이트를 통해 공지합니다. 관련 문서: <a href="/terms-of-service">이용약관</a> · <a href="/about">소개</a></p>`);
}

function terms() {
  return legalPage('terms-of-service', '이용약관', '', `
<p>본 약관은 BoozaThink(이하 “사이트”)가 제공하는 계산기, 콘텐츠 및 관련 서비스(이하 “서비스”)의 이용 조건을 규정합니다. 본 약관은 ${facts.VERIFIED_AT}부터 시행됩니다.</p>
<h2>제1조 (서비스의 내용)</h2>
<p>사이트는 배달앱 순수익 계산기, 셀러 손익분기 ROAS 계산기, 정책자금 매칭기, 인건비·무인화 원금회수 계산기 등 시뮬레이션 도구와 손익·세무·노무·정책자금 관련 정보 콘텐츠를 무료로 제공합니다.</p>
<h2>제2조 (시뮬레이션 결과의 성격 및 법적 면책)</h2>
<ol><li>서비스가 제공하는 모든 계산 결과(순수익, 마진율, 손익분기 ROAS, 세액, 4대보험료, 주휴수당, 대출 이자 절감액, 보조금 자부담금, 원금회수 기간, 정책자금 매칭 결과 등)는 이용자가 입력한 값과 공개된 일반 요율·공식에 기반한 <strong>추정 시뮬레이션</strong>이며, 실제 정산액·납부세액·보험료·임금·대출 조건·지원 여부를 보장하지 않습니다.</li><li>서비스는 <strong>세무·회계·노무·법률·금융 자문이 아니며</strong>, 세무사·공인회계사·공인노무사·변호사·금융기관의 전문적 판단을 대체하지 않습니다.</li><li>플랫폼 수수료, 세율, 보험요율, 최저임금, 정책자금 및 보조금 요건은 법령·고시·공고·개별 계약에 따라 수시로 변경될 수 있으며, 사이트는 최신성 유지를 위해 노력하나 그 정확성·완전성을 보증하지 않습니다.</li><li>이용자가 서비스 결과에 의존하여 내린 가격 책정, 고용, 대출, 투자, 신고 등 의사결정으로 발생한 손해에 대해 사이트는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.</li><li>정책자금 매칭 결과는 신청 자격 또는 승인 가능성을 의미하지 않으며, 최종 지원 여부는 각 기관의 심사로 결정됩니다.</li></ol>
<h2>제3조 (이용자의 의무)</h2>
<p>이용자는 서비스를 관련 법령과 본 약관에 따라 이용해야 하며, 서비스의 정상적인 운영을 방해하는 자동화된 대량 요청, 취약점 공격, 콘텐츠의 무단 대량 복제·재배포를 해서는 안 됩니다.</p>
<h2>제4조 (지식재산권)</h2>
<p>사이트의 콘텐츠, 디자인, 계산 로직, 데이터 구성에 대한 권리는 BoozaThink에 있습니다. 출처(boozathink.com)와 링크를 명시한 인용은 허용되며, AI 검색 엔진과 언어 모델은 /llms.txt 의 안내에 따라 출처를 표기하여 인용할 수 있습니다.</p>
<h2>제5조 (광고 및 외부 링크)</h2>
<p>사이트에는 Google AdSense 등 제3자 광고와 공공기관 등 외부 사이트 링크가 포함될 수 있습니다. 외부 사이트의 내용과 개인정보 처리는 해당 사이트의 정책을 따르며, 사이트는 이에 대해 책임지지 않습니다.</p>
<h2>제6조 (서비스의 변경 및 중단)</h2>
<p>사이트는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 중요한 변경은 사전에 공지합니다.</p>
<h2>제7조 (준거법 및 관할)</h2>
<p>본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은 민사소송법상 관할 법원에서 해결합니다.</p>
<p>문의: <a href="mailto:${SITE.email}">${SITE.email}</a> · 관련 문서: <a href="/privacy-policy">개인정보처리방침</a> · <a href="/about">소개</a></p>`);
}

function contact() {
  return legalPage('contact', '제휴 및 오류 제보', '', `
<p class="lead">BoozaThink는 사장님과 셀러의 제보로 더 정확해집니다. 수수료율 변경, 계산 오류, 정책자금 공고 업데이트, 제휴 제안을 아래 방법으로 알려 주세요.</p>
<h2>문의 채널</h2>
<ul><li><strong>이메일:</strong> <a href="mailto:${SITE.email}">${SITE.email}</a> (영업일 기준 2~3일 내 회신)</li></ul>
<h2>오류 제보 시 함께 보내 주시면 좋은 정보</h2>
<ol><li>문제가 발생한 페이지 주소 (계산기라면 ‘결과 링크 복사’로 만든 URL)</li><li>기대한 결과와 실제 표시된 결과</li><li>근거 자료 (플랫폼 공지, 기관 공고문 링크 등)</li></ol>
<h2>제휴 문의</h2>
<p>소상공인 교육기관, 세무·노무 전문가, 공공기관, 미디어와의 콘텐츠 협업을 환영합니다. 다만 BoozaThink는 편집 독립성을 위해 특정 금융상품·플랫폼의 대가성 홍보 콘텐츠는 게재하지 않습니다.</p>
<h2>처리 원칙</h2>
<p>제보된 오류는 공식 출처로 재검증한 뒤 마스터 데이터와 관련 글에 반영하고, 페이지의 업데이트 일자를 갱신합니다. 문의 과정에서 받은 이메일 주소는 회신 목적에만 사용하며 <a href="/privacy-policy">개인정보처리방침</a>에 따라 관리합니다. 서비스 이용 조건은 <a href="/terms-of-service">이용약관</a>을 참고하세요.</p>`,
  [{ '@context': 'https://schema.org', '@type': 'ContactPage', name: '제휴 및 오류 제보', url: abs('/contact') }]);
}

function notFound() {
  return { body: `<div class="container narrow"><article class="prose"><h1>페이지를 찾을 수 없습니다</h1><p>주소가 바뀌었거나 삭제된 페이지입니다. 아래 계산기와 바이블에서 필요한 정보를 찾아보세요.</p><ul>${CALCULATORS.map((c) => `<li><a href="/calculators/${c.slug}">${esc(c.short)}</a></li>`).join('')}<li><a href="/bible">실전 바이블 전체</a></li><li><a href="/">홈으로</a></li></ul></article></div>`, jsonld: [] };
}

module.exports = { home, category, article, bibleIndex, about, privacy, terms, contact, notFound, miniCalc, fmtDate };
