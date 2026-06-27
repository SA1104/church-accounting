/**
 * Booza Think Kernel - Billing Engine Kernel Module
 */
const db = require('../../core/db/index.js');

class BillingEngineKernel {
  async getSubscriptionDetails(projectId) {
    console.log(`[Kernel Billing] Fetching billing status for: ${projectId}`);
    try {
      let sub = await db.query.get('SELECT * FROM billing_stubs WHERE project_id = ? LIMIT 1', [projectId]);
      if (!sub) {
        // Fallback or seed default subscription
        await db.query.run(`
          INSERT INTO billing_stubs (project_id, tier, status, amount)
          VALUES (?, 'Free', 'ACTIVE', 0.00)
        `, [projectId]);
        sub = await db.query.get('SELECT * FROM billing_stubs WHERE project_id = ? LIMIT 1', [projectId]);
      }
      return sub;
    } catch (err) {
      console.error('[Kernel Billing] Error fetching subscription:', err);
      return { tier: 'Free', status: 'ACTIVE', amount: 0.00 };
    }
  }

  async upgradeSubscription(projectId, targetTier, billingCycle = 'MONTHLY') {
    console.log(`[Kernel Billing] Upgrading project ${projectId} to tier: ${targetTier}`);
    try {
      const amount = targetTier === 'Enterprise' ? 299000 : (targetTier === 'Pro' ? 99000 : 0);
      await db.query.run(`
        UPDATE billing_stubs
        SET tier = ?, amount = ?, billing_cycle = ?, status = 'ACTIVE', next_billing_date = CURRENT_TIMESTAMP + INTERVAL '30 days'
        WHERE project_id = ?
      `, [targetTier, amount, billingCycle, projectId]);
      return true;
    } catch (err) {
      console.error('[Kernel Billing] Upgrade failed:', err);
      return false;
    }
  }
}

const billingKernel = new BillingEngineKernel();

module.exports = {
  BillingEngineKernel,
  billing: billingKernel
};
