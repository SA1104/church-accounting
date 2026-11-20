/* 창업 풀코스 A-to-Z & 12개월 계절 손익 시뮬레이터 컨트롤러 (v2.6) */
(function () {
  'use strict';
  var E = window.BTEngine, C = window.BTCalc;
  var PROFILES = window.__STARTUP_PROFILES__ || [];
  if (!E || !C || !PROFILES.length) return;

  var p0 = PROFILES[0];
  var STEP_TITLES = {
    1: '업종 & 창업 지역 고르기',
    2: '가게 보증금 · 월세 · 인테리어',
    3: '무인기기 · 직원 인건비',
    4: '카테고리별 판매 메뉴 · 배달 상세',
    5: '내 현금 자본금 · 기존 대출 진단'
  };

  function defaultDelivPreset(prof) {
    var g = (prof && prof.group) || '';
    if (g === '외식·배달') return { dshare: 45, pshare: 15, dappfee: 7.8, drider: 3300, dpack: 900, dpromo: 500 };
    if (g === '카페·디저트') return { dshare: 20, pshare: 45, dappfee: 7.8, drider: 3000, dpack: 450, dpromo: 300 };
    if (g === '도소매·생활밀착') return { dshare: 10, pshare: 20, dappfee: 7.8, drider: 3000, dpack: 300, dpromo: 200 };
    if (g === '이커머스·B2B') return { dshare: 0, pshare: 0, dappfee: 6.8, drider: 0, dpack: 600, dpromo: 300 };
    return { dshare: 0, pshare: 0, dappfee: 7.8, drider: 3000, dpack: 400, dpromo: 0 };
  }

  function intModeNoteText(mode) {
    if (mode === 'self') return '목수·전기·설비·간판 기술자를 사장님이 직접 따로 불러 시공하는 방식입니다. 업체 종합 관리마진(약 20~25%)을 아낄 수 있지만, 도면과 공사 순서를 직접 챙겨야 합니다.';
    if (mode === 'takeover') return '이전에 같은 업종을 하던 가게의 주방·에어컨·바닥 공사를 그대로 넘겨받고 간판과 도색만 손보는 방식입니다. 초기 투자비를 절반 이하로 줄일 수 있어 초보 창업자에게 가장 안전합니다.';
    return '인테리어 전문 업체 한 곳에 철거부터 목공·전기·마감까지 통째로 맡기는 가장 흔한 방식입니다. 몸은 편하지만 업체 이윤이 포함되므로 최소 3곳 이상 상세 내역서를 비교하세요.';
  }

  function parseMenu(str, prof) {
    if (str && typeof str === 'string') {
      try {
        var parsed = JSON.parse(str);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 10);
      } catch (_) {}
    }
    return E.defaultCategoriesForProfile(prof || p0);
  }

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
    var reg = (E.STARTUP_REGIONS && E.STARTUP_REGIONS[s.region]) || E.STARTUP_REGIONS.recommend;
    s.pyeong = prof.pyeong;
    s.deposit = Math.round(prof.deposit * reg.depMult);
    s.rent = Math.round(prof.rent * reg.rentMult);
    s.maint = prof.maint;
    var factor = s.intmode === 'self' ? 0.78 : (s.intmode === 'takeover' ? 0.42 : 1.0);
    s.interior = Math.round(prof.pyeong * prof.interiorPerPyeong * factor);
    s.equip = prof.equip;
    s.premium = prof.premium;
    s.kiosk = prof.kioskCount > 0 ? 1 : 0;
    s.kioskcnt = prof.kioskCount || 0;
    s.staff = prof.staffMonthly;

    var dp = defaultDelivPreset(prof);
    s.dshare = dp.dshare;
    s.pshare = dp.pshare;
    s.dappfee = String(dp.dappfee);
    s.drider = dp.drider;
    s.dpack = dp.dpack;
    s.dpromo = dp.dpromo;

    var cats = E.defaultCategoriesForProfile(prof);
    s.menudata = JSON.stringify(cats);
  }

  var initDp = defaultDelivPreset(p0);
  var initCats = E.defaultCategoriesForProfile(p0);
  var menuItemsRef = initCats.slice();
  var menuDomNeedsRebuild = true;
  var latestEstRate = 3.5;

  C.mount({
    slug: 'startup-master',
    defaults: {
      profile: p0.id,
      region: 'recommend',
      pyeong: p0.pyeong,
      deposit: p0.deposit,
      rent: p0.rent,
      maint: p0.maint,
      intmode: 'turnkey',
      interior: Math.round(p0.pyeong * p0.interiorPerPyeong),
      equip: p0.equip,
      premium: p0.premium,
      kiosk: 1,
      kioskcnt: p0.kioskCount || 1,
      subsidy: 1,
      staff: p0.staffMonthly,
      days: 26,
      menudata: JSON.stringify(initCats),
      delivmode: 'detail',
      dshare: initDp.dshare,
      pshare: initDp.pshare,
      dappfee: String(initDp.dappfee),
      drider: initDp.drider,
      dpack: initDp.dpack,
      dpromo: initDp.dpromo,
      season: 1,
      own: 6000,
      hasloan: '0',
      expolicy: 0,
      exbank: 0,
      exmort: 0,
      excard: 0,
      exrate: 6.2,
      credit: 'high',
      collateral: 'none',
      colval: 0,
      arrears: 0,
      loantype: 'policy',
      loanrate: 3.5,
      loanyears: 5
    },
    onBeforeCalc: function (s, changedKey, h) {
      var prof = PROFILES.find(function (x) { return x.id === s.profile; }) || p0;
      if (changedKey === 'profile') {
        applyProfileDefaults(s, prof);
        menuItemsRef = parseMenu(s.menudata, prof);
        menuDomNeedsRebuild = true;
        var hiddenMenu = h.form.querySelector('input[data-bind="menudata"]');
        if (hiddenMenu) hiddenMenu.value = s.menudata;
      } else if (changedKey === 'region') {
        var reg = (E.STARTUP_REGIONS && E.STARTUP_REGIONS[s.region]) || E.STARTUP_REGIONS.recommend;
        s.deposit = Math.round(prof.deposit * reg.depMult);
        s.rent = Math.round(prof.rent * reg.rentMult);
      } else if (changedKey === 'intmode' || changedKey === 'pyeong') {
        var factor = s.intmode === 'self' ? 0.78 : (s.intmode === 'takeover' ? 0.42 : 1.0);
        s.interior = Math.round(s.pyeong * prof.interiorPerPyeong * factor);
      } else if (changedKey === 'loantype') {
        s.loanrate = s.loantype === 'policy' ? 3.5 : (s.loantype === 'mixed' ? 4.4 : 5.5);
      } else if (changedKey === 'dshare') {
        if (Number(s.dshare) + Number(s.pshare) > 100) {
          s.pshare = Math.max(0, 100 - Number(s.dshare));
        }
      } else if (changedKey === 'pshare') {
        if (Number(s.dshare) + Number(s.pshare) > 100) {
          s.dshare = Math.max(0, 100 - Number(s.pshare));
        }
      } else if (!changedKey) {
        menuItemsRef = parseMenu(s.menudata, prof);
        menuDomNeedsRebuild = true;
      }

      var sNote = h.rootEl.querySelector('[data-season-note]');
      if (sNote) sNote.textContent = prof.seasonNote;
      var selName = h.rootEl.querySelector('[data-sel-prof-name]');
      if (selName) selName.textContent = '선택된 업종: ' + prof.name;
      var selMeta = h.rootEl.querySelector('[data-sel-prof-meta]');
      if (selMeta) selMeta.textContent = prof.group + ' · 표준 ' + prof.pyeong + '평 · 평균 원가율 ' + prof.cogsPct + '% 기준이 적용되었습니다.';

      h.rootEl.querySelectorAll('[data-pick-profile]').forEach(function (btn) {
        var isAct = btn.getAttribute('data-pick-profile') === s.profile;
        btn.classList.toggle('active', isAct);
        btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
      });
    },
    render: function (s, h) {
      var prof = PROFILES.find(function (x) { return x.id === s.profile; }) || p0;

      // 1) Wire 5-Step Wizard once
      var stepper = h.rootEl.querySelector('[data-stepper]');
      if (stepper && !stepper._wired) {
        stepper._wired = true;
        var curStep = 1;
        var visited = { 1: true };
        var expandedAll = false;
        var expandBtn = stepper.querySelector('[data-step-expand]');
        var statusEl = stepper.querySelector('[data-step-status]');

        function syncStepUI(scrollIntoView) {
          var panes = h.form.querySelectorAll('[data-step-pane]');
          var tabs = stepper.querySelectorAll('[data-step-btn]');
          panes.forEach(function (pane) {
            var n = parseInt(pane.getAttribute('data-step-pane'), 10);
            pane.hidden = expandedAll ? false : (n !== curStep);
            var nav = pane.querySelector('.step-nav');
            if (nav) nav.style.display = expandedAll ? 'none' : 'flex';
          });
          tabs.forEach(function (tab) {
            var n = parseInt(tab.getAttribute('data-step-btn'), 10);
            var isAct = !expandedAll && n === curStep;
            tab.classList.toggle('active', isAct);
            tab.classList.toggle('done', !!visited[n] && !isAct);
            tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
          });
          if (statusEl) {
            statusEl.textContent = expandedAll
              ? '1단계 ~ 5단계 전체 펼쳐보기 모드'
              : ('현재 ' + curStep + ' / 5 단계 진행 중 · ' + (STEP_TITLES[curStep] || ''));
          }
          if (expandBtn) {
            expandBtn.textContent = expandedAll ? '단계별로 하나씩 보기' : '전체 단계 한눈에 펼치기';
          }
          if (scrollIntoView) {
            h.form.scrollTop = 0;
            if (window.innerWidth <= 920) {
              stepper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }

        stepper.addEventListener('click', function (e) {
          var tab = e.target.closest('[data-step-btn]');
          if (tab) {
            curStep = parseInt(tab.getAttribute('data-step-btn'), 10) || 1;
            visited[curStep] = true;
            if (expandedAll) {
              var targetPane = h.form.querySelector('[data-step-pane="' + curStep + '"]');
              if (targetPane) targetPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              syncStepUI(true);
            }
            return;
          }
          if (e.target.closest('[data-step-expand]')) {
            expandedAll = !expandedAll;
            syncStepUI(false);
          }
        });

        h.form.addEventListener('click', function (e) {
          var go = e.target.closest('[data-go-step]');
          if (!go) return;
          curStep = parseInt(go.getAttribute('data-go-step'), 10) || 1;
          visited[curStep] = true;
          expandedAll = false;
          syncStepUI(true);
        });

        syncStepUI(false);
      }

      // 2) Wire Industry Cards & Search/Filter once
      var grid = h.rootEl.querySelector('[data-profile-grid]');
      if (grid && !grid._wired) {
        grid._wired = true;
        var activeGroup = 'all';
        var searchInput = h.rootEl.querySelector('[data-prof-search]');
        var groupWrap = h.rootEl.querySelector('[data-prof-groups]');

        function filterProfiles() {
          var q = searchInput ? searchInput.value.trim().toLowerCase() : '';
          grid.querySelectorAll('[data-pick-profile]').forEach(function (btn) {
            var g = btn.getAttribute('data-prof-group') || '';
            var nm = (btn.getAttribute('data-prof-name') || '').toLowerCase();
            var matchGroup = activeGroup === 'all' || g === activeGroup;
            var matchQuery = !q || nm.indexOf(q) >= 0 || g.toLowerCase().indexOf(q) >= 0;
            btn.hidden = !(matchGroup && matchQuery);
          });
        }

        if (searchInput) searchInput.addEventListener('input', filterProfiles);
        if (groupWrap) {
          groupWrap.addEventListener('click', function (e) {
            var gBtn = e.target.closest('[data-group-filter]');
            if (!gBtn) return;
            activeGroup = gBtn.getAttribute('data-group-filter') || 'all';
            groupWrap.querySelectorAll('[data-group-filter]').forEach(function (b) {
              b.classList.toggle('active', b === gBtn);
            });
            filterProfiles();
          });
        }

        grid.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-pick-profile]');
          if (!btn) return;
          var pickedId = btn.getAttribute('data-pick-profile');
          var pickedName = btn.getAttribute('data-prof-name') || '';
          var hidden = h.form.querySelector('input[data-bind="profile"]');
          if (hidden && pickedId) {
            hidden.value = pickedId;
            hidden.dispatchEvent(new Event('change', { bubbles: true }));
            if (h.showToast) h.showToast('‘' + pickedName + '’ 기준 투자비와 기본 메뉴가 적용되었습니다');
          }
        });
      }

      // 3) Wire Multi-Category Menu Builder
      var menuBuilder = h.rootEl.querySelector('[data-menu-builder]');
      var menuListEl = h.rootEl.querySelector('[data-menu-list]');
      function syncMenuHiddenAndCalc() {
        var json = JSON.stringify(menuItemsRef);
        s.menudata = json;
        var hm = h.form.querySelector('input[data-bind="menudata"]');
        if (hm) hm.value = json;
        h.recompute('menudata');
      }
      function rebuildMenuDom() {
        if (!menuListEl) return;
        menuListEl.innerHTML = menuItemsRef.map(function (it, idx) {
          return '<div class="menu-cat-row" data-m-idx="' + idx + '">' +
            '<input type="text" value="' + h.esc(it.cat) + '" placeholder="카테고리명 (예: 음료)" aria-label="판매 카테고리 이름" data-m-field="cat">' +
            '<input type="number" min="100" step="100" value="' + Math.round(it.price) + '" aria-label="평균 가격(원)" title="평균 판매가(원)" data-m-field="price">' +
            '<input type="number" min="0" step="1" value="' + Math.round(it.qty) + '" aria-label="하루 판매수량(건)" title="하루 판매수량(건)" data-m-field="qty">' +
            '<input type="number" min="0" max="95" step="1" value="' + Math.round(it.cogs) + '" aria-label="원가율(%)" title="원가율(%)" data-m-field="cogs">' +
            '<button type="button" class="menu-del-btn" title="이 카테고리 삭제" aria-label="카테고리 삭제" data-del-menu="' + idx + '">×</button>' +
          '</div>';
        }).join('');
        menuDomNeedsRebuild = false;
      }

      if (menuBuilder && !menuBuilder._wired) {
        menuBuilder._wired = true;
        menuBuilder.addEventListener('input', function (e) {
          var field = e.target.getAttribute('data-m-field');
          if (!field) return;
          e.stopPropagation();
          var row = e.target.closest('[data-m-idx]');
          if (!row) return;
          var idx = parseInt(row.getAttribute('data-m-idx'), 10);
          if (!menuItemsRef[idx]) return;
          if (field === 'cat') {
            menuItemsRef[idx].cat = e.target.value;
          } else {
            var numVal = parseFloat(e.target.value);
            menuItemsRef[idx][field] = Number.isFinite(numVal) ? numVal : 0;
          }
          syncMenuHiddenAndCalc();
        });

        menuBuilder.addEventListener('click', function (e) {
          var addBtn = e.target.closest('[data-add-menu]');
          if (addBtn) {
            if (menuItemsRef.length >= 10) {
              if (h.showToast) h.showToast('카테고리는 최대 10개까지 등록할 수 있습니다');
              return;
            }
            menuItemsRef.push({ cat: '추가 메뉴 · 상품 ' + (menuItemsRef.length + 1), price: 6500, qty: 15, cogs: 30 });
            rebuildMenuDom();
            syncMenuHiddenAndCalc();
            var inputs = menuListEl.querySelectorAll('[data-m-field="cat"]');
            if (inputs.length) inputs[inputs.length - 1].focus();
            return;
          }
          var resetBtn = e.target.closest('[data-reset-menu]');
          if (resetBtn) {
            var curProf = PROFILES.find(function (x) { return x.id === s.profile; }) || p0;
            menuItemsRef = E.defaultCategoriesForProfile(curProf);
            rebuildMenuDom();
            syncMenuHiddenAndCalc();
            if (h.showToast) h.showToast('업종 기본 판매 카테고리로 되돌렸습니다');
            return;
          }
          var delBtn = e.target.closest('[data-del-menu]');
          if (delBtn) {
            if (menuItemsRef.length <= 1) {
              if (h.showToast) h.showToast('최소 1개 이상의 판매 카테고리가 필요합니다');
              return;
            }
            var dIdx = parseInt(delBtn.getAttribute('data-del-menu'), 10);
            menuItemsRef.splice(dIdx, 1);
            rebuildMenuDom();
            syncMenuHiddenAndCalc();
          }
        });
      }
      if (menuDomNeedsRebuild) rebuildMenuDom();

      // 4) Wire Apply Estimated Loan Rate button once
      var estRateBtn = h.rootEl.querySelector('[data-apply-est-rate]');
      if (estRateBtn && !estRateBtn._wired) {
        estRateBtn._wired = true;
        estRateBtn.addEventListener('click', function () {
          var numInput = h.form.querySelector('#f-loanrate');
          if (numInput) {
            numInput.value = latestEstRate.toFixed(1);
            numInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (h.showToast) h.showToast('진단된 예상 금리(연 ' + latestEstRate.toFixed(1) + '%)가 반영되었습니다');
          }
        });
      }

      // 5) Compute full A-to-Z result with menuItemsRef
      var calcParams = Object.assign({}, s, { menuItems: menuItemsRef, delivmode: 'detail' });
      var r = E.startupMaster(calcParams, PROFILES);
      latestEstRate = r.loanCheck.estWeightedRate;

      // Update Step 1 Location Recommendation & Map Link
      var locBest = h.rootEl.querySelector('[data-loc-best]');
      var locAvoid = h.rootEl.querySelector('[data-loc-avoid]');
      var locTip = h.rootEl.querySelector('[data-loc-tip]');
      var mapLink = h.rootEl.querySelector('[data-map-link]');
      if (locBest) locBest.textContent = r.locRec.best;
      if (locAvoid) locAvoid.textContent = r.locRec.avoid;
      if (locTip) locTip.textContent = r.locRec.tip;
      if (mapLink) mapLink.href = '/commercial-area?biz=' + encodeURIComponent(r.profile.id) + '&region=' + encodeURIComponent(r.regionKey);

      // Update Step 2 Lease Cap Note & Interior Mode Note
      var leaseNote = h.rootEl.querySelector('[data-lease-note]');
      if (leaseNote) {
        leaseNote.innerHTML = '환산보증금(보증금 + 월세×100) <strong>' + E.manwon(r.convertedDeposit) + '</strong> — ' +
          h.esc(r.leaseCapObj.name) + ' 법정 기준(' + E.manwon(r.leaseCapObj.cap) + ') ' +
          (r.underLeaseCap
            ? '이내여서 매년 월세 5% 상한 및 10년 계약갱신 보호를 받습니다.'
            : '초과 구간이라 건물주의 큰 폭 월세 인상을 막으려면 계약서 특약이 꼭 필요합니다.');
      }
      var intNote = h.rootEl.querySelector('[data-intmode-note]');
      if (intNote) intNote.textContent = intModeNoteText(r.intMode);

      // Update Step 4 Menu Summary & Delivery Detail Visibility/Summary
      var menuSum = h.rootEl.querySelector('[data-menu-sum]');
      if (menuSum) {
        menuSum.innerHTML = '하루 총 <strong>' + E.fmt(r.dailyOrders) + '건</strong> · 평균 결제 <strong>' + E.won(r.ticket) + '</strong> · 평균 원가율 <strong>' + E.pct(r.cogsPct) + '</strong>';
      }
      var delivDetailBox = h.rootEl.querySelector('[data-deliv-detail-box]');
      if (delivDetailBox) {
        delivDetailBox.hidden = (r.delivBreakdown.delivShare === 0 && r.delivBreakdown.pickupShare === 0);
      }
      var delivSum = h.rootEl.querySelector('[data-deliv-sum]');
      if (delivSum) {
        if (r.delivBreakdown.delivShare === 0 && r.delivBreakdown.pickupShare === 0) {
          delivSum.innerHTML = '매장 방문 · 예약 결제 100% 기준 → 일반 카드결제 수수료(약 1.5%) 월 <strong>' + E.won(r.delivBreakdown.monthlyFeeKRW) + '</strong>만 반영됩니다.';
        } else {
          delivSum.innerHTML = '매장 ' + r.delivBreakdown.hallShare + '% · 포장 ' + r.delivBreakdown.pickupShare + '% · 배달 ' + r.delivBreakdown.delivShare + '% → 월 카드·앱 수수료 <strong>' +
            E.won(r.delivBreakdown.monthlyFeeKRW) + '</strong> + 라이더 배달비 <strong>' + E.won(r.delivBreakdown.monthlyRiderKRW) +
            '</strong> + 용기·쿠폰 <strong>' + E.won(r.delivBreakdown.monthlyPackKRW + r.delivBreakdown.monthlyPromoKRW) + '</strong>';
        }
      }

      // Update Step 5 Existing Loans Visibility & Eligibility Verdict
      var exLoanBox = h.rootEl.querySelector('[data-exloan-box]');
      if (exLoanBox) exLoanBox.hidden = String(s.hasloan) !== '1';
      var colValBox = h.rootEl.querySelector('[data-colval-box]');
      if (colValBox) colValBox.hidden = s.collateral === 'none';

      var diagBox = h.rootEl.querySelector('[data-loan-diag-box]');
      if (diagBox) {
        diagBox.setAttribute('data-status', r.loanCheck.status);
        var dt = diagBox.querySelector('[data-loan-diag-title]');
        var dd = diagBox.querySelector('[data-loan-diag-detail]');
        var dw = diagBox.querySelector('[data-loan-diag-warns]');
        if (dt) dt.textContent = r.loanCheck.verdictTitle;
        if (dd) dd.textContent = r.loanCheck.verdictDetail;
        if (dw) dw.innerHTML = r.loanCheck.warnings.map(function (w) { return '<li>' + h.esc(w) + '</li>'; }).join('');
        if (estRateBtn) estRateBtn.textContent = '진단 예상금리(연 ' + r.loanCheck.estWeightedRate.toFixed(1) + '%) 적용';
      }

      // 6) Update Right-side Output KPIs & Charts
      h.setHeroStatus(r.avgMonthlyCashFlow > 0 && r.deficitMonths === 0 ? 'safe' : (r.avgMonthlyCashFlow > 0 ? 'caution' : 'danger'));
      var pbTxt = r.paybackMonths != null ? E.fmt(r.paybackMonths, 1) + '개월' : '회수 불가';

      h.setOut('avgCash', E.won(r.avgMonthlyCashFlow));
      h.setOut('annualCash', E.won(r.annualCashFlow));
      h.setOut('payback', pbTxt);
      h.setOut('totalStartup', E.manwon(r.totalStartup));
      h.setOut('sunkStartup', E.manwon(r.sunkStartup));
      h.setOut('kioskSub', '−' + E.manwon(r.kioskSubsidy));
      h.setOut('loanNeeded', E.manwon(r.loanNeeded));
      h.setOut('availLoanOut', E.manwon(r.loanCheck.totalAvailLoan));
      h.setOut('loanYrsTxt', r.loanYears + '년 분할');
      h.setOut('mDebt', E.won(r.monthlyDebtServiceKRW));
      var occPct = r.annualSalesKRW > 0 ? ((r.rent + r.maint) * 10000 * 12 / r.annualSalesKRW) * 100 : 0;
      h.setOut('rentRatioOut', E.pct(occPct) + (occPct <= 12 ? ' (안정)' : (occPct <= 16 ? ' (주의)' : ' (위험)')));
      h.setOut('exIntOut', r.loanCheck.exMonthlyInterestKRW > 0 ? E.won(r.loanCheck.exMonthlyInterestKRW) : '없음(0원)');

      var chkBox = h.rootEl.querySelector('[data-startup-chk]');
      if (chkBox && !chkBox._wired) {
        chkBox._wired = true;
        chkBox.addEventListener('change', function () {
          var tot = chkBox.querySelectorAll('input[type="checkbox"]').length;
          var done = chkBox.querySelectorAll('input[type="checkbox"]:checked').length;
          var badge = chkBox.querySelector('[data-chk-count]');
          if (badge) badge.textContent = '점검 완료 ' + done + ' / ' + tot;
        });
      }

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
          subtitle: '창업 풀코스 손익 진단 · ' + r.profile.name,
          heroLabel: '월평균 세후·원리금 차감 실수령',
          heroValue: E.won(r.avgMonthlyCashFlow),
          heroSub: '1년 누적 ' + E.won(r.annualCashFlow) + ' · 초기투자 회수 ' + pbTxt,
          rows: [
            ['창업 희망 지역', r.regionInfo.name.split('(')[0].trim()],
            ['총 창업자금 (보증금 포함)', E.manwon(r.totalStartup)],
            ['순수 초기 시설·권리금 (회수대상)', E.manwon(r.sunkStartup)],
            ['내 현금 / 필요 대출금', E.manwon(r.ownCash) + ' / ' + E.manwon(r.loanNeeded)],
            ['연간 추정 총매출 (' + menuItemsRef.length + '개 카테고리)', E.won(r.annualSalesKRW)],
            ['− 월평균 원가·배달·고정비', '−' + E.won((r.annualSalesKRW - r.annualOpProfit) / 12)],
            ['− 월평균 부가세·종소세 적립', '−' + E.won(r.annualTotalTaxKRW / 12)],
            ['− 월 신규 대출 원리금 상환', '−' + E.won(r.monthlyDebtServiceKRW)],
            ['= 월평균 순현금흐름(실수령)', E.won(r.avgMonthlyCashFlow), true],
            ['성수기 최고 / 비수기 최저', E.won(r.bestMonth.cashFlow) + ' / ' + E.won(r.worstMonth.cashFlow)]
          ],
          noteLines: [
            '대출 진단: ' + r.loanCheck.verdictTitle,
            r.deficitMonths > 0 ? '비수기 적자 ' + r.deficitMonths + '개월 예상 — 예비 운영자금 확보 필수' : '12개월 전 구간 흑자 현금흐름 유지'
          ]
        }
      };
    }
  });
})();
