-- =============================================================================
-- Data Think Engine - 데이터 출처 시드 데이터
-- Migration: 002_indicator_sources_seed.sql
-- Description: 수집 대상 데이터 소스 초기 데이터 삽입
-- Author: Data Think Engine
-- Created: 2026-06-30
-- =============================================================================
-- 참고: ON CONFLICT DO UPDATE 패턴으로 멱등성(idempotency) 보장
--       동일 source_code로 재실행해도 안전하게 갱신됨
-- =============================================================================

INSERT INTO indicator_sources (
  source_code, source_name_ko, source_name_en,
  base_url, auth_type, api_key_required,
  provider, rate_limit_per_day, rate_limit_per_hour, notes
) VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- 국내 공공 API
-- ─────────────────────────────────────────────────────────────────────────────
(
  'ECOS',
  '한국은행 경제통계시스템',
  'Bank of Korea ECOS',
  'https://ecos.bok.or.kr/api',
  'api_key', true,
  '한국은행',
  1000, NULL,
  '한국은행 ECOS API. 경제/금융 통계 1만여개 수록. API키 발급: https://ecos.bok.or.kr → 개발자 센터. 1일 1,000건 제한 (유료 플랜 없음)'
),
(
  'KOSIS',
  '국가통계포털',
  'Korean Statistical Information Service',
  'https://kosis.kr/openapi',
  'api_key', true,
  '통계청',
  1000, NULL,
  '통계청 KOSIS 오픈 API. 국내 90여 기관 통계 수록. API키 발급: https://kosis.kr → 마이페이지 → 오픈API → 인증키 신청. 1일 1,000건'
),
(
  'REB',
  '한국부동산원',
  'Korea Real Estate Board',
  'https://www.reb.or.kr/r-one',
  'api_key', true,
  '한국부동산원',
  1000, NULL,
  '한국부동산원 R-ONE API. 매매/전세 가격지수 수록. 공공데이터포털(data.go.kr) API키 사용. 주간/월간 데이터 제공'
),
(
  'MOLIT',
  '국토교통부 실거래가',
  'Ministry of Land Infrastructure and Transport',
  'https://apis.data.go.kr/1613000',
  'api_key', true,
  '국토교통부',
  1000, NULL,
  '공공데이터포털 국토교통부 실거래가 API. 아파트/오피스텔/단독주택 매매 및 전월세 실거래가. data.go.kr에서 동일 키 사용'
),
(
  'KRX',
  '한국거래소',
  'Korea Exchange',
  'http://data.krx.co.kr',
  'none', false,
  '한국거래소',
  NULL, NULL,
  'KRX 정보데이터시스템. 상장종목 정보, 일별시세, 투자자별매매동향 등 공개. 별도 인증 없이 HTTP 크롤링 방식 수집. User-Agent 설정 필요'
),
(
  'DART',
  '전자공시시스템',
  'Data Analysis Retrieval and Transfer System',
  'https://opendart.fss.or.kr/api',
  'api_key', true,
  '금융감독원',
  10000, NULL,
  '금감원 DART 전자공시 오픈 API. 상장사 공시 원문, 재무제표 수록. API키 발급: https://opendart.fss.or.kr → 개발자 센터 → API 신청. 1일 10,000건'
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 글로벌 API
-- ─────────────────────────────────────────────────────────────────────────────
(
  'FRED',
  'Federal Reserve Economic Data',
  'Federal Reserve Economic Data',
  'https://api.stlouisfed.org/fred',
  'api_key', true,
  'Federal Reserve Bank of St. Louis',
  NULL, 120,
  '세인트루이스 연준 FRED API. 미국 및 글로벌 거시경제 지표 수십만 개 수록. 1분당 120건 제한. API키 발급: https://fred.stlouisfed.org/docs/api/api_key.html'
),
(
  'WORLDBANK',
  '세계은행',
  'World Bank Open Data',
  'https://api.worldbank.org/v2',
  'none', false,
  'World Bank',
  NULL, NULL,
  '세계은행 오픈데이터 API. 국가별 GDP, 인구, 물가 등 매크로 지표 수록. 인증 불필요. JSON 포맷 지원. 분기/연간 업데이트'
),
(
  'ALPHA_VANTAGE',
  'Alpha Vantage',
  'Alpha Vantage',
  'https://www.alphavantage.co/query',
  'api_key', true,
  'Alpha Vantage Inc.',
  25, NULL,
  'Alpha Vantage API. 미국 주식 일봉/분봉, 환율, 원자재 가격 수록. 무료 티어: 1일 25건, 1분당 5건. 유료 플랜 시 제한 완화. API키: https://www.alphavantage.co/support/#api-key'
),
(
  'YAHOO_FINANCE',
  'Yahoo Finance',
  'Yahoo Finance',
  'https://query1.finance.yahoo.com',
  'none', false,
  'Yahoo Inc.',
  NULL, NULL,
  '비공식 Yahoo Finance API. 글로벌 주가, ETF, 환율, 원자재 등 광범위한 데이터 접근 가능. 서비스 약관상 상업적 이용 제한. 요청 빈도 주의 (IP 차단 위험). 백업 소스로만 활용 권장'
)

ON CONFLICT (source_code) DO UPDATE SET
  source_name_ko      = EXCLUDED.source_name_ko,
  source_name_en      = EXCLUDED.source_name_en,
  base_url            = EXCLUDED.base_url,
  auth_type           = EXCLUDED.auth_type,
  api_key_required    = EXCLUDED.api_key_required,
  provider            = EXCLUDED.provider,
  rate_limit_per_day  = EXCLUDED.rate_limit_per_day,
  rate_limit_per_hour = EXCLUDED.rate_limit_per_hour,
  notes               = EXCLUDED.notes,
  updated_at          = NOW();

-- 삽입 결과 확인
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM indicator_sources;
  RAISE NOTICE '✅ indicator_sources: % rows total', v_count;
END $$;

-- 스키마 버전 기록
INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Seed: indicator_sources - 10 data sources (ECOS, KOSIS, REB, MOLIT, KRX, DART, FRED, WorldBank, AlphaVantage, Yahoo Finance)')
ON CONFLICT (version) DO NOTHING;
