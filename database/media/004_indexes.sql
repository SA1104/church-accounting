-- =========================================================================
-- Booza Think Platform OS - Media Engine Indexes (004_indexes.sql)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_media_templates_channel ON platform_media_templates(channel_type);
CREATE INDEX IF NOT EXISTS idx_media_contents_decision ON platform_media_contents(decision_id);
CREATE INDEX IF NOT EXISTS idx_media_channels_project ON platform_media_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_media_publish_logs_content ON platform_media_publish_logs(content_id);
