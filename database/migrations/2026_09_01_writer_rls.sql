BEGIN;
-- 정상 주석
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 1. 스키마 권한 회수
REVOKE CREATE ON SCHEMA public FROM stock_ingestion_writer;

-- 2. 9개 테이블 개별 권한 초기화 (기존 초과 권한 회수)
REVOKE ALL ON TABLE public.stock_instruments FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_instrument_venues FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_daily_bars FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_index_daily_bars FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_ingestion_runs FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_data_sources FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_indices FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_markets FROM stock_ingestion_writer;
REVOKE ALL ON TABLE public.stock_session_snapshots FROM stock_ingestion_writer;

-- 3. 실제 백필에서 수정하는 2개 테이블 (SELECT, INSERT, UPDATE)
GRANT SELECT, INSERT ON TABLE public.stock_daily_bars TO stock_ingestion_writer;
GRANT SELECT, INSERT, UPDATE ON TABLE public.stock_ingestion_runs TO stock_ingestion_writer;

-- 4. 참조(읽기)만 하는 6개 테이블 (SELECT)
GRANT SELECT ON TABLE public.stock_instruments TO stock_ingestion_writer;
GRANT SELECT ON TABLE public.stock_instrument_venues TO stock_ingestion_writer;
GRANT SELECT ON TABLE public.stock_index_daily_bars TO stock_ingestion_writer;
GRANT SELECT ON TABLE public.stock_data_sources TO stock_ingestion_writer;
GRANT SELECT ON TABLE public.stock_indices TO stock_ingestion_writer;
GRANT SELECT ON TABLE public.stock_markets TO stock_ingestion_writer;

-- 5. Sequence 권한은 실제 쓰기가 없으므로 불필요 (기존 부여 내역 회수)
REVOKE ALL ON SEQUENCE public.stock_instruments_id_seq FROM stock_ingestion_writer;
REVOKE ALL ON SEQUENCE public.stock_data_sources_id_seq FROM stock_ingestion_writer;

-- 6. 기존 Writer Policy 삭제 (멱등성)
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

-- 7. 실제 필요한 Policy만 생성
-- 쓰기 대상 테이블
CREATE POLICY "writer_select_stock_daily_bars" ON public.stock_daily_bars FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_insert_stock_daily_bars" ON public.stock_daily_bars FOR INSERT TO stock_ingestion_writer WITH CHECK (true);

CREATE POLICY "writer_select_stock_ingestion_runs" ON public.stock_ingestion_runs FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_insert_stock_ingestion_runs" ON public.stock_ingestion_runs FOR INSERT TO stock_ingestion_writer WITH CHECK (true);
CREATE POLICY "writer_update_stock_ingestion_runs" ON public.stock_ingestion_runs FOR UPDATE TO stock_ingestion_writer USING (true) WITH CHECK (true);

-- 읽기 대상 테이블
CREATE POLICY "writer_select_stock_instruments" ON public.stock_instruments FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_select_stock_instrument_venues" ON public.stock_instrument_venues FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_select_stock_index_daily_bars" ON public.stock_index_daily_bars FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_select_stock_data_sources" ON public.stock_data_sources FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_select_stock_indices" ON public.stock_indices FOR SELECT TO stock_ingestion_writer USING (true);
CREATE POLICY "writer_select_stock_markets" ON public.stock_markets FOR SELECT TO stock_ingestion_writer USING (true);

COMMIT;
