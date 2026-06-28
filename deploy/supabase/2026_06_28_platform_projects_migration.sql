-- =========================================================================
-- Booza Think Platform OS - Platform Core Operational Migration (2026-06-28)
-- Script Name: deploy/supabase/2026_06_28_platform_projects_migration.sql
-- Description: Safe, Idempotent DB Schema Updates and Core Seeds
-- =========================================================================

-- 1. platform_services 테이블 존재 여부 및 기본 데이터 등록
CREATE TABLE IF NOT EXISTS public.platform_services (
  service_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.platform_services (service_id, name, description) VALUES 
  ('church_think', 'Church Think (교회 회계/전자결재/감사)', '교회 예산 관리 및 결재 승인 시스템'),
  ('stock_think', 'Stock Think (주식 AI 분석)', '인공지능 기반 주식 시황 및 종목 분석'),
  ('estate_think', 'Estate Think (부동산 분석)', '부동산 시세 데이터 수집 및 분석 플랫폼'),
  ('mission_think', 'Mission Think (선교 협력)', '선교지 연계 및 후원 관리 시스템'),
  ('safety_think', 'Safety Think (재난 및 안전 관리)', '시설물 화재 및 안전 점검 플랫폼'),
  ('report_think', 'Report Think (자동 리포트)', '마크다운 리포트 자동 작성 및 내보내기')
ON CONFLICT (service_id) DO NOTHING;


-- 2. platform_roles 테이블 존재 여부 및 기본 데이터 등록
CREATE TABLE IF NOT EXISTS public.platform_roles (
  role_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

INSERT INTO public.platform_roles (role_id, name, description) VALUES
  ('super_admin', '플랫폼 총괄관리자', '전체 서비스 및 프로젝트 제어 권한'),
  ('service_admin', '서비스 담당 관리자', '개별 서비스 모듈의 최고 관리자 권한'),
  ('project_admin', '프로젝트 책임자', '단일 프로젝트 소유권 및 관리 권한'),
  ('user', '일반 이용자', '기본적인 기능 입력 및 조회 권한')
ON CONFLICT (role_id) DO NOTHING;


-- 3. platform_organizations 테이블 존재 여부 및 기본 데이터 등록
CREATE TABLE IF NOT EXISTS public.platform_organizations (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.platform_organizations (org_id, name, domain) 
VALUES ('d7a049e0-06b2-4d26-8809-17be7bf6e491', '신길교회', 'singil.org')
ON CONFLICT (org_id) DO NOTHING;


-- 4. platform_projects 테이블 및 컬럼 마이그레이션
CREATE TABLE IF NOT EXISTS public.platform_projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.platform_organizations(org_id) ON DELETE SET NULL,
  service_id VARCHAR(50) REFERENCES public.platform_services(service_id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  project_name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- is_active 컬럼 안전하게 추가
ALTER TABLE public.platform_projects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- status 컬럼 안전하게 추가
ALTER TABLE public.platform_projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- 기본 프로젝트 데이터 등록
INSERT INTO public.platform_projects (project_id, org_id, service_id, project_name, description, status, is_active)
VALUES (
  '8a510c4f-c006-4442-8924-f3c75ab73cf6', 
  'd7a049e0-06b2-4d26-8809-17be7bf6e491', 
  'church_think', 
  '신길교회 스마트 회계', 
  '신길교회 재정부용 스마트 회계 관리 시스템',
  'ACTIVE',
  TRUE
)
ON CONFLICT (project_id) DO NOTHING;


-- 5. platform_project_members 테이블 및 컬럼 마이그레이션
CREATE TABLE IF NOT EXISTS public.platform_project_members (
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id)
);

-- role_id 컬럼 안전하게 추가
ALTER TABLE public.platform_project_members ADD COLUMN IF NOT EXISTS role_id VARCHAR(50);

-- 외래키 연동
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema='public' AND table_name='platform_project_members' AND constraint_name='fk_platform_project_members_role_id'
  ) THEN
    ALTER TABLE public.platform_project_members 
    ADD CONSTRAINT fk_platform_project_members_role_id 
    FOREIGN KEY (role_id) REFERENCES public.platform_roles(role_id) ON DELETE SET NULL;
  END IF;
END $$;
