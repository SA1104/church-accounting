-- ============================================================
-- Data Think Engine - 수집 Job 시드 데이터
-- ============================================================

INSERT INTO data_collection_jobs
  (job_name, job_code, frequency, cron_expression, is_active, config_json)
SELECT v.job_name, v.job_code, v.frequency, v.cron_expression, v.is_active,
       v.config_json::JSONB
FROM (VALUES
  -- 한국은행 ECOS - 일별 (환율, 금리)
  ('ECOS 일별 지표 수집 (환율/금리)', 'ECOS_DAILY',
   'daily', '0 18 * * 1-5', true,
   '{"source": "ECOS", "indicators": ["KRW_USD","KRW_JPY","KRW_EUR","BOK_BASE_RATE","KTB_1Y","KTB_3Y","KTB_5Y","KTB_10Y","CORP_AA","CORP_BBB","CD_91D","CP_91D","CALL_RATE","YIELD_SPREAD"]}'),

  -- 한국은행 ECOS - 월별 (M1, M2, CPI, PPI 등)
  ('ECOS 월별 지표 수집 (통화/물가)', 'ECOS_MONTHLY',
   'monthly', '0 9 10 * *', true,
   '{"source": "ECOS", "indicators": ["M1","M2","LF","BASE_MONEY","BANK_DEPOSITS","BANK_LOANS","HOUSEHOLD_LOANS","MORTGAGE_LOANS","CORPORATE_LOANS","CREDIT_LOANS","MONEY_MULTIPLIER","LIQUIDITY_GROWTH","CPI","CORE_CPI","PPI","IMPORT_PRICE","EXPORT_PRICE","INFLATION_EXPECTATIONS","EXPORTS","IMPORTS","CURRENT_ACCOUNT","TRADE_BALANCE","COINCIDENT_INDEX","LEADING_INDEX","CONSUMER_SENTIMENT","BSI","FOREX_RESERVES","BANK_DEPOSIT_RATE","MORTGAGE_RATE","CREDIT_LOAN_RATE"]}'),

  -- 한국은행 ECOS - 분기별 (GDP)
  ('ECOS 분기별 지표 수집 (GDP/투자)', 'ECOS_QUARTERLY',
   'quarterly', '0 9 15 1,4,7,10 *', true,
   '{"source": "ECOS", "indicators": ["GDP","GDP_REAL_GROWTH","GDP_NOMINAL","PRIVATE_CONSUMPTION","EQUIPMENT_INVESTMENT","CONSTRUCTION_INVESTMENT"]}'),

  -- KOSIS 월별 (CPI, 고용, 인구 등)
  ('KOSIS 월별 지표 수집', 'KOSIS_MONTHLY',
   'monthly', '0 10 15 * *', true,
   '{"source": "KOSIS", "indicators": ["LIVING_PRICE_INDEX","EMPLOYMENT_RATE","UNEMPLOYMENT_RATE","LABOR_PARTICIPATION","INDUSTRIAL_PRODUCTION","RETAIL_SALES","CONSTRUCTION_ORDERS","MFG_PMI","SVC_PMI"]}'),

  -- KOSIS 연별 (인구, 세대수)
  ('KOSIS 연별 지표 수집', 'KOSIS_YEARLY',
   'yearly', '0 9 1 2 *', true,
   '{"source": "KOSIS", "indicators": ["POPULATION","HOUSEHOLDS"]}'),

  -- 한국부동산원 월별
  ('REB 월별 부동산 지표 수집', 'REB_MONTHLY',
   'monthly', '0 10 20 * *', true,
   '{"source": "REB", "indicators": ["APT_SALE_INDEX_NATIONAL","APT_RENT_INDEX_NATIONAL","HOUSE_SALE_INDEX_NATIONAL","HOUSE_RENT_INDEX_NATIONAL","APT_SALE_SEOUL","APT_RENT_SEOUL","APT_SALE_METRO","APT_RENT_METRO","APT_SALE_PROVINCE","APT_RENT_PROVINCE","APT_SALE_TRANSACTIONS","APT_LEASE_TRANSACTIONS","LAND_PRICE_CHANGE","MOVE_IN_SUPPLY"]}'),

  -- 국토교통부 실거래가 월별
  ('MOLIT 월별 실거래가 수집', 'MOLIT_MONTHLY',
   'monthly', '30 10 20 * *', true,
   '{"source": "MOLIT", "indicators": ["UNSOLD_UNITS","UNSOLD_AFTER_COMPLETION","HOUSING_PERMITS","HOUSING_STARTS","HOUSING_COMPLETIONS"]}'),

  -- 한국부동산원 분기별 (상업용)
  ('REB 분기별 상업용 부동산 수집', 'REB_QUARTERLY',
   'quarterly', '0 11 25 1,4,7,10 *', true,
   '{"source": "REB", "indicators": ["COMMERCIAL_RENT_INDEX"]}'),

  -- KRX 종목 목록 (매일 장전)
  ('KRX 종목 목록 수집', 'KRX_STOCK_LIST',
   'daily', '0 7 * * 1-5', true,
   '{"source": "KRX", "type": "stock_list", "markets": ["KOSPI","KOSDAQ"]}'),

  -- KRX 일봉 수집 (매일 장후)
  ('KRX 일봉 데이터 수집 (상위 100개)', 'KRX_DAILY_PRICE',
   'daily', '0 18 * * 1-5', true,
   '{"source": "KRX", "type": "daily_price", "top_n": 100, "rank_by": "market_cap"}'),

  -- KRX 시장 집계 지수 일별
  ('KRX 시장 지수 및 수급 수집', 'KRX_MARKET_INDEX',
   'daily', '30 18 * * 1-5', true,
   '{"source": "KRX", "indicators": ["KOSPI","KOSDAQ","KOSPI200","KOSPI_TRADING_VALUE","KOSDAQ_TRADING_VALUE","FOREIGN_NET_BUY","INSTITUTION_NET_BUY","INDIVIDUAL_NET_BUY","MARGIN_BALANCE","CUSTOMER_DEPOSITS","SHORT_SELLING_VALUE"]}'),

  -- DART 공시 수집 (장중 2시간마다)
  ('DART 공시 수집', 'DART_DAILY',
   'daily', '0 */2 9-18 * 1-5', true,
   '{"source": "DART", "days_back": 1, "doc_types": ["A001","A002","A003","B001","B002","C001","D001"]}'),

  -- FRED 글로벌 일별 (미국 지표)
  ('FRED 일별 글로벌 지표 수집', 'FRED_DAILY',
   'daily', '30 7 * * 1-5', true,
   '{"source": "FRED", "series_ids": ["FEDFUNDS","DGS2","DGS10","SP500","VIXCLS","DCOILWTICO","DTWEXBGS","T10Y2Y"]}'),

  -- FRED 월별 (미국 CPI, 실업)
  ('FRED 월별 글로벌 지표 수집', 'FRED_MONTHLY',
   'monthly', '0 8 5 * *', true,
   '{"source": "FRED", "series_ids": ["CPIAUCSL","UNRATE","UMCSENT"]}')

) AS v(job_name, job_code, frequency, cron_expression, is_active, config_json)
ON CONFLICT (job_code) DO UPDATE SET
  cron_expression = EXCLUDED.cron_expression,
  config_json = EXCLUDED.config_json::JSONB,
  updated_at = NOW();
