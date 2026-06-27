-- =========================================================================
-- Booza Think Platform OS - Platform Core Operational Migration (2026-06-27)
-- =========================================================================

-- platform_project_members 테이블 마이그레이션 (role -> role_id 및 FK 연동)
DO $$
BEGIN
  -- 1. platform_project_members 테이블이 존재하는 경우에만 실행
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_project_members') THEN
    
    -- 만약 구버전 컬럼 'role'이 존재하고 신버전 컬럼 'role_id'가 없는 경우 컬럼명 변경
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_project_members' AND column_name='role') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_project_members' AND column_name='role_id') THEN
      ALTER TABLE public.platform_project_members RENAME COLUMN role TO role_id;
    END IF;

    -- 만약 'role_id' 컬럼 자체가 없다면 신규 생성
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_project_members' AND column_name='role_id') THEN
      ALTER TABLE public.platform_project_members ADD COLUMN role_id VARCHAR(50);
    END IF;

    -- 외래키 제약조건이 없는 경우 추가 연동
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_name='fk_platform_project_members_role_id') THEN
      ALTER TABLE public.platform_project_members 
      ADD CONSTRAINT fk_platform_project_members_role_id 
      FOREIGN KEY (role_id) REFERENCES public.platform_roles(role_id) ON DELETE SET NULL;
    END IF;

  END IF;
END $$;


-- platform_audit_logs 테이블 마이그레이션 (service_id 추가 및 외래키 연동)
DO $$
BEGIN
  -- 2. platform_audit_logs 테이블이 존재하는 경우에만 실행
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_audit_logs') THEN

    -- service_id 컬럼이 없으면 신규 생성
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_audit_logs' AND column_name='service_id') THEN
      ALTER TABLE public.platform_audit_logs ADD COLUMN service_id VARCHAR(50);
    END IF;

    -- 외래키 연동이 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_name='fk_platform_audit_logs_service_id') THEN
      ALTER TABLE public.platform_audit_logs 
      ADD CONSTRAINT fk_platform_audit_logs_service_id 
      FOREIGN KEY (service_id) REFERENCES public.platform_services(service_id) ON DELETE SET NULL;
    END IF;

  END IF;
END $$;
