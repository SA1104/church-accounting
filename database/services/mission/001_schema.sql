-- =========================================================================
-- Booza Think Platform OS - Mission Think Schema (001_schema.sql)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.mission_donations (
  donation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  donor_name VARCHAR(100) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  missionary_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
