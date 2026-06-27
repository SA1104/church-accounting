-- =========================================================================
-- Booza Think Platform OS - Automation Engine Schema (001_schema.sql)
-- =========================================================================

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
