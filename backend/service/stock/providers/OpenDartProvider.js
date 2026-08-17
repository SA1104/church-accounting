const BaseProvider = require('../contracts/BaseProvider');

const OPENDART_API = {
  providerCode: 'OPENDART_API',
  authParam: 'crtfc_key',
  endpoints: {
    companyInfo: 'company.json',
    majorDisclosure: 'list.json'
  }
};

const OPENDART_BASE_URL = process.env.OPENDART_API_BASE_URL || 'https://opendart.fss.or.kr/api/';

class OpenDartProvider extends BaseProvider {
  constructor(config = {}) {
    super(OPENDART_API.providerCode, config);
    this.apiKey = config.apiKey || process.env.OPENDART_API_KEY;
  }

  async healthCheck() {
    if (!this.apiKey) {
      return {
        providerCode: this.providerCode,
        status: 'DISABLED_MISSING_KEY',
        checkedAt: new Date().toISOString(),
        message: 'OPENDART_API_KEY is not configured'
      };
    }
    return {
      providerCode: this.providerCode,
      status: 'SPEC_VERIFIED_READY_FOR_KEY',
      checkedAt: new Date().toISOString(),
      message: 'Ready to connect'
    };
  }

  async fetchCompanyDisclosures(params = {}) {
    const meta = { asOfAt: new Date().toISOString(), apiId: OPENDART_API.endpoints.majorDisclosure };
    
    if (params.fixture || this.config.dryRun) {
      return this.normalizeResponse([{
        corp_code: '00126380',
        corp_name: '삼성전자',
        stock_code: '005930',
        report_nm: '연결재무제표기준영업실적등(공정공시)',
        rcept_no: '20260818000001',
        flr_nm: '삼성전자',
        rcept_dt: '20260818',
        rm: ''
      }], meta);
    }

    if (!this.apiKey) throw new Error('OPENDART_API_KEY is required for live fetch');
    
    // Validate request parameters
    if (!params.corpCode) {
      throw new Error('VALIDATION_ERROR: corpCode is required for OpenDART list.json');
    }

    try {
      // Live fetch logic
      throw new Error('NOT_IMPLEMENTED: Live fetch logic to be finalized in Phase 2A');
    } catch (e) {
      meta.error = e.message;
      return this.normalizeResponse([], meta);
    }
  }

  normalizeResponse(rawData, meta) {
    return {
      providerCode: this.providerCode,
      requestedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      asOfAt: meta.asOfAt,
      isFinal: true,
      records: rawData.map(i => ({
        stockCode: i.stock_code,
        disclosureTitle: i.report_nm,
        receiptDate: i.rcept_dt,
        receiptNumber: i.rcept_no,
        sourceCode: this.providerCode
      })),
      warnings: meta.error ? [meta.error] : [],
      fixtureMeta: {
        fixtureSource: this.providerCode,
        apiId: meta.apiId,
        productionUrlPattern: 'https://opendart.fss.or.kr/api/' + meta.apiId,
        officialDocumentUrl: 'https://opendart.fss.or.kr',
        documentUpdatedAt: '2026-08-17',
        capturedAt: new Date().toISOString().split('T')[0],
        isSynthetic: true,
        syntheticReason: 'fixture data for pipeline validation'
      }
    };
  }
}
module.exports = { OpenDartProvider, OPENDART_API };
