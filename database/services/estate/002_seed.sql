-- =========================================================================
-- Booza Think Platform OS - Estate Think Seeds (002_seed.sql)
-- =========================================================================

INSERT INTO estate_properties (project_id, name, address, price) VALUES
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '신길 자이아파트 32평형', '서울특별시 영등포구 신길동 123-45', 1250000000.00),
  ('8a510c4f-c006-4442-8924-f3c75ab73cf6', '여의도 시범아파트 40평형', '서울특별시 영등포구 여의도동 56-78', 2800000000.00)
ON CONFLICT (property_id) DO NOTHING;
