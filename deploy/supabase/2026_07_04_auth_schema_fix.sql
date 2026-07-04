-- =========================================================================
-- BOOZA THINK Platform 3.1 - Auth Schema Fixes
-- Migration: 2026_07_04_auth_schema_fix.sql
-- Description: Fixes auth-related schema mismatches (status column in assignments, project_id in role_assignments)
-- =========================================================================

DO $
BEGIN
    -- 1. Add status column to church_user_assignments if missing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='church_user_assignments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_user_assignments' AND column_name='status') THEN
            ALTER TABLE public.church_user_assignments ADD COLUMN status VARCHAR(20) DEFAULT 'approved';
            
            -- Set existing active records to 'approved' if they are primary (or all active)
            UPDATE public.church_user_assignments SET status = 'approved' WHERE is_active = TRUE;
        END IF;
    END IF;

    -- 2. Ensure platform_role_assignments uses project_id instead of workspace_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_role_assignments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_role_assignments' AND column_name='workspace_id') THEN
            
            -- Drop primary key if it depends on workspace_id
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_schema='public' AND table_name='platform_role_assignments' AND constraint_type='PRIMARY KEY'
            ) THEN
                ALTER TABLE public.platform_role_assignments DROP CONSTRAINT IF EXISTS platform_role_assignments_pkey CASCADE;
            END IF;

            -- Rename the column
            ALTER TABLE public.platform_role_assignments RENAME COLUMN workspace_id TO project_id;

            -- Optionally recreate primary key with project_id
            -- NOTE: Make sure service_id exists because 2026_06_28 script added it.
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_role_assignments' AND column_name='service_id') THEN
                ALTER TABLE public.platform_role_assignments ADD CONSTRAINT platform_role_assignments_pkey PRIMARY KEY (user_id, service_id, project_id, role_id);
            END IF;
        END IF;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration encountered an issue: %', SQLERRM;
END $;

