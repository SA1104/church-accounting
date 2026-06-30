'use strict';
/**
 * Data Think Engine - Main Entry Point
 *
 * 실행 방법:
 *   node index.js            → 스케줄러 + Admin 서버 동시 시작
 *   node scheduler/index.js  → 스케줄러만 시작
 *   node admin/server.js     → Admin 서버만 시작
 *
 * 환경 변수 (.env):
 *   DATA_THINK_SUPABASE_URL  → Supabase 프로젝트 URL
 *   DATA_THINK_SUPABASE_KEY  → Supabase Service Role Key
 *   ECOS_API_KEY             → 한국은행 ECOS Open API 키
 *   DART_API_KEY             → 금융감독원 DART API 키
 *   FRED_API_KEY             → FRED (미국 연준) API 키
 *   ADMIN_PORT               → Admin 서버 포트 (기본: 3500)
 */

require('dotenv').config();

// ─── 환경 정보 출력 ──────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log('  🧠 Data Think Engine 시작');
console.log('═'.repeat(60));
console.log('  환경:       ', process.env.NODE_ENV || 'development');
console.log('  Node.js:    ', process.version);
console.log('  시작 시각:  ', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
console.log('─'.repeat(60));
console.log('  API 키 상태:');
console.log('    ECOS:  ', process.env.ECOS_API_KEY  ? '✓ 설정됨' : '✗ 미설정 (sample 키 사용)');
console.log('    DART:  ', process.env.DART_API_KEY  ? '✓ 설정됨' : '✗ 미설정 (수집 비활성)');
console.log('    FRED:  ', process.env.FRED_API_KEY  ? '✓ 설정됨' : '✗ 미설정 (수집 비활성)');
console.log('  Supabase: ', process.env.DATA_THINK_SUPABASE_URL ? '✓ URL 설정됨' : '✗ 로컬 기본값 사용');
console.log('─'.repeat(60));

// ─── 스케줄러 시작 ──────────────────────────────────────────────────────────
const { startScheduler } = require('./scheduler/index');
startScheduler();

// ─── Admin 서버 시작 (선택적) ────────────────────────────────────────────────
// SKIP_ADMIN=true 로 설정하면 Admin 서버를 띄우지 않습니다.
if (process.env.SKIP_ADMIN !== 'true') {
  require('./admin/server');
}
