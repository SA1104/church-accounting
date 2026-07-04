-- =========================================================================
-- Booza Think Platform OS - Platform Core Schema (001_schema.sql)
-- =========================================================================

-- platform_profiles: auth.users ? 1:1 ?곕룞?섎뒗 ?ъ슜???뺣낫
CREATE TABLE IF NOT EXISTS public.platform_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_services: ?뚮옯?쇱뿉 ?묒옱???쒕퉬??醫낅쪟
CREATE TABLE IF NOT EXISTS public.platform_services (
  service_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_organizations: 理쒖긽??議곗쭅/洹몃９ ?⑥쐞 ?뚮꼳??
CREATE TABLE IF NOT EXISTS public.platform_organizations (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_projects: ?쒕퉬???댁쓽 寃⑸━???ㅼ젣 ?댁쁺 ?꾨줈?앺듃 (?? ?좉만援먰쉶, ?щ옉援먰쉶)
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

-- platform_roles: ?꾩뿭 ??븷 留덉뒪??
CREATE TABLE IF NOT EXISTS public.platform_roles (
  role_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- platform_project_members: ?꾨줈?앺듃???뚯냽??硫ㅻ쾭 諛?沅뚰븳
CREATE TABLE IF NOT EXISTS public.platform_memberships (
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  role_id VARCHAR(50) REFERENCES public.platform_roles(role_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id)
);

-- platform_role_assignments: ?ъ슜?먯쓽 ??븷 吏??
CREATE TABLE IF NOT EXISTS public.platform_role_assignments (
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  service_id VARCHAR(50) NOT NULL REFERENCES public.platform_services(service_id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  role_id VARCHAR(50) REFERENCES public.platform_roles(role_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, service_id, project_id, role_id)
);

-- platform_workflows: ?ㅽ뻾???먮룞???뚰겕?뚮줈???뺤쓽
CREATE TABLE IF NOT EXISTS public.platform_workflows (
  workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_workflow_steps: ?뚰겕?뚮줈???④퀎
CREATE TABLE IF NOT EXISTS public.platform_workflow_steps (
  step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.platform_workflows(workflow_id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  handler_type VARCHAR(50) NOT NULL, -- 'AI_PROMPT', 'COLLECT', 'NOTIFICATION'
  config JSONB,
  UNIQUE (workflow_id, step_number)
);

-- platform_tasks: 媛쒕퀎 ?④퀎 ?ㅽ뻾???섑빐 湲곕룞???쒖뒪?ъ쓽 ?몄뒪?댁뒪 ?뺣낫
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

-- platform_tags: ?ㅻぉ??寃??諛?洹몃９?붾? ?꾪븳 怨듯넻 ?쒓렇
CREATE TABLE IF NOT EXISTS public.platform_tags (
  tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(10) DEFAULT '#808080',
  description TEXT
);

-- platform_tag_maps: ?쒓렇? ?꾩쓽 媛앹껜 媛꾩쓽 愿怨??ㅼ젙
CREATE TABLE IF NOT EXISTS public.platform_tag_maps (
  tag_id UUID REFERENCES public.platform_tags(tag_id) ON DELETE CASCADE,
  related_table VARCHAR(100) NOT NULL, -- 'church_vouchers', 'estate_properties' ??
  related_id VARCHAR(100) NOT NULL, -- ????덉퐫?쒖쓽 UUID ?먮뒗 INTEGER 湲곕낯??
  PRIMARY KEY (tag_id, related_table, related_id)
);

-- platform_events: ?대깽??湲곕컲 泥섎━瑜??꾪븳 ?대깽??踰꾩뒪 濡쒓렇
CREATE TABLE IF NOT EXISTS public.platform_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL, -- 'VOUCHER_SUBMITTED', 'OCR_COMPLETED' ??
  payload JSONB,
  triggered_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_files: ?ㅽ넗由ъ????낅줈?쒕맂 ?뚯씪 ?뺣낫 硫뷀?
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

-- platform_search_indexes: ?듯빀 寃?됱쓣 吏?먰븯???몃뜳???뚯씠釉?
CREATE TABLE IF NOT EXISTS public.platform_search_indexes (
  index_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  related_table VARCHAR(100) NOT NULL,
  related_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_notifications: ?뚮┝ 蹂닿???
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

-- platform_audit_logs: ?쒖뒪???댁쁺 媛먯궗 濡쒓렇
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  service_id VARCHAR(50) REFERENCES public.platform_services(service_id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  result VARCHAR(20) DEFAULT 'SUCCESS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_integrations: ?몃? API 諛??쒕퉬???곕룞 ?ㅼ젙 ?뺣낫
CREATE TABLE IF NOT EXISTS public.platform_integrations (
  integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'OPENAI', 'ANTHROPIC', 'KIS', 'UPBIT', 'SLACK', 'TELEGRAM'
  api_key TEXT NOT NULL,
  api_secret TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_api_keys: ?쒕뱶?뚰떚 諛??몃? 遊뉗쓣 ?꾪븳 API Key 諛쒓툒
CREATE TABLE IF NOT EXISTS public.platform_api_keys (
  key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  scopes TEXT[],
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- billing_stubs: 怨쇨툑 援щ룆 ?곹깭 ?뺣낫 ?ㅽ뀅
CREATE TABLE IF NOT EXISTS public.billing_stubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  tier VARCHAR(50) DEFAULT 'Free',
  status VARCHAR(50) DEFAULT 'ACTIVE',
  amount NUMERIC(15, 2) DEFAULT 0.00,
  billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
  next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- usage_stubs: ?ъ슜??怨꾩륫 ?듦퀎 ?뺣낫 ?ㅽ뀅
CREATE TABLE IF NOT EXISTS public.usage_stubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL, -- 'LLM_TOKEN', 'OCR', 'STORAGE', etc.
  quantity NUMERIC(15, 2) DEFAULT 0.00,
  unit VARCHAR(20) DEFAULT 'COUNT',
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- governance_stubs: 嫄곕쾭?뚯뒪 ?쒖뼱 愿由??뺣낫 ?ㅽ뀅
CREATE TABLE IF NOT EXISTS public.governance_stubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_type VARCHAR(50) NOT NULL, -- 'PRODUCT', 'PLUGIN', 'ENGINE', etc.
  item_key VARCHAR(100) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (registry_type, item_key)
);

CREATE INDEX IF NOT EXISTS idx_billing_stubs_project ON public.billing_stubs(project_id);
CREATE INDEX IF NOT EXISTS idx_usage_stubs_project ON public.usage_stubs(project_id);
CREATE INDEX IF NOT EXISTS idx_governance_stubs_type ON public.governance_stubs(registry_type);

-- platform_registries: ?뚮옯???듯빀 ?숈쟻 ?덉??ㅽ듃由?(TEAM F)
CREATE TABLE IF NOT EXISTS public.platform_registries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_type VARCHAR(50) NOT NULL, -- 'PRODUCT', 'ENGINE', 'PLUGIN', 'DATASET', 'API', 'VERSION', 'MIGRATION', 'BILLING', 'LICENSE'
  item_key VARCHAR(100) NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  version VARCHAR(50) DEFAULT '1.0.0',
  owner VARCHAR(100) DEFAULT 'PLATFORM_ADMIN',
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (registry_type, item_key)
);

-- decision_histories: ?뚮옯???섏궗寃곗젙 ?대젰 愿由?諛?異붿쟻 (TEAM E)
CREATE TABLE IF NOT EXISTS public.decision_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  service_id VARCHAR(50) NOT NULL,
  decision_score INTEGER NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  recommendation TEXT NOT NULL,
  alternative JSONB DEFAULT '[]'::jsonb,
  risk TEXT,
  opportunity TEXT,
  reason TEXT,
  evidence JSONB DEFAULT '[]'::jsonb,
  expected_impact TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  action VARCHAR(100) NOT NULL,
  timeline VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Generated', -- 'Generated', 'Reviewed', 'Approved', 'Executed', 'Measured', 'Learned', 'Archived'
  outcome_measurement JSONB DEFAULT '{}'::jsonb,
  learned_deviation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_registries_type ON public.platform_registries(registry_type);
CREATE INDEX IF NOT EXISTS idx_decision_histories_project ON public.decision_histories(project_id);
CREATE INDEX IF NOT EXISTS idx_decision_histories_status ON public.decision_histories(status);

