const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: 'backend/.env.development' });

// We use the KrxOpenApiProvider but override its fetch to prevent internal retries and capture raw.
const { KrxOpenApiProvider } = require('./backend/service/stock/providers/KrxOpenApiProvider');

async function captureRaw() {
  const runId = crypto.randomUUID();
  const today = new Date().toISOString().split('T')[0];
  const outDir = path.join(__dirname, 'database', 'evidence', 'krx', today);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const manifestPath = path.join(outDir, 'krx_capture_manifest.json');
  if (fs.existsSync(manifestPath)) {
    const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (existing.status === 'SUCCESS' && existing.kospiRecordCount > 0 && existing.kosdaqRecordCount > 0) {
      console.log('Capture already completed successfully today. Aborting to prevent duplicate calls.');
      return;
    }
  }

  process.env.KRX_MAX_RETRIES = '0';
  const provider = new KrxOpenApiProvider();
  
  // Override httpClient to capture raw JSON string and headers without exposing keys
  const originalFetch = global.fetch;
  let networkCallCount = 0;
  
  const manifest = {
    runId,
    captureDate: today,
    captureStartedAt: new Date().toISOString(),
    captureStartedAtKst: new Date(Date.now() + 9 * 3600000).toISOString().replace('Z', '+09:00'),
    status: 'INCOMPLETE',
    networkCallCount: 0,
    retryCount: 0,
    kospiRecordCount: 0,
    kosdaqRecordCount: 0,
    sourceRecordsTotal: 0,
    kospiRawSha256: null,
    kosdaqRawSha256: null,
    dbWriteCount: 0,
    errors: []
  };

  async function fetchAndSave(market, endpoint, filename) {
    const url = `https://data-dbg.krx.co.kr/svc/apis/sto/${endpoint}`;
    networkCallCount++;
    manifest.networkCallCount = networkCallCount;
    
    const query = new URLSearchParams({ basDd: '20260814' }).toString();
    const fullUrl = `${url}?${query}`;
    
    console.log(`Calling ${fullUrl} for ${market}...`);
    const response = await originalFetch(fullUrl, {
      headers: { 'AUTH_KEY': process.env.KRX_OPEN_API_AUTH_KEY }
    });
    
    const record = {
      market,
      endpoint,
      httpStatus: response.status,
      calledAtUtc: new Date().toISOString(),
      calledAtKst: new Date(Date.now() + 9 * 3600000).toISOString().replace('Z', '+09:00'),
      requestParams: {}
    };

    if (!response.ok) {
      const errTxt = await response.text();
      record.error = errTxt;
      manifest.errors.push(`HTTP ${response.status} on ${market}`);
      fs.writeFileSync(path.join(outDir, `error_${market}.json`), JSON.stringify(record, null, 2));
      throw new Error(`HTTP ${response.status} from KRX API: ${errTxt}`);
    }

    const rawText = await response.text();
    const sha256 = crypto.createHash('sha256').update(rawText).digest('hex');
    const parsed = JSON.parse(rawText);
    const count = parsed.OutBlock_1 ? parsed.OutBlock_1.length : 0;
    
    record.recordCount = count;
    record.sha256 = sha256;
    
    fs.writeFileSync(path.join(outDir, filename), rawText);
    fs.writeFileSync(path.join(outDir, `${filename}.meta.json`), JSON.stringify(record, null, 2));
    
    return { count, sha256 };
  }

  try {
    const kospiRes = await fetchAndSave('KOSPI', 'stk_isu_base_info', 'krx_kospi_raw.json');
    manifest.kospiRecordCount = kospiRes.count;
    manifest.kospiRawSha256 = kospiRes.sha256;

    const kosdaqRes = await fetchAndSave('KOSDAQ', 'ksq_isu_base_info', 'krx_kosdaq_raw.json');
    manifest.kosdaqRecordCount = kosdaqRes.count;
    manifest.kosdaqRawSha256 = kosdaqRes.sha256;
    
    manifest.sourceRecordsTotal = manifest.kospiRecordCount + manifest.kosdaqRecordCount;
    manifest.status = 'SUCCESS';
  } catch (err) {
    console.error('Capture failed:', err.message);
    manifest.status = 'KRX_SOURCE_CAPTURE_INCOMPLETE';
    manifest.errors.push(err.message);
  } finally {
    manifest.captureCompletedAt = new Date().toISOString();
    manifest.captureCompletedAtKst = new Date(Date.now() + 9 * 3600000).toISOString().replace('Z', '+09:00');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

if (require.main === module) {
  if (process.argv.includes('--mock')) {
    global.fetch = async (url) => {
      console.log('[MOCK] Fetching', url);
      if (url.includes('stk')) {
        return { ok: true, status: 200, text: async () => JSON.stringify({ OutBlock_1: [{ ISU_SRT_CD: '005930' }] }) };
      }
      return { ok: true, status: 200, text: async () => JSON.stringify({ OutBlock_1: [{ ISU_SRT_CD: '091990' }] }) };
    };
  }
  captureRaw().catch(console.error);
} else {
  module.exports = { captureRaw };
}
