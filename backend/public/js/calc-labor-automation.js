/* 4. 알바 주휴수당 절벽 vs 테이블오더·무인화 원금회수(Payback) 계산기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  var YEAR_NOTES = {
    '2026': '현행 적용분: 최저시급 10,320원, 국민연금 9.5%(사업주 4.75%), 건강보험 7.19% → 사업주 4대보험 약 10.87%',
    '2027': '고용노동부 고시 제2026-60호(2027.1.1 시행 확정분): 최저시급 10,700원(+3.7%), 국민연금 10%(사업주 5.0%), 장기요양 13.90% → 사업주 4대보험 약 11.15%'
  };

  var BIZ_PRESETS = {
    food: { devices: 6, devcost: 450000, rent: 24000 },
    cafe: { devices: 1, devcost: 2400000, rent: 55000 },
    retail: { devices: 1, devcost: 2800000, rent: 65000 },
    service: { devices: 1, devcost: 1800000, rent: 45000 }
  };

  var defYear = new Date().getFullYear() >= 2027 ? '2027' : '2026';
  var defWage = defYear === '2027' ? 10700 : 10320;

  C.mount({
    slug: 'labor-automation',
    defaults: { year: defYear, wage: defWage, hours: 20, staff: 2, ins: 1, biz: 'food', cut: 14.5, devices: 4, mode: 'buy', devcost: 450000, rent: 25000, subsidy: 0 },
    onBeforeCalc: function (s, changedKey, h) {
      if (changedKey === 'year') {
        if (String(s.year) === '2027' && s.wage < 10700) s.wage = 10700;
        if (String(s.year) === '2026' && s.wage === 10700) s.wage = 10320;
      }
      if (changedKey === 'biz' && BIZ_PRESETS[s.biz]) {
        s.devices = BIZ_PRESETS[s.biz].devices;
        s.devcost = BIZ_PRESETS[s.biz].devcost;
        s.rent = BIZ_PRESETS[s.biz].rent;
      }
      var yNote = h.rootEl.querySelector('[data-year-note]');
      if (yNote && YEAR_NOTES[String(s.year)]) yNote.textContent = YEAR_NOTES[String(s.year)];
    },
    render: function (s, h, srv) {
      if (!srv || !srv.r) return {};
      var r = srv.r;
      h.setHeroStatus(r.payback != null && r.payback <= 12 ? 'safe' : (r.payback != null ? 'caution' : 'danger'));
      var pbTxt = r.payback == null ? '회수 불가' : (r.mode === 'rent' ? '즉시 (렌탈)' : E.fmt(r.payback, 1) + '개월');
      h.setOut('payback', pbTxt);
      h.setOut('save36', E.won(r.save36));
      h.setOut('yearBadge', r.year + '년 고시 기준');
      h.setOut('curHoursTxt', s.hours + '시간');
      h.setOut('staffTxt', s.staff + '명');
      h.setOut('hikeMonthly', '+' + E.won(r.hike2027Monthly));
      h.setOut('hikeAnnual', '+' + E.won(r.hike2027Annual));
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
          subtitle: '인건비 절벽 & 무인화 진단 (' + r.year + '년 고시 기준)',
          heroLabel: '기기 원금회수 기간 (Payback)',
          heroValue: pbTxt,
          heroSub: '3년간 총 절감효과 ' + E.won(r.save36),
          rows: [
            ['적용 고시·시급 × 인원', r.year + '년 ' + E.won(r.wage) + ' × ' + r.staff + '명'],
            ['주 14.5h vs 15h 절벽(1인)', '+' + E.won(r.cliff.jump) + '/월'],
            ['현재 월 총인건비 (' + s.hours + 'h)', E.won(r.before.total * r.staff)],
            ['단축후 월 총인건비 (' + s.cut + 'h)', E.won(r.after.total * r.staff)],
            ['월 인건비 절감액', E.won(r.laborSave), true],
            ['무인기기 초기 자부담 (' + r.devices + '대)', E.won(r.initial)],
            ['차기 고시 전환 시 추가부담', '+' + E.won(r.hike2027Monthly) + '/월'],
            ['= 월 순절감액', E.won(r.netMonthly), true],
            ['= 3년(36개월) 누적 순효과', E.won(r.save36), true]
          ],
          noteLines: [
            '0.5시간 차이(14.5h→15h) 월 인건비 상승률: +' + E.pct(r.cliff.jumpPct),
            r.year + '년 고시 사업주 4대보험 약 ' + r.insTotal.toFixed(2) + '% 반영'
          ]
        }
      };
    }
  });
})();
