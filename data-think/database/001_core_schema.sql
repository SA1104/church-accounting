-- =============================================================================
-- Data Think Engine - Core Database Schema
-- Migration: 001_core_schema.sql
-- Description: Booza Think 플랫폼을 위한 한국 금융/경제 데이터 수집 핵심 스키마
-- Author: Data Think Engine
-- Created: 2026-06-30
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 확장 기능 활성화
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID 생성 지원
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- 텍스트 유사도 검색 지원

-- =============================================================================
-- 1. indicator_sources - 데이터 출처 관리
--    각 데이터 공급자(한국은행, KOSIS, KRX 등) 정보를 저장
-- =============================================================================
CREATE TABLE IF NOT EXISTS indicator_sources (
  id                  SERIAL PRIMARY KEY,
  source_code         VARCHAR(50)  UNIQUE NOT NULL,
  source_name_ko      VARCHAR(200) NOT NULL,
  source_name_en      VARCHAR(200) NOT NULL,
  base_url            TEXT,
  auth_type           VARCHAR(30)  DEFAULT 'api_key',
  api_key_required    BOOLEAN      DEFAULT true,
  provider            VARCHAR(100),
  terms_url           TEXT,
  rate_limit_per_day  INTEGER,
  rate_limit_per_hour INTEGER,
  is_active           BOOLEAN      DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE indicator_sources IS '데이터 출처 관리: 각 API/크롤링 소스의 메타데이터 및 접근 정보';
COMMENT ON COLUMN indicator_sources.auth_type IS '인증 방식: api_key(API 키), oauth(OAuth2), none(인증 불필요), scrape(웹 크롤링)';
COMMENT ON COLUMN indicator_sources.rate_limit_per_day IS '일별 API 요청 최대 횟수 (NULL이면 무제한)';

-- =============================================================================
-- 2. indicators - 지표 마스터 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS indicators (
  id                  SERIAL PRIMARY KEY,
  source_id           INTEGER      REFERENCES indicator_sources(id) ON DELETE SET NULL,
  indicator_code      VARCHAR(100) NOT NULL,
  indicator_name_ko   VARCHAR(300) NOT NULL,
  indicator_name_en   VARCHAR(300) NOT NULL,
  category            VARCHAR(100) NOT NULL,
  sub_category        VARCHAR(100),
  frequency           VARCHAR(20)  NOT NULL,
  unit                VARCHAR(50),
  country             VARCHAR(10)  DEFAULT 'KR',
  region              VARCHAR(100),
  currency            VARCHAR(10),
  api_endpoint        TEXT,
  api_params_json     JSONB,
  collection_method   VARCHAR(20)  DEFAULT 'api',
  is_active           BOOLEAN      DEFAULT true,
  description_ko      TEXT,
  description_en      TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(source_id, indicator_code)
);

COMMENT ON TABLE indicators IS '지표 마스터: 수집 대상 경제/금융/부동산 지표 전체 정의';
COMMENT ON COLUMN indicators.category IS '대분류: economy(경제), price(물가), money(통화), rate(금리), exchange(환율), stock_market(주식시장), stock_individual(종목), real_estate(부동산), global(글로벌)';
COMMENT ON COLUMN indicators.frequency IS '수집 주기: minute(분), daily(일), weekly(주), monthly(월), quarterly(분기), yearly(연)';

-- =============================================================================
-- 3. indicator_observations - 지표 관측값 (시계열 데이터)
-- =============================================================================
CREATE TABLE IF NOT EXISTS indicator_observations (
  id               BIGSERIAL    PRIMARY KEY,
  indicator_id     INTEGER      REFERENCES indicators(id) ON DELETE CASCADE,
  observed_at      TIMESTAMPTZ,
  period_date      DATE         NOT NULL,
  value            NUMERIC(20, 6),
  value_text       VARCHAR(500),
  unit             VARCHAR(50),
  region           VARCHAR(100),
  country          VARCHAR(10)  DEFAULT 'KR',
  revised_flag     BOOLEAN      DEFAULT false,
  raw_payload_json JSONB,
  collected_at     TIMESTAMPTZ  DEFAULT NOW(),
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(indicator_id, period_date, region)
);

COMMENT ON TABLE indicator_observations IS '지표 관측값: 수집된 경제/금융 지표의 시계열 데이터 (핵심 데이터 저장소)';
COMMENT ON COLUMN indicator_observations.period_date IS '데이터 기준일. 월별 지표는 해당 월 1일, 분기별은 분기 첫날로 정규화';
COMMENT ON COLUMN indicator_observations.revised_flag IS '수정발표 여부. 잠정치가 확정치로 수정될 때 true로 갱신';
COMMENT ON COLUMN indicator_observations.raw_payload_json IS 'API 원본 응답 JSON 전체 보존. 데이터 검증 및 재파싱에 활용';

-- =============================================================================
-- 4. securities - 종목 마스터 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS securities (
  id               SERIAL       PRIMARY KEY,
  market           VARCHAR(20)  NOT NULL,
  ticker           VARCHAR(20)  NOT NULL,
  isin             VARCHAR(20),
  stock_name_ko    VARCHAR(200),
  stock_name_en    VARCHAR(200),
  company_name_ko  VARCHAR(200),
  company_name_en  VARCHAR(200),
  sector           VARCHAR(100),
  industry         VARCHAR(100),
  country          VARCHAR(10)  DEFAULT 'KR',
  currency         VARCHAR(10)  DEFAULT 'KRW',
  listing_date     DATE,
  is_active        BOOLEAN      DEFAULT true,
  market_cap_rank  INTEGER,
  created_at       TIMESTAMPTZ  DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(market, ticker)
);

COMMENT ON TABLE securities IS '종목 마스터: KOSPI, KOSDAQ, 해외 주식 등 유가증권 기본 정보';
COMMENT ON COLUMN securities.isin IS 'KR로 시작하는 12자리 국제 증권 식별 번호. 종목 코드와 함께 고유 식별에 사용';

-- =============================================================================
-- 5. security_prices_daily - 종목 일봉 데이터
-- =============================================================================
CREATE TABLE IF NOT EXISTS security_prices_daily (
  id                    BIGSERIAL    PRIMARY KEY,
  security_id           INTEGER      REFERENCES securities(id) ON DELETE CASCADE,
  trade_date            DATE         NOT NULL,
  open                  NUMERIC(15, 2),
  high                  NUMERIC(15, 2),
  low                   NUMERIC(15, 2),
  close                 NUMERIC(15, 2),
  adjusted_close        NUMERIC(15, 2),
  volume                BIGINT,
  trading_value         BIGINT,
  market_cap            BIGINT,
  change_rate           NUMERIC(8, 4),
  foreign_holding_ratio NUMERIC(8, 4),
  institution_net_buy   BIGINT,
  foreign_net_buy       BIGINT,
  individual_net_buy    BIGINT,
  short_selling_volume  BIGINT,
  raw_payload_json      JSONB,
  collected_at          TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(security_id, trade_date)
);

COMMENT ON TABLE security_prices_daily IS '종목 일봉: 일별 OHLCV, 시가총액, 투자자별 매매동향, 공매도 데이터';
COMMENT ON COLUMN security_prices_daily.adjusted_close IS '배당, 액면분할, 유상증자 등을 반영한 수정 종가. 장기 수익률 계산에 사용';
COMMENT ON COLUMN security_prices_daily.institution_net_buy IS '기관 순매수 수량. 음수값은 순매도를 의미';

-- =============================================================================
-- 6. security_prices_intraday - 종목 분봉 데이터 (MVP 이후 구현)
-- =============================================================================
CREATE TABLE IF NOT EXISTS security_prices_intraday (
  id               BIGSERIAL    PRIMARY KEY,
  security_id      INTEGER      REFERENCES securities(id) ON DELETE CASCADE,
  trade_datetime   TIMESTAMPTZ  NOT NULL,
  interval_minutes INTEGER      DEFAULT 1,
  open             NUMERIC(15, 2),
  high             NUMERIC(15, 2),
  low              NUMERIC(15, 2),
  close            NUMERIC(15, 2),
  volume           BIGINT,
  trading_value    BIGINT,
  raw_payload_json JSONB,
  collected_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(security_id, trade_datetime, interval_minutes)
);

COMMENT ON TABLE security_prices_intraday IS '종목 분봉: 분 단위 OHLCV 데이터. MVP 이후 구현. 데이터 증가시 파티셔닝(trade_datetime 기준) 권장';
COMMENT ON COLUMN security_prices_intraday.interval_minutes IS '봉 단위(분): 1, 3, 5, 10, 30, 60 등';

-- =============================================================================
-- 7. security_fundamentals - 종목 재무 데이터
-- =============================================================================
CREATE TABLE IF NOT EXISTS security_fundamentals (
  id               SERIAL       PRIMARY KEY,
  security_id      INTEGER      REFERENCES securities(id) ON DELETE CASCADE,
  fiscal_year      INTEGER      NOT NULL,
  fiscal_quarter   INTEGER,
  report_date      DATE,
  revenue          BIGINT,
  operating_income BIGINT,
  net_income       BIGINT,
  total_assets     BIGINT,
  total_liabilities BIGINT,
  total_equity     BIGINT,
  eps              NUMERIC(12, 2),
  bps              NUMERIC(12, 2),
  per              NUMERIC(10, 2),
  pbr              NUMERIC(10, 4),
  roe              NUMERIC(8, 4),
  roa              NUMERIC(8, 4),
  debt_ratio       NUMERIC(8, 4),
  dividend_yield   NUMERIC(8, 4),
  raw_payload_json JSONB,
  collected_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(security_id, fiscal_year, fiscal_quarter)
);

COMMENT ON TABLE security_fundamentals IS '종목 재무: 분기/연간 재무제표 핵심 지표 (손익, 재무상태, 밸류에이션)';
COMMENT ON COLUMN security_fundamentals.fiscal_quarter IS '분기 구분: 1(1Q), 2(2Q), 3(3Q), 4(4Q), NULL(연간 누적)';

-- =============================================================================
-- 8. disclosures - 공시 데이터 (DART)
-- =============================================================================
CREATE TABLE IF NOT EXISTS disclosures (
  id               BIGSERIAL    PRIMARY KEY,
  security_id      INTEGER      REFERENCES securities(id) ON DELETE SET NULL,
  corp_code        VARCHAR(20),
  disclosure_id    VARCHAR(50)  UNIQUE,
  disclosed_at     TIMESTAMPTZ,
  title            TEXT,
  category         VARCHAR(100),
  url              TEXT,
  raw_text         TEXT,
  summary_ko       TEXT,
  summary_en       TEXT,
  sentiment        VARCHAR(20),
  impact_score     NUMERIC(4, 2),
  ai_tags_json     JSONB,
  raw_payload_json JSONB,
  collected_at     TIMESTAMPTZ  DEFAULT NOW(),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE disclosures IS '공시 데이터: DART 전자공시 원문 및 AI 감성분석/요약 결과';
COMMENT ON COLUMN disclosures.corp_code IS 'DART 기업 고유번호. 종목코드(ticker)와 다를 수 있음';
COMMENT ON COLUMN disclosures.impact_score IS 'AI 추정 주가 영향도: -2.0(매우 부정) ~ 0(중립) ~ +2.0(매우 긍정)';

-- =============================================================================
-- 9. news_items - 뉴스 데이터
-- =============================================================================
CREATE TABLE IF NOT EXISTS news_items (
  id                        BIGSERIAL    PRIMARY KEY,
  source                    VARCHAR(100),
  published_at              TIMESTAMPTZ,
  title                     TEXT         NOT NULL,
  url                       TEXT         UNIQUE,
  content                   TEXT,
  summary_ko                TEXT,
  summary_en                TEXT,
  related_security_ids_json JSONB,
  related_industries_json   JSONB,
  sentiment                 VARCHAR(20),
  impact_score              NUMERIC(4, 2),
  duplicate_group_id        UUID,
  raw_payload_json          JSONB,
  collected_at              TIMESTAMPTZ  DEFAULT NOW(),
  created_at                TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE news_items IS '뉴스 데이터: 금융/경제 뉴스 원문, AI 감성분석, 관련 종목 연결';
COMMENT ON COLUMN news_items.duplicate_group_id IS '동일 사안을 다룬 유사 기사를 같은 UUID로 묶어 중복 노출 방지';

-- =============================================================================
-- 10. data_collection_jobs - 수집 작업 정의
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_collection_jobs (
  id                  SERIAL       PRIMARY KEY,
  job_name            VARCHAR(200) UNIQUE NOT NULL,
  job_code            VARCHAR(100) UNIQUE NOT NULL,
  source_id           INTEGER      REFERENCES indicator_sources(id) ON DELETE SET NULL,
  frequency           VARCHAR(20)  NOT NULL,
  cron_expression     VARCHAR(50),
  is_active           BOOLEAN      DEFAULT true,
  status              VARCHAR(30)  DEFAULT 'idle',
  last_started_at     TIMESTAMPTZ,
  last_finished_at    TIMESTAMPTZ,
  last_success_at     TIMESTAMPTZ,
  error_count         INTEGER      DEFAULT 0,
  last_error_message  TEXT,
  next_run_at         TIMESTAMPTZ,
  config_json         JSONB,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE data_collection_jobs IS '수집 작업 정의: 스케줄러가 관리하는 수집 작업 목록, 상태, Cron 설정';
COMMENT ON COLUMN data_collection_jobs.status IS '작업 상태: idle(대기), running(실행중), success(성공), error(오류)';
COMMENT ON COLUMN data_collection_jobs.error_count IS '연속 오류 횟수. 임계값(예: 5회) 초과시 is_active를 false로 자동 전환 및 알람';

-- =============================================================================
-- 11. data_collection_logs - 수집 실행 이력
-- =============================================================================
CREATE TABLE IF NOT EXISTS data_collection_logs (
  id                  BIGSERIAL    PRIMARY KEY,
  job_id              INTEGER      REFERENCES data_collection_jobs(id) ON DELETE SET NULL,
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ,
  status              VARCHAR(20),
  rows_fetched        INTEGER      DEFAULT 0,
  rows_inserted       INTEGER      DEFAULT 0,
  rows_updated        INTEGER      DEFAULT 0,
  rows_failed         INTEGER      DEFAULT 0,
  error_message       TEXT,
  raw_response_sample JSONB,
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON TABLE data_collection_logs IS '수집 실행 이력: 매 수집 시도의 결과, 통계, 오류 정보 상세 기록';
COMMENT ON COLUMN data_collection_logs.status IS '수집 결과: success(전체 성공), partial(일부 성공), error(전체 실패)';

-- =============================================================================
-- 인덱스 생성 (조회 성능 최적화)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_indicator_obs_indicator_date
  ON indicator_observations(indicator_id, period_date DESC);

CREATE INDEX IF NOT EXISTS idx_indicator_obs_collected_at
  ON indicator_observations(collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_prices_daily_security_date
  ON security_prices_daily(security_id, trade_date DESC);

CREATE INDEX IF NOT EXISTS idx_prices_intraday_security_dt
  ON security_prices_intraday(security_id, trade_datetime DESC);

CREATE INDEX IF NOT EXISTS idx_disclosures_disclosed_at
  ON disclosures(disclosed_at DESC);

CREATE INDEX IF NOT EXISTS idx_disclosures_security_id
  ON disclosures(security_id, disclosed_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_published_at
  ON news_items(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_duplicate_group
  ON news_items(duplicate_group_id)
  WHERE duplicate_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collection_logs_job
  ON data_collection_logs(job_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_collection_logs_status
  ON data_collection_logs(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_indicators_category
  ON indicators(category, sub_category);

CREATE INDEX IF NOT EXISTS idx_securities_market_ticker
  ON securities(market, ticker);

CREATE INDEX IF NOT EXISTS idx_securities_sector
  ON securities(sector, market);

-- =============================================================================
-- updated_at 자동 갱신 트리거
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_indicator_sources_updated_at
  BEFORE UPDATE ON indicator_sources
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_indicators_updated_at
  BEFORE UPDATE ON indicators
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_securities_updated_at
  BEFORE UPDATE ON securities
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_data_collection_jobs_updated_at
  BEFORE UPDATE ON data_collection_jobs
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- =============================================================================
-- 스키마 버전 관리 테이블
-- =============================================================================
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(50)  PRIMARY KEY,
  description TEXT,
  applied_at  TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES (
  '001',
  'Core schema: indicator_sources, indicators, indicator_observations, securities, security_prices_daily, security_prices_intraday, security_fundamentals, disclosures, news_items, data_collection_jobs, data_collection_logs'
) ON CONFLICT (version) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001_core_schema.sql applied successfully.';
  RAISE NOTICE '   Tables: 11 core tables + schema_migrations';
  RAISE NOTICE '   Indexes: 13 performance indexes';
  RAISE NOTICE '   Triggers: updated_at auto-update on 4 tables';
END $$;
