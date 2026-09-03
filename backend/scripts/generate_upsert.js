const fs = require('fs');
const content = fs.readFileSync('backend/service/stock/repositories/StockRepository.js', 'utf8');

const newContent = content.replace(
  /async upsertInstruments[^\{]+\{[\s\S]+?return options\.dryRun[^;]+;\s*\}/,
  \sync upsertInstruments(records, options = {}) {
    if (!options.dryRun) {
      this._checkWriteAccess();
    }
    
    if (!records || records.length === 0) return { inserted: 0, updated: 0, skipped: 0 };
    
    if (options.dryRun) {
      return { SIMULATED_INSERT: records.length, SIMULATED_UPDATE: 0, SIMULATED_SKIP: 0 };
    }

    // Get source_id for 'KRX_OPEN_API'
    let sourceId = null;
    try {
        const res = await this.db.query("SELECT id FROM stock_data_sources WHERE source_code = \", ['KRX_OPEN_API']);
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
        'COMMON', // security_type
        record.listing_date || null,
        record.currency_code || 'KRW',
        record.is_active !== false,
        sourceId
      );
      placeholders.push(\(\$\, \$\, \$\, \$\, \$\, \$\, \$\, \$\, \$\)\);
    }

    const query = \
      INSERT INTO stock_instruments (
        stock_code, instrument_name, instrument_name_en, primary_market_code, security_type, listing_date, currency_code, is_active, source_id
      ) VALUES \
      ON CONFLICT (stock_code, primary_market_code) DO UPDATE SET
        instrument_name = EXCLUDED.instrument_name,
        instrument_name_en = EXCLUDED.instrument_name_en,
        currency_code = EXCLUDED.currency_code,
        listing_date = EXCLUDED.listing_date,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    \;

    const result = await this.db.query(query, values);
    
    // Postgres doesn't tell us exactly how many inserted vs updated accurately without a RETURNING clause and comparison,
    // so we'll just return inserted = rowCount (simplification for the initial ingest)
    return { inserted: records.length, updated: 0, skipped: 0 };
  }\
);

fs.writeFileSync('backend/service/stock/repositories/StockRepository.js', newContent);
