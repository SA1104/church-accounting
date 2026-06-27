-- =========================================================================
-- Booza Think Platform OS - Knowledge Engine Indexes (004_indexes.sql)
-- =========================================================================

-- 지식 문서 조각 HNSW 벡터 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_platform_doc_chunks_embedding 
ON public.platform_document_chunks USING hnsw (embedding vector_cosine_ops);
