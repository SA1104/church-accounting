-- =========================================================================
-- Booza Think Platform OS - Decision & Media Engine Migration (update.sql)
-- Script Name: deploy/supabase/2026_06_27_decision_media_update.sql
-- =========================================================================

-- -------------------------------------------------------------------------
-- [순서 1] Decision Engine Schema 테이블 생성
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

-- -------------------------------------------------------------------------
-- [순서 2] Decision Engine Indexes 인덱스 추가
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_decision_rules_service ON platform_decision_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON platform_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_service ON platform_decisions(service_id);
CREATE INDEX IF NOT EXISTS idx_decision_metrics_dec ON platform_decision_metrics(decision_id);

-- -------------------------------------------------------------------------
-- [순서 3] Decision Engine Constraints 제약조건 및 Seeds 기초 데이터 추가
-- -------------------------------------------------------------------------
-- unique_rule_key 제약 조건 멱등 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_rule_key'
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
-- [순서 4] Media Engine Schema 테이블 생성
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
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Fixed: UUID type added
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

-- -------------------------------------------------------------------------
-- [순서 5] Media Engine Indexes 인덱스 추가
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_media_templates_channel ON platform_media_templates(channel_type);
CREATE INDEX IF NOT EXISTS idx_media_contents_decision ON platform_media_contents(decision_id);
CREATE INDEX IF NOT EXISTS idx_media_channels_project ON platform_media_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_media_publish_logs_content ON platform_media_publish_logs(content_id);

-- -------------------------------------------------------------------------
-- [순서 6] Media Engine Constraints 제약조건 및 Seeds 채널별 프롬프트 기본 데이터 추가
-- -------------------------------------------------------------------------
-- unique_template_key 제약 조건 멱등 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_template_key'
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
-- [순서 7] 데이터베이스 이행 검증용 SELECT 쿼리
-- -------------------------------------------------------------------------
SELECT 'platform_decision_rules' as table_name, COUNT(*) as record_count FROM platform_decision_rules
UNION ALL
SELECT 'platform_media_templates' as table_name, COUNT(*) as record_count FROM platform_media_templates;

SELECT * FROM platform_decision_rules LIMIT 5;
SELECT * FROM platform_media_templates LIMIT 5;
