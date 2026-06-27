-- =========================================================================
-- Booza Think Platform OS - Workflow Engine Indexes (004_indexes.sql)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_workflows_service ON platform_workflows(service_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_wf ON platform_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_history_wf ON platform_workflow_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_history_project ON platform_workflow_history(project_id);
