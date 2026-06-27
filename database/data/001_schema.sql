-- =========================================================================
-- Booza Think Platform OS - Data Engine Schema (001_schema.sql)
-- =========================================================================

-- 1. 플랫폼 데이터 공급원 정보 관리
CREATE TABLE IF NOT EXISTS platform_data_sources (
    source_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id VARCHAR(50) NOT NULL REFERENCES platform_services(service_id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(30) NOT NULL,          -- 'API', 'CRAWLER', 'FILE'
    collection_interval VARCHAR(20) NOT NULL,   -- 'REALTIME', 'DAILY', 'WEEKLY'
    license_info TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
