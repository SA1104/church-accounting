-- =========================================================================
-- Booza Think Platform OS - AI Engine Functions (002_functions.sql)
-- =========================================================================

-- platform_ai_agent_memories updated_at 트리거 생성
CREATE OR REPLACE FUNCTION public.update_platform_memories_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_platform_memories_timestamp ON public.platform_ai_agent_memories;
CREATE TRIGGER trg_update_platform_memories_timestamp
  BEFORE UPDATE ON public.platform_ai_agent_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_memories_timestamp();
