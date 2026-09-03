BEGIN;

-- --- BEGIN FILE: database/migrations/2026_08_16_stock_market_reference.sql ---


-- Migration: 2026_08_16_stock_market_reference
-- Description: Stock Think Market and Reference Data structures

CREATE TABLE IF NOT EXISTS public.stock_data_sources (
    id SERIAL PRIMARY KEY,
    source_code VARCHAR(50) UNIQUE NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- e.g., EXCHANGE, PROVIDER, GOVERNMENT
    official_url TEXT,
    api_base_url TEXT,
    access_type VARCHAR(50) NOT NULL, -- e.g., OPEN_API, OFFICIAL_CRAWL, PAID_API
    delay_minutes INTEGER DEFAULT 0,
    requires_api_key BOOLEAN DEFAULT FALSE,
    license_status VARCHAR(50) DEFAULT 'UNKNOWN',
    redistribution_status VARCHAR(50) DEFAULT 'UNKNOWN',
    priority INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_markets (
    market_code VARCHAR(50) PRIMARY KEY,
    market_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    market_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.stock_instruments (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(50) NOT NULL,
    isin_code VARCHAR(50),
    corp_code VARCHAR(50),
    instrument_name VARCHAR(200) NOT NULL,
    instrument_name_en VARCHAR(200),
    primary_market_code VARCHAR(50) REFERENCES public.stock_markets(market_code),
    security_type VARCHAR(50) NOT NULL, -- e.g., COMMON, PREFERRED, ETF
    sector_code VARCHAR(50),
    industry_code VARCHAR(50),
    listing_date DATE,
    delisting_date DATE,
    listing_status VARCHAR(50) DEFAULT 'LISTED',
    currency_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    source_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stock_code, primary_market_code)
);

CREATE TABLE IF NOT EXISTS public.stock_instrument_venues (
    instrument_id INTEGER REFERENCES public.stock_instruments(id),
    venue_code VARCHAR(50) REFERENCES public.stock_markets(market_code),
    venue_symbol VARCHAR(50),
    is_trade_eligible BOOLEAN DEFAULT TRUE,
    eligible_from DATE,
    eligible_to DATE,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instrument_id, venue_code)
);

CREATE TABLE IF NOT EXISTS public.stock_trading_calendar (
    market_code VARCHAR(50) REFERENCES public.stock_markets(market_code),
    trade_date DATE NOT NULL,
    is_open BOOLEAN NOT NULL,
    calendar_status VARCHAR(50) NOT NULL, -- e.g., VERIFIED_OPEN, VERIFIED_CLOSED, CALENDAR_UNKNOWN
    open_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    special_session_note TEXT,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    verified_at TIMESTAMPTZ,
    PRIMARY KEY (market_code, trade_date)
);

CREATE TABLE IF NOT EXISTS public.stock_indices (
    index_code VARCHAR(50) PRIMARY KEY,
    index_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    market_code VARCHAR(50) REFERENCES public.stock_markets(market_code),
    currency_code VARCHAR(10),
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS Policies Draft
ALTER TABLE public.stock_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_instrument_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_trading_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_indices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_data_sources' AND policyname = 'Public can view active data sources'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active data sources" ON public.stock_data_sources FOR SELECT TO anon, authenticated USING (is_enabled = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_markets' AND policyname = 'Public can view active markets'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active markets" ON public.stock_markets FOR SELECT TO anon, authenticated USING (is_active = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_instruments' AND policyname = 'Public can view active instruments'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active instruments" ON public.stock_instruments FOR SELECT TO anon, authenticated USING (is_active = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_instrument_venues' AND policyname = 'Public can view venue mapping'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view venue mapping" ON public.stock_instrument_venues FOR SELECT TO anon, authenticated USING (is_trade_eligible = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_trading_calendar' AND policyname = 'Public can view trading calendar'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view trading calendar" ON public.stock_trading_calendar FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_indices' AND policyname = 'Public can view active indices'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active indices" ON public.stock_indices FOR SELECT TO anon, authenticated USING (is_active = true)';
  END IF;
END
$$;



-- --- END FILE: database/migrations/2026_08_16_stock_market_reference.sql ---

-- --- BEGIN FILE: database/migrations/2026_08_16_stock_market_observations.sql ---


-- Migration: 2026_08_16_stock_market_observations
-- Description: Stock Think Price, Volume, and Session Snapshots

CREATE TABLE IF NOT EXISTS public.stock_daily_bars (
    instrument_id INTEGER REFERENCES public.stock_instruments(id),
    venue_code VARCHAR(50) REFERENCES public.stock_markets(market_code),
    trade_date DATE NOT NULL,
    open_price NUMERIC(15, 4),
    high_price NUMERIC(15, 4),
    low_price NUMERIC(15, 4),
    close_price NUMERIC(15, 4),
    previous_close_price NUMERIC(15, 4),
    volume BIGINT,
    trading_value NUMERIC(20, 4),
    market_cap NUMERIC(25, 4),
    listed_shares BIGINT,
    is_final BOOLEAN DEFAULT FALSE,
    as_of_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    source_payload_hash VARCHAR(255),
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instrument_id, venue_code, trade_date),
    CONSTRAINT check_prices CHECK (
        (high_price >= open_price OR open_price IS NULL) AND
        (high_price >= close_price OR close_price IS NULL) AND
        (low_price <= open_price OR open_price IS NULL) AND
        (low_price <= close_price OR close_price IS NULL) AND
        (high_price >= low_price OR high_price IS NULL OR low_price IS NULL)
    ),
    CONSTRAINT check_volume CHECK (volume >= 0 OR volume IS NULL),
    CONSTRAINT check_trading_value CHECK (trading_value >= 0 OR trading_value IS NULL)
);

CREATE TABLE IF NOT EXISTS public.stock_session_snapshots (
    instrument_id INTEGER REFERENCES public.stock_instruments(id),
    venue_code VARCHAR(50) REFERENCES public.stock_markets(market_code),
    trade_date DATE NOT NULL,
    snapshot_type VARCHAR(50) NOT NULL,
    session_code VARCHAR(50),
    captured_at TIMESTAMPTZ NOT NULL,
    last_price NUMERIC(15, 4),
    krx_close_price NUMERIC(15, 4),
    change_from_krx_close NUMERIC(15, 4),
    change_rate_from_krx_close NUMERIC(10, 4),
    cumulative_volume BIGINT,
    cumulative_trading_value NUMERIC(20, 4),
    is_final BOOLEAN DEFAULT FALSE,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    ingestion_run_id VARCHAR(100),
    PRIMARY KEY (instrument_id, venue_code, trade_date, snapshot_type)
);

CREATE TABLE IF NOT EXISTS public.stock_index_daily_bars (
    index_code VARCHAR(50) REFERENCES public.stock_indices(index_code),
    trade_date DATE NOT NULL,
    open_value NUMERIC(15, 4),
    high_value NUMERIC(15, 4),
    low_value NUMERIC(15, 4),
    close_value NUMERIC(15, 4),
    previous_close_value NUMERIC(15, 4),
    volume BIGINT,
    change_value NUMERIC(15, 4),
    change_rate NUMERIC(10, 4),
    is_final BOOLEAN DEFAULT FALSE,
    as_of_at TIMESTAMPTZ,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (index_code, trade_date)
);

-- RLS Policies Draft
ALTER TABLE public.stock_daily_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_session_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_index_daily_bars ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_daily_bars' AND policyname = 'Public can view final daily bars'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view final daily bars" ON public.stock_daily_bars FOR SELECT TO anon, authenticated USING (is_final = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_session_snapshots' AND policyname = 'Public can view session snapshots'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view session snapshots" ON public.stock_session_snapshots FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_index_daily_bars' AND policyname = 'Public can view final index daily bars'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view final index daily bars" ON public.stock_index_daily_bars FOR SELECT TO anon, authenticated USING (is_final = true)';
  END IF;
END
$$;



-- --- END FILE: database/migrations/2026_08_16_stock_market_observations.sql ---

-- --- BEGIN FILE: database/migrations/2026_08_16_stock_macro_and_briefs.sql ---


-- Migration: 2026_08_16_stock_macro_and_briefs
-- Description: Stock Think Macroeconomic Series and Daily Briefs

CREATE TABLE IF NOT EXISTS public.stock_macro_series (
    id SERIAL PRIMARY KEY,
    series_code VARCHAR(50) UNIQUE NOT NULL,
    provider_series_code VARCHAR(100),
    series_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    country_code VARCHAR(10),
    frequency VARCHAR(50),
    unit VARCHAR(50),
    seasonal_adjustment VARCHAR(50),
    release_timezone VARCHAR(50),
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.stock_macro_observations (
    series_id INTEGER REFERENCES public.stock_macro_series(id),
    observation_date DATE NOT NULL,
    vintage_date DATE NOT NULL,
    value NUMERIC(20, 6),
    release_at TIMESTAMPTZ,
    is_preliminary BOOLEAN DEFAULT FALSE,
    is_revised BOOLEAN DEFAULT FALSE,
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (series_id, observation_date, vintage_date)
);

CREATE TABLE IF NOT EXISTS public.stock_source_documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL, -- e.g., NEWS, PRESS_RELEASE, DISCLOSURE
    title TEXT NOT NULL,
    publisher VARCHAR(100),
    source_url TEXT,
    published_at TIMESTAMPTZ,
    language_code VARCHAR(10),
    country_code VARCHAR(10),
    source_id INTEGER REFERENCES public.stock_data_sources(id),
    content_license_status VARCHAR(50),
    summary_allowed BOOLEAN DEFAULT TRUE,
    content_hash VARCHAR(255),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.stock_daily_briefs (
    id SERIAL PRIMARY KEY,
    brief_date DATE NOT NULL,
    brief_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT,
    market_session VARCHAR(50),
    as_of_at TIMESTAMPTZ,
    publication_status VARCHAR(50) DEFAULT 'DRAFT',
    generated_by VARCHAR(100),
    review_status VARCHAR(50) DEFAULT 'PENDING',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (brief_date, brief_type)
);

CREATE TABLE IF NOT EXISTS public.stock_daily_brief_items (
    id SERIAL PRIMARY KEY,
    brief_id INTEGER REFERENCES public.stock_daily_briefs(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    headline TEXT NOT NULL,
    body TEXT,
    evidence_type VARCHAR(50) NOT NULL,
    importance_level VARCHAR(50) DEFAULT 'MEDIUM',
    related_instrument_id INTEGER REFERENCES public.stock_instruments(id),
    related_index_code VARCHAR(50) REFERENCES public.stock_indices(index_code),
    related_macro_series_id INTEGER REFERENCES public.stock_macro_series(id),
    calculation_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_brief_item_sources (
    brief_item_id INTEGER REFERENCES public.stock_daily_brief_items(id) ON DELETE CASCADE,
    source_document_id INTEGER REFERENCES public.stock_source_documents(id) ON DELETE CASCADE,
    source_order INTEGER,
    support_type VARCHAR(50),
    PRIMARY KEY (brief_item_id, source_document_id)
);

-- RLS Policies Draft
ALTER TABLE public.stock_macro_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_macro_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_daily_brief_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_brief_item_sources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_macro_series' AND policyname = 'Public can view active macro series'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view active macro series" ON public.stock_macro_series FOR SELECT TO anon, authenticated USING (is_active = true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_macro_observations' AND policyname = 'Public can view macro observations'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view macro observations" ON public.stock_macro_observations FOR SELECT TO anon, authenticated USING (true)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_daily_briefs' AND policyname = 'Public can view published briefs'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view published briefs" ON public.stock_daily_briefs FOR SELECT TO anon, authenticated USING (publication_status = ''PUBLISHED'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stock_daily_brief_items' AND policyname = 'Public can view items of published briefs'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can view items of published briefs" ON public.stock_daily_brief_items FOR SELECT TO anon, authenticated USING (
        brief_id IN (SELECT id FROM public.stock_daily_briefs WHERE publication_status = ''PUBLISHED'')
    )';
  END IF;
END
$$;



-- --- END FILE: database/migrations/2026_08_16_stock_macro_and_briefs.sql ---

-- --- BEGIN FILE: database/migrations/2026_08_16_stock_ingestion_operations.sql ---


-- Migration: 2026_08_16_stock_ingestion_operations
-- Description: Stock Think Ingestion Operations and Data Quality

CREATE TABLE IF NOT EXISTS public.stock_ingestion_runs (
    id VARCHAR(100) PRIMARY KEY,
    provider_code VARCHAR(50) NOT NULL,
    job_code VARCHAR(50) NOT NULL,
    target_date DATE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL, -- PENDING, RUNNING, SUCCESS, PARTIAL_SUCCESS, FAILED, SKIPPED
    requested_count INTEGER DEFAULT 0,
    inserted_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    payload_hash VARCHAR(255),
    error_summary TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.stock_ingestion_errors (
    id SERIAL PRIMARY KEY,
    ingestion_run_id VARCHAR(100) REFERENCES public.stock_ingestion_runs(id) ON DELETE CASCADE,
    error_code VARCHAR(100),
    error_type VARCHAR(100),
    target_key VARCHAR(255),
    message TEXT,
    retryable BOOLEAN DEFAULT FALSE,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.stock_data_quality_issues (
    id SERIAL PRIMARY KEY,
    check_code VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- e.g., INSTRUMENT, DAILY_BAR, MACRO_OBSERVATION
    entity_key VARCHAR(255) NOT NULL,
    trade_date DATE,
    severity VARCHAR(50) NOT NULL, -- e.g., WARNING, ERROR, CRITICAL
    detected_value TEXT,
    expected_rule TEXT,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, RESOLVED, IGNORED
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    ingestion_run_id VARCHAR(100) REFERENCES public.stock_ingestion_runs(id)
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_stock_instruments_code ON public.stock_instruments(stock_code);
CREATE INDEX IF NOT EXISTS idx_stock_daily_bars_date ON public.stock_daily_bars(trade_date);
CREATE INDEX IF NOT EXISTS idx_stock_macro_obs_date ON public.stock_macro_observations(observation_date);
CREATE INDEX IF NOT EXISTS idx_stock_ingestion_runs_status ON public.stock_ingestion_runs(status);

-- RLS Policies Draft
ALTER TABLE public.stock_ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ingestion_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_data_quality_issues ENABLE ROW LEVEL SECURITY;

-- No public read access for ingestion operations
-- Admins and Service Roles only (Handled by Supabase Service Role Key)



-- --- END FILE: database/migrations/2026_08_16_stock_ingestion_operations.sql ---

COMMIT;

