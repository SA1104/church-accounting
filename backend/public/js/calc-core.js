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

  function sharedRowMeta(cols, rIdx) {
    var labels = cols.map(function (c) { return (c.rows && c.rows[rIdx] && c.rows[rIdx][0]) || ''; }).filter(Boolean);
    if (!labels.length) return { label: '항목 ' + (rIdx + 1), differs: false };
    var first = labels[0];
    var allSame = labels.every(function (l) { return l === first; });
    if (allSame) return { label: first, differs: false };
    return { label: first.replace(/\s*\([^)]*\)\s*$/, ''), differs: true };
  }

  function cellForCompare(cols, c, rIdx, meta) {
    var row = (c.rows && c.rows[rIdx]) || [];
    var val = row[1] || '-';
    if (!meta.differs || !row[0]) return val;
    var m = /\(([^)]+)\)\s*$/.exec(row[0]);
    return m ? (val + ' (' + m[1] + ')') : val;
  }

  /* ───── Multi-Candidate (2~3+ Options) Side-by-Side Comparison PNG & A4 Print Exporter ───── */
  function downloadComparisonPNG(spec) {
    // spec: { slug, pageTitle, verdictText, cols: [{ tag, title, val, heroSub, rows, isWinner }], heroLabel }
    var cols = spec.cols || [];
    if (cols.length < 2) return;
    var scale = 2;
    var labelColW = 210;
    var colW = cols.length <= 2 ? 290 : (cols.length === 3 ? 250 : 220);
    var padX = 28;
    var W = padX * 2 + labelColW + cols.length * colW;
    var maxRows = 0;
    cols.forEach(function (c) { if (c.rows && c.rows.length > maxRows) maxRows = c.rows.length; });
    var rowH = 38;
    var H = 228 + (maxRows + 1) * rowH + 84;

    var canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    var fontSans = "'Pretendard Variable', Pretendard, -apple-system, 'Malgun Gothic', sans-serif";

    // Cool ice-blue background
    ctx.fillStyle = '#e8f0fc';
    ctx.fillRect(0, 0, W, H);

    // Main architect report card
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(16, 16, W - 32, H - 32, 20);
    ctx.fill();
    ctx.stroke();

    // Royal Cobalt Header Banner
    var grad = ctx.createLinearGradient(16, 16, W - 16, 108);
    grad.addColorStop(0, '#172554');
    grad.addColorStop(1, '#2563eb');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(16, 16, W - 32, 92, [20, 20, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#6ee7b7';
    ctx.font = '800 12px ' + fontSans;
    ctx.textAlign = 'left';
    ctx.fillText('BOOZA THINK · 부자생각 의사결정 비교 판정표', padX + 8, 46);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px ' + fontSans;
    ctx.fillText(spec.pageTitle || '후보 조건 나란히 비교 리포트', padX + 8, 76, W - 220);

    var todayStr = new Date().toISOString().slice(0, 10);
    ctx.fillStyle = '#dbeafe';
    ctx.font = '600 12px ' + fontSans;
    ctx.textAlign = 'right';
    ctx.fillText('출력일 ' + todayStr + ' · boozathink.com', W - padX - 8, 46);

    // Winner Verdict Box
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(padX, 122, W - padX * 2, 46, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#065f46';
    ctx.font = '800 13.5px ' + fontSans;
    ctx.textAlign = 'left';
    ctx.fillText(spec.verdictText || '저장된 후보 조건 정밀 비교 결과입니다.', padX + 16, 150, W - padX * 2 - 32);

    // Table Header
    var tableY = 182;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(padX, tableY, W - padX * 2, 46);

    ctx.fillStyle = '#334155';
    ctx.font = '800 13px ' + fontSans;
    ctx.fillText('비교 항목', padX + 14, tableY + 28);

    cols.forEach(function (c, i) {
      var cx = padX + labelColW + i * colW;
      if (c.isWinner) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fillRect(cx, tableY, colW, 46 + (maxRows + 1) * rowH);
      }
      ctx.fillStyle = c.isWinner ? '#059669' : '#1d4ed8';
      ctx.font = '800 11.5px ' + fontSans;
      ctx.fillText((c.isWinner ? '★ 추천 · ' : '') + c.tag, cx + 12, tableY + 18, colW - 20);
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 13.5px ' + fontSans;
      ctx.fillText(c.title, cx + 12, tableY + 37, colW - 20);
    });

    // Hero Metric Row
    var curY = tableY + 46;
    ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
    ctx.fillRect(padX, curY, W - padX * 2, rowH + 6);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '800 13px ' + fontSans;
    ctx.fillText(spec.heroLabel || '핵심 진단 결과', padX + 14, curY + 26, labelColW - 20);

    cols.forEach(function (c, i) {
      var cx = padX + labelColW + i * colW;
      ctx.fillStyle = c.isWinner ? '#047857' : '#1d4ed8';
      ctx.font = '800 15px ' + fontSans;
      ctx.fillText(c.val || '-', cx + 12, curY + 26, colW - 20);
    });
    curY += rowH + 6;

    // Detail Rows
    for (var rIdx = 0; rIdx < maxRows; rIdx++) {
      if (rIdx % 2 === 1) {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.55)';
        ctx.fillRect(padX, curY, W - padX * 2, rowH);
      }
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, curY);
      ctx.lineTo(W - padX, curY);
      ctx.stroke();

      var refRow = (cols[0].rows && cols[0].rows[rIdx]) || [];
      var rMeta = sharedRowMeta(cols, rIdx);
      var isBold = Boolean(refRow[2]);
      ctx.fillStyle = isBold ? '#0f172a' : '#475569';
      ctx.font = (isBold ? '800 13px ' : '600 12.5px ') + fontSans;
      ctx.fillText(rMeta.label, padX + 14, curY + 24, labelColW - 20);

      cols.forEach(function (c, i) {
        var cx = padX + labelColW + i * colW;
        var cellTxt = cellForCompare(cols, c, rIdx, rMeta);
        ctx.fillStyle = isBold ? (c.isWinner ? '#047857' : '#1e3a8a') : '#1e293b';
        ctx.font = (isBold ? '800 13.5px ' : '600 13px ') + fontSans;
        ctx.fillText(cellTxt, cx + 12, curY + 24, colW - 20);
      });
      curY += rowH;
    }

    // Bottom Border & Footer
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(padX, curY);
    ctx.lineTo(W - padX, curY);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '600 11.5px ' + fontSans;
    ctx.textAlign = 'left';
    ctx.fillText('※ 부자생각(boozathink.com) 정밀 시뮬레이터 비교 판정표 · 세무·대출 최종 실행 전 계약서 및 전문가 확인 권장', padX, curY + 28);

    canvas.toBlob(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'boozathink-compare-' + (spec.slug || 'report') + '.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
    }, 'image/png');
  }

  function printComparisonReport(spec) {
    var cols = spec.cols || [];
    if (cols.length < 2) return;
    var sheet = document.getElementById('bt-print-compare-sheet');
    if (!sheet) {
      sheet = document.createElement('section');
      sheet.id = 'bt-print-compare-sheet';
      sheet.className = 'bt-print-sheet';
      document.body.appendChild(sheet);
    }
    var maxRows = 0;
    cols.forEach(function (c) { if (c.rows && c.rows.length > maxRows) maxRows = c.rows.length; });
    var todayStr = new Date().toISOString().slice(0, 10);

    var ths = '<th>비교 항목</th>' + cols.map(function (c) {
      return '<th class="' + (c.isWinner ? 'win-col' : '') + '"><div>' + esc((c.isWinner ? '★ 추천 · ' : '') + c.tag) + '</div><strong>' + esc(c.title) + '</strong></th>';
    }).join('');

    var trs = '<tr class="hero-tr"><th>' + esc(spec.heroLabel || '핵심 진단 결과') + '</th>' + cols.map(function (c) {
      return '<td class="' + (c.isWinner ? 'win-col' : '') + '"><strong>' + esc(c.val) + '</strong>' + (c.heroSub ? '<div class="sub">' + esc(c.heroSub) + '</div>' : '') + '</td>';
    }).join('') + '</tr>';

    for (var i = 0; i < maxRows; i++) {
      var ref = (cols[0].rows && cols[0].rows[i]) || [];
      var pMeta = sharedRowMeta(cols, i);
      var bCls = ref[2] ? ' class="bold-tr"' : '';
      trs += '<tr' + bCls + '><th>' + esc(pMeta.label) + '</th>' + cols.map(function (c) {
        var v = cellForCompare(cols, c, i, pMeta);
        return '<td class="' + (c.isWinner ? 'win-col' : '') + '">' + esc(v) + '</td>';
      }).join('') + '</tr>';
    }

    sheet.innerHTML =
      '<div class="ps-head"><div><span class="ps-kicker">BOOZA THINK · 부자생각 창업·손익 연구소</span><h1>' + esc(spec.pageTitle || '후보 조건 비교 판정표') + '</h1></div><div class="ps-date">출력일: ' + todayStr + '<br>https://boozathink.com</div></div>' +
      '<div class="ps-verdict">' + esc(spec.verdictText || '') + '</div>' +
      '<table class="ps-table"><thead><tr>' + ths + '</tr></thead><tbody>' + trs + '</tbody></table>' +
      '<p class="ps-foot">※ 본 비교표는 부자생각(boozathink.com) 실전 시뮬레이터로 산출된 의사결정 참고 자료입니다. 실제 계약·세무·대출 실행 전 현장 조건을 최종 확인하시기 바랍니다.</p>';

    document.body.classList.add('bt-printing-compare');
    setTimeout(function () {
      window.print();
      setTimeout(function () { document.body.classList.remove('bt-printing-compare'); }, 400);
    }, 60);
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

    var refreshWorkbench = function () {};

    function runRenderWithServerData(srvData, fromInit) {
      lastResult = config.render(state, helpers, srvData) || {};
      if (!fromInit) syncUrl();
      if (lastResult.benchPayload) scheduleBench(lastResult.benchPayload);
      refreshWorkbench();
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

    // 5. 사장님 의사결정 워크벤치 — 후보 A·B·C 저장 · 불러와 다시 설정 비교 · 비교 판정표 PNG/A4 뽑기
    var actBox = rootEl.querySelector('.calc-actions');
    var calcOutEl = rootEl.querySelector('.calc-out');
    var heroCardEl = calcOutEl && calcOutEl.querySelector('.result-hero');
    var TRAY_KEY = 'bt-cmp-v2-' + config.slug;
    var baselineIdx = 0;
    var editingSlotIdx = -1;

    function loadSlots() {
      try {
        var arr = JSON.parse(localStorage.getItem(TRAY_KEY) || '[]');
        return Array.isArray(arr) ? arr.slice(0, 5) : [];
      } catch (e) { return []; }
    }
    function saveSlots(arr) {
      try { localStorage.setItem(TRAY_KEY, JSON.stringify(arr.slice(0, 5))); } catch (e) {}
    }

    function stateSignature(obj) {
      var keys = Object.keys(initialDefaults).sort();
      return keys.map(function (k) { return k + '=' + String(obj && obj[k] != null ? obj[k] : initialDefaults[k]); }).join('&');
    }

    function fmtCmpVal(val, unit) {
      if (val == null || !Number.isFinite(Number(val))) return '-';
      if (unit === '원') return E.won(val);
      if (unit === '만원') return E.manwon(val);
      if (unit === '%') return E.pct(val, 1);
      return E.fmt(val, 1) + unit;
    }

    function fmtDeltaBadge(mNow, mBase) {
      if (!mNow || !mBase || mNow.val == null || mBase.val == null) return '';
      var diff = Number(mNow.val) - Number(mBase.val);
      if (Math.abs(diff) < 0.05) {
        return '<span class="wb-delta same">' + esc(mNow.label) + ': 변동 없음</span>';
      }
      var good = mNow.higherIsBetter ? (diff > 0) : (diff < 0);
      var sign = diff > 0 ? '+' : '−';
      var absVal = Math.abs(diff);
      var dTxt = mNow.unit === '원'
        ? (sign + E.fmt(Math.round(absVal)) + '원')
        : (mNow.unit === '만원'
          ? (sign + E.fmt(Math.round(absVal)) + '만원')
          : (sign + E.fmt(absVal, 1) + mNow.unit));
      var arrow = diff > 0 ? '▲' : '▼';
      var judge = good ? (mNow.higherIsBetter ? '증가(유리)' : '절감·단축(유리)') : (mNow.higherIsBetter ? '감소(불리)' : '증가(부담)');
      return '<span class="wb-delta ' + (good ? 'good' : 'bad') + '"><strong>' + esc(mNow.label) + '</strong> ' +
        esc(fmtCmpVal(mBase.val, mBase.unit)) + ' → <strong>' + esc(fmtCmpVal(mNow.val, mNow.unit)) + '</strong> (' + esc(dTxt) + ' ' + arrow + ' ' + judge + ')</span>';
    }

    function buildCurrentSnapshot(customTitle) {
      var rec = (lastResult && lastResult.receipt) || {};
      var cmp = (lastResult && lastResult.compare) || {};
      var fallbackTitle = cmp.defaultTitle || (rec.subtitle || config.slug).replace(/^.*진단\s*·\s*/, '').slice(0, 28);
      return {
        title: (customTitle && customTitle.trim()) ? customTitle.trim().slice(0, 30) : fallbackTitle,
        heroLabel: rec.heroLabel || '핵심 진단 결과',
        val: rec.heroValue || '-',
        heroSub: rec.heroSub || '',
        rows: Array.isArray(rec.rows) ? rec.rows.slice(0, 10) : [],
        compare: cmp,
        snap: Object.assign({}, state),
        sig: stateSignature(state),
        q: buildQueryString(),
        t: Date.now()
      };
    }

    function computeComparisonBundle(slots, curSnap) {
      var cols = slots.map(function (it, i) {
        return {
          idx: i,
          isSaved: true,
          tag: String.fromCharCode(65 + i) + '안',
          title: it.title,
          val: it.val,
          heroSub: it.heroSub,
          rows: it.rows || [],
          compare: it.compare || {},
          sig: it.sig || stateSignature(it.snap || {})
        };
      });

      var matchesAnySaved = cols.some(function (c) { return c.sig === curSnap.sig; });
      if (cols.length >= 1 && !matchesAnySaved && curSnap.rows.length > 0 && cols.length < 4) {
        cols.push({
          idx: -1,
          isSaved: false,
          tag: '지금 설정한 조건',
          title: curSnap.title + ' (미저장)',
          val: curSnap.val,
          heroSub: curSnap.heroSub,
          rows: curSnap.rows,
          compare: curSnap.compare || {},
          sig: curSnap.sig
        });
      }

      if (cols.length < 2) return { cols: cols, verdictText: '', heroLabel: curSnap.heroLabel };

      // Determine #1 Winner based on primary metric
      var bestIdx = -1;
      var secondIdx = -1;
      cols.forEach(function (c, idx) {
        var m0 = c.compare && c.compare.metrics && c.compare.metrics[0];
        if (!m0 || m0.val == null || !Number.isFinite(Number(m0.val))) return;
        if (bestIdx === -1) { bestIdx = idx; return; }
        var b0 = cols[bestIdx].compare.metrics[0];
        var better = m0.higherIsBetter ? (Number(m0.val) > Number(b0.val)) : (Number(m0.val) < Number(b0.val));
        if (better) {
          secondIdx = bestIdx;
          bestIdx = idx;
        } else if (secondIdx === -1) {
          secondIdx = idx;
        } else {
          var s0 = cols[secondIdx].compare.metrics[0];
          var better2 = m0.higherIsBetter ? (Number(m0.val) > Number(s0.val)) : (Number(m0.val) < Number(s0.val));
          if (better2) secondIdx = idx;
        }
      });

      var verdictText = '';
      if (bestIdx >= 0) {
        cols[bestIdx].isWinner = true;
        var winCol = cols[bestIdx];
        var wm = winCol.compare.metrics[0];
        if (secondIdx >= 0 && cols[secondIdx].compare && cols[secondIdx].compare.metrics && cols[secondIdx].compare.metrics[0]) {
          var rm = cols[secondIdx].compare.metrics[0];
          var gap = Math.abs(Number(wm.val) - Number(rm.val));
          if (gap < 0.05) {
            verdictText = '판정 요약: [' + winCol.tag + ' · ' + winCol.title + ']과 [' + cols[secondIdx].tag + ']의 ' + wm.label + '이 동일합니다. 초기 투자금·고정비 부담이 적은 쪽을 선택하세요.';
          } else {
            var gapTxt = fmtCmpVal(gap, wm.unit);
            verdictText = '최종 유리 판정: [' + winCol.tag + ' · ' + winCol.title + ']이 2순위(' + cols[secondIdx].tag + ')보다 ' + wm.label + ' 기준 ' + gapTxt + (wm.higherIsBetter ? ' 더 높게' : ' 더 유리하게') + ' 나타났습니다.';
          }
        } else {
          verdictText = '최종 유리 판정: 현재 비교 후보 중 [' + winCol.tag + ' · ' + winCol.title + '] 조건이 가장 유리합니다.';
        }
      }

      var h1El = document.querySelector('.page-head h1');
      return {
        slug: config.slug,
        pageTitle: h1El ? h1El.textContent.trim() : '후보 조건 비교 판정표',
        heroLabel: (cols[0] && cols[0].heroLabel) || curSnap.heroLabel || '핵심 진단 결과',
        verdictText: verdictText,
        cols: cols
      };
    }

    if (calcOutEl && !calcOutEl._wbWired) {
      calcOutEl._wbWired = true;

      var wbCard = document.createElement('div');
      wbCard.className = 'card wb-card';
      wbCard.setAttribute('data-compare-workbench', '');
      wbCard.innerHTML =
        '<div class="wb-head">' +
          '<div><span class="pill wb-pill">2~3안 후보 비교 · 뽑아보기</span><h2 class="card-h" style="margin:6px 0 2px">고민 중인 후보 조건 저장 &amp; 불러와서 다시 비교</h2>' +
          '<p class="wb-desc">후보 A·B·C안을 저장해 두거나, 저장한 안을 <strong>[불러와서 수정·비교]</strong>로 불러와 숫자를 바꿔보시면 전·후 차이가 실시간 계산되며 한 장의 비교표(이미지·인쇄)로 뽑으실 수 있습니다.</p></div>' +
        '</div>' +
        '<div class="wb-save-bar">' +
          '<input type="text" class="wb-name-input" data-wb-name maxlength="30" placeholder="후보 이름 입력 (예: 역세권 15평, 배달전문 8평 — 비워두면 자동 이름)">' +
          '<button type="button" class="btn btn-primary" data-wb-save>+ 현재 조건 A안으로 저장</button>' +
        '</div>' +
        '<div class="wb-body" data-wb-body></div>';

      if (heroCardEl) heroCardEl.insertAdjacentElement('afterend', wbCard);
      else calcOutEl.insertBefore(wbCard, calcOutEl.firstChild);

      var nameInp = wbCard.querySelector('[data-wb-name]');
      var saveMainBtn = wbCard.querySelector('[data-wb-save]');
      var wbBody = wbCard.querySelector('[data-wb-body]');

      if (actBox) {
        var jumpBtn = document.createElement('button');
        jumpBtn.type = 'button';
        jumpBtn.className = 'btn';
        jumpBtn.textContent = '후보 저장 · 2~3안 비교표 뽑기 ↑';
        jumpBtn.addEventListener('click', function () {
          wbCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (nameInp) nameInp.focus();
        });
        if (resetBtn) actBox.insertBefore(jumpBtn, resetBtn);
        else actBox.appendChild(jumpBtn);

        var reqNudge = document.createElement('p');
        reqNudge.className = 'req-nudge';
        reqNudge.innerHTML = '찾으시는 업종이나 계산 방식이 없나요? <a href="/requests">필요한 계산기 신청 · 투표하기 →</a>';
        actBox.insertAdjacentElement('afterend', reqNudge);
      }

      function addCurrentAsCandidate(customLabel) {
        var slots = loadSlots();
        if (slots.length >= 5) {
          showToast('후보는 최대 5개(A~E안)까지 저장할 수 있습니다. 기존 안을 삭제하거나 덮어써 주세요.');
          return;
        }
        var snapObj = buildCurrentSnapshot(customLabel != null ? customLabel : (nameInp ? nameInp.value : ''));
        slots.push(snapObj);
        baselineIdx = slots.length - 1;
        saveSlots(slots);
        if (nameInp) nameInp.value = '';
        if (root.BTTrack) root.BTTrack('save_scenario', { calculator: config.slug, count: slots.length });
        var tag = String.fromCharCode(64 + slots.length) + '안';
        refreshWorkbench();
        showToast('‘' + tag + ' · ' + snapObj.title + '’이 저장되었습니다! 이제 다른 조건으로 바꿔 실시간 비교해 보세요.');
      }

      saveMainBtn.addEventListener('click', function () {
        addCurrentAsCandidate();
      });
      nameInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCurrentAsCandidate();
        }
      });

      refreshWorkbench = function () {
        if (!lastResult || !lastResult.receipt) return;
        var slots = loadSlots();
        if (baselineIdx >= slots.length) baselineIdx = Math.max(0, slots.length - 1);
        var curSnap = buildCurrentSnapshot('');
        var nextLetter = String.fromCharCode(65 + Math.min(4, slots.length));
        saveMainBtn.textContent = slots.length >= 5 ? '최대 5개 저장됨' : ('+ 현재 조건 ' + nextLetter + '안으로 저장');
        if (nameInp && document.activeElement !== nameInp && !nameInp.value) {
          nameInp.placeholder = '별칭 입력 (비워두면 ‘' + curSnap.title + '’ 자동 저장)';
        }

        if (!slots.length) {
          wbBody.innerHTML = '<div class="wb-empty">아직 저장된 후보가 없습니다. 위 <strong>[+ 현재 조건 A안으로 저장]</strong>을 눌러 첫 번째 기준안을 먼저 만들어 보세요.</div>';
          return;
        }

        // 1) Saved Candidate Cards (A안, B안, C안...)
        var slotsHtml = '<div class="wb-slots">' + slots.map(function (it, idx) {
          var tag = String.fromCharCode(65 + idx) + '안';
          var isBase = idx === baselineIdx;
          var isSameNow = (it.sig || stateSignature(it.snap || {})) === curSnap.sig;
          if (editingSlotIdx === idx) {
            return '<div class="wb-slot' + (isBase ? ' active-base' : '') + '">' +
              '<div class="wb-slot-top"><span class="cmp-badge">' + tag + ' 이름 변경</span></div>' +
              '<div class="wb-edit-row">' +
                '<input type="text" class="wb-inline-inp" data-wb-edit-inp="' + idx + '" value="' + esc(it.title) + '" maxlength="30">' +
                '<button type="button" class="btn-xs" data-wb-edit-ok="' + idx + '">확인</button>' +
              '</div></div>';
          }
          return '<div class="wb-slot' + (isBase ? ' active-base' : '') + '">' +
            '<div class="wb-slot-top">' +
              '<span class="cmp-badge">' + tag + (isBase ? ' · 현재 기준안' : '') + (isSameNow ? ' (현재 화면과 동일)' : '') + '</span>' +
              '<button type="button" class="saved-del" title="후보 삭제" aria-label="후보 삭제" data-wb-del="' + idx + '">×</button>' +
            '</div>' +
            '<div class="wb-slot-title">' + esc(it.title) + '</div>' +
            '<div class="wb-slot-val tnum">' + esc(it.val) + '</div>' +
            '<div class="wb-slot-btns">' +
              '<button type="button" class="btn-xs wb-btn-load" data-wb-load="' + idx + '">불러와서 수정·비교</button>' +
              '<button type="button" class="btn-xs" data-wb-overwrite="' + idx + '">현재값 덮어쓰기</button>' +
              '<button type="button" class="btn-xs" data-wb-edit="' + idx + '">이름변경</button>' +
            '</div>' +
          '</div>';
        }).join('') + '</div>';

        // 2) Live Baseline <-> Current Tweaked Condition Delta Strip
        var baseSlot = slots[baselineIdx] || slots[0];
        var baseTag = String.fromCharCode(65 + baselineIdx) + '안';
        var baseSig = baseSlot.sig || stateSignature(baseSlot.snap || {});
        var liveDeltaHtml = '';
        if (baseSig !== curSnap.sig && baseSlot.compare && curSnap.compare) {
          var mBaseArr = baseSlot.compare.metrics || [];
          var mCurArr = curSnap.compare.metrics || [];
          var badges = mCurArr.map(function (mc, mi) { return fmtDeltaBadge(mc, mBaseArr[mi]); }).filter(Boolean).join('');
          liveDeltaHtml = '<div class="wb-live-delta">' +
            '<div class="wb-live-head">' +
              '<strong>저장한 기준 [' + baseTag + ' · ' + esc(baseSlot.title) + '] ↔ 지금 다시 설정한 조건 실시간 비교</strong>' +
              '<div class="wb-live-actions">' +
                (slots.length < 5 ? '<button type="button" class="btn-xs wb-btn-save-new" data-wb-save-quick>+ 지금 조건을 ' + nextLetter + '안으로 추가 저장</button>' : '') +
                '<button type="button" class="btn-xs" data-wb-revert="' + baselineIdx + '">원래 ' + baseTag + ' 값으로 되돌리기</button>' +
              '</div>' +
            '</div>' +
            '<div class="wb-delta-list tnum">' + badges + '</div>' +
          '</div>';
        } else {
          liveDeltaHtml = '<p class="tray-hint">이제 왼쪽 입력칸에서 다른 평수·월세·가격·업종으로 조금씩 바꿔보세요! 저장해 둔 <strong>[' + baseTag + ' · ' + esc(baseSlot.title) + ']</strong> 대비 무엇이 얼마나 유리해지는지 실시간으로 비교됩니다.</p>';
        }

        // 3) 2~3+ Options Side-by-Side Comparison Matrix + Export Buttons
        var bundle = computeComparisonBundle(slots, curSnap);
        var matrixHtml = '';
        if (bundle.cols.length >= 2) {
          var cols = bundle.cols;
          var maxRows = 0;
          cols.forEach(function (c) { if (c.rows.length > maxRows) maxRows = c.rows.length; });

          var ths = '<th>비교 항목</th>' + cols.map(function (c) {
            return '<th class="' + (c.isWinner ? 'wb-win-col' : '') + '">' +
              '<span class="cmp-badge' + (c.isWinner ? ' win' : '') + (c.isSaved ? '' : ' draft') + '">' +
              (c.isWinner ? '★ 추천 1순위 · ' : '') + esc(c.tag) + '</span><br>' + esc(c.title) + '</th>';
          }).join('');

          var heroTr = '<tr class="cmp-hero-row"><th>' + esc(bundle.heroLabel) + '</th>' + cols.map(function (c) {
            return '<td class="' + (c.isWinner ? 'wb-win-col' : '') + '"><strong class="tnum">' + esc(c.val) + '</strong>' +
              (c.heroSub ? '<span class="cmp-sub">' + esc(c.heroSub) + '</span>' : '') + '</td>';
          }).join('') + '</tr>';

          var bodyTrs = '';
          for (var rIdx = 0; rIdx < maxRows; rIdx++) {
            var refRow = (cols[0].rows && cols[0].rows[rIdx]) || [];
            var mMeta = sharedRowMeta(cols, rIdx);
            var isBold = Boolean(refRow[2]);
            bodyTrs += '<tr' + (isBold ? ' class="cmp-bold-row"' : '') + '><th>' + esc(mMeta.label) + '</th>' +
              cols.map(function (c) {
                var cell = cellForCompare(cols, c, rIdx, mMeta);
                return '<td class="tnum' + (c.isWinner ? ' wb-win-col' : '') + '">' + esc(cell) + '</td>';
              }).join('') + '</tr>';
          }

          matrixHtml = '<div class="tray-compare-wrap">' +
            (bundle.verdictText ? '<div class="wb-verdict-box">' + esc(bundle.verdictText) + '</div>' : '') +
            '<div class="wb-export-bar">' +
              '<strong>' + cols.length + '가지 후보 나란히 정밀 비교표</strong>' +
              '<div class="wb-export-btns">' +
                '<button type="button" class="btn btn-primary btn-sm" data-wb-export-png>비교 판정표 이미지 뽑기 (PNG)</button>' +
                '<button type="button" class="btn btn-sm" data-wb-export-print>A4 인쇄 / PDF로 뽑기</button>' +
                '<button type="button" class="btn btn-ghost btn-sm" data-wb-clear-all>전체 비우기</button>' +
              '</div>' +
            '</div>' +
            '<div class="table-scroll"><table class="rate-board tray-compare-table"><thead><tr>' + ths + '</tr></thead><tbody>' +
            heroTr + bodyTrs + '</tbody></table></div>' +
          '</div>';
        }

        wbBody.innerHTML = slotsHtml + liveDeltaHtml + matrixHtml;
      };

      wbBody.addEventListener('click', function (e) {
        var loadBtn = e.target.closest('[data-wb-load]');
        var revertBtn = e.target.closest('[data-wb-revert]');
        if (loadBtn || revertBtn) {
          var idx = parseInt((loadBtn || revertBtn).getAttribute(loadBtn ? 'data-wb-load' : 'data-wb-revert'), 10);
          var slots = loadSlots();
          var target = slots[idx];
          if (!target) return;
          baselineIdx = idx;
          if (target.snap) {
            Object.assign(state, initialDefaults, target.snap);
          } else {
            var nextUrl = window.location.pathname + (target.q ? '?' + target.q : '');
            window.history.replaceState(null, '', nextUrl);
            Object.assign(state, initialDefaults);
            applyQueryToState();
          }
          recompute('__restore__', null, false);
          showToast('‘' + String.fromCharCode(65 + idx) + '안 · ' + target.title + '’을 불러왔습니다. 이제 조건을 바꿔 실시간 비교해 보세요!');
          return;
        }

        var quickSave = e.target.closest('[data-wb-save-quick]');
        if (quickSave) {
          addCurrentAsCandidate();
          return;
        }

        var owBtn = e.target.closest('[data-wb-overwrite]');
        if (owBtn) {
          var oIdx = parseInt(owBtn.getAttribute('data-wb-overwrite'), 10);
          var oSlots = loadSlots();
          if (!oSlots[oIdx]) return;
          var updated = buildCurrentSnapshot(oSlots[oIdx].title);
          oSlots[oIdx] = updated;
          baselineIdx = oIdx;
          saveSlots(oSlots);
          refreshWorkbench();
          showToast('‘' + String.fromCharCode(65 + oIdx) + '안 · ' + updated.title + '’ 조건을 현재 화면 숫자로 업데이트했습니다.');
          return;
        }

        var edBtn = e.target.closest('[data-wb-edit]');
        if (edBtn) {
          editingSlotIdx = parseInt(edBtn.getAttribute('data-wb-edit'), 10);
          refreshWorkbench();
          var inp = wbBody.querySelector('[data-wb-edit-inp="' + editingSlotIdx + '"]');
          if (inp) { inp.focus(); inp.select(); }
          return;
        }

        var okBtn = e.target.closest('[data-wb-edit-ok]');
        if (okBtn) {
          var eIdx = parseInt(okBtn.getAttribute('data-wb-edit-ok'), 10);
          var inpEl = wbBody.querySelector('[data-wb-edit-inp="' + eIdx + '"]');
          var eSlots = loadSlots();
          if (eSlots[eIdx] && inpEl && inpEl.value.trim()) {
            eSlots[eIdx].title = inpEl.value.trim().slice(0, 30);
            saveSlots(eSlots);
          }
          editingSlotIdx = -1;
          refreshWorkbench();
          return;
        }

        var delBtn = e.target.closest('[data-wb-del]');
        if (delBtn) {
          var dIdx = parseInt(delBtn.getAttribute('data-wb-del'), 10);
          var dSlots = loadSlots();
          dSlots.splice(dIdx, 1);
          if (baselineIdx >= dSlots.length) baselineIdx = Math.max(0, dSlots.length - 1);
          saveSlots(dSlots);
          refreshWorkbench();
          return;
        }

        if (e.target.closest('[data-wb-export-png]')) {
          var bPng = computeComparisonBundle(loadSlots(), buildCurrentSnapshot(''));
          if (root.BTTrack) root.BTTrack('download_compare_png', { calculator: config.slug, cols: bPng.cols.length });
          downloadComparisonPNG(bPng);
          showToast('후보 비교 판정표 PNG 이미지를 저장했습니다!');
          return;
        }

        if (e.target.closest('[data-wb-export-print]')) {
          var bPrt = computeComparisonBundle(loadSlots(), buildCurrentSnapshot(''));
          if (root.BTTrack) root.BTTrack('print_compare_pdf', { calculator: config.slug, cols: bPrt.cols.length });
          printComparisonReport(bPrt);
          return;
        }

        if (e.target.closest('[data-wb-clear-all]')) {
          saveSlots([]);
          baselineIdx = 0;
          refreshWorkbench();
          showToast('저장된 비교 후보를 모두 비웠습니다.');
        }
      });

      wbBody.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.hasAttribute('data-wb-edit-inp')) {
          e.preventDefault();
          var eIdx = parseInt(e.target.getAttribute('data-wb-edit-inp'), 10);
          var ok = wbBody.querySelector('[data-wb-edit-ok="' + eIdx + '"]');
          if (ok) ok.click();
        }
      });
    }

    readDomIntoState();
    applyQueryToState();
    recompute(null, null, true);
  }

  root.BTCalc = { mount: mount, downloadReceipt: downloadReceipt, downloadComparisonPNG: downloadComparisonPNG };
})(typeof self !== 'undefined' ? self : this);
