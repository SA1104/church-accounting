/* BoozaThink UI Formatting & Server-Eval Bridge (bt-client.js) — Zero client-side formulas */
(function (root) {
  'use strict';

  function fmt(v, d) {
    if (v == null || !Number.isFinite(Number(v))) return '-';
    return Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 });
  }
  function won(v) { return (v < 0 ? '−' : '') + fmt(Math.abs(Math.round(v))) + '원'; }
  function pct(v, d) { return v == null || !Number.isFinite(Number(v)) ? '-' : fmt(v, d == null ? 1 : d) + '%'; }
  function manwon(v) { return (v < 0 ? '−' : '') + fmt(Math.abs(Math.round(v))) + '만원'; }

  var DELIVERY_PLANS = {
    'baemin-78': { name: '배민 상생 1구간 7.8%', fee: 7.8, dfee: 3400 },
    'baemin-68a': { name: '배민 상생 2구간 6.8%', fee: 6.8, dfee: 3100 },
    'baemin-68b': { name: '배민 상생 3구간 6.8%', fee: 6.8, dfee: 2900 },
    'baemin-20': { name: '배민 상생 4구간 2.0%', fee: 2.0, dfee: 1900 },
    'baemin-store': { name: '배민 가게배달 6.8%', fee: 6.8, dfee: 0 },
    'coupang-98': { name: '쿠팡이츠 스마트 9.8%', fee: 9.8, dfee: 2900 },
    'yogiyo-97': { name: '요기요 9.7%', fee: 9.7, dfee: 2900 },
    'custom': { name: '직접 입력', fee: 7.0, dfee: 3000 }
  };

  var DELIVERY_BIZ_SPECS = {
    chicken: { benchInd: 'food', name: '치킨·피자·야식', avgPrice: 23500, avgCost: 9600, cogsRange: [38, 44], tip: '원육·치즈·박스 포장재 비중이 높아 식자재+포장 원가율이 38~44% 수준입니다. 사이드 메뉴 추가 옵션으로 객단가를 25,000원 이상으로 올려 배달비 비중을 낮추는 것이 핵심입니다.' },
    food: { benchInd: 'food', name: '한식·분식·도시락', avgPrice: 18500, avgCost: 6500, cogsRange: [32, 38], tip: '다회용기·보온용기 포장재 원가(주문당 900~1,400원)가 숨은 복병입니다. 식자재+포장 합산 원가율을 35% 이내로 유지해야 광고·쿠폰 여력이 생깁니다.' },
    meat: { benchInd: 'food', name: '고기·족발·찜·탕', avgPrice: 34000, avgCost: 13600, cogsRange: [37, 43], tip: '객단가가 3만원 이상으로 높아 고정 배달비(3,400원) 방어에는 가장 유리합니다. 대신 원육 수율 로스와 서비스 막국수·반찬 원가를 반드시 포함해 계산하세요.' },
    cafe: { benchInd: 'cafe', name: '카페·디저트·베이커리', avgPrice: 14500, avgCost: 4200, cogsRange: [25, 32], tip: '원재료율은 낮지만 평균 주문단가가 낮아 14,000원대 주문에 배달비 3,400원이 붙으면 마진이 급감합니다. 최소주문금액 설계와 구움과자 세트 구성이 필수입니다.' }
  };

  var MARKETS = {
    'ss-naver': { name: '스마트스토어 (네이버 유입)', feeRate: 6.63, logistics: 'pack', defLogi: 3000 },
    'ss-mkt': { name: '스마트스토어 (마케팅 유입)', feeRate: 4.63, logistics: 'pack', defLogi: 3000 },
    'ss-small': { name: '스마트스토어 영세 등급', feeRate: 4.947, logistics: 'pack', defLogi: 3000 },
    'cp-wing': { name: '쿠팡 윙 (판매자배송)', feeRate: 11.88, logistics: 'pack', defLogi: 3000 },
    'cp-rg': { name: '쿠팡 로켓그로스', feeRate: 11.88, logistics: 'rg', defLogi: 3100 }
  };

  var cache = new Map();
  var inflight = {};

  function getSimToken() {
    var m = document.querySelector('meta[name="bt-sim-token"]');
    return (m && m.getAttribute('content')) || '';
  }

  function cachePut(k, v) {
    if (cache.size >= 150) {
      var firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(k, v);
  }

  function evalSim(slug, state, extra) {
    var payload = Object.assign({ slug: slug, state: state }, extra || {});
    var key = JSON.stringify(payload);
    if (cache.has(key)) return Promise.resolve(cache.get(key));

    var chan = slug + ':' + ((extra && extra.type) || 'main');
    if (inflight[chan]) {
      try { inflight[chan].abort(); } catch (_) {}
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    inflight[chan] = ctrl;

    return fetch('/api/sim/eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-BT-Token': getSimToken() },
      body: key,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (data && data.ok) cachePut(key, data);
      return data;
    });
  }

  function fetchProfileDefaults(profId, regionKey, intMode) {
    var q = '/api/sim/profile/' + encodeURIComponent(profId) +
      '?region=' + encodeURIComponent(regionKey || 'recommend') +
      '&intmode=' + encodeURIComponent(intMode || 'turnkey');
    if (cache.has(q)) return Promise.resolve(cache.get(q));
    return fetch(q, {
      method: 'GET',
      headers: { 'X-BT-Token': getSimToken() }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      if (data && data.ok) cachePut(q, data);
      return data;
    });
  }

  root.BTEngine = {
    fmt: fmt,
    won: won,
    pct: pct,
    manwon: manwon,
    DELIVERY_PLANS: DELIVERY_PLANS,
    DELIVERY_BIZ_SPECS: DELIVERY_BIZ_SPECS,
    MARKETS: MARKETS,
    evalSim: evalSim,
    fetchProfileDefaults: fetchProfileDefaults
  };
})(typeof self !== 'undefined' ? self : this);
