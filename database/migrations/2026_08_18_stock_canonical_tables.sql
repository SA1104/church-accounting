BEGIN;

-- Drop venue_code from stock_daily_bars since we only track one official price per instrument per date
ALTER TABLE public.stock_daily_bars DROP CONSTRAINT IF EXISTS stock_daily_bars_pkey CASCADE;
ALTER TABLE public.stock_daily_bars DROP COLUMN IF EXISTS venue_code;
ALTER TABLE public.stock_daily_bars ADD COLUMN IF NOT EXISTS change_amount NUMERIC(15, 4);
ALTER TABLE public.stock_daily_bars ADD COLUMN IF NOT EXISTS change_rate NUMERIC(10, 4);
ALTER TABLE public.stock_daily_bars ADD COLUMN IF NOT EXISTS adjusted_close NUMERIC(15, 4);
ALTER TABLE public.stock_daily_bars ADD COLUMN IF NOT EXISTS adjustment_status VARCHAR(50);
ALTER TABLE public.stock_daily_bars ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraints back
DO $$ BEGIN
    ALTER TABLE public.stock_daily_bars ADD PRIMARY KEY (instrument_id, trade_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS idx_stock_daily_bars_desc ON public.stock_daily_bars(instrument_id, trade_date DESC);

-- Rename stock_index_daily_bars to stock_index_daily? No, let's just extend stock_index_daily_bars
ALTER TABLE public.stock_index_daily_bars DROP CONSTRAINT IF EXISTS stock_index_daily_bars_pkey CASCADE;
ALTER TABLE public.stock_index_daily_bars ADD COLUMN IF NOT EXISTS change_amount NUMERIC(15, 4);
ALTER TABLE public.stock_index_daily_bars ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.stock_index_daily_bars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
    ALTER TABLE public.stock_index_daily_bars ADD PRIMARY KEY (index_code, trade_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend stock_ingestion_runs
ALTER TABLE public.stock_ingestion_runs ADD COLUMN IF NOT EXISTS requested_dates INT DEFAULT 0;
ALTER TABLE public.stock_ingestion_runs ADD COLUMN IF NOT EXISTS successful_dates INT DEFAULT 0;
ALTER TABLE public.stock_ingestion_runs ADD COLUMN IF NOT EXISTS empty_dates INT DEFAULT 0;
ALTER TABLE public.stock_ingestion_runs ADD COLUMN IF NOT EXISTS failed_dates INT DEFAULT 0;
ALTER TABLE public.stock_ingestion_runs ADD COLUMN IF NOT EXISTS api_call_count INT DEFAULT 0;
ALTER TABLE public.stock_ingestion_runs ADD COLUMN IF NOT EXISTS checkpoint_date DATE;

-- Create stock_unmatched_history_summary
CREATE TABLE IF NOT EXISTS public.stock_unmatched_history_summary (
    market_code VARCHAR(50),
    stock_code VARCHAR(50),
    first_seen_date DATE,
    last_seen_date DATE,
    seen_count INT DEFAULT 0,
    unmatched_reason VARCHAR(255),
    PRIMARY KEY (market_code, stock_code)
);

COMMIT;
