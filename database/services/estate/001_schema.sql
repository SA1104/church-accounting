-- =========================================================================
-- Booza Think Platform OS - Estate Think Schema (001_schema.sql)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.estate_properties (
  property_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  price NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
