-- =========================================================================
-- Booza Think Platform OS - Distribution Engine Indexes (004_indexes.sql)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_dist_channels_project ON platform_distribution_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_dist_logs_channel ON platform_distribution_logs(channel_id);
