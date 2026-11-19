'use strict';
/**
 * Supabase (booza-think, Project ID: feifwkwxqpipyozgqcfg) 연동 — 익명 시뮬레이션 통계
 * - 드라이버 자동 선택:
 *   1) DATABASE_URL 이 booza-think(feifwkwxqpipyozgqcfg) Postgres 이면 pg Pool 직접 연결
 *   2) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 가 설정되어 있으면 HTTPS RPC (/rest/v1/rpc/exec_sql) 연결 (IPv4 100% 호환)
 *   3) 그 외 유효한 DATABASE_URL pg Pool 폴백 -> 미설정 시 메모리 벤치마크 무중단 폴백
 * - 보안 철칙:
 *   생성 즉시 ALTER TABLE public.biz_simulator_runs ENABLE ROW LEVEL SECURITY 적용,
 *   booza-think public 스키마 내 모든 테이블 relrowsecurity = true 검증 및 보장.
 */
let Pool = null;
try { ({ Pool } = require('pg')); } catch (e) { Pool = null; }

const TARGET_PROJECT_REF = 'feifwkwxqpipyozgqcfg';
const CALCS = ['delivery-margin', 'seller-roas', 'policy-funds', 'labor-automation'];
const METRICS = {
  'delivery-margin': { col: 'net_margin_pct', label: '순마진율', unit: '%', higherIsBetter: true, seed: { mean: 16.8, sd: 7.5 } },
  'seller-roas': { col: 'break_even_roas', label: '손익분기 ROAS', unit: '%', higherIsBetter: false, seed: { mean: 410, sd: 160 } },
  'policy-funds': { col: 'monthly_saving_krw', label: '월 이자·보조 절감액', unit: '원', higherIsBetter: true, seed: { mean: 118000, sd: 70000 } },
  'labor-automation': { col: 'payback_months', label: '원금회수 기간', unit: '개월', higherIsBetter: false, seed: { mean: 9.4, sd: 4.2 } }
};
const INDUSTRIES = ['food', 'cafe', 'retail', 'online', 'mfg', 'service', 'etc'];

const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS public.biz_simulator_runs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculator TEXT NOT NULL CHECK (calculator IN ('delivery-margin','seller-roas','policy-funds','labor-automation')),
  industry TEXT NOT NULL DEFAULT 'etc',
  net_margin_pct NUMERIC(8,2),
  break_even_roas NUMERIC(10,2),
  payback_months NUMERIC(10,2),
  monthly_saving_krw BIGINT,
  matched_programs SMALLINT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
)`;
const ENABLE_RLS_SQL = `ALTER TABLE public.biz_simulator_runs ENABLE ROW LEVEL SECURITY`;
const CREATE_INDEX_SQL = `CREATE INDEX IF NOT EXISTS biz_simulator_runs_calc_ind_idx ON public.biz_simulator_runs (calculator, industry, created_at DESC)`;
const REVOKE_ANON_SQL = `REVOKE ALL ON TABLE public.biz_simulator_runs FROM anon, authenticated`;

const MIGRATION_SQL = [CREATE_TABLE_SQL, ENABLE_RLS_SQL, CREATE_INDEX_SQL].join(';\n') + ';';
const ENFORCE_ALL_RLS_SQL = `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY`;
const RLS_STATUS_SQL = `SELECT c.relname AS table_name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p') ORDER BY 1`;

let pool = null;
let driver = null; // 'pg' | 'supabase-rpc' | null
let rpcConfig = null; // { url, key }
let state = { enabled: false, connected: false, migrated: false, driver: 'memory', lastError: null, projectRef: null };
const memory = Object.fromEntries(CALCS.map((c) => [c, []]));

function refFromDbUrl(url) {
  try {
    if (!url) return null;
    const u = new URL(url);
    const m = /^postgres\.([a-z0-9]{15,30})$/i.exec(decodeURIComponent(u.username)) ||
      /db\.([a-z0-9]{15,30})\.supabase\.co$/i.exec(u.hostname);
    return m ? m[1] : null;
  } catch (e) { return null; }
}

function refFromSupaUrl(supaUrl) {
  try {
    if (!supaUrl) return null;
    const u = new URL(supaUrl);
    const m = /^([a-z0-9-]+)\.supabase\.co$/i.exec(u.hostname);
    if (!m) return null;
    if (m[1] === 'your-supabase-project' || m[1] === 'booza-think') return null;
    return m[1];
  } catch (e) { return null; }
}

function isRealKey(k) {
  return typeof k === 'string' && k.length > 25 && !k.includes('dummy') && !k.includes('placeholder') && !k.includes('your-service-role');
}

async function rpcExecSql(sql, params) {
  const cleanSql = String(sql).trim().replace(/;+\s*$/, '');
  const res = await fetch(`${rpcConfig.url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: rpcConfig.key,
      Authorization: `Bearer ${rpcConfig.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query_text: cleanSql, params: params || [] })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Supabase RPC HTTP ${res.status}: ${txt.slice(0, 180)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function execDdlAndRls() {
  if (driver === 'pg') {
    await pool.query(CREATE_TABLE_SQL);
    await pool.query(ENABLE_RLS_SQL);
    await pool.query(CREATE_INDEX_SQL);
    try { await pool.query(REVOKE_ANON_SQL); } catch (e) { /* role may not exist on non-Supabase pg */ }
    if (String(process.env.ENFORCE_PUBLIC_RLS || 'true') !== 'false' && (!state.projectRef || state.projectRef === TARGET_PROJECT_REF)) {
      const r = await pool.query(RLS_STATUS_SQL);
      for (const row of r.rows) {
        if (!row.rls && /^[a-zA-Z0-9_]+$/.test(row.table_name)) {
          await pool.query(`ALTER TABLE public."${row.table_name}" ENABLE ROW LEVEL SECURITY`);
        }
      }
    }
  } else if (driver === 'supabase-rpc') {
    await rpcExecSql(CREATE_TABLE_SQL);
    await rpcExecSql(ENABLE_RLS_SQL);
    await rpcExecSql(CREATE_INDEX_SQL);
    try { await rpcExecSql(REVOKE_ANON_SQL); } catch (e) { /* ignore */ }
    if (String(process.env.ENFORCE_PUBLIC_RLS || 'true') !== 'false') {
      const rows = await rpcExecSql(RLS_STATUS_SQL);
      for (const row of rows) {
        if (!row.rls && /^[a-zA-Z0-9_]+$/.test(row.table_name)) {
          await rpcExecSql(`ALTER TABLE public."${row.table_name}" ENABLE ROW LEVEL SECURITY`);
        }
      }
    }
  }
}

async function tryPg(dbUrl, ref) {
  if (!Pool || !dbUrl) return false;
  try {
    const u = new URL(dbUrl);
    if (!/^postgres(ql)?:$/.test(u.protocol)) return false;
    if (process.env.RENDER && /^(localhost|127\.0\.0\.1)$/.test(u.hostname)) return false;
  } catch (e) { return false; }

  const local = /localhost|127\.0\.0\.1/.test(dbUrl);
  const p = new Pool({
    connectionString: dbUrl,
    ssl: local ? false : { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
  p.on('error', (e) => { state.lastError = e.message; });
  try {
    await p.query('SELECT 1');
    pool = p;
    driver = 'pg';
    state.driver = 'pg';
    state.projectRef = ref || state.projectRef;
    state.connected = true;
    await execDdlAndRls();
    state.migrated = true;
    state.lastError = null;
    return true;
  } catch (e) {
    state.lastError = e.message || String(e);
    try { await p.end(); } catch (_) { /* noop */ }
    return false;
  }
}

async function trySupabaseRpc(supaUrl, serviceKey, ref) {
  if (!supaUrl || !isRealKey(serviceKey) || !ref) return false;
  rpcConfig = { url: supaUrl.replace(/\/$/, ''), key: serviceKey };
  try {
    const rows = await rpcExecSql('SELECT 1 AS ok');
    if (!rows || !rows.length) throw new Error('empty SELECT 1');
    driver = 'supabase-rpc';
    state.driver = 'supabase-rpc';
    state.projectRef = ref;
    state.connected = true;
    await execDdlAndRls();
    state.migrated = true;
    state.lastError = null;
    return true;
  } catch (e) {
    state.lastError = e.message || String(e);
    rpcConfig = null;
    return false;
  }
}

async function init() {
  const dbUrl = process.env.DATABASE_URL;
  const supaUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const dbRef = refFromDbUrl(dbUrl);
  const supaRef = refFromSupaUrl(supaUrl);

  state.enabled = Boolean(dbUrl || (supaUrl && isRealKey(serviceKey)));
  state.projectRef = supaRef || dbRef || null;

  // 1순위: booza-think (feifwkwxqpipyozgqcfg)와 일치하는 연결을 최우선 선택
  if (dbRef === TARGET_PROJECT_REF && await tryPg(dbUrl, dbRef)) return state;
  if (supaRef === TARGET_PROJECT_REF && await trySupabaseRpc(supaUrl, serviceKey, supaRef)) return state;
  if (supaRef && await trySupabaseRpc(supaUrl, serviceKey, supaRef)) return state;
  if (dbUrl && (!supaRef || dbRef === supaRef) && await tryPg(dbUrl, dbRef)) return state;

  state.connected = false;
  state.driver = 'memory';
  if (!state.lastError) state.lastError = 'No reachable Supabase/Postgres — memory benchmark mode';
  return state;
}

function num(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, n));
}

function sanitize(body) {
  const calculator = CALCS.includes(body.calculator) ? body.calculator : null;
  if (!calculator) return null;
  const industry = INDUSTRIES.includes(body.industry) ? body.industry : 'etc';
  return {
    calculator,
    industry,
    net_margin_pct: num(body.net_margin_pct, -500, 100),
    break_even_roas: num(body.break_even_roas, 0, 100000),
    payback_months: num(body.payback_months, 0, 1200),
    monthly_saving_krw: body.monthly_saving_krw == null ? null : Math.round(num(body.monthly_saving_krw, -1e10, 1e10)),
    matched_programs: body.matched_programs == null ? null : Math.round(num(body.matched_programs, 0, 50))
  };
}

function seedSample(calc) {
  const { mean, sd } = METRICS[calc].seed;
  const out = [];
  for (let i = 1; i <= 120; i++) {
    const u = (i - 0.5) / 120;
    const z = Math.log(u / (1 - u)) / 1.702;
    out.push(mean + sd * z);
  }
  return out;
}

function summarize(calc, values, value) {
  const m = METRICS[calc];
  const vals = values.filter((v) => Number.isFinite(v));
  const n = vals.length;
  const avg = n ? vals.reduce((a, b) => a + b, 0) / n : m.seed.mean;
  let better = null;
  if (Number.isFinite(value) && n) {
    const worseOrEqual = vals.filter((v) => (m.higherIsBetter ? v <= value : v >= value)).length;
    const pctBetterThan = worseOrEqual / n;
    better = Math.max(1, Math.min(99, Math.round((1 - pctBetterThan) * 100)));
  }
  return { metric: m.col, label: m.label, unit: m.unit, higherIsBetter: m.higherIsBetter, average: Math.round(avg * 10) / 10, topPercent: better, sampleSize: n };
}

async function record(body) {
  const row = sanitize(body || {});
  if (!row) return { ok: false, error: 'invalid calculator' };
  const m = METRICS[row.calculator];
  const value = row[m.col];
  const groupInd = row.industry;

  if (state.connected && driver === 'pg') {
    try {
      await pool.query(
        `INSERT INTO public.biz_simulator_runs (calculator, industry, net_margin_pct, break_even_roas, payback_months, monthly_saving_krw, matched_programs)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [row.calculator, row.industry, row.net_margin_pct, row.break_even_roas, row.payback_months, row.monthly_saving_krw, row.matched_programs]
      );
      const q = await pool.query(
        `SELECT ${m.col}::float8 AS v FROM public.biz_simulator_runs
         WHERE calculator = $1 AND ($2 = 'etc' OR industry = $2) AND ${m.col} IS NOT NULL
         ORDER BY created_at DESC LIMIT 5000`,
        [row.calculator, groupInd]
      );
      let vals = q.rows.map((r) => Number(r.v));
      const real = vals.length;
      if (real < 30) vals = vals.concat(seedSample(row.calculator));
      return { ok: true, storage: 'supabase-pg', realSamples: real, ...summarize(row.calculator, vals, value) };
    } catch (e) {
      state.lastError = e.message;
    }
  } else if (state.connected && driver === 'supabase-rpc') {
    try {
      const lit = (v) => (v == null ? 'NULL' : Number(v));
      await rpcExecSql(
        `INSERT INTO public.biz_simulator_runs (calculator, industry, net_margin_pct, break_even_roas, payback_months, monthly_saving_krw, matched_programs) VALUES (?, ?, ${lit(row.net_margin_pct)}, ${lit(row.break_even_roas)}, ${lit(row.payback_months)}, ${lit(row.monthly_saving_krw)}, ${lit(row.matched_programs)})`,
        [row.calculator, row.industry]
      );
      const qRows = await rpcExecSql(
        `SELECT ${m.col}::float8 AS v FROM public.biz_simulator_runs WHERE calculator = ? AND (? = 'etc' OR industry = ?) AND ${m.col} IS NOT NULL ORDER BY created_at DESC LIMIT 5000`,
        [row.calculator, groupInd, groupInd]
      );
      let vals = qRows.map((r) => Number(r.v));
      const real = vals.length;
      if (real < 30) vals = vals.concat(seedSample(row.calculator));
      return { ok: true, storage: 'supabase-rpc', realSamples: real, ...summarize(row.calculator, vals, value) };
    } catch (e) {
      state.lastError = e.message;
    }
  }

  const mem = memory[row.calculator];
  if (Number.isFinite(value)) { mem.push(value); if (mem.length > 5000) mem.shift(); }
  const vals = mem.concat(mem.length < 30 ? seedSample(row.calculator) : []);
  return { ok: true, storage: 'memory', realSamples: mem.length, ...summarize(row.calculator, vals, value) };
}

async function rlsStatus() {
  if (!state.connected) return { connected: false, driver: state.driver, projectRef: state.projectRef, rlsEnforcedInDdl: true, error: state.lastError };
  try {
    const rows = driver === 'pg' ? (await pool.query(RLS_STATUS_SQL)).rows : await rpcExecSql(RLS_STATUS_SQL);
    const off = rows.filter((x) => !x.rls);
    const biz = rows.find((x) => x.table_name === 'biz_simulator_runs');
    return {
      connected: true,
      driver: state.driver,
      projectRef: state.projectRef,
      publicTables: rows.length,
      rlsDisabledCount: off.length,
      rlsDisabledTables: off.map((x) => x.table_name),
      bizSimulatorRunsRls: !!(biz && biz.rls)
    };
  } catch (e) {
    return { connected: false, driver: state.driver, projectRef: state.projectRef, error: e.message };
  }
}

async function close() {
  if (pool) {
    try { await pool.end(); } catch (e) { /* noop */ }
    pool = null;
  }
  state.connected = false;
}

module.exports = { init, record, rlsStatus, close, state: () => ({ ...state }), MIGRATION_SQL, ENFORCE_ALL_RLS_SQL, RLS_STATUS_SQL, CALCS };
