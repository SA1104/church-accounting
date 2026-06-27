-- =========================================================================
-- 1. 플랫폼 기본 서비스 종류 등록
-- =========================================================================
INSERT INTO platform_services (service_id, name, description) VALUES 
  ('church_think', 'Church Think (교회 회계/전자결재/감사)', '교회 예산 관리 및 결재 승인 시스템'),
  ('stock_think', 'Stock Think (주식 AI 분석)', '인공지능 기반 주식 시황 및 종목 분석'),
  ('estate_think', 'Estate Think (부동산 분석)', '부동산 시세 데이터 수집 및 분석 플랫폼'),
  ('mission_think', 'Mission Think (선교 협력)', '선교지 연계 및 후원 관리 시스템'),
  ('safety_think', 'Safety Think (재난 및 안전 관리)', '시설물 화재 및 안전 점검 플랫폼'),
  ('report_think', 'Report Think (자동 리포트)', '마크다운 리포트 자동 작성 및 내보내기')
ON CONFLICT (service_id) DO NOTHING;

-- =========================================================================
-- 2. 플랫폼 역할 마스터 등록
-- =========================================================================
INSERT INTO platform_roles (role_id, name, description) VALUES
  ('super_admin', '플랫폼 총괄관리자', '전체 서비스 및 프로젝트 제어 권한'),
  ('service_admin', '서비스 담당 관리자', '개별 서비스 모듈의 최고 관리자 권한'),
  ('project_admin', '프로젝트 책임자', '단일 프로젝트 소유권 및 관리 권한'),
  ('user', '일반 이용자', '기본적인 기능 입력 및 조회 권한')
ON CONFLICT (role_id) DO NOTHING;

-- =========================================================================
-- 3. 기본 AI 모델 등록
-- =========================================================================
INSERT INTO platform_ai_models (model_id, provider, api_endpoint, pricing_info, is_active) VALUES
  ('gpt-4o', 'OpenAI', 'https://api.openai.com/v1/chat/completions', '{"input_1k": 0.005, "output_1k": 0.015}', TRUE),
  ('claude-3-5-sonnet', 'Anthropic', 'https://api.anthropic.com/v1/messages', '{"input_1k": 0.003, "output_1k": 0.015}', TRUE),
  ('gemini-1.5-pro', 'Google', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', '{"input_1k": 0.007, "output_1k": 0.021}', TRUE)
ON CONFLICT (model_id) DO NOTHING;

-- =========================================================================
-- 4. 신길교회 기본 테넌트/프로젝트 등록
-- =========================================================================
-- 기본 조직 (신길교회) 등록
INSERT INTO platform_organizations (org_id, name, domain) 
VALUES ('d7a049e0-06b2-4d26-8809-17be7bf6e491', '신길교회', 'singil.org')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- 기본 프로젝트 (신길교회 스마트 회계) 등록
INSERT INTO platform_projects (project_id, org_id, service_id, project_name, description)
VALUES ('8a510c4f-c006-4442-8924-f3c75ab73cf6', 'd7a049e0-06b2-4d26-8809-17be7bf6e491', 'church_think', '신길교회 스마트 회계', '신길교회 재정부용 스마트 회계 관리 시스템')
ON CONFLICT (project_id) DO NOTHING;

-- =========================================================================
-- 5. 교회 부서/그룹 등록
-- =========================================================================
INSERT INTO church_departments (department_id, project_id, parent_id, name, description) VALUES
  (1, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '행정위원회', '교회 재무 행정 및 총무 부서 통괄'),
  (2, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '찬양위원회', '각 찬양팀 및 찬양대 성가대 부서'),
  (3, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '교육위원회', '대학부, 청년부 및 교육 주일학교 부서'),
  (4, '8a510c4f-c006-4442-8924-f3c75ab73cf6', NULL, '선교위원회', '국내외 선교 및 구제 특별 위원회')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO church_departments (department_id, project_id, parent_id, name, description) VALUES
  (5, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 1, '행정지원팀', '교회 사무 총무 행정 지원'),
  (6, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 2, '예뜰찬양팀', '주일 오전 예배 찬양 봉사'),
  (7, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 2, '예루살렘찬양대', '주일 대예배 성가대'),
  (8, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 3, '대학청년부', '대학 및 청년 전도 봉사 교육'),
  (9, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 3, '유소년부', '초등 주일학교 어린이 성경 교육'),
  (10, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 4, '선교기획팀', '해외선교사 연동 및 구제사업')
ON CONFLICT (department_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('church_departments', 'department_id'), COALESCE(MAX(department_id), 1)) FROM church_departments;

-- =========================================================================
-- 6. 기본 계정과목 등록
-- =========================================================================
INSERT INTO church_account_categories (category_id, project_id, type, parent_category, child_category, description) VALUES
  (1, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'INCOME', '헌금', '십일조헌금', '십일조 헌금 수입'),
  (2, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'INCOME', '헌금', '주일감사헌금', '주일 감사헌금'),
  (3, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'INCOME', '지원금', '교회보조금', '교회 본회 보조금'),
  (4, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'EXPENSE', '예배비', '소모품비', '주보 및 성찬 소모품'),
  (5, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'EXPENSE', '교육비', '교재비', '성경 공부용 교재비'),
  (6, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'EXPENSE', '운영비', '식비및간식비', '다과 식대 회의 비용'),
  (7, '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'EXPENSE', '선교비', '후원금', '선교 파견 후원비')
ON CONFLICT (category_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('church_account_categories', 'category_id'), COALESCE(MAX(category_id), 1)) FROM church_account_categories;
