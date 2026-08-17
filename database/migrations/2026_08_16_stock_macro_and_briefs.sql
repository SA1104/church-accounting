BEGIN;

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

COMMIT;
