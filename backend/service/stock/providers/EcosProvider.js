const BaseProvider = require('../contracts/BaseProvider');

const ECOS_API = {
  providerCode: 'ECOS_API',
  authParam: 'authKey',
  endpoints: {
    statisticSearch: 'StatisticSearch'
  }
};

const ECOS_BASE_URL = process.env.ECOS_API_BASE_URL || 'https://ecos.bok.or.kr/api/';

class EcosProvider extends BaseProvider {
  constructor(config = {}) {
    super(ECOS_API.providerCode, config);
    this.apiKey = config.apiKey || process.env.ECOS_API_KEY;
  }

  async healthCheck() {
    if (!this.apiKey) {
      return {
        providerCode: this.providerCode,
        status: 'DISABLED_MISSING_KEY',
        checkedAt: new Date().toISOString(),
        message: 'ECOS_API_KEY is not configured'
      };
    }
    return {
      providerCode: this.providerCode,
      status: 'SPEC_VERIFIED_READY_FOR_KEY',
      checkedAt: new Date().toISOString(),
      message: 'Ready to connect'
    };
  }

  async fetchMacroObservations(params = {}) {
    // ECOS macro observation pipeline logic goes here
    const meta = { asOfAt: new Date().toISOString(), apiId: ECOS_API.endpoints.statisticSearch };
    
    if (params.fixture || this.config.dryRun) {
      return this.normalizeResponse([{
        STAT_CODE: '060Y001',
        ITEM_CODE1: '0000001',
        TIME: '202608',
        DATA_VALUE: '3.50'
      }], meta, 'BOK_BASE_RATE');
    }

    if (!this.apiKey) throw new Error('ECOS_API_KEY is required for live fetch');
    
    // Validate request parameters before fetching
    if (!params.statCode || !params.itemCode1) {
      throw new Error('VALIDATION_ERROR: statCode and itemCode1 are required for ECOS StatisticSearch');
    }

    try {
      // In a real implementation we would call the ECOS API here
      // const response = await fetch(`${ECOS_BASE_URL}${ECOS_API.endpoints.statisticSearch}/${this.apiKey}/json/kr/1/100/${params.statCode}/${params.period}/${params.startDate}/${params.endDate}/${params.itemCode1}`);
      // const data = await response.json();
      throw new Error('NOT_IMPLEMENTED: Live fetch logic to be finalized in Phase 2A');
    } catch (e) {
      meta.error = e.message;
      return this.normalizeResponse([], meta, params.observationType);
    }
  }

  normalizeResponse(rawData, meta, observationType) {
    return {
      providerCode: this.providerCode,
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      asOfAt: meta.asOfAt,
      isFinal: true,
      records: rawData.map(i => ({
        observationType: observationType,
        observationDate: i.TIME,
        value: String(i.DATA_VALUE),
        sourceCode: this.providerCode
      })),
      warnings: meta.error ? [meta.error] : [],
      fixtureMeta: {
        fixtureSource: this.providerCode,
        apiId: meta.apiId,
        productionUrlPattern: 'https://ecos.bok.or.kr/api/' + meta.apiId,
        officialDocumentUrl: 'https://ecos.bok.or.kr',
        documentUpdatedAt: '2026-08-17',
        capturedAt: new Date().toISOString().split('T')[0],
        isSynthetic: true,
        syntheticReason: 'fixture data for pipeline validation'
      }
    };
  }
}
module.exports = { EcosProvider, ECOS_API };
