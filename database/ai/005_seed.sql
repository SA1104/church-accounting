-- =========================================================================
-- Booza Think Platform OS - AI Engine Seeds (005_seed.sql)
-- =========================================================================

-- 기본 AI 모델 연동
INSERT INTO platform_ai_models (model_id, provider, api_endpoint, pricing_info, is_active) VALUES
  ('gpt-4o', 'OpenAI', 'https://api.openai.com/v1/chat/completions', '{"input_1k": 0.005, "output_1k": 0.015}', TRUE),
  ('claude-3-5-sonnet', 'Anthropic', 'https://api.anthropic.com/v1/messages', '{"input_1k": 0.003, "output_1k": 0.015}', TRUE),
  ('gemini-1.5-pro', 'Google', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', '{"input_1k": 0.007, "output_1k": 0.021}', TRUE)
ON CONFLICT (model_id) DO NOTHING;
