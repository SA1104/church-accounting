-- =========================================================================
-- Booza Think Platform OS - AI Engine Indexes (004_indexes.sql)
-- =========================================================================

-- AI 장기 기억 시맨틱 회상용 벡터 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_platform_ai_memories_embedding 
ON public.platform_ai_agent_memories USING hnsw (embedding vector_cosine_ops);
