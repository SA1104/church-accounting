const { pool } = require('../../../core/db/index');
const { StockPostgresAdapter, StockMockAdapter } = require('./StockPostgresAdapter');

class StockReadRepository {
  constructor(options = {}) {
    // Inject mock if test env, else use Postgres
    if (process.env.NODE_ENV === 'test' && options.db) {
      this.db = options.db;
    } else {
      this.db = new StockPostgresAdapter(pool);
    }
  }

  async checkSchemaAvailability() {
    try {
      const sql = `
        SELECT
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_instruments') AS has_instruments,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_daily_bars') AS has_daily_bars,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_session_snapshots') AS has_snapshots,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_indices') AS has_indices,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_daily_briefs') AS has_briefs
      `;
      const result = await this.db.get(sql);
      
      if (!result) {
        return {
          referenceReady: false,
          dailyBarsReady: false,
          snapshotsReady: false,
          indicesReady: false,
          briefsReady: false,
          isSimulated: this.db.isSimulated || false
        };
      }

      return {
        referenceReady: parseInt(result.has_instruments) > 0,
        dailyBarsReady: parseInt(result.has_daily_bars) > 0,
        snapshotsReady: parseInt(result.has_snapshots) > 0,
        indicesReady: parseInt(result.has_indices) > 0,
        briefsReady: parseInt(result.has_briefs) > 0,
        isSimulated: this.db.isSimulated || false
      };
    } catch (e) {
      // If DB_NOT_CONFIGURED or DB_UNAVAILABLE
      const errCode = e.code || 'DB_UNAVAILABLE';
      return {
        referenceReady: false,
        dailyBarsReady: false,
        snapshotsReady: false,
        indicesReady: false,
        briefsReady: false,
        isSimulated: this.db.isSimulated || false,
        dbError: errCode
      };
    }
  }

  async searchInstruments(options = {}) {
    let sql = `SELECT stock_code, instrument_name, market_code 
               FROM stock_instruments 
               WHERE is_active = true`;
    const params = [];

    if (options.q) {
      sql += ` AND (instrument_name LIKE ? OR stock_code LIKE ?)`;
      params.push(`%${options.q}%`, `%${options.q}%`);
    }
    
    if (options.market) {
      sql += ` AND market_code = ?`;
      params.push(options.market);
    }
    
    const allowedSort = ['stock_code', 'instrument_name', 'market_code'];
    const sort = allowedSort.includes(options.sort) ? options.sort : 'stock_code';
    const order = options.order === 'desc' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sort} ${order}`;
    
    const limit = Math.min(Math.max(options.limit || 20, 1), 100);
    const offset = ((options.page || 1) - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return this.db.all(sql, params);
  }

  async findInstrumentByStockCode(stockCode) {
    const sql = `SELECT stock_code, instrument_name, market_code, security_type, currency_code 
                 FROM stock_instruments 
                 WHERE stock_code = ?`;
    return this.db.get(sql, [stockCode]);
  }

  async findLatestDailyBar(stockCode, venueCode = 'KRX') {
    const sql = `
      SELECT trade_date, open_price, high_price, low_price, close_price, volume, trading_value, is_final, source_code 
      FROM stock_daily_bars 
      WHERE stock_code = ? AND venue_code = ? 
      ORDER BY trade_date DESC, is_final DESC 
      LIMIT 1
    `;
    return this.db.get(sql, [stockCode, venueCode]);
  }

  async findDailyBars(stockCode, options = {}) {
    let sql = `
      SELECT trade_date, open_price, high_price, low_price, close_price, volume, trading_value, is_final 
      FROM stock_daily_bars 
      WHERE stock_code = ? AND venue_code = ?
    `;
    const params = [stockCode, options.venue || 'KRX'];

    if (options.from) {
      sql += ` AND trade_date >= ?`;
      params.push(options.from);
    }
    if (options.to) {
      sql += ` AND trade_date <= ?`;
      params.push(options.to);
    }
    
    sql += ` ORDER BY trade_date DESC LIMIT ?`;
    params.push(Math.min(options.limit || 100, 365));
    
    return this.db.all(sql, params);
  }

  async findLatestKoreaMarketSummary() {
    const sql = `
      SELECT 
        (SELECT close_index FROM stock_index_daily_bars WHERE index_code = 'KOSPI' ORDER BY trade_date DESC LIMIT 1) as kospi,
        (SELECT close_index FROM stock_index_daily_bars WHERE index_code = 'KOSDAQ' ORDER BY trade_date DESC LIMIT 1) as kosdaq,
        (SELECT trade_date FROM stock_index_daily_bars WHERE index_code = 'KOSPI' ORDER BY trade_date DESC LIMIT 1) as latest_trade_date
    `;
    return this.db.get(sql);
  }

  async findLatestSessionSnapshots(stockCode) {
    const sql = `
      SELECT venue_code, session_code, close_price, snapshot_at, is_final 
      FROM stock_session_snapshots 
      WHERE stock_code = ? 
      ORDER BY snapshot_at DESC 
      LIMIT 5
    `;
    return this.db.all(sql, [stockCode]);
  }
}

module.exports = StockReadRepository;
