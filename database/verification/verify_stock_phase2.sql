-- ==============================================================================
-- Stock Think Phase 2C Migration Verification Script
-- Read-Only: Do NOT run this if it contains INSERT/UPDATE/DELETE/DROP
-- Run this AFTER all Phase 2C migrations are applied.
-- ==============================================================================

-- 1. Check Tables Existence (Expected 18 tables)
SELECT 
  'Table Existence' AS check_type,
  table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = expected.table_name
  ) AS is_present
FROM (
  VALUES 
    ('stock_data_sources'), ('stock_markets'), ('stock_instruments'), ('stock_instrument_venues'),
    ('stock_trading_calendar'), ('stock_indices'), ('stock_daily_bars'), ('stock_session_snapshots'),
    ('stock_index_daily_bars'), ('stock_macro_series'), ('stock_macro_observations'),
    ('stock_source_documents'), ('stock_daily_briefs'), ('stock_daily_brief_items'),
    ('stock_brief_item_sources'), ('stock_ingestion_runs'), ('stock_ingestion_errors'),
    ('stock_data_quality_issues')
) AS expected(table_name)
ORDER BY table_name;

-- 2. Check Constraints (Foreign Keys, Primary Keys)
SELECT
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name LIKE 'stock_%'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type;

-- 3. Check Indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'stock_%'
ORDER BY tablename, indexname;

-- 4. Check Row Level Security (RLS) enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname LIKE 'stock_%' AND relkind = 'r'
ORDER BY relname;

-- 5. Check Policies (Roles, Commands, Types)
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'stock_%'
ORDER BY tablename, policyname;

-- 6. Verify No Public Write Policies exist
SELECT 
    'WARNING: PUBLIC WRITE POLICY EXISTS!' AS alert,
    tablename, 
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'stock_%'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  AND ('public' = ANY(roles) OR 'anon' = ANY(roles) OR 'authenticated' = ANY(roles));

-- 7. Count Tables Row
SELECT
  (SELECT count(*) FROM public.stock_instruments) as inst_count,
  (SELECT count(*) FROM public.stock_daily_bars) as bars_count,
  (SELECT count(*) FROM public.stock_session_snapshots) as snap_count,
  (SELECT count(*) FROM public.stock_macro_observations) as macro_count;

-- 8. Overall Error Verification
WITH error_checks AS (
    SELECT count(*) AS c FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'stock_%' AND table_name NOT IN ('stock_watchlists', 'stock_quotes')
)
SELECT
  CASE 
    WHEN c >= 18 THEN 'PASSED: All 18 expected tables exist.'
    ELSE 'FAILED: Missing tables.'
  END AS overall_status
FROM error_checks;
