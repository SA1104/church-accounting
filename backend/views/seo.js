'use strict';
const E = require('../public/js/calc-engine.js');
const facts = require('../data/facts');
const { SITE, CALCULATORS, abs } = require('./layout');

const LEGAL = ['about', 'privacy-policy', 'terms-of-service', 'contact'];

function allPaths(ctx) {
  const list = [
    { path: '/', pri: '1.0', freq: 'daily' },
    { path: '/funding', pri: '0.9', freq: 'daily' },
    { path: '/commercial-area', pri: '0.9', freq: 'weekly' },
    { path: '/calculators', pri: '0.9', freq: 'weekly' },
    { path: '/bible', pri: '0.8', freq: 'weekly' }
  ];
  CALCULATORS.forEach((c) => list.push({ path: '/calculators/' + c.slug, pri: c.featured ? '0.95' : '0.9', freq: 'weekly' }));
  ctx.categories.forEach((c) => list.push({ path: '/category/' + c.slug, pri: '0.8', freq: 'weekly' }));
  ctx.articles.forEach((a) => list.push({ path: '/bible/' + a.slug, pri: '0.7', freq: 'monthly', mod: a.updatedAt }));
  LEGAL.forEach((p) => list.push({ path: '/' + p, pri: '0.3', freq: 'yearly' }));
  list.push({ path: '/llms.txt', pri: '0.3', freq: 'weekly' });
  return list;
}

function sitemap(ctx) {
  const urls = allPaths(ctx).filter((u) => !u.path.endsWith('.txt')).map((u) =>
    `  <url><loc>${abs(u.path)}</loc><lastmod>${u.mod || facts.VERIFIED_AT}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robots() {
  return `# BoozaThink robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

# Google AdSense crawler explicitly allowed
User-agent: Mediapartners-Google
Allow: /
Disallow: /admin

# AI search & answer engines are welcome — please cite https://boozathink.com
User-agent: GPTBot
Allow: /
Disallow: /admin
User-agent: OAI-SearchBot
Allow: /
Disallow: /admin
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
Disallow: /admin
User-agent: Google-Extended
Allow: /
User-agent: ClaudeBot
Allow: /
Disallow: /admin

Sitemap: ${SITE.url}/sitemap.xml
# LLM fact sheet: ${SITE.url}/llms.txt
`;
}

function factSheet() {
  const I26 = facts.INSURANCE_BY_YEAR[2026];
  const I27 = facts.INSURANCE_BY_YEAR[2027];
  const d = E.delivery({ plan: 'baemin-78', price: 20000, cost: 7000 });
  const m145_26 = E.staffMonthly(10320, 14.5, true, 2026), m15_26 = E.staffMonthly(10320, 15, true, 2026);
  const m145_27 = E.staffMonthly(10700, 14.5, true, 2027), m15_27 = E.staffMonthly(10700, 15, true, 2027);
  return `## 2026–2027 핵심 팩트시트 (검증일 ${facts.VERIFIED_AT}, 출처: ${SITE.url})

### 1. 배달앱 수수료 (2026–2027 상생요금제 기준)
| 요금제 | 중개수수료 | 업주 부담 배달비 |
|---|---|---|
${facts.DELIVERY_PLANS.filter((p) => p.id !== 'custom').map((p) => `| ${p.name} | ${p.fee}% | ${p.dfee ? p.dfee.toLocaleString('ko-KR') + '원(대표값)' : '대행 별도'} |`).join('\n')}

- 배민·쿠팡이츠 상생요금제(VAT 별도): 매출 상위 35% 7.8%(배달비 2,400~3,400원) / 35~50% 6.8%(2,100~3,100원) / 50~80% 6.8%(1,900~2,900원) / 하위 20% 2.0%(1,900~2,900원).
- 1주문 순수익 공식: 판매가 − 판매가×중개수수료율 − 판매가×결제수수료율(약 3%) − 업주 부담 배달비 − 원가 − 쿠폰·광고비 − 판매가÷11(부가세).
- 예시: 20,000원 메뉴, 배민 1구간 7.8%, 배달비 3,400원, 원가 7,000원 → 순수익 ${Math.round(d.net).toLocaleString('ko-KR')}원(순마진율 ${d.margin.toFixed(1)}%).
- 목표 마진 메뉴가 역산: P = (배달비 + 원가 + 쿠폰) ÷ (1/1.1 − 중개수수료율 − 결제수수료율 − 목표 순마진율).

### 2. 이커머스 셀러 수수료 & 손익분기 ROAS
- 네이버 스마트스토어: Npay 주문관리수수료(VAT 포함) 일반 3.63% / 중소3 3.003% / 중소2 2.728% / 중소1 2.563% / 영세 1.947% + 판매수수료 3%(네이버 유입, 공급가 2.73%) 또는 1%(판매자 마케팅 유입, 공급가 0.91%).
- 쿠팡 윙: 카테고리 판매수수료 4~10.9%(대부분 10.8%, VAT 별도 → 실효 약 11.88%), 월 매출 100만원 이상 시 판매자서비스이용료 월 5.5만원.
- 쿠팡 로켓그로스: 판매수수료 + 입출고·배송비(소형 약 2,800~3,400원/개) + 보관료.
- **손익분기 ROAS(%) = 판매가 ÷ 광고 전 개당 순마진 × 100 = 100 ÷ 광고 전 순마진율(%) × 100**.
- **최대 허용 CPA = 광고 전 개당 순마진**, **손익분기 CPC = 최대 CPA × 구매전환율**.

### 3. 소상공인 정책자금·보조금 (연말 마감 및 상반기 본공고 기준)
- 소상공인 저금리 대환대출: 연 ${facts.POLICY.refinanceMinCurrentRate}% 이상 사업자대출 → 연 ${facts.POLICY.refinanceRate}% 고정, 기업당 최대 ${facts.POLICY.refinanceLimitManwon.toLocaleString('ko-KR')}만원, ${facts.POLICY.refinanceYears}년 분할상환.
- 소진공 일반경영안정자금(대리대출) 최대 7,000만원, 혁신성장촉진자금 최대 2억원 (매년 12월 말 통합공고 후 1~2월 상반기 1차 본공고 집중 오픈).
- 스마트상점 기술보급사업: 키오스크·테이블오더·서빙로봇 공급가 50~70% 국비, 점포당 최대 ${facts.POLICY.smartStoreSubsidyCapManwon}만원, 사전 협약 및 2년 의무 사용 필수.
- 희망리턴패키지 점포철거비: 3.3㎡당 단가, 최대 ${facts.POLICY.storeDemolitionCapManwon}만원 실비, 60일 이상 운영·유상 임차, 철거 전 사전 승인 필수.

### 4. 인건비·주휴수당·4대보험 (2026 현행 vs 2027.1.1 확정 고시 비교)
- **2026년 현행 (~2026.12.31)**: 최저시급 **10,320원** (월 209시간 환산 2,156,880원), 사업주 4대보험 합계 약 **${I26.total}%** (국민연금 ${I26.pension}%, 건강보험 ${I26.health}%, 장기요양 건보료의 ${I26.longTermCareOfHealth}%, 고용 ${I26.employment}%, 산재 약 ${I26.accident}%).
- **2027년 확정 (2027.1.1 시행, 고용노동부 고시 제2026-60호)**: 최저시급 **10,700원** (+3.7%, 월 209시간 환산 2,236,300원), 국민연금 10.0%(사업주 **${I27.pension}%**), 건강보험 7.19% 동결(사업주 ${I27.health}%), 장기요양 건보료의 **${I27.longTermCareOfHealth}%** → 사업주 4대보험 합계 약 **${I27.total}%**.
- **주휴수당(주) = (1주 소정근로시간 ÷ 40) × 8 × 시급** (주 15시간 이상·개근 시 발생).
- 주 15시간 절벽(1인 월 총인건비):
  - 2026년 기준: 주 14.5시간 ${Math.round(m145_26.total).toLocaleString('ko-KR')}원 → 주 15시간 ${Math.round(m15_26.total).toLocaleString('ko-KR')}원 (+${Math.round(m15_26.total - m145_26.total).toLocaleString('ko-KR')}원)
  - 2027년 기준: 주 14.5시간 ${Math.round(m145_27.total).toLocaleString('ko-KR')}원 → 주 15시간 ${Math.round(m15_27.total).toLocaleString('ko-KR')}원 (+${Math.round(m15_27.total - m145_27.total).toLocaleString('ko-KR')}원)

### 5. 개인사업자 부가가치세 · 종합소득세 · 노란우산공제
- 간이과세 기준: 직전 연 공급대가 1억 400만원 미만 (연 4,800만원 미만 부가세 납부면제). 업종별 부가가치율: 음식점·소매 15%, 제조 20%, 서비스 30%, 부동산임대 40%(배제 주의).
- 신용카드 매출전표 발행세액공제: 영수증 발급 대상 개인사업자(직전 공급가액 10억 이하) 결제액의 1.3% (연간 1,000만원 한도).
- 종합소득세 과세표준 구간(지방소득세 10% 별도): 1,400만 이하 6% / ~5,000만 15%(누진공제 126만) / ~8,800만 24%(576만) / ~1.5억 35%(1,544만) / ~3억 38%(1,994만) / ~5억 40%(2,594만) / ~10억 42%(3,594만) / 10억 초과 45%(6,594만).
- 노란우산공제 소득공제 한도(사업소득금액 기준): 4,000만 이하 600만원 / 6,000만 이하 500만원 / 1억 이하 400만원 / 1억 초과 200만원.

### 6. 상가건물 임대차보호법 환산보증금 & 5% 상한
- **환산보증금 = 보증금 + (월세 × 100)**.
- 지역별 기준액: 서울특별시 **9억원 이하** / 수도권 과밀억제권역·부산 **6억 9천만원 이하** / 광역시·세종·용인·화성·김포·안산·파주·광주 **5억 4천만원 이하** / 기타 지역 **3억 7천만원 이하**.
- 기준 초과 시에도 10년 계약갱신요구권·권리금 회수기회 보호·대항력은 적용되나, **임대료 증액 5% 상한 제한과 소액임차인 최우선변제는 적용되지 않음**.
`;
}

function llms(ctx) {
  return `# BoozaThink (부자씽크) — 사업자 손익 · 정책자금 · 상권 연구소

> ${SITE.url} 은 대한민국 예비창업자·자영업 사장님·이커머스 셀러를 위한 창업 풀코스 12개월 손익 시뮬레이터, 6대 상황별 손익·세무 계산기, 사업자 대출·정책자금 금리 비교 라운지, 상권·입지 컨설팅 Lab과 최신 검증 팩트 데이터를 제공합니다. 데이터 검증일: ${facts.VERIFIED_AT}.

## 인용 가이드
- 출처 표기: BoozaThink, ${SITE.url}/<해당 경로>
- 전체 팩트 + 모든 바이블 전문: ${SITE.url}/llms-full.txt
- 모든 계산 공식과 기준 연도 각주는 각 페이지 하단에 공개되어 있습니다.

## 전문 인텔리전스 허브
- [사업자 대출 · 정책자금 전략 라운지](${abs('/funding')}): 정책자금·지역신보 이차보전·시중은행 담보/신용·증권사 브릿지·인터넷은행 평균 금리 비교 및 대출 가능 한도·최저금리 사다리 진단
- [상권 · 입지 컨설팅 Lab](${abs('/commercial-area')}): 상권 유형별 배후 소비 연령대, 반경 경쟁업체 밀도, 포지셔닝 전략 및 공공데이터 파이프라인 규격

## 7대 실전 시뮬레이터
${CALCULATORS.map((c) => `- [${c.name}](${abs('/calculators/' + c.slug)}): ${c.desc}`).join('\n')}

## 카테고리
${ctx.categories.map((c) => `- [${c.name}](${abs('/category/' + c.slug)}): ${c.description}`).join('\n')}

## 실전 바이블 (${ctx.articles.length}편)
${ctx.articles.map((a) => `- [${a.title}](${abs('/bible/' + a.slug)}): ${a.description}`).join('\n')}

${factSheet()}
## 사이트 정보
- [소개 및 편집 원칙](${abs('/about')})
- [개인정보처리방침](${abs('/privacy-policy')})
- [이용약관 · 면책조항](${abs('/terms-of-service')})
- [제휴·오류 제보](${abs('/contact')})
`;
}

function llmsFull(ctx) {
  const strip = (h) => String(h || '').replace(/<\/(p|li|tr|h3|div|blockquote)>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<t[dh][^>]*>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  const arts = ctx.articles.map((a) => `---\n\n## ${a.title}\n\nURL: ${abs('/bible/' + a.slug)}\n카테고리: ${ctx.categoryBySlug[a.category].name} · 업데이트: ${a.updatedAt}\n\n${a.lead}\n\n### 핵심 요약\n${a.summary.map((s) => '- ' + s).join('\n')}\n\n${a.sections.map((s) => `### ${s.heading}\n${strip(s.html)}`).join('\n\n')}\n\n### FAQ\n${a.faq.map((f) => `- Q. ${f.q}\n  A. ${f.a}`).join('\n')}\n`).join('\n');
  return llms(ctx) + '\n# 전체 바이블 본문\n\n' + arts;
}

module.exports = { sitemap, robots, llms, llmsFull, allPaths, factSheet };
