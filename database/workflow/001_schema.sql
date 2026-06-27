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

-- 기존 platform_workflows 테이블에 신규 컬럼 추가 (하위 호환성 보장)
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
    WHERE table_name = 'platform_workflows' AND column_name = 'workflow_name'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN workflow_name VARCHAR(100);
    -- 기존 name 컬럼 데이터를 복사
    UPDATE platform_workflows SET workflow_name = name WHERE name IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflows' AND column_name = 'pipeline'
  ) THEN
    ALTER TABLE platform_workflows ADD COLUMN pipeline JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

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

-- 기존 platform_workflow_steps 테이블에 신규 컬럼 추가 (하위 호환성 보장)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'step_order'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN step_order INTEGER;
    -- 기존 step_number 데이터를 복사
    UPDATE platform_workflow_steps SET step_order = step_number WHERE step_number IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'engine_key'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN engine_key VARCHAR(50);
    -- 기존 handler_type 데이터를 복사
    UPDATE platform_workflow_steps SET engine_key = handler_type WHERE handler_type IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'params'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN params JSONB;
    -- 기존 config 데이터를 복사
    UPDATE platform_workflow_steps SET params = config WHERE config IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'platform_workflow_steps' AND column_name = 'condition_rule'
  ) THEN
    ALTER TABLE platform_workflow_steps ADD COLUMN condition_rule TEXT;
  END IF;
END $$;

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
