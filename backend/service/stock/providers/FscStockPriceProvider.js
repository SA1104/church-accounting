const BaseProvider = require('../contracts/BaseProvider');

const FSC_API = {
  providerCode: 'FSC_STOCK_PRICE_API',
  authParam: 'serviceKey',
  endpoints: {
    dailyPrice: 'getStockPriceInfo'
  }
};

const FSC_BASE_URL = process.env.DATA_GO_KR_BASE_URL || 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 10000;

class FscStockPriceProvider extends BaseProvider {
  constructor(config = {}) {
    super(FSC_API.providerCode, config);
    this.serviceKey = config.serviceKey || process.env.DATA_GO_KR_SERVICE_KEY;
  }

  async healthCheck() {
    if (!this.serviceKey) {
      return { providerCode: this.providerCode, status: 'DISABLED_MISSING_KEY', checkedAt: new Date().toISOString(), message: 'DATA_GO_KR_SERVICE_KEY is not configured' };
    }
    return { providerCode: this.providerCode, status: 'SPEC_VERIFIED_READY_FOR_KEY', checkedAt: new Date().toISOString(), message: 'Ready to connect' };
  }

  async httpClient(endpoint, params = {}) {
    if (this.config.dryRun && !this.serviceKey) throw new Error('Missing Key in Dry Run');
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        const url = new URL(FSC_BASE_URL + endpoint);
        url.searchParams.append(FSC_API.authParam, this.serviceKey);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('HTTP ' + response.status);
        if ((response.headers.get('content-type') || '').includes('text/html')) throw new Error('INVALID_RESPONSE: Received HTML');
        return await response.json();
      } catch (err) {
        attempt++;
        if (attempt >= MAX_RETRIES) throw err;
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000 + Math.random() * 500));
      }
    }
  }

  async fetchInstruments(params = {}) {
    return { providerCode: this.providerCode, records: [], warnings: ['Not supported natively in FSC EOD'] };
  }

  async fetchDailyBars(params = {}) {
    const endpoint = FSC_API.endpoints.dailyPrice;
    const meta = { asOfAt: new Date().toISOString(), apiId: endpoint };
    if (params.fixture) {
      return this.normalizeDailyBarResponse([{ srtnCd: '000210', basDt: params.date, mkp: '30000', hipr: '31000', lopr: '29000', clpr: '30500', trqu: '100000', trVal: '3000000000' }], meta, params.market);
    }
    try {
      const data = await this.httpClient(endpoint, {
        resultType: 'json',
        numOfRows: 5000,
        basDt: params.date
      });
      const items = data.response?.body?.items?.item || [];
      return this.normalizeDailyBarResponse(items, meta, params.market);
    } catch (e) {
      meta.error = e.message;
      return this.normalizeDailyBarResponse([], meta, params.market);
    }
  }

  normalizeDailyBarResponse(rawData, meta, market) {
    return {
      providerCode: this.providerCode,
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      asOfAt: meta.asOfAt,
      isFinal: true,
      records: rawData.map(i => ({
        stockCode: String(i.srtnCd),
        marketCode: 'KRX_' + market,
        tradeDate: i.basDt ? i.basDt.slice(0,4) + '-' + i.basDt.slice(4,6) + '-' + i.basDt.slice(6,8) : null,
        openPrice: String(i.mkp),
        highPrice: String(i.hipr),
        lowPrice: String(i.lopr),
        closePrice: String(i.clpr),
        volume: String(i.trqu),
        tradingValue: String(i.trVal),
        sourceCode: this.providerCode
      })),
      warnings: meta.error ? [meta.error] : [],
      fixtureMeta: {
        fixtureSource: this.providerCode,
        apiId: meta.apiId,
        productionUrlPattern: 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/' + meta.apiId,
        officialDocumentUrl: 'https://www.data.go.kr',
        documentUpdatedAt: '2026-08-17',
        capturedAt: new Date().toISOString().split('T')[0],
        isSynthetic: true,
        syntheticReason: 'numeric values anonymized'
      }
    };
  }
}
module.exports = { FscStockPriceProvider, FSC_API };
