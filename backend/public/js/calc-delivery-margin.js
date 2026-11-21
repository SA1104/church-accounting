/* 1. 배달앱 진짜 순수익 & 목표 마진 메뉴가 역산기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  var PLAN_NOTES = {
    'baemin-78': '중개이용료 7.8% · 업주부담 배달비 2,400~3,400원 (VAT 별도)',
    'baemin-68a': '중개이용료 6.8% · 배달비 2,100~3,100원',
    'baemin-68b': '중개이용료 6.8% · 배달비 1,900~2,900원',
    'baemin-20': '중개이용료 2.0% · 배달비 1,900~2,900원',
    'baemin-store': '중개이용료 6.8% · 배달대행비는 사장님이 별도 계약(대행비 입력)',
    'coupang-98': '구 스마트요금제 기준 9.8%. 상생요금제 전환 시 2.0~7.8% 구간 적용(월 마감 후 차액 환급)',
    'yogiyo-97': '요기요 기본형 9.7% (요기배달 이용 시 배달비 별도)',
    'custom': '사장님 계약서상 요율을 직접 입력'
  };

  var userEditedPriceCost = false;

  C.mount({
    slug: 'delivery-margin',
    defaults: { plan: 'baemin-78', price: 20000, fee: 7.8, dfee: 3400, card: 3, cost: 7000, promo: 0, vat: 1, biz: 'food', orders: 40, days: 26, fixed: 3000000, target: 25, goal: 5000000 },
    onBeforeCalc: function (s, changedKey, h) {
      if (changedKey === 'price' || changedKey === 'cost') {
        userEditedPriceCost = true;
      }
      if (changedKey === 'biz') {
        var bSpec = (E.DELIVERY_BIZ_SPECS && E.DELIVERY_BIZ_SPECS[s.biz]) || null;
        if (bSpec && !userEditedPriceCost) {
          s.price = bSpec.avgPrice;
          s.cost = bSpec.avgCost;
        }
      }
      if (changedKey === 'plan') {
        var p = E.DELIVERY_PLANS[s.plan];
        if (p && s.plan !== 'custom') { s.fee = p.fee; s.dfee = p.dfee; }
      } else if ((changedKey === 'fee' || changedKey === 'dfee') && s.plan !== 'custom') {
        var cur = E.DELIVERY_PLANS[s.plan];
        if (cur && (Number(s.fee) !== cur.fee || Number(s.dfee) !== cur.dfee)) {
          s.plan = 'custom';
        }
      }
      var noteEl = h.rootEl.querySelector('[data-plan-note]');
      if (noteEl && PLAN_NOTES[s.plan]) noteEl.textContent = PLAN_NOTES[s.plan];
    },
    render: function (s, h, srv) {
      var applyBtn = h.rootEl.querySelector('[data-apply-biz]');
      if (applyBtn && !applyBtn._wired) {
        applyBtn._wired = true;
        applyBtn.addEventListener('click', function () {
          var specNow = (E.DELIVERY_BIZ_SPECS && E.DELIVERY_BIZ_SPECS[s.biz]) || E.DELIVERY_BIZ_SPECS.food;
          if (!specNow) return;
          userEditedPriceCost = false;
          var fPrice = document.getElementById('f-price');
          var fCost = document.getElementById('f-cost');
          if (fPrice) fPrice.value = specNow.avgPrice;
          if (fCost) {
            fCost.value = specNow.avgCost;
            s.price = specNow.avgPrice;
            fCost.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }

      if (!srv || !srv.r) return {};
      var r = srv.r;
      var spec = (E.DELIVERY_BIZ_SPECS && E.DELIVERY_BIZ_SPECS[s.biz]) || E.DELIVERY_BIZ_SPECS.food;
      var curCogsPct = r.price > 0 ? (r.cost / r.price) * 100 : 0;
      var cogsStatus = curCogsPct > spec.cogsRange[1]
        ? '업종 평균 대비 원가율 높음 (' + curCogsPct.toFixed(1) + '%)'
        : (curCogsPct < spec.cogsRange[0] ? '업종 평균 대비 원가율 우수 (' + curCogsPct.toFixed(1) + '%)' : '업종 적정 원가율 범위 (' + curCogsPct.toFixed(1) + '%)');

      var bTitle = h.rootEl.querySelector('[data-biz-title]');
      var bTip = h.rootEl.querySelector('[data-biz-tip]');
      if (bTitle) bTitle.textContent = spec.name + ' 통상 원가율 ' + spec.cogsRange[0] + '~' + spec.cogsRange[1] + '% (현재 ' + curCogsPct.toFixed(1) + '%)';
      if (bTip) bTip.textContent = spec.tip;

      h.setHeroStatus(r.net >= 0 ? (r.margin >= 15 ? 'safe' : 'caution') : 'danger');
      h.setOut('net', E.won(r.net));
      h.setOut('margin', E.pct(r.margin));
      h.setOut('planName', r.planName);
      h.setOut('bizJudge', cogsStatus);
      h.setOut('monthlyOrders', E.fmt(r.monthlyOrders) + '건');
      h.setOut('monthlyRevenue', E.won(r.monthlyRevenue));
      h.setOut('fixed', E.won(r.fixed));
      h.setOut('monthlyNet', E.won(r.monthlyNet));

      h.setBreakdown(r.price, r.breakdown);
      h.setChart('waterfall', h.waterfallSvg(r.price, r.breakdown));
      h.setChart('monthly', h.compareBarSvg([
        { label: '월 예상 매출', value: r.monthlyRevenue, color: '#3182f6' },
        { label: '월 주문순이익 합계', value: r.net * r.monthlyOrders, color: '#5b5bd6' },
        { label: '고정비 차감후 순익', value: r.monthlyNet, color: r.monthlyNet >= 0 ? '#0e9f6e' : '#dc2626' }
      ]));

      h.setHtml('killer',
        '사장님이 목표 순마진율 <strong>' + E.pct(r.target, 0) + '</strong>를 남기려면, 배달앱 메뉴 가격을 <strong class="tnum">' +
        (r.targetPrice ? E.won(r.targetPrice) : '수수료 구조상 달성 불가') +
        '</strong>으로 세팅하거나 원가·배달비에서 <strong class="tnum">' + E.won(r.saveNeeded) + '</strong>을 절감해야 합니다.'
      );
      h.setHtml('killer2',
        '월 순익 <strong>' + E.won(r.goal) + '</strong>이 목표라면 메뉴가 <strong class="tnum">' +
        (r.goalPrice ? E.won(r.goalPrice) : '-') + '</strong> 또는 하루 <strong class="tnum">' +
        (r.goalOrders ? E.fmt(r.goalOrders) + '건' : '-') + '</strong> 주문이 필요합니다.'
      );

      var pDisc = srv.pDisc != null ? srv.pDisc : Math.min(2000, Math.round(r.price * 0.1));
      var pRes = srv.pRes || r;
      var diff = Math.round(pRes.net - r.net);
      h.setHtml('pickupCompare',
        '포장(픽업) 고객에게 <strong class="tnum">' + E.won(pDisc) +
        '</strong> 즉시 할인을 걸어주더라도 사장님 부담 배달비(<strong class="tnum">' + E.won(r.dfee) +
        '</strong>)가 굳기 때문에 포장 1주문 순수익은 <strong class="tnum">' + E.won(pRes.net) +
        '</strong>으로 배달 주문보다 건당 <strong class="tnum" style="color:' + (diff >= 0 ? 'var(--safe)' : 'var(--danger)') + '">' +
        (diff >= 0 ? '+' + E.won(diff) : E.won(diff)) + '</strong> ' +
        (diff >= 0 ? '더 남습니다. 매장 전면과 영수증에 픽업 할인을 적극 홍보하세요.' : '차이가 납니다.')
      );

      return {
        benchPayload: { calculator: 'delivery-margin', industry: spec.benchInd || 'food', net_margin_pct: r.margin },
        receipt: {
          filename: 'boozathink-delivery-receipt.png',
          subtitle: '배달앱 1주문 손익 진단 · ' + spec.name + ' · ' + r.planName,
          heroLabel: '1주문 실제 순수익',
          heroValue: E.won(r.net) + ' (' + E.pct(r.margin) + ')',
          heroSub: '월 예상 실순익 ' + E.won(r.monthlyNet) + ' (일 ' + s.orders + '건 × ' + s.days + '일)',
          rows: [
            ['메뉴 판매가', E.won(r.price)],
            ['− 중개수수료 (' + s.fee + '%)', '−' + E.won(r.commission)],
            ['− 결제수수료 (' + s.card + '%)', '−' + E.won(r.cardFee)],
            ['− 사장님 부담 배달비', '−' + E.won(r.dfee)],
            ['− 식자재·포장 원가', '−' + E.won(r.cost)],
            ['− 쿠폰·광고비', '−' + E.won(r.promo)],
            ['− 부가세 매출세액', '−' + E.won(r.vat)],
            ['= 1주문 순수익', E.won(r.net), true],
            ['월 고정비 차감후 순익', E.won(r.monthlyNet), true]
          ],
          noteLines: [
            '목표마진 ' + E.pct(r.target, 0) + ' 달성 메뉴가: ' + (r.targetPrice ? E.won(r.targetPrice) : '불가'),
            '필요 원가·배달비 절감액: ' + E.won(r.saveNeeded)
          ]
        }
      };
    }
  });
})();
