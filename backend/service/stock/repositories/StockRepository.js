class StockRepository {
  constructor(db) { 
    this.db = db; 
  }

  _checkWriteAccess() {
    if (process.env.ALLOW_STOCK_DATA_WRITE !== 'YES_DEV_ONLY') {
      throw new Error('STOCK_WRITE_FORBIDDEN: ALLOW_STOCK_DATA_WRITE=YES_DEV_ONLY is required for database writes.');
    }
  }
  
  async upsertInstruments(records, options = {}) {
    if (!options.dryRun) {
      this._checkWriteAccess();
    }
    let inserted = 0; let updated = 0; let skipped = 0;
    for (const record of records) { inserted++; }
    return options.dryRun ? { SIMULATED_INSERT: inserted, SIMULATED_UPDATE: updated, SIMULATED_SKIP: skipped } : { inserted, updated, skipped };
  }
  
  async upsertDailyBars(records, options = {}) {
    if (!options.dryRun) {
      this._checkWriteAccess();
    }
    let inserted = 0; let updated = 0; let skipped = 0;
    for (const record of records) {
      if (!record.stockCode || !record.tradeDate) { skipped++; continue; }
      inserted++;
    }
    return options.dryRun ? { SIMULATED_INSERT: inserted, SIMULATED_UPDATE: updated, SIMULATED_SKIP: skipped } : { inserted, updated, skipped };
  }
  
  async createIngestionRun(runData) {
    if (!runData.dryRun) {
      this._checkWriteAccess();
    }
    return { id: runData.dryRun ? 'dry-run-id' : 'run-' + Date.now() };
  }
  
  async updateIngestionRun(id, updateData) {
    // If it's a dry run ID, we bypass write protection since it's an in-memory run
    if (id !== 'dry-run-id') {
      this._checkWriteAccess();
    }
  }
  
  async logDataQualityIssue(issueData) {
    if (issueData.dryRun) {
      console.warn('[QUALITY WARNING DryRun]', issueData.checkCode, issueData.entityKey);
    } else {
      this._checkWriteAccess();
    }
  }
}
module.exports = StockRepository;
