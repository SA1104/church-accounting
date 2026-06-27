-- =========================================================================
-- Booza Think Platform OS - Platform Core Permissions (003_permissions.sql)
-- =========================================================================

-- 일반 사용자의 호출 권한 회수 및 관리자/PostgreSQL 전용 권한 부여 (exec_sql)
REVOKE ALL ON FUNCTION public.exec_sql(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.exec_sql(text, jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.exec_sql(text, jsonb) TO service_role;
