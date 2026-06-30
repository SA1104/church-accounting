-- =============================================================================
-- Data Think Engine - 128개 지표 시드 데이터
-- Migration: 003_indicators_seed.sql
-- Description: 한국 금융/경제/부동산/글로벌 지표 128개 초기 삽입
-- Author: Data Think Engine
-- Created: 2026-06-30
-- =============================================================================
-- 카테고리 분류:
--   economy       (1-16)   경제/경기 지표
--   price         (17-27)  물가 지표
--   money         (28-39)  통화/유동성 지표
--   rate          (40-54)  금리 지표
--   exchange      (55-62)  환율 지표
--   stock_market  (63-80)  주식시장 지표
--   stock_individual (81-96) 종목 데이터
--   real_estate   (97-112) 부동산 지표
--   global        (113-128) 글로벌/원자재 지표
-- =============================================================================

-- =============================================================================
-- [01] CATEGORY: economy - 경제/경기 지표 (1~16)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_GDP_REAL_QR', 'GDP (실질)', 'GDP (Real)',
  'economy', 'national_accounts', 'quarterly', '십억원', 'KR',
  'api',
  '한국은행 국민계정. 인플레이션을 제거한 실질 국내총생산 (기준년도 2015년 연쇄가격)',
  'Real GDP from Bank of Korea national accounts. Adjusted for inflation using 2015 chain-weighted prices.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_GDP_GROWTH_REAL_QR', '실질 GDP 성장률', 'Real GDP Growth Rate',
  'economy', 'national_accounts', 'quarterly', '%', 'KR',
  'api',
  '전기 대비 실질 GDP 증가율 (계절 조정). 경제 성장 속도를 측정하는 핵심 지표',
  'Quarter-on-quarter real GDP growth rate (seasonally adjusted). Key measure of economic momentum.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_GDP_NOMINAL_QR', '명목 GDP', 'GDP (Nominal)',
  'economy', 'national_accounts', 'quarterly', '십억원', 'KR',
  'api',
  '당해년도 가격으로 평가한 국내총생산. 경상 GDP라고도 함',
  'GDP measured at current market prices. Also known as current-price GDP.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_PRIVATE_CONSUMPTION_QR', '민간소비', 'Private Consumption',
  'economy', 'national_accounts', 'quarterly', '십억원', 'KR',
  'api',
  '가계 및 민간 비영리단체의 최종소비지출. GDP의 약 48% 차지',
  'Final consumption expenditure of households and non-profit institutions. ~48% of GDP.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_FACILITY_INVESTMENT_QR', '설비투자', 'Facility Investment',
  'economy', 'national_accounts', 'quarterly', '십억원', 'KR',
  'api',
  '기업의 기계, 장비 등 생산 설비에 대한 투자 지출. 경기 선행 성격',
  'Business investment in machinery, equipment, and production facilities. Leading economic indicator.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CONSTRUCTION_INVESTMENT_QR', '건설투자', 'Construction Investment',
  'economy', 'national_accounts', 'quarterly', '십억원', 'KR',
  'api',
  '주거용·비주거용 건물 및 토목 건설에 대한 투자. 고용과 내수에 미치는 파급효과 큼',
  'Investment in residential, non-residential buildings and civil engineering. Large multiplier effect.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_EXPORTS_MN', '수출', 'Exports',
  'economy', 'trade', 'monthly', '백만달러', 'KR',
  'api',
  '재화 및 서비스 수출 금액. 산업통상자원부 통관 기준. 한국 경제의 핵심 성장 동력',
  'Value of goods and services exported (customs clearance basis). Core driver of Korean economic growth.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_IMPORTS_MN', '수입', 'Imports',
  'economy', 'trade', 'monthly', '백만달러', 'KR',
  'api',
  '재화 및 서비스 수입 금액. 원자재, 중간재, 소비재 포함',
  'Value of goods and services imported. Includes raw materials, intermediate goods, and consumer goods.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CURRENT_ACCOUNT_MN', '경상수지', 'Current Account Balance',
  'economy', 'trade', 'monthly', '백만달러', 'KR',
  'api',
  '상품수지, 서비스수지, 본원소득수지, 이전소득수지의 합계. 대외 거래 건전성 지표',
  'Sum of goods, services, primary income, and secondary income balances. Indicator of external health.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_TRADE_BALANCE_MN', '무역수지', 'Trade Balance',
  'economy', 'trade', 'monthly', '백만달러', 'KR',
  'api',
  '수출액에서 수입액을 차감한 금액. 흑자이면 양수, 적자이면 음수',
  'Exports minus imports. Positive value indicates surplus, negative indicates deficit.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_COINCIDENT_INDEX_MN', '경기동행지수 순환변동치', 'Coincident Composite Index (Cycle)',
  'economy', 'business_cycle', 'monthly', '지수', 'KR',
  'api',
  '현재 경기 상황을 반영하는 복합 지수. 순환변동치 기준 100이면 추세 수준',
  'Composite index reflecting current economic conditions. Cycle component: 100 = trend level.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_LEADING_INDEX_MN', '경기선행지수 순환변동치', 'Leading Composite Index (Cycle)',
  'economy', 'business_cycle', 'monthly', '지수', 'KR',
  'api',
  '향후 6개월~1년 경기 방향을 예측하는 선행 복합 지수. 7개 구성요소',
  'Leading composite index predicting economic direction 6-12 months ahead. 7 components.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CSI_MN', '소비자심리지수 (CCSI)', 'Consumer Composite Sentiment Index',
  'economy', 'sentiment', 'monthly', '지수', 'KR',
  'api',
  '한국은행 소비자동향조사. 6개 지수로 구성. 100 이상이면 낙관적',
  'Bank of Korea consumer survey. 6-component composite. Above 100 indicates optimism.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_BSI_MN', '기업경기실사지수 (BSI)', 'Business Survey Index',
  'economy', 'sentiment', 'monthly', '지수', 'KR',
  'api',
  '한국은행 기업경기조사. 제조업 업황 BSI. 100 이상이면 경기 호조 응답 기업 多',
  'Bank of Korea business survey. Manufacturing BSI. Above 100 indicates more positive responses.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_KOREA_MFG_PMI', '한국 제조업 PMI', 'Korea Manufacturing PMI',
  'economy', 'pmi', 'monthly', '지수', 'KR',
  'api',
  'S&P Global 한국 제조업 구매관리자지수. 50 이상 확장, 미만 수축',
  'S&P Global Korea Manufacturing PMI. Above 50=expansion, below 50=contraction.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_KOREA_SVC_PMI', '한국 서비스업 PMI', 'Korea Services PMI',
  'economy', 'pmi', 'monthly', '지수', 'KR',
  'api',
  'S&P Global 한국 서비스업 구매관리자지수. 금융, 보험, 소비자 서비스 등 포함',
  'S&P Global Korea Services PMI. Covers finance, insurance, consumer services and more.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [02] CATEGORY: price - 물가 지표 (17~27)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CPI_MN', '소비자물가지수 (CPI)', 'Consumer Price Index (CPI)',
  'price', 'consumer_price', 'monthly', '지수(2020=100)', 'KR',
  'api',
  '통계청 소비자물가조사. 460개 품목 가격 변동 측정',
  'Statistics Korea CPI. Measures price changes of 460 items with high weight in household spending.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CORE_CPI_MN', '근원 소비자물가지수 (근원CPI)', 'Core CPI',
  'price', 'consumer_price', 'monthly', '%', 'KR',
  'api',
  '에너지와 식품 등 변동성 큰 항목을 제외한 CPI. 기조적 인플레이션 압력 측정',
  'CPI excluding volatile energy and food items. Measures underlying inflationary pressure.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_LIVING_PRICE_MN', '생활물가지수', 'Living Price Index',
  'price', 'consumer_price', 'monthly', '지수(2020=100)', 'KR',
  'api',
  '소비 빈도 높고 지출 비중 큰 144개 품목으로 구성. 체감 물가 지표',
  'Index of 144 frequently purchased items. Reflects consumers perceived cost of living.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_PPI_MN', '생산자물가지수 (PPI)', 'Producer Price Index (PPI)',
  'price', 'producer_price', 'monthly', '지수(2015=100)', 'KR',
  'api',
  '기업이 생산·출하하는 상품 및 서비스 가격 변동. CPI의 선행 지표',
  'Price changes at the producer level. Often leads CPI changes by 1-3 months.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_IMPORT_PRICE_MN', '수입물가지수', 'Import Price Index',
  'price', 'trade_price', 'monthly', '지수(2015=100)', 'KR',
  'api',
  '수입 상품의 가격 변동 지수. 환율과 국제 원자재 가격에 민감',
  'Price index of imported goods. Sensitive to exchange rates and global commodity prices.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_EXPORT_PRICE_MN', '수출물가지수', 'Export Price Index',
  'price', 'trade_price', 'monthly', '지수(2015=100)', 'KR',
  'api',
  '수출 상품의 가격 변동 지수. 환율 변화와 글로벌 수요에 영향',
  'Price index of exported goods. Affected by exchange rate movements and global demand.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_INFLATION_EXPECT_MN', '기대인플레이션율', 'Expected Inflation Rate',
  'price', 'inflation_expectation', 'monthly', '%', 'KR',
  'api',
  '한국은행 소비자동향조사. 향후 1년간 소비자가 예상하는 물가상승률',
  'Consumer expectation for price changes over next 12 months. Used to assess inflation expectations anchoring.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_SALE_IDX_MN', '아파트 매매가격지수 (전국)', 'Apartment Sale Price Index (National)',
  'price', 'real_estate_price', 'monthly', '지수(2021.06=100)', 'KR',
  'api',
  '한국부동산원 전국 아파트 매매가격지수. 실거래가 및 호가 기반 시세 산출',
  'Korea Real Estate Board apartment sale price index (national). Based on actual transactions and listing prices.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_LEASE_IDX_MN', '아파트 전세가격지수 (전국)', 'Apartment Lease Price Index (National)',
  'price', 'real_estate_price', 'monthly', '지수(2021.06=100)', 'KR',
  'api',
  '한국부동산원 전국 아파트 전세가격지수. 전세가율 분석에 활용',
  'Korea Real Estate Board apartment lease (jeonse) price index (national). Used for lease-to-sale ratio analysis.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_HOUSE_SALE_IDX_MN', '주택 매매가격지수 (전국)', 'House Sale Price Index (National)',
  'price', 'real_estate_price', 'monthly', '지수(2021.06=100)', 'KR',
  'api',
  '한국부동산원 전국 주택(아파트+단독+연립) 매매가격지수 종합',
  'Korea Real Estate Board comprehensive house price index (apartments + detached + row houses).'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_HOUSE_LEASE_IDX_MN', '주택 전세가격지수 (전국)', 'House Lease Price Index (National)',
  'price', 'real_estate_price', 'monthly', '지수(2021.06=100)', 'KR',
  'api',
  '한국부동산원 전국 주택 전세가격지수 종합 (아파트+단독+연립)',
  'Korea Real Estate Board comprehensive house lease (jeonse) price index.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [03] CATEGORY: money - 통화/유동성 지표 (28~39)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_M1_MN', 'M1 (협의통화)', 'M1 (Narrow Money)',
  'money', 'monetary_aggregate', 'monthly', '십억원', 'KR',
  'api',
  '현금통화 + 요구불예금 + 수시입출식저축성예금. 가장 좁은 의미의 통화량',
  'Cash + demand deposits + time savings deposits. Narrowest measure of money supply.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_M2_MN', 'M2 (광의통화)', 'M2 (Broad Money)',
  'money', 'monetary_aggregate', 'monthly', '십억원', 'KR',
  'api',
  'M1 + 정기예금 + 적금 + 시장형금융상품 등. 금융정책 분석의 핵심 통화량 지표',
  'M1 plus time deposits, installment savings, market instruments. Key monetary policy indicator.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_LF_MN', 'Lf (금융기관유동성)', 'Lf (Financial Institution Liquidity)',
  'money', 'monetary_aggregate', 'monthly', '십억원', 'KR',
  'api',
  'M2 + 2년 이상 정기예금/적금 + 생명보험계약준비금 등. 광의의 유동성 지표',
  'M2 plus longer-term deposits and insurance reserves. Broad liquidity measure.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_BASE_MONEY_MN', '본원통화 (Reserve Money)', 'Reserve Money (Base Money)',
  'money', 'monetary_base', 'monthly', '십억원', 'KR',
  'api',
  '한국은행이 공급하는 화폐. 민간보유현금 + 예금은행 지급준비금. 통화승수의 분모',
  'Money supplied by Bank of Korea. Currency in circulation + bank reserves. Denominator of money multiplier.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_BANK_DEPOSIT_MN', '예금은행 수신', 'Bank Deposits',
  'money', 'bank_flow', 'monthly', '십억원', 'KR',
  'api',
  '시중은행의 총 예금 수신 잔액. 시중 유동성 및 자금 이동 방향 파악',
  'Total deposit balance at commercial banks. Indicator of liquidity conditions and fund flows.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_BANK_LOAN_MN', '예금은행 대출', 'Bank Loans Outstanding',
  'money', 'bank_flow', 'monthly', '십억원', 'KR',
  'api',
  '시중은행의 총 대출 잔액. 신용 창출 규모 및 경기 확장/수축 판단',
  'Total loan balance at commercial banks. Indicates credit creation and economic cycle stage.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_HOUSEHOLD_LOAN_MN', '가계대출 잔액', 'Household Loans Outstanding',
  'money', 'credit', 'monthly', '십억원', 'KR',
  'api',
  '금융기관 가계대출 전체 잔액 (주담대 + 신용대출 + 기타). 가계부채 건전성 모니터링',
  'Total household loan balance (mortgage + credit + other). Key for household debt sustainability monitoring.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_MORTGAGE_LOAN_MN', '주택담보대출 잔액', 'Mortgage Loans Outstanding',
  'money', 'credit', 'monthly', '십억원', 'KR',
  'api',
  '주택을 담보로 한 금융기관 대출 잔액. 부동산 시장과 긴밀히 연동',
  'Outstanding mortgage loan balance at financial institutions. Closely linked to real estate market dynamics.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CORPORATE_LOAN_MN', '기업대출 잔액', 'Corporate Loans Outstanding',
  'money', 'credit', 'monthly', '십억원', 'KR',
  'api',
  '금융기관 기업 대출 잔액. 대기업 및 중소기업 대출 포함',
  'Total corporate loan balance. Includes large and small-medium enterprises.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CREDIT_LOAN_MN', '신용대출 잔액', 'Unsecured Credit Loans Outstanding',
  'money', 'credit', 'monthly', '십억원', 'KR',
  'api',
  '담보 없이 신용도만으로 실행된 가계 대출 잔액. 레버리지 투자와 연관성 높음',
  'Household unsecured credit loan balance. Closely associated with leveraged investment activity.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_MONEY_MULTIPLIER_MN', '통화승수 (M2/본원통화)', 'Money Multiplier (M2/Base)',
  'money', 'monetary_base', 'monthly', '배수', 'KR',
  'api',
  'M2를 본원통화로 나눈 값. 금융시스템의 신용 창출 능력',
  'M2 divided by base money. Reflects the financial system credit creation capacity.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_M2_GROWTH_MN', 'M2 증가율 (전년동월비)', 'M2 Growth Rate (YoY)',
  'money', 'monetary_aggregate', 'monthly', '%', 'KR',
  'api',
  '전년 동월 대비 M2 증가율. 통화량 팽창/수축 속도 측정',
  'Year-on-year M2 growth rate. Measures speed of monetary expansion/contraction.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [04] CATEGORY: rate - 금리 지표 (40~54)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_BOK_BASE_RATE', '한국 기준금리 (한국은행)', 'Bank of Korea Base Rate',
  'rate', 'policy_rate', 'daily', '% p.a.', 'KR',
  'api',
  '한국은행 금융통화위원회가 결정하는 정책금리. 7일물 RP 기준',
  'Policy rate set by Bank of Korea Monetary Policy Committee. Based on 7-day repurchase agreements.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_FED_FUNDS_RATE', '미국 기준금리 (연방기금금리)', 'US Federal Funds Rate',
  'rate', 'policy_rate', 'daily', '% p.a.', 'US',
  'api',
  'FOMC가 결정하는 미국 연방기금금리 목표 범위 상단. 글로벌 금리의 기준점',
  'US Federal Funds Rate upper target set by FOMC. The benchmark for global interest rates.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_KTB_1Y', '국고채 금리 1년', 'Korea Treasury Bond 1Y Yield',
  'rate', 'government_bond', 'daily', '% p.a.', 'KR',
  'api',
  '한국 국고채 1년 만기 수익률. 단기 기준금리 기대치 반영',
  'Korean government bond yield at 1-year maturity. Reflects near-term policy rate expectations.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_KTB_3Y', '국고채 금리 3년', 'Korea Treasury Bond 3Y Yield',
  'rate', 'government_bond', 'daily', '% p.a.', 'KR',
  'api',
  '한국 국고채 3년 만기 수익률. 통화정책 변화 기대를 반영하는 중기 기준금리',
  'Korean 3-year government bond yield. Mid-term benchmark reflecting monetary policy expectations.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_KTB_5Y', '국고채 금리 5년', 'Korea Treasury Bond 5Y Yield',
  'rate', 'government_bond', 'daily', '% p.a.', 'KR',
  'api',
  '한국 국고채 5년 만기 수익률',
  'Korean 5-year government bond yield.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_KTB_10Y', '국고채 금리 10년', 'Korea Treasury Bond 10Y Yield',
  'rate', 'government_bond', 'daily', '% p.a.', 'KR',
  'api',
  '한국 국고채 10년 만기 수익률. 장기 기준금리이자 모기지 금리의 벤치마크',
  'Korean 10-year government bond yield. Long-term benchmark and reference for mortgage rates.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CORP_BOND_AA_3Y', '회사채 금리 AA- 3년', 'Corporate Bond AA- 3Y Yield',
  'rate', 'corporate_bond', 'daily', '% p.a.', 'KR',
  'api',
  '신용등급 AA- 회사채 3년 만기 수익률. 우량 기업의 자금 조달 비용 기준',
  'AA-rated corporate bond 3-year yield. Benchmark funding cost for high-grade Korean companies.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CORP_BOND_BBB_3Y', '회사채 금리 BBB- 3년', 'Corporate Bond BBB- 3Y Yield',
  'rate', 'corporate_bond', 'daily', '% p.a.', 'KR',
  'api',
  '신용등급 BBB- 회사채 3년 만기 수익률. 크레딧 스프레드 분석에 활용',
  'BBB-rated corporate bond 3-year yield. Used for credit spread analysis.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CD_91D', 'CD 금리 91일', 'Certificate of Deposit Rate 91D',
  'rate', 'money_market', 'daily', '% p.a.', 'KR',
  'api',
  '91일물 양도성예금증서 금리. 변동금리 대출의 준거금리로 광범위하게 사용',
  '91-day certificate of deposit rate. Widely used as reference rate for floating-rate loans in Korea.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CP_91D', '기업어음 (CP) 금리 91일', 'Commercial Paper Rate 91D',
  'rate', 'money_market', 'daily', '% p.a.', 'KR',
  'api',
  '91일물 기업어음 금리. 단기 기업 자금 조달 비용. 신용 이벤트 발생 시 급등',
  '91-day commercial paper rate. Reflects short-term corporate funding costs. Spikes during credit events.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CALL_RATE', '콜금리 (익일물)', 'Overnight Call Rate',
  'rate', 'money_market', 'daily', '% p.a.', 'KR',
  'api',
  '금융기관 간 초단기 자금 거래 금리 (익일물 기준). 기준금리와 매우 밀접하게 연동',
  'Overnight interbank call rate. Closely tracks the Bank of Korea policy rate.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_BANK_DEPOSIT_RATE_MN', '은행 예금금리 (정기예금 1년)', 'Bank Deposit Rate (1Y Time Deposit)',
  'rate', 'bank_rate', 'monthly', '% p.a.', 'KR',
  'api',
  '시중은행 1년 만기 정기예금 신규 취급액 기준 가중평균 금리',
  'Weighted average new interest rate on 1-year time deposits at commercial banks.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_MORTGAGE_RATE_MN', '주택담보대출 금리', 'Mortgage Loan Rate',
  'rate', 'lending_rate', 'monthly', '% p.a.', 'KR',
  'api',
  '시중은행 주택담보대출 신규 취급 기준 가중평균 금리. 부동산 시장 수요에 직접적 영향',
  'Weighted average new mortgage rate at commercial banks. Direct impact on housing demand.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_CREDIT_LOAN_RATE_MN', '신용대출 금리', 'Unsecured Credit Loan Rate',
  'rate', 'lending_rate', 'monthly', '% p.a.', 'KR',
  'api',
  '시중은행 신용대출 신규 취급 기준 가중평균 금리',
  'Weighted average new unsecured credit loan rate at commercial banks.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_YIELD_SPREAD_10Y_3Y', '장단기 금리차 (10년-3년)', 'Yield Spread (10Y-3Y KTB)',
  'rate', 'yield_curve', 'daily', '%p', 'KR',
  'api',
  '국고채 10년물과 3년물 수익률 차이. 역전(음수)이면 경기침체 시그널',
  'Spread between 10Y and 3Y Korean government bonds. Negative (inverted) signals potential recession.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [05] CATEGORY: exchange - 환율 지표 (55~62)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_USD_KRW', '원/달러 환율', 'USD/KRW Exchange Rate',
  'exchange', 'fx_spot', 'daily', '원/달러', 'KR',
  'api',
  '서울외국환중개 기준 원화 대 미달러 현물환율 (매매기준율). 한국의 가장 핵심 환율 지표',
  'USD/KRW spot rate (reference rate) from Seoul Money Brokerage Services. Most critical FX rate for Korea.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_JPY_KRW', '원/엔 환율 (100엔)', 'JPY/KRW Exchange Rate (per 100 JPY)',
  'exchange', 'fx_spot', 'daily', '원/100엔', 'KR',
  'api',
  '원화 대 일본 엔화 환율 (100엔 기준). 일본과 무역/관광 경쟁 관계 분석',
  'KRW per 100 JPY exchange rate. Relevant for Korea-Japan trade and tourism competitiveness analysis.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_EUR_KRW', '원/유로 환율', 'EUR/KRW Exchange Rate',
  'exchange', 'fx_spot', 'daily', '원/유로', 'KR',
  'api',
  '원화 대 유로화 환율. 유럽 수출 기업의 환 헤지 기준',
  'KRW per EUR exchange rate. Reference for hedging by Korean exporters to Europe.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_DXY', '달러 인덱스 (DXY)', 'US Dollar Index (DXY)',
  'exchange', 'dollar_index', 'daily', '지수', 'US',
  'api',
  '주요 6개 통화 대비 미달러 강도 지수 (EUR 57.6%, JPY 13.6% 등). 위험선호 지표로도 활용',
  'Index measuring USD strength vs 6 major currencies (EUR 57.6%, JPY 13.6%, etc.).'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_USD_CNY', '위안/달러 환율 (달러당 위안)', 'USD/CNY Exchange Rate',
  'exchange', 'fx_spot', 'daily', '위안/달러', 'CN',
  'api',
  '중국 인민은행 고시 기준환율 (중간가격). 중국 경기 및 무역 분쟁 민감도 파악',
  'PBOC fixing rate (mid-price). Sensitive to Chinese economic conditions and trade tensions.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_USD_JPY', '엔/달러 환율 (달러당 엔)', 'USD/JPY Exchange Rate',
  'exchange', 'fx_spot', 'daily', '엔/달러', 'JP',
  'api',
  '미국 달러 대 일본 엔화 환율. 엔 약세 시 한국 수출 경쟁력에 영향',
  'USD/JPY exchange rate. Yen weakness affects Korean export competitiveness vs Japan.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_EUR_USD', '유로/달러 환율', 'EUR/USD Exchange Rate',
  'exchange', 'fx_spot', 'daily', '달러/유로', 'EU',
  'api',
  '유로화 대 미달러 환율. 세계 최대 거래량의 통화쌍',
  'EUR/USD exchange rate. Largest traded currency pair by volume in the world.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'ECOS'),
  'ECOS_FX_RESERVES_MN', '외환보유액', 'Foreign Exchange Reserves',
  'exchange', 'reserves', 'monthly', '백만달러', 'KR',
  'api',
  '한국 정부/한국은행이 보유한 외환 보유고. IMF SDR, 금 포함. 외채 상환 능력 및 환율 방어 여력 지표',
  'Korean government/BOK foreign exchange reserves including IMF SDR and gold.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [06] CATEGORY: stock_market - 주식시장 지표 (63~80)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_KOSPI', 'KOSPI 지수', 'KOSPI Index',
  'stock_market', 'index', 'daily', '포인트', 'KR',
  'crawl',
  '유가증권시장 상장 전 종목 시가총액 가중 지수. 1980.01.04=100 기준',
  'Market cap weighted index of all KOSPI-listed stocks. Base: 1980.01.04=100.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_KOSDAQ', 'KOSDAQ 지수', 'KOSDAQ Index',
  'stock_market', 'index', 'daily', '포인트', 'KR',
  'crawl',
  '코스닥시장 상장 전 종목 시가총액 가중 지수. 1996.07.01=1000 기준. 중소/벤처 중심',
  'Market cap weighted index of all KOSDAQ-listed stocks. Base: 1996.07.01=1000. SMEs and venture focus.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_KOSPI200', 'KOSPI 200 지수', 'KOSPI 200 Index',
  'stock_market', 'index', 'daily', '포인트', 'KR',
  'crawl',
  '코스피 시총 상위 200 종목 지수. 선물/옵션 기초자산. 외국인 투자 벤치마크',
  'Top 200 KOSPI stocks by market cap. Futures/options underlying. Foreign investor benchmark.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_KOSPI_TURNOVER', 'KOSPI 거래대금', 'KOSPI Trading Value',
  'stock_market', 'market_activity', 'daily', '억원', 'KR',
  'crawl',
  '유가증권시장 일별 총 거래대금. 시장 활성화 및 투자자 참여도 지표',
  'Total daily trading value on KOSPI market. Indicator of market activity and investor participation.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_KOSDAQ_TURNOVER', 'KOSDAQ 거래대금', 'KOSDAQ Trading Value',
  'stock_market', 'market_activity', 'daily', '억원', 'KR',
  'crawl',
  '코스닥시장 일별 총 거래대금',
  'Total daily trading value on KOSDAQ market.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_FOREIGN_NET_BUY', '외국인 순매수 (코스피)', 'Foreign Net Buy (KOSPI)',
  'stock_market', 'investor_flow', 'daily', '억원', 'KR',
  'crawl',
  'KOSPI 외국인 투자자 순매수금액. 음수는 순매도. 외국인 수급 동향의 핵심 지표',
  'Foreign investor net buy/sell on KOSPI. Negative = net sell. Most watched institutional flow indicator.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_INSTITUTION_NET_BUY', '기관 순매수 (코스피)', 'Institutional Net Buy (KOSPI)',
  'stock_market', 'investor_flow', 'daily', '억원', 'KR',
  'crawl',
  'KOSPI 기관 투자자 순매수금액. 연기금, 투신, 보험, 은행 등 포함',
  'Institutional investor net buy/sell on KOSPI. Includes pension funds, trusts, insurance, banks.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_INDIVIDUAL_NET_BUY', '개인 순매수 (코스피)', 'Individual Net Buy (KOSPI)',
  'stock_market', 'investor_flow', 'daily', '억원', 'KR',
  'crawl',
  'KOSPI 개인 투자자 순매수금액',
  'Individual investor net buy/sell on KOSPI.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_MARGIN_BALANCE', '신용잔고 (코스피+코스닥)', 'Margin Balance (KOSPI+KOSDAQ)',
  'stock_market', 'margin', 'daily', '억원', 'KR',
  'crawl',
  '투자자가 주식을 담보로 증권사에서 빌려 매수한 금액. 레버리지 과열 지표',
  'Amount borrowed from brokers to buy stocks on margin. Indicator of leveraged trading overheating.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_CUSTOMER_DEPOSIT', '고객예탁금', 'Customer Securities Deposits',
  'stock_market', 'market_liquidity', 'daily', '억원', 'KR',
  'crawl',
  '투자자가 주식 매수를 위해 증권사 계좌에 예치해 놓은 대기 자금. 증시 대기 유동성 지표',
  'Cash deposits in brokerage accounts waiting to be invested. Leading indicator of market liquidity demand.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SHORT_SELL_VALUE', '공매도 거래대금 (코스피)', 'Short Selling Value (KOSPI)',
  'stock_market', 'short_selling', 'daily', '억원', 'KR',
  'crawl',
  'KOSPI 공매도 일별 거래대금. 하락 베팅 수요 및 시장 헤지 활동 측정',
  'Daily short selling value on KOSPI. Measures bearish positioning and hedging activity.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_VKOSPI', 'VKOSPI (한국판 VIX)', 'VKOSPI (Korea Volatility Index)',
  'stock_market', 'volatility', 'daily', '지수', 'KR',
  'crawl',
  'KOSPI200 옵션 내재변동성 기반 공포지수. 30 이상이면 극단적 공포',
  'Implied volatility index based on KOSPI200 options. Above 30 = extreme fear. Contrarian indicator.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SECTOR_SEMICON', '반도체 업종 지수', 'Semiconductor Sector Index',
  'stock_market', 'sector_index', 'daily', '포인트', 'KR',
  'crawl',
  'KRX 반도체 섹터 지수. 삼성전자, SK하이닉스 등 반도체 관련주 포함',
  'KRX semiconductor sector index. Includes Samsung Electronics, SK Hynix and other chip-related companies.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SECTOR_BATTERY', '2차전지 업종 지수', 'Secondary Battery Sector Index',
  'stock_market', 'sector_index', 'daily', '포인트', 'KR',
  'crawl',
  'KRX 2차전지 테마 지수. LG에너지솔루션, 삼성SDI, 에코프로 계열사 등 포함',
  'KRX secondary battery theme index. Includes LG Energy Solution, Samsung SDI, Ecopro affiliates.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SECTOR_BIO', '바이오 업종 지수', 'Bio/Healthcare Sector Index',
  'stock_market', 'sector_index', 'daily', '포인트', 'KR',
  'crawl',
  'KRX 헬스케어 섹터 지수. 삼성바이오로직스, 셀트리온, 한미약품 등 포함',
  'KRX healthcare sector index. Includes Samsung Biologics, Celltrion, Hanmi Pharma and others.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SECTOR_FINANCE', '금융 업종 지수', 'Financial Sector Index',
  'stock_market', 'sector_index', 'daily', '포인트', 'KR',
  'crawl',
  'KRX 금융 섹터 지수. 은행, 증권, 보험사 포함',
  'KRX financial sector index. Includes banks, securities firms, and insurance companies.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SECTOR_CONSTRUCTION', '건설 업종 지수', 'Construction Sector Index',
  'stock_market', 'sector_index', 'daily', '포인트', 'KR',
  'crawl',
  'KRX 건설 섹터 지수. 현대건설, GS건설 등 포함',
  'KRX construction sector index. Includes Hyundai E&C, GS Engineering & Construction.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_SECTOR_AUTO', '자동차 업종 지수', 'Automobile Sector Index',
  'stock_market', 'sector_index', 'daily', '포인트', 'KR',
  'crawl',
  'KRX 자동차 섹터 지수. 현대차, 기아, 현대모비스 등 포함',
  'KRX automobile sector index. Includes Hyundai Motor, Kia, Hyundai Mobis and others.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [07] CATEGORY: stock_individual - 종목 개별 데이터 (81~96)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_OPEN', '종목 시가', 'Stock Open Price',
  'stock_individual', 'ohlcv', 'daily', '원', 'KR', 'crawl',
  '개별 종목의 당일 시장 개시가격', 'Individual stock opening price on the trading day.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_HIGH', '종목 고가', 'Stock High Price',
  'stock_individual', 'ohlcv', 'daily', '원', 'KR', 'crawl',
  '개별 종목의 당일 최고가', 'Individual stock intraday high price.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_LOW', '종목 저가', 'Stock Low Price',
  'stock_individual', 'ohlcv', 'daily', '원', 'KR', 'crawl',
  '개별 종목의 당일 최저가', 'Individual stock intraday low price.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_CLOSE', '종목 종가', 'Stock Close Price',
  'stock_individual', 'ohlcv', 'daily', '원', 'KR', 'crawl',
  '개별 종목의 당일 최종 거래가격 (종가)', 'Individual stock closing price for the trading session.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_VOLUME', '종목 거래량', 'Stock Trading Volume',
  'stock_individual', 'ohlcv', 'daily', '주', 'KR', 'crawl',
  '개별 종목의 당일 총 거래 수량', 'Total shares traded for the stock on the given trading day.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_TRADING_VALUE', '종목 거래대금', 'Stock Trading Value',
  'stock_individual', 'ohlcv', 'daily', '원', 'KR', 'crawl',
  '개별 종목의 당일 총 거래금액 (거래량 x 체결가)', 'Total trading value (volume x price) for the stock on the given trading day.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_MARKET_CAP', '종목 시가총액', 'Stock Market Capitalization',
  'stock_individual', 'valuation', 'daily', '억원', 'KR', 'crawl',
  '종가 x 상장주식수. 기업의 시장 가치', 'Close price multiplied by listed shares. Market value of the company.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_PER', '종목 PER (주가수익비율)', 'Stock P/E Ratio',
  'stock_individual', 'valuation', 'daily', '배', 'KR', 'crawl',
  '주가를 주당순이익(EPS)으로 나눈 값. 이익 대비 주가 수준 평가', 'Price-to-earnings ratio. Measures valuation relative to earnings.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_PBR', '종목 PBR (주가순자산비율)', 'Stock P/B Ratio',
  'stock_individual', 'valuation', 'daily', '배', 'KR', 'crawl',
  '주가를 주당순자산(BPS)으로 나눈 값. 1배 이하이면 청산가치 이하', 'Price-to-book ratio. Below 1 suggests trading below liquidation value.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'DART'),
  'DART_STOCK_EPS', '종목 EPS (주당순이익)', 'Stock Earnings Per Share',
  'stock_individual', 'fundamental', 'quarterly', '원/주', 'KR', 'api',
  '당기순이익 / 발행주식수. 주주에게 귀속되는 1주당 이익', 'Net income divided by shares outstanding. Per-share earnings attributable to shareholders.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'DART'),
  'DART_STOCK_BPS', '종목 BPS (주당순자산)', 'Stock Book Value Per Share',
  'stock_individual', 'fundamental', 'quarterly', '원/주', 'KR', 'api',
  '자기자본 / 발행주식수. 청산 시 주주에게 돌아오는 1주당 자산', 'Equity divided by shares outstanding. Net asset value per share at liquidation.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_DIV_YIELD', '종목 배당수익률', 'Stock Dividend Yield',
  'stock_individual', 'dividend', 'daily', '%', 'KR', 'crawl',
  '연간 주당 배당금 / 현재 주가 x 100. 배당 투자 매력도 측정', 'Annual dividends per share divided by current stock price. Measures dividend investment attractiveness.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_FOREIGN_HOLD', '종목 외국인 보유율', 'Stock Foreign Holding Ratio',
  'stock_individual', 'investor_ownership', 'daily', '%', 'KR', 'crawl',
  '전체 상장주식 대비 외국인 보유 주식 비율', 'Foreign-held shares as % of total listed shares.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_INST_NET', '종목 기관 순매수', 'Stock Institutional Net Buy',
  'stock_individual', 'investor_flow', 'daily', '주', 'KR', 'crawl',
  '개별 종목에 대한 기관 순매수 수량. 음수는 순매도', 'Institutional net purchase volume for individual stock. Negative = net sell.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_FOREIGN_NET', '종목 외국인 순매수', 'Stock Foreign Net Buy',
  'stock_individual', 'investor_flow', 'daily', '주', 'KR', 'crawl',
  '개별 종목에 대한 외국인 순매수 수량. 음수는 순매도', 'Foreign investor net purchase volume for individual stock. Negative = net sell.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'KRX'),
  'KRX_STOCK_INDIV_NET', '종목 개인 순매수', 'Stock Individual Net Buy',
  'stock_individual', 'investor_flow', 'daily', '주', 'KR', 'crawl',
  '개별 종목에 대한 개인 순매수 수량. 음수는 순매도', 'Individual investor net purchase volume for individual stock. Negative = net sell.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [08] CATEGORY: real_estate - 부동산 지표 (97~112)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_SALE_SEOUL', '서울 아파트 매매가격지수', 'Seoul Apartment Sale Price Index',
  'real_estate', 'price_index', 'monthly', '지수(2021.06=100)', 'KR', 'api',
  '한국부동산원 서울 아파트 매매가격지수', 'Seoul apartment sale price index by Korea Real Estate Board.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_SALE_METRO', '수도권 아파트 매매가격지수', 'Seoul Metro Apartment Sale Price Index',
  'real_estate', 'price_index', 'monthly', '지수(2021.06=100)', 'KR', 'api',
  '한국부동산원 서울+경기+인천 수도권 아파트 매매가격지수', 'Korea Real Estate Board apartment sale price index for Seoul Metropolitan Area.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_SALE_REGION', '지방 아파트 매매가격지수', 'Regional Apartment Sale Price Index',
  'real_estate', 'price_index', 'monthly', '지수(2021.06=100)', 'KR', 'api',
  '한국부동산원 수도권 제외 지방 아파트 매매가격지수', 'Apartment sale price index for regional areas excluding Seoul Metropolitan Area.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_LEASE_SEOUL', '서울 아파트 전세가격지수', 'Seoul Apartment Lease Price Index',
  'real_estate', 'price_index', 'monthly', '지수(2021.06=100)', 'KR', 'api',
  '한국부동산원 서울 아파트 전세가격지수', 'Seoul apartment lease (jeonse) price index by Korea Real Estate Board.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_LEASE_METRO', '수도권 아파트 전세가격지수', 'Metro Apartment Lease Price Index',
  'real_estate', 'price_index', 'monthly', '지수(2021.06=100)', 'KR', 'api',
  '수도권 아파트 전세가격지수', 'Seoul Metropolitan Area apartment lease price index.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_LEASE_REGION', '지방 아파트 전세가격지수', 'Regional Apartment Lease Price Index',
  'real_estate', 'price_index', 'monthly', '지수(2021.06=100)', 'KR', 'api',
  '수도권 제외 지방 아파트 전세가격지수', 'Regional apartment lease price index excluding Seoul Metropolitan Area.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_APT_SALE_TRANS', '아파트 매매 거래량', 'Apartment Sale Transaction Volume',
  'real_estate', 'transaction', 'monthly', '건', 'KR', 'api',
  '국토교통부 아파트 매매 실거래 신고 건수. 계약 후 30일 이내 신고', 'Number of apartment sale transactions reported to MOLIT. Reported within 30 days of contract.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_APT_LEASE_TRANS', '아파트 전월세 거래량', 'Apartment Lease Transaction Volume',
  'real_estate', 'transaction', 'monthly', '건', 'KR', 'api',
  '국토교통부 아파트 전세 및 월세 실거래 신고 건수', 'Number of apartment lease (jeonse+monthly) transactions reported to MOLIT.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_UNSOLD_HOMES', '미분양 주택 (전국)', 'Unsold New Homes (National)',
  'real_estate', 'supply', 'monthly', '호', 'KR', 'api',
  '분양 후 미계약 상태 주택 재고. 부동산 시장 수급 불균형 지표', 'Inventory of unsold new homes after initial offering. Indicator of supply-demand imbalance.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_UNSOLD_COMPLETED', '준공 후 미분양 (전국)', 'Unsold Completed Homes (National)',
  'real_estate', 'supply', 'monthly', '호', 'KR', 'api',
  '건물 준공 이후에도 미분양된 주택 (악성 미분양). 건설사 부도 위험 직결', 'Homes unsold even after construction completion. Directly linked to developer default risk.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_HOUSING_PERMIT', '주택 건축 인허가', 'Housing Construction Permits',
  'real_estate', 'pipeline', 'monthly', '호', 'KR', 'api',
  '지방자치단체의 주택 건축 인허가 건수. 2~3년 후 입주 물량 예측 선행 지표', 'Housing construction permits approved by local governments. Leading indicator for future supply 2-3 years ahead.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_HOUSING_START', '주택 착공', 'Housing Starts',
  'real_estate', 'pipeline', 'monthly', '호', 'KR', 'api',
  '공사를 시작한 주택 수. 인허가 대비 실제 착공 비율 분석으로 시장 심리 파악', 'Number of homes where construction has started. Ratio to permits reveals developer confidence.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'MOLIT'),
  'MOLIT_HOUSING_COMPLETION', '주택 준공', 'Housing Completions',
  'real_estate', 'pipeline', 'monthly', '호', 'KR', 'api',
  '완공된 주택 수. 실제 입주 가능 공급량', 'Number of homes completing construction. Actual supply entering the market.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_APT_MOVE_IN', '아파트 입주 물량 (예정)', 'Apartment Move-in Supply (Planned)',
  'real_estate', 'pipeline', 'monthly', '호', 'KR', 'api',
  '향후 3~6개월 입주 예정 아파트 물량. 전세가 및 매매가 선행 압력 예측', 'Planned apartment move-in supply for next 3-6 months. Leading predictor of rental and sale price pressure.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_LAND_PRICE_CHANGE', '지가 변동률 (전국)', 'Land Price Change Rate (National)',
  'real_estate', 'land_price', 'quarterly', '%', 'KR', 'api',
  '한국부동산원 전국 지가변동률. 토지 시장 동향 파악', 'National land price change rate by Korea Real Estate Board.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'REB'),
  'REB_COMMERCIAL_RENT_IDX', '상업용 부동산 임대가격지수', 'Commercial Real Estate Rent Index',
  'real_estate', 'commercial', 'quarterly', '지수', 'KR', 'api',
  '오피스, 상가 등 상업용 부동산 임대료 변동 지수. 한국부동산원 분기별 조사', 'Rental price index for commercial properties (office, retail). Quarterly survey by Korea Real Estate Board.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- [09] CATEGORY: global - 글로벌/원자재 지표 (113~128)
-- =============================================================================
INSERT INTO indicators (
  source_id, indicator_code, indicator_name_ko, indicator_name_en,
  category, sub_category, frequency, unit, country,
  collection_method, description_ko, description_en
) VALUES

(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_SP500', 'S&P 500 지수', 'S&P 500 Index',
  'global', 'equity_index', 'daily', '포인트', 'US', 'api',
  '미국 대형주 500개로 구성된 시가총액 가중 지수. 글로벌 위험 선호의 기준', 'Market cap weighted index of 500 large US companies. Benchmark for global risk appetite.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_NASDAQ', 'NASDAQ 종합지수', 'NASDAQ Composite Index',
  'global', 'equity_index', 'daily', '포인트', 'US', 'api',
  '미국 나스닥 시장 전체 종목 지수. 기술주 중심. 한국 반도체/IT 기업과 높은 상관관계', 'Composite index of all NASDAQ-listed stocks. Tech-heavy. High correlation with Korean semiconductor/IT stocks.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_DJIA', '다우존스 산업평균지수 (DJIA)', 'Dow Jones Industrial Average',
  'global', 'equity_index', 'daily', '포인트', 'US', 'api',
  '미국 대표 30개 우량 기업으로 구성된 가격 가중 지수. 가장 역사가 오래된 미국 증시 지표', 'Price-weighted index of 30 blue-chip US companies. Oldest US stock market indicator.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_RUSSELL2000', 'Russell 2000 지수', 'Russell 2000 Index',
  'global', 'equity_index', 'daily', '포인트', 'US', 'api',
  '미국 소형주 2000개 지수. 미국 내수 경기와 연동. 대형주 대비 리스크 선호 판단', 'Index of 2000 US small-cap stocks. Tracks domestic US economy. Risk appetite gauge vs large caps.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_VIX', 'VIX (S&P500 변동성지수)', 'CBOE Volatility Index (VIX)',
  'global', 'volatility', 'daily', '지수', 'US', 'api',
  'CBOE S&P500 옵션 내재변동성. 글로벌 금융시장 공포 지수. 30 이상 극도 불안, 20 이하 안정', 'Implied volatility from S&P500 options. Global fear gauge. >30 extreme fear, <20 stable.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_UST_2Y', '미국채 2년 수익률', 'US Treasury 2Y Yield',
  'global', 'bond', 'daily', '% p.a.', 'US', 'api',
  '미국 재무부 2년 만기 국채 수익률. 단기 연준 금리 정책 기대를 가장 민감하게 반영', 'US 2-year Treasury yield. Most sensitive to near-term Federal Reserve rate expectations.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_UST_10Y', '미국채 10년 수익률', 'US Treasury 10Y Yield',
  'global', 'bond', 'daily', '% p.a.', 'US', 'api',
  '미국 재무부 10년 만기 국채 수익률. 글로벌 장기 무위험 수익률 기준', 'US 10-year Treasury yield. Global long-term risk-free rate benchmark. Equity valuation discount rate reference.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_UST_SPREAD_10Y_2Y', '미국 장단기 금리차 (10년-2년)', 'US Yield Spread (10Y-2Y)',
  'global', 'yield_curve', 'daily', '%p', 'US', 'api',
  '미국채 10년-2년 스프레드. 역전(음수)이면 경기침체 예고. 1970년 이후 100% 예측력', 'US 10Y minus 2Y Treasury spread. Inversion historically preceded all US recessions since 1970.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_WTI', 'WTI 유가 (서부텍사스원유)', 'WTI Crude Oil Price',
  'global', 'commodity_energy', 'daily', '달러/배럴', 'US', 'api',
  '서부텍사스산 원유 현물가격. 미국 원유시장 기준가. 한국 수입물가에 직접적 영향', 'West Texas Intermediate crude oil spot price. US oil benchmark. Direct impact on Korean import prices.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_BRENT', 'Brent 유가 (브렌트원유)', 'Brent Crude Oil Price',
  'global', 'commodity_energy', 'daily', '달러/배럴', 'US', 'api',
  '북해산 브렌트 원유 현물가격. 아시아/유럽 원유 거래 기준가', 'Brent North Sea crude oil spot price. Global oil benchmark for Asia/Europe.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_GOLD', '금 현물가격', 'Gold Spot Price',
  'global', 'commodity_metal', 'daily', '달러/트로이온스', 'US', 'api',
  '런던 금 현물 가격 (LBMA 기준). 안전자산 수요, 인플레이션 헤지, 달러 강도의 역방향 지표', 'London gold spot price (LBMA). Safe-haven demand and inflation hedge. Inversely correlated with USD.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_SILVER', '은 현물가격', 'Silver Spot Price',
  'global', 'commodity_metal', 'daily', '달러/트로이온스', 'US', 'api',
  '은 현물가격. 산업재(태양광, 전기차)와 안전자산 이중 성격', 'Silver spot price. Dual nature as industrial metal (solar, EVs) and safe haven.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_COPPER', '구리 선물가격 (LME)', 'Copper Futures Price (LME)',
  'global', 'commodity_metal', 'daily', '달러/파운드', 'US', 'api',
  'LME 구리 선물가격. 글로벌 제조업 경기와 높은 선행성을 지님 (닥터 코퍼)', 'LME copper futures. Known as "Dr. Copper" for its high correlation with global manufacturing activity.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_NATGAS', '천연가스 선물가격 (Henry Hub)', 'Natural Gas Futures (Henry Hub)',
  'global', 'commodity_energy', 'daily', '달러/MMBtu', 'US', 'api',
  '미국 Henry Hub 천연가스 선물가격. LNG 수출과 연동', 'Henry Hub natural gas futures. Benchmark for LNG exports.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_DXY_GLOBAL', '달러 인덱스 (글로벌 참조)', 'US Dollar Index (Global Ref)',
  'global', 'dollar_index', 'daily', '지수', 'US', 'api',
  '글로벌 카테고리에서 달러 인덱스 참조용 (exchange 카테고리의 FRED_DXY와 동일 소스)', 'Dollar index reference in global category. Same underlying data as FRED_DXY in exchange category.'
),
(
  (SELECT id FROM indicator_sources WHERE source_code = 'FRED'),
  'FRED_SOX', '필라델피아 반도체 지수 (SOX)', 'Philadelphia Semiconductor Index (SOX)',
  'global', 'equity_index', 'daily', '포인트', 'US', 'api',
  '반도체 설계+제조+장비 30개사 지수 (NVIDIA, TSMC, ASML 포함). 한국 반도체주 방향성 가장 강한 선행지표', 'Index of 30 semiconductor companies. Strongest leading indicator for Korean semiconductor stocks.'
)

ON CONFLICT (source_id, indicator_code) DO UPDATE SET
  indicator_name_ko = EXCLUDED.indicator_name_ko,
  indicator_name_en = EXCLUDED.indicator_name_en,
  updated_at        = NOW();

-- =============================================================================
-- 결과 검증 및 요약
-- =============================================================================
DO $$
DECLARE
  v_total   INTEGER;
  v_economy INTEGER;
  v_price   INTEGER;
  v_money   INTEGER;
  v_rate    INTEGER;
  v_fx      INTEGER;
  v_sm      INTEGER;
  v_si      INTEGER;
  v_re      INTEGER;
  v_global  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total   FROM indicators;
  SELECT COUNT(*) INTO v_economy FROM indicators WHERE category = 'economy';
  SELECT COUNT(*) INTO v_price   FROM indicators WHERE category = 'price';
  SELECT COUNT(*) INTO v_money   FROM indicators WHERE category = 'money';
  SELECT COUNT(*) INTO v_rate    FROM indicators WHERE category = 'rate';
  SELECT COUNT(*) INTO v_fx      FROM indicators WHERE category = 'exchange';
  SELECT COUNT(*) INTO v_sm      FROM indicators WHERE category = 'stock_market';
  SELECT COUNT(*) INTO v_si      FROM indicators WHERE category = 'stock_individual';
  SELECT COUNT(*) INTO v_re      FROM indicators WHERE category = 'real_estate';
  SELECT COUNT(*) INTO v_global  FROM indicators WHERE category = 'global';

  RAISE NOTICE '✅ indicators 삽입 완료: 총 % 개 (목표: 128)', v_total;
  RAISE NOTICE '   economy: %개 (목표: 16)', v_economy;
  RAISE NOTICE '   price: %개 (목표: 11)', v_price;
  RAISE NOTICE '   money: %개 (목표: 12)', v_money;
  RAISE NOTICE '   rate: %개 (목표: 15)', v_rate;
  RAISE NOTICE '   exchange: %개 (목표: 8)', v_fx;
  RAISE NOTICE '   stock_market: %개 (목표: 18)', v_sm;
  RAISE NOTICE '   stock_individual: %개 (목표: 16)', v_si;
  RAISE NOTICE '   real_estate: %개 (목표: 16)', v_re;
  RAISE NOTICE '   global: %개 (목표: 16)', v_global;
END $$;

INSERT INTO schema_migrations (version, description)
VALUES ('003', 'Seed: indicators - 128 financial/economic/real-estate indicators across 9 categories')
ON CONFLICT (version) DO NOTHING;
