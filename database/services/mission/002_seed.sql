-- =========================================================================
-- Booza Think Platform OS - Mission Think Seeds (002_seed.sql)
-- =========================================================================

INSERT INTO mission_donations (project_id, donor_name, amount, missionary_name) VALUES
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '이재정', 500000.00, '아프리카 탄자니아 김선교사 후원'),
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '김회계', 300000.00, '동남아 필리핀 이선교사 후원')
ON CONFLICT (donation_id) DO NOTHING;
