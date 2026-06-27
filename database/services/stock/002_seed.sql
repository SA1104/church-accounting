-- =========================================================================
-- Booza Think Platform OS - Stock Think Seeds (002_seed.sql)
-- =========================================================================

INSERT INTO stock_quotes (ticker, company_name, current_price, change_percent) VALUES
  ('AAPL', 'Apple Inc.', 175.50, 1.20),
  ('MSFT', 'Microsoft Corporation', 415.60, -0.45),
  ('GOOGL', 'Alphabet Inc.', 150.22, 0.85),
  ('TSLA', 'Tesla Inc.', 180.19, -2.10)
ON CONFLICT (quote_id) DO NOTHING;
