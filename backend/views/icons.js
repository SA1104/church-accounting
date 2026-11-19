'use strict';
/**
 * BoozaThink Custom Monoline Vector Icon System (Zero AI-Emoji Aesthetic)
 * - 1.75px clean stroke icons inspired by Stripe / Linear / Toss Business
 */
const PATHS = {
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="15.5,8.5 13.5,13.5 8.5,15.5 10.5,10.5"/>',
  delivery: '<path d="M3 7h9v7H3z"/><path d="M12 10h4l3 3v3h-7z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  parcel: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/><path d="M16 5.25l-8 4.5"/>',
  bank: '<path d="M3 9l9-6 9 6H3z"/><path d="M5 9v8M9.5 9v8M14.5 9v8M19 9v8"/><path d="M3 20h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  tax: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
  chart: '<path d="M4 19h16"/><path d="M7 15v-4M12 15V7M17 15v-6"/>',
  mapPin: '<path d="M12 21s-7-5.8-7-11a7 7 0 1 1 14 0c0 5.2-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.6 0l2.8-2.8a4 4 0 0 0-5.6-5.6L11.4 7"/><path d="M14 10a4 4 0 0 0-5.6 0L5.6 12.8a4 4 0 0 0 5.6 5.6L12.6 17"/>',
  receipt: '<path d="M5 3h14v18l-2.3-1.6L14.3 21 12 19.4 9.7 21l-2.4-1.6L5 21V3z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8M4 12h16"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  layers: '<polygon points="12,3 21,8 12,13 3,8"/><polyline points="3,13 12,18 21,13"/><polyline points="3,17.5 12,22.5 21,17.5"/>',
  trendUp: '<polyline points="21,7 13,15 9,11 3,17"/><polyline points="15,7 21,7 21,13"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.8-5"/>',
  alert: '<path d="M12 4l9 16H3L12 4z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5v-17z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>'
};

function icon(name, size, cls) {
  const s = size || 20;
  const inner = PATHS[name] || PATHS.compass;
  return `<svg class="ico${cls ? ' ' + cls : ''}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

module.exports = { icon, PATHS };
