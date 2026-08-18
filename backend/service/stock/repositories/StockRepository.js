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
    
    if (!records || records.length === 0) return { inserted: 0, updated: 0, skipped: 0 };
    
    if (options.dryRun) {
      return { SIMULATED_INSERT: records.length, SIMULATED_UPDATE: 0, SIMULATED_SKIP: 0 };
    }

    let sourceId = null;
    try {
        const res = await this.db.query("SELECT id FROM stock_data_sources WHERE source_code = $1", ['KRX_OPEN_API']);
        if (res.rows.length > 0) sourceId = res.rows[0].id;
    } catch(e) {}

    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    for (const record of records) {
      values.push(
        record.stock_code,
        record.instrument_name,
        record.instrument_name_en || null,
        record.primary_market_code,
        record.security_type || 'COMMON',
        record.listing_date || null,
        record.currency_code || 'KRW',
        record.is_active !== false,
        sourceId
      );
      placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
    }

    const query = `
      INSERT INTO stock_instruments (
        stock_code, instrument_name, instrument_name_en, primary_market_code, security_type, listing_date, currency_code, is_active, source_id
      ) VALUES ${placeholders.join(', ')}
      ON CONFLICT (stock_code, primary_market_code) DO UPDATE SET
        instrument_name = EXCLUDED.instrument_name,
        instrument_name_en = EXCLUDED.instrument_name_en,
        security_type = EXCLUDED.security_type,
        currency_code = EXCLUDED.currency_code,
        listing_date = EXCLUDED.listing_date,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;

    await this.db.query(query, values);
    
    return { inserted: records.length, updated: 0, skipped: 0 };
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
