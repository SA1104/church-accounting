'use strict';
/**
 * Data Think Engine - Job Scheduler
 * node-cron 기반 수집 스케줄러
 *
 * 등록된 Job:
 * - ECOS_DAILY:       매일 18:00 (월-금)              → '0 18 * * 1-5'
 * - ECOS_MONTHLY:     매월 10일 09:00                 → '0 9 10 * *'
 * - ECOS_QUARTERLY:   1,4,7,10월 15일 09:00           → '0 9 15 1,4,7,10 *'
 * - KOSIS_MONTHLY:    매월 15일 10:00                 → '0 10 15 * *'
 * - KOSIS_YEARLY:     매년 2월 1일 09:00              → '0 9 1 2 *'
 * - REB_MONTHLY:      매월 20일 10:00                 → '0 10 20 * *'
 * - REB_QUARTERLY:    1,4,7,10월 25일 11:00           → '0 11 25 1,4,7,10 *'
 * - MOLIT_MONTHLY:    매월 20일 10:30                 → '30 10 20 * *'
 * - KRX_STOCK_LIST:   매일 07:00 (월-금)              → '0 7 * * 1-5'
 * - KRX_DAILY_PRICE:  매일 18:00 (월-금)              → '0 18 * * 1-5'
 * - KRX_MARKET_INDEX: 매일 18:30 (월-금)              → '30 18 * * 1-5'
 * - DART_DAILY:       홀수시간 09-18:00 (월-금)       → '0 * / 2 9-18 * 1-5'
 * - FRED_DAILY:       매일 07:30 (월-금)              → '30 7 * * 1-5'
 * - FRED_MONTHLY:     매월 5일 08:00                  → '0 8 5 * *'
 */

const cron = require('node-cron');
const { runCollector } = require('../collectors/index');

/** 등록된 크론 작업 인스턴스를 추적 */
const registeredTasks = new Map();

/**
 * Job 정의 배열
 * job_code 는 DB의 data_collection_jobs.job_code 와 동일하게 유지
 */
const JOB_DEFINITIONS = [
  {
    code: 'ECOS_DAILY',
    name: 'ECOS 일별 지표 수집 (환율/금리)',
    cron: '0 18 * * 1-5',
    description: '매일 오후 6시 (평일)',
  },
  {
    code: 'ECOS_MONTHLY',
    name: 'ECOS 월별 지표 수집 (통화/물가)',
    cron: '0 9 10 * *',
    description: '매월 10일 오전 9시',
  },
  {
    code: 'ECOS_QUARTERLY',
    name: 'ECOS 분기별 지표 수집 (GDP/투자)',
    cron: '0 9 15 1,4,7,10 *',
    description: '1,4,7,10월 15일 오전 9시',
  },
  {
    code: 'KOSIS_MONTHLY',
    name: 'KOSIS 월별 지표 수집',
    cron: '0 10 15 * *',
    description: '매월 15일 오전 10시',
  },
  {
    code: 'KOSIS_YEARLY',
    name: 'KOSIS 연별 지표 수집',
    cron: '0 9 1 2 *',
    description: '매년 2월 1일 오전 9시',
  },
  {
    code: 'REB_MONTHLY',
    name: 'REB 월별 부동산 지표 수집',
    cron: '0 10 20 * *',
    description: '매월 20일 오전 10시',
  },
  {
    code: 'REB_QUARTERLY',
    name: 'REB 분기별 상업용 부동산 수집',
    cron: '0 11 25 1,4,7,10 *',
    description: '1,4,7,10월 25일 오전 11시',
  },
  {
    code: 'MOLIT_MONTHLY',
    name: 'MOLIT 월별 실거래가 수집',
    cron: '30 10 20 * *',
    description: '매월 20일 오전 10시 30분',
  },
  {
    code: 'KRX_STOCK_LIST',
    name: 'KRX 종목 목록 수집',
    cron: '0 7 * * 1-5',
    description: '매일 오전 7시 (평일, 장전)',
  },
  {
    code: 'KRX_DAILY_PRICE',
    name: 'KRX 일봉 데이터 수집',
    cron: '0 18 * * 1-5',
    description: '매일 오후 6시 (평일, 장후)',
  },
  {
    code: 'KRX_MARKET_INDEX',
    name: 'KRX 시장 지수 및 수급 수집',
    cron: '30 18 * * 1-5',
    description: '매일 오후 6시 30분 (평일)',
  },
  {
    code: 'DART_DAILY',
    name: 'DART 공시 수집',
    cron: '0 */2 9-18 * 1-5',
    // 주의: node-cron 은 '9-18' 범위를 지원합니다.
    // 단, 실제 실행 확인 후 필요 시 '0 9,11,13,15,17 * * 1-5' 로 변경
    description: '평일 09시-18시 사이 2시간마다',
  },
  {
    code: 'FRED_DAILY',
    name: 'FRED 일별 글로벌 지표 수집',
    cron: '30 7 * * 1-5',
    description: '매일 오전 7시 30분 (평일)',
  },
  {
    code: 'FRED_MONTHLY',
    name: 'FRED 월별 글로벌 지표 수집',
    cron: '0 8 5 * *',
    description: '매월 5일 오전 8시',
  },
];

/**
 * 개별 Job 실행 핸들러
 * @param {Object} jobDef - Job 정의 객체
 */
async function executeJob(jobDef) {
  console.log(`\n[Scheduler] ▶ Job 시작: ${jobDef.code} (${new Date().toLocaleString('ko-KR')})`);
  const startTime = Date.now();

  try {
    await runCollector(jobDef.code);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Scheduler] ✓ Job 완료: ${jobDef.code} (${elapsed}초 소요)`);
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(
      `[Scheduler] ✗ Job 실패: ${jobDef.code} (${elapsed}초 소요)`,
      `\n  오류: ${error.message}`
    );
    // 개별 Job 오류가 전체 스케줄러를 중단시키지 않도록 여기서 포착
  }
}

/**
 * 스케줄러 시작
 * 모든 Job을 cron 표현식에 따라 등록합니다.
 */
function startScheduler() {
  console.log('\n' + '='.repeat(60));
  console.log('  Data Think Engine - 스케줄러 시작');
  console.log('  시작 시각:', new Date().toLocaleString('ko-KR'));
  console.log('='.repeat(60));

  let registeredCount = 0;

  for (const jobDef of JOB_DEFINITIONS) {
    // node-cron 유효성 검사
    if (!cron.validate(jobDef.cron)) {
      console.error(`[Scheduler] ⚠ 잘못된 cron 표현식 (${jobDef.code}): ${jobDef.cron}`);
      continue;
    }

    // 이미 등록된 Job은 스킵 (재시작 방지)
    if (registeredTasks.has(jobDef.code)) {
      console.warn(`[Scheduler] 이미 등록된 Job: ${jobDef.code}`);
      continue;
    }

    const task = cron.schedule(
      jobDef.cron,
      () => executeJob(jobDef),
      {
        scheduled: true,
        timezone: 'Asia/Seoul', // 한국 표준시 (KST = UTC+9)
      }
    );

    registeredTasks.set(jobDef.code, task);
    registeredCount++;

    console.log(
      `  [등록됨] ${jobDef.code.padEnd(18)} | ${jobDef.cron.padEnd(20)} | ${jobDef.description}`
    );
  }

  console.log('='.repeat(60));
  console.log(`  총 ${registeredCount}개 Job 등록 완료`);
  console.log('='.repeat(60) + '\n');

  return registeredCount;
}

/**
 * 스케줄러 중지
 * SIGINT/SIGTERM 수신 시 또는 테스트 종료 시 호출
 */
function stopScheduler() {
  console.log('\n[Scheduler] 스케줄러 종료 중...');

  for (const [code, task] of registeredTasks.entries()) {
    try {
      task.stop();
      console.log(`[Scheduler] Job 중지: ${code}`);
    } catch (err) {
      console.error(`[Scheduler] Job 중지 실패 (${code}):`, err.message);
    }
  }

  registeredTasks.clear();
  console.log('[Scheduler] 모든 Job이 중지되었습니다.\n');
}

// === Graceful Shutdown ===
// SIGINT (Ctrl+C) 및 SIGTERM (process kill) 시 깨끗하게 종료

process.on('SIGINT', () => {
  console.log('\n[Scheduler] SIGINT 수신 - 스케줄러를 안전하게 종료합니다...');
  stopScheduler();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Scheduler] SIGTERM 수신 - 스케줄러를 안전하게 종료합니다...');
  stopScheduler();
  process.exit(0);
});

// 처리되지 않은 Promise 거부 전역 핸들러
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Scheduler] 처리되지 않은 Promise 거부:', reason);
  // 스케줄러는 계속 실행 (종료하지 않음)
});

module.exports = { startScheduler, stopScheduler, JOB_DEFINITIONS };

// 직접 실행 시
if (require.main === module) {
  startScheduler();
}
