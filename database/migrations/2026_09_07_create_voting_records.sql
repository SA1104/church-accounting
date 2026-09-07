-- Migration: 2026_09_07_create_voting_records
-- Description: Create a table to store individual voting records as evidence for participation rates.

CREATE TABLE IF NOT EXISTS public.politics_voting_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id UUID REFERENCES public.politics_politicians(id) ON DELETE CASCADE,
    bill_id VARCHAR(100) NOT NULL,
    bill_no VARCHAR(50),
    bill_name TEXT,
    vote_date DATE,
    vote_result VARCHAR(50), -- 찬성, 반대, 기권, 결석 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(politician_id, bill_id)
);

-- Index for quick lookups by politician (e.g. to show their timeline)
CREATE INDEX IF NOT EXISTS idx_voting_records_politician ON public.politics_voting_records(politician_id);

-- Index for date sorting
CREATE INDEX IF NOT EXISTS idx_voting_records_date ON public.politics_voting_records(vote_date DESC);
