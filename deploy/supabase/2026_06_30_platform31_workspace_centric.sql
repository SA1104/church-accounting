-- =========================================================================
-- BOOZA THINK Platform 3.1 - Workspace-Centric Capability Architecture
-- Migration: 2026_06_30_platform31_workspace_centric.sql
-- =========================================================================

-- 1. platform_workspaces: Capability의 Root Context 단위
CREATE TABLE IF NOT EXISTS public.platform_workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability VARCHAR(50) NOT NULL,  -- 'church', 'stock', 'estate', 'mission'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_workspaces_capability ON public.platform_workspaces(capability);
CREATE INDEX IF NOT EXISTS idx_platform_workspaces_project ON public.platform_workspaces(project_id);

-- 2. platform_notifications 컬럼 추가 (Workspace Context 지원)
ALTER TABLE public.platform_notifications
  ADD COLUMN IF NOT EXISTS workspace_id UUID,           -- platform_workspaces 참조 (느슨한 참조)
  ADD COLUMN IF NOT EXISTS capability VARCHAR(50),       -- 'church', 'stock', 'estate', 'mission'
  ADD COLUMN IF NOT EXISTS context_type VARCHAR(50),    -- 'assignment', 'voucher', 'research', 'analysis', 'team'
  ADD COLUMN IF NOT EXISTS context_id VARCHAR(100),     -- assignment_id, research_id, etc.
  ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50),   -- 'voucher', 'ledger', 'portfolio', 'property'
  ADD COLUMN IF NOT EXISTS resource_id VARCHAR(100);    -- 대상 리소스의 ID

CREATE INDEX IF NOT EXISTS idx_platform_notifications_workspace ON public.platform_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_platform_notifications_capability ON public.platform_notifications(capability);

-- 3. decision_histories 컬럼 추가 (Workspace Context 포함)
ALTER TABLE public.decision_histories
  ADD COLUMN IF NOT EXISTS workspace_id UUID,           -- platform_workspaces 참조 (느슨한 참조)
  ADD COLUMN IF NOT EXISTS context_type VARCHAR(50),    -- 'committee', 'portfolio', 'region', 'team'
  ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50),   -- 'voucher', 'ticker', 'property', 'donation'
  ADD COLUMN IF NOT EXISTS resource_id VARCHAR(100),    -- 리소스 ID
  ADD COLUMN IF NOT EXISTS learning_score NUMERIC(5,2) DEFAULT 0.00; -- 결과 학습 점수

-- service_id 컬럼을 capability 로도 사용할 수 있도록 (기존 service_id 유지)
CREATE INDEX IF NOT EXISTS idx_decision_histories_workspace ON public.decision_histories(workspace_id);

-- 4. Stock Think Workspace 테이블
CREATE TABLE IF NOT EXISTS public.stock_workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT '내 투자계정',
  description TEXT,
  investment_style VARCHAR(50) DEFAULT 'Growth', -- 'Growth', 'Value', 'Dividend', 'Balanced'
  risk_preference VARCHAR(20) DEFAULT 'MEDIUM',  -- 'LOW', 'MEDIUM', 'HIGH'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.stock_portfolio_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.stock_workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'OWNER',    -- 'OWNER', 'VIEWER', 'COLLABORATOR'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.stock_research_history (
  research_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.stock_workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  ticker VARCHAR(50) NOT NULL,
  question TEXT,
  investment_style VARCHAR(50),
  risk_preference VARCHAR(20),
  holding_price NUMERIC(15,2),
  holding_quantity INTEGER,
  result_snapshot JSONB DEFAULT '{}'::jsonb,   -- AI 분석 결과 스냅샷
  decision_score INTEGER,
  recommendation TEXT,
  simulated_price NUMERIC(15,2),
  simulation_outcome JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_workspaces_user ON public.stock_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_research_workspace ON public.stock_research_history(workspace_id);

-- 5. Estate Think Workspace 테이블
CREATE TABLE IF NOT EXISTS public.estate_workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT '서울권 분석',
  region VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.estate_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.estate_workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'OWNER',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.estate_analysis_history (
  analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.estate_workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  region VARCHAR(100),
  apt_name VARCHAR(200),
  analysis_type VARCHAR(50), -- 'gap_investment', 'reconstruction', 'market_trend'
  result_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estate_workspaces_user ON public.estate_workspaces(user_id);

-- 6. Mission Think Workspace 테이블
CREATE TABLE IF NOT EXISTS public.mission_workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL DEFAULT '인도 의료선교',
  country VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.mission_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.mission_workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'MEMBER', -- 'LEADER', 'MEMBER', 'SUPPORTER'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.mission_prayer_logs (
  prayer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.mission_workspaces(workspace_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mission_workspaces_user ON public.mission_workspaces(user_id);

-- 7. platform_workspaces 초기 데이터 (Church Think 기본 Workspace)
-- Note: project_id는 실제 church_think project_id로 대체 필요
INSERT INTO public.platform_workspaces (capability, name, description, project_id, is_active)
SELECT 'church', p.project_name, p.description, p.project_id, TRUE
FROM public.platform_projects p
WHERE p.service_id = 'church_think'
ON CONFLICT DO NOTHING;
