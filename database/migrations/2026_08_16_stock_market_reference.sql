-- Migration: 2026_08_16_stock_market_reference
-- Description: Stock Think Market and Reference Data structures

CREATE TABLE IF NOT EXISTS stock_data_sources (
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

CREATE TABLE IF NOT EXISTS stock_markets (
    market_code VARCHAR(50) PRIMARY KEY,
    market_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    currency_code VARCHAR(10) NOT NULL,
    market_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stock_instruments (
    id SERIAL PRIMARY KEY,
    stock_code VARCHAR(50) NOT NULL,
    isin_code VARCHAR(50),
    corp_code VARCHAR(50),
    instrument_name VARCHAR(200) NOT NULL,
    instrument_name_en VARCHAR(200),
    primary_market_code VARCHAR(50) REFERENCES stock_markets(market_code),
    security_type VARCHAR(50) NOT NULL, -- e.g., COMMON, PREFERRED, ETF
    sector_code VARCHAR(50),
    industry_code VARCHAR(50),
    listing_date DATE,
    delisting_date DATE,
    listing_status VARCHAR(50) DEFAULT 'LISTED',
    currency_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    source_id INTEGER REFERENCES stock_data_sources(id),
    source_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stock_code, primary_market_code)
);

CREATE TABLE IF NOT EXISTS stock_instrument_venues (
    instrument_id INTEGER REFERENCES stock_instruments(id),
    venue_code VARCHAR(50) REFERENCES stock_markets(market_code),
    venue_symbol VARCHAR(50),
    is_trade_eligible BOOLEAN DEFAULT TRUE,
    eligible_from DATE,
    eligible_to DATE,
    source_id INTEGER REFERENCES stock_data_sources(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instrument_id, venue_code)
);

CREATE TABLE IF NOT EXISTS stock_trading_calendar (
    market_code VARCHAR(50) REFERENCES stock_markets(market_code),
    trade_date DATE NOT NULL,
    is_open BOOLEAN NOT NULL,
    calendar_status VARCHAR(50) NOT NULL, -- e.g., VERIFIED_OPEN, VERIFIED_CLOSED, CALENDAR_UNKNOWN
    open_at TIMESTAMPTZ,
    close_at TIMESTAMPTZ,
    special_session_note TEXT,
    source_id INTEGER REFERENCES stock_data_sources(id),
    verified_at TIMESTAMPTZ,
    PRIMARY KEY (market_code, trade_date)
);

CREATE TABLE IF NOT EXISTS stock_indices (
    index_code VARCHAR(50) PRIMARY KEY,
    index_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    market_code VARCHAR(50) REFERENCES stock_markets(market_code),
    currency_code VARCHAR(10),
    source_id INTEGER REFERENCES stock_data_sources(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS Policies Draft
ALTER TABLE stock_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_instrument_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_trading_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_indices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active data sources" ON stock_data_sources FOR SELECT USING (is_enabled = true);
CREATE POLICY "Public can view active markets" ON stock_markets FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active instruments" ON stock_instruments FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view venue mapping" ON stock_instrument_venues FOR SELECT USING (is_trade_eligible = true);
CREATE POLICY "Public can view trading calendar" ON stock_trading_calendar FOR SELECT USING (true);
CREATE POLICY "Public can view active indices" ON stock_indices FOR SELECT USING (is_active = true);
