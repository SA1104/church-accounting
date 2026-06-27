-- =========================================================================
-- Booza Think Platform OS - Church Think Operational Migration (2026-06-27)
-- =========================================================================

-- platform_role_assignments 테이블 마이그레이션 (service_id 추가 및 기본키 갱신)
DO $$
BEGIN
  -- 1. platform_role_assignments 테이블이 존재하는 경우에만 실행
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_role_assignments') THEN

    -- service_id 컬럼이 없으면 신규 생성
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_role_assignments' AND column_name='service_id') THEN
      ALTER TABLE public.platform_role_assignments ADD COLUMN service_id VARCHAR(50);
    END IF;

    -- service_id 외래키가 없으면 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_name='fk_platform_role_assignments_service_id') THEN
      ALTER TABLE public.platform_role_assignments 
      ADD CONSTRAINT fk_platform_role_assignments_service_id 
      FOREIGN KEY (service_id) REFERENCES public.platform_services(service_id) ON DELETE CASCADE;
    END IF;

    -- 기존의 (user_id, project_id, role_id) 삼중 복합 기본키 제약조건 제거 후 사중 복합키로 재편
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND table_name='platform_role_assignments' AND constraint_type='PRIMARY KEY') THEN
      ALTER TABLE public.platform_role_assignments DROP CONSTRAINT IF EXISTS platform_role_assignments_pkey;
    END IF;

    -- 기존 데이터의 service_id가 NULL인 경우 'church_think'로 마이그레이션
    UPDATE public.platform_role_assignments SET service_id = 'church_think' WHERE service_id IS NULL;
    
    -- service_id 컬럼에 NOT NULL 속성 부여
    ALTER TABLE public.platform_role_assignments ALTER COLUMN service_id SET NOT NULL;

    -- 새로운 복합 기본키 (user_id, service_id, project_id, role_id) 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_name='platform_role_assignments_pkey') THEN
      ALTER TABLE public.platform_role_assignments ADD PRIMARY KEY (user_id, service_id, project_id, role_id);
    END IF;

  END IF;
END $$;
