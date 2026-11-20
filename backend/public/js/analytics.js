/* BoozaThink Lightweight Privacy-First Analytics Beacon (PV · UV · Active Dwell Time · Scroll Depth · Viral Actions + GA4 Bridge) */
(function (root) {
  'use strict';

  var p = window.location.pathname || '/';
  if (p.indexOf('/admin') === 0) return;

  var vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
  var activeMs = 0;
  var lastVisibleAt = document.visibilityState === 'visible' ? Date.now() : 0;
  var maxScroll = 0;
  var sentEnter = false;

  function calcScrollPct() {
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop || 0;
    var winH = window.innerHeight || doc.clientHeight || 1;
    var fullH = Math.max(doc.scrollHeight || 1, winH);
    if (fullH <= winH + 40) return 100;
    return Math.min(100, Math.max(0, Math.round(((scrollTop + winH) / fullH) * 100)));
  }

  function flushActiveTime() {
    if (lastVisibleAt > 0) {
      activeMs += Math.max(0, Date.now() - lastVisibleAt);
      lastVisibleAt = document.visibilityState === 'visible' ? Date.now() : 0;
    }
  }

  function send(payload, useBeacon) {
    var body = JSON.stringify(payload);
    try {
      if (useBeacon && navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/biz/collect', blob);
        return;
      }
      fetch('/api/biz/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // 1. Page enter (captures UTM source & campaign for accurate channel attribution even in mobile in-app webviews)
  function trackEnter() {
    if (sentEnter) return;
    sentEnter = true;
    maxScroll = Math.max(maxScroll, calcScrollPct());
    var utmSource = '', utmCampaign = '';
    try {
      var sp = new URLSearchParams(window.location.search || '');
      utmSource = sp.get('utm_source') || '';
      utmCampaign = sp.get('utm_campaign') || '';
    } catch (e) {}
    send({
      mode: 'enter',
      vid: vid,
      path: p,
      ref: document.referrer || '',
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      scroll: maxScroll,
      dwell: 0
    }, false);
  }

  // 2. Scroll depth tracking (throttled)
  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    setTimeout(function () {
      maxScroll = Math.max(maxScroll, calcScrollPct());
      scrollTick = false;
    }, 250);
  }, { passive: true });

  // 3. Active tab dwell tracking + exit beacon
  function sendLeave() {
    flushActiveTime();
    var dwellSec = Math.min(1800, Math.round(activeMs / 1000));
    maxScroll = Math.max(maxScroll, calcScrollPct());
    if (dwellSec < 1 && maxScroll <= 0) return;
    send({
      mode: 'leave',
      vid: vid,
      path: p,
      dwell: dwellSec,
      scroll: maxScroll
    }, true);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      sendLeave();
      lastVisibleAt = 0;
    } else {
      lastVisibleAt = Date.now();
    }
  });

  window.addEventListener('pagehide', sendLeave);

  // 4. Custom viral action helper (also forwards to Google Analytics 4 if active)
  root.BTTrack = function (eventName, extra) {
    send({
      mode: 'action',
      event: eventName,
      path: p,
      ref: document.referrer || ''
    }, true);
    if (typeof root.gtag === 'function') {
      try { root.gtag('event', eventName, Object.assign({ page_path: p }, extra || {})); } catch (e) {}
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackEnter);
  } else {
    trackEnter();
  }
})(typeof self !== 'undefined' ? self : this);
