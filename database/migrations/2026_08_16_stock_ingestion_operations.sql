BEGIN;

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

COMMIT;
