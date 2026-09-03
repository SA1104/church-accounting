BEGIN;
-- 정상 주석
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 1. Writer 전용 Policy 전체 삭제
DROP POLICY IF EXISTS "writer_select_stock_instruments" ON public.stock_instruments;
DROP POLICY IF EXISTS "writer_insert_stock_instruments" ON public.stock_instruments;
DROP POLICY IF EXISTS "writer_update_stock_instruments" ON public.stock_instruments;
DROP POLICY IF EXISTS "writer_select_stock_instrument_venues" ON public.stock_instrument_venues;
DROP POLICY IF EXISTS "writer_insert_stock_instrument_venues" ON public.stock_instrument_venues;
DROP POLICY IF EXISTS "writer_update_stock_instrument_venues" ON public.stock_instrument_venues;
DROP POLICY IF EXISTS "writer_select_stock_daily_bars" ON public.stock_daily_bars;
DROP POLICY IF EXISTS "writer_insert_stock_daily_bars" ON public.stock_daily_bars;
DROP POLICY IF EXISTS "writer_select_stock_index_daily_bars" ON public.stock_index_daily_bars;
DROP POLICY IF EXISTS "writer_select_stock_ingestion_runs" ON public.stock_ingestion_runs;
DROP POLICY IF EXISTS "writer_insert_stock_ingestion_runs" ON public.stock_ingestion_runs;
DROP POLICY IF EXISTS "writer_update_stock_ingestion_runs" ON public.stock_ingestion_runs;
DROP POLICY IF EXISTS "writer_select_stock_data_sources" ON public.stock_data_sources;
DROP POLICY IF EXISTS "writer_select_stock_indices" ON public.stock_indices;
DROP POLICY IF EXISTS "writer_select_stock_markets" ON public.stock_markets;

-- 2. 대상 9개 테이블 권한 전부 회수 (Fail-closed 상태 전환)
REVOKE ALL ON TABLE public.stock_instruments FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_instrument_venues FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_daily_bars FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_index_daily_bars FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_ingestion_runs FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_data_sources FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_indices FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_markets FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_session_snapshots FROM stock_ingestion_writer;

-- 3. 확인된 Stock 전용 Sequence 권한 전체 회수
REVOKE ALL ON SEQUENCE public.stock_instruments_id_seq FROM stock_ingestion_writer;
REVOKE ALL ON SEQUENCE public.stock_data_sources_id_seq FROM stock_ingestion_writer;

-- 4. public 스키마 접근 자체를 차단 (최후 방어)
REVOKE USAGE ON SCHEMA public FROM stock_ingestion_writer;

COMMIT;
