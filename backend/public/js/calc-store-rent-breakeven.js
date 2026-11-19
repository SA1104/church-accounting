/* 6. 상가 월세·환산보증금 5% 상한 판독 & 매장 손익분기점(BEP)·권리금 회수 계산기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  function recoveryCrossSvg(cum, payback) {
    var W = 560, H = 215, padL = 62, padR = 20, padT = 22, padB = 30;
    var pw = W - padL - padR, ph = H - padT - padB;
    var maxV = 1;
    cum.forEach(function (p) { maxV = Math.max(maxV, p.asIs, p.toBe); });
    var xOf = function (m) { return padL + (m / 36) * pw; };
    var yOf = function (v) { return padT + ph - (v / maxV) * ph; };
    var pTarget = cum.map(function (p, i) { return (i ? 'L' : 'M') + xOf(p.m).toFixed(1) + ',' + yOf(p.asIs).toFixed(1); }).join(' ');
    var pGain = cum.map(function (p, i) { return (i ? 'L' : 'M') + xOf(p.m).toFixed(1) + ',' + yOf(p.toBe).toFixed(1); }).join(' ');
    var crossMark = '';
    if (payback != null && payback >= 0 && payback <= 36) {
      var cx = xOf(payback), cy = yOf(cum[0].asIs);
      crossMark = '<line x1="' + cx.toFixed(1) + '" y1="' + padT + '" x2="' + cx.toFixed(1) + '" y2="' + (padT + ph) + '" stroke="#0e9f6e" stroke-dasharray="4,3"/>' +
        '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5.5" fill="#0e9f6e" stroke="#fff" stroke-width="2"/>' +
        '<text x="' + Math.min(W - 65, Math.max(padL + 45, cx)).toFixed(1) + '" y="' + Math.max(14, cy - 10).toFixed(1) + '" text-anchor="middle" font-weight="800" fill="#0e9f6e">원금회수 ' + payback.toFixed(1) + '개월</text>';
    }
    var shortLabel = maxV >= 100000000 ? (maxV / 100000000).toFixed(1) + '억' : Math.round(maxV / 10000).toLocaleString('ko-KR') + '만';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<line x1="' + padL + '" y1="' + (padT + ph) + '" x2="' + (W - padR) + '" y2="' + (padT + ph) + '" stroke="currentColor" stroke-opacity="0.2"/>' +
      '<path d="' + pTarget + '" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,3"/>' +
      '<path d="' + pGain + '" fill="none" stroke="#0e9f6e" stroke-width="2.6"/>' +
      crossMark +
      '<text x="' + padL + '" y="' + (H - 8) + '">오픈</text>' +
      '<text x="' + xOf(12).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">1년</text>' +
      '<text x="' + xOf(24).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">2년(계약만기)</text>' +
      '<text x="' + xOf(36).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="end">3년</text>' +
      '<text x="' + (padL - 6) + '" y="' + (padT + 8) + '" text-anchor="end">' + shortLabel + '</text>' +
      '<text x="' + (W - padR) + '" y="' + (padT + 12) + '" text-anchor="end" font-weight="700">🔴 초기 매몰창업비  🟢 누적 영업순익</text>' +
      '</svg>';
  }

  C.mount({
    slug: 'store-rent-breakeven',
    defaults: { region: 'seoul', deposit: 5000, rent: 300, maint: 80, labor: 450, biz: 'food', ticket: 18000, varpct: 48, days: 26, orders: 45, sunk: 8000 },
    render: function (s, h) {
      var r = E.storeLease(s);
      h.setHeroStatus(r.status);
      h.setOut('bepDailyOrders', '하루 ' + E.fmt(r.bepDailyOrders) + '건');
      h.setOut('bepDailySales', E.won(r.bepDailySales));
      h.setOut('bepMonthlySales', E.won(r.bepMonthlySales));

      h.setOut('convDep', E.manwon(r.convertedDeposit));
      h.setOut('regName', r.regionName);
      h.setOut('regCap', E.manwon(r.regionCap));
      h.setOut('capBadge', r.underCap ? '🟢 법정 5% 상한 보호' : '🔴 5% 상한 미적용(초과)');
      h.setOut('maxRent5', E.fmt(r.maxRentNext5Pct, 1) + '만원 (+' + E.fmt(r.maxRentHike5Pct, 1) + '만)');
      h.setOut('leaseNote', r.underCap
        ? '환산보증금 기준 이하이므로 재계약 시 임대료 증액 5% 상한, 10년 계약갱신요구권, 권리금 회수기회 보호, 대항력이 모두 적용됩니다.'
        : '⚠️ 기준액을 ' + E.fmt(r.overAmount) + '만원 초과했습니다! 10년 계약갱신요구권과 권리금 보호는 여전히 적용되지만, 재계약 시 5% 임대료 인상 상한 제한이 적용되지 않으므로 특약 조항을 반드시 확인하세요.');

      h.setOut('ordTxt', r.dailyOrders + '건×' + r.days + '일');
      h.setOut('expSales', E.won(r.expMonthlySales));
      h.setOut('rentRatio', E.pct(r.rentRatioPct));
      h.setOut('expProfit', E.won(r.expMonthlyProfit));
      var pbTxt = r.paybackMonths != null ? E.fmt(r.paybackMonths, 1) + '개월' : '적자 (회수불가)';
      h.setOut('payback', pbTxt);

      h.setChart('cross', recoveryCrossSvg(r.cum, r.paybackMonths));

      return {
        benchPayload: r.expMonthlySales > 0 ? { calculator: 'store-rent-breakeven', industry: s.biz || 'food', rent_ratio_pct: r.rentRatioPct } : null,
        receipt: {
          filename: 'boozathink-store-lease-bep-receipt.png',
          subtitle: '상가 환산보증금 & 손익분기 진단서',
          heroLabel: '일 손익분기점 (BEP)',
          heroValue: '하루 ' + E.fmt(r.bepDailyOrders) + '건 (' + E.won(r.bepDailySales) + ')',
          heroSub: '창업비 원금회수 ' + pbTxt + ' · 임차료율 ' + E.pct(r.rentRatioPct),
          rows: [
            ['보증금 / 월세', E.manwon(r.deposit) + ' / ' + E.manwon(r.rent)],
            ['상가 환산보증금 (보증금+월세×100)', E.manwon(r.convertedDeposit), true],
            ['법정 5% 인상상한 보호 여부', r.underCap ? '적용 (최대 ' + E.fmt(r.maxRentNext5Pct, 1) + '만)' : '초과 미적용'],
            ['월 총고정비 (임대·관리·인건비)', E.won(r.fixedKRW)],
            ['월 손익분기 매출', E.won(r.bepMonthlySales)],
            ['예상 월매출 (' + r.dailyOrders + '건×' + r.days + '일)', E.won(r.expMonthlySales)],
            ['= 예상 월 영업순이익', E.won(r.expMonthlyProfit), true],
            ['= 권리금·시설(' + E.manwon(r.sunkStartup) + ') 회수', pbTxt, true]
          ],
          noteLines: [
            r.underCap ? '⚖️ 5% 임대료 상한 · 10년 갱신요구권 모두 보호' : '⚠️ 환산보증금 초과: 10년 갱신은 적용, 5% 상한 제외 주의',
            '💡 월매출 대비 월세+관리비 비중: ' + E.pct(r.rentRatioPct) + (r.rentRatioPct <= 10 ? ' (안정)' : r.rentRatioPct <= 15 ? ' (주의)' : ' (위험)')
          ]
        }
      };
    }
  });
})();
