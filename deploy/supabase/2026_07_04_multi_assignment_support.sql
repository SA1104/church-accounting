-- backend/core/db/migrations/2026_07_04_multi_assignment_support.sql
-- Enforce unique active assignment per user to prevent exact duplicates

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_assignment_per_user 
ON public.church_user_assignments(user_id, project_id, committee_id, COALESCE(group_id, -1), position_id, role_code) 
WHERE status = 'approved' AND is_active = TRUE;
