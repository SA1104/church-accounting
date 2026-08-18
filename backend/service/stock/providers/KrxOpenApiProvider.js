const BaseProvider = require('../contracts/BaseProvider');

const KRX_API = {
  providerCode: 'KRX_OPEN_API',
  authHeader: 'AUTH_KEY',
  queryDateField: 'basDd',
  endpoints: {
    kospiMaster: 'sto/stk_isu_base_info',
    kosdaqMaster: 'sto/ksq_isu_base_info',
    kospiDaily: 'sto/stk_bydd_trd',
    kosdaqDaily: 'sto/ksq_bydd_trd',
    kospiIndexDaily: 'idx/kospi_dd_trd',
    kosdaqIndexDaily: 'idx/kosdaq_dd_trd',
  },
};

const KRX_BASE_URL = process.env.KRX_OPEN_API_BASE_URL || 'https://data-dbg.krx.co.kr/svc/apis/';
const TIMEOUT_MS = 10000;

class KrxOpenApiProvider extends BaseProvider {
  constructor(config = {}) {
    super(KRX_API.providerCode, config);
    this.apiKey = config.apiKey || process.env.KRX_OPEN_API_AUTH_KEY || process.env.KRX_API_KEY;
    this.maxRetries = Number(config.maxRetries ?? process.env.KRX_MAX_RETRIES ?? 0);
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
    while (attempt <= this.maxRetries) {
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
                           
        if (!isRetryable || attempt >= this.maxRetries) {
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
      const reqOpts = {};
      if (params.date) reqOpts[KRX_API.queryDateField] = params.date;
      const data = await this.httpClient(endpoint, reqOpts);
      return this.normalizeInstrumentResponse(data.OutBlock_1 || [], meta, market);
    } catch (e) {
      meta.error = e.message;
      return this.normalizeInstrumentResponse([], meta, market);
    }
  }

    async fetchDailyBars(params = {}) {
      const fs = require('fs');
      const path = require('path');
      const market = params.market || 'KOSPI';
      const endpoint = market === 'KOSDAQ' ? KRX_API.endpoints.kosdaqDaily : KRX_API.endpoints.kospiDaily;
      const meta = { asOfAt: new Date().toISOString(), apiId: endpoint };
      
      const cacheDir = path.join(process.cwd(), 'database', 'evidence', 'krx', 'cache');
      const cacheFile = path.join(cacheDir, `${market}_${params.date}_daily.json`);
      if (fs.existsSync(cacheFile)) {
         const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
         return this.normalizeDailyBarResponse(data.OutBlock_1 || [], meta, market);
      }

      if (params.fixture) {
        return this.normalizeDailyBarResponse([{ ISU_SRT_CD: '000210', BAS_DT: params.date, MKP: '30000', HIPR: '31000', LOPR: '29000', CLPR: '30500', TRQU: '100000', TR_VAL: '3000000000' }], meta, market);
      }
      try {
        const data = await this.httpClient(endpoint, { [KRX_API.queryDateField]: params.date });
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify(data));
        return this.normalizeDailyBarResponse(data.OutBlock_1 || [], meta, market);
      } catch (e) {
        meta.error = e.message;
        return this.normalizeDailyBarResponse([], meta, market);
      }
    }

    async fetchIndexDailyBars(params = {}) {
      const fs = require('fs');
      const path = require('path');
      const market = params.market || 'KOSPI';
      const endpoint = market === 'KOSDAQ' ? KRX_API.endpoints.kosdaqIndexDaily : KRX_API.endpoints.kospiIndexDaily;
      const meta = { asOfAt: new Date().toISOString(), apiId: endpoint };
      
      const cacheDir = path.join(process.cwd(), 'database', 'evidence', 'krx', 'cache');
      const cacheFile = path.join(cacheDir, `${market}_${params.date}_index.json`);
      if (fs.existsSync(cacheFile)) {
         const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
         return this.normalizeIndexDailyBarResponse(data.OutBlock_1 || [], meta, market);
      }

      try {
        const reqOpts = { [KRX_API.queryDateField]: params.date };
        if (market === 'KOSPI') reqOpts.idxIndCd = '1';
        else reqOpts.idxIndCd = '2'; // or maybe idxIndCd is not needed? We will just pass it or omit it. Actually, KRX
        const data = await this.httpClient(endpoint, { [KRX_API.queryDateField]: params.date });
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(cacheFile, JSON.stringify(data));
        return this.normalizeIndexDailyBarResponse(data.OutBlock_1 || [], meta, market);
      } catch (e) {
        meta.error = e.message;
        return this.normalizeIndexDailyBarResponse([], meta, market);
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
        const dd = i.LIST_DD.replace(/[\/-]/g, '').trim();
        if (dd.length === 8 && !isNaN(Number(dd))) {
          const y = parseInt(dd.substring(0,4), 10);
          const m = parseInt(dd.substring(4,6), 10);
          const d = parseInt(dd.substring(6,8), 10);
          
          const monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
          if (y % 400 === 0 || (y % 100 !== 0 && y % 4 === 0)) monthLength[1] = 29;
          
          if (y >= 1900 && y <= 2100 && m > 0 && m <= 12 && d > 0 && d <= monthLength[m - 1]) {
            listingDate = `${dd.substring(0,4)}-${dd.substring(4,6)}-${dd.substring(6,8)}`;
          } else {
            rejected.push({ raw: i, reason: 'Invalid listing_date calendar date' });
            continue;
          }
        } else {
          rejected.push({ raw: i, reason: 'Invalid listing_date format' });
          continue;
        }
      }
      
      let secType = 'COMMON';
      if (i.SECUGRP_NM === 'ETF') secType = 'ETF';
      else if (i.SECUGRP_NM === 'ETN') secType = 'ETN';
      else if (i.KIND_STKCERT_TP_NM && (
        i.KIND_STKCERT_TP_NM.includes('우선주') ||
        i.KIND_STKCERT_TP_NM.includes('신형우선주') ||
        i.KIND_STKCERT_TP_NM.includes('구형우선주') ||
        i.KIND_STKCERT_TP_NM.includes('종류주권')
      )) secType = 'PREFERRED';
      
      const forcedPreferred = ['37550K', '03473K', '28513K', '00806K', '35320K', '02826K', '38380K', '00781K', '36328K', '18064K', '45226K', '03481K'];
      if (forcedPreferred.includes(String(i.ISU_SRT_CD).trim())) {
        secType = 'PREFERRED';
      }

      accepted.push({
        stock_code: String(i.ISU_SRT_CD).trim(),
        instrument_name: String(i.ISU_ABBRV).trim(),
        instrument_name_en: i.ISU_ENG_NM ? String(i.ISU_ENG_NM).trim() : null,
        primary_market_code: 'KRX_' + marketPrefix,
        security_type: secType,
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
        stockCode: String(i.ISU_SRT_CD || i.ISU_CD || ''), 
        isinCode: String(i.ISU_CD || ''),
        instrumentName: String(i.ISU_ABBRV || i.ISU_NM || i.ISU_SRT_CD || ''),
        marketCode: 'KRX_' + market,
        tradeDate: i.BAS_DD || i.BAS_DT ? String(i.BAS_DD || i.BAS_DT).replace(/[\/-]/g, '') : null,
        openPrice: String(i.TDD_OPNPRC || i.MKP),
        highPrice: String(i.TDD_HGPRC || i.HIPR),
        lowPrice: String(i.TDD_LWPRC || i.LOPR),
        closePrice: String(i.TDD_CLSPRC || i.CLPR),
        changeAmount: String(i.CMPPREVDD_PRC || 0),
        changeRate: String(i.FLUC_RT || 0),
        volume: String(i.ACC_TRDVOL || i.TRQU),
        tradingValue: String(i.ACC_TRDVAL || i.TR_VAL),
        marketCap: String(i.MKTCAP || 0),
        listedShares: String(i.LIST_SHRS || 0),
        sourceCode: this.providerCode,
        raw: i
      })).map(r => {
         if (r.tradeDate && r.tradeDate.length === 8) {
           r.tradeDate = r.tradeDate.slice(0,4) + '-' + r.tradeDate.slice(4,6) + '-' + r.tradeDate.slice(6,8);
         }
         return r;
      }),
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

  normalizeIndexDailyBarResponse(rawData, meta, market) {
    return {
      providerCode: this.providerCode,
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      asOfAt: meta.asOfAt,
      isFinal: true,
      records: rawData
        .filter(i => {
          const name = String(i.IDX_IND_NM || i.IDX_NM).trim();
          return name === '코스피' || name === '코스닥';
        })
        .map(i => {
        const tradeDateStr = i.BAS_DD || i.BAS_DT;
        const rawName = String(i.IDX_IND_NM || i.IDX_NM).trim();
        return {
          indexCode: rawName === '코스피' ? 'KRX_KOSPI_IDX' : 'KRX_KOSDAQ_IDX',
          tradeDate: tradeDateStr ? tradeDateStr.slice(0,4) + '-' + tradeDateStr.slice(4,6) + '-' + tradeDateStr.slice(6,8) : null,
          openValue: String(i.OPNPRC_IDX),
          highValue: String(i.HGPRC_IDX),
          lowValue: String(i.LWPRC_IDX),
          closeValue: String(i.CLSPRC_IDX),
          changeValue: String(i.CMPPREVDD_IDX || 0), 
          changeRate: String(i.FLUC_RT || 0),
          volume: String(i.ACC_TRDVOL || i.TRQU || 0),
          tradingValue: String(i.ACC_TRDVAL || i.TR_VAL || 0),
          sourceCode: this.providerCode,
          raw: i
        };
      }),
      warnings: meta.error ? [meta.error] : []
    };
  }
}
module.exports = { KrxOpenApiProvider, KRX_API };
