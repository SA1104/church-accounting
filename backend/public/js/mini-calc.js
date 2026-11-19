/* BoozaThink Inline 3-Second Mini Calculator Hydrator */
(function () {
  'use strict';
  var E = window.BTEngine;
  if (!E) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  document.querySelectorAll('[data-mini]').forEach(function (box) {
    var type = box.getAttribute('data-mini');
    var def = E.MINI[type];
    if (!def) return;
    var outEl = box.querySelector('[data-mc-out]');
    var inputs = box.querySelectorAll('input[data-mc]');

    function update() {
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
      var rows = E.mini(type, vals);
      if (outEl) {
        outEl.innerHTML = rows.map(function (r) {
          return '<div class="' + (r[2] || '') + '"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
        }).join('');
      }
    }

    inputs.forEach(function (inp) {
      inp.addEventListener('input', update);
    });
    update();
  });
})();
