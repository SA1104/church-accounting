BEGIN;

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

COMMIT;
