// backend/service/church/db_init.js
// Church Think - Database Migrations & Initial Seeding (Platform 3.1)
// Self-executing capability DDL and seed logic, isolated from Platform Core
const { query } = require('../../core/db');

async function runChurchDbMigrations() {
  console.log('[Church DB] Running assignments schema migration...');
  const sqls = [
    `CREATE TABLE IF NOT EXISTS public.church_positions (
      position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL,
      name TEXT NOT NULL,
      role_code TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_project_position_name UNIQUE (project_id, name)
    )`,
    `CREATE TABLE IF NOT EXISTS public.church_user_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      project_id UUID NOT NULL,
      committee_id INTEGER NOT NULL,
      group_id INTEGER NULL,
      position_id UUID NOT NULL,
      role_code TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by UUID NULL,
      updated_by UUID NULL,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP WITH TIME ZONE NULL,
      FOREIGN KEY (position_id) REFERENCES public.church_positions(position_id) ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_assignment_per_user_project
     ON public.church_user_assignments(user_id, project_id)
     WHERE is_primary = TRUE AND is_active = TRUE`,
    `CREATE TABLE IF NOT EXISTS public.church_signup_assignment_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      project_id UUID NOT NULL,
      committee_id INTEGER NOT NULL,
      group_id INTEGER NULL,
      position_id UUID NULL,
      requested_position_name TEXT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP WITH TIME ZONE NULL,
      approved_by UUID NULL
    )`,
    `CREATE TABLE IF NOT EXISTS public.platform_memberships (
      membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.platform_profiles(user_id) ON DELETE CASCADE,
      workspace_id UUID NOT NULL REFERENCES public.platform_workspaces(workspace_id) ON DELETE CASCADE,
      capability VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      approved_at TIMESTAMP WITH TIME ZONE NULL,
      approved_by UUID NULL,
      CONSTRAINT unique_user_workspace_capability UNIQUE (user_id, workspace_id, capability)
    )`
  ];

  // Try adding status column if assignments table already exists
  try {
    await query.exec("ALTER TABLE public.church_user_assignments ADD COLUMN status TEXT DEFAULT 'pending'");
  } catch (e) {}

  // Set existing assignments to approved
  try {
    await query.exec("UPDATE public.church_user_assignments SET status = 'approved' WHERE status IS NULL OR status = 'pending'");
  } catch (e) {}

  for (const sql of sqls) {
    try {
      await query.exec(sql);
    } catch (err) {
      console.warn('[Church DB] Migration step warning/error:', err.message);
    }
  }

  // Seed default positions
  try {
    const project = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
    if (project) {
      const projectId = project.project_id;
      const defaults = [
        { name: '회계', role_code: 'DEPARTMENT_ACCOUNTANT' },
        { name: '총무', role_code: 'FINANCE_MANAGER' },
        { name: '부장', role_code: 'GROUP_LEADER' },
        { name: '위원장', role_code: 'COMMITTEE_CHAIR' },
        { name: '교역자', role_code: 'PASTOR' }
      ];

      for (const pos of defaults) {
        await query.run(`
          INSERT INTO public.church_positions (project_id, name, role_code)
          VALUES (?, ?, ?)
          ON CONFLICT (project_id, name) DO NOTHING
        `, [projectId, pos.name, pos.role_code]);
      }
    }
  } catch (err) {
    console.error('[Church DB] Failed to seed default positions:', err);
  }

  // Migrate existing users to assignments if needed
  try {
    const project = await query.get("SELECT project_id FROM public.platform_projects WHERE service_id = 'church_think' LIMIT 1");
    if (project) {
      const projectId = project.project_id;
      const positions = await query.all("SELECT position_id, name, role_code FROM public.church_positions WHERE project_id = ? AND is_active = TRUE", [projectId]);
      const usersMeta = await query.all("SELECT user_id, department_id, position FROM public.church_user_metadata WHERE project_id = ?", [projectId]);

      for (const meta of usersMeta) {
        const existing = await query.all("SELECT id FROM public.church_user_assignments WHERE user_id = ? AND project_id = ? AND is_active = TRUE", [meta.user_id, projectId]);
        if (existing && existing.length > 0) continue;

        const profile = await query.get("SELECT username FROM public.platform_profiles WHERE user_id = ?", [meta.user_id]);
        if (profile && (profile.username === 'admin' || profile.username === 'auditor')) {
          continue;
        }

        let groupId = meta.department_id;
        let committeeId = 11;
        if (groupId) {
          const group = await query.get("SELECT parent_id FROM public.church_departments WHERE department_id = ?", [groupId]);
          if (group && group.parent_id) {
            committeeId = group.parent_id;
          } else {
            committeeId = groupId;
            groupId = null;
          }
        }

        let posName = meta.position || '회계';
        let matchedPos = positions.find(p => p.name === posName);
        if (!matchedPos) {
          matchedPos = positions.find(p => p.name === '회계');
        }

        if (matchedPos) {
          await query.run(`
            INSERT INTO public.church_user_assignments (user_id, project_id, committee_id, group_id, position_id, role_code, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, TRUE)
          `, [meta.user_id, projectId, committeeId, groupId, matchedPos.position_id, matchedPos.role_code]);
        }
      }
    }
  } catch (err) {
    console.error('[Church DB] Failed to migrate existing users:', err);
  }

  console.log('[Church DB] Migration and seeding completed.');
}

// Run migrations asynchronously
runChurchDbMigrations().catch(err => {
  console.error('[Church DB] Error running church DB migrations:', err);
});
