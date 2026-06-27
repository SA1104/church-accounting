-- =========================================================================
-- Booza Think Platform OS - Stock Think Schema (001_schema.sql)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.stock_watchlists (
  watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.stock_quotes (
  quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(20) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  current_price NUMERIC(15, 2) NOT NULL,
  change_percent NUMERIC(5, 2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
