-- =========================================================================
-- Booza Think Platform OS - Decision Engine Schema (001_schema.sql)
-- =========================================================================

-- 1. 의사결정 규칙 정의 테이블 (SaaS형 멀티룰 지원)
CREATE TABLE IF NOT EXISTS platform_decision_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    metric_key VARCHAR(50) NOT NULL,            -- 판단 기준 컬럼명
    threshold_value NUMERIC(15, 4) NOT NULL,    -- 임계값
    comparison_operator VARCHAR(10) NOT NULL,   -- '>', '<', '=', '>=', '<=' 등
    opinion_type VARCHAR(20) NOT NULL,          -- 'WARNING', 'RECOMMEND', 'HOLD'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 산출된 의사결정 이력 기록 테이블
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

-- 3. 각 판단 요소별 세부 배점 점수
CREATE TABLE IF NOT EXISTS platform_decision_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES platform_decisions(decision_id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_score NUMERIC(5, 2) NOT NULL,
    raw_value NUMERIC(15, 4),
    feedback_message TEXT
);
