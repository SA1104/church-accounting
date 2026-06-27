-- =========================================================================
-- Booza Think Platform OS - Workflow Engine Seeds (005_seed.sql)
-- =========================================================================

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
