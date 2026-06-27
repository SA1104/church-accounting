-- =========================================================================
-- Booza Think Platform OS - Workflow Engine Schema (001_schema.sql)
-- =========================================================================

-- 1. 플랫폼 워크플로우 정의
CREATE TABLE IF NOT EXISTS platform_workflows (
    workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    workflow_name VARCHAR(100) NOT NULL,
    pipeline JSONB NOT NULL,                    -- 파이프라인 엔진 실행 순서 (예: ["data", "cleaning", "decision"])
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 워크플로우 세부 스텝 정의
CREATE TABLE IF NOT EXISTS platform_workflow_steps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES platform_workflows(workflow_id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    engine_key VARCHAR(50) NOT NULL,            -- 'data', 'decision', 'media' 등
    params JSONB,                               -- 각 엔진별 실행 매개변수 설정
    condition_rule TEXT,                        -- 실행 조건절 분기 규칙
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 워크플로우 기동 이력 로그
CREATE TABLE IF NOT EXISTS platform_workflow_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES platform_workflows(workflow_id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,                -- 'RUNNING', 'FINISHED', 'FAILED'
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);
