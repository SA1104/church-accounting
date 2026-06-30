-- =========================================================================
-- BOOZA THINK Platform 3.1 - Membership Architecture
-- Migration: 2026_07_01_platform_memberships.sql
-- =========================================================================

-- 1. platform_memberships: User -> Workspace 1:N Membership
CREATE TABLE IF NOT EXISTS public.platform_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.platform_workspaces(workspace_id) ON DELETE CASCADE,
  capability VARCHAR(50) NOT NULL, -- 'church', 'stock', 'estate', 'mission'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  CONSTRAINT unique_user_workspace_capability UNIQUE (user_id, workspace_id, capability)
);

CREATE INDEX IF NOT EXISTS idx_platform_memberships_user ON public.platform_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_memberships_workspace ON public.platform_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_platform_memberships_status ON public.platform_memberships(status);

-- 2. Add status column to church_user_assignments if not exists
ALTER TABLE public.church_user_assignments
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 3. Set existing assignments to approved
UPDATE public.church_user_assignments SET status = 'approved' WHERE status IS NULL OR status = 'pending';
