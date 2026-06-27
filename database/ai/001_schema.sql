-- =========================================================================
-- Booza Think Platform OS - AI Engine Schema (001_schema.sql)
-- =========================================================================

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

-- platform_ai_agents: 에러 체크, 분석, 마스터 봇 등 AI 에이전트 인스턴스 정보
CREATE TABLE IF NOT EXISTS public.platform_ai_agents (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  role_description TEXT,
  system_prompt TEXT NOT NULL,
  default_model_id VARCHAR(50) REFERENCES public.platform_ai_models(model_id) ON DELETE SET NULL,
  kb_id UUID, -- RAG 지식창고 연동 (아래 platform_knowledge_bases 참조)
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

-- platform_ai_agent_memories: 사용자와 에이전트 간의 장기 기억(Long-term Memory)
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
