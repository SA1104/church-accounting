const fs = require('fs');
const path = require('path');

// Simulate the required dependencies
const { KrxOpenApiProvider } = require('../service/stock/providers/KrxOpenApiProvider');
const StockRepository = require('../service/stock/repositories/StockRepository');
const IngestionService = require('../service/stock/services/IngestionService');

// Command line argument parser
const args = process.argv.slice(2);
const options = {
  provider: null,
  resource: null,
  fixture: false,
  dryRun: false
};

args.forEach(arg => {
  if (arg.startsWith('--provider=')) options.provider = arg.split('=')[1];
  if (arg.startsWith('--resource=')) options.resource = arg.split('=')[1];
  if (arg === '--fixture' || arg.startsWith('--fixture=')) options.fixture = true; // Use basic built-in fixture for now
  if (arg === '--dry-run') options.dryRun = true;
});

async function main() {
  if (options.provider !== 'krx' || options.resource !== 'instruments') {
    console.error('Only --provider=krx and --resource=instruments are supported in Alpha 1.');
    process.exit(1);
  }

  const provider = new KrxOpenApiProvider({ dryRun: options.dryRun });
  
  // Dummy repository to ensure 0 DB calls during dry-run
  const dummyRepo = new StockRepository({
    query: async () => { throw new Error('DB called during dry run!'); }
  });

  const ingestionService = new IngestionService(provider, dummyRepo);

  const result = await ingestionService.runInstrumentIngestion({
    dryRun: options.dryRun,
    fixture: options.fixture
  });

  // Output EXACT format as requested
  console.log(`provider: ${result.provider}`);
  console.log(`resource: ${result.resource}`);
  console.log(`fetchedCount: ${result.fetchedCount}`);
  console.log(`normalizedCount: ${result.normalizedCount}`);
  console.log(`acceptedCount: ${result.acceptedCount}`);
  console.log(`rejectedCount: ${result.rejectedCount}`);
  console.log(`duplicateCount: ${result.duplicateCount}`);
  console.log(`wouldInsertCount: ${result.wouldInsertCount}`);
  console.log(`wouldUpdateCount: ${result.wouldUpdateCount}`);
  console.log(`durationMs: ${result.durationMs}`);
  console.log(`status: ${result.status}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
