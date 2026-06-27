/**
 * Booza Think Kernel - Usage Engine Kernel Module
 */
const db = require('../../core/db/index.js');

class UsageEngineKernel {
  async trackResourceUsage(projectId, metricName, quantity, unit = 'COUNT') {
    console.log(`[Kernel Usage] Logging usage: ${metricName} -> ${quantity} (${unit}) for ${projectId}`);
    try {
      await db.query.run(`
        INSERT INTO usage_stubs (project_id, metric_name, quantity, unit)
        VALUES (?, ?, ?, ?)
      `, [projectId, metricName, quantity, unit]);
      return true;
    } catch (err) {
      console.error('[Kernel Usage] Failed to log usage:', err);
      return false;
    }
  }

  async getAccumulatedUsage(projectId, metricName) {
    try {
      const row = await db.query.get(`
        SELECT SUM(quantity) as total FROM usage_stubs
        WHERE project_id = ? AND metric_name = ?
      `, [projectId, metricName]);
      return row ? parseFloat(row.total || 0) : 0;
    } catch (err) {
      console.error('[Kernel Usage] Failed to fetch total usage:', err);
      return 0;
    }
  }
}

const usageKernel = new UsageEngineKernel();

module.exports = {
  UsageEngineKernel,
  usage: usageKernel
};
