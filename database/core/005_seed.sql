-- =========================================================================
-- Booza Think Platform OS - Platform Core Seeds (005_seed.sql)
-- =========================================================================

-- 플랫폼 서비스 등록
INSERT INTO platform_services (service_id, name, description) VALUES 
  ('church_think', 'Church Think (교회 회계/전자결재/감사)', '교회 예산 관리 및 결재 승인 시스템'),
  ('stock_think', 'Stock Think (주식 AI 분석)', '인공지능 기반 주식 시황 및 종목 분석'),
  ('estate_think', 'Estate Think (부동산 분석)', '부동산 시세 데이터 수집 및 분석 플랫폼'),
  ('mission_think', 'Mission Think (선교 협력)', '선교지 연계 및 후원 관리 시스템'),
  ('safety_think', 'Safety Think (재난 및 안전 관리)', '시설물 화재 및 안전 점검 플랫폼'),
  ('report_think', 'Report Think (자동 리포트)', '마크다운 리포트 자동 작성 및 내보내기')
ON CONFLICT (service_id) DO NOTHING;

-- 플랫폼 역할 정의
INSERT INTO platform_roles (role_id, name, description) VALUES
  ('super_admin', '플랫폼 총괄관리자', '전체 서비스 및 프로젝트 제어 권한'),
  ('service_admin', '서비스 담당 관리자', '개별 서비스 모듈의 최고 관리자 권한'),
  ('project_admin', '프로젝트 책임자', '단일 프로젝트 소유권 및 관리 권한'),
  ('user', '일반 이용자', '기본적인 기능 입력 및 조회 권한')
ON CONFLICT (role_id) DO NOTHING;

-- 기본 조직 (신길교회) 등록
INSERT INTO platform_organizations (org_id, name, domain) 
VALUES ('d7a049e0-06b2-4d26-8809-17be7bf6e491', '신길교회', 'singil.org')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- 기본 프로젝트 (신길교회 스마트 회계) 등록
INSERT INTO platform_projects (project_id, org_id, service_id, project_name, description)
VALUES ('8a510c4f-c006-4442-8924-f3c75ab73cf6', 'd7a049e0-06b2-4d26-8809-17be7bf6e491', 'church_think', '신길교회 스마트 회계', '신길교회 재정부용 스마트 회계 관리 시스템')
ON CONFLICT (project_id) DO NOTHING;
