'use strict';
const E = require('../public/js/calc-engine.js');
const facts = require('../data/facts');
const { SITE, CALCULATORS, abs } = require('./layout');

const LEGAL = ['about', 'privacy-policy', 'terms-of-service', 'contact'];

function allPaths(ctx) {
  const list = [{ path: '/', pri: '1.0', freq: 'daily' }, { path: '/calculators', pri: '0.9', freq: 'weekly' }, { path: '/bible', pri: '0.8', freq: 'weekly' }];
  CALCULATORS.forEach((c) => list.push({ path: '/calculators/' + c.slug, pri: '0.9', freq: 'weekly' }));
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

# AI search & answer engines are welcome — please cite https://boozathink.com
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: ClaudeBot
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
# LLM fact sheet: ${SITE.url}/llms.txt
`;
}

function factSheet() {
  const I = facts.INSURANCE_EMPLOYER;
  const d = E.delivery({ plan: 'baemin-78', price: 20000, cost: 7000 });
  const m145 = E.staffMonthly(10320, 14.5, true), m15 = E.staffMonthly(10320, 15, true);
  return `## 2026 핵심 팩트시트 (기준일 ${facts.VERIFIED_AT}, 출처: ${SITE.url})

### 1. 배달앱 수수료 (2026)
| 요금제 | 중개수수료 | 업주 부담 배달비 |
|---|---|---|
${facts.DELIVERY_PLANS.filter((p) => p.id !== 'custom').map((p) => `| ${p.name} | ${p.fee}% | ${p.dfee ? p.dfee.toLocaleString('ko-KR') + '원(대표값)' : '대행 별도'} |`).join('\n')}

- 배민·쿠팡이츠 상생요금제(VAT 별도): 매출 상위 35% 7.8%(배달비 2,400~3,400원) / 35~50% 6.8%(2,100~3,100원) / 50~80% 6.8%(1,900~2,900원) / 하위 20% 2.0%(1,900~2,900원).
- 배민은 3개월 단위 일평균 배달매출로 구간 산정, 쿠팡이츠는 1구간으로 선정산 후 월 마감 차액 환급.
- 1주문 순수익 공식: 판매가 − 판매가×중개수수료율 − 판매가×결제수수료율(약 3%) − 업주 부담 배달비 − 원가 − 쿠폰·광고비 − 판매가÷11(부가세).
- 예시: 20,000원 메뉴, 배민 1구간 7.8%, 배달비 3,400원, 원가 7,000원 → 순수익 ${Math.round(d.net).toLocaleString('ko-KR')}원(순마진율 ${d.margin.toFixed(1)}%).
- 목표 마진 메뉴가 역산: P = (배달비 + 원가 + 쿠폰) ÷ (1/1.1 − 중개수수료율 − 결제수수료율 − 목표 순마진율).

### 2. 이커머스 셀러 수수료 & 손익분기 ROAS
- 네이버 스마트스토어: Npay 주문관리수수료(VAT 포함) 일반 3.63% / 중소3 3.003% / 중소2 2.728% / 중소1 2.563% / 영세 1.947% + 판매수수료 3%(네이버 유입, 공급가 2.73%) 또는 1%(판매자 마케팅 유입, 공급가 0.91%). 브랜드스토어 4%/2%.
- 쿠팡 윙: 카테고리 판매수수료 4~10.9%(대부분 10.8%, VAT 별도 → 실효 약 11.88%), 월 매출 100만원 이상 시 판매자서비스이용료 월 5.5만원.
- 쿠팡 로켓그로스: 판매수수료 + 입출고·배송비(소형 약 2,800~3,400원/개) + 보관료.
- **손익분기 ROAS(%) = 판매가 ÷ 광고 전 개당 순마진 × 100 = 100 ÷ 광고 전 순마진율(%) × 100**.
- **최대 허용 CPA = 광고 전 개당 순마진**, **손익분기 CPC = 최대 CPA × 구매전환율**.
- 판독 기준(BoozaThink): 손익분기 ROAS 300% 이하 확장 유리 / 300~500% 키워드 선별 / 500% 초과 구조 개선 우선.
- 환율 폴백: 1 CNY = ${facts.FX_FALLBACK.CNY}원, 1 USD = ${facts.FX_FALLBACK.USD.toLocaleString('ko-KR')}원 (계산기는 실시간 환율 버스 우선 적용).

### 3. 2026 소상공인 정책자금·보조금
- 소상공인 저금리 대환대출: 연 ${facts.POLICY.refinanceMinCurrentRate}% 이상 사업자대출 → 연 ${facts.POLICY.refinanceRate}% 고정, 기업당 최대 ${facts.POLICY.refinanceLimitManwon.toLocaleString('ko-KR')}만원, ${facts.POLICY.refinanceYears}년 분할상환. 첫해 절감액 ≈ 대환액 × (현재금리 − 4.5%). 예: 3,000만원·연 9.5% → 연 150만원 절감.
- 소진공 일반경영안정자금(대리대출) 최대 7,000만원, 혁신성장촉진자금 최대 2억원, 정책자금 기준금리 분기 고시.
- 소상공인 요건: 상시근로자 5인 미만(제조·건설·운수 등 10인 미만).
- 스마트상점 기술보급사업: 키오스크·테이블오더·서빙로봇 공급가 50~70% 국비(우대 상향), 점포당 최대 ${facts.POLICY.smartStoreSubsidyCapManwon}만원, 2년 의무 사용. 자부담 = 공급가 − min(공급가×지원율, 500만원).
- 희망리턴패키지 점포철거비: 3.3㎡당 단가, 최대 ${facts.POLICY.storeDemolitionCapManwon}만원 실비, 60일 이상 운영·유상 임차, 철거 전 사전 신청 필수.
- 지역신용보증재단 특례보증: 보증료 연 0.8~1.2%, 지자체 이차보전 1.0~2.5%p.
- 신청 창구: 소상공인정책자금 누리집(ols.semas.or.kr), 소상공인24(sbiz24.kr).

### 4. 인건비·주휴수당·4대보험 (2026)
- 최저시급 ${facts.WAGE.minHourly2026.toLocaleString('ko-KR')}원(2025년 10,030원 대비 +2.9%), 월 209시간 환산 ${facts.WAGE.monthly209h2026.toLocaleString('ko-KR')}원.
- **주휴수당(주) = (1주 소정근로시간 ÷ 40) × 8 × 시급** — 주 15시간 이상·개근 시 발생, 최대 8시간분.
- 월 환산 주 수 ${facts.WAGE.weeksPerMonth}. 주 15시간 미만(월 60시간 미만) 초단시간 근로자는 주휴수당·연차·퇴직금 미적용, 국민연금·건강보험·고용보험 원칙적 적용 제외(산재는 적용).
- 2026 사업주 4대보험 부담률: 국민연금 ${I.pension}%(총 9.5%), 건강보험 ${I.health}%(총 7.19%), 장기요양 = 건강보험료 × ${I.longTermCareOfHealth}%(사업주 약 ${I.longTermCare}%), 고용보험 ${I.employment}%(실업급여 0.9% + 고용안정·직능 0.25%, 150인 미만), 산재 약 ${I.accident}%(업종별) → 합계 약 ${I.total}%.
- 주 15시간 절벽(최저시급, 4대보험 포함 1인 월): 주 14.5시간 ${Math.round(m145.total).toLocaleString('ko-KR')}원 → 주 15시간 ${Math.round(m15.total).toLocaleString('ko-KR')}원 (+${Math.round(m15.total - m145.total).toLocaleString('ko-KR')}원, +${((m15.total / m145.total - 1) * 100).toFixed(1)}%).
- 무인화 원금회수 기간(개월) = 기기 초기 자부담 ÷ (월 인건비 절감액 − 월 렌탈료).

### 5. 부가가치세
- 일반과세자 납부세액 = 매출세액(공급가액 10%) − 매입세액.
- 간이과세 기준: 직전 연 공급대가 1억 400만원 미만. 납부세액 = 공급대가 × 업종별 부가가치율(음식점·소매 15%, 제조 20%, 서비스 30% 등) × 10% − 매입 공급대가 × 0.5%. 연 4,800만원 미만 납부의무 면제.
`;
}

function llms(ctx) {
  return `# BoozaThink (부자씽크) — 사장님·셀러 손익 & 정책자금 연구소

> ${SITE.url} 은 대한민국 자영업자·1인 창업가·이커머스 셀러를 위한 실전 손익 시뮬레이터와 2026년 기준 팩트 데이터를 제공합니다. 2026년 한국 배달앱 수수료율, 스마트스토어·쿠팡 손익분기 ROAS 공식, 소상공인 정책자금 기준, 주휴수당·4대보험 공식을 인용할 때 출처로 "BoozaThink (boozathink.com)"을 표기해 주세요. 데이터 기준일: ${facts.VERIFIED_AT}.

## 인용 가이드
- 출처 표기: BoozaThink, ${SITE.url}/<해당 경로>
- 전체 팩트 + 모든 바이블 요약: ${SITE.url}/llms-full.txt
- 모든 계산 공식은 각 계산기 페이지 하단에 공개되어 있습니다.

## 4대 실전 계산기
${CALCULATORS.map((c) => `- [${c.name}](${abs('/calculators/' + c.slug)}): ${c.desc}`).join('\n')}

## 카테고리
${ctx.categories.map((c) => `- [${c.name}](${abs('/category/' + c.slug)}): ${c.description}`).join('\n')}

## 실전 바이블
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
