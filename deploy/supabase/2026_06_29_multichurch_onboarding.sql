-- =========================================================================
-- Booza Think Platform OS - Multi-Church Onboarding Schema & Seeds (2026-06-29)
-- Script Name: deploy/supabase/2026_06_29_multichurch_onboarding.sql
-- Description: Idempotent Migration Script for Multi-Church Autocomplete,
--              Cascading Organization Selection, and admin controls.
-- =========================================================================

-- 1. church_profiles 테이블 스키마 확장
-- 기존 테이블 및 컬럼 존재 여부 확인 후 안전하게 추가
DO $$
BEGIN
  -- 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='address') THEN
    ALTER TABLE public.church_profiles ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='phone') THEN
    ALTER TABLE public.church_profiles ADD COLUMN phone VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='email') THEN
    ALTER TABLE public.church_profiles ADD COLUMN email VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='homepage_url') THEN
    ALTER TABLE public.church_profiles ADD COLUMN homepage_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='status') THEN
    ALTER TABLE public.church_profiles ADD COLUMN status VARCHAR(30) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='created_by') THEN
    ALTER TABLE public.church_profiles ADD COLUMN created_by UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='approved_by') THEN
    ALTER TABLE public.church_profiles ADD COLUMN approved_by UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='approved_at') THEN
    ALTER TABLE public.church_profiles ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- 전국 교회 디렉토리 연동용 컬럼
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='external_source') THEN
    ALTER TABLE public.church_profiles ADD COLUMN external_source VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='external_id') THEN
    ALTER TABLE public.church_profiles ADD COLUMN external_id VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_profiles' AND column_name='data_verified_at') THEN
    ALTER TABLE public.church_profiles ADD COLUMN data_verified_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;


-- 2. platform_profiles 테이블 가입 상태 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='platform_profiles' AND column_name='signup_status') THEN
    ALTER TABLE public.platform_profiles ADD COLUMN signup_status VARCHAR(50) DEFAULT 'pending_approval';
  END IF;
END $$;


-- 3. 신길교회 프로필 Seed 데이터 탑재 (c3b9b47e-8c38-4b14-8c88-29ef31d563a6)
-- 기존 프로젝트 8a510c4f-c006-4442-8924-f3c75ab73cf6 와 온보딩 연동
INSERT INTO public.church_profiles (
  church_id, 
  project_id, 
  church_name, 
  denomination, 
  region, 
  address,
  phone,
  email,
  homepage_url,
  status
)
VALUES (
  'c3b9b47e-8c38-4b14-8c88-29ef31d563a6',
  '8a510c4f-c006-4442-8924-f3c75ab73cf6',
  '신길교회',
  '기독교대한성결교회',
  '서울특별시 영등포구',
  '서울특별시 영등포구 영등포로67길 9',
  '02-831-3456',
  'singil@singil.org',
  'http://www.singil.org',
  'active'
)
ON CONFLICT (church_id) DO UPDATE 
SET project_id = EXCLUDED.project_id,
    church_name = EXCLUDED.church_name,
    denomination = EXCLUDED.denomination,
    region = EXCLUDED.region,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    homepage_url = EXCLUDED.homepage_url,
    status = EXCLUDED.status;


-- 4. church_departments 테이블 구조 보완 및 기존 데이터 백필
DO $$
BEGIN
  -- 1. church_profile_id 컬럼 추가 (NULL 허용으로 먼저 추가하여 기존 데이터 깨짐 방지)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_departments' AND column_name='church_profile_id') THEN
    ALTER TABLE public.church_departments ADD COLUMN church_profile_id UUID;
  END IF;
END $$;

-- 2. 기존 부서 레코드에 대해 신길교회 프로필 ID로 백필 처리 (지시사항 2번 반영)
UPDATE public.church_departments
SET church_profile_id = 'c3b9b47e-8c38-4b14-8c88-29ef31d563a6'
WHERE church_profile_id IS NULL;

-- 3. 외래키 제약조건 안전하게 설정
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='church_departments' AND constraint_name='fk_church_departments_church_profile_id'
  ) THEN
    ALTER TABLE public.church_departments 
    ADD CONSTRAINT fk_church_departments_church_profile_id 
    FOREIGN KEY (church_profile_id) REFERENCES public.church_profiles(church_id) ON DELETE CASCADE;
  END IF;
END $$;


-- 5. 신규 위원회 부서 Seed 데이터 추가
INSERT INTO public.church_departments (department_id, project_id, parent_id, name, description, church_profile_id) VALUES
  (11, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '예배위원회', '예배 기획, 안내, 성가대 및 방송 운영', 'c3b9b47e-8c38-4b14-8c88-29ef31d563a6'),
  (12, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '재정위원회', '교회 예산 편성, 지출 회계 및 감사 업무 통괄', 'c3b9b47e-8c38-4b14-8c88-29ef31d563a6'),
  (13, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '관리위원회', '교회 성전 시설물 화재 및 안전 관리 보수', 'c3b9b47e-8c38-4b14-8c88-29ef31d563a6')
ON CONFLICT (department_id) DO NOTHING;

-- 시리얼 시퀀스 동기화
SELECT setval(pg_get_serial_sequence('church_departments', 'department_id'), COALESCE(MAX(department_id), 1)) FROM church_departments;


-- 6. church_groups 테이블 신규 생성 (부서 산하의 소속 그룹 세분화)
CREATE TABLE IF NOT EXISTS public.church_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_profile_id UUID REFERENCES public.church_profiles(church_id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_church_groups_church ON public.church_groups(church_profile_id);
CREATE INDEX IF NOT EXISTS idx_church_groups_dept ON public.church_groups(department_id);


-- 7. church_groups 기본 소속 그룹 Seed 데이터 탑재 (지시사항 8번 반영)
INSERT INTO public.church_groups (church_profile_id, department_id, name, description, sort_order)
VALUES
  -- 1) 예배위원회 (department_id = 11)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 11, '찬양팀', '주일 예배 및 특별 집회 찬양 인도', 1),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 11, '안내팀', '예배 참석 교인 안내 및 주보 배부', 2),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 11, '방송팀', '성전 음향, 자막 및 영상 송출 제어', 3),
  
  -- 2) 찬양위원회 (department_id = 2)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 2, '예뜰찬양팀', '예뜰 예배 찬양', 1),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 2, '예루살렘찬양대', '대예배 찬양 성가대', 2),

  -- 3) 선교위원회 (department_id = 4)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 4, '해외선교부', '해외 선교사 발굴 및 재정 후원', 1),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 4, '국내선교부', '국내 개척교회 및 구제 대상 지원', 2),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 4, '선교기획팀', '선교 특별 이벤트 및 전략 기획', 3),

  -- 4) 교육위원회 (department_id = 3)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 3, '유치부', '미취학 아동 주일학교 성경 교육', 1),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 3, '초등부', '초등학생 어린이 신앙 지도', 2),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 3, '중등부', '청소년 중학생 성경 교육', 3),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 3, '고등부', '고등학생 청소년 신앙 지도', 4),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 3, '대학청년부', '대학생 및 청년 직장인 예배 운영', 5),

  -- 5) 재정위원회 (department_id = 12)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 12, '회계팀', '교회 전표 처리 및 결산 보고서 작성', 1),
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 12, '감사팀', '회계 감사 및 재정 집행 사후 검토', 2),

  -- 6) 관리위원회 (department_id = 13)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 13, '시설관리팀', '성전 하드웨어 관리 및 소방 전기 시설 점검', 1),

  -- 7) 행정위원회 (department_id = 1)
  ('c3b9b47e-8c38-4b14-8c88-29ef31d563a6', 1, '행정지원팀', '교회 행정 및 사무 지원', 1)
ON CONFLICT DO NOTHING;


-- 8. church_user_metadata 테이블에 group_uuid 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='church_user_metadata' AND column_name='group_uuid') THEN
    ALTER TABLE public.church_user_metadata ADD COLUMN group_uuid UUID REFERENCES public.church_groups(id) ON DELETE SET NULL;
  END IF;
END $$;
