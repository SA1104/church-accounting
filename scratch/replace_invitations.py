import os

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # In invitations.js
    content = content.replace(
        '''const workspace = await query.get(
      "SELECT workspace_id FROM public.platform_workspaces WHERE project_id = ? AND capability = 'church' LIMIT 1",
      [invite.project_id]
    );
    if (!workspace) {
      return res.status(404).json({ message: '가입할 교회 워크스페이스를 찾을 수 없습니다.' });
    }''',
        '''// workspace logic removed - using project_id directly'''
    )

    content = content.replace("INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status, approved_at, approved_by)", "INSERT INTO public.platform_memberships (user_id, project_id, capability, status, approved_at, approved_by)")
    content = content.replace("ON CONFLICT (user_id, workspace_id) DO UPDATE", "ON CONFLICT (user_id, project_id, capability) DO UPDATE")
    content = content.replace("], [userId, workspace.workspace_id,", "], [userId, invite.project_id,")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file(r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend\service\church\invitations.js")
