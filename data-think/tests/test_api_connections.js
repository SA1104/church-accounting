'use strict';
/**
 * Data Think Engine - 테스트 스크립트
 * API 연결 가능성 검증 (실제 API 키 없어도 구조 테스트)
 */

require('dotenv').config();
const https = require('https');
const http = require('http');

const results = [];

function test(name, fn) {
  return fn()
    .then((result) => {
      results.push({ name, status: '✅ PASS', result });
      console.log(`✅ ${name}: PASS`, result ? `(${result})` : '');
    })
    .catch((err) => {
      results.push({ name, status: '❌ FAIL', error: err.message });
      console.error(`❌ ${name}: FAIL -`, err.message);
    });
}

function httpGet(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    const req = lib.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 300) }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.setTimeout(timeout);
  });
}

async function runTests() {
  console.log('\n================================================');
  console.log('Data Think Engine - API 연결 테스트');
  console.log('================================================\n');

  // 1. ECOS API (sample key 사용)
  await test('ECOS API 연결 테스트 (sample key)', async () => {
    const url = 'https://ecos.bok.or.kr/api/StatisticTableList/sample/json/kr/1/5';
    const { status } = await httpGet(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return `HTTP ${status} OK`;
  });

  // 2. ECOS 통계 데이터 조회 (기준금리 샘플)
  await test('ECOS StatisticSearch 데이터 조회 테스트', async () => {
    const url = 'https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/5/722Y001/M/202401/202406';
    const { status, body } = await httpGet(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const parsed = JSON.parse(body);
    if (parsed.RESULT && parsed.RESULT.CODE !== 'INFO-000') {
      return `응답코드: ${parsed.RESULT.CODE} (${parsed.RESULT.MESSAGE})`;
    }
    const rowCount = parsed.StatisticSearch?.row?.length || 0;
    return `조회 성공, ${rowCount}건 반환`;
  });

  // 3. DART API (API 키 없이 테스트)
  await test('DART OpenAPI 접속 테스트', async () => {
    const apiKey = process.env.DART_API_KEY || 'test';
    const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&bgn_de=20260629&end_de=20260630&page_count=5`;
    const { status, body } = await httpGet(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const parsed = JSON.parse(body);
    return `상태: ${parsed.status} (${parsed.message || '없음'})`;
  });

  // 4. FRED API (API 키 없이 테스트)
  await test('FRED API 접속 테스트', async () => {
    const apiKey = process.env.FRED_API_KEY || 'test';
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${apiKey}&file_type=json&observation_start=2026-06-01&observation_end=2026-06-30`;
    const { status, body } = await httpGet(url);
    if (status === 200) {
      const parsed = JSON.parse(body);
      const count = parsed.observations?.length || 0;
      return `관측값 ${count}건 반환`;
    }
    if (status === 400) {
      return `API키 필요 (HTTP ${status}) - 키 발급 후 재테스트`;
    }
    throw new Error(`HTTP ${status}`);
  });

  // 5. World Bank API (인증 불필요)
  await test('World Bank API 접속 테스트 (인증 불필요)', async () => {
    const url = 'https://api.worldbank.org/v2/country/KOR/indicator/NY.GDP.MKTP.CD?format=json&date=2023';
    const { status, body } = await httpGet(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const parsed = JSON.parse(body);
    const data = parsed[1];
    return `GDP 데이터 ${data?.length || 0}건 반환 (인증 불필요 확인)`;
  });

  // 6. KRX 접속 테스트
  await test('KRX data.krx.co.kr 접속 테스트', async () => {
    const url = 'http://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?siteId=MDC';
    const { status } = await httpGet(url, 10000);
    return `HTTP ${status}`;
  });

  // 7. Yahoo Finance 접속 테스트 (삼성전자)
  await test('Yahoo Finance 삼성전자 (005930.KS) 접속 테스트', async () => {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/005930.KS?interval=1d&range=5d';
    const { status, body } = await httpGet(url);
    if (status !== 200) throw new Error(`HTTP ${status}`);
    const parsed = JSON.parse(body);
    const meta = parsed.chart?.result?.[0]?.meta;
    if (meta) {
      return `종가: ${meta.regularMarketPrice} ${meta.currency}`;
    }
    return `HTTP ${status} OK`;
  });

  // 8. R-ONE (한국부동산원) 접속 테스트
  await test('R-ONE 한국부동산원 API 접속 테스트', async () => {
    const url = 'https://www.reb.or.kr/r-one/openapi/SttsApiTbl.do?Type=json&pIndex=1&pSize=5&STATBL_ID=test';
    const { status } = await httpGet(url);
    return `HTTP ${status} (API키 발급 후 재테스트)`;
  });

  // 9. OECD API (인증 불필요)
  await test('OECD SDMX API 접속 테스트 (인증 불필요)', async () => {
    const url = 'https://sdmx.oecd.org/public/rest/data/OECD,DSD_MEI@DF_MEI_PRICES,/KOR.CPALTT01.GY?startPeriod=2024-01&endPeriod=2024-06&dimensionAtObservation=TIME_PERIOD';
    const { status } = await httpGet(url);
    return `HTTP ${status}`;
  });

  // 10. 환경변수 설정 상태 확인
  await test('API Key 설정 상태 확인', async () => {
    const keys = {
      ECOS_API_KEY: process.env.ECOS_API_KEY,
      KOSIS_API_KEY: process.env.KOSIS_API_KEY,
      DART_API_KEY: process.env.DART_API_KEY,
      FRED_API_KEY: process.env.FRED_API_KEY,
      DATA_GO_KR_API_KEY: process.env.DATA_GO_KR_API_KEY,
      ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
      DATA_THINK_SUPABASE_URL: process.env.DATA_THINK_SUPABASE_URL,
    };
    const configured = Object.entries(keys)
      .filter(([_, v]) => v && v !== 'your_ecos_api_key_here')
      .map(([k]) => k);
    const missing = Object.entries(keys)
      .filter(([_, v]) => !v || v.startsWith('your_'))
      .map(([k]) => k);
    if (missing.length > 0) {
      return `설정됨: ${configured.length}개 | 미설정: ${missing.join(', ')}`;
    }
    return `모든 API Key 설정 완료 (${configured.length}개)`;
  });

  // 결과 요약
  console.log('\n================================================');
  console.log('테스트 결과 요약');
  console.log('================================================');
  const passed = results.filter((r) => r.status.includes('PASS')).length;
  const failed = results.filter((r) => r.status.includes('FAIL')).length;
  console.log(`✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`📊 합계: ${results.length}개`);

  console.log('\n=== API 발급 안내 ===');
  console.log('1. 한국은행 ECOS  : https://ecos.bok.or.kr → 회원가입 → 인증키 신청');
  console.log('2. KOSIS          : https://kosis.kr/openapi → 회원가입 → 활용신청');
  console.log('3. DART           : https://opendart.fss.or.kr → 회원가입 → 인증키 신청');
  console.log('4. FRED           : https://fred.stlouisfed.org → Account → API Keys');
  console.log('5. 공공데이터포털  : https://www.data.go.kr → 회원가입 → API 활용신청');
  console.log('6. Alpha Vantage  : https://www.alphavantage.co → FREE API KEY');
  console.log('\n.env 파일에 API 키를 입력한 후 수집기를 실행하세요.');
}

runTests().catch(console.error);
