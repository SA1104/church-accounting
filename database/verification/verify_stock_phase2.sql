-- ==============================================================================
-- Stock Think Phase 2C Migration Verification Script
-- Read-Only: Do NOT run this if it contains INSERT/UPDATE/DELETE/DROP
-- Run this AFTER all Phase 2A/2B migrations are applied.
-- ==============================================================================

-- 1. Check Tables Existence
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'stock_%'
ORDER BY table_name;

-- 2. Check Constraints (Foreign Keys, Primary Keys)
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'stock_%';

-- 3. Check Row Level Security (RLS) enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname LIKE 'stock_%' AND relkind = 'r';

-- 4. Check Seeded Reference Data
SELECT provider_id, market_code, name_ko, is_active 
FROM public.stock_market_reference
ORDER BY market_code;

-- 5. Count Tables Row
SELECT
  (SELECT count(*) FROM public.stock_market_reference) as ref_count,
  (SELECT count(*) FROM public.stock_instruments) as inst_count,
  (SELECT count(*) FROM public.stock_daily_bars) as bars_count,
  (SELECT count(*) FROM public.stock_snapshot_metrics) as snap_count;
