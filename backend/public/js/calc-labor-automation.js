/* 4. 2026 알바 주휴수당 절벽 vs 테이블오더·무인화 원금회수(Payback) 계산기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  C.mount({
    slug: 'labor-automation',
    defaults: { wage: 10320, hours: 20, staff: 2, ins: 1, biz: 'food', cut: 14.5, devices: 4, mode: 'buy', devcost: 450000, rent: 25000, subsidy: 0 },
    render: function (s, h) {
      var r = E.labor(s);
      h.setHeroStatus(r.payback != null && r.payback <= 12 ? 'safe' : (r.payback != null ? 'caution' : 'danger'));
      var pbTxt = r.payback == null ? '회수 불가' : (r.mode === 'rent' ? '즉시 (렌탈)' : E.fmt(r.payback, 1) + '개월');
      h.setOut('payback', pbTxt);
      h.setOut('save36', E.won(r.save36));
      h.setOut('c145', E.won(r.cliff.at145.total));
      h.setOut('c15', E.won(r.cliff.at15.total));
      h.setOut('jump', '+' + E.won(r.cliff.jump));
      h.setOut('jumpPct', '+' + E.pct(r.cliff.jumpPct));
      h.setOut('beforeTotal', E.won(r.before.total));
      h.setOut('afterTotal', E.won(r.after.total));
      h.setOut('laborSave', E.won(r.laborSave));
      h.setOut('initial', E.won(r.initial));
      h.setOut('monthlyDevice', E.won(r.monthlyDevice));
      h.setOut('netMonthly', E.won(r.netMonthly));

      h.setChart('cliff', h.cliffSvg(r.curve, s.hours, s.cut));
      h.setChart('cross', h.crossSvg(r.cum, r.payback));

      return {
        benchPayload: r.payback != null ? { calculator: 'labor-automation', industry: s.biz || 'food', payback_months: r.payback } : null,
        receipt: {
          filename: 'boozathink-labor-payback-receipt.png',
          subtitle: '인건비 절벽 & 무인화 원금회수 진단서',
          heroLabel: '기기 원금회수 기간 (Payback)',
          heroValue: pbTxt,
          heroSub: '3년간 총 절감효과 ' + E.won(r.save36),
          rows: [
            ['적용 시급 × 인원', E.won(r.wage) + ' × ' + r.staff + '명'],
            ['주 14.5h vs 15h 절벽(1인)', '+' + E.won(r.cliff.jump) + '/월'],
            ['현재 월 총인건비 (' + s.hours + 'h)', E.won(r.before.total * r.staff)],
            ['단축후 월 총인건비 (' + s.cut + 'h)', E.won(r.after.total * r.staff)],
            ['월 인건비 절감액', E.won(r.laborSave), true],
            ['무인기기 초기 자부담 (' + r.devices + '대)', E.won(r.initial)],
            ['무인기기 월 렌탈료', E.won(r.monthlyDevice)],
            ['= 월 순절감액', E.won(r.netMonthly), true],
            ['= 3년(36개월) 누적 순효과', E.won(r.save36), true]
          ],
          noteLines: [
            '⚡ 0.5시간 차이(14.5h→15h) 월 인건비 상승률: +' + E.pct(r.cliff.jumpPct),
            '💡 2026 최저시급 10,320원 · 사업주 4대보험 약 ' + r.insTotal.toFixed(2) + '% 반영'
          ]
        }
      };
    }
  });
})();
