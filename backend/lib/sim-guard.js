'use strict';
/**
 * BoozaThink Black-Box Simulation Guard & Server Evaluation Vault (sim-guard.js)
 * - 브라우저에 계산 수식(calc-engine.js)이나 30대 업종·정책자금 전체 DB를 노출하지 않고,
 *   서명된 단기 세션 토큰(X-BT-Token) + 출처 검증 + IP 호출 제한 아래 서버 내부에서만 연산한다.
 */
const crypto = require('crypto');
const E = require('./calc-engine');
const fx = require('./fx');
const facts = require('../data/facts');
const { STARTUP_PROFILES } = require('../data/startup-profiles');

const SIM_SECRET = (process.env.JWT_SECRET || 'boozathink-admin-hmac-2027') + ':sim-vault-v1';
const TOKEN_TTL_SEC = 30 * 3600; // 30h (CDN stale-while-revalidate 24h 호환)

const ipBuckets = new Map();

function signTs(tsStr) {
  return crypto.createHmac('sha256', SIM_SECRET).update('bt-sim:' + tsStr).digest('hex').slice(0, 20);
}

function issueSimToken() {
  const ts = String(Math.floor(Date.now() / 1000));
  return ts + '.' + signTs(ts);
}

function verifySimToken(tok) {
  if (typeof tok !== 'string') return false;
  const parts = tok.trim().split('.');
  if (parts.length !== 2) return false;
  const ts = Number(parts[0]);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (now - ts > TOKEN_TTL_SEC || ts - now > 300) return false;
  const expected = signTs(parts[0]);
  if (parts[1].length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

function checkSimRateLimit(ip, maxPerMin) {
  const now = Date.now();
  const rec = ipBuckets.get(ip) || { n: 0, t: now };
  if (now - rec.t > 60000) {
    rec.n = 0;
    rec.t = now;
  }
  rec.n += 1;
  ipBuckets.set(ip, rec);
  if (ipBuckets.size > 6000) ipBuckets.clear();
  return rec.n <= (maxPerMin || 180);
}

function verifySimRequest(req, maxPerMin) {
  const secSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (secSite && secSite === 'cross-site') {
    return { ok: false, status: 403, error: 'cross-site simulation blocked' };
  }
  const origin = String(req.headers.origin || '').trim();
  const host = String(req.headers.host || '').trim().toLowerCase();
  if (origin && host) {
    try {
      const oHost = new URL(origin).host.toLowerCase();
      if (oHost !== host) return { ok: false, status: 403, error: 'origin mismatch' };
    } catch (_) {
      return { ok: false, status: 403, error: 'invalid origin' };
    }
  }
  const tok = req.headers['x-bt-token'];
  if (!verifySimToken(tok)) {
    return { ok: false, status: 403, error: 'invalid or expired simulation token' };
  }
  if (!checkSimRateLimit(req.ip || 'unknown', maxPerMin || 180)) {
    return { ok: false, status: 429, error: '연속 계산 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' };
  }
  return { ok: true };
}

function defaultDelivPreset(prof) {
  const g = (prof && prof.group) || '';
  if (g === '외식·배달') return { dshare: 45, pshare: 15, dappfee: 7.8, drider: 3300, dpack: 900, dpromo: 500 };
  if (g === '카페·디저트') return { dshare: 20, pshare: 45, dappfee: 7.8, drider: 3000, dpack: 450, dpromo: 300 };
  if (g === '도소매·생활밀착') return { dshare: 10, pshare: 20, dappfee: 7.8, drider: 3000, dpack: 300, dpromo: 200 };
  if (g === '이커머스·B2B') return { dshare: 0, pshare: 0, dappfee: 6.8, drider: 0, dpack: 600, dpromo: 300 };
  return { dshare: 0, pshare: 0, dappfee: 7.8, drider: 3000, dpack: 400, dpromo: 0 };
}

function sanitizePublicProfile(prof) {
  return {
    id: prof.id,
    name: prof.name,
    group: prof.group,
    pyeong: prof.pyeong,
    cogsPct: prof.cogsPct,
    seasonNote: prof.seasonNote,
    benchMargin: prof.benchMargin,
    tips: prof.tips || []
  };
}

function getSingleStartupProfileDefaults(profId, regionKey, intMode) {
  const prof = STARTUP_PROFILES.find((p) => p.id === profId) || STARTUP_PROFILES[0];
  const reg = (E.STARTUP_REGIONS && E.STARTUP_REGIONS[regionKey]) || E.STARTUP_REGIONS.recommend;
  const factor = intMode === 'self' ? 0.78 : (intMode === 'takeover' ? 0.42 : 1.0);
  const dp = defaultDelivPreset(prof);
  const cats = E.defaultCategoriesForProfile(prof);
  return {
    profile: sanitizePublicProfile(prof),
    defaults: {
      pyeong: prof.pyeong,
      deposit: Math.round(prof.deposit * reg.depMult),
      rent: Math.round(prof.rent * reg.rentMult),
      maint: prof.maint,
      interior: Math.round(prof.pyeong * prof.interiorPerPyeong * factor),
      equip: prof.equip,
      premium: prof.premium,
      kiosk: prof.kioskCount > 0 ? 1 : 0,
      kioskcnt: prof.kioskCount || 0,
      staff: prof.staffMonthly,
      dshare: dp.dshare,
      pshare: dp.pshare,
      dappfee: String(dp.dappfee),
      drider: dp.drider,
      dpack: dp.dpack,
      dpromo: dp.dpromo,
      menuItems: cats
    }
  };
}

function buildStartupEval(s) {
  const prof = STARTUP_PROFILES.find((p) => p.id === s.profile) || STARTUP_PROFILES[0];
  let menuItems = s.menuItems;
  if (!Array.isArray(menuItems) || !menuItems.length) {
    if (typeof s.menudata === 'string' && s.menudata) {
      try {
        const parsed = JSON.parse(s.menudata);
        if (Array.isArray(parsed) && parsed.length) menuItems = parsed.slice(0, 10);
      } catch (_) {}
    }
  }
  if (!Array.isArray(menuItems) || !menuItems.length) {
    menuItems = E.defaultCategoriesForProfile(prof);
  }
  const r = E.startupMaster(Object.assign({}, s, { menuItems, delivmode: 'detail' }), STARTUP_PROFILES);
  r.profile = sanitizePublicProfile(r.profile);
  return { r };
}

function buildDeliveryEval(s) {
  const r = E.delivery(s);
  const pDisc = Math.min(2000, Math.round(r.price * 0.1));
  const pRes = E.delivery(Object.assign({}, s, {
    price: r.price - pDisc,
    fee: Math.min(Number(s.fee) || 0, 6.8),
    dfee: 0,
    promo: 0
  }));
  return { r, pDisc, pRes };
}

function buildSellerEval(s) {
  const fxRates = fx.publicRates();
  const r = E.seller(s, fxRates);
  const bPack = Math.round((Number(s.pack) || 0) * (s.market === 'cp-rg' ? 1.7 : 1.15));
  const bRes = E.seller(Object.assign({}, s, {
    unit: (Number(s.unit) || 0) * 2,
    ship: (Number(s.ship) || 0) * 2,
    price: Math.round((Number(s.price) || 0) * 2 * 0.95),
    pack: bPack
  }), fxRates);
  return { r, bPack, bRes, fx: fxRates };
}

function buildPolicyEval(s) {
  const r = E.policy(s);
  const matchedCards = r.matches.map((m) => {
    const p = facts.POLICY_PROGRAMS.find((x) => x.id === m.id);
    if (!p) return null;
    return {
      id: m.id,
      fit: m.fit,
      why: m.why,
      name: m.id === 'kodit-regional' ? p.name.replace('지역신용보증재단', r.regionGuarantee) : p.name,
      limit: p.limit,
      rate: p.rate,
      term: p.term,
      where: p.where,
      docs: p.docs || []
    };
  }).filter(Boolean);
  return { r, matchedCards };
}

function evaluateSimulatorPayload(body) {
  const slug = String((body && body.slug) || '').trim();
  const s = (body && body.state && typeof body.state === 'object') ? body.state : {};

  switch (slug) {
    case 'startup-master':
      return { ok: true, ...buildStartupEval(s) };
    case 'delivery-margin':
      return { ok: true, ...buildDeliveryEval(s) };
    case 'seller-roas':
      return { ok: true, ...buildSellerEval(s) };
    case 'policy-funds':
      return { ok: true, ...buildPolicyEval(s) };
    case 'labor-automation':
      return { ok: true, r: E.labor(s) };
    case 'vat-income-tax':
      return { ok: true, r: E.vatIncome(s) };
    case 'store-rent-breakeven':
      return { ok: true, r: E.storeLease(s) };
    case 'loan-diagnose':
      return { ok: true, r: E.loanDiagnose(s) };
    case 'mini': {
      const type = String(body.type || '').trim();
      if (!E.MINI[type]) return { ok: false, error: 'unknown mini calculator' };
      return { ok: true, rows: E.mini(type, body.vals || {}) };
    }
    default:
      return { ok: false, error: 'unknown simulator slug' };
  }
}

module.exports = {
  issueSimToken,
  verifySimToken,
  verifySimRequest,
  getSingleStartupProfileDefaults,
  evaluateSimulatorPayload,
  buildStartupEval,
  buildDeliveryEval,
  buildSellerEval,
  buildPolicyEval
};
