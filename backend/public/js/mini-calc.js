/* BoozaThink Inline 3-Second Mini Calculator Hydrator (Server Black-Box Mode) */
(function () {
  'use strict';
  var E = window.BTEngine;
  if (!E || !E.evalSim) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.querySelectorAll('[data-mini]').forEach(function (box) {
    var type = box.getAttribute('data-mini');
    if (!type) return;
    var outEl = box.querySelector('[data-mc-out]');
    var inputs = box.querySelectorAll('input[data-mc]');
    var timer = null;

    function syncLabelsAndCollect() {
      var vals = {};
      inputs.forEach(function (inp) {
        var k = inp.getAttribute('data-mc');
        var unit = inp.getAttribute('data-unit') || '';
        var v = parseFloat(inp.value);
        vals[k] = Number.isFinite(v) ? v : 0;
        var outVal = box.querySelector('[data-mc-val="' + k + '"]');
        if (outVal) outVal.textContent = E.fmt(vals[k], 2) + unit;
        if (window.BTSyncRangeFill) window.BTSyncRangeFill(inp);
      });
      return vals;
    }

    function requestEval() {
      var vals = syncLabelsAndCollect();
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        E.evalSim('mini', null, { type: type, vals: vals }).then(function (res) {
          if (!res || !res.ok || !Array.isArray(res.rows) || !outEl) return;
          outEl.innerHTML = res.rows.map(function (r) {
            return '<div class="' + (r[2] || '') + '"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
          }).join('');
        }).catch(function () {});
      }, 65);
    }

    inputs.forEach(function (inp) {
      inp.addEventListener('input', requestEval);
    });
    syncLabelsAndCollect();
  });
})();
