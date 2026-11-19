/* 2. 스마트스토어·쿠팡 셀러 마진 & 손익분기 ROAS 계산기 */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  if (!E || !C) return;

  var MARKET_NOTES = {
    'ss-naver': 'Npay 주문관리 3.63%(일반, VAT포함) + 판매수수료 3%(VAT포함, 공급가 2.73%)',
    'ss-mkt': 'Npay 주문관리 3.63% + 판매자 마케팅 판매수수료 1%(공급가 0.91%)',
    'ss-small': 'Npay 주문관리 1.947%(영세) + 판매수수료 3%',
    'cp-wing': '카테고리별 판매수수료 4~10.9%(대부분 10.8%, VAT 별도). 월 매출 100만원↑ 시 서버이용료 월 5.5만원',
    'cp-rg': '판매수수료 + 입출고·배송비(소형 기준 약 2,800~3,400원/개) + 보관료(일 단위)'
  };

  var STATUS_TEXT = {
    safe: '🟢 안전 — 현재 CPC로 광고해도 마진이 남습니다',
    caution: '🟡 주의 — 손익분기 CPC에 근접했습니다',
    danger: '🔴 적자위험 — 광고할수록 손해입니다'
  };

  var fx = window.__FX__ || { KRW: 1, CNY: 194.5, USD: 1405 };

  C.mount({
    slug: 'seller-roas',
    defaults: { cur: 'CNY', unit: 25, ship: 1500, market: 'ss-naver', fee: 6.63, price: 19900, pack: 3000, ret: 3, cpc: 350, cvr: 2.5 },
    onBeforeCalc: function (s, changedKey, h) {
      if (changedKey === 'cur') {
        var rInput = document.getElementById('r-unit');
        var fInput = document.getElementById('f-unit');
        var uSpan = fInput && fInput.parentElement && fInput.parentElement.querySelector('.unit');
        if (s.cur === 'KRW') {
          if (rInput) { rInput.min = '0'; rInput.max = '200000'; rInput.step = '100'; }
          if (fInput) fInput.step = '100';
          if (uSpan) uSpan.textContent = '원';
          if (s.unit < 500) s.unit = 6000;
        } else if (s.cur === 'CNY') {
          if (rInput) { rInput.min = '0'; rInput.max = '1000'; rInput.step = '0.5'; }
          if (fInput) fInput.step = '0.5';
          if (uSpan) uSpan.textContent = '¥';
          if (s.unit > 1000) s.unit = 25;
        } else {
          if (rInput) { rInput.min = '0'; rInput.max = '200'; rInput.step = '0.1'; }
          if (fInput) fInput.step = '0.1';
          if (uSpan) uSpan.textContent = '$';
          if (s.unit > 200) s.unit = 4;
        }
      }
      if (changedKey === 'market') {
        var mk = E.MARKETS[s.market];
        if (mk) {
          s.fee = mk.feeRate;
          s.pack = mk.defLogi;
          var packLabel = h.form.querySelector('label[for="f-pack"]');
          if (packLabel) packLabel.innerHTML = (mk.logistics === 'rg' ? '로켓그로스 입출고·배송비' : '포장·택배비') + ' <span class="hint">개당</span>';
        }
      }
      var noteEl = h.rootEl.querySelector('[data-plan-note]');
      if (noteEl && MARKET_NOTES[s.market]) noteEl.textContent = MARKET_NOTES[s.market];
    },
    render: function (s, h) {
      var r = E.seller(s, fx);
      h.setHeroStatus(r.status);
      h.setOut('beRoas', r.beRoas ? E.pct(r.beRoas, 0) : '적자 구조');
      h.setOut('status', STATUS_TEXT[r.status]);
      h.setOut('preAd', E.won(r.preAd));
      h.setOut('margin', E.pct(r.margin));
      h.setOut('maxCpa', E.won(r.maxCpa));
      h.setOut('beCpc', E.won(r.beCpc));
      h.setOut('cpa', E.won(r.cpa));
      h.setOut('expRoas', r.expRoas ? E.pct(r.expRoas, 0) : '-');
      h.setOut('postAd', E.won(r.postAd));

      h.setBreakdown(r.price, r.breakdown);
      h.setChart('waterfall', h.waterfallSvg(r.price, r.breakdown));

      return {
        benchPayload: r.beRoas ? { calculator: 'seller-roas', industry: 'online', break_even_roas: r.beRoas } : null,
        receipt: {
          filename: 'boozathink-seller-roas-receipt.png',
          subtitle: '셀러 마진 & ROAS 판독 · ' + r.marketName,
          heroLabel: '최소 손익분기 ROAS',
          heroValue: r.beRoas ? E.pct(r.beRoas, 0) : '적자 구조',
          heroSub: '최대 CPA ' + E.won(r.maxCpa) + ' · 손익분기 CPC ' + E.won(r.beCpc),
          rows: [
            ['판매가', E.won(r.price)],
            ['− 사입원가 (' + s.cur + ' ' + s.unit + ')', '−' + E.won(r.unitKRW)],
            ['− 관부가세·물류비', '−' + E.won(r.ship)],
            ['− 마켓 수수료 (' + E.fmt(r.feeRate, 2) + '%)', '−' + E.won(r.fees)],
            ['− 배송·풀필먼트', '−' + E.won(r.logi)],
            ['− 부가세·반품손실', '−' + E.won(r.vat + r.retLoss)],
            ['= 광고 전 순마진', E.won(r.preAd) + ' (' + E.pct(r.margin) + ')', true],
            ['광고 후 개당 순이익', E.won(r.postAd), true]
          ],
          noteLines: [
            STATUS_TEXT[r.status],
            '환율 기준: 1 CNY=' + E.fmt(fx.CNY, 1) + '원 / 1 USD=' + E.fmt(fx.USD, 1) + '원'
          ]
        }
      };
    }
  });
})();
