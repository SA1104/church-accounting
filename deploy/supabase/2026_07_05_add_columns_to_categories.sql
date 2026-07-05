-- database/migrations/2026_07_05_add_columns_to_categories.sql
-- Idempotent migration to add audit, order, and system flags to church_account_categories

ALTER TABLE IF EXISTS public.church_account_categories
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL;
