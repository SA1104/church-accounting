-- =========================================================================
-- Booza Think Platform OS - Distribution Engine Schema (001_schema.sql)
-- =========================================================================

-- 1. 플랫폼 배포 채널 관리
CREATE TABLE IF NOT EXISTS platform_distribution_channels (
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    channel_type VARCHAR(30) NOT NULL,          -- 'YOUTUBE', 'NAVER_BLOG', 'INSTAGRAM'
    channel_name VARCHAR(100) NOT NULL,
    auth_config JSONB,                          -- OAuth 토큰 정보 등
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 외부 채널 발행 로그
CREATE TABLE IF NOT EXISTS platform_distribution_logs (
    publish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES platform_distribution_channels(channel_id) ON DELETE CASCADE,
    content_id UUID NOT NULL,                   -- platform_media_contents 또는 기타 타겟 ID
    status VARCHAR(20) NOT NULL,                -- 'SUCCESS', 'FAILED', 'PENDING'
    response_payload JSONB,
    published_at TIMESTAMP WITH TIME ZONE
);
