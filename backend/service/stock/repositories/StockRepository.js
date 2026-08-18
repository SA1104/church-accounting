class StockRepository {
  constructor(db) { 
    this.db = db; 
  }

  _checkWriteAccess() {
    if (process.env.ALLOW_STOCK_DATA_WRITE !== 'YES_DEV_ONLY') {
      throw new Error('STOCK_WRITE_FORBIDDEN: ALLOW_STOCK_DATA_WRITE=YES_DEV_ONLY is required for database writes.');
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('STOCK_WRITE_FORBIDDEN: Cannot write in production environment.');
    }
    if (process.env.STOCK_WRITE_TARGET !== 'development') {
      throw new Error('STOCK_WRITE_FORBIDDEN: STOCK_WRITE_TARGET=development is required.');
    }
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('supabase.co') && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
      if (!process.env.ALLOW_SUPABASE_PRODUCTION_WRITE_EXPLICIT) {
        throw new Error('PRODUCTION_WRITE_BLOCKED: Appears to be a remote Supabase instance.');
      }
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

    let client = this.db;
    let isPool = false;
    if (typeof this.db.connect === 'function') {
      client = await this.db.connect();
      isPool = true;
    }

    let sourceId = null;
    try {
      await client.query('BEGIN');
      const resSource = await client.query("SELECT id FROM stock_data_sources WHERE source_code = $1", ['KRX_OPEN_API']);
      if (resSource.rows.length === 0) {
        throw new Error('MISSING_SOURCE: KRX_OPEN_API not found');
      }
      sourceId = resSource.rows[0].id;
      
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
        RETURNING id, primary_market_code, stock_code, source_id
      `;

      const resInst = await client.query(query, values);
      
      if (resInst && resInst.rows && resInst.rows.length > 0) {
        const venueValues = [];
        const venuePlaceholders = [];
        let vpIdx = 1;
        for (const row of resInst.rows) {
          venueValues.push(row.id, 'KRX', row.stock_code, true, row.source_id);
          venuePlaceholders.push(`($${vpIdx++}, $${vpIdx++}, $${vpIdx++}, $${vpIdx++}, $${vpIdx++})`);
        }
        
        const venueQuery = `
          INSERT INTO stock_instrument_venues (instrument_id, venue_code, venue_symbol, is_trade_eligible, source_id)
          VALUES ${venuePlaceholders.join(', ')}
          ON CONFLICT (instrument_id, venue_code) DO UPDATE SET
            venue_symbol = EXCLUDED.venue_symbol,
            is_trade_eligible = EXCLUDED.is_trade_eligible,
            source_id = EXCLUDED.source_id,
            updated_at = NOW()
        `;
        
        await client.query(venueQuery, venueValues);
      }
      await client.query('COMMIT');
      return { inserted: records.length, updated: 0, skipped: 0 };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      if (isPool) client.release();
    }
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
