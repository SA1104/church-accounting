-- =========================================================================
-- Booza Think Platform OS - Phase 7 Decision Core Schema Extension (2026-06-29)
-- Script Name: deploy/supabase/2026_06_29_phase7_decision_core.sql
-- Description: Idempotently alters decision_histories to include standard core fields.
-- =========================================================================

-- 1. Add standard workspace and capability columns
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(50);
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS capability_id VARCHAR(50);
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS decision_type VARCHAR(50);

-- 2. Add description and recommendation columns
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add confidence and risk columns
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'MEDIUM';

-- 4. Add structured JSONB columns for standard objects
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS evidence_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS related_objects_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS feedback_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS history_json JSONB DEFAULT '[]'::jsonb;

-- 5. Add lifecycle and user attribution columns
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS owner_user_id UUID;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS measured_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.decision_histories ADD COLUMN IF NOT EXISTS learning_score INTEGER DEFAULT 0;

-- 6. Verification query
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'decision_histories' AND table_schema = 'public';
