-- =========================================================================
-- Booza Think Platform OS - Knowledge Engine Schema (001_schema.sql)
-- =========================================================================

-- platform_knowledge_bases: RAG 기반 지식창고 모음
CREATE TABLE IF NOT EXISTS public.platform_knowledge_bases (
  kb_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.platform_projects(project_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_documents: 지식창고에 속한 개별 문서 원문
CREATE TABLE IF NOT EXISTS public.platform_documents (
  doc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID REFERENCES public.platform_knowledge_bases(kb_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- 문서 텍스트 본문
  file_id UUID REFERENCES public.platform_files(file_id) ON DELETE SET NULL, -- 원본 첨부파일 링크
  metadata JSONB, -- 출처, 카테고리 등 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- platform_document_chunks: 임베딩 및 벡터 유사도 검색용 텍스트 조각
CREATE TABLE IF NOT EXISTS public.platform_document_chunks (
  chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID REFERENCES public.platform_documents(doc_id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- 조각 본문
  embedding vector(1536), -- Vector Embedding 컬럼 (OpenAI 등 대응)
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
