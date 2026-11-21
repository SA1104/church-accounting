/* 사업자 대출 가능성 · 추정 한도 · 최저금리 순서 진단기 컨트롤러 (v2.6 기대출 종류별 반영) */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  C.mount({
    slug: 'loan-diagnose',
    defaults: {
      purpose: 'expand', sales: 18000, credit: 'mid', collateral: 'none', colval: 0,
      hasloan: '1', expolicy: 1500, exbank: 1500, exmort: 0, excard: 0,
      debtrate: 8.2, arrears: 0, emp: 'lt5'
    },
    render: function (s, h, srv) {
      var exBox = h.rootEl.querySelector('[data-fd-exloan]');
      if (exBox) exBox.hidden = String(s.hasloan) === '0';
      var colBox = h.rootEl.querySelector('[data-fd-colval]');
      if (colBox) colBox.hidden = s.collateral === 'none';

      if (!srv || !srv.r) return {};
      var r = srv.r;
      h.setHeroStatus(r.grade);
      h.setOut('netLimit', E.manwon(r.netAdditionalLimit));
      h.setOut('gradeLabel', r.gradeLabel);
      h.setOut('policyCap', E.manwon(r.policyCap));
      h.setOut('salesCap', E.manwon(r.salesCreditCap));
      h.setOut('colCap', E.manwon(r.collateralCap));
      h.setOut('refiSave', E.won(r.refiAnnualSave));

      h.setHtml('ladder', r.ladder.map(function (st) {
        return '<li class="ladder-item"><span class="ladder-step">' + st.step + '</span><div><strong>' + h.esc(st.name) +
          '</strong> <span class="pill">' + h.esc(st.rate) + ' · ' + h.esc(st.limit) + '</span>' +
          '<p style="margin:5px 0 0;font-size:13.5px;color:var(--text-2)">' + h.esc(st.why) + '</p></div></li>';
      }).join(''));

      var lBand = r.netAdditionalLimit <= 0 ? 'zero' : (r.netAdditionalLimit < 3000 ? 'lt3000' : (r.netAdditionalLimit < 7000 ? '3000_7000' : 'gte7000'));
      return {
        benchPayload: {
          calculator: 'loan-diagnose',
          industry: 'etc',
          monthly_saving_krw: r.netAdditionalLimit,
          meta: {
            purpose: r.purpose,
            credit: r.credit,
            loan_band: lBand,
            has_loan: r.debt > 0 ? 1 : 0,
            has_card_loan: r.exCard > 0 ? 1 : 0
          }
        },
        receipt: {
          filename: 'boozathink-loan-strategy-receipt.png',
          subtitle: '사업자 자금조달 & 저금리 순서 진단서',
          heroLabel: '추정 추가 조달 가능 한도',
          heroValue: E.manwon(r.netAdditionalLimit),
          heroSub: r.gradeLabel,
          rows: [
            ['직전 연매출', E.manwon(r.sales)],
            ['정책·보증서 잔여 여력', E.manwon(r.policyCap), true],
            ['매출연동 신용 추정 여력', E.manwon(r.salesCreditCap)],
            ['담보 자산 대출 여력', E.manwon(r.collateralCap)],
            ['보유 신용·보증·카드론 합계', E.manwon(r.debt) + (r.debt > 0 ? ' (평균 ' + r.debtRate + '%)' : '')],
            ['4.5% 대환 시 연 이자절감', E.won(r.refiAnnualSave), true]
          ],
          noteLines: r.ladder.slice(0, 3).map(function (st) { return st.step + '순위: ' + st.name; })
        }
      };
    }
  });
})();
