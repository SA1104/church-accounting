class StockRepository {
  constructor(db) { this.db = db; }
  
  async upsertInstruments(records, options = {}) {
    let inserted = 0; let updated = 0; let skipped = 0;
    for (const record of records) { inserted++; }
    return options.dryRun ? { SIMULATED_INSERT: inserted, SIMULATED_UPDATE: updated, SIMULATED_SKIP: skipped } : { inserted, updated, skipped };
  }
  
  async upsertDailyBars(records, options = {}) {
    let inserted = 0; let updated = 0; let skipped = 0;
    for (const record of records) {
      if (!record.stockCode || !record.tradeDate) { skipped++; continue; }
      inserted++;
    }
    return options.dryRun ? { SIMULATED_INSERT: inserted, SIMULATED_UPDATE: updated, SIMULATED_SKIP: skipped } : { inserted, updated, skipped };
  }
  
  async createIngestionRun(runData) {
    return { id: runData.dryRun ? 'dry-run-id' : 'run-' + Date.now() };
  }
  
  async updateIngestionRun(id, updateData) {}
  
  async logDataQualityIssue(issueData) {
    if (issueData.dryRun) {
      console.warn('[QUALITY WARNING DryRun]', issueData.checkCode, issueData.entityKey);
    }
  }
}
module.exports = StockRepository;
