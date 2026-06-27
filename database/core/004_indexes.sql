-- =========================================================================
-- Booza Think Platform OS - Platform Core Indexes (004_indexes.sql)
-- =========================================================================

-- Core OS 성능 최적화를 위한 기초 인덱스 정의
CREATE INDEX IF NOT EXISTS idx_platform_profiles_username ON public.platform_profiles(username);
CREATE INDEX IF NOT EXISTS idx_platform_projects_service ON public.platform_projects(service_id);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_user_read ON public.platform_notifications(user_id, is_read);
