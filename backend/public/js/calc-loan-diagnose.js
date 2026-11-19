/* 사업자 대출 가능성 · 추정 한도 · 최저금리 순서 진단기 컨트롤러 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  C.mount({
    slug: 'loan-diagnose',
    defaults: { purpose: 'expand', sales: 18000, credit: 'mid', collateral: 'none', colval: 0, debt: 3000, debtrate: 8.2, arrears: 0, emp: 'lt5' },
    render: function (s, h) {
      var r = E.loanDiagnose(s);
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

      return {
        benchPayload: null,
        receipt: {
          filename: 'boozathink-loan-strategy-receipt.png',
          subtitle: '사업자 자금조달 & 저금리 순서 진단서',
          heroLabel: '추정 추가 조달 가능 한도',
          heroValue: E.manwon(r.netAdditionalLimit),
          heroSub: r.gradeLabel,
          rows: [
            ['직전 연매출', E.manwon(r.sales)],
            ['정책·보증서 추정 여력', E.manwon(r.policyCap), true],
            ['매출연동 신용 추정 여력', E.manwon(r.salesCreditCap)],
            ['담보 자산 대출 여력', E.manwon(r.collateralCap)],
            ['기존 사업자대출 잔액', E.manwon(r.debt) + ' (' + r.debtRate + '%)'],
            ['4.5% 대환 시 연 이자절감', E.won(r.refiAnnualSave), true]
          ],
          noteLines: r.ladder.slice(0, 3).map(function (st) { return st.step + '순위: ' + st.name; })
        }
      };
    }
  });
})();
