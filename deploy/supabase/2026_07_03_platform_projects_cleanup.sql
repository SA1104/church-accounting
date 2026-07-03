-- =========================================================================
-- BOOZA THINK Platform 3.1 - Project-Centric Architecture Migration
-- Migration: 2026_07_03_platform_projects_cleanup.sql
-- Description: Removes legacy platform_workspaces and updates memberships to use project_id directly
-- =========================================================================

DO $$
BEGIN
    -- 1. Add project_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_memberships' AND column_name='project_id') THEN
        ALTER TABLE public.platform_memberships ADD COLUMN project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE;
    END IF;

    -- 2. Migrate data from platform_workspaces if it exists and workspace_id exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_workspaces') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_memberships' AND column_name='workspace_id') THEN
            UPDATE public.platform_memberships m
            SET project_id = w.project_id
            FROM public.platform_workspaces w
            WHERE m.workspace_id = w.workspace_id;
        END IF;
    END IF;

    -- 3. Update existing records with unique constraint dependencies before altering column to NOT NULL
    -- If some records couldn't be migrated, we might have to clean them up, but assuming safe environments.

    -- 4. Drop unique constraint involving workspace_id if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_workspace_capability') THEN
        ALTER TABLE public.platform_memberships DROP CONSTRAINT unique_user_workspace_capability;
    END IF;

    -- 5. Drop workspace_id column entirely (cascades constraint drops)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_memberships' AND column_name='workspace_id') THEN
        ALTER TABLE public.platform_memberships DROP COLUMN workspace_id CASCADE;
    END IF;

    -- 6. Add new unique constraint for project_id
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_project_capability') THEN
        ALTER TABLE public.platform_memberships ADD CONSTRAINT unique_user_project_capability UNIQUE (user_id, project_id, capability);
    END IF;

    -- 7. Drop legacy platform_workspaces table
    DROP TABLE IF EXISTS public.platform_workspaces CASCADE;

    -- 8. Clean up platform_notifications and decision_histories (if they had workspace_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_notifications' AND column_name='workspace_id') THEN
        ALTER TABLE public.platform_notifications RENAME COLUMN workspace_id TO project_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='decision_histories' AND column_name='workspace_id') THEN
        ALTER TABLE public.decision_histories RENAME COLUMN workspace_id TO project_id;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration encountered an issue: %', SQLERRM;
END $$;

-- 9. Create standard indexes for project_id
CREATE INDEX IF NOT EXISTS idx_platform_memberships_project ON public.platform_memberships(project_id);

-- Optional: Ensure project_id is NOT NULL if that's a hard requirement, 
-- but doing so inside PL/pgSQL safely requires checking for nulls first.
DO $$
BEGIN
    -- Delete orphaned memberships that have no project_id assigned
    DELETE FROM public.platform_memberships WHERE project_id IS NULL;
    
    -- Enforce NOT NULL
    ALTER TABLE public.platform_memberships ALTER COLUMN project_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set NOT NULL on project_id: %', SQLERRM;
END $$;
