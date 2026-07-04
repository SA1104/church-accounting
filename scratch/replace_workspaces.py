import os
import re

directories = [
    r"C:\Users\new-s\.gemini\antigravity\scratch\church-accounting\backend\service\church"
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Replace workspace_id with project_id in SQL queries
    content = content.replace("platform_workspaces WHERE project_id = ?", "platform_projects WHERE project_id = ?")
    content = content.replace("platform_workspaces w ON m.workspace_id = w.workspace_id", "platform_projects p ON m.project_id = p.project_id")
    content = content.replace("m.workspace_id = w.workspace_id", "m.project_id = p.project_id")
    
    # In memberships ON CONFLICT (user_id, workspace_id)
    content = content.replace("ON CONFLICT (user_id, workspace_id)", "ON CONFLICT (user_id, project_id, capability)")
    content = content.replace("ON CONFLICT (user_id, workspace_id, capability)", "ON CONFLICT (user_id, project_id, capability)")
    
    # In platform_memberships INSERT
    content = content.replace("(user_id, workspace_id, capability", "(user_id, project_id, capability")
    
    # In specific JS variables
    content = content.replace("workspace.workspace_id", "invite.project_id")
    content = content.replace("workspace_id,", "project_id,")
    content = content.replace("workspace_id ", "project_id ")
    content = content.replace("workspace_id =", "project_id =")
    
    # Replace any leftover platform_workspaces
    content = content.replace("public.platform_workspaces", "public.platform_projects")

    # In onboarding.js
    content = content.replace("INSERT INTO public.platform_projects (capability, name, project_id, is_active)", "/* legacy workspace insert removed */ -- ")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".js"):
                process_file(os.path.join(root, file))
