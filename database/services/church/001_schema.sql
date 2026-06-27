-- =========================================================================
-- Booza Think Platform OS - Church Think Schema (001_schema.sql)
-- =========================================================================

-- church_departments: 교회 부서 구조 (프로젝트 단위 격리)
CREATE TABLE IF NOT EXISTS public.church_departments (
  department_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES public.church_departments(department_id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, parent_id, name)
);

-- church_user_metadata: 교인 세부 권한 정보
CREATE TABLE IF NOT EXISTS public.church_user_metadata (
  user_id UUID PRIMARY KEY REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES public.church_departments(department_id) ON DELETE SET NULL,
  position VARCHAR(100) NOT NULL DEFAULT '기타',
  signature TEXT
);

-- church_account_categories: 계정과목 코드
CREATE TABLE IF NOT EXISTS public.church_account_categories (
  category_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- INCOME / EXPENSE
  parent_category VARCHAR(100) NOT NULL,
  child_category VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- church_vouchers: 전표 마스터 (헤더)
CREATE TABLE IF NOT EXISTS public.church_vouchers (
  voucher_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  writer_id UUID NOT NULL REFERENCES public.platform_profiles(user_id),
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- INCOME / EXPENSE
  summary TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'TEMP' NOT NULL, -- TEMP, SUBMITTED, APPROVED, REJECTED
  reject_reason TEXT,
  memo TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- church_voucher_items: 전표 내역 상세 (1:N 다중 분개)
CREATE TABLE IF NOT EXISTS public.church_voucher_items (
  item_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES public.church_account_categories(category_id),
  amount NUMERIC(15, 2) NOT NULL,
  vendor VARCHAR(100),
  payment_method VARCHAR(50) DEFAULT 'CARD',
  memo TEXT
);

-- church_receipts: 전표 증빙 매핑
CREATE TABLE IF NOT EXISTS public.church_receipts (
  receipt_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.platform_files(file_id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0
);

-- church_approval_lines: 전자결재 결재선
CREATE TABLE IF NOT EXISTS public.church_approval_lines (
  line_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.platform_profiles(user_id),
  step_number INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (voucher_id, step_number)
);

-- church_approval_actions: 전자결재 승인 활동 이력
CREATE TABLE IF NOT EXISTS public.church_approval_actions (
  action_id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL REFERENCES public.church_vouchers(voucher_id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.platform_profiles(user_id),
  action VARCHAR(50) NOT NULL, -- SUBMIT, APPROVE, REJECT, CANCEL
  comment TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- church_ledgers: 월 장부
CREATE TABLE IF NOT EXISTS public.church_ledgers (
  ledger_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  year_month VARCHAR(20) NOT NULL,
  carry_over NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_income NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_expense NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'TEMP' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, year_month)
);

-- church_settlements: 최종 결산보고
CREATE TABLE IF NOT EXISTS public.church_settlements (
  settlement_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES public.church_departments(department_id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  half_cycle VARCHAR(20) NOT NULL,
  budget_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_income NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  total_expense NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'TEMP' NOT NULL,
  note TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (department_id, fiscal_year, half_cycle)
);

-- church_closing_periods: 회계 기수 마감
CREATE TABLE IF NOT EXISTS public.church_closing_periods (
  period_id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL,
  period_value VARCHAR(50) NOT NULL,
  is_locked INTEGER DEFAULT 1,
  locked_by UUID REFERENCES public.platform_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (project_id, period_type, period_value)
);
