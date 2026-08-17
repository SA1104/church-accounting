-- Migration: 2026_08_16_stock_macro_and_briefs
-- Description: Stock Think Macroeconomic Series and Daily Briefs

CREATE TABLE IF NOT EXISTS stock_macro_series (
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
    source_id INTEGER REFERENCES stock_data_sources(id),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS stock_macro_observations (
    series_id INTEGER REFERENCES stock_macro_series(id),
    observation_date DATE NOT NULL,
    vintage_date DATE NOT NULL,
    value NUMERIC(20, 6),
    release_at TIMESTAMPTZ,
    is_preliminary BOOLEAN DEFAULT FALSE,
    is_revised BOOLEAN DEFAULT FALSE,
    source_id INTEGER REFERENCES stock_data_sources(id),
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (series_id, observation_date, vintage_date)
);

CREATE TABLE IF NOT EXISTS stock_source_documents (
    id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL, -- e.g., NEWS, PRESS_RELEASE, DISCLOSURE
    title TEXT NOT NULL,
    publisher VARCHAR(100),
    source_url TEXT,
    published_at TIMESTAMPTZ,
    language_code VARCHAR(10),
    country_code VARCHAR(10),
    source_id INTEGER REFERENCES stock_data_sources(id),
    content_license_status VARCHAR(50),
    summary_allowed BOOLEAN DEFAULT TRUE,
    content_hash VARCHAR(255),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS stock_daily_briefs (
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

CREATE TABLE IF NOT EXISTS stock_daily_brief_items (
    id SERIAL PRIMARY KEY,
    brief_id INTEGER REFERENCES stock_daily_briefs(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    headline TEXT NOT NULL,
    body TEXT,
    evidence_type VARCHAR(50) NOT NULL,
    importance_level VARCHAR(50) DEFAULT 'MEDIUM',
    related_instrument_id INTEGER REFERENCES stock_instruments(id),
    related_index_code VARCHAR(50) REFERENCES stock_indices(index_code),
    related_macro_series_id INTEGER REFERENCES stock_macro_series(id),
    calculation_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_brief_item_sources (
    brief_item_id INTEGER REFERENCES stock_daily_brief_items(id) ON DELETE CASCADE,
    source_document_id INTEGER REFERENCES stock_source_documents(id) ON DELETE CASCADE,
    source_order INTEGER,
    support_type VARCHAR(50),
    PRIMARY KEY (brief_item_id, source_document_id)
);

-- RLS Policies Draft
ALTER TABLE stock_macro_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_macro_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_daily_brief_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_brief_item_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active macro series" ON stock_macro_series FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view macro observations" ON stock_macro_observations FOR SELECT USING (true);
CREATE POLICY "Public can view published briefs" ON stock_daily_briefs FOR SELECT USING (publication_status = 'PUBLISHED');
CREATE POLICY "Public can view items of published briefs" ON stock_daily_brief_items FOR SELECT USING (
    brief_id IN (SELECT id FROM stock_daily_briefs WHERE publication_status = 'PUBLISHED')
);
