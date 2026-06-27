/**
 * Booza Think Core SDK - Telemetry & Monitoring logger (Phase 7)
 */
const db = require('../db/index.js');

class TelemetryLogger {
  async logEvent(category, eventName, message, details = {}, userId = null, projectId = null) {
    const timestamp = new Date().toISOString();
    console.log(`[Telemetry ${category}] Event: '${eventName}' -> ${message}`);
    
    try {
      await db.query.run(`
        INSERT INTO telemetry_log (category, event_name, message, details, user_id, project_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        category.toUpperCase(),
        eventName,
        message,
        JSON.stringify(details),
        userId,
        projectId
      ]);
      return true;
    } catch (err) {
      console.error('[Telemetry SDK] Failed to save telemetry log:', err);
      return false;
    }
  }

  async audit(userId, action, msg, details = {}) {
    return await this.logEvent('Audit', action, msg, details, userId);
  }

  async decision(decisionId, msg, details = {}) {
    return await this.logEvent('Decision', 'EVALUATED', msg, details);
  }

  async usage(projectId, metric, qty) {
    return await this.logEvent('Usage', 'CONSUMED', `${metric}: ${qty}`, {}, null, projectId);
  }

  async billing(projectId, tier, amount) {
    return await this.logEvent('Billing', 'INVOICED', `Tier ${tier}: ${amount}`, {}, null, projectId);
  }

  async error(errCode, msg, stack = '') {
    return await this.logEvent('Error', errCode, msg, { stack });
  }

  async performance(metric, ms) {
    return await this.logEvent('Performance', 'MEASURED', `${metric} took ${ms}ms`, { ms });
  }

  async learning(modelId, deviation) {
    return await this.logEvent('Learning', 'UPDATED', `Model ${modelId} deviation: ${deviation}`, { deviation });
  }

  async feedback(decisionId, rating) {
    return await this.logEvent('Feedback', 'RECEIVED', `Decision ${decisionId} rating: ${rating}`, { rating });
  }
}

const telemetry = new TelemetryLogger();

module.exports = {
  TelemetryLogger,
  telemetry
};
