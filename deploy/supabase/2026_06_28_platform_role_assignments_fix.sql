-- =========================================================================
-- Booza Think Platform OS - Platform Core Operational Migration (2026-06-28)
-- Script Name: deploy/supabase/2026_06_28_platform_role_assignments_fix.sql
-- Description: Safe, Idempotent Fix for platform_role_assignments schema
-- =========================================================================

-- 1. service_id 컬럼 추가 (존재하지 않을 경우)
ALTER TABLE public.platform_role_assignments ADD COLUMN IF NOT EXISTS service_id VARCHAR(50);

-- 2. 기존 NULL 값들을 기본값인 'church_think'로 업데이트
UPDATE public.platform_role_assignments SET service_id = 'church_think' WHERE service_id IS NULL;

-- 3. service_id 컬럼을 NOT NULL로 변경 및 PK 재생성
DO $$
BEGIN
  -- 기존 PRIMARY KEY 제약조건을 안전하게 교체
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='platform_role_assignments' AND constraint_type='PRIMARY KEY'
  ) THEN
    ALTER TABLE public.platform_role_assignments DROP CONSTRAINT IF EXISTS platform_role_assignments_pkey;
  END IF;

  -- 컬럼 제약조건 변경
  ALTER TABLE public.platform_role_assignments ALTER COLUMN service_id SET NOT NULL;

  -- 신규 복합 PRIMARY KEY 생성
  ALTER TABLE public.platform_role_assignments ADD CONSTRAINT platform_role_assignments_pkey PRIMARY KEY (user_id, service_id, project_id, role_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Primary key update skipped or already applied: %', SQLERRM;
END $$;

-- 4. service_id 외래키 연동
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='platform_role_assignments' AND constraint_name='fk_platform_role_assignments_service_id'
  ) THEN
    ALTER TABLE public.platform_role_assignments 
    ADD CONSTRAINT fk_platform_role_assignments_service_id 
    FOREIGN KEY (service_id) REFERENCES public.platform_services(service_id) ON DELETE CASCADE;
  END IF;
END $$;
