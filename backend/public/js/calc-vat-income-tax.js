/* 5. 개인사업자 부가세(간이·일반) & 5월 종합소득세·노란우산 실수령 계산기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  C.mount({
    slug: 'vat-income-tax',
    defaults: { ind: 'food', regime: 'auto', sales: 9600, buy: 40, labor: 2400, cardpct: 85, deps: 1, umb: 25 },
    render: function (s, h, srv) {
      if (!srv || !srv.r) return {};
      var r = srv.r;
      h.setHeroStatus(r.cashNetAnnual > 0 ? 'safe' : 'danger');
      var regLabel = r.effectiveRegime === 'simplified' ? (r.vatExempt ? '간이과세자 (부가세 납부면제)' : '간이과세자') : '일반과세자';

      var noteEl = h.rootEl.querySelector('[data-tax-note]');
      if (noteEl) {
        noteEl.textContent = r.forcedGeneral
          ? '연매출 1억 400만원 이상(또는 간이 배제업종)은 일반과세자로 자동 전환됩니다.'
          : '직전 연 공급대가 1억 400만원 미만 개인사업자는 간이과세 적용 대상입니다 (4,800만원 미만 부가세 납부면제).';
      }

      h.setOut('cashNetMonthly', '월 ' + E.won(r.cashNetMonthly));
      h.setOut('cashNetAnnual', E.won(r.cashNetAnnual));
      h.setOut('regLabel', regLabel);
      h.setOut('effTaxRate', E.pct(r.effTaxRate));
      h.setOut('actualVat', r.vatRefund > 0 ? '환급 ' + E.won(r.vatRefund) : E.won(r.actualVatPayable));
      h.setOut('totalIncomeTax', E.won(r.totalIncomeTax));
      h.setOut('vatGeneral', r.vatGeneral < 0 ? '환급 ' + E.won(Math.abs(r.vatGeneral)) : E.won(r.vatGeneral));
      h.setOut('vatSimplified', r.vatSimplified == null ? '해당없음(1억400만↑)' : (r.vatExempt ? '0원 (납부면제)' : E.won(r.vatSimplified)));
      h.setOut('cardCredit', '−' + E.won(r.cardCreditUsed));
      h.setOut('bracket', E.won(r.taxBase) + ' · ' + r.bracketRate + '%');

      h.setHtml('umbKiller',
        '사장님의 추정 사업소득금액(<strong class="tnum">' + E.won(r.bizIncome) +
        '</strong>) 기준 노란우산 소득공제 한도는 <strong class="tnum">' + E.won(r.umbCap) +
        '</strong>입니다. 월 <strong>' + E.fmt(s.umb) + '만원</strong>(연 ' + E.fmt(s.umb * 12) +
        '만원) 납입 시 <strong class="tnum">' + E.won(r.umbDeduct) +
        '</strong>이 공제되어, 5월 종합소득세+지방소득세가 <strong class="tnum">' + E.won(r.umbTaxSaved) +
        '</strong> 즉시 줄어듭니다!'
      );

      h.setBreakdown(r.salesKRW, r.breakdown);
      h.setChart('waterfall', h.waterfallSvg(r.salesKRW, r.breakdown));

      return {
        benchPayload: { calculator: 'vat-income-tax', industry: s.ind || 'food', eff_tax_rate: r.effTaxRate },
        receipt: {
          filename: 'boozathink-tax-takehome-receipt.png',
          subtitle: '개인사업자 세무·실수령 진단 · ' + regLabel,
          heroLabel: '세금 공제 후 월 실수령액',
          heroValue: '월 ' + E.won(r.cashNetMonthly),
          heroSub: '연간 세후 순수익 ' + E.won(r.cashNetAnnual) + ' (총세부담 ' + E.pct(r.effTaxRate) + ')',
          rows: [
            ['연간 총매출 (공급대가)', E.won(r.salesKRW)],
            ['− 과세 매입원가 (' + s.buy + '%)', '−' + E.won(r.taxBuyKRW)],
            ['− 인건비·비과세 경비', '−' + E.won(r.laborKRW)],
            ['− 실제 납부 부가가치세', r.vatRefund > 0 ? '+' + E.won(r.vatRefund) + '(환급)' : '−' + E.won(r.actualVatPayable)],
            ['  (신용카드 세액공제 반영)', '−' + E.won(r.cardCreditUsed)],
            ['− 종합소득세 + 지방세(' + r.bracketRate + '%구간)', '−' + E.won(r.totalIncomeTax)],
            ['= 연간 세후 순수익', E.won(r.cashNetAnnual), true],
            ['= 월 환산 실수령액', E.won(r.cashNetMonthly), true]
          ],
          noteLines: [
            '노란우산 절세액: 연 ' + E.won(r.umbTaxSaved) + ' (공제 ' + E.won(r.umbDeduct) + ')',
            '일반과세 시 부가세 ' + E.won(Math.max(0, r.vatGeneral)) + ' / 간이 ' + (r.vatSimplified == null ? '불가' : E.won(r.vatSimplified))
          ]
        }
      };
    }
  });
})();
