class IngestionService {
  constructor(provider, repository) {
    this.provider = provider;
    this.repository = repository;
  }

  async runInstrumentIngestion(options = {}) {
    const start = Date.now();
    let status = 'SUCCESS';
    
    // Write Protection
    if (!options.dryRun) {
      if (process.env.NODE_ENV === 'production' || process.env.ALLOW_STOCK_DATA_WRITE !== 'YES_DEV_ONLY') {
        return {
          provider: this.provider.providerCode,
          resource: 'instruments',
          fetchedCount: 0,
          normalizedCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          duplicateCount: 0,
          wouldInsertCount: 0,
          wouldUpdateCount: 0,
          durationMs: Date.now() - start,
          status: 'DATA_WRITE_BLOCKED'
        };
      }
    }

    try {
      const market = options.market || 'KOSPI';
      const result = await this.provider.fetchInstruments({ fixture: options.fixture, market });
      
      const rawCount = result.records ? result.records.length : 0;
      const rejectedCount = result.rejected ? result.rejected.length : 0;
      
      // Deduplicate by stock_code
      const seen = new Set();
      const uniqueRecords = [];
      let duplicateCount = 0;
      
      for (const record of result.records || []) {
        if (seen.has(record.stock_code)) {
          duplicateCount++;
        } else {
          seen.add(record.stock_code);
          uniqueRecords.push(record);
        }
      }

      let dbResult = { SIMULATED_INSERT: 0, SIMULATED_UPDATE: 0, inserted: 0, updated: 0 };
      if (uniqueRecords.length > 0) {
        dbResult = await this.repository.upsertInstruments(uniqueRecords, { dryRun: options.dryRun });
      }

      return {
        provider: this.provider.providerCode,
        resource: 'instruments',
        fetchedCount: rawCount + rejectedCount,
        normalizedCount: rawCount + rejectedCount,
        acceptedCount: uniqueRecords.length,
        rejectedCount: rejectedCount,
        duplicateCount: duplicateCount,
        wouldInsertCount: options.dryRun ? dbResult.SIMULATED_INSERT : dbResult.inserted,
        wouldUpdateCount: options.dryRun ? dbResult.SIMULATED_UPDATE : dbResult.updated,
        durationMs: Date.now() - start,
        status: status
      };
    } catch (e) {
      return {
        provider: this.provider.providerCode,
        resource: 'instruments',
        fetchedCount: 0,
        normalizedCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        duplicateCount: 0,
        wouldInsertCount: 0,
        wouldUpdateCount: 0,
        durationMs: Date.now() - start,
        status: e.code || 'FAILED'
      };
    }
  }
}

module.exports = IngestionService;
