-- 1. Platform User Preferences Table
CREATE TABLE IF NOT EXISTS public.platform_user_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id VARCHAR(50) NOT NULL,
  preference_key VARCHAR(100) NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_platform_user_preference UNIQUE (user_id, service_id, preference_key)
);

-- 2. Sequence for Assignment Code
CREATE SEQUENCE IF NOT EXISTS public.church_assignment_code_seq START 1;

-- 3. Alter church_user_assignments
ALTER TABLE public.church_user_assignments
ADD COLUMN IF NOT EXISTS assignment_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS role_id VARCHAR(50) REFERENCES public.platform_roles(role_id) ON DELETE SET NULL;

-- 4. Set sequence for existing rows (Optional, but good for idempotent runs if needed in future)
-- Not generating codes for existing rows automatically here to keep migration lightweight, 
-- but ensuring the columns exist and are structurally sound.
