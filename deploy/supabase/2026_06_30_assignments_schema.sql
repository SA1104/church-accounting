-- 1. Create church_positions table
CREATE TABLE IF NOT EXISTS public.church_positions (
  position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  role_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_project_position_name UNIQUE (project_id, name)
);

-- 2. Create church_user_assignments table
CREATE TABLE IF NOT EXISTS public.church_user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  committee_id INTEGER NOT NULL,
  group_id INTEGER NULL,
  position_id UUID NOT NULL,
  role_code TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NULL,
  updated_by UUID NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE NULL,
  FOREIGN KEY (position_id) REFERENCES public.church_positions(position_id) ON DELETE CASCADE
);

-- Index to enforce a single active primary assignment per user/project
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_assignment_per_user_project
ON public.church_user_assignments(user_id, project_id)
WHERE is_primary = TRUE AND is_active = TRUE;

-- 3. Create church_signup_assignment_requests table
CREATE TABLE IF NOT EXISTS public.church_signup_assignment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL,
  committee_id INTEGER NOT NULL,
  group_id INTEGER NULL,
  position_id UUID NULL,
  requested_position_name TEXT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  approved_by UUID NULL
);
