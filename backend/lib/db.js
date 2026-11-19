'use strict';
/**
 * Supabase (booza-think, Project ID: feifwkwxqpipyozgqcfg) 데이터 레이어
 * 1) public.biz_simulator_runs : 6대 시뮬레이터 익명 벤치마크 통계 (RLS ON)
 * 2) public.biz_page_events    : Site-Kit형 자체 방문·체류시간·스크롤·유입채널·바이럴 공유 분석 (RLS ON)
 * 3) public.biz_inquiries      : /contact 제휴·오류 제보 접수함 (RLS ON)
 * - 모든 신규/기존 public 테이블에 ENABLE ROW LEVEL SECURITY 및 anon/authenticated 권한 회수 강제.
 */
const crypto = require('crypto');
let Pool = null;
try { ({ Pool } = require('pg')); } catch (e) { Pool = null; }

const TARGET_PROJECT_REF = 'feifwkwxqpipyozgqcfg';
const CALCS = ['delivery-margin', 'seller-roas', 'policy-funds', 'labor-automation', 'vat-income-tax', 'store-rent-breakeven'];
const METRICS = {
  'delivery-margin': { col: 'net_margin_pct', label: '순마진율', unit: '%', higherIsBetter: true, seed: { mean: 16.8, sd: 7.5 } },
  'seller-roas': { col: 'break_even_roas', label: '손익분기 ROAS', unit: '%', higherIsBetter: false, seed: { mean: 410, sd: 160 } },
  'policy-funds': { col: 'monthly_saving_krw', label: '월 이자·보조 절감액', unit: '원', higherIsBetter: true, seed: { mean: 118000, sd: 70000 } },
  'labor-automation': { col: 'payback_months', label: '원금회수 기간', unit: '개월', higherIsBetter: false, seed: { mean: 9.4, sd: 4.2 } },
  'vat-income-tax': { col: 'eff_tax_rate', label: '매출 대비 총세부담률', unit: '%', higherIsBetter: false, seed: { mean: 8.6, sd: 3.8 } },
  'store-rent-breakeven': { col: 'rent_ratio_pct', label: '매출 대비 임차료율', unit: '%', higherIsBetter: false, seed: { mean: 11.8, sd: 4.5 } }
};
const INDUSTRIES = ['food', 'cafe', 'retail', 'online', 'mfg', 'service', 'rent', 'etc'];

const DDL_STEPS = [
  `CREATE TABLE IF NOT EXISTS public.biz_simulator_runs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calculator TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'etc',
    net_margin_pct NUMERIC(8,2),
    break_even_roas NUMERIC(10,2),
    payback_months NUMERIC(10,2),
    monthly_saving_krw BIGINT,
    matched_programs SMALLINT,
    eff_tax_rate NUMERIC(8,2),
    rent_ratio_pct NUMERIC(8,2),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb
  )`,
  `ALTER TABLE public.biz_simulator_runs ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.biz_simulator_runs ADD COLUMN IF NOT EXISTS eff_tax_rate NUMERIC(8,2)`,
  `ALTER TABLE public.biz_simulator_runs ADD COLUMN IF NOT EXISTS rent_ratio_pct NUMERIC(8,2)`,
  `ALTER TABLE public.biz_simulator_runs DROP CONSTRAINT IF EXISTS biz_simulator_runs_calculator_check`,
  `ALTER TABLE public.biz_simulator_runs ADD CONSTRAINT biz_simulator_runs_calculator_check CHECK (calculator IN ('delivery-margin','seller-roas','policy-funds','labor-automation','vat-income-tax','store-rent-breakeven'))`,
  `CREATE INDEX IF NOT EXISTS biz_simulator_runs_calc_ind_idx ON public.biz_simulator_runs (calculator, industry, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS public.biz_page_events (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    view_id TEXT,
    session_hash TEXT NOT NULL,
    path TEXT NOT NULL,
    page_type TEXT NOT NULL DEFAULT 'page',
    ref_source TEXT NOT NULL DEFAULT 'direct',
    ref_host TEXT,
    device TEXT NOT NULL DEFAULT 'desktop',
    dwell_sec SMALLINT NOT NULL DEFAULT 0,
    scroll_pct SMALLINT NOT NULL DEFAULT 0,
    event_name TEXT NOT NULL DEFAULT 'pageview'
  )`,
  `ALTER TABLE public.biz_page_events ENABLE ROW LEVEL SECURITY`,
  `CREATE UNIQUE INDEX IF NOT EXISTS biz_page_events_view_id_idx ON public.biz_page_events (view_id) WHERE view_id IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS biz_page_events_created_idx ON public.biz_page_events (created_at DESC, event_name)`,
  `CREATE INDEX IF NOT EXISTS biz_page_events_path_idx ON public.biz_page_events (path, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS public.biz_inquiries (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    category TEXT NOT NULL DEFAULT 'general',
    email TEXT NOT NULL,
    page_url TEXT,
    message TEXT NOT NULL
  )`,
  `ALTER TABLE public.biz_inquiries ENABLE ROW LEVEL SECURITY`
];

const REVOKE_STEPS = [
  `REVOKE ALL ON TABLE public.biz_simulator_runs FROM anon, authenticated`,
  `REVOKE ALL ON TABLE public.biz_page_events FROM anon, authenticated`,
  `REVOKE ALL ON TABLE public.biz_inquiries FROM anon, authenticated`
];

const MIGRATION_SQL = DDL_STEPS.join(';\n') + ';';
const ENFORCE_ALL_RLS_SQL = `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY`;
const RLS_STATUS_SQL = `SELECT c.relname AS table_name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p') ORDER BY 1`;

let pool = null;
let driver = null;
let rpcConfig = null;
let state = { enabled: false, connected: false, migrated: false, driver: 'memory', lastError: null, projectRef: null };

const memory = Object.fromEntries(CALCS.map((c) => [c, []]));
const memEvents = [];
const memInquiries = [];

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
    if (!m || m[1] === 'your-supabase-project' || m[1] === 'booza-think') return null;
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
    headers: { apikey: rpcConfig.key, Authorization: `Bearer ${rpcConfig.key}`, 'Content-Type': 'application/json' },
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
  const runStmt = async (s) => (driver === 'pg' ? pool.query(s) : rpcExecSql(s));
  for (const s of DDL_STEPS) await runStmt(s);
  for (const s of REVOKE_STEPS) {
    try { await runStmt(s); } catch (e) { /* non-supabase pg ignore */ }
  }
  if (String(process.env.ENFORCE_PUBLIC_RLS || 'true') !== 'false' && (!state.projectRef || state.projectRef === TARGET_PROJECT_REF)) {
    const rows = driver === 'pg' ? (await pool.query(RLS_STATUS_SQL)).rows : await rpcExecSql(RLS_STATUS_SQL);
    for (const row of rows) {
      if (!row.rls && /^[a-zA-Z0-9_]+$/.test(row.table_name)) {
        await runStmt(`ALTER TABLE public."${row.table_name}" ENABLE ROW LEVEL SECURITY`);
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
  const x = Number(v);
  if (!Number.isFinite(x)) return null;
  return Math.min(hi, Math.max(lo, x));
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
    matched_programs: body.matched_programs == null ? null : Math.round(num(body.matched_programs, 0, 50)),
    eff_tax_rate: num(body.eff_tax_rate, 0, 100),
    rent_ratio_pct: num(body.rent_ratio_pct, 0, 200)
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
        `INSERT INTO public.biz_simulator_runs (calculator, industry, net_margin_pct, break_even_roas, payback_months, monthly_saving_krw, matched_programs, eff_tax_rate, rent_ratio_pct)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [row.calculator, row.industry, row.net_margin_pct, row.break_even_roas, row.payback_months, row.monthly_saving_krw, row.matched_programs, row.eff_tax_rate, row.rent_ratio_pct]
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
        `INSERT INTO public.biz_simulator_runs (calculator, industry, net_margin_pct, break_even_roas, payback_months, monthly_saving_krw, matched_programs, eff_tax_rate, rent_ratio_pct) VALUES (?, ?, ${lit(row.net_margin_pct)}, ${lit(row.break_even_roas)}, ${lit(row.payback_months)}, ${lit(row.monthly_saving_krw)}, ${lit(row.matched_programs)}, ${lit(row.eff_tax_rate)}, ${lit(row.rent_ratio_pct)})`,
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

/* ───────── 자체 방문·체류시간·유입채널·바이럴 이벤트 수집 ───────── */
function classifyReferrer(ref) {
  if (!ref) return { source: 'direct', host: null };
  try {
    const u = new URL(ref);
    const h = u.hostname.toLowerCase().replace(/^www\./, '');
    if (h === 'boozathink.com' || h === 'localhost' || h === '127.0.0.1') return { source: 'internal', host: h };
    if (h.includes('google.')) return { source: 'google', host: h };
    if (h.includes('naver.com') || h.includes('search.naver')) return { source: 'naver', host: h };
    if (h.includes('threads.net') || h.includes('threads.com') || h.includes('instagram.com') || h.includes('facebook.com')) return { source: 'threads_insta', host: h };
    if (h.includes('kakao.com') || h.includes('daum.net') || h.includes('kakaocorp')) return { source: 'kakao', host: h };
    if (h.includes('chatgpt.com') || h.includes('openai.com') || h.includes('perplexity.ai') || h.includes('claude.ai') || h.includes('gemini.google')) return { source: 'ai_search', host: h };
    if (h.includes('youtube.com') || h.includes('youtu.be')) return { source: 'youtube', host: h };
    return { source: 'other', host: h.slice(0, 80) };
  } catch (e) {
    return { source: 'direct', host: null };
  }
}

function classifyPageType(p) {
  if (p === '/') return 'home';
  if (p.startsWith('/calculators/')) return 'calculator';
  if (p === '/calculators') return 'calc-index';
  if (p.startsWith('/bible/')) return 'bible';
  if (p === '/bible') return 'bible-index';
  if (p.startsWith('/category/')) return 'category';
  return 'legal';
}

function makeDailySessionHash(ip, ua) {
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.JWT_SECRET || 'bt-anon-salt-2026';
  return crypto.createHash('sha256').update(`${day}|${ip || ''}|${ua || ''}|${salt}`).digest('hex').slice(0, 16);
}

async function collectEvent(payload, reqMeta) {
  const ua = String(reqMeta.ua || '');
  if (/bot|crawler|spider|slurp|mediapartners|lighthouse|headless|inspect|curl|wget|python|node/i.test(ua)) {
    return { ok: true, skipped: 'bot' };
  }
  const rawPath = String(payload.path || '/').split('?')[0].slice(0, 160);
  if (!rawPath.startsWith('/') || rawPath.startsWith('/admin') || rawPath.startsWith('/api')) {
    return { ok: true, skipped: 'excluded' };
  }
  const mode = payload.mode === 'leave' ? 'leave' : (payload.mode === 'action' ? 'action' : 'enter');
  const viewId = typeof payload.vid === 'string' && /^[a-zA-Z0-9_-]{8,40}$/.test(payload.vid) ? payload.vid : null;
  const dwell = Math.round(num(payload.dwell, 0, 1800) || 0);
  const scroll = Math.round(num(payload.scroll, 0, 100) || 0);
  const device = /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';
  const sessionHash = makeDailySessionHash(reqMeta.ip, ua);
  const refInfo = classifyReferrer(payload.ref);
  const refSource = refInfo.source === 'internal' ? 'direct' : refInfo.source;
  const pageType = classifyPageType(rawPath);
  const ALLOWED_EVENTS = ['pageview', 'copy_link', 'download_receipt'];
  const eventName = mode === 'action' && ALLOWED_EVENTS.includes(payload.event) ? payload.event : 'pageview';

  if (state.connected && driver === 'pg') {
    try {
      if (mode === 'leave' && viewId) {
        await pool.query(
          `UPDATE public.biz_page_events SET dwell_sec = GREATEST(dwell_sec, $2), scroll_pct = GREATEST(scroll_pct, $3) WHERE view_id = $1`,
          [viewId, dwell, scroll]
        );
        return { ok: true, updated: true };
      }
      await pool.query(
        `INSERT INTO public.biz_page_events (view_id, session_hash, path, page_type, ref_source, ref_host, device, dwell_sec, scroll_pct, event_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (view_id) WHERE view_id IS NOT NULL DO UPDATE
         SET dwell_sec = GREATEST(public.biz_page_events.dwell_sec, EXCLUDED.dwell_sec),
             scroll_pct = GREATEST(public.biz_page_events.scroll_pct, EXCLUDED.scroll_pct)`,
        [mode === 'action' ? null : viewId, sessionHash, rawPath, pageType, refSource, refInfo.host, device, dwell, scroll, eventName]
      );
      return { ok: true };
    } catch (e) {
      state.lastError = e.message;
    }
  }

  // 메모리 폴백 (로컬 개발용)
  if (mode === 'leave' && viewId) {
    const found = memEvents.find((x) => x.view_id === viewId);
    if (found) {
      found.dwell_sec = Math.max(found.dwell_sec, dwell);
      found.scroll_pct = Math.max(found.scroll_pct, scroll);
    }
    return { ok: true };
  }
  memEvents.push({
    created_at: new Date(),
    view_id: mode === 'action' ? null : viewId,
    session_hash: sessionHash,
    path: rawPath,
    page_type: pageType,
    ref_source: refSource,
    ref_host: refInfo.host,
    device,
    dwell_sec: dwell,
    scroll_pct: scroll,
    event_name: eventName
  });
  if (memEvents.length > 5000) memEvents.shift();
  return { ok: true, storage: 'memory' };
}

/* ───────── /contact 문의·오류 제보 저장 ───────── */
async function createInquiry(body) {
  const category = ['error', 'policy', 'partnership', 'general'].includes(body.category) ? body.category : 'general';
  const email = String(body.email || '').trim().slice(0, 120);
  const pageUrl = String(body.page_url || '').trim().slice(0, 300);
  const message = String(body.message || '').trim().slice(0, 3000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: '올바른 회신용 이메일 주소를 입력해 주세요.' };
  if (message.length < 10) return { ok: false, error: '문의 또는 제보 내용을 10자 이상 입력해 주세요.' };

  if (state.connected && driver === 'pg') {
    try {
      await pool.query(
        `INSERT INTO public.biz_inquiries (category, email, page_url, message) VALUES ($1,$2,$3,$4)`,
        [category, email, pageUrl || null, message]
      );
      return { ok: true, storage: 'supabase-pg' };
    } catch (e) {
      state.lastError = e.message;
    }
  }
  memInquiries.unshift({ id: memInquiries.length + 1, created_at: new Date().toISOString(), category, email, page_url: pageUrl, message });
  if (memInquiries.length > 200) memInquiries.pop();
  return { ok: true, storage: 'memory' };
}

/* ───────── /admin 대시보드 집계 ───────── */
async function getAnalyticsSummary(daysInput) {
  const days = [1, 7, 30].includes(Number(daysInput)) ? Number(daysInput) : 7;
  if (state.connected && driver === 'pg') {
    try {
      const interval = `${days} days`;
      const [kpiQ, dailyQ, pagesQ, srcQ, devQ, calcQ, inqQ] = await Promise.all([
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE event_name = 'pageview')::int AS pv,
             COUNT(DISTINCT session_hash) FILTER (WHERE event_name = 'pageview')::int AS uv,
             COALESCE(ROUND(AVG(NULLIF(dwell_sec, 0)) FILTER (WHERE event_name = 'pageview')), 0)::int AS avg_dwell,
             COALESCE(ROUND(AVG(NULLIF(scroll_pct, 0)) FILTER (WHERE event_name = 'pageview')), 0)::int AS avg_scroll,
             COUNT(*) FILTER (WHERE event_name IN ('copy_link','download_receipt'))::int AS shares,
             COUNT(*) FILTER (WHERE event_name = 'copy_link')::int AS copy_clicks,
             COUNT(*) FILTER (WHERE event_name = 'download_receipt')::int AS receipt_downloads
           FROM public.biz_page_events
           WHERE created_at >= now() - $1::interval`,
          [interval]
        ),
        pool.query(
          `SELECT to_char(created_at AT TIME ZONE 'Asia/Seoul', 'MM-DD') AS day,
                  COUNT(*) FILTER (WHERE event_name = 'pageview')::int AS pv,
                  COUNT(DISTINCT session_hash) FILTER (WHERE event_name = 'pageview')::int AS uv
           FROM public.biz_page_events
           WHERE created_at >= now() - $1::interval
           GROUP BY 1 ORDER BY 1 ASC`,
          [interval]
        ),
        pool.query(
          `SELECT path, page_type,
                  COUNT(*)::int AS pv,
                  COUNT(DISTINCT session_hash)::int AS uv,
                  COALESCE(ROUND(AVG(NULLIF(dwell_sec, 0))), 0)::int AS avg_dwell,
                  COALESCE(ROUND(AVG(NULLIF(scroll_pct, 0))), 0)::int AS avg_scroll
           FROM public.biz_page_events
           WHERE created_at >= now() - $1::interval AND event_name = 'pageview'
           GROUP BY path, page_type
           ORDER BY pv DESC, avg_dwell DESC
           LIMIT 20`,
          [interval]
        ),
        pool.query(
          `SELECT ref_source, COUNT(*)::int AS cnt
           FROM public.biz_page_events
           WHERE created_at >= now() - $1::interval AND event_name = 'pageview'
           GROUP BY ref_source ORDER BY cnt DESC`,
          [interval]
        ),
        pool.query(
          `SELECT device, COUNT(*)::int AS cnt
           FROM public.biz_page_events
           WHERE created_at >= now() - $1::interval AND event_name = 'pageview'
           GROUP BY device ORDER BY cnt DESC`,
          [interval]
        ),
        pool.query(
          `SELECT calculator, COUNT(*)::int AS runs
           FROM public.biz_simulator_runs
           WHERE created_at >= now() - $1::interval
           GROUP BY calculator ORDER BY runs DESC`,
          [interval]
        ),
        pool.query(
          `SELECT id, created_at, category, email, page_url, message
           FROM public.biz_inquiries
           ORDER BY created_at DESC LIMIT 15`
        )
      ]);
      const k = kpiQ.rows[0] || { pv: 0, uv: 0, avg_dwell: 0, avg_scroll: 0, shares: 0, copy_clicks: 0, receipt_downloads: 0 };
      const totalCalcRuns = calcQ.rows.reduce((acc, r) => acc + r.runs, 0);
      return {
        days,
        storage: 'supabase-pg',
        kpis: { ...k, calc_runs: totalCalcRuns, inquiries: inqQ.rows.length },
        daily: dailyQ.rows,
        topPages: pagesQ.rows,
        sources: srcQ.rows,
        devices: devQ.rows,
        calculators: calcQ.rows,
        inquiries: inqQ.rows
      };
    } catch (e) {
      state.lastError = e.message;
    }
  }

  // 메모리 폴백 집계
  const cutoff = Date.now() - days * 86400000;
  const evs = memEvents.filter((e) => e.created_at.getTime() >= cutoff);
  const pvs = evs.filter((e) => e.event_name === 'pageview');
  const uvs = new Set(pvs.map((e) => e.session_hash)).size;
  const dwells = pvs.filter((e) => e.dwell_sec > 0).map((e) => e.dwell_sec);
  const scrolls = pvs.filter((e) => e.scroll_pct > 0).map((e) => e.scroll_pct);
  const avgDwell = dwells.length ? Math.round(dwells.reduce((a, b) => a + b, 0) / dwells.length) : 0;
  const avgScroll = scrolls.length ? Math.round(scrolls.reduce((a, b) => a + b, 0) / scrolls.length) : 0;
  const byPath = new Map();
  for (const e of pvs) {
    const cur = byPath.get(e.path) || { path: e.path, page_type: e.page_type, pv: 0, sessions: new Set(), dwells: [], scrolls: [] };
    cur.pv++;
    cur.sessions.add(e.session_hash);
    if (e.dwell_sec > 0) cur.dwells.push(e.dwell_sec);
    if (e.scroll_pct > 0) cur.scrolls.push(e.scroll_pct);
    byPath.set(e.path, cur);
  }
  const topPages = [...byPath.values()].map((x) => ({
    path: x.path,
    page_type: x.page_type,
    pv: x.pv,
    uv: x.sessions.size,
    avg_dwell: x.dwells.length ? Math.round(x.dwells.reduce((a, b) => a + b, 0) / x.dwells.length) : 0,
    avg_scroll: x.scrolls.length ? Math.round(x.scrolls.reduce((a, b) => a + b, 0) / x.scrolls.length) : 0
  })).sort((a, b) => b.pv - a.pv).slice(0, 20);

  const srcMap = {};
  const devMap = {};
  for (const e of pvs) {
    srcMap[e.ref_source] = (srcMap[e.ref_source] || 0) + 1;
    devMap[e.device] = (devMap[e.device] || 0) + 1;
  }
  const calcList = Object.entries(memory).map(([calculator, arr]) => ({ calculator, runs: arr.length })).filter((x) => x.runs > 0);
  return {
    days,
    storage: 'memory',
    kpis: {
      pv: pvs.length,
      uv: uvs,
      avg_dwell: avgDwell,
      avg_scroll: avgScroll,
      shares: evs.filter((e) => e.event_name !== 'pageview').length,
      copy_clicks: evs.filter((e) => e.event_name === 'copy_link').length,
      receipt_downloads: evs.filter((e) => e.event_name === 'download_receipt').length,
      calc_runs: calcList.reduce((a, b) => a + b.runs, 0),
      inquiries: memInquiries.length
    },
    daily: [],
    topPages,
    sources: Object.entries(srcMap).map(([ref_source, cnt]) => ({ ref_source, cnt })),
    devices: Object.entries(devMap).map(([device, cnt]) => ({ device, cnt })),
    calculators: calcList,
    inquiries: memInquiries.slice(0, 15)
  };
}

async function rlsStatus() {
  if (!state.connected) return { connected: false, driver: state.driver, projectRef: state.projectRef, rlsEnforcedInDdl: true, error: state.lastError };
  try {
    const rows = driver === 'pg' ? (await pool.query(RLS_STATUS_SQL)).rows : await rpcExecSql(RLS_STATUS_SQL);
    const off = rows.filter((x) => !x.rls);
    const biz = rows.find((x) => x.table_name === 'biz_simulator_runs');
    const ev = rows.find((x) => x.table_name === 'biz_page_events');
    const inq = rows.find((x) => x.table_name === 'biz_inquiries');
    return {
      connected: true,
      driver: state.driver,
      projectRef: state.projectRef,
      publicTables: rows.length,
      rlsDisabledCount: off.length,
      rlsDisabledTables: off.map((x) => x.table_name),
      bizSimulatorRunsRls: !!(biz && biz.rls),
      bizPageEventsRls: !!(ev && ev.rls),
      bizInquiriesRls: !!(inq && inq.rls)
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

module.exports = {
  init, record, collectEvent, createInquiry, getAnalyticsSummary, rlsStatus, close,
  state: () => ({ ...state }), MIGRATION_SQL, ENFORCE_ALL_RLS_SQL, RLS_STATUS_SQL, CALCS
};
