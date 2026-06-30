'use strict';
/**
 * Data Think Engine - Admin API Server
 * Port: 3500 (별도 포트, 메인 앱과 분리)
 *
 * 빌트인 'http' 모듈만 사용 (Express 불필요)
 * Supabase 클라이언트는 collectors/base.js 에서 재사용
 *
 * Endpoints:
 *  GET  /                              → admin/index.html 서빙
 *  GET  /api/admin/stats               → 요약 통계
 *  GET  /api/admin/sources             → indicator_sources 전체
 *  GET  /api/admin/indicators          → indicators (+ 출처 JOIN)
 *  GET  /api/admin/jobs                → data_collection_jobs 전체
 *  GET  /api/admin/logs                → 최근 100개 수집 로그
 *  GET  /api/admin/securities          → 시가총액 상위 100개 종목
 *  POST /api/admin/jobs/:jobCode/run   → 수동 Job 트리거
 */

require('dotenv').config();

const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const { URL } = require('url');

// Supabase 클라이언트 (base.js 와 동일한 인스턴스 재사용)
const { supabase } = require('../collectors/base');

// 수집기 실행 함수
const { runCollector } = require('../collectors/index');

const PORT = parseInt(process.env.ADMIN_PORT || '3500', 10);
const HTML_FILE = path.join(__dirname, 'index.html');

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼 함수
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JSON 응답 전송
 */
function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

/**
 * 오류 응답 전송
 */
function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message, timestamp: new Date().toISOString() });
}

/**
 * POST body 읽기
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// API 핸들러
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * 대시보드 요약 카드용 통계
 */
async function handleStats(res) {
  try {
    // 병렬 조회
    const [
      { count: totalIndicators },
      { count: totalSecurities },
      { count: todaySuccess },
      { count: todayError },
    ] = await Promise.all([
      supabase.from('indicators').select('*', { count: 'exact', head: true }),
      supabase.from('securities').select('*', { count: 'exact', head: true }),
      supabase.from('data_collection_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'success')
        .gte('started_at', new Date().toISOString().slice(0, 10)),
      supabase.from('data_collection_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')
        .gte('started_at', new Date().toISOString().slice(0, 10)),
    ]);

    // 최근 10개 로그
    const { data: recentLogs } = await supabase
      .from('data_collection_logs')
      .select(`
        id, started_at, finished_at, status,
        rows_fetched, rows_inserted, rows_updated, rows_failed, error_message,
        data_collection_jobs ( job_code, job_name )
      `)
      .order('started_at', { ascending: false })
      .limit(10);

    // 활성 Job 상태
    const { data: jobStatus } = await supabase
      .from('data_collection_jobs')
      .select('job_code, job_name, status, last_success_at, error_count')
      .eq('is_active', true)
      .order('job_code');

    sendJSON(res, 200, {
      total_indicators: totalIndicators || 0,
      total_securities: totalSecurities || 0,
      today_success: todaySuccess || 0,
      today_error: todayError || 0,
      recent_logs: recentLogs || [],
      job_status: jobStatus || [],
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Admin] /stats 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

/**
 * GET /api/admin/sources
 * indicator_sources 전체 목록
 */
async function handleSources(res) {
  try {
    const { data, error } = await supabase
      .from('indicator_sources')
      .select('*')
      .order('source_code');

    if (error) throw error;
    sendJSON(res, 200, data || []);
  } catch (err) {
    console.error('[Admin] /sources 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

/**
 * GET /api/admin/indicators
 * indicators 전체 (출처 source_name JOIN)
 */
async function handleIndicators(res) {
  try {
    const { data, error } = await supabase
      .from('indicators')
      .select(`
        id, indicator_code, name_ko, name_en,
        category, frequency, unit,
        indicator_sources ( source_code, source_name )
      `)
      .order('category')
      .order('indicator_code');

    if (error) throw error;
    sendJSON(res, 200, data || []);
  } catch (err) {
    console.error('[Admin] /indicators 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

/**
 * GET /api/admin/jobs
 * data_collection_jobs 전체
 */
async function handleJobs(res) {
  try {
    const { data, error } = await supabase
      .from('data_collection_jobs')
      .select('*')
      .order('job_code');

    if (error) throw error;
    sendJSON(res, 200, data || []);
  } catch (err) {
    console.error('[Admin] /jobs 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

/**
 * GET /api/admin/logs
 * 최근 100개 수집 로그
 */
async function handleLogs(res) {
  try {
    const { data, error } = await supabase
      .from('data_collection_logs')
      .select(`
        id, started_at, finished_at, status,
        rows_fetched, rows_inserted, rows_updated, rows_failed, error_message,
        data_collection_jobs ( job_code, job_name )
      `)
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    sendJSON(res, 200, data || []);
  } catch (err) {
    console.error('[Admin] /logs 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

/**
 * GET /api/admin/securities
 * 시가총액 상위 100개 종목
 */
async function handleSecurities(res) {
  try {
    const { data, error } = await supabase
      .from('securities')
      .select('id, ticker, name_ko, name_en, market, sector, listed_date, is_active, market_cap_rank')
      .not('market_cap_rank', 'is', null)
      .order('market_cap_rank', { ascending: true })
      .limit(100);

    if (error) throw error;
    sendJSON(res, 200, data || []);
  } catch (err) {
    console.error('[Admin] /securities 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

/**
 * POST /api/admin/jobs/:jobCode/run
 * 수동으로 Job 트리거 (비동기 실행)
 */
async function handleJobRun(res, jobCode) {
  try {
    console.log(`[Admin] 수동 트리거 요청: ${jobCode}`);

    // Job 존재 확인
    const { data: job, error } = await supabase
      .from('data_collection_jobs')
      .select('id, job_code, job_name, status')
      .eq('job_code', jobCode)
      .single();

    if (error || !job) {
      return sendError(res, 404, `Job을 찾을 수 없습니다: ${jobCode}`);
    }

    if (job.status === 'running') {
      return sendError(res, 409, `Job이 이미 실행 중입니다: ${jobCode}`);
    }

    // 즉시 응답 후 비동기 실행
    sendJSON(res, 202, {
      message: `Job 트리거됨: ${jobCode}`,
      job_code: jobCode,
      job_name: job.job_name,
      triggered_at: new Date().toISOString(),
    });

    // 비동기 실행 (응답 후 백그라운드 실행)
    setImmediate(async () => {
      try {
        await runCollector(jobCode);
        console.log(`[Admin] 수동 트리거 완료: ${jobCode}`);
      } catch (err) {
        console.error(`[Admin] 수동 트리거 실패 (${jobCode}):`, err.message);
      }
    });

  } catch (err) {
    console.error('[Admin] /jobs/run 오류:', err.message);
    sendError(res, 500, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP 서버 라우터
// ─────────────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://localhost:${PORT}`;
  const parsedUrl = new URL(req.url, baseUrl);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  console.log(`[Admin] ${method} ${pathname}`);

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // ── GET / : index.html 서빙 ──────────────────────────────────────────────
  if (method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    try {
      const html = fs.readFileSync(HTML_FILE, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('admin/index.html not found');
    }
  }

  // ── API 라우팅 ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/admin/')) {

    if (method === 'GET' && pathname === '/api/admin/stats') {
      return handleStats(res);
    }

    if (method === 'GET' && pathname === '/api/admin/sources') {
      return handleSources(res);
    }

    if (method === 'GET' && pathname === '/api/admin/indicators') {
      return handleIndicators(res);
    }

    if (method === 'GET' && pathname === '/api/admin/jobs') {
      return handleJobs(res);
    }

    if (method === 'GET' && pathname === '/api/admin/logs') {
      return handleLogs(res);
    }

    if (method === 'GET' && pathname === '/api/admin/securities') {
      return handleSecurities(res);
    }

    // POST /api/admin/jobs/:jobCode/run
    const runMatch = pathname.match(/^\/api\/admin\/jobs\/([^/]+)\/run$/);
    if (method === 'POST' && runMatch) {
      const jobCode = decodeURIComponent(runMatch[1]);
      return handleJobRun(res, jobCode);
    }

    return sendError(res, 404, `API 엔드포인트를 찾을 수 없습니다: ${pathname}`);
  }

  // ── 404 fallback ─────────────────────────────────────────────────────────
  sendError(res, 404, `경로를 찾을 수 없습니다: ${pathname}`);
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`  Data Think Engine - Admin UI`);
  console.log(`  http://localhost:${PORT}`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Admin] 서버 종료 중...');
  server.close(() => { process.exit(0); });
});

process.on('SIGTERM', () => {
  server.close(() => { process.exit(0); });
});

module.exports = server;
