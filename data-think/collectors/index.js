'use strict';
/**
 * Data Think Engine - 수집기 통합 모듈 (Factory & Runner)
 *
 * 역할:
 * 1. jobCode로 수집기 인스턴스를 반환하는 팩토리 (getCollector)
 * 2. 단일 수집기 실행 (runCollector)
 * 3. 일별/월별 전체 수집기 순차 실행 (runAllDaily / runAllMonthly)
 *
 * 사용 예시:
 *   const { runCollector, runAllDaily } = require('./collectors');
 *   await runCollector('ECOS_DAILY');
 *   await runAllDaily();
 */

const EcosCollector = require('./ecos');
const KrxCollector  = require('./krx');
const DartCollector = require('./dart');
const FredCollector = require('./fred');
const RebCollector  = require('./reb');
const KosisCollector = require('./kosis');

// ──────────────────────────────────────────────
// Job 코드 → 수집기 정의 매핑 테이블
// ──────────────────────────────────────────────

/**
 * COLLECTOR_MAP
 * key   : job_code (data_collection_jobs 테이블의 job_code 값과 일치해야 함)
 * value : {
 *   CollectorClass  : 수집기 클래스 (new로 인스턴스화)
 *   constructorArgs : 생성자에 전달할 인수 배열
 *   frequency       : 'daily' | 'monthly' | 'quarterly'
 *   description     : 수집기 설명
 * }
 */
const COLLECTOR_MAP = {
  // ── 한국은행 (ECOS) ─────────────────────────
  'ECOS_DAILY': {
    CollectorClass: EcosCollector,
    constructorArgs: ['daily'],
    frequency: 'daily',
    description: '한국은행 ECOS 일별 지표 (금리·환율)',
  },
  'ECOS_MONTHLY': {
    CollectorClass: EcosCollector,
    constructorArgs: ['monthly'],
    frequency: 'monthly',
    description: '한국은행 ECOS 월별 지표 (통화량·물가·경상수지)',
  },
  'ECOS_QUARTERLY': {
    CollectorClass: EcosCollector,
    constructorArgs: ['quarterly'],
    frequency: 'quarterly',
    description: '한국은행 ECOS 분기별 지표 (GDP 등)',
  },

  // ── 한국거래소 (KRX) ─────────────────────────
  'KRX_DAILY_PRICE': {
    CollectorClass: KrxCollector,
    constructorArgs: [],
    frequency: 'daily',
    description: 'KRX 일별 주가 (KOSPI/KOSDAQ 상위 100 + 지수 + 수급)',
  },

  // ── 금융감독원 DART ───────────────────────────
  'DART_DAILY': {
    CollectorClass: DartCollector,
    constructorArgs: [],
    frequency: 'daily',
    description: 'DART 당일 공시 전체 (A~E 유형)',
  },

  // ── 미국 연방준비제도 (FRED) ─────────────────
  'FRED_DAILY': {
    CollectorClass: FredCollector,
    constructorArgs: [],
    frequency: 'daily',
    description: 'FRED 글로벌 지표 (금리·지수·유가·달러인덱스)',
  },

  // ── 한국부동산원 (REB) ───────────────────────
  'REB_MONTHLY': {
    CollectorClass: RebCollector,
    constructorArgs: [],
    frequency: 'monthly',
    description: '한국부동산원 부동산 통계 (아파트 매매/전세 지수)',
  },

  // ── 국가통계포털 (KOSIS) ─────────────────────
  'KOSIS_MONTHLY': {
    CollectorClass: KosisCollector,
    constructorArgs: ['monthly'],
    frequency: 'monthly',
    description: 'KOSIS 월별 지표 (물가·고용·생산 등)',
  },
  'KOSIS_YEARLY': {
    CollectorClass: KosisCollector,
    constructorArgs: ['yearly'],
    frequency: 'yearly',
    description: 'KOSIS 연별 지표 (인구 등)',
  },
};

// ──────────────────────────────────────────────
// 팩토리 함수
// ──────────────────────────────────────────────

/**
 * jobCode에 해당하는 수집기 인스턴스를 반환
 * @param {string} jobCode - COLLECTOR_MAP의 키
 * @returns {import('./base').BaseCollector} 수집기 인스턴스
 * @throws {Error} 알 수 없는 jobCode인 경우
 */
function getCollector(jobCode) {
  const def = COLLECTOR_MAP[jobCode];
  if (!def) {
    const available = Object.keys(COLLECTOR_MAP).join(', ');
    throw new Error(
      `알 수 없는 jobCode: '${jobCode}'\n사용 가능한 코드: ${available}`
    );
  }

  const { CollectorClass, constructorArgs } = def;
  return new CollectorClass(...(constructorArgs || []));
}

// ──────────────────────────────────────────────
// 실행 함수
// ──────────────────────────────────────────────

/**
 * 단일 수집기 실행
 * @param {string} jobCode - 실행할 수집기 job 코드
 * @returns {Promise<Object>} 수집 통계 (stats)
 */
async function runCollector(jobCode) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Index] 수집기 실행: ${jobCode}`);
  console.log(`${'='.repeat(60)}`);

  const collector = getCollector(jobCode);

  const startTime = Date.now();
  await collector.run();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[Index] ${jobCode} 완료 (${elapsed}초)`);
  return collector.stats;
}

/**
 * 모든 daily 빈도 수집기 순차 실행
 * 수집 순서: FRED → ECOS → KRX → DART
 * (해외 지표를 먼저 수집해 DB에 기준 데이터 확보)
 * @returns {Promise<{ results: Object, errors: Object }>}
 */
async function runAllDaily() {
  console.log('\n[Index] ===== 일별 전체 수집 시작 =====');

  // 명시적 순서로 daily job 목록 구성
  const FIXED_ORDER = ['FRED_DAILY', 'ECOS_DAILY', 'KRX_DAILY_PRICE', 'DART_DAILY'];
  const remainingDaily = Object.entries(COLLECTOR_MAP)
    .filter(([code, def]) => def.frequency === 'daily' && !FIXED_ORDER.includes(code))
    .map(([code]) => code);
  const orderedDailyJobs = [...FIXED_ORDER, ...remainingDaily];

  const results = {};
  const errors  = {};

  for (const jobCode of orderedDailyJobs) {
    try {
      results[jobCode] = await runCollector(jobCode);
    } catch (err) {
      console.error(`[Index] ${jobCode} 실패:`, err.message);
      errors[jobCode] = err.message;
    }

    // 수집기 간 2초 대기 (시스템 부하 분산)
    await sleep(2000);
  }

  console.log('\n[Index] ===== 일별 수집 결과 요약 =====');
  for (const [jobCode, stats] of Object.entries(results)) {
    console.log(
      `  ${jobCode.padEnd(22)}: 수집=${stats.rows_fetched}, 저장=${stats.rows_inserted}, 실패=${stats.rows_failed}`
    );
  }
  if (Object.keys(errors).length > 0) {
    console.error('[Index] 실패 목록:', errors);
  }

  return { results, errors };
}

/**
 * 모든 monthly 빈도 수집기 순차 실행
 * @returns {Promise<{ results: Object, errors: Object }>}
 */
async function runAllMonthly() {
  console.log('\n[Index] ===== 월별 전체 수집 시작 =====');

  const monthlyJobs = Object.entries(COLLECTOR_MAP)
    .filter(([, def]) => def.frequency === 'monthly')
    .map(([code]) => code);

  const results = {};
  const errors  = {};

  for (const jobCode of monthlyJobs) {
    try {
      results[jobCode] = await runCollector(jobCode);
    } catch (err) {
      console.error(`[Index] ${jobCode} 실패:`, err.message);
      errors[jobCode] = err.message;
    }

    await sleep(2000);
  }

  console.log('\n[Index] ===== 월별 수집 결과 요약 =====');
  for (const [jobCode, stats] of Object.entries(results)) {
    console.log(
      `  ${jobCode.padEnd(22)}: 수집=${stats.rows_fetched}, 저장=${stats.rows_inserted}, 실패=${stats.rows_failed}`
    );
  }
  if (Object.keys(errors).length > 0) {
    console.error('[Index] 실패 목록:', errors);
  }

  return { results, errors };
}

// ──────────────────────────────────────────────
// 내부 유틸
// ──────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// 내보내기
// ──────────────────────────────────────────────

module.exports = {
  COLLECTOR_MAP,
  getCollector,
  runCollector,
  runAllDaily,
  runAllMonthly,
};

// 직접 실행: node collectors/index.js [jobCode|daily|monthly|all]
if (require.main === module) {
  const arg = process.argv[2] || 'help';

  if (arg === 'daily') {
    runAllDaily().catch(console.error);
  } else if (arg === 'monthly') {
    runAllMonthly().catch(console.error);
  } else if (arg === 'all') {
    runAllDaily()
      .then(() => sleep(3000))
      .then(() => runAllMonthly())
      .catch(console.error);
  } else if (COLLECTOR_MAP[arg]) {
    runCollector(arg).catch(console.error);
  } else {
    console.log('사용법: node collectors/index.js [jobCode|daily|monthly|all]');
    console.log('\n사용 가능한 jobCode:');
    for (const [code, def] of Object.entries(COLLECTOR_MAP)) {
      console.log(`  ${code.padEnd(22)} [${def.frequency.padEnd(9)}] ${def.description}`);
    }
  }
}
