-- pgcrypto 확장 활성화 (UUID 생성)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- pgvector 확장 활성화 (향후 Vector Search를 위해 미리 선언)
CREATE EXTENSION IF NOT EXISTS "vector";


-- =========================================================================
-- 1. 플랫폼 코어 테이블 (Prefix: platform_)
-- =========================================================================

-- platform_profiles: auth.users 와 1:1 연동되는 사용자 정보
CREATE TABLE IF NOT EXISTS public.platform_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_services: 플랫폼에 탑재된 서비스 종류
CREATE TABLE IF NOT EXISTS public.platform_services (
  service_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_organizations: 최상위 조직/그룹 단위 테넌트
CREATE TABLE IF NOT EXISTS public.platform_organizations (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_projects: 서비스 내의 격리된 실제 운영 프로젝트 (예: 신길교회, 사랑교회)
CREATE TABLE IF NOT EXISTS public.platform_projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.platform_organizations(org_id) ON DELETE SET NULL,
  service_id VARCHAR(50) REFERENCES public.platform_services(service_id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  project_name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ARCHIVED', 'SUSPENDED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_project_members: 프로젝트에 소속된 멤버 및 권한
CREATE TABLE IF NOT EXISTS public.platform_project_members (
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER', -- 'ADMIN', 'MEMBER', 'READER'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id)
);

-- platform_roles: 전역 역할 마스터
CREATE TABLE IF NOT EXISTS public.platform_roles (
  role_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- platform_role_assignments: 사용자의 역할 지정
CREATE TABLE IF NOT EXISTS public.platform_role_assignments (
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  role_id VARCHAR(50) REFERENCES public.platform_roles(role_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, project_id, role_id)
);

-- platform_workflows: 실행할 자동화 워크플로우 정의
CREATE TABLE IF NOT EXISTS public.platform_workflows (
  workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_workflow_steps: 워크플로우 단계
CREATE TABLE IF NOT EXISTS public.platform_workflow_steps (
  step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.platform_workflows(workflow_id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  handler_type VARCHAR(50) NOT NULL, -- 'AI_PROMPT', 'COLLECT', 'NOTIFICATION'
  config JSONB,
  UNIQUE (workflow_id, step_number)
);

-- platform_tasks: 개별 단계 실행에 의해 기동된 태스크의 인스턴스 정보
CREATE TABLE IF NOT EXISTS public.platform_tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES public.platform_workflow_steps(step_id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
  payload JSONB,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_tags: 다목적 검색 및 그룹화를 위한 공통 태그
CREATE TABLE IF NOT EXISTS public.platform_tags (
  tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(10) DEFAULT '#808080',
  description TEXT
);

-- platform_tag_maps: 태그와 임의 객체 간의 관계 설정
CREATE TABLE IF NOT EXISTS public.platform_tag_maps (
  tag_id UUID REFERENCES public.platform_tags(tag_id) ON DELETE CASCADE,
  related_table VARCHAR(100) NOT NULL, -- 'church_vouchers', 'estate_properties' 등
  related_id VARCHAR(100) NOT NULL, -- 대상 레코드의 UUID 또는 INTEGER 기본키
  PRIMARY KEY (tag_id, related_table, related_id)
);

-- platform_events: 이벤트 기반 처리를 위한 이벤트 버스 로그
CREATE TABLE IF NOT EXISTS public.platform_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'VOUCHER_SUBMITTED', 'OCR_COMPLETED' 등
  payload JSONB,
  triggered_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_ai_models: 사용할 LLM API 모델 정보
CREATE TABLE IF NOT EXISTS public.platform_ai_models (
  model_id VARCHAR(50) PRIMARY KEY, -- 'gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'
  provider VARCHAR(50) NOT NULL, -- 'OpenAI', 'Anthropic', 'Google', 'Local'
  api_endpoint TEXT,
  pricing_info JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_ai_prompts: 데이터베이스에서 동적으로 관리 및 버전 통제하는 프롬프트
CREATE TABLE IF NOT EXISTS public.platform_ai_prompts (
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name VARCHAR(100) NOT NULL,
  prompt_type VARCHAR(50) NOT NULL, -- 'OCR_PARSER', 'AUDIT_CHECKER', 'REPORT_WRITER'
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  model_id VARCHAR(50) REFERENCES public.platform_ai_models(model_id),
  temperature NUMERIC(3, 2) DEFAULT 0.70,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (prompt_name, version)
);

-- platform_files: 스토리지에 업로드된 파일 정보 메타
CREATE TABLE IF NOT EXISTS public.platform_files (
  file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  bucket_name VARCHAR(100) NOT NULL,
  file_key VARCHAR(512) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  ocr_status VARCHAR(20) DEFAULT 'PENDING',
  ocr_result JSONB,
  tags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_search_indexes: 통합 검색을 지원하는 인덱스 테이블 (Vector Embedding 컬럼 포함)
CREATE TABLE IF NOT EXISTS public.platform_search_indexes (
  index_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  related_table VARCHAR(100) NOT NULL,
  related_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  embedding vector(1536), -- Vector Search 연동 컬럼 (예: OpenAI text-embedding-3-small)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_notifications: 알림 보관함
CREATE TABLE IF NOT EXISTS public.platform_notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  type VARCHAR(50),
  message TEXT,
  target_url VARCHAR(255),
  is_read INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'UNREAD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_audit_logs: 시스템 운영 감사 로그
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  result VARCHAR(20) DEFAULT 'SUCCESS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- platform_integrations: 외부 API 및 서비스 연동 설정 정보 (예: KIS 주식 API, Slack Webhook 등)
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'OPENAI', 'ANTHROPIC', 'KIS', 'UPBIT', 'SLACK', 'TELEGRAM' 등
  api_key TEXT NOT NULL, -- 암호화된 API Key 또는 토큰 값
  api_secret TEXT, -- 부가적인 비밀키 정보
  config JSONB, -- 엔드포인트 또는 커스텀 파라미터 정보
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_api_keys: 서드파티 및 외부 봇을 위한 API Key 발급
CREATE TABLE IF NOT EXISTS public.platform_api_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- API Key 원본의 SHA-256 해시값
  name VARCHAR(100) NOT NULL, -- 발급 주체 이름 (예: Stock Analyzer Bot)
  scopes TEXT[], -- 허용 권한 범위 (예: ['vouchers:read', 'vouchers:write', 'ai:run'])
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_schedulers: 비동기 크론 스케줄링 배치 작업 정의
CREATE TABLE IF NOT EXISTS public.platform_schedulers (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  cron_expression VARCHAR(50) NOT NULL, -- 표준 크론 탭 양식 (예: '0 2 * * *')
  workflow_id UUID REFERENCES public.platform_workflows(workflow_id) ON DELETE SET NULL, -- 연동 워크플로우
  payload JSONB, -- 실행 시 주입할 인자값
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_job_runs: 스케줄러 실행 이력 기록 및 에러 로깅
CREATE TABLE IF NOT EXISTS public.platform_job_runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.platform_schedulers(job_id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.platform_tasks(task_id) ON DELETE SET NULL, -- 연동 기동 태스크
  status VARCHAR(20) DEFAULT 'RUNNING' NOT NULL, -- 'RUNNING', 'SUCCESS', 'FAILED'
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- platform_knowledge_bases: RAG 기반 지식창고 모음
CREATE TABLE IF NOT EXISTS public.platform_knowledge_bases (
  kb_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_documents: 지식창고에 속한 개별 문서 원문
CREATE TABLE IF NOT EXISTS public.platform_documents (
  doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID REFERENCES public.platform_knowledge_bases(kb_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- 문서 텍스트 본문
  file_id UUID REFERENCES public.platform_files(file_id) ON DELETE SET NULL, -- 원본 첨부파일 링크
  metadata JSONB, -- 출처, 카테고리 등 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_document_chunks: 임베딩 및 벡터 유사도 검색용 텍스트 조각
CREATE TABLE IF NOT EXISTS public.platform_document_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES public.platform_documents(doc_id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- 조각 본문
  embedding vector(1536), -- Vector Embedding 컬럼 (OpenAI 등 대응)
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_ai_agents: 에러 체크, 분석, 마스터 봇 등 AI 에이전트 인스턴스 정보
CREATE TABLE IF NOT EXISTS public.platform_ai_agents (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  role_description TEXT,
  system_prompt TEXT NOT NULL,
  default_model_id VARCHAR(50) REFERENCES public.platform_ai_models(model_id) ON DELETE SET NULL,
  kb_id UUID REFERENCES public.platform_knowledge_bases(kb_id) ON DELETE SET NULL, -- 연동 지식창고
  config JSONB, -- 온도(temperature), 토큰 한도 등 파라미터
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_ai_agent_sessions: 사용자와 개별 에이전트 간의 대화 쓰레드 세션
CREATE TABLE IF NOT EXISTS public.platform_ai_agent_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.platform_ai_agents(agent_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE, -- 대화 상대방 사용자
  title VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_ai_agent_messages: 대화 이력 보관 및 단기 기억(Short-term Memory) 관리
CREATE TABLE IF NOT EXISTS public.platform_ai_agent_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.platform_ai_agent_sessions(session_id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_ai_agent_memories: 시맨틱 키-값 쌍을 저장하는 사용자와 에이전트 간의 장기 기억(Long-term Memory)
CREATE TABLE IF NOT EXISTS public.platform_ai_agent_memories (
  memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.platform_ai_agents(agent_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  memory_key VARCHAR(100) NOT NULL, -- 예: 'user_investment_style'
  memory_value TEXT NOT NULL,
  embedding vector(1536), -- 시맨틱 회상(Recall)용 임베딩
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, user_id, memory_key)
);

-- 성능 향상을 위한 벡터 인덱스 생성 (HNSW 기법 적용, 코사인 유사도 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_platform_doc_chunks_embedding 
ON public.platform_document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_platform_ai_memories_embedding 
ON public.platform_ai_agent_memories USING hnsw (embedding vector_cosine_ops);

-- platform_ai_agent_memories updated_at 트리거 생성
CREATE OR REPLACE FUNCTION public.update_platform_memories_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_platform_memories_timestamp ON public.platform_ai_agent_memories;
CREATE TRIGGER trg_update_platform_memories_timestamp
  BEFORE UPDATE ON public.platform_ai_agent_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_memories_timestamp();


-- =========================================================================
-- 2. Church Think 테이블 (Prefix: church_)
-- 모든 테이블은 platform_projects 를 참조하여 테넌트 격리(Multi-tenant Isolation)를 실행합니다.
-- =========================================================================

-- church_departments: 교회 부서 구조 (프로젝트 단위 격리)
CREATE TABLE IF NOT EXISTS public.church_departments (
  department_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES public.church_departments(department_id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, parent_id, name)
);

-- church_user_metadata: 교인 세부 권한 정보
CREATE TABLE IF NOT EXISTS public.church_user_metadata (
  user_id UUID PRIMARY KEY REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES public.church_departments(department_id) ON DELETE SET NULL,
  position VARCHAR(100) NOT NULL DEFAULT '기타',
  signature TEXT
);

-- church_account_categories: 계정과목 코드
CREATE TABLE IF NOT EXISTS public.church_account_categories (
  category_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- INCOME / EXPENSE
  parent_category VARCHAR(100) NOT NULL,
  child_category VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- church_vouchers: 전표 마스터 (헤더)
CREATE TABLE IF NOT EXISTS public.church_vouchers (
  voucher_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  writer_id UUID NOT NULL REFERENCES public.platform_profiles(user_id),
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- INCOME / EXPENSE
  summary TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'TEMP' NOT NULL, -- TEMP, SUBMITTED, APPROVED, REJECTED
  reject_reason TEXT,
  memo TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- church_voucher_items: 전표 내역 상세 (1:N 다중 분개)
CREATE TABLE IF NOT EXISTS public.church_voucher_items (
  item_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.church_account_categories(category_id),
  amount NUMERIC(15, 2) NOT NULL,
  vendor VARCHAR(100),
  payment_method VARCHAR(50) DEFAULT 'CARD',
  memo TEXT
);

-- church_receipts: 전표 증빙 매핑
CREATE TABLE IF NOT EXISTS public.church_receipts (
  receipt_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.platform_files(file_id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0
);

-- church_approval_lines: 전자결재 결재선
CREATE TABLE IF NOT EXISTS public.church_approval_lines (
  line_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.platform_profiles(user_id),
  step_number INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (voucher_id, step_number)
);

-- church_approval_actions: 전자결재 승인 활동 이력
CREATE TABLE IF NOT EXISTS public.church_approval_actions (
  action_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.platform_profiles(user_id),
  action VARCHAR(50) NOT NULL, -- SUBMIT, APPROVE, REJECT, CANCEL
  comment TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- church_ledgers: 월 장부
CREATE TABLE IF NOT EXISTS public.church_ledgers (
  ledger_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  year_month VARCHAR(20) NOT NULL,
  carry_over NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_income NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_expense NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'TEMP' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, year_month)
);

-- church_settlements: 최종 결산보고
CREATE TABLE IF NOT EXISTS public.church_settlements (
  settlement_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  half_cycle VARCHAR(20) NOT NULL,
  budget_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_income NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_expense NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'TEMP' NOT NULL,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, fiscal_year, half_cycle)
);

-- church_closing_periods: 회계 기수 마감
CREATE TABLE IF NOT EXISTS public.church_closing_periods (
  period_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL,
  period_value VARCHAR(50) NOT NULL,
  is_locked INTEGER DEFAULT 1,
  locked_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, period_type, period_value)
);


-- =========================================================================
-- 3. Trigger: auth.users 신규 가입 시 platform_profiles 자동 생성
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.platform_profiles (user_id, username, display_name, is_active)
  VALUES (
    new.id,
    split_part(new.email, '@', 1),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =========================================================================
-- 4. 초기 시드 데이터 시딩 (Seeding)
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

-- 기본 AI 모델 연동
INSERT INTO platform_ai_models (model_id, provider, api_endpoint, pricing_info, is_active) VALUES
  ('gpt-4o', 'OpenAI', 'https://api.openai.com/v1/chat/completions', '{"input_1k": 0.005, "output_1k": 0.015}', TRUE),
  ('claude-3-5-sonnet', 'Anthropic', 'https://api.anthropic.com/v1/messages', '{"input_1k": 0.003, "output_1k": 0.015}', TRUE),
  ('gemini-1.5-pro', 'Google', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', '{"input_1k": 0.007, "output_1k": 0.021}', TRUE)
ON CONFLICT (model_id) DO NOTHING;


-- =========================================================================
-- 5. 공통 SQL 실행기 RPC 함수 (DATABASE_URL 대체 목적, 서비스 역할 전용)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.exec_sql(query_text text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res_json jsonb := '[]'::jsonb;
  i int;
  param_val text;
  final_query text := query_text;
  row_count int;
BEGIN
  -- 파라미터가 있는 경우 플레이스홀더(?)를 안전하게 이스케이프된 문자열 상수로 치환
  IF jsonb_array_length(params) > 0 THEN
    FOR i IN 0 .. jsonb_array_length(params) - 1 LOOP
      param_val := params->>i;
      IF param_val IS NULL THEN
        final_query := regexp_replace(final_query, '\?', 'NULL');
      ELSE
        -- 홑따옴표가 SQL 인젝션 공격 도구로 오용되지 않도록 이스케이프 처리
        param_val := replace(param_val, '''', '''''');
        final_query := regexp_replace(final_query, '\?', '''' || param_val || '''');
      END IF;
    END LOOP;
  END IF;

  -- 쿼리 타입 분기 처리
  IF upper(final_query) LIKE '%RETURNING%' THEN
    -- 데이터 수정 및 결과 반환 (CTE 적용)
    EXECUTE 'WITH t AS (' || final_query || ') SELECT jsonb_agg(t) FROM t' INTO res_json;
  ELSIF upper(final_query) LIKE 'SELECT%' OR upper(final_query) LIKE 'WITH%' THEN
    -- 일반 조회 (서브쿼리 적용)
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || final_query || ') t' INTO res_json;
  ELSE
    -- 일반 데이터 수정 (결과 카운트 반환)
    EXECUTE final_query;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    res_json := jsonb_build_array(jsonb_build_object('changes', row_count));
  END IF;

  RETURN COALESCE(res_json, '[]'::jsonb);
END;
$$;

-- 일반 사용자의 호출 권한 회수 및 관리자/PostgreSQL 전용 권한 부여
REVOKE ALL ON FUNCTION public.exec_sql(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.exec_sql(text, jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.exec_sql(text, jsonb) TO service_role;


-- =========================================================================
-- 6. 초기 테스트용 기본 프로젝트, 부서 및 계정과목 시드 데이터 적재
-- =========================================================================

-- 기본 조직 (신길교회) 등록
INSERT INTO platform_organizations (org_id, name, domain) 
VALUES ('d7a049e0-06b2-4d26-8809-17be7bf6e491', '신길교회', 'singil.org')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

-- 기본 프로젝트 (신길교회 스마트 회계) 등록
INSERT INTO platform_projects (project_id, org_id, service_id, project_name, description)
VALUES ('8a510c4f-c006-4442-8924-f3c75ab73cf6', 'd7a049e0-06b2-4d26-8809-17be7bf6e491', 'church_think', '신길교회 스마트 회계', '신길교회 재정부용 스마트 회계 관리 시스템')
ON CONFLICT (project_id) DO NOTHING;

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


-- =========================================================================
-- 7. 기존 기본 로그인 아이디 복구 및 권한 설정 (Bcrypt 해싱 적용)
-- =========================================================================

-- auth.users 테이블에 복구 대상 사용자 적재
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  role, 
  aud,
  confirmation_token
) VALUES 
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'admin@boozathink.com', '$2a$10$mVR8iHbpj36L8AwnI3mb1Omgt2NTydfrpvSEbzAD/KUujqEvp/Kfa', now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "관리자"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'accountant@boozathink.com', '$2a$10$Bs7YvpWiI0yEovbDnO4oVujWtjg2jHi3wKsqzgS2e3PRoZk6g1VNa', now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "김회계"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'depthead@boozathink.com', '$2a$10$g3TUrdipRlR1bpRAVgYevO8V6hVoL6KiAM6TlJfU449Mb9Gc1Hm/6', now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "박부장"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'finance@boozathink.com', '$2a$10$Y2ga8jhlsgQIBxnyMLk6dezFI5r8rRJ0fJLwbUjFNDq4Uz6O6k.dO', now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "이재정"}'::jsonb, now(), now(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'auditor@boozathink.com', '$2a$10$Cr3Rrk1UHsl0I.1UZZV/I.4T5IrlO.i6982wN8LhzQUGO4uaV.NUK', now(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"name": "최감사"}'::jsonb, now(), now(), 'authenticated', 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- 프로젝트 멤버십 등록
INSERT INTO platform_project_members (project_id, user_id, role_id) VALUES
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '00000000-0000-0000-0000-000000000010', 'super_admin'),
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '00000000-0000-0000-0000-000000000011', 'user'),
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '00000000-0000-0000-0000-000000000012', 'user'),
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '00000000-0000-0000-0000-000000000013', 'user'),
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '00000000-0000-0000-0000-000000000014', 'service_admin')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 역할 할당 등록
INSERT INTO platform_role_assignments (user_id, service_id, project_id, role_id) VALUES
  ('00000000-0000-0000-0000-000000000010', 'church_think', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'super_admin'),
  ('00000000-0000-0000-0000-000000000011', 'church_think', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'user'),
  ('00000000-0000-0000-0000-000000000012', 'church_think', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'user'),
  ('00000000-0000-0000-0000-000000000013', 'church_think', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'user'),
  ('00000000-0000-0000-0000-000000000014', 'church_think', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 'service_admin')
ON CONFLICT (user_id, service_id, project_id, role_id) DO NOTHING;

-- 교회 세부 메타데이터 등록
INSERT INTO church_user_metadata (user_id, project_id, department_id, position, signature) VALUES
  ('00000000-0000-0000-0000-000000000010', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 5, '기타', '관리자 (기타) (인)'),
  ('00000000-0000-0000-0000-000000000011', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 6, '회계', '김회계 (회계) (인)'),
  ('00000000-0000-0000-0000-000000000012', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 6, '부장', '박부장 (부장) (인)'),
  ('00000000-0000-0000-0000-000000000013', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 5, '위원장', '이재정 (위원장) (인)'),
  ('00000000-0000-0000-0000-000000000014', '8a510c4f-c006-4442-8924-f3c75ab73cf6', 5, '교역자', '최감사 (교역자) (인)')
ON CONFLICT (user_id) DO NOTHING;
