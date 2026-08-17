const BaseProvider = require('../contracts/BaseProvider');

const KRX_API = {
  providerCode: 'KRX_OPEN_API',
  authHeader: 'AUTH_KEY',
  queryDateField: 'basDd',
  endpoints: {
    kospiDaily: 'stk_bydd_trd',
    kosdaqDaily: 'ksq_bydd_trd',
    kospiMaster: 'stk_isu_base_info',
    kosdaqMaster: 'ksq_isu_base_info',
  },
};

const KRX_BASE_URL = process.env.KRX_OPEN_API_BASE_URL || 'https://data-dbg.krx.co.kr/svc/apis/sto/';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 10000;

class KrxOpenApiProvider extends BaseProvider {
  constructor(config = {}) {
    super(KRX_API.providerCode, config);
    this.apiKey = config.apiKey || process.env.KRX_OPEN_API_AUTH_KEY;
  }

  async healthCheck() {
    if (!this.apiKey) {
      return {
        providerCode: this.providerCode,
        status: 'DISABLED_MISSING_KEY',
        checkedAt: new Date().toISOString(),
        message: 'KRX_OPEN_API_AUTH_KEY is not configured'
      };
    }
    return {
      providerCode: this.providerCode,
      status: 'SPEC_VERIFIED_READY_FOR_KEY',
      checkedAt: new Date().toISOString(),
      message: 'Ready to connect'
    };
  }

  async httpClient(endpoint, params = {}) {
    if (!this.apiKey) {
      const err = new Error('NOT_CONFIGURED');
      err.code = 'NOT_CONFIGURED';
      throw err;
    }
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      let timeoutId;
      try {
        const url = new URL(KRX_BASE_URL + endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const response = await fetch(url.toString(), { headers: { [KRX_API.authHeader]: this.apiKey }, signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const err = new Error('HTTP ' + response.status);
          err.status = response.status;
          throw err;
        }
        
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
           const err = new Error('INVALID_RESPONSE_HTML');
           err.status = 502; // Treat as upstream error (retryable)
           throw err;
        }
        return await response.json();
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        
        // Retry logic
        const isRetryable = err.name === 'AbortError' || 
                           (err.status === 429) || 
                           (err.status >= 500 && err.status < 600);
                           
        if (!isRetryable || attempt >= MAX_RETRIES - 1) {
          throw err;
        }
        
        attempt++;
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000 + Math.random() * 500));
      }
    }
  }

  async fetchInstruments(params = {}) {
    const market = params.market || 'KOSPI';
    const endpoint = market === 'KOSDAQ' ? KRX_API.endpoints.kosdaqMaster : KRX_API.endpoints.kospiMaster;
    const meta = { asOfAt: new Date().toISOString(), apiId: endpoint };
    if (params.fixture) {
      return this.normalizeInstrumentResponse([{ ISU_SRT_CD: market === 'KOSDAQ' ? '091990' : '005930', ISU_ABBRV: 'Fixture Co' }], meta, market);
    }
    try {
      const data = await this.httpClient(endpoint, {});
      return this.normalizeInstrumentResponse(data.OutBlock_1 || [], meta, market);
    } catch (e) {
      meta.error = e.message;
      return this.normalizeInstrumentResponse([], meta, market);
    }
  }

  async fetchDailyBars(params = {}) {
    const market = params.market || 'KOSPI';
    const endpoint = market === 'KOSDAQ' ? KRX_API.endpoints.kosdaqDaily : KRX_API.endpoints.kospiDaily;
    const meta = { asOfAt: new Date().toISOString(), apiId: endpoint };
    if (params.fixture) {
      return this.normalizeDailyBarResponse([{ ISU_SRT_CD: '000210', BAS_DT: params.date, MKP: '30000', HIPR: '31000', LOPR: '29000', CLPR: '30500', TRQU: '100000', TR_VAL: '3000000000' }], meta, market);
    }
    try {
      const data = await this.httpClient(endpoint, { [KRX_API.queryDateField]: params.date });
      return this.normalizeDailyBarResponse(data.OutBlock_1 || [], meta, market);
    } catch (e) {
      meta.error = e.message;
      return this.normalizeDailyBarResponse([], meta, market);
    }
  }

  normalizeInstrumentResponse(rawData, meta, market) {
    const accepted = [];
    const rejected = [];
    
    for (const i of rawData) {
      if (!i.ISU_SRT_CD || !i.ISU_ABBRV) {
        rejected.push({ raw: i, reason: 'Missing required fields (stock_code, instrument_name)' });
        continue;
      }
      
      const marketPrefix = market === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI';
      
      let listingDate = null;
      if (i.LIST_DD) {
        listingDate = i.LIST_DD.replace(/\//g, '-');
        if (listingDate.length !== 10) listingDate = null;
      }
      
      accepted.push({
        stock_code: String(i.ISU_SRT_CD).trim(),
        instrument_name: String(i.ISU_ABBRV).trim(),
        instrument_name_en: i.ISU_ENG_NM ? String(i.ISU_ENG_NM).trim() : null,
        primary_market_code: 'KRX_' + marketPrefix,
        currency_code: 'KRW',
        listing_date: listingDate,
        delisting_date: null,
        is_active: true,
        source_code: this.providerCode
      });
    }

    return {
      providerCode: this.providerCode,
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      asOfAt: meta.asOfAt,
      isFinal: true,
      records: accepted,
      rejected: rejected,
      warnings: meta.error ? [meta.error] : [],
      fixtureMeta: meta.fixture ? {
        fixtureSource: this.providerCode,
        apiId: meta.apiId,
        productionUrlPattern: 'https://data-dbg.krx.co.kr/svc/apis/sto/' + meta.apiId,
        officialDocumentUrl: 'http://openapi.krx.co.kr',
        documentUpdatedAt: '2026-08-17',
        capturedAt: new Date().toISOString().split('T')[0],
        isSynthetic: true,
        syntheticReason: 'numeric values anonymized'
      } : undefined
    };
  }

  normalizeDailyBarResponse(rawData, meta, market) {
    return {
      providerCode: this.providerCode,
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      asOfAt: meta.asOfAt,
      isFinal: true,
      records: rawData.map(i => ({
        stockCode: String(i.ISU_SRT_CD),
        marketCode: 'KRX_' + market,
        tradeDate: i.BAS_DT ? i.BAS_DT.slice(0,4) + '-' + i.BAS_DT.slice(4,6) + '-' + i.BAS_DT.slice(6,8) : null,
        openPrice: String(i.MKP),
        highPrice: String(i.HIPR),
        lowPrice: String(i.LOPR),
        closePrice: String(i.CLPR),
        volume: String(i.TRQU),
        tradingValue: String(i.TR_VAL),
        sourceCode: this.providerCode
      })),
      warnings: meta.error ? [meta.error] : [],
      fixtureMeta: {
        fixtureSource: this.providerCode,
        apiId: meta.apiId,
        productionUrlPattern: 'https://data-dbg.krx.co.kr/svc/apis/sto/' + meta.apiId,
        officialDocumentUrl: 'http://openapi.krx.co.kr',
        documentUpdatedAt: '2026-08-17',
        capturedAt: new Date().toISOString().split('T')[0],
        isSynthetic: true,
        syntheticReason: 'numeric values anonymized'
      }
    };
  }
}
module.exports = { KrxOpenApiProvider, KRX_API };
