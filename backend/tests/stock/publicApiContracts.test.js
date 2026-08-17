const fs = require('fs');
const assert = require('assert');
const path = require('path');

const manifestPath = path.join(__dirname, '../../../docs/stock/provider-spec-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const { KrxOpenApiProvider, KRX_API } = require('../../service/stock/providers/KrxOpenApiProvider');
const { FscStockPriceProvider, FSC_API } = require('../../service/stock/providers/FscStockPriceProvider');

function runTests() {
  console.log('Running Endpoint Anti-Guessing Tests...');

  // KRX Data Host
  const krxDataHost = manifest.KRX_OPEN_API.dataHost;
  const krxBaseUrl = process.env.KRX_OPEN_API_BASE_URL || 'https://data-dbg.krx.co.kr/svc/apis/sto/';
  assert(krxDataHost === 'data-dbg.krx.co.kr', 'KRX Data Host must be data-dbg.krx.co.kr');
  assert(!krxBaseUrl.includes('openapi.krx.co.kr/openapi/v1'), 'KRX Base URL must NOT be openapi.krx.co.kr/openapi/v1');

  // KRX API IDs
  assert(KRX_API.endpoints.kospiDaily === 'stk_bydd_trd', 'KRX KOSPI Daily API ID mismatch');
  assert(KRX_API.endpoints.kosdaqDaily === 'ksq_bydd_trd', 'KRX KOSDAQ Daily API ID mismatch');
  
  // KRX Auth Header
  assert(KRX_API.authHeader === 'AUTH_KEY', 'KRX Auth Header mismatch');

  // FSC Base URL
  const fscBaseUrl = process.env.DATA_GO_KR_BASE_URL || 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/';
  assert(!fscBaseUrl.endsWith('/1160100/smi/eod'), 'FSC Base URL must not be the old smi/eod endpoint');
  assert(fscBaseUrl.includes('GetStockSecuritiesInfoService'), 'FSC Base URL must include GetStockSecuritiesInfoService');
  
  // FSC Operation
  assert(FSC_API.endpoints.dailyPrice === 'getStockPriceInfo', 'FSC Operation must be getStockPriceInfo');

  // Env vars isolated
  const krxEnv = process.env.KRX_OPEN_API_AUTH_KEY;
  const fscEnv = process.env.DATA_GO_KR_SERVICE_KEY;
  if (krxEnv && fscEnv) {
    assert(krxEnv !== fscEnv, 'KRX and FSC env vars must not be identical');
  }

  console.log('SPEC_CONTRACT_PASS');
}

try {
  runTests();
} catch (e) {
  console.error('Test Failed:', e.message);
  process.exit(1);
}
