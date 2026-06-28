-- =========================================================================
-- Booza Think Platform OS - Platform Registry & Decision History Restoration (2026-06-29)
-- Script Name: deploy/supabase/2026_06_29_restore_platform_registries.sql
-- Description: Idempotent SQL Script to restore platform_registries and
--              decision_histories tables, and verify their existence.
-- =========================================================================

-- 1. Create platform_registries table
CREATE TABLE IF NOT EXISTS public.platform_registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_type VARCHAR(50) NOT NULL, -- 'PRODUCT', 'ENGINE', 'PLUGIN', 'DATASET', 'API', 'VERSION', 'MIGRATION', 'BILLING', 'LICENSE'
  item_key VARCHAR(100) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  version VARCHAR(50) DEFAULT '1.0.0',
  owner VARCHAR(100) DEFAULT 'PLATFORM_ADMIN',
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (registry_type, item_key)
);

-- 2. Create decision_histories table
CREATE TABLE IF NOT EXISTS public.decision_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  service_id VARCHAR(50) NOT NULL,
  decision_score INTEGER NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  recommendation TEXT NOT NULL,
  alternative JSONB DEFAULT '[]'::jsonb,
  risk TEXT,
  opportunity TEXT,
  reason TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  expected_impact TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  action VARCHAR(100) NOT NULL,
  timeline VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Generated', -- 'Generated', 'Reviewed', 'Approved', 'Executed', 'Measured', 'Learned', 'Archived'
  outcome_measurement JSONB DEFAULT '{}'::jsonb,
  learned_deviation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes idempotently
CREATE INDEX IF NOT EXISTS idx_platform_registries_type ON public.platform_registries(registry_type);
CREATE INDEX IF NOT EXISTS idx_decision_histories_project ON public.decision_histories(project_id);
CREATE INDEX IF NOT EXISTS idx_decision_histories_status ON public.decision_histories(status);

-- 4. Verification queries
SELECT to_regclass('public.platform_registries') AS platform_registries;
SELECT to_regclass('public.decision_histories') AS decision_histories;
