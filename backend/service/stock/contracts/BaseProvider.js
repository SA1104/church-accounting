/**
 * BaseProvider Contract
 * 
 * Defines the standard interface that all Stock Think Data Providers must implement.
 * This ensures that regardless of the source (KRX, FRED, BOK, etc.), the core ingestion 
 * engine can interact with them uniformly.
 */
class BaseProvider {
  constructor(providerCode, config = {}) {
    if (this.constructor === BaseProvider) {
      throw new Error("Abstract class BaseProvider cannot be instantiated directly.");
    }
    this.providerCode = providerCode;
    this.config = config;
  }

  /**
   * Check if the provider's API is reachable and credentials are valid (if any).
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    throw new Error("Method 'healthCheck()' must be implemented.");
  }

  /**
   * Fetch master instrument information (e.g., listed stocks, indices).
   * @param {Object} params - Query parameters (e.g., market, date)
   * @returns {Promise<Object>} Normalized response
   */
  async fetchInstruments(params) {
    throw new Error("Method 'fetchInstruments()' must be implemented.");
  }

  /**
   * Fetch daily price bars (OHLCV) for an instrument or a market.
   * @param {Object} params - targetDate, market, stockCode, etc.
   * @returns {Promise<Object>} Normalized response
   */
  async fetchDailyBars(params) {
    throw new Error("Method 'fetchDailyBars()' must be implemented.");
  }

  /**
   * Fetch daily bars for an index (e.g., KOSPI, S&P 500).
   * @param {Object} params 
   * @returns {Promise<Object>} Normalized response
   */
  async fetchIndexDailyBars(params) {
    throw new Error("Method 'fetchIndexDailyBars()' must be implemented.");
  }

  /**
   * Fetch macroeconomic observations (e.g., CPI, Interest Rate).
   * @param {Object} params 
   * @returns {Promise<Object>} Normalized response
   */
  async fetchMacroObservations(params) {
    throw new Error("Method 'fetchMacroObservations()' must be implemented.");
  }

  /**
   * Normalize the raw API response into the Stock Think standard envelope.
   * 
   * Standard Envelope:
   * {
   *   providerCode: 'KRX_OPEN_API',
   *   requestedAt: '2026-08-16T00:00:00Z',
   *   receivedAt: '2026-08-16T00:00:01Z',
   *   asOfAt: '2026-08-16T15:30:00Z',
   *   isFinal: true,
   *   sourceTimezone: 'Asia/Seoul',
   *   records: [...],
   *   warnings: []
   * }
   * 
   * @param {Object} rawData - Raw response from the provider
   * @param {Object} meta - Metadata about the request
   * @returns {Object} Normalized envelope
   */
  normalizeResponse(rawData, meta) {
    throw new Error("Method 'normalizeResponse()' must be implemented.");
  }
}

module.exports = BaseProvider;
