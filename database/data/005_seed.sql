-- =========================================================================
-- Booza Think Platform OS - Data Engine Seeds (005_seed.sql)
-- =========================================================================

-- unique_source_key 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_source_key'
  ) THEN
    ALTER TABLE platform_data_sources 
    ADD CONSTRAINT unique_source_key 
    UNIQUE (service_id, source_name);
  END IF;
END $$;

-- 기본 데이터 소스 예제
INSERT INTO platform_data_sources (service_id, source_name, source_type, collection_interval, license_info)
VALUES 
  ('church_think', '교회 재정 전표 내역', 'API', 'REALTIME', '내부 재정 전용'),
  ('stock_think', '한국거래소 일별 주가', 'API', 'DAILY', 'KRX OpenAPI 유료 계약')
ON CONFLICT (service_id, source_name) DO NOTHING;
