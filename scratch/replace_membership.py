import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace SQL public.platform_workspaces and workspace_id
    content = content.replace("public.platform_workspaces w ON m.workspace_id = w.workspace_id", "public.platform_projects p ON m.project_id = p.project_id")
    content = content.replace("w.workspace_id", "m.project_id")
    
    # 1. router.get('/status'
    content = content.replace(
        '''const workspace = await query.get(
      "SELECT workspace_id, name FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
      [projectId]
    );''',
        '''const project = await query.get(
      "SELECT project_id, project_name as name FROM public.platform_projects WHERE project_id = ? LIMIT 1",
      [projectId]
    );'''
    )
    content = content.replace("if (!workspace) {", "if (!project) {")
    content = content.replace("workspace.workspace_id", "project.project_id")
    content = content.replace("workspace.name", "project.name")
    
    # 2. SELECT membership_id, status FROM public.platform_memberships WHERE user_id = ? AND workspace_id = ?
    content = content.replace("AND workspace_id = ?", "AND project_id = ?")
    
    # 3. router.get('/me'
    content = content.replace("SELECT m.membership_id, m.status, m.created_at, w.name as church_name, w.workspace_id", "SELECT m.membership_id, m.status, m.created_at, p.project_name as church_name, m.project_id")
    
    # 4. router.post('/apply'
    content = content.replace("const { churchProfileId, workspaceId } = req.body;", "const { churchProfileId, workspaceId, projectId } = req.body;")
    content = content.replace("let resolvedWorkspaceId = workspaceId;", "let resolvedProjectId = projectId || workspaceId;")
    content = content.replace(
        '''if (!resolvedWorkspaceId && churchProfileId) {
      const church = await query.get('SELECT project_id FROM public.church_profiles WHERE church_id = ?', [churchProfileId]);
      if (church) {
        const workspace = await query.get(
          "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
          [church.project_id]
        );
        if (workspace) resolvedWorkspaceId = workspace.workspace_id;
      }
    }''',
        '''if (!resolvedProjectId && churchProfileId) {
      const church = await query.get('SELECT project_id FROM public.church_profiles WHERE church_id = ?', [churchProfileId]);
      if (church) {
        resolvedProjectId = church.project_id;
      }
    }'''
    )
    
    content = content.replace("if (!resolvedWorkspaceId) {", "if (!resolvedProjectId) {")
    content = content.replace(
        '''const workspace = await query.get(
      "SELECT workspace_id, project_id, name FROM public.platform_workspaces WHERE workspace_id = ? LIMIT 1",
      [resolvedWorkspaceId]
    );''',
        '''const project = await query.get(
      "SELECT project_id, project_name as name FROM public.platform_projects WHERE project_id = ? LIMIT 1",
      [resolvedProjectId]
    );'''
    )
    
    content = content.replace("INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status)", "INSERT INTO public.platform_memberships (user_id, project_id, capability, status)")
    content = content.replace("ON CONFLICT (user_id, workspace_id) DO UPDATE", "ON CONFLICT (user_id, project_id, capability) DO UPDATE")
    content = content.replace("], [userId, resolvedWorkspaceId]);", "], [userId, resolvedProjectId]);")
    
    content = content.replace("{ workspace_id: resolvedWorkspaceId, capability: 'church' }", "{ project_id: resolvedProjectId, capability: 'church' }")
    content = content.replace("{ workspace_id: membership.workspace_id, capability: 'church' }", "{ project_id: membership.project_id, capability: 'church' }")
    
    # 5. admin/memberships/pending
    content = content.replace(
        '''const workspace = await query.get(
      "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
      [projectId]
    );

    if (!workspace) return res.json([]);''',
        ''''''
    )
    content = content.replace("WHERE m.workspace_id = ? AND m.status = 'pending'", "WHERE m.project_id = ? AND m.status = 'pending'")
    content = content.replace("], [workspace.workspace_id]);", "], [projectId]);")

    # 6. approve & reject
    content = content.replace("SELECT user_id, workspace_id, status", "SELECT user_id, project_id, status")
    content = content.replace("SELECT user_id, workspace_id FROM", "SELECT user_id, project_id FROM")
    
    content = content.replace(
        '''const workspace = await query.get(
      "SELECT project_id, name FROM public.platform_workspaces WHERE workspace_id = ? LIMIT 1",
      [membership.workspace_id]
    );''',
        '''const project = await query.get(
      "SELECT project_id, project_name as name FROM public.platform_projects WHERE project_id = ? LIMIT 1",
      [membership.project_id]
    );'''
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file(r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend\service\church\membership.js")
