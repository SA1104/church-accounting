/* BoozaThink Global UI — Theme, Navigation, Slider Track Fill */
(function () {
  'use strict';

  function syncRangeFill(el) {
    if (!el || el.type !== 'range') return;
    var min = parseFloat(el.min) || 0;
    var max = parseFloat(el.max) || 100;
    var val = parseFloat(el.value);
    if (!Number.isFinite(val)) val = min;
    var pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
    el.style.setProperty('--p', pct.toFixed(1) + '%');
  }

  window.BTSyncRangeFill = syncRangeFill;

  function initRanges(root) {
    (root || document).querySelectorAll('input[type="range"]').forEach(syncRangeFill);
  }

  document.addEventListener('input', function (e) {
    if (e.target && e.target.type === 'range') syncRangeFill(e.target);
  });

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('bt-theme', next); } catch (e) {}
    });
  }

  // Mobile menu toggle
  var menuBtn = document.getElementById('menu-toggle');
  var nav = document.getElementById('gnb-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? '✕' : '☰';
    });
  }

  // Calculator dropdown toggle
  document.querySelectorAll('.has-dd').forEach(function (li) {
    var btn = li.querySelector('.dd-btn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.addEventListener('click', function (e) {
    document.querySelectorAll('.has-dd.open').forEach(function (li) {
      if (!li.contains(e.target)) {
        li.classList.remove('open');
        var b = li.querySelector('.dd-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.has-dd.open').forEach(function (li) {
        li.classList.remove('open');
        var b = li.querySelector('.dd-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = '☰'; }
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initRanges(document); });
  } else {
    initRanges(document);
  }
})();
