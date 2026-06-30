-- ============================================================
-- Data Think Engine - 데이터 출처 시드 데이터
-- ============================================================

INSERT INTO indicator_sources
  (source_code, source_name_ko, source_name_en, base_url, auth_type, api_key_required,
   provider, rate_limit_per_day, rate_limit_per_hour, notes)
VALUES
  ('ECOS',
   '한국은행 경제통계시스템',
   'Bank of Korea ECOS',
   'https://ecos.bok.or.kr/api',
   'api_key', true,
   '한국은행',
   1000, NULL,
   'API키 발급 필요(ecos.bok.or.kr 회원가입). 1일 1000건 제한. XML/JSON 지원. 통계표코드 기반 조회.'),

  ('KOSIS',
   '국가통계포털',
   'Korean Statistical Information Service',
   'https://kosis.kr/openapi',
   'api_key', true,
   '통계청',
   1000, NULL,
   'API키 발급 필요(kosis.kr 회원가입). JSON 지원. 통계목록/데이터 조회 분리.'),

  ('REB',
   '한국부동산원 부동산통계',
   'Korea Real Estate Board Statistics',
   'https://www.reb.or.kr/r-one',
   'api_key', true,
   '한국부동산원',
   1000, NULL,
   '공공데이터포털(data.go.kr) API키 사용. 주간/월간 주택가격동향 등 제공.'),

  ('MOLIT',
   '국토교통부 실거래가 공개시스템',
   'Ministry of Land Infrastructure and Transport - Real Transaction',
   'https://apis.data.go.kr/1613000',
   'api_key', true,
   '국토교통부',
   1000, NULL,
   '공공데이터포털 API키 사용. 아파트 실거래가 조회. 월별 데이터 제공.'),

  ('KRX',
   '한국거래소',
   'Korea Exchange',
   'http://data.krx.co.kr',
   'none', false,
   '한국거래소',
   NULL, NULL,
   '공개 데이터. 별도 오픈API 없음. HTTP 요청 방식으로 종목목록/일별시세 수집 가능. 크롤링 방식 주의.'),

  ('DART',
   '전자공시시스템',
   'Data Analysis Retrieval and Transfer System',
   'https://opendart.fss.or.kr/api',
   'api_key', true,
   '금융감독원',
   10000, NULL,
   'API키 발급 필요(opendart.fss.or.kr 회원가입). 1일 10000건. 기업검색/공시검색/재무제표 제공.'),

  ('FRED',
   'Federal Reserve Economic Data',
   'Federal Reserve Economic Data',
   'https://api.stlouisfed.org/fred',
   'api_key', true,
   'Federal Reserve Bank of St. Louis',
   120, NULL,
   'API키 발급 필요(fred.stlouisfed.org 회원가입). 1분 120건. JSON 지원. 미국 경제지표 및 글로벌 지표 제공.'),

  ('WORLDBANK',
   '세계은행 공개데이터',
   'World Bank Open Data',
   'https://api.worldbank.org/v2',
   'none', false,
   'World Bank',
   NULL, NULL,
   '인증 불필요. JSON/XML 지원. GDP, 인구 등 국가별 거시지표 제공.'),

  ('ALPHA_VANTAGE',
   'Alpha Vantage',
   'Alpha Vantage Financial Data API',
   'https://www.alphavantage.co/query',
   'api_key', true,
   'Alpha Vantage Inc.',
   25, NULL,
   'API키 발급 필요(alphavantage.co). 무료티어: 1일 25건, 1분 5건. 한국주식: 종목코드.KS 형식.'),

  ('YAHOO_FINANCE',
   'Yahoo Finance',
   'Yahoo Finance',
   'https://query1.finance.yahoo.com',
   'none', false,
   'Yahoo Inc.',
   NULL, NULL,
   '비공식 API. yfinance 라이브러리 또는 직접 HTTP 요청. 한국주식: 005930.KS 형식. 상업적 이용 주의.')

ON CONFLICT (source_code) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  notes = EXCLUDED.notes,
  updated_at = NOW();
