const { query } = require('../../core/db');

async function initModuleDb() {
  try {
    console.log('[Accounting Module] Initializing Context Scope Database Schema...');
    
    // Create church_user_contexts table
    await query.exec(`
      CREATE TABLE IF NOT EXISTS public.church_user_contexts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        project_id UUID NOT NULL,
        department_id INTEGER NOT NULL,
        role_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create passkey_credentials table
    await query.exec(`
      CREATE TABLE IF NOT EXISTS public.passkey_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter BIGINT NOT NULL DEFAULT 0,
        transports TEXT[],
        device_name TEXT,
        backed_up BOOLEAN DEFAULT FALSE,
        credential_device_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create index on passkey_credentials(user_id)
    await query.exec(`
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id
      ON public.passkey_credentials(user_id)
    `);

    // Create passkey_challenges table
    await query.exec(`
      CREATE TABLE IF NOT EXISTS public.passkey_challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        challenge TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

    // Let's seed a test user as Committee Chair of multiple committees
    const testUser = await query.get("SELECT user_id, project_id FROM public.church_user_metadata WHERE position = '위원장' LIMIT 1");
    if (testUser) {
      const existing = await query.get("SELECT id FROM public.church_user_contexts WHERE user_id = ? LIMIT 1", [testUser.user_id]);
      if (!existing) {
        await query.run(`
          INSERT INTO public.church_user_contexts (user_id, project_id, department_id, role_id)
          VALUES (?, ?, 11, 'FINANCE_MANAGER'), (?, ?, 3, 'FINANCE_MANAGER')
        `, [testUser.user_id, testUser.project_id, testUser.user_id, testUser.project_id]);
        console.log('[Accounting Module] Seeded multiple committee assignments for user:', testUser.user_id);
      }
    }
  } catch (err) {
    console.error('[Accounting Module] Schema initialization failed:', err.message);
  }
}

module.exports = {
  initModuleDb
};
