-- =========================================================================
-- Booza Think Platform OS - Distribution Engine Seeds (005_seed.sql)
-- =========================================================================

-- unique_dist_channel_key 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_dist_channel_key'
  ) THEN
    ALTER TABLE platform_distribution_channels 
    ADD CONSTRAINT unique_dist_channel_key 
    UNIQUE (project_id, channel_type, channel_name);
  END IF;
END $$;
