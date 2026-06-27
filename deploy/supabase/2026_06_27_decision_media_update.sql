-- =========================================================================
-- Booza Think Platform OS - Decision, Media, Data, Distribution, Workflow Migration
-- Script Name: deploy/supabase/2026_06_27_decision_media_update.sql
-- Description: Zero-Error Idempotent Migration Script for existing databases
-- =========================================================================

-- -------------------------------------------------------------------------
-- PART 1. Decision Engine (판단 엔진) DDL & DML
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_decision_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    metric_key VARCHAR(50) NOT NULL,            -- 판단 기준 컬럼명 (예: amount)
    threshold_value NUMERIC(15, 4) NOT NULL,    -- 임계값
    comparison_operator VARCHAR(10) NOT NULL,   -- '>', '<', '=', '>=', '<='
    opinion_type VARCHAR(20) NOT NULL,          -- 'WARNING', 'RECOMMEND', 'HOLD'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_decisions (
    decision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    target_entity_id VARCHAR(100) NOT NULL,     -- 분석 대상 식별 ID (예: 전표번호, 종목코드)
    score NUMERIC(5, 2),                         -- 종합 점수 (0.00 ~ 100.00)
    decision_opinion TEXT,                      -- 총평 의견
    has_alert BOOLEAN DEFAULT FALSE,
    is_held BOOLEAN DEFAULT FALSE,              -- 결재/집행 보류 권고 여부
    metadata JSONB,                             -- 상세 입력 데이터 및 평가 로그
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_decision_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES platform_decisions(decision_id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_score NUMERIC(5, 2) NOT NULL,
    raw_value NUMERIC(15, 4),
    feedback_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_decision_rules_service ON platform_decision_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON platform_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_service ON platform_decisions(service_id);
CREATE INDEX IF NOT EXISTS idx_decision_metrics_dec ON platform_decision_metrics(decision_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_rule_key'
  ) THEN
    ALTER TABLE platform_decision_rules
    ADD CONSTRAINT unique_rule_key
    UNIQUE (service_id, rule_name);
  END IF;
END $$;

INSERT INTO platform_decision_rules (service_id, rule_name, metric_key, threshold_value, comparison_operator, opinion_type, description)
VALUES 
  ('church_think', '고액 지출 임계치 심사', 'amount', 10000000.0000, '>=', 'WARNING', '1천만원 이상 고액 지출 전표 발생 시 자동 경고 의견 부착'),
  ('church_think', '예산 초과 집행 보류 권고', 'budget_remaining', 0.0000, '<', 'HOLD', '잔여 부서 예산이 0 미만(예산 초과)일 경우 승인 보류(HOLD) 강제 조치')
ON CONFLICT (service_id, rule_name) DO NOTHING;


-- -------------------------------------------------------------------------
-- PART 2. Media Engine (미디어 엔진) DDL & DML
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_media_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_type VARCHAR(30) NOT NULL,          -- 'REPORT', 'BLOG', 'SHORTS', 'YOUTUBE', 'SNS'
    style_name VARCHAR(50) NOT NULL,            -- 'Professional', 'Casual'
    prompt_template TEXT NOT NULL,              -- AI Engine 템플릿 프롬프트
    max_tokens INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_media_contents (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES platform_decisions(decision_id) ON DELETE SET NULL,
    channel_type VARCHAR(30) NOT NULL,
    title VARCHAR(255),
    body_content TEXT NOT NULL,                 -- 생성된 원고/내용
    visual_suggestion TEXT,                    -- AI 이미지 생성 제안 프롬프트
    metadata JSONB,                             -- 해시태그 목록, 오디오 큐 시간 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_media_channels (
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    channel_type VARCHAR(30) NOT NULL,          -- 'YOUTUBE', 'NAVER_BLOG', 'INSTAGRAM'
    channel_name VARCHAR(100) NOT NULL,
    auth_config JSONB,                          -- API 인증용 JSON 설정
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_media_publish_logs (
    publish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES platform_media_contents(content_id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES platform_media_channels(channel_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,                -- 'SUCCESS', 'FAILED', 'PENDING'
    response_payload JSONB,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_media_templates_channel ON platform_media_templates(channel_type);
CREATE INDEX IF NOT EXISTS idx_media_contents_decision ON platform_media_contents(decision_id);
CREATE INDEX IF NOT EXISTS idx_media_channels_project ON platform_media_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_media_publish_logs_content ON platform_media_publish_logs(content_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_template_key'
  ) THEN
    ALTER TABLE platform_media_templates
    ADD CONSTRAINT unique_template_key
    UNIQUE (channel_type, style_name);
  END IF;
END $$;

INSERT INTO platform_media_templates (channel_type, style_name, prompt_template, max_tokens)
VALUES 
  ('REPORT', 'Professional', '당신은 플랫폼 재정 진단 전문가입니다. 의사결정 결과 {opinion} 및 점수 {score}를 참고하여 전문적인 마크다운 보고서를 작성해 주세요.', 3000),
  ('BLOG', 'Casual', '안녕하세요! 오늘 소개해드릴 AI 진단 결과는 {opinion} 입니다. 친절한 대화체로 블로그 포스트를 생성해 주세요.', 2000),
  ('SHORTS', 'Professional', '[00:00 - 00:03] 충격적인 AI 분석 결과! {opinion} [00:03 - 00:15] 세부 진단 내용을 숏츠 대본 형태로 작성하세요.', 1000),
  ('YOUTUBE', 'Professional', '유튜브 동영상 전체 큐시트 및 스크립트를 작성해 주세요. 핵심 점수: {score}', 4000),
  ('SNS', 'Casual', '카드뉴스 본문 가이드라인 및 태그 생성: 점수 {score} #AI #의사결정', 1000)
ON CONFLICT (channel_type, style_name) DO NOTHING;


-- -------------------------------------------------------------------------
-- PART 3. Data Engine (데이터 엔진) DDL & DML
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_data_sources (
    source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(30) NOT NULL,          -- 'API', 'CRAWLER', 'FILE'
    collection_interval VARCHAR(20) NOT NULL,   -- 'REALTIME', 'DAILY', 'WEEKLY'
    license_info TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_sources_service ON platform_data_sources(service_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_source_key'
  ) THEN
    ALTER TABLE platform_data_sources 
    ADD CONSTRAINT unique_source_key 
    UNIQUE (service_id, source_name);
  END IF;
END $$;

INSERT INTO platform_data_sources (service_id, source_name, source_type, collection_interval, license_info)
VALUES 
  ('church_think', '교회 재정 전표 내역', 'API', 'REALTIME', '내부 재정 전용'),
  ('stock_think', '한국거래소 일별 주가', 'API', 'DAILY', 'KRX OpenAPI 유료 계약')
ON CONFLICT (service_id, source_name) DO NOTHING;


-- -------------------------------------------------------------------------
-- PART 4. Distribution Engine (배포 엔진) DDL & DML
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_distribution_channels (
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    channel_type VARCHAR(30) NOT NULL,          -- 'YOUTUBE', 'NAVER_BLOG', 'INSTAGRAM'
    channel_name VARCHAR(100) NOT NULL,
    auth_config JSONB,                          -- OAuth 토큰 정보 등
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_distribution_logs (
    publish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES platform_distribution_channels(channel_id) ON DELETE CASCADE,
    content_id UUID NOT NULL,                   -- platform_media_contents 또는 기타 타겟 ID
    status VARCHAR(20) NOT NULL,                -- 'SUCCESS', 'FAILED', 'PENDING'
    response_payload JSONB,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_dist_channels_project ON platform_distribution_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_dist_logs_channel ON platform_distribution_logs(channel_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_dist_channel_key'
  ) THEN
    ALTER TABLE platform_distribution_channels 
    ADD CONSTRAINT unique_dist_channel_key 
    UNIQUE (project_id, channel_type, channel_name);
  END IF;
END $$;


-- -------------------------------------------------------------------------
-- PART 5. Workflow Engine (워크플로우 엔진) DDL & DML
-- -------------------------------------------------------------------------

-- 1. 신규/기존 platform_workflows 테이블 처리
CREATE TABLE IF NOT EXISTS platform_workflows (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    workflow_key VARCHAR(100),
    workflow_name VARCHAR(100),
    name VARCHAR(100),                          -- 레거시 하위 호환성용 컬럼
    pipeline JSONB NOT NULL DEFAULT '[]'::jsonb, -- 파이프라인 엔진 실행 순서 (예: ["data", "cleaning", "decision"])
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기존에 core에서 테이블이 생성되어 service_id가 없을 경우를 위한 안전한 동적 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN service_id VARCHAR(50) REFERENCES platform_services(service_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'workflow_key'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN workflow_key VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'workflow_name'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN workflow_name VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'name'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN name VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'pipeline'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN pipeline JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 기존 레코드 데이터 백포팅 및 동기화 (Not-Null 위반 방지)
UPDATE platform_workflows SET service_id = 'church_think' WHERE service_id IS NULL;

UPDATE platform_workflows
SET
  workflow_name = COALESCE(workflow_name, name, 'workflow_' || workflow_id::text),
  name = COALESCE(name, workflow_name, 'workflow_' || workflow_id::text),
  workflow_key = COALESCE(workflow_key, 'wf_' || workflow_id::text),
  pipeline = COALESCE(pipeline, '[]'::jsonb)
WHERE workflow_name IS NULL
   OR name IS NULL
   OR workflow_key IS NULL
   OR pipeline IS NULL;

-- 2. 신규/기존 platform_workflow_steps 테이블 처리
CREATE TABLE IF NOT EXISTS platform_workflow_steps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES platform_workflows(workflow_id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    engine_key VARCHAR(50) NOT NULL,            -- 'data', 'decision', 'media' 등
    params JSONB,                               -- 각 엔진별 실행 매개변수 설정
    condition_rule TEXT,                        -- 실행 조건절 분기 규칙
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기존에 core에서 테이블이 생성되어 step_order 등이 없을 경우를 위한 안전한 동적 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'step_order'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN step_order INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'engine_key'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN engine_key VARCHAR(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'params'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN params JSONB;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'condition_rule'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN condition_rule TEXT;
  END IF;
END $$;

-- 기존 platform_workflow_steps 백포팅 UPDATE (동적 SQL 적용하여 파싱 오류 원천 차단)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'step_number'
  ) THEN
    EXECUTE 'UPDATE platform_workflow_steps SET step_order = step_number WHERE step_order IS NULL AND step_number IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'handler_type'
  ) THEN
    EXECUTE 'UPDATE platform_workflow_steps SET engine_key = handler_type WHERE engine_key IS NULL AND handler_type IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'config'
  ) THEN
    EXECUTE 'UPDATE platform_workflow_steps SET params = config WHERE params IS NULL AND config IS NOT NULL';
  END IF;
END $$;

-- 3. platform_workflow_history 생성 (항상 신규)
CREATE TABLE IF NOT EXISTS platform_workflow_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES platform_workflows(workflow_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,                -- 'RUNNING', 'FINISHED', 'FAILED'
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_workflows_service ON platform_workflows(service_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_wf ON platform_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_history_wf ON platform_workflow_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_history_project ON platform_workflow_history(project_id);

-- unique_workflow_key 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_workflow_key'
  ) THEN
    ALTER TABLE platform_workflows 
    ADD CONSTRAINT unique_workflow_key 
    UNIQUE (service_id, workflow_key);
  END IF;
END $$;

-- 기본 파이프라인 워크플로우 씨딩 (legacy name 컬럼도 동시에 입력)
INSERT INTO platform_workflows (service_id, workflow_key, workflow_name, name, pipeline)
VALUES 
  ('church_think', 'church_approval_default', '교회 기본 결재 파이프라인', '교회 기본 결재 파이프라인', '["data", "cleaning", "decision", "media"]'::jsonb),
  ('stock_think', 'stock_daily_analysis', '주식 가치 분석 파이프라인', '주식 가치 분석 파이프라인', '["data", "cleaning", "standardization", "intelligence", "decision", "media", "distribution"]'::jsonb)
ON CONFLICT (service_id, workflow_key) DO NOTHING;


-- -------------------------------------------------------------------------
-- PART 6. Verification SELECT Queries
-- -------------------------------------------------------------------------
SELECT 'platform_workflows' as table_name, COUNT(*) as record_count FROM platform_workflows
UNION ALL
SELECT 'platform_data_sources' as table_name, COUNT(*) as record_count FROM platform_data_sources;
