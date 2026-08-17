const StockReadRepository = require('../repositories/StockReadRepository');

const getRepo = (req) => {
  if (req && req.app && req.app.locals && req.app.locals.stockReadRepo) {
    return req.app.locals.stockReadRepo;
  }
  return new StockReadRepository();
};

const getSystemReadiness = async (req) => {
  const repo = getRepo(req);
  const schemaStatus = await repo.checkSchemaAvailability();
  
  const hasDbConfig = !!process.env.DATABASE_URL;
  const hasProviderKey = !!process.env.KRX_OPEN_API_AUTH_KEY;
  
  let readinessState = 'READY';
  let dbState = 'NOT_CONFIGURED';

  if (!hasDbConfig) {
    dbState = 'NOT_CONFIGURED';
    if (!schemaStatus.isSimulated) readinessState = 'DB_NOT_CONFIGURED';
  } else if (schemaStatus.dbError === 'DB_NOT_CONFIGURED') {
    dbState = 'NOT_CONFIGURED';
    readinessState = 'DB_NOT_CONFIGURED';
  } else if (schemaStatus.dbError) {
    dbState = 'UNAVAILABLE';
    readinessState = 'DB_UNAVAILABLE';
  } else if (!schemaStatus.referenceReady) {
    dbState = 'SCHEMA_NOT_APPLIED';
    readinessState = 'SCHEMA_NOT_APPLIED';
  } else {
    dbState = 'CONNECTED';
  }

  if (readinessState === 'READY' && !hasProviderKey) {
    readinessState = 'PROVIDER_NOT_CONFIGURED';
  }

  const isMockMode = !hasDbConfig;

  return { schemaStatus, readinessState, dbState, hasDbConfig, hasProviderKey, isMockMode };
};

const checkSchema = async (req, res, next) => {
  const { readinessState, schemaStatus } = await getSystemReadiness(req);
  
  if (readinessState !== 'READY' && readinessState !== 'PROVIDER_NOT_CONFIGURED') {
    return res.status(503).json({
      error: { code: readinessState, message: 'Stock Think 데이터 저장소가 준비 중입니다.' },
      meta: { status: readinessState }
    });
  }
  next();
};

const getHealth = async (req, res) => {
  const { schemaStatus, readinessState, dbState, hasProviderKey } = await getSystemReadiness(req);
  
  const isDegraded = readinessState !== 'READY';
  
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    data: {
      api: 'READY',
      database: dbState,
      schema: schemaStatus.referenceReady ? 'APPLIED' : 'NOT_APPLIED',
      provider: hasProviderKey ? 'CONFIGURED' : 'MISSING_KEY',
      liveData: 'NOT_COLLECTED'
    },
    meta: { 
      status: isDegraded ? 'DEGRADED' : 'READY',
      checkedAt: new Date().toISOString()
    }
  });
};

const searchInstruments = async (req, res) => {
  try {
    const { q, market, sort, order, page, limit } = req.query;
    if (q && q.length > 50) return res.status(400).json({ error: { code: 'INVALID_QUERY', message: 'Query too long' }, meta: { status: 'ERROR' } });
    
    const { schemaStatus } = await getSystemReadiness(req);
    if (!schemaStatus.referenceReady) {
      return res.status(503).json({ error: { code: 'SCHEMA_NOT_APPLIED' }, meta: { status: 'SCHEMA_NOT_APPLIED' } });
    }

    const repo = getRepo(req);
    const records = await repo.searchInstruments({ q, market, sort, order, page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
    
    if (!records || records.length === 0) {
      return res.json({
        data: [],
        meta: { status: 'NO_DATA', page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: 0, asOfAt: new Date().toISOString(), sources: [] }
      });
    }

    res.json({
      data: records,
      meta: { status: 'OK', asOfAt: new Date().toISOString(), sources: ['KRX_OPEN_API'], evidenceType: 'FACT' }
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, meta: { status: 'ERROR' } });
  }
};

const getInstrumentDetail = async (req, res) => {
  try {
    const { stockCode } = req.params;
    if (!/^\d{6}$/.test(stockCode)) return res.status(400).json({ error: { code: 'INVALID_CODE' }, meta: { status: 'ERROR' } });

    const { schemaStatus } = await getSystemReadiness(req);
    if (!schemaStatus.referenceReady) {
      return res.status(503).json({ error: { code: 'SCHEMA_NOT_APPLIED' }, meta: { status: 'SCHEMA_NOT_APPLIED' } });
    }

    const repo = getRepo(req);
    const instrument = await repo.findInstrumentByStockCode(stockCode);
    if (!instrument) return res.status(404).json({ error: { code: 'NOT_FOUND' }, meta: { status: 'ERROR' } });

    let latestBar = null;
    if (schemaStatus.dailyBarsReady) {
       latestBar = await repo.findLatestDailyBar(stockCode, 'KRX');
    }
    
    res.json({
      data: { instrument, latestBar },
      meta: {
        status: 'OK',
        tradeDate: latestBar?.trade_date || null,
        isFinal: latestBar?.is_final || false,
        freshnessStatus: latestBar ? 'CONFIRMED' : 'NOT_AVAILABLE',
        sources: ['KRX_OPEN_API'],
        evidenceType: 'FACT'
      }
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, meta: { status: 'ERROR' } });
  }
};

const getDailyBars = async (req, res) => {
  try {
    const { stockCode } = req.params;
    const { from, to, venue, limit } = req.query;
    
    if (!/^\d{6}$/.test(stockCode)) return res.status(400).json({ error: { code: 'INVALID_CODE' }, meta: { status: 'ERROR' } });

    const { schemaStatus } = await getSystemReadiness(req);
    if (!schemaStatus.dailyBarsReady) {
      return res.status(503).json({ error: { code: 'SCHEMA_NOT_APPLIED' }, meta: { status: 'SCHEMA_NOT_APPLIED' } });
    }

    const repo = getRepo(req);
    const bars = await repo.findDailyBars(stockCode, { from, to, venue, limit: parseInt(limit) || 100 });
    
    if (!bars || bars.length === 0) {
      return res.json({ data: [], meta: { status: 'NO_DATA', sources: [] } });
    }

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
      data: bars,
      meta: { status: 'OK', sources: [venue === 'FSC' ? 'FSC_STOCK_PRICE_API' : 'KRX_OPEN_API'], evidenceType: 'FACT' }
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, meta: { status: 'ERROR' } });
  }
};

const getSnapshots = async (req, res) => {
  try {
    const { stockCode } = req.params;
    if (!/^\d{6}$/.test(stockCode)) return res.status(400).json({ error: { code: 'INVALID_CODE' }, meta: { status: 'ERROR' } });

    const { schemaStatus } = await getSystemReadiness(req);
    if (!schemaStatus.snapshotsReady) {
      return res.status(503).json({ error: { code: 'SCHEMA_NOT_APPLIED' }, meta: { status: 'SCHEMA_NOT_APPLIED' } });
    }

    const repo = getRepo(req);
    const snapshots = await repo.findLatestSessionSnapshots(stockCode);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      data: snapshots || [],
      meta: { status: 'OK', sources: ['KRX_OPEN_API', 'NXT_OFFICIAL'], evidenceType: 'FACT' }
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, meta: { status: 'ERROR' } });
  }
};

const getKoreaMarketLatest = async (req, res) => {
  try {
    const { schemaStatus } = await getSystemReadiness(req);
    if (!schemaStatus.indicesReady) {
      return res.status(503).json({ error: { code: 'SCHEMA_NOT_APPLIED' }, meta: { status: 'SCHEMA_NOT_APPLIED' } });
    }

    const repo = getRepo(req);
    const summary = await repo.findLatestKoreaMarketSummary();
    if (!summary || (!summary.kospi && !summary.kosdaq)) {
      return res.json({
        data: { kospi: null, kosdaq: null, latestTradeDate: null },
        meta: { status: 'NO_DATA', sources: [], freshnessStatus: 'NOT_AVAILABLE' }
      });
    }

    res.json({
      data: {
        kospi: summary.kospi,
        kosdaq: summary.kosdaq,
        latestTradeDate: summary.latest_trade_date
      },
      meta: {
        status: 'OK',
        tradeDate: summary.latest_trade_date,
        isFinal: true,
        freshnessStatus: 'CONFIRMED',
        sources: ['KRX_OPEN_API'],
        evidenceType: 'FACT'
      }
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, meta: { status: 'ERROR' } });
  }
};

module.exports = {
  checkSchema,
  getHealth,
  searchInstruments,
  getInstrumentDetail,
  getDailyBars,
  getSnapshots,
  getKoreaMarketLatest
};
