import re

content = open('backend/core/auth/index.js', encoding='utf8').read()

target = """      if (!activeContext) {
        let primary = await query.get(
          "SELECT id, project_id, committee_id, group_id, position_id, role_code FROM public.church_user_assignments WHERE user_id = ? AND is_primary = TRUE AND is_active = TRUE AND status = 'approved' LIMIT 1",
          [profile.user_id]
        );
        if (!primary) {
          primary = await query.get(
            "SELECT id, project_id, committee_id, group_id, position_id, role_code FROM public.church_user_assignments WHERE user_id = ? AND is_active = TRUE AND status = 'approved' ORDER BY assigned_at DESC LIMIT 1",
            [profile.user_id]
          );
        }
        if (primary) {
          projectId = primary.project_id;
          activeContext = {
            assignmentId: primary.id,
            projectId: projectId,
            committeeId: primary.committee_id,
            groupId: primary.group_id,
            positionId: primary.position_id,
            roleCode: primary.role_code
          };
        }
      }"""

replacement = """      if (!activeContext) {
        // Platform User Preference: check if last_context exists
        const pref = await query.get(
          "SELECT preference_value FROM public.platform_user_preferences WHERE user_id = ? AND service_id = 'church_think' AND preference_key = 'last_context'",
          [profile.user_id]
        );
        
        let preferredAssignmentId = null;
        if (pref && pref.preference_value) {
          try {
            const parsed = typeof pref.preference_value === 'string' ? JSON.parse(pref.preference_value) : pref.preference_value;
            preferredAssignmentId = parsed.assignment_id;
          } catch (e) {
            console.warn('[AUTH] Error parsing preference_value:', e);
          }
        }

        let primary = null;
        if (preferredAssignmentId) {
          primary = await query.get(
            "SELECT id, project_id, committee_id, group_id, position_id, role_id, role_code FROM public.church_user_assignments WHERE id = ? AND user_id = ? AND is_active = TRUE AND status = 'approved'",
            [preferredAssignmentId, profile.user_id]
          );
        }

        if (!primary) {
          primary = await query.get(
            "SELECT id, project_id, committee_id, group_id, position_id, role_id, role_code FROM public.church_user_assignments WHERE user_id = ? AND is_primary = TRUE AND is_active = TRUE AND status = 'approved' LIMIT 1",
            [profile.user_id]
          );
        }
        
        if (!primary) {
          primary = await query.get(
            "SELECT id, project_id, committee_id, group_id, position_id, role_id, role_code FROM public.church_user_assignments WHERE user_id = ? AND is_active = TRUE AND status = 'approved' ORDER BY assigned_at DESC LIMIT 1",
            [profile.user_id]
          );
        }

        if (primary) {
          projectId = primary.project_id;
          activeContext = {
            assignmentId: primary.id,
            projectId: projectId,
            committeeId: primary.committee_id,
            groupId: primary.group_id,
            positionId: primary.position_id,
            roleId: primary.role_id,
            roleCode: primary.role_id || primary.role_code // Dual read logic priority
          };
        }
      }"""

if target in content:
    with open('backend/core/auth/index.js', 'w', encoding='utf8') as f:
        f.write(content.replace(target, replacement))
    print('Replaced activeContext resolution correctly.')
else:
    print('Target block not found!')

# Need to also replace the first block that resolves via assignmentId
target2 = """      if (assignmentId) {
        const assignment = await query.get(
          "SELECT project_id, committee_id, group_id, position_id, role_code, status FROM public.church_user_assignments WHERE id = ? AND user_id = ? AND is_active = TRUE",
          [assignmentId, profile.user_id]
        );
        if (assignment && assignment.status === 'approved') {
          projectId = assignment.project_id;
          activeContext = {
            assignmentId: assignment.id,
            projectId: projectId,
            committeeId: assignment.committee_id,
            groupId: assignment.group_id,
            positionId: assignment.position_id,
            roleCode: assignment.role_code
          };
        }
      }"""

replacement2 = """      if (assignmentId) {
        const assignment = await query.get(
          "SELECT project_id, committee_id, group_id, position_id, role_id, role_code, status FROM public.church_user_assignments WHERE id = ? AND user_id = ? AND is_active = TRUE",
          [assignmentId, profile.user_id]
        );
        if (assignment && assignment.status === 'approved') {
          projectId = assignment.project_id;
          activeContext = {
            assignmentId: assignment.id,
            projectId: projectId,
            committeeId: assignment.committee_id,
            groupId: assignment.group_id,
            positionId: assignment.position_id,
            roleId: assignment.role_id,
            roleCode: assignment.role_id || assignment.role_code // Dual read logic priority
          };
        }
      }"""

if target2 in content:
    with open('backend/core/auth/index.js', 'w', encoding='utf8') as f:
        f.write(open('backend/core/auth/index.js', encoding='utf8').read().replace(target2, replacement2))
    print('Replaced first assignment block correctly.')
else:
    print('Target block 2 not found!')
