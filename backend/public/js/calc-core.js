/* BoozaThink Shared Simulator Core — Two-way URL Binding, Instant Recalc, SVG Charts, Thermal Receipt PNG, Benchmark */
(function (root) {
  'use strict';

  var E = root.BTEngine;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function shortWon(v) {
    var a = Math.abs(v);
    var sign = v < 0 ? '−' : '';
    if (a >= 100000000) return sign + (a / 100000000).toFixed(1) + '억';
    if (a >= 10000) return sign + Math.round(a / 10000).toLocaleString('ko-KR') + '만';
    return sign + Math.round(a).toLocaleString('ko-KR') + '원';
  }

  /* ───── SVG Charts ───── */
  function waterfallSvg(totalPrice, breakdown) {
    var W = 560, rowH = 30, padL = 132, padR = 96, barW = W - padL - padR;
    var items = [{ label: '판매가(매출)', val: totalPrice, start: 0, end: totalPrice, kind: 'gross' }];
    var cur = totalPrice;
    breakdown.forEach(function (b) {
      if (b.key === 'net') {
        items.push({ label: b.label, val: b.value, start: 0, end: b.value, kind: b.value >= 0 ? 'net' : 'loss' });
      } else {
        var next = cur - b.value;
        items.push({ label: '− ' + b.label, val: -b.value, start: next, end: cur, kind: 'deduct' });
        cur = next;
      }
    });
    var maxVal = Math.max(totalPrice, 1);
    var minVal = Math.min(0, cur);
    var span = Math.max(1, maxVal - minVal);
    var xOf = function (v) { return padL + ((v - minVal) / span) * barW; };
    var H = items.length * rowH + 16;
    var colors = { gross: '#3182f6', deduct: '#ef4444', net: '#0e9f6e', loss: '#dc2626' };
    var zeroX = xOf(0);
    var rows = items.map(function (it, i) {
      var y = i * rowH + 8;
      var x1 = xOf(Math.min(it.start, it.end));
      var x2 = xOf(Math.max(it.start, it.end));
      var w = Math.max(2, x2 - x1);
      var txt = (it.kind === 'deduct' ? '−' + E.fmt(Math.round(Math.abs(it.val))) : E.fmt(Math.round(it.val))) + '원';
      return '<g transform="translate(0,' + y + ')">' +
        '<text x="0" y="16" font-weight="' + (it.kind === 'net' ? '800' : '600') + '">' + esc(it.label) + '</text>' +
        '<rect x="' + padL + '" y="4" width="' + barW + '" height="16" rx="4" fill="currentColor" opacity="0.06"/>' +
        '<rect x="' + x1.toFixed(1) + '" y="4" width="' + w.toFixed(1) + '" height="16" rx="4" fill="' + colors[it.kind] + '"/>' +
        '<text x="' + (W - 2) + '" y="16" text-anchor="end" font-weight="700">' + esc(txt) + '</text>' +
        '</g>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line x1="' + zeroX.toFixed(1) + '" y1="4" x2="' + zeroX.toFixed(1) + '" y2="' + (H - 4) + '" stroke="currentColor" stroke-opacity="0.2" stroke-dasharray="3,3"/>' +
      rows + '</svg>';
  }

  function compareBarSvg(bars) {
    var W = 560, rowH = 38, padL = 128, padR = 112, barW = W - padL - padR;
    var maxAbs = 1;
    bars.forEach(function (b) { maxAbs = Math.max(maxAbs, Math.abs(b.value)); });
    var H = bars.length * rowH + 10;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + bars.map(function (b, i) {
      var y = i * rowH + 6;
      var w = Math.max(3, (Math.abs(b.value) / maxAbs) * barW);
      var col = b.value < 0 ? '#dc2626' : (b.color || '#3182f6');
      return '<g transform="translate(0,' + y + ')">' +
        '<text x="0" y="20" font-weight="700">' + esc(b.label) + '</text>' +
        '<rect x="' + padL + '" y="6" width="' + barW + '" height="20" rx="6" fill="currentColor" opacity="0.06"/>' +
        '<rect x="' + padL + '" y="6" width="' + w.toFixed(1) + '" height="20" rx="6" fill="' + col + '"/>' +
        '<text x="' + (W - 2) + '" y="20" text-anchor="end" font-weight="800">' + esc(b.display || E.won(b.value)) + '</text>' +
        '</g>';
    }).join('') + '</svg>';
  }

  function cliffSvg(curve, curH, cutH) {
    var W = 560, H = 210, padL = 56, padR = 20, padT = 22, padB = 30;
    var pw = W - padL - padR, ph = H - padT - padB;
    var maxC = 1;
    curve.forEach(function (pt) { maxC = Math.max(maxC, pt.cost); });
    var xOf = function (h) { return padL + ((h - 1) / 39) * pw; };
    var yOf = function (c) { return padT + ph - (c / maxC) * ph; };
    var d = curve.map(function (pt, i) {
      return (i === 0 ? 'M' : 'L') + xOf(pt.h).toFixed(1) + ',' + yOf(pt.cost).toFixed(1);
    }).join(' ');
    var x15 = xOf(15);
    function marker(h, color, label) {
      if (h < 1 || h > 40) return '';
      var nearest = curve.reduce(function (best, p) { return Math.abs(p.h - h) < Math.abs(best.h - h) ? p : best; }, curve[0]);
      var cx = xOf(h), cy = yOf(nearest.cost);
      return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
        '<text x="' + cx.toFixed(1) + '" y="' + Math.max(12, cy - 9).toFixed(1) + '" text-anchor="middle" font-weight="700">' + esc(label) + '</text>';
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line x1="' + padL + '" y1="' + (padT + ph) + '" x2="' + (W - padR) + '" y2="' + (padT + ph) + '" stroke="currentColor" stroke-opacity="0.2"/>' +
      '<line x1="' + x15.toFixed(1) + '" y1="' + padT + '" x2="' + x15.toFixed(1) + '" y2="' + (padT + ph) + '" stroke="#ef4444" stroke-dasharray="4,3" stroke-width="1.5"/>' +
      '<text x="' + (x15 + 5).toFixed(1) + '" y="' + (padT + 12) + '" fill="#ef4444" font-weight="800">주 15시간 절벽</text>' +
      '<path d="' + d + '" fill="none" stroke="#3182f6" stroke-width="2.5" stroke-linejoin="round"/>' +
      marker(cutH, '#0e9f6e', '도입후 ' + cutH + 'h') +
      marker(curH, '#1b64da', '현재 ' + curH + 'h') +
      '<text x="' + padL + '" y="' + (H - 8) + '">1시간</text>' +
      '<text x="' + x15.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">15시간</text>' +
      '<text x="' + (W - padR) + '" y="' + (H - 8) + '" text-anchor="end">40시간</text>' +
      '<text x="' + (padL - 6) + '" y="' + (padT + 8) + '" text-anchor="end">' + shortWon(maxC) + '</text>' +
      '<text x="' + (padL - 6) + '" y="' + (padT + ph) + '" text-anchor="end">0</text>' +
      '</svg>';
  }

  function crossSvg(cum, payback) {
    var W = 560, H = 215, padL = 60, padR = 20, padT = 22, padB = 30;
    var pw = W - padL - padR, ph = H - padT - padB;
    var maxV = 1;
    cum.forEach(function (p) { maxV = Math.max(maxV, p.asIs, p.toBe); });
    var xOf = function (m) { return padL + (m / 36) * pw; };
    var yOf = function (v) { return padT + ph - (v / maxV) * ph; };
    var pAsIs = cum.map(function (p, i) { return (i ? 'L' : 'M') + xOf(p.m).toFixed(1) + ',' + yOf(p.asIs).toFixed(1); }).join(' ');
    var pToBe = cum.map(function (p, i) { return (i ? 'L' : 'M') + xOf(p.m).toFixed(1) + ',' + yOf(p.toBe).toFixed(1); }).join(' ');
    var crossMark = '';
    if (payback != null && payback >= 0 && payback <= 36) {
      var cx = xOf(payback);
      var idx = Math.min(35, Math.floor(payback));
      var frac = payback - idx;
      var cy = yOf(cum[idx].asIs + (cum[idx + 1].asIs - cum[idx].asIs) * frac);
      crossMark = '<line x1="' + cx.toFixed(1) + '" y1="' + padT + '" x2="' + cx.toFixed(1) + '" y2="' + (padT + ph) + '" stroke="#0e9f6e" stroke-dasharray="4,3"/>' +
        '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5.5" fill="#0e9f6e" stroke="#fff" stroke-width="2"/>' +
        '<text x="' + Math.min(W - 65, Math.max(padL + 45, cx)).toFixed(1) + '" y="' + Math.max(14, cy - 10).toFixed(1) + '" text-anchor="middle" font-weight="800" fill="#0e9f6e">손익교차 ' + payback.toFixed(1) + '개월</text>';
    }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line x1="' + padL + '" y1="' + (padT + ph) + '" x2="' + (W - padR) + '" y2="' + (padT + ph) + '" stroke="currentColor" stroke-opacity="0.2"/>' +
      '<path d="' + pAsIs + '" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="5,3"/>' +
      '<path d="' + pToBe + '" fill="none" stroke="#0e9f6e" stroke-width="2.6"/>' +
      crossMark +
      '<text x="' + padL + '" y="' + (H - 8) + '">도입 시점</text>' +
      '<text x="' + xOf(12).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">1년</text>' +
      '<text x="' + xOf(24).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">2년</text>' +
      '<text x="' + xOf(36).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="end">3년(36개월)</text>' +
      '<text x="' + (padL - 6) + '" y="' + (padT + 8) + '" text-anchor="end">' + shortWon(maxV) + '</text>' +
      '<text x="' + (W - padR) + '" y="' + (padT + 12) + '" text-anchor="end" font-weight="700">-- 현행 인건비(적색) · 실선 무인화 도입후(녹색)</text>' +
      '</svg>';
  }

  /* ───── Thermal Paper Receipt PNG Generator ───── */
  function downloadReceipt(spec) {
    // spec: { filename, subtitle, heroLabel, heroValue, heroSub, rows: [[k,v,bold?]], noteLines: [str] }
    var scale = 2;
    var W = 420;
    var noteLines = spec.noteLines || [];
    var H = 260 + spec.rows.length * 30 + noteLines.length * 22 + 120;
    var canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Outer background
    ctx.fillStyle = '#eef2f8';
    ctx.fillRect(0, 0, W, H);

    // Paper with sawtooth top & bottom
    var px = 22, py = 20, pw = W - 44, ph = H - 40;
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.moveTo(px, py + 8);
    for (var tx = px; tx < px + pw; tx += 12) {
      ctx.lineTo(tx + 6, py);
      ctx.lineTo(Math.min(px + pw, tx + 12), py + 8);
    }
    ctx.lineTo(px + pw, py + ph - 8);
    for (var bx = px + pw; bx > px; bx -= 12) {
      ctx.lineTo(bx - 6, py + ph);
      ctx.lineTo(Math.max(px, bx - 12), py + ph - 8);
    }
    ctx.closePath();
    ctx.fillStyle = '#fffdf7';
    ctx.fill();
    ctx.restore();

    var fontSans = '"Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
    var fontMono = 'ui-monospace, "D2Coding", Consolas, "Malgun Gothic", monospace';
    var y = py + 38;

    ctx.fillStyle = '#191f28';
    ctx.textAlign = 'center';
    ctx.font = '800 20px ' + fontSans;
    ctx.fillText('점포 손익 진단 영수증', W / 2, y);
    y += 22;
    ctx.fillStyle = '#6b7684';
    ctx.font = '600 12.5px ' + fontSans;
    ctx.fillText(spec.subtitle || 'BoozaThink 사장님·셀러 손익 연구소', W / 2, y);
    y += 18;
    var nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    ctx.font = '500 11.5px ' + fontMono;
    ctx.fillText('발행일시 ' + nowStr + ' · BOOZATHINK.COM', W / 2, y);
    y += 18;

    function dashed() {
      ctx.save();
      ctx.strokeStyle = '#b0b8c1';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px + 20, y);
      ctx.lineTo(px + pw - 20, y);
      ctx.stroke();
      ctx.restore();
      y += 20;
    }

    dashed();

    // Hero highlight box
    ctx.fillStyle = '#e8f3ff';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(px + 20, y - 8, pw - 40, 74, 10) : ctx.rect(px + 20, y - 8, pw - 40, 74);
    ctx.fill();
    ctx.fillStyle = '#1b64da';
    ctx.textAlign = 'center';
    ctx.font = '700 12.5px ' + fontSans;
    ctx.fillText(spec.heroLabel, W / 2, y + 12);
    ctx.font = '800 26px ' + fontSans;
    ctx.fillText(spec.heroValue, W / 2, y + 42);
    if (spec.heroSub) {
      ctx.fillStyle = '#4e5968';
      ctx.font = '600 12px ' + fontSans;
      ctx.fillText(spec.heroSub, W / 2, y + 60);
    }
    y += 84;

    dashed();

    // Itemized rows
    spec.rows.forEach(function (r) {
      var bold = !!r[2];
      ctx.font = (bold ? '800 14px ' : '600 13px ') + fontSans;
      ctx.fillStyle = bold ? '#1b64da' : '#333d4b';
      ctx.textAlign = 'left';
      ctx.fillText(r[0], px + 24, y);
      ctx.font = (bold ? '800 14px ' : '700 13px ') + fontMono;
      ctx.textAlign = 'right';
      ctx.fillText(r[1], px + pw - 24, y);
      y += 30;
    });

    y += 4;
    dashed();

    // Note lines
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4e5968';
    ctx.font = '600 12px ' + fontSans;
    noteLines.forEach(function (ln) {
      ctx.fillText(ln, px + 24, y, pw - 48);
      y += 22;
    });

    // Barcode graphic
    y += 10;
    ctx.fillStyle = '#191f28';
    var bxStart = W / 2 - 96;
    for (var i = 0; i < 48; i++) {
      var bw = (i * 7 + 3) % 3 === 0 ? 3 : 1.4;
      ctx.fillRect(bxStart + i * 4, y, bw, 28);
    }
    y += 44;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8b95a1';
    ctx.font = '700 11px ' + fontMono;
    ctx.fillText('HTTPS://BOOZATHINK.COM', W / 2, y);

    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = spec.filename || 'boozathink-receipt.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    }, 'image/png');
  }

  /* ───── Controller Factory ───── */
  function mount(config) {
    // config: { slug, defaults, render(state, helpers) -> { benchPayload, receipt } }
    var rootEl = document.querySelector('[data-calc="' + config.slug + '"]');
    if (!rootEl) return;
    var form = document.getElementById('calc-form');
    var toastEl = rootEl.querySelector('[data-toast]');
    var benchTextEl = rootEl.querySelector('[data-bench-text]');
    var benchSrcEl = rootEl.querySelector('[data-bench-src]');

    var initialDefaults = Object.assign({}, config.defaults);
    var state = Object.assign({}, config.defaults);

    function readDomIntoState() {
      Object.keys(state).forEach(function (k) {
        var els = form.querySelectorAll('[data-bind="' + k + '"]');
        if (!els.length) return;
        var el = els[0];
        if (el.type === 'checkbox') state[k] = el.checked ? 1 : 0;
        else if (el.type === 'radio') {
          els.forEach(function (r) { if (r.checked) state[k] = r.value; });
        } else if (el.tagName === 'SELECT' || typeof initialDefaults[k] === 'string' || el.type === 'hidden') {
          state[k] = el.value;
        } else {
          var v = parseFloat(el.value);
          if (Number.isFinite(v)) state[k] = v;
        }
      });
    }

    function applyQueryToState() {
      var sp = new URLSearchParams(window.location.search);
      sp.forEach(function (val, key) {
        if (!(key in state)) return;
        if (typeof initialDefaults[key] === 'string') {
          state[key] = val;
        } else {
          var v = parseFloat(val);
          if (Number.isFinite(v)) state[key] = v;
        }
      });
    }

    function writeStateToDom(skipEl) {
      Object.keys(state).forEach(function (k) {
        var els = form.querySelectorAll('[data-bind="' + k + '"]');
        els.forEach(function (el) {
          if (el === skipEl) return;
          if (el.type === 'checkbox') el.checked = Number(state[k]) === 1;
          else if (el.type === 'radio') el.checked = String(el.value) === String(state[k]);
          else el.value = state[k];
          if (el.type === 'range' && root.BTSyncRangeFill) root.BTSyncRangeFill(el);
        });
      });
    }

    function buildQueryString() {
      var sp = new URLSearchParams();
      Object.keys(state).forEach(function (k) {
        if (String(state[k]) !== String(initialDefaults[k])) sp.set(k, String(state[k]));
      });
      return sp.toString();
    }

    function buildFullShareUrl() {
      var sp = new URLSearchParams();
      Object.keys(state).forEach(function (k) { sp.set(k, String(state[k])); });
      return window.location.origin + window.location.pathname + '?' + sp.toString();
    }

    function syncUrl() {
      try {
        var qs = buildQueryString();
        var next = window.location.pathname + (qs ? '?' + qs : '');
        if (next !== window.location.pathname + window.location.search) {
          window.history.replaceState(null, '', next);
        }
      } catch (e) {}
    }

    function setOut(key, text) {
      rootEl.querySelectorAll('[data-out="' + key + '"]').forEach(function (el) { el.textContent = text; });
    }
    function setHtml(key, html) {
      rootEl.querySelectorAll('[data-out-html="' + key + '"]').forEach(function (el) { el.innerHTML = html; });
    }
    function setChart(key, svg) {
      var el = rootEl.querySelector('[data-chart="' + key + '"]');
      if (el) el.innerHTML = svg;
    }
    function setBreakdown(totalPrice, list) {
      var tb = rootEl.querySelector('[data-table="breakdown"] tbody');
      if (!tb) return;
      tb.innerHTML = list.map(function (b) {
        return '<tr><th>' + esc(b.label) + '</th><td>' + E.won(b.value) + '</td><td>' + E.pct(totalPrice > 0 ? b.value / totalPrice * 100 : 0) + '</td></tr>';
      }).join('');
    }
    function setHeroStatus(st) {
      var hero = rootEl.querySelector('.result-hero');
      if (hero) hero.setAttribute('data-status', st);
      var sig = rootEl.querySelector('[data-signal]');
      if (sig) sig.setAttribute('data-signal', st);
    }

    function showToast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      clearTimeout(showToast._t);
      showToast._t = setTimeout(function () { toastEl.textContent = ''; }, 3200);
    }

    var lastResult = null;
    var benchTimer = null;
    var evalTimer = null;
    var evalSeq = 0;

    var IND_LABEL = { food: '외식업', cafe: '카페·디저트', retail: '도소매·셀러', online: '이커머스 셀러', mfg: '제조·소공인', service: '개인서비스', etc: '전체 업종' };

    function fmtMetric(val, unit) {
      if (val == null || !Number.isFinite(Number(val))) return '-';
      if (unit === '원') return E.won(val);
      if (unit === '만원') return E.manwon(val);
      return E.fmt(val, 1) + unit;
    }

    function scheduleBench(payload) {
      if (!payload || !benchTextEl) return;
      clearTimeout(benchTimer);
      benchTimer = setTimeout(function () {
        fetch('/api/biz/benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.ok) return;
          var indName = d.profileLabel || IND_LABEL[payload.industry] || '동종업계';
          var medTxt = fmtMetric(d.median != null ? d.median : d.average, d.unit);
          var top20Txt = fmtMetric(d.top20Cut, d.unit);
          var gaugeHtml = '';
          if (d.topPercent != null) {
            var pos = Math.max(4, Math.min(96, 100 - d.topPercent));
            gaugeHtml = '<div class="bench-gauge-wrap">' +
              '<div class="bench-gauge-bar"><div class="bench-gauge-fill" style="width:' + pos + '%"></div><span class="bench-gauge-dot" style="left:' + pos + '%">내 위치</span></div>' +
              '<div class="bench-gauge-meta tnum"><span>하위권</span><span>사장님 중앙값 ' + esc(medTxt) + '</span><span>상위 20% 기준 ' + esc(top20Txt) + '</span></div>' +
            '</div>';
            benchTextEl.innerHTML = '현재 <strong>' + esc(indName) + '</strong> 사장님들의 실제 계산 분포(중앙값 <strong class="tnum">' + esc(medTxt) + '</strong>) 중 내 조건은 <strong class="tnum" style="color:var(--brand)">상위 ' + d.topPercent + '%</strong> 구간입니다.' + gaugeHtml;
          } else {
            benchTextEl.innerHTML = '현재 <strong>' + esc(indName) + '</strong> 사장님 시뮬레이션 중앙값 ' + esc(d.label) + '은 <strong class="tnum">' + esc(medTxt) + '</strong> (상위 20% 우수선 <strong class="tnum">' + esc(top20Txt) + '</strong>)입니다.';
          }
          if (benchSrcEl) benchSrcEl.textContent = '누적 표본 ' + E.fmt(d.sampleSize) + '건 분석';
        }).catch(function () {});
      }, 650);
    }

    var helpers = {
      esc: esc, setOut: setOut, setHtml: setHtml, setChart: setChart, setBreakdown: setBreakdown,
      setHeroStatus: setHeroStatus, waterfallSvg: waterfallSvg, compareBarSvg: compareBarSvg,
      cliffSvg: cliffSvg, crossSvg: crossSvg, rootEl: rootEl, form: form, writeStateToDom: writeStateToDom,
      showToast: showToast, state: state, recompute: function (k) { recompute(k, null, false); }
    };

    function runRenderWithServerData(srvData, fromInit) {
      lastResult = config.render(state, helpers, srvData) || {};
      if (!fromInit) syncUrl();
      if (lastResult.benchPayload) scheduleBench(lastResult.benchPayload);
    }

    function recompute(changedKey, sourceEl, fromInit) {
      var seq = ++evalSeq;
      var prep = (config.onBeforeCalc && changedKey) ? config.onBeforeCalc(state, changedKey, helpers) : null;

      function proceedAfterPrep() {
        if (seq !== evalSeq) return;
        writeStateToDom(sourceEl);

        if (fromInit && root.__BT_BOOT__ && root.__BT_BOOT__.slug === config.slug && root.__BT_BOOT__.data) {
          var bootData = root.__BT_BOOT__.data;
          root.__BT_BOOT__ = null;
          runRenderWithServerData(bootData, true);
          return;
        }

        if (evalTimer) clearTimeout(evalTimer);
        var waitMs = fromInit ? 0 : 55;
        evalTimer = setTimeout(function () {
          var payloadState = config.buildEvalState ? config.buildEvalState(state) : state;
          E.evalSim(config.slug, payloadState).then(function (res) {
            if (seq !== evalSeq || !res || !res.ok) return;
            runRenderWithServerData(res, fromInit);
          }).catch(function () {});
        }, waitMs);
      }

      if (prep && typeof prep.then === 'function') {
        prep.then(proceedAfterPrep).catch(proceedAfterPrep);
      } else {
        proceedAfterPrep();
      }
    }

    form.addEventListener('input', function (e) {
      var t = e.target;
      var k = t && t.getAttribute('data-bind');
      if (!k) return;
      if (t.type === 'checkbox') state[k] = t.checked ? 1 : 0;
      else if (t.type === 'radio') { if (t.checked) state[k] = t.value; }
      else if (t.tagName === 'SELECT' || typeof initialDefaults[k] === 'string' || t.type === 'hidden') state[k] = t.value;
      else {
        var v = parseFloat(t.value);
        if (!Number.isFinite(v)) return;
        state[k] = v;
      }
      recompute(k, t, false);
    });

    form.addEventListener('change', function (e) {
      var t = e.target;
      var k = t && t.getAttribute('data-bind');
      if (!k) return;
      if (t.type === 'checkbox') state[k] = t.checked ? 1 : 0;
      else if (t.type === 'radio') { if (t.checked) state[k] = t.value; }
      else if (t.tagName === 'SELECT' || typeof initialDefaults[k] === 'string' || t.type === 'hidden') state[k] = t.value;
      else {
        var v = parseFloat(t.value);
        state[k] = Number.isFinite(v) ? v : 0;
      }
      recompute(k, null, false);
    });

    rootEl.querySelectorAll('[data-preset]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-preset').split(':');
        if (parts.length === 2 && parts[0] in state) {
          state[parts[0]] = parseFloat(parts[1]);
          recompute(parts[0], null, false);
        }
      });
    });

    var copyBtn = rootEl.querySelector('[data-action="copy-link"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var url = buildFullShareUrl();
        syncUrl();
        if (root.BTTrack) root.BTTrack('copy_link', { calculator: config.slug });
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () {
            showToast('내 매장 시뮬레이션 링크가 복사되었습니다.');
          }).catch(function () { fallbackCopy(url); });
        } else {
          fallbackCopy(url);
        }
      });
    }

    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('시뮬레이션 링크가 복사되었습니다.'); } catch (e) {}
      document.body.removeChild(ta);
    }

    var receiptBtn = rootEl.querySelector('[data-action="receipt"]');
    if (receiptBtn) {
      receiptBtn.addEventListener('click', function () {
        if (lastResult && lastResult.receipt) {
          if (root.BTTrack) root.BTTrack('download_receipt', { calculator: config.slug });
          downloadReceipt(lastResult.receipt);
          showToast('손익 진단 영수증 PNG 이미지를 저장했습니다.');
        }
      });
    }

    var resetBtn = rootEl.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        Object.assign(state, initialDefaults);
        window.history.replaceState(null, '', window.location.pathname);
        recompute(null, null, true);
        showToast('기본값으로 초기화되었습니다.');
      });
    }

    // 5. 브라우저 임시 조건 비교 보관함 (최대 5개 저장 · 1클릭 불러오기) + 원하는 계산기 신청 안내
    var actBox = rootEl.querySelector('.calc-actions');
    var TRAY_KEY = 'bt-tray-' + config.slug;
    function loadTray() {
      try {
        var arr = JSON.parse(localStorage.getItem(TRAY_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
      } catch (e) { return []; }
    }
    function saveTray(arr) {
      try { localStorage.setItem(TRAY_KEY, JSON.stringify(arr.slice(0, 5))); } catch (e) {}
    }

    if (actBox && !actBox._trayWired) {
      actBox._trayWired = true;
      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'btn';
      saveBtn.setAttribute('data-action', 'save-tray');
      saveBtn.textContent = '현재 조건 비교함에 담기';
      if (resetBtn) actBox.insertBefore(saveBtn, resetBtn);
      else actBox.appendChild(saveBtn);

      var trayWrap = document.createElement('div');
      trayWrap.className = 'saved-tray';
      trayWrap.setAttribute('data-saved-tray', '');
      actBox.insertAdjacentElement('afterend', trayWrap);

      var reqNudge = document.createElement('p');
      reqNudge.className = 'req-nudge';
      reqNudge.innerHTML = '찾으시는 업종이나 계산 방식이 없나요? <a href="/requests">필요한 계산기 신청 · 투표하기 →</a>';
      trayWrap.insertAdjacentElement('afterend', reqNudge);

      function buildCompareMatrixHtml(list) {
        var rich = list.filter(function (it) { return Array.isArray(it.rows) && it.rows.length > 0; });
        if (rich.length < 2) {
          return '<p class="tray-hint">다른 조건(예: 다른 평수·월세·메뉴가)으로 바꾼 뒤 한 번 더 <strong>[현재 조건 비교함에 담기]</strong>를 누르시면 아래에 <strong>후보 A vs B 나란히 정밀 비교표</strong>가 자동으로 펼쳐집니다.</p>';
        }
        var cols = rich.slice(0, 4);
        var maxRows = 0;
        cols.forEach(function (c) { if (c.rows.length > maxRows) maxRows = c.rows.length; });

        var headCells = '<th>비교 항목</th>' + cols.map(function (c, i) {
          return '<th><span class="cmp-badge">후보 ' + String.fromCharCode(65 + i) + '</span><br>' + esc(c.title) + '</th>';
        }).join('');

        var heroRow = '<tr class="cmp-hero-row"><th>' + esc(cols[0].heroLabel || '핵심 진단 결과') + '</th>' +
          cols.map(function (c) {
            return '<td><strong class="tnum">' + esc(c.val) + '</strong>' +
              (c.heroSub ? '<span class="cmp-sub">' + esc(c.heroSub) + '</span>' : '') + '</td>';
          }).join('') + '</tr>';

        var bodyRows = '';
        for (var rIdx = 0; rIdx < maxRows; rIdx++) {
          var rowLabel = (cols[0].rows[rIdx] && cols[0].rows[rIdx][0]) ? cols[0].rows[rIdx][0] : ('항목 ' + (rIdx + 1));
          var isBold = cols[0].rows[rIdx] && cols[0].rows[rIdx][2];
          bodyRows += '<tr' + (isBold ? ' class="cmp-bold-row"' : '') + '><th>' + esc(rowLabel) + '</th>' +
            cols.map(function (c) {
              var cell = c.rows[rIdx] ? c.rows[rIdx][1] : '-';
              return '<td class="tnum">' + esc(cell) + '</td>';
            }).join('') + '</tr>';
        }

        return '<div class="tray-compare-wrap">' +
          '<div class="tray-compare-title"><strong>후보 조건 A vs B 나란히 정밀 비교표</strong><span>이름 옆 ✎ 버튼으로 상가·메뉴 별칭을 메모해 두실 수 있습니다</span></div>' +
          '<div class="table-scroll"><table class="rate-board tray-compare-table"><thead><tr>' + headCells + '</tr></thead><tbody>' +
          heroRow + bodyRows + '</tbody></table></div></div>';
      }

      function renderTray() {
        var list = loadTray();
        if (!list.length) {
          trayWrap.innerHTML = '';
          trayWrap.hidden = true;
          return;
        }
        trayWrap.hidden = false;
        trayWrap.innerHTML = '<div class="saved-tray-head"><strong>내가 담아둔 비교 조건 (' + list.length + '/5)</strong><span>클릭하면 해당 조건으로 즉시 바뀝니다</span></div>' +
          '<div class="saved-tray-list">' + list.map(function (it, idx) {
            var badge = String.fromCharCode(65 + idx);
            return '<div class="saved-chip">' +
              '<button type="button" class="saved-load" data-load-idx="' + idx + '"><strong>' + badge + '. ' + esc(it.title) + '</strong> <span class="tnum">' + esc(it.val) + '</span></button>' +
              '<button type="button" class="saved-ren" title="별칭 수정" aria-label="후보 별칭 수정" data-ren-idx="' + idx + '">✎</button>' +
              '<button type="button" class="saved-del" title="삭제" aria-label="보관 조건 삭제" data-del-idx="' + idx + '">×</button>' +
            '</div>';
          }).join('') + '</div>' + buildCompareMatrixHtml(list);
      }

      saveBtn.addEventListener('click', function () {
        var rec = (lastResult && lastResult.receipt) || {};
        var title = (rec.subtitle || config.slug).replace(/^창업 풀코스 손익 진단 · /, '').replace(/^배달앱 1주문 손익 진단 · /, '').slice(0, 26);
        var val = rec.heroValue || '';
        var qStr = buildQueryString();
        var list = loadTray();
        list.unshift({
          title: title,
          heroLabel: rec.heroLabel || '핵심 진단 결과',
          val: val,
          heroSub: rec.heroSub || '',
          rows: Array.isArray(rec.rows) ? rec.rows.slice(0, 8) : [],
          q: qStr,
          t: Date.now()
        });
        saveTray(list.slice(0, 5));
        renderTray();
        if (root.BTTrack) root.BTTrack('save_scenario', { calculator: config.slug });
        showToast(list.length >= 2 ? '후보 조건이 추가되어 아래 A vs B 비교표가 갱신되었습니다!' : '첫 번째 후보 조건을 담았습니다. 다른 조건으로 한 번 더 담아 나란히 비교해 보세요!');
      });

      trayWrap.addEventListener('click', function (e) {
        var ld = e.target.closest('[data-load-idx]');
        if (ld) {
          var list = loadTray();
          var item = list[parseInt(ld.getAttribute('data-load-idx'), 10)];
          if (!item) return;
          var nextUrl = window.location.pathname + (item.q ? '?' + item.q : '');
          window.history.replaceState(null, '', nextUrl);
          Object.assign(state, initialDefaults);
          applyQueryToState();
          recompute(null, null, false);
          showToast('‘' + item.title + '’ 조건을 불러왔습니다.');
          return;
        }
        var rn = e.target.closest('[data-ren-idx]');
        if (rn) {
          var rList = loadTray();
          var rIdx = parseInt(rn.getAttribute('data-ren-idx'), 10);
          if (!rList[rIdx]) return;
          var nextName = window.prompt('비교표에 표시할 후보 별칭을 입력해 주세요 (예: 역세권 1층 15평, 골목 배달전문 8평)', rList[rIdx].title);
          if (nextName && nextName.trim()) {
            rList[rIdx].title = nextName.trim().slice(0, 28);
            saveTray(rList);
            renderTray();
          }
          return;
        }
        var dl = e.target.closest('[data-del-idx]');
        if (dl) {
          var list2 = loadTray();
          list2.splice(parseInt(dl.getAttribute('data-del-idx'), 10), 1);
          saveTray(list2);
          renderTray();
        }
      });

      renderTray();
    }

    readDomIntoState();
    applyQueryToState();
    recompute(null, null, true);
  }

  root.BTCalc = { mount: mount, downloadReceipt: downloadReceipt };
})(typeof self !== 'undefined' ? self : this);
