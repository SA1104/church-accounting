-- =========================================================================
-- Booza Think Platform OS - Decision Engine Indexes (004_indexes.sql)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_decision_rules_service ON platform_decision_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON platform_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_service ON platform_decisions(service_id);
CREATE INDEX IF NOT EXISTS idx_decision_metrics_dec ON platform_decision_metrics(decision_id);
