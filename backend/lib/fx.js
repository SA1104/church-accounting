'use strict';
/**
 * 자매 서비스 실시간 환율 버스 연동 (읽기 전용)
 * 1순위: SA universe/shared_fx_rates.json (로컬 PC 환경에서만 존재)
 * 2순위: 마지막으로 성공한 메모리 캐시
 * 3순위: 서버 폴백 환율 (CNY 194.5 / USD 1405.0)
 * ※ 파일은 절대 쓰지 않는다 (fs.readFile 만 사용).
 */
const fs = require('fs');
const path = require('path');
const { FX_FALLBACK } = require('../data/facts');

const BUS_PATH = process.env.SHARED_FX_PATH ||
  path.join('c:', 'Users', 'new-s', 'OneDrive', 'Desktop', 'SA universe', 'shared_fx_rates.json');

const TTL_MS = 10 * 60 * 1000;
let cache = null; // { CNY, USD, source, updated_at_kst, mode, loadedAt }

function sane(v, lo, hi) {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
}

function readBus() {
  try {
    if (process.env.RENDER || !fs.existsSync(BUS_PATH)) return null;
    const j = JSON.parse(fs.readFileSync(BUS_PATH, 'utf8'));
    const k = j.krw_per_unit || j.rates || {};
    const CNY = sane(k.CNY, 100, 400);
    const USD = sane(k.USD, 800, 2500);
    if (!CNY || !USD) return null;
    return { CNY, USD, source: 'SA universe 실시간 환율 버스 (shared_fx_rates.json)', updated_at_kst: j.updated_at_kst || null, mode: 'bus' };
  } catch (e) {
    return null;
  }
}

function getRates() {
  if (cache && Date.now() - cache.loadedAt < TTL_MS) return cache;
  const bus = readBus();
  if (bus) {
    cache = { ...bus, loadedAt: Date.now() };
  } else if (cache) {
    cache = { ...cache, mode: cache.mode === 'bus' ? 'cache' : cache.mode, loadedAt: Date.now() };
  } else {
    cache = { CNY: FX_FALLBACK.CNY, USD: FX_FALLBACK.USD, source: FX_FALLBACK.source, updated_at_kst: FX_FALLBACK.updated_at_kst, mode: 'fallback', loadedAt: Date.now() };
  }
  return cache;
}

function publicRates() {
  const r = getRates();
  return { base: 'KRW', CNY: r.CNY, USD: r.USD, KRW: 1, source: r.source, updated_at_kst: r.updated_at_kst, mode: r.mode };
}

module.exports = { getRates, publicRates };
