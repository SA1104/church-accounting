BEGIN;

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 정치인 마스터
CREATE TABLE IF NOT EXISTS politics_politicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    birth_place VARCHAR(100),
    gender VARCHAR(10),
    profile_image_url TEXT,
    namuwiki_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 선거 마스터 
CREATE TABLE IF NOT EXISTS politics_elections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    election_type VARCHAR(50) NOT NULL, -- '총선', '지방선거', '대선', '재보궐'
    election_name VARCHAR(100) NOT NULL,
    election_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 정치인 출마 이력
CREATE TABLE IF NOT EXISTS politics_election_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID REFERENCES politics_politicians(id) ON DELETE CASCADE,
    election_id UUID REFERENCES politics_elections(id) ON DELETE CASCADE,
    party_at_the_time VARCHAR(100),
    constituency VARCHAR(100),
    vote_rate NUMERIC(5,2),
    vote_rank INTEGER,
    is_elected BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(politician_id, election_id)
);

-- 4. 연도별 스탯 스냅샷
CREATE TABLE IF NOT EXISTS politics_annual_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID REFERENCES politics_politicians(id) ON DELETE CASCADE,
    record_year INTEGER NOT NULL,
    declared_wealth BIGINT,
    pledge_fulfillment_rate NUMERIC(5,2),
    attendance_rate NUMERIC(5,2),
    buzz_index INTEGER,
    approval_rating NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(politician_id, record_year)
);

-- 5. 강점 및 약점 키워드
CREATE TABLE IF NOT EXISTS politics_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID REFERENCES politics_politicians(id) ON DELETE CASCADE,
    keyword_type VARCHAR(20) NOT NULL, -- 'STRENGTH', 'WEAKNESS', 'CONTROVERSY'
    keyword VARCHAR(50) NOT NULL,
    description TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_politics_elec_hist_politician ON politics_election_history(politician_id);
CREATE INDEX IF NOT EXISTS idx_politics_annual_stats_politician ON politics_annual_stats(politician_id);
CREATE INDEX IF NOT EXISTS idx_politics_keywords_politician ON politics_keywords(politician_id);

COMMIT;
