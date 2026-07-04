import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Lines 55-60: Remove workspace insertion
    content = re.sub(
        r"// Register workspace in platform_workspaces\s+const wsResult = await query\.run\([\s\S]*?\);\s+workspaceId = wsResult\.id;",
        "workspaceId = newProjectId; // using project_id directly",
        content
    )
    
    # Line 109-114: Remove workspace selection
    content = re.sub(
        r"// Get workspace\s+const workspace = await query\.get\([\s\S]*?\);\s+workspaceId = workspace \? workspace\.workspace_id : null;",
        "workspaceId = projectId; // bypass workspace",
        content
    )
    
    content = content.replace("INSERT INTO public.platform_memberships (user_id, workspace_id, capability, status, approved_at, approved_by)", "INSERT INTO public.platform_memberships (user_id, project_id, capability, status, approved_at, approved_by)")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

process_file(r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend\service\church\onboarding.js")
