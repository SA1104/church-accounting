-- =========================================================================
-- Booza Think Platform OS - Media Engine Schema (001_schema.sql)
-- =========================================================================

-- 1. 채널별 텍스트 톤앤매너 및 제약사항 관리
CREATE TABLE IF NOT EXISTS platform_media_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_type VARCHAR(30) NOT NULL,          -- 'REPORT', 'BLOG', 'SHORTS', 'YOUTUBE', 'SNS'
    style_name VARCHAR(50) NOT NULL,            -- 'Professional', 'Casual', 'B-grade humour'
    prompt_template TEXT NOT NULL,              -- AI Engine 연동 시 사용할 마스터 템플릿
    max_tokens INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 변환 및 발행된 콘텐츠 이력 테이블
CREATE TABLE IF NOT EXISTS platform_media_contents (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES platform_decisions(decision_id) ON DELETE SET NULL,
    channel_type VARCHAR(30) NOT NULL,
    title VARCHAR(255),
    body_content TEXT NOT NULL,                 -- 생성된 리포트/대본 본문
    visual_suggestion TEXT,                    -- AI 이미지 생성 프롬프트 제안
    metadata JSONB,                             -- 해시태그 목록, 오디오 큐 시간 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 외부 퍼블리싱 발행 매체(채널) 관리 테이블
CREATE TABLE IF NOT EXISTS platform_media_channels (
    channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES platform_projects(project_id) ON DELETE CASCADE,
    channel_type VARCHAR(30) NOT NULL,          -- 'YOUTUBE', 'NAVER_BLOG', 'INSTAGRAM'
    channel_name VARCHAR(100) NOT NULL,
    auth_config JSONB,                          -- API 토큰, 인증 정보 등
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 외부 채널 실제 업로드 발행 로그
CREATE TABLE IF NOT EXISTS platform_media_publish_logs (
    publish_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES platform_media_contents(content_id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES platform_media_channels(channel_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,                -- 'SUCCESS', 'FAILED', 'PENDING'
    response_payload JSONB,
    published_at TIMESTAMP WITH TIME ZONE
);
