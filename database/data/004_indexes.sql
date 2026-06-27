-- =========================================================================
-- Booza Think Platform OS - Data Engine Indexes (004_indexes.sql)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_data_sources_service ON platform_data_sources(service_id);
