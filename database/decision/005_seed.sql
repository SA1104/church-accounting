-- =========================================================================
-- Booza Think Platform OS - Decision Engine Seeds (005_seed.sql)
-- =========================================================================

-- 기본 의사결정 규칙 예제 등록 (Church Think 예산 초과 경고 규칙)
INSERT INTO platform_decision_rules (service_id, rule_name, metric_key, threshold_value, comparison_operator, opinion_type, description)
VALUES 
  ('church_think', '고액 지출 임계치 심사', 'amount', 10000000.0000, '>=', 'WARNING', '1천만원 이상 고액 지출 전표 발생 시 자동 경고 의견 부착'),
  ('church_think', '예산 초과 집행 보류 권고', 'budget_remaining', 0.0000, '<', 'HOLD', '잔여 부서 예산이 0 미만(예산 초과)일 경우 승인 보류(HOLD) 강제 조치')
ON CONFLICT (rule_id) DO NOTHING;
