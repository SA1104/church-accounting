# BoozaThink 2.0 — 바이블 아티클 작성 규격 (필독)

프로젝트 루트: `c:\Users\new-s\OneDrive\Desktop\Boozathink`
아티클 파일 위치: `backend/data/articles/<slug>.js` (파일명 = slug, CommonJS)
팩트 단일 진실 공급원: `backend/data/facts.js` — 반드시 먼저 읽고 수치를 일치시킬 것.
검증: `node backend/scripts/check_articles.js <slug>` → 반드시 `PASS` 가 나와야 완료.

## 1. 파일 포맷 (정확히 이 키 구조)

```js
'use strict';
module.exports = {
  slug: 'baemin-sangsaeng-fee-2026',
  category: 'delivery-store-profit', // delivery-store-profit | ecommerce-seller-lab | policy-funds-grants | labor-tax-franchise
  title: '2026 배민 상생요금제 완전 해부: 매출 구간별 7.8%·6.8%·2.0% 실제 순수익 계산',  // 28~48자, 연도·숫자 포함
  description: '…',      // meta description, 공백 포함 70~160자, 핵심 숫자 포함
  keywords: ['배민 상생요금제', '배달앱 수수료', ...], // 5~8개
  publishedAt: '2026-11-19',
  updatedAt: '2026-11-19',
  readingMinutes: 13,
  lead: '도입 문단 2~3문장 (plain text, 태그 금지)',
  summary: ['핵심 요약 1 (숫자 포함)', '핵심 요약 2', '핵심 요약 3', '핵심 요약 4'], // plain text
  sections: [
    { heading: 'H2 소제목', html: `<p>…</p><table>…</table>` },
    // 6~8개 섹션
  ],
  miniCalcAfter: 2,           // 이 인덱스(0부터) 섹션 바로 뒤에 인라인 미니 계산기가 렌더링됨 (1 ~ sections.length-1)
  miniCalc: {
    type: 'delivery-net',     // 아래 2장 목록 중 하나
    title: '내 메뉴 1주문 순수익 3초 계산',
    values: { price: 20000, fee: 7.8, dfee: 3400, cost: 7000 }, // 해당 type 의 키만
    cta: { href: '/calculators/delivery-margin?plan=baemin-78&price=20000&cost=7000', label: '배달앱 순수익 정밀 시뮬레이터로 이어서 계산하기' }
  },
  cases: [
    { kind: 'fail', title: '실패 사례: …', html: `<p>…</p>` },     // 실제 같은 사장님 케이스, 원 단위 숫자
    { kind: 'success', title: '성공 사례: …', html: `<p>…</p>` }
  ],
  faq: [ { q: '질문?', a: '답변 (plain text 2~4문장, 태그 금지)' } /* 정확히 4개 */ ],
  related: ['slug-a', 'slug-b', 'slug-c'], // 아래 20편 slug 중 2~3개
  sources: [ { name: '소상공인시장진흥공단', url: 'https://www.semas.or.kr' } /* 2~4개, facts.js SOURCES 참고 */ ]
};
```

### HTML 규칙
- 허용 태그: `p, h3, ul, ol, li, strong, em, table, thead, tbody, tr, th, td, blockquote, a, br`
- 허용 블록 클래스: `<div class="callout">💡 …</div>`, `<div class="callout warn">⚠️ …</div>`, `<div class="formula">공식 텍스트</div>`
- `h1`, `h2`, `style=` 속성, 이미지, 스크립트 **금지**. 섹션 내부 소제목은 `h3`.
- 표: `<table><thead><tr><th>…</th></tr></thead><tbody><tr><td>…</td></tr></tbody></table>` — **아티클당 표 최소 2개(권장 3개)**, 원 단위 숫자 비교.
- 링크: 내부 링크만 (`/calculators/...`, `/bible/<slug>`, `/category/<slug>`). 외부 링크는 `sources` 배열에만.
- html 문자열은 백틱 템플릿 리터럴 사용. 본문에 백틱(`) 문자나 `${` 사용 금지.

### 분량·품질 (가장 중요)
- `lead + summary + sections + cases + faq` 의 **태그·공백 제거 순수 글자 수 3,600 ~ 5,000자** (검사기 최소 3,400). 요약본·개조식 나열만 하는 글 금지 — 실무자가 읽고 바로 행동할 수 있는 서술형 문단 위주.
- 구체적인 원 단위 계산 예시를 단계별로 최소 2개 (예: 판매가 20,000원 → 중개이용료 7.8% = 1,560원 → …). **계산이 실제로 맞아야 한다** (직접 검산).
- 실패 사례 1건 + 성공 사례 1건: 업종·지역·월매출·구체 숫자가 있는 현실적 케이스 (가명, 예: "서울 마포구 치킨집 A사장님(44세)"). 사례는 '재구성 사례'임을 자연스럽게 밝혀도 됨.
- FAQ 4개: 실제 사장님이 검색할 법한 질문.
- 톤: 존댓말, 사장님 눈높이, 과장·허위 금지. 확정적이지 않은 제도는 "2026년 공고 기준", "차수별 공고 확인 필요" 등으로 표현.
- 같은 카테고리 다른 글과 내용이 겹치지 않도록 각 글의 고유 주제에 집중. 관련 글은 `/bible/<slug>` 내부 링크로 1~2회 자연스럽게 언급.
- 본문 중 1회 이상 해당 메인 계산기(`/calculators/...`)로의 내부 링크를 자연스럽게 포함.

## 2. 인라인 미니 계산기 type 목록 (values 키 정확히 사용)

| type | values 키 (단위) | 계산 내용 |
|---|---|---|
| delivery-net | price(원), fee(%), dfee(원), cost(원) | 1주문 순수익 = price − price×fee% − price×3%(결제) − dfee − cost − 부가세(price/11) |
| delivery-compare | price(원), cost(원) | 같은 메뉴를 배민 1구간/2구간/4구간/쿠팡 9.8%/요기요 9.7%로 팔 때 순수익 비교 |
| target-price | cost(원), fee(%), dfee(원), target(목표 순마진 %) | 목표 마진 달성 메뉴가 역산 |
| breakeven-daily | fixed(월 고정비 원), price(객단가 원), margin(변동이익률 %), days(영업일) | 하루 손익분기 주문 수 |
| roas-breakeven | price(원), cost(개당 총변동비 원: 원가+수수료+배송) | 개당 마진, 손익분기 ROAS = price ÷ (price−cost) × 100 |
| landed-cost | unit(CNY 개당 원가), fx(원/CNY), ship(개당 물류비 원), duty(관부가세 합산 %) | 개당 원화 착지원가 |
| return-loss | price(원), margin(반품 전 개당 순익 원), ret(반품률 %), retcost(반품 1건당 손실 원) | 반품 반영 실질 개당 순익 |
| refinance | loan(만원), rate(현재 금리 %) | 연 4.5% 대환 시 연간/월간 이자 절감액 |
| subsidy | cost(장비 공급가 만원), rate(국비 지원율 %) | 국비(최대 500만원 한도) 차감 후 자부담 |
| weekly-holiday | wage(시급 원), hours(주 근무시간) | 주휴 포함 주급·월 인건비 (15시간 기준 절벽) |
| employer-cost | pay(월 급여 원) | 2026 사업주 4대보험 부담액·총인건비 |
| payback | invest(초기비용 원), saving(월 절감액 원) | 원금회수 개월 수, 3년 누적 절감 |
| vat | sales(연 매출 만원), buy(매입 비율 %) | 일반과세 vs 간이과세(음식점 부가가치율 15%) 부가세 비교 |
| franchise-payback | invest(총 창업비 만원), profit(월 순익 만원) | 투자 회수 개월 수 |
| loan-payment | loan(만원), rate(%), years(총 기간), grace(거치 년) | 거치기간 이자 / 상환기간 월 상환액 |
| guarantee-fee | loan(만원), rate(대출금리 %), gfee(보증료율 %), sub(이차보전 %p) | 실질 연 금융비용 |

## 3. 메인 계산기 프리셋 쿼리 파라미터 (miniCalc.cta.href 및 본문 링크용)

- `/calculators/delivery-margin` : `plan`(baemin-78|baemin-68a|baemin-68b|baemin-20|baemin-store|coupang-98|yogiyo-97|custom), `fee`(%), `price`, `dfee`, `card`(%), `cost`, `promo`(주문당 쿠폰·광고 원), `orders`(일 주문), `fixed`(월 고정비 원), `target`(목표 순마진 %), `days`
- `/calculators/seller-roas` : `cur`(KRW|CNY|USD), `unit`(사입원가, 해당 통화), `ship`(개당 관부가세+물류 원), `market`(ss-naver|ss-mkt|ss-small|cp-wing|cp-rg), `fee`(판매수수료 % 덮어쓰기), `price`, `pack`(개당 포장·택배비 원), `ret`(반품률 %), `cpc`(원), `cvr`(전환율 %)
- `/calculators/policy-funds` : `ind`(food|retail|mfg|service), `region`(seoul|gyeonggi|incheon|busan|daegu|gwangju|daejeon|ulsan|sejong|gangwon|chungbuk|chungnam|jeonbuk|jeonnam|gyeongbuk|gyeongnam|jeju), `age`(pre|lt1|lt3|lt7|gte7), `sales`(연매출 만원), `emp`(lt5|gte5), `hiloan`(고금리대출 만원), `hirate`(%), `kiosk`(1|0), `devcost`(무인기기 비용 만원)
- `/calculators/labor-automation` : `wage`, `hours`(주 근무시간), `staff`(인원), `ins`(1|0), `cut`(단축 후 주 시간), `devices`(대수), `mode`(buy|rent), `devcost`(대당 구매가 원), `rent`(대당 월 렌탈 원), `subsidy`(국비 %)

## 4. 핵심 팩트 (facts.js 와 동일, 반드시 일치)
- 2026 최저시급 10,320원 (2025년 10,030원), 월 209시간 환산 2,156,880원. 주휴수당: 주 15시간 이상 & 개근 시 (주 소정근로시간 ÷ 40 × 8) × 시급. 월 환산 주 수 4.345.
- 주 15시간 미만(월 60시간 미만) 초단시간 근로자: 주휴수당·연차·퇴직금 미적용, 국민연금·건강보험·고용보험 원칙적 적용 제외(산재는 적용).
- 2026 4대보험 사업주 부담: 국민연금 4.75%(총 9.5%), 건강보험 3.595%(총 7.19%), 장기요양 = 건강보험료×13.14%(반반), 고용보험 0.9%+고용안정·직능 0.25%(150인 미만), 산재 업종별(음식·도소매 대표 약 0.9%) → 합계 약 10.87%.
- 배민·쿠팡이츠 상생요금제(VAT 별도): 1구간 매출 상위 35% 7.8%·배달비 2,400~3,400원 / 2구간 35~50% 6.8%·2,100~3,100원 / 3구간 50~80% 6.8%·1,900~2,900원 / 4구간 하위 20% 2.0%·1,900~2,900원. 배민은 3개월 단위 구간 산정, 쿠팡이츠는 1구간 선정산 후 월 마감 차액 환급. 쿠팡이츠 구 스마트요금제 9.8%, 요기요 9.7%, 배민 가게배달 6.8%. 결제수수료 약 3%(VAT 별도 기준 카드·PG).
- 스마트스토어: Npay 주문관리수수료(VAT포함) 일반 3.63% / 중소3 3.003% / 중소2 2.728% / 중소1 2.563% / 영세 1.947% + 판매수수료 3%(공급가 2.73%, 네이버 유입) 또는 판매자 마케팅 유입 1%(공급가 0.91%). 브랜드스토어 4%/2%.
- 쿠팡 윙 카테고리 판매수수료 4~10.9%(대부분 10.8%, VAT 별도), 월 매출 100만원 이상 시 판매자서비스이용료 월 5만5천원. 로켓그로스는 판매수수료 + 입출고·배송비(소형 약 2,800~3,400원/개) + 보관료.
- 손익분기 ROAS = 판매가 ÷ 광고 전 개당 순마진 × 100 (= 1 ÷ 마진율). 최대 CPA = 광고 전 개당 순마진. 손익분기 CPC = 최대 CPA × 전환율.
- 환율 폴백: CNY 194.5원, USD 1,405원 (실시간 환율은 계산기에서 자동 적용).
- 소상공인 저금리 대환대출: 연 7% 이상 사업자대출 → 연 4.5% 고정, 기업당 최대 5,000만원, 10년 분할, 대표자 NCB 919점 이하 등 요건, 소상공인정책자금 누리집(ols.semas.or.kr).
- 소진공 일반경영안정자금(대리대출) 최대 7,000만원, 혁신성장촉진자금 최대 2억, 정책자금 기준금리 분기 고시(연 3%대 중후반 수준).
- 스마트상점 기술보급: 키오스크·테이블오더·서빙로봇 등 공급가 50~70% 국비(우대 시 상향), 점포당 국비 최대 500만원, 2년 의무 사용.
- 희망리턴패키지 점포철거비: 전용면적 3.3㎡당 단가, 최대 600만원 실비(부가세 제외), 60일 이상 운영·유상 임차, 철거 전 사전 신청 필수.
- 지역신용보증재단 보증료 연 0.8~1.2% 수준, 지자체 이차보전 1.0~2.5%p.
- 부가세: 일반과세 = 매출세액 10% − 매입세액. 간이과세 기준 연 공급대가 1억 400만원 미만, 납부세액 = 공급대가 × 업종별 부가가치율(음식점 15%, 소매 15%, 제조 20%, 서비스 30% 등) × 10% − 매입공급대가×0.5%. 연 4,800만원 미만 간이과세자 납부의무 면제.
- 데이터 기준일: 2026-11-19.

## 5. 전체 20편 slug 목록 (related 및 내부 링크용)

배달·외식 (delivery-store-profit):
1. `baemin-sangsaeng-fee-2026` — 2026 배민 상생요금제 구간별(7.8/6.8/2.0%) 실제 공제액과 순수익 [mini: delivery-net]
2. `delivery-app-fee-comparison` — 배민·쿠팡이츠·요기요 같은 2만원 메뉴 앱별 순수익 비교 [mini: delivery-compare]
3. `delivery-menu-price-formula` — 목표 순마진 25% 맞추는 배달 메뉴가 역산 공식 [mini: target-price]
4. `food-cost-ratio-packaging` — 식자재 원가율 30%의 함정: 포장용기·소스·일회용품까지 넣은 진짜 원가 [mini: delivery-net]
5. `restaurant-breakeven-daily-orders` — 월세·인건비·고정비 손익분기: 하루 몇 그릇 팔아야 본전인가 [mini: breakeven-daily]

이커머스 셀러 (ecommerce-seller-lab):
6. `break-even-roas-formula` — 손익분기 ROAS·최대 CPA·손익분기 CPC 공식 완전 가이드 [mini: roas-breakeven]
7. `coupang-rocket-growth-vs-wing` — 쿠팡 로켓그로스 vs 윙 수수료·물류비 개당 마진 실측 [mini: roas-breakeven]
8. `smartstore-fee-structure-2026` — 스마트스토어 Npay 주문관리·판매수수료 구조와 등급별 실제 공제액 [mini: roas-breakeven]
9. `china-sourcing-landed-cost` — 1688·타오바오 중국 사입 착지원가: 위안화 환율·관부가세·해운비 [mini: landed-cost]
10. `return-rate-margin-killer` — 반품률 5%가 마진을 반토막 내는 구조와 대응 [mini: return-loss]

정책자금·보조금 (policy-funds-grants):
11. `soho-policy-fund-2026-guide` — 2026 소상공인 정책자금 총정리: 일반경영안정·혁신성장·대리 vs 직접대출 [mini: loan-payment]
12. `refinance-loan-4-5-percent` — 연 7% 고금리 → 4.5% 저금리 대환대출 이자 절감 계산과 신청 순서 [mini: refinance]
13. `smart-store-tech-subsidy` — 스마트상점 기술보급사업: 키오스크·테이블오더 국비 지원과 실제 자부담 [mini: subsidy]
14. `hope-return-package-closure` — 희망리턴패키지: 점포철거비 최대 600만원·사업정리·재기 지원 [mini: payback 또는 loan-payment]
15. `regional-credit-guarantee-loan` — 지역신용보증재단 특례보증: 보증료·이차보전 포함 실질 금리 계산 [mini: guarantee-fee]

인건비·세무·창업 (labor-tax-franchise):
16. `weekly-holiday-pay-15-hours` — 주휴수당 15시간 절벽: 주 14.5시간 vs 15시간 인건비 비교 [mini: weekly-holiday]
17. `employer-insurance-cost-2026` — 2026 4대보험 사업주 부담: 알바·직원 1명의 진짜 인건비 [mini: employer-cost]
18. `table-order-kiosk-payback` — 테이블오더·키오스크 원금회수: 구매 vs 렌탈 vs 보조금 [mini: payback]
19. `simplified-vs-general-vat` — 간이과세자 vs 일반과세자 부가세: 연매출 1억 400만원 경계 [mini: vat]
20. `franchise-startup-payback` — 프랜차이즈 창업비용 회수기간: 가맹비·인테리어·보증금 시뮬레이션 [mini: franchise-payback]
