/* 창업 풀코스 A-to-Z & 12개월 계절 손익 시뮬레이터 컨트롤러 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  var PROFILES = window.__STARTUP_PROFILES__ || [];
  if (!E || !C || !PROFILES.length) return;

  var p0 = PROFILES[0];

  function renderSeasonBars(months, bestM, worstM) {
    var maxAbs = 1;
    months.forEach(function (m) { maxAbs = Math.max(maxAbs, Math.abs(m.cashFlow)); });
    return '<div class="season-chart tnum">' + months.map(function (m) {
      var h = Math.max(8, Math.round((Math.abs(m.cashFlow) / maxAbs) * 100));
      var cls = m.cashFlow < 0 ? 'neg' : (m.month === bestM ? 'peak' : (m.month === worstM ? 'low' : ''));
      var man = Math.round(m.cashFlow / 10000);
      return '<div class="m-col"><span class="m-val">' + (man >= 0 ? man : '−' + Math.abs(man)) + '만</span>' +
        '<div class="m-bar-wrap"><div class="m-bar ' + cls + '" style="height:' + h + '%"></div></div>' +
        '<span class="m-lbl">' + m.month + '월</span></div>';
    }).join('') + '</div>';
  }

  function applyProfileDefaults(s, prof) {
    s.pyeong = prof.pyeong;
    s.deposit = prof.deposit;
    s.rent = prof.rent;
    s.maint = prof.maint;
    var factor = s.intmode === 'self' ? 0.78 : (s.intmode === 'takeover' ? 0.42 : 1.0);
    s.interior = Math.round(prof.pyeong * prof.interiorPerPyeong * factor);
    s.equip = prof.equip;
    s.premium = prof.premium;
    s.kiosk = prof.kioskCount > 0 ? 1 : 0;
    s.kioskcnt = prof.kioskCount || 0;
    s.ticket = prof.ticket;
    s.orders = prof.dailyOrders;
    s.cogs = prof.cogsPct;
    s.fee = prof.feePct;
    s.deliv = prof.delivPct;
    s.staff = prof.staffMonthly;
  }

  C.mount({
    slug: 'startup-master',
    defaults: {
      profile: p0.id, pyeong: p0.pyeong, deposit: p0.deposit, rent: p0.rent, maint: p0.maint,
      intmode: 'turnkey', interior: Math.round(p0.pyeong * p0.interiorPerPyeong), equip: p0.equip, premium: p0.premium,
      kiosk: 1, kioskcnt: p0.kioskCount || 1, subsidy: 1, own: 6000, loantype: 'policy', loanrate: 3.5, loanyears: 5,
      ticket: p0.ticket, orders: p0.dailyOrders, days: 26, cogs: p0.cogsPct, fee: p0.feePct, deliv: p0.delivPct, staff: p0.staffMonthly, season: 1
    },
    onBeforeCalc: function (s, changedKey, h) {
      var prof = PROFILES.find(function (x) { return x.id === s.profile; }) || p0;
      if (changedKey === 'profile') {
        applyProfileDefaults(s, prof);
      } else if (changedKey === 'intmode' || changedKey === 'pyeong') {
        var factor = s.intmode === 'self' ? 0.78 : (s.intmode === 'takeover' ? 0.42 : 1.0);
        s.interior = Math.round(s.pyeong * prof.interiorPerPyeong * factor);
      } else if (changedKey === 'loantype') {
        s.loanrate = s.loantype === 'policy' ? 3.5 : (s.loantype === 'mixed' ? 4.4 : 5.5);
      }
      var sNote = h.rootEl.querySelector('[data-season-note]');
      if (sNote) sNote.textContent = prof.seasonNote;
      h.rootEl.querySelectorAll('[data-pick-profile]').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-pick-profile') === s.profile);
      });
    },
    render: function (s, h) {
      // Wire profile buttons once
      var grid = h.rootEl.querySelector('[data-profile-grid]');
      if (grid && !grid._wired) {
        grid._wired = true;
        grid.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-pick-profile]');
          if (!btn) return;
          var hidden = h.form.querySelector('input[data-bind="profile"]');
          if (hidden) {
            hidden.value = btn.getAttribute('data-pick-profile');
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }

      var r = E.startupMaster(s, PROFILES);
      h.setHeroStatus(r.avgMonthlyCashFlow > 0 && r.deficitMonths === 0 ? 'safe' : (r.avgMonthlyCashFlow > 0 ? 'caution' : 'danger'));
      var pbTxt = r.paybackMonths != null ? E.fmt(r.paybackMonths, 1) + '개월' : '회수 불가';

      h.setOut('avgCash', E.won(r.avgMonthlyCashFlow));
      h.setOut('annualCash', E.won(r.annualCashFlow));
      h.setOut('payback', pbTxt);
      h.setOut('totalStartup', E.manwon(r.totalStartup));
      h.setOut('sunkStartup', E.manwon(r.sunkStartup));
      h.setOut('kioskSub', '−' + E.manwon(r.kioskSubsidy));
      h.setOut('loanNeeded', E.manwon(r.loanNeeded));
      h.setOut('mInterest', E.won(r.monthlyInterestKRW));
      h.setOut('loanYrsTxt', r.loanYears + '년 분할');
      h.setOut('mDebt', E.won(r.monthlyDebtServiceKRW));

      h.setOut('bestM', r.bestMonth.month + '월');
      h.setOut('bestVal', E.won(r.bestMonth.cashFlow));
      h.setOut('worstM', r.worstMonth.month + '월');
      h.setOut('worstVal', E.won(r.worstMonth.cashFlow));
      h.setOut('taxReg', r.taxRegimeLabel);
      h.setOut('annSales', E.won(r.annualSalesKRW));
      h.setOut('annTax', E.won(r.annualTotalTaxKRW));
      h.setHtml('seasonBars', renderSeasonBars(r.months, r.bestMonth.month, r.worstMonth.month));
      h.setOut('deficitNote', r.deficitMonths > 0
        ? '주의: 연중 비수기 ' + r.deficitMonths + '개월 동안 현금흐름 적자가 예상됩니다. 최소 3~6개월치 월세·원리금 비상 운영자금을 별도로 남겨 두세요.'
        : '안정: 비수기 달에도 세금과 대출 원리금을 감당하고 흑자가 유지되는 구조입니다.');

      var avgMonthlySales = r.annualSalesKRW / 12;
      h.setBreakdown(avgMonthlySales, r.monthlyBreakdown);
      h.setChart('waterfall', h.waterfallSvg(avgMonthlySales, r.monthlyBreakdown));

      h.setOut('benchMargin', r.profile.benchMargin);
      h.setHtml('tips', (r.profile.tips || []).map(function (t) { return '<li>' + h.esc(t) + '</li>'; }).join(''));

      return {
        benchPayload: { calculator: 'startup-master', industry: r.profile.group === '카페·디저트' ? 'cafe' : 'food', net_margin_pct: r.netMarginPct },
        receipt: {
          filename: 'boozathink-startup-master-receipt.png',
          subtitle: '창업 A-to-Z 손익 진단 · ' + r.profile.name,
          heroLabel: '월평균 세후·원리금 차감 실수령',
          heroValue: E.won(r.avgMonthlyCashFlow),
          heroSub: '1년 누적 ' + E.won(r.annualCashFlow) + ' · 원금회수 ' + pbTxt,
          rows: [
            ['총 창업자금 (보증금 포함)', E.manwon(r.totalStartup)],
            ['순수 매몰 투자비 (회수대상)', E.manwon(r.sunkStartup)],
            ['자기자본 / 필요 대출금', E.manwon(r.ownCash) + ' / ' + E.manwon(r.loanNeeded)],
            ['연간 추정 총매출', E.won(r.annualSalesKRW)],
            ['− 월평균 원가·수수료·고정비', '−' + E.won((r.annualSalesKRW - r.annualOpProfit) / 12)],
            ['− 월평균 부가세·종소세 적립', '−' + E.won(r.annualTotalTaxKRW / 12)],
            ['− 월 대출 원리금 상환액', '−' + E.won(r.monthlyDebtServiceKRW)],
            ['= 월평균 순현금흐름(실수령)', E.won(r.avgMonthlyCashFlow), true],
            ['성수기 최고 / 비수기 최저', E.won(r.bestMonth.cashFlow) + ' / ' + E.won(r.worstMonth.cashFlow)]
          ],
          noteLines: [
            '스마트상점 국비 보조 반영: −' + E.manwon(r.kioskSubsidy),
            r.deficitMonths > 0 ? '비수기 적자 ' + r.deficitMonths + '개월 예상 — 예비자금 확보 권장' : '12개월 전 구간 흑자 현금흐름 유지'
          ]
        }
      };
    }
  });
})();
