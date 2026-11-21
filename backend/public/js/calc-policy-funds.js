/* 3. 2026 소상공인 정책자금·4.5% 대환대출·스마트상점 보조금 1분 매칭기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  function renderProgramCards(cards, esc) {
    return (cards || []).map(function (p, i) {
      var docs = (p.docs || []).map(function (d) {
        return '<li><label><input type="checkbox"> ' + esc(d) + '</label></li>';
      }).join('');
      return '<li class="prog"><div class="prog-head"><span class="prog-rank">' + (i + 1) + '</span><h3>' + esc(p.name) + '</h3><span class="fit" title="조건 적합도">' + p.fit + '%</span></div>' +
        '<p class="prog-why">' + esc(p.why) + '</p>' +
        '<dl class="prog-dl"><div><dt>지원 한도</dt><dd>' + esc(p.limit) + '</dd></div><div><dt>금리·조건</dt><dd>' + esc(p.rate) + '</dd></div><div><dt>기간</dt><dd>' + esc(p.term) + '</dd></div><div><dt>신청처</dt><dd>' + esc(p.where) + '</dd></div></dl>' +
        '<details class="docs"><summary>필요 서류 체크리스트 (' + (p.docs ? p.docs.length : 0) + ')</summary><ul class="checklist">' + docs + '</ul></details></li>';
    }).join('');
  }

  C.mount({
    slug: 'policy-funds',
    defaults: { ind: 'food', region: 'seoul', age: 'lt3', sales: 15000, emp: 'lt5', hiloan: 3000, hirate: 9.5, kiosk: 1, devcost: 600, srate: 70 },
    render: function (s, h, srv) {
      if (!srv || !srv.r) return {};
      var r = srv.r;
      var cards = srv.matchedCards || [];
      h.setOut('count', r.matches.length + '건');
      h.setOut('sohoText', r.soho ? '소상공인 요건 충족 (상시근로자 5인 미만·제조 10인 미만)' : '소상공인 요건 초과 → 중소기업 자금 위주 검토');
      h.setOut('annual', E.won(r.refinance.annual));
      h.setOut('monthly', E.won(r.refinance.monthly));
      h.setOut('tenYear', E.won(r.refinance.tenYear));
      h.setOut('refAmt', E.fmt(r.refinance.amount) + '만원');
      h.setOut('refNote', r.refinance.eligible
        ? (r.refinance.over > 0 ? '한도 5,000만원 초과분 ' + E.fmt(r.refinance.over) + '만원은 대환 대상에서 제외됩니다.' : '연 7% 이상 고금리 사업자대출 전액이 대환 한도 내입니다.')
        : '연 7% 이상 고금리 대출이 없거나 사업자 요건 미충족으로 대환 대상이 아닙니다.');

      h.setOut('devcostOut', E.fmt(r.smart.devcost) + '만원');
      h.setOut('subsidy', E.fmt(r.smart.subsidy) + '만원');
      h.setOut('selfPay', E.fmt(r.smart.selfPay) + '만원');
      h.setOut('capText', r.smart.capped ? '500만원 한도 적용' : '한도 내');

      var curAnnualInterest = r.refinance.amount * 10000 * (r.refinance.rate / 100);
      var newAnnualInterest = r.refinance.amount * 10000 * 0.045;
      h.setChart('refi', h.compareBarSvg([
        { label: '현재 연 이자 (' + r.refinance.rate + '%)', value: curAnnualInterest, color: '#ef4444' },
        { label: '4.5% 대환 후 연 이자', value: r.refinance.eligible ? newAnnualInterest : curAnnualInterest, color: '#0e9f6e' },
        { label: '첫해 절감액', value: r.refinance.annual, color: '#3182f6' }
      ]));

      if (cards.length) h.setHtml('programs', renderProgramCards(cards, h.esc));

      var topNames = cards.slice(0, 3).map(function (p, idx) {
        return (idx + 1) + '순위: ' + p.name.split('(')[0].trim();
      });

      return {
        benchPayload: { calculator: 'policy-funds', industry: s.ind || 'food', monthly_saving_krw: Math.round(r.monthlyBenefit), matched_programs: r.matches.length },
        compare: {
          defaultTitle: '대환 ' + s.hiloan + '만(' + s.hirate + '%) · 기기 ' + s.devcost + '만',
          metrics: [
            { label: '연간 이자 절감액', val: Math.round(r.refinance.annual), unit: '원', higherIsBetter: true },
            { label: '스마트상점 국비지원', val: r.smart.subsidy, unit: '만원', higherIsBetter: true },
            { label: '매칭 지원사업 수', val: r.matches.length, unit: '건', higherIsBetter: true }
          ]
        },
        receipt: {
          filename: 'boozathink-policy-funds-receipt.png',
          subtitle: '정책자금·대환대출·보조금 매칭 진단서',
          heroLabel: '매칭된 핵심 지원사업',
          heroValue: r.matches.length + '건 매칭',
          heroSub: '연 이자절감 ' + E.won(r.refinance.annual) + ' · 국비보조 ' + E.fmt(r.smart.subsidy) + '만원',
          rows: [
            ['연매출 규모', E.fmt(s.sales) + '만원'],
            ['고금리 대출 보유액', E.fmt(s.hiloan) + '만원 (' + s.hirate + '%)'],
            ['4.5% 대환 적용액', E.fmt(r.refinance.amount) + '만원'],
            ['연간 이자 절감액', E.won(r.refinance.annual), true],
            ['10년 분할 총이자 절감', E.won(r.refinance.tenYear)],
            ['스마트상점 장비 공급가', E.fmt(r.smart.devcost) + '만원'],
            ['국비 보조금 (' + r.smart.rate + '%)', E.fmt(r.smart.subsidy) + '만원', true],
            ['사장님 실자부담금', E.fmt(r.smart.selfPay) + '만원']
          ],
          noteLines: topNames.length ? topNames : ['소상공인24(sbiz24.kr) 및 ols.semas.or.kr 공고 확인']
        }
      };
    }
  });
})();
