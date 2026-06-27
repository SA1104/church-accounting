-- =========================================================================
-- Booza Think Platform OS - Church Think Seeds (005_seed.sql)
-- =========================================================================

-- 기본 부서/그룹 등록
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

-- 기본 계정과목 등록
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
