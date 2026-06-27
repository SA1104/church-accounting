-- =========================================================================
-- Booza Think Platform OS - Media Engine Seeds (005_seed.sql)
-- =========================================================================

-- 기본 미디어 톤앤매너 템플릿 등록
INSERT INTO platform_media_templates (channel_type, style_name, prompt_template, max_tokens)
VALUES 
  ('REPORT', 'Professional', '당신은 플랫폼 재정 진단 전문가입니다. 의사결정 결과 {opinion} 및 점수 {score}를 참고하여 전문적인 마크다운 보고서를 작성해 주세요.', 3000),
  ('BLOG', 'Casual', '안녕하세요! 오늘 소개해드릴 AI 진단 결과는 {opinion} 입니다. 친절한 대화체로 블로그 포스트를 생성해 주세요.', 2000),
  ('SHORTS', 'Professional', '[00:00 - 00:03] 충격적인 AI 분석 결과! {opinion} [00:03 - 00:15] 세부 진단 내용을 숏츠 대본 형태로 작성하세요.', 1000),
  ('YOUTUBE', 'Professional', '유튜브 동영상 전체 큐시트 및 스크립트를 작성해 주세요. 핵심 점수: {score}', 4000),
  ('SNS', 'Casual', '카드뉴스 본문 가이드라인 및 태그 생성: 점수 {score} #AI #의사결정', 1000)
ON CONFLICT (template_id) DO NOTHING;
