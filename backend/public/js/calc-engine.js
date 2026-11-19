/* BoozaThink calc-engine — 서버(SSR)·브라우저·검증 스크립트가 공유하는 순수 계산 함수 (UMD) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BTEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WEEKS = 4.345;
  var WAGE_YEARS = {
    2026: { wage: 10320, pension: 4.75, health: 3.595, ltcOfHealth: 13.14, employment: 1.15, accident: 0.9 },
    2027: { wage: 10700, pension: 5.00, health: 3.595, ltcOfHealth: 13.90, employment: 1.15, accident: 0.9 }
  };
  Object.keys(WAGE_YEARS).forEach(function (y) {
    var w = WAGE_YEARS[y];
    w.ltc = w.health * w.ltcOfHealth / 100;
    w.insTotal = w.pension + w.health + w.ltc + w.employment + w.accident;
  });

  var MIN_WAGE_2026 = WAGE_YEARS[2026].wage;
  var MIN_WAGE_2027 = WAGE_YEARS[2027].wage;
  var INS = WAGE_YEARS[2026];
  var INS_TOTAL = WAGE_YEARS[2026].insTotal;

  var DELIVERY_PLANS = {
    'baemin-78': { name: '배민 상생 1구간 7.8%', fee: 7.8, dfee: 3400 },
    'baemin-68a': { name: '배민 상생 2구간 6.8%', fee: 6.8, dfee: 3100 },
    'baemin-68b': { name: '배민 상생 3구간 6.8%', fee: 6.8, dfee: 2900 },
    'baemin-20': { name: '배민 상생 4구간 2.0%', fee: 2.0, dfee: 1900 },
    'baemin-store': { name: '배민 가게배달 6.8%', fee: 6.8, dfee: 0 },
    'coupang-98': { name: '쿠팡이츠 스마트 9.8%', fee: 9.8, dfee: 2900 },
    'yogiyo-97': { name: '요기요 9.7%', fee: 9.7, dfee: 2900 },
    'custom': { name: '직접 입력', fee: 7.0, dfee: 3000 }
  };

  var MARKETS = {
    'ss-naver': { name: '스마트스토어 (네이버 유입)', feeRate: 6.63, logistics: 'pack', defLogi: 3000 },
    'ss-mkt': { name: '스마트스토어 (마케팅 유입)', feeRate: 4.63, logistics: 'pack', defLogi: 3000 },
    'ss-small': { name: '스마트스토어 영세 등급', feeRate: 4.947, logistics: 'pack', defLogi: 3000 },
    'cp-wing': { name: '쿠팡 윙 (판매자배송)', feeRate: 11.88, logistics: 'pack', defLogi: 3000 },
    'cp-rg': { name: '쿠팡 로켓그로스', feeRate: 11.88, logistics: 'rg', defLogi: 3100 }
  };

  var VAT_INDS = {
    food: { name: '음식점·카페·배달외식', vRate: 0.15, cardOk: true },
    retail: { name: '소매업·온라인셀러', vRate: 0.15, cardOk: true },
    mfg: { name: '제조업·제과·소공인', vRate: 0.20, cardOk: true },
    service: { name: '개인서비스·미용·숙박외', vRate: 0.30, cardOk: true },
    rent: { name: '부동산임대·전문서비스', vRate: 0.40, cardOk: false }
  };

  var TAX_BRACKETS = [
    [14000000, 0.06, 0, '6% 구간 (1,400만원 이하)'],
    [50000000, 0.15, 1260000, '15% 구간 (1,400만~5,000만원)'],
    [88000000, 0.24, 5760000, '24% 구간 (5,000만~8,800만원)'],
    [150000000, 0.35, 15440000, '35% 구간 (8,800만~1.5억원)'],
    [300000000, 0.38, 19940000, '38% 구간 (1.5억~3억원)'],
    [500000000, 0.40, 25940000, '40% 구간 (3억~5억원)'],
    [1000000000, 0.42, 35940000, '42% 구간 (5억~10억원)'],
    [Infinity, 0.45, 65940000, '45% 구간 (10억원 초과)']
  ];

  var LEASE_CAPS = {
    seoul: { name: '서울특별시', cap: 90000 },
    'metro-overcrowded': { name: '수도권 과밀억제권역·부산', cap: 69000 },
    'metro-major': { name: '광역시·세종·용인·화성·김포 등', cap: 54000 },
    other: { name: '그 밖의 지역', cap: 37000 }
  };

  function n(v, d) { var x = Number(v); return Number.isFinite(x) ? x : (d == null ? 0 : d); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function ceilTo(v, unit) { return Math.ceil(v / unit) * unit; }

  /* ───────── 1. 배달앱 순수익 ───────── */
  function delivery(p) {
    var plan = DELIVERY_PLANS[p.plan] || DELIVERY_PLANS['baemin-78'];
    var price = Math.max(0, n(p.price, 20000));
    var fee = n(p.fee, plan.fee) / 100;
    var card = n(p.card, 3) / 100;
    var dfee = Math.max(0, n(p.dfee, plan.dfee));
    var cost = Math.max(0, n(p.cost, 7000));
    var promo = Math.max(0, n(p.promo, 0));
    var vatOn = String(p.vat) !== '0';
    var orders = Math.max(0, n(p.orders, 40));
    var days = clamp(n(p.days, 26), 1, 31);
    var fixed = Math.max(0, n(p.fixed, 0));
    var target = n(p.target, 25) / 100;
    var vatDiv = vatOn ? 1 / 1.1 : 1;

    var commission = price * fee;
    var cardFee = price * card;
    var vat = vatOn ? price / 11 : 0;
    var net = price - commission - cardFee - dfee - cost - promo - vat;
    var margin = price > 0 ? net / price * 100 : 0;
    var monthlyOrders = orders * days;
    var monthlyRevenue = price * monthlyOrders;
    var monthlyNet = net * monthlyOrders - fixed;

    var denom = vatDiv - fee - card - target;
    var targetPrice = denom > 0 ? ceilTo((dfee + cost + promo) / denom, 100) : null;
    var saveNeeded = Math.max(0, Math.ceil(price * target - net));
    var targetMonthly = Math.max(0, n(p.goal, 5000000));
    var needNetPerOrder = monthlyOrders > 0 ? (targetMonthly + fixed) / monthlyOrders : null;
    var denom2 = vatDiv - fee - card;
    var goalPrice = needNetPerOrder != null && denom2 > 0 ? ceilTo((needNetPerOrder + dfee + cost + promo) / denom2, 100) : null;
    var goalOrders = net > 0 ? Math.ceil((targetMonthly + fixed) / net / days) : null;

    return {
      planName: plan.name, price: price, commission: commission, cardFee: cardFee, dfee: dfee, cost: cost, promo: promo, vat: vat,
      net: net, margin: margin, monthlyOrders: monthlyOrders, monthlyRevenue: monthlyRevenue, monthlyNet: monthlyNet, fixed: fixed,
      target: target * 100, targetPrice: targetPrice, saveNeeded: saveNeeded, goal: targetMonthly, goalPrice: goalPrice, goalOrders: goalOrders,
      breakdown: [
        { key: 'cost', label: '식자재·포장 원가', value: cost },
        { key: 'commission', label: '중개수수료', value: commission },
        { key: 'card', label: '결제수수료', value: cardFee },
        { key: 'dfee', label: '사장님 부담 배달비', value: dfee },
        { key: 'promo', label: '쿠폰·광고비', value: promo },
        { key: 'vat', label: '부가세(매출세액)', value: vat },
        { key: 'net', label: '순수익', value: net }
      ]
    };
  }

  /* ───────── 2. 셀러 마진 & 손익분기 ROAS ───────── */
  function seller(p, fx) {
    fx = fx || { KRW: 1, CNY: 194.5, USD: 1405 };
    var cur = ['KRW', 'CNY', 'USD'].indexOf(p.cur) >= 0 ? p.cur : 'KRW';
    var rate = cur === 'KRW' ? 1 : n(fx[cur], cur === 'CNY' ? 194.5 : 1405);
    var mk = MARKETS[p.market] || MARKETS['ss-naver'];
    var unit = Math.max(0, n(p.unit, cur === 'KRW' ? 6000 : cur === 'CNY' ? 25 : 4));
    var ship = Math.max(0, n(p.ship, 1500));
    var price = Math.max(0, n(p.price, 29900));
    var feeRate = n(p.fee, mk.feeRate) / 100;
    var logi = Math.max(0, n(p.pack, mk.defLogi));
    var ret = clamp(n(p.ret, 3), 0, 100) / 100;
    var cpc = Math.max(0, n(p.cpc, 350));
    var cvr = clamp(n(p.cvr, 2.5), 0.01, 100) / 100;

    var unitKRW = unit * rate;
    var landed = unitKRW + ship;
    var fees = price * feeRate;
    var vat = Math.max(0, (price - landed - fees - logi) / 11);
    var retLoss = price * ret;
    var preAd = price - landed - fees - logi - vat - retLoss;
    var margin = price > 0 ? preAd / price * 100 : 0;
    var beRoas = preAd > 0 ? price / preAd * 100 : null;
    var maxCpa = Math.max(0, preAd);
    var beCpc = maxCpa * cvr;
    var cpa = cpc / cvr;
    var expRoas = cpc > 0 ? price * cvr / cpc * 100 : null;
    var postAd = preAd - cpa;
    var status;
    if (preAd <= 0) status = 'danger';
    else if (cpc <= beCpc * 0.7) status = 'safe';
    else if (cpc <= beCpc) status = 'caution';
    else status = 'danger';
    return {
      cur: cur, rate: rate, marketName: mk.name, logisticsType: mk.logistics, unitKRW: unitKRW, landed: landed, fees: fees, feeRate: feeRate * 100,
      logi: logi, vat: vat, retLoss: retLoss, price: price, preAd: preAd, margin: margin, beRoas: beRoas, maxCpa: maxCpa,
      beCpc: beCpc, cpc: cpc, cvr: cvr * 100, cpa: cpa, expRoas: expRoas, postAd: postAd, status: status,
      breakdown: [
        { key: 'cost', label: '사입 원가(원화)', value: unitKRW },
        { key: 'ship', label: '관부가세·물류', value: ship },
        { key: 'fees', label: '마켓 수수료', value: fees },
        { key: 'logi', label: mk.logistics === 'rg' ? '로켓그로스 입출고·배송' : '포장·택배비', value: logi },
        { key: 'vat', label: '부가세(납부분)', value: vat },
        { key: 'ret', label: '반품·불량 손실', value: retLoss },
        { key: 'net', label: '광고 전 순마진', value: preAd }
      ]
    };
  }

  /* ───────── 3. 정책자금 매칭 ───────── */
  var REGION_GUARANTEE = {
    seoul: '서울신용보증재단', gyeonggi: '경기신용보증재단', incheon: '인천신용보증재단', busan: '부산신용보증재단', daegu: '대구신용보증재단',
    gwangju: '광주신용보증재단', daejeon: '대전신용보증재단', ulsan: '울산신용보증재단', sejong: '세종신용보증재단', gangwon: '강원신용보증재단',
    chungbuk: '충북신용보증재단', chungnam: '충남신용보증재단', jeonbuk: '전북신용보증재단', jeonnam: '전남신용보증재단',
    gyeongbuk: '경북신용보증재단', gyeongnam: '경남신용보증재단', jeju: '제주신용보증재단'
  };

  function amortInterest(principal, ratePct, years) {
    var r = ratePct / 100 / 12, m = years * 12;
    if (principal <= 0 || m <= 0 || r === 0) return 0;
    var pay = principal * r / (1 - Math.pow(1 + r, -m));
    return pay * m - principal;
  }

  function policy(p) {
    var ind = ['food', 'retail', 'mfg', 'service'].indexOf(p.ind) >= 0 ? p.ind : 'food';
    var region = REGION_GUARANTEE[p.region] ? p.region : 'seoul';
    var age = ['pre', 'lt1', 'lt3', 'lt7', 'gte7'].indexOf(p.age) >= 0 ? p.age : 'lt3';
    var sales = Math.max(0, n(p.sales, 15000));
    var emp = p.emp === 'gte5' ? 'gte5' : 'lt5';
    var hiloan = Math.max(0, n(p.hiloan, 3000));
    var hirate = clamp(n(p.hirate, 9.5), 0, 30);
    var kiosk = String(p.kiosk) === '1';
    var devcost = Math.max(0, n(p.devcost, 600));
    var srate = clamp(n(p.srate, 70), 0, 100);

    var registered = age !== 'pre';
    var soho = emp === 'lt5' || ind === 'mfg';
    var list = [];
    function add(id, why, fit) { list.push({ id: id, why: why, fit: fit }); }

    if (registered && soho) add('semas-general', '사업자등록 후 영업 중인 소상공인 기본 운전자금', 92);
    if (registered && soho && (kiosk || ind === 'mfg' || ind === 'retail')) add('semas-innovation', kiosk ? '스마트기술(무인기기) 도입 계획 → 혁신성장촉진자금 우대' : (ind === 'mfg' ? '소공인(제조) 우대 트랙' : '온라인·수출 셀러 성장 트랙'), 84);
    if (registered && soho && hiloan > 0 && hirate >= 7) add('semas-refinance', '연 ' + hirate + '% 고금리 사업자대출 ' + fmt(hiloan) + '만원 보유 → 연 4.5% 고정 대환 대상', 97);
    if (registered) add('kodit-regional', REGION_GUARANTEE[region] + ' 보증서 기반 은행 대출 (지자체 이차보전 병행)', soho ? 88 : 70);
    if (registered && (sales >= 30000 || emp === 'gte5' || ind === 'mfg')) add('kosmes', '연매출 3억 이상·고용 5인 이상·제조 기반 → 중진공 성장자금 검토', 72);
    if (registered && kiosk) add('smart-store', '키오스크·테이블오더·서빙로봇 도입 → 공급가 ' + srate + '% 국비(최대 500만원)', 95);
    if (registered && (sales < 6000 || age === 'gte7')) add('hope-return', sales < 6000 ? '연매출 6,000만원 미만 → 경영개선·업종전환·재기 지원 검토' : '업력 7년 이상 → 경영개선 컨설팅·사업정리 지원 참고', 60);
    if (age === 'pre' || age === 'lt1') add('startup-academy', age === 'pre' ? '예비창업자 → 교육·점포체험·사업화 자금' : '창업 1년 미만 → 사관학교 연계 자금', age === 'pre' ? 90 : 66);
    list.sort(function (a, b) { return b.fit - a.fit; });

    var refAmt = Math.min(hiloan, 5000);
    var eligibleRefi = registered && soho && hirate >= 7 && hiloan > 0;
    var annualSave = eligibleRefi ? refAmt * 10000 * (hirate - 4.5) / 100 : 0;
    var tenYearSave = eligibleRefi ? amortInterest(refAmt * 10000, hirate, 10) - amortInterest(refAmt * 10000, 4.5, 10) : 0;
    var subsidy = kiosk ? Math.min(devcost * srate / 100, 500) : 0;
    var selfPay = kiosk ? devcost - subsidy : 0;

    return {
      ind: ind, region: region, regionGuarantee: REGION_GUARANTEE[region], age: age, sales: sales, emp: emp, soho: soho, registered: registered,
      matches: list, refinance: { eligible: eligibleRefi, amount: refAmt, rate: hirate, annual: annualSave, monthly: annualSave / 12, tenYear: tenYearSave, over: Math.max(0, hiloan - 5000) },
      smart: { on: kiosk, devcost: devcost, rate: srate, subsidy: subsidy, selfPay: selfPay, capped: kiosk && devcost * srate / 100 > 500 },
      monthlyBenefit: annualSave / 12 + (kiosk ? subsidy * 10000 / 24 : 0)
    };
  }

  /* ───────── 4. 인건비 절벽 & 무인화 Payback (2026 ↔ 2027 지원) ───────── */
  function weeklyPay(wage, h) {
    var holiday = h >= 15 ? Math.min(h, 40) / 40 * 8 * wage : 0;
    return { base: wage * h, holiday: holiday, total: wage * h + holiday };
  }
  function staffMonthly(wage, h, insOn, yearKey) {
    var ySpec = WAGE_YEARS[yearKey] || WAGE_YEARS[2026];
    var w = weeklyPay(wage, h);
    var pay = w.total * WEEKS;
    var insRate = insOn ? (h >= 15 ? ySpec.insTotal : ySpec.accident) : 0;
    var ins = pay * insRate / 100;
    return { pay: pay, holiday: w.holiday * WEEKS, ins: ins, total: pay + ins, insRate: insRate };
  }

  function labor(p) {
    var year = String(p.year) === '2027' ? 2027 : 2026;
    var ySpec = WAGE_YEARS[year];
    var wage = Math.max(0, n(p.wage, ySpec.wage));
    var hours = clamp(n(p.hours, 20), 1, 52);
    var staff = clamp(Math.round(n(p.staff, 2)), 1, 50);
    var insOn = String(p.ins) !== '0';
    var cut = clamp(n(p.cut, 14.5), 0, 52);
    var devices = clamp(Math.round(n(p.devices, 4)), 0, 100);
    var mode = p.mode === 'rent' ? 'rent' : 'buy';
    var devcost = Math.max(0, n(p.devcost, 450000));
    var rent = Math.max(0, n(p.rent, 25000));
    var sub = clamp(n(p.subsidy, 0), 0, 100);

    var before = staffMonthly(wage, hours, insOn, year);
    var after = staffMonthly(wage, cut, insOn, year);
    var c145 = staffMonthly(wage, 14.5, insOn, year);
    var c15 = staffMonthly(wage, 15, insOn, year);
    var laborSave = (before.total - after.total) * staff;
    var gross = devices * devcost;
    var subsidyAmt = mode === 'buy' ? Math.min(gross * sub / 100, 5000000) : 0;
    var initial = mode === 'buy' ? gross - subsidyAmt : 0;
    var monthlyDevice = mode === 'rent' ? devices * rent : 0;
    var netMonthly = laborSave - monthlyDevice;
    var payback = mode === 'buy' ? (netMonthly > 0 ? initial / netMonthly : null) : (netMonthly > 0 ? 0 : null);
    var save36 = netMonthly * 36 - initial;

    // 2026(10,320원·10.87%) -> 2027(10,700원·11.15%) 전환 시 추가 부담 비교
    var base2026 = staffMonthly(Math.max(wage, WAGE_YEARS[2026].wage) === wage && year === 2027 ? WAGE_YEARS[2026].wage : WAGE_YEARS[2026].wage, hours, insOn, 2026);
    var next2027 = staffMonthly(Math.max(wage, WAGE_YEARS[2027].wage), hours, insOn, 2027);
    var hikeMonthlyAll = (next2027.total - base2026.total) * staff;

    var curve = [];
    for (var h = 1; h <= 40; h += 0.5) curve.push({ h: h, cost: staffMonthly(wage, h, insOn, year).total });
    var cum = [];
    for (var m = 0; m <= 36; m++) cum.push({ m: m, asIs: before.total * staff * m, toBe: after.total * staff * m + initial + monthlyDevice * m });

    return {
      year: year, wage: wage, hours: hours, staff: staff, insOn: insOn, cut: cut, devices: devices, mode: mode, insTotal: ySpec.insTotal,
      before: before, after: after, cliff: { at145: c145, at15: c15, jump: c15.total - c145.total, jumpPct: c145.total > 0 ? (c15.total / c145.total - 1) * 100 : 0 },
      laborSave: laborSave, gross: gross, subsidyAmt: subsidyAmt, initial: initial, monthlyDevice: monthlyDevice, netMonthly: netMonthly,
      payback: payback, save36: save36, hike2027Monthly: hikeMonthlyAll, hike2027Annual: hikeMonthlyAll * 12, curve: curve, cum: cum
    };
  }

  /* ───────── 5. 개인사업자 부가세(간이·일반) & 종합소득세·실수령 통합 계산기 ───────── */
  function progressiveTax(taxBase) {
    if (taxBase <= 0) return { tax: 0, rate: 6, label: '과세미달 (0원)' };
    for (var i = 0; i < TAX_BRACKETS.length; i++) {
      var b = TAX_BRACKETS[i];
      if (taxBase <= b[0]) {
        return { tax: Math.max(0, taxBase * b[1] - b[2]), rate: Math.round(b[1] * 100), label: b[3] };
      }
    }
    return { tax: 0, rate: 6, label: '-' };
  }

  function yellowUmbrellaCap(bizIncome) {
    if (bizIncome <= 40000000) return 6000000;
    if (bizIncome <= 60000000) return 5000000;
    if (bizIncome <= 100000000) return 4000000;
    return 2000000;
  }

  function vatIncome(p) {
    var indKey = VAT_INDS[p.ind] ? p.ind : 'food';
    var ind = VAT_INDS[indKey];
    var regimeReq = ['auto', 'general', 'simplified'].indexOf(p.regime) >= 0 ? p.regime : 'auto';
    var salesManwon = Math.max(0, n(p.sales, 9600));
    var taxBuyPct = clamp(n(p.buy, 40), 0, 100);
    var laborManwon = Math.max(0, n(p.labor, 2400));
    var cardPct = clamp(n(p.cardpct, 85), 0, 100);
    var deps = clamp(Math.round(n(p.deps, 1)), 1, 10);
    var umbMonthly = clamp(n(p.umb, 25), 0, 150);

    var salesKRW = salesManwon * 10000;
    var taxBuyKRW = salesKRW * (taxBuyPct / 100);
    var laborKRW = laborManwon * 10000;
    var cardSalesKRW = salesKRW * (cardPct / 100);
    var cardCreditEligible = ind.cardOk && salesKRW <= 1000000000;
    var cardCreditCap = cardCreditEligible ? Math.min(cardSalesKRW * 0.013, 10000000) : 0;

    // 일반과세 부가세
    var genOutVat = salesKRW / 11;
    var genInVat = taxBuyKRW / 11;
    var genRawVat = genOutVat - genInVat;
    var genCardUsed = genRawVat > 0 ? Math.min(genRawVat, cardCreditCap) : 0;
    var vatGeneral = genRawVat > 0 ? genRawVat - genCardUsed : genRawVat; // 음수면 환급

    // 간이과세 부가세 (연 공급대가 1억 400만원 미만 & 부동산임대 등 배제업종 제외)
    var canSimplified = salesKRW < 104000000 && indKey !== 'rent';
    var vatExempt = canSimplified && salesKRW < 48000000;
    var simpOutVat = salesKRW * ind.vRate * 0.10;
    var simpInCredit = Math.min(simpOutVat, taxBuyKRW * 0.005);
    var simpBeforeCard = Math.max(0, simpOutVat - simpInCredit);
    var simpCardUsed = vatExempt ? 0 : Math.min(simpBeforeCard, cardCreditCap);
    var vatSimplified = vatExempt ? 0 : Math.max(0, simpBeforeCard - simpCardUsed);

    var effectiveRegime = regimeReq === 'auto' ? (canSimplified ? 'simplified' : 'general') : (regimeReq === 'simplified' && !canSimplified ? 'general' : regimeReq);
    var forcedGeneral = regimeReq === 'simplified' && !canSimplified;
    var actualVat = effectiveRegime === 'simplified' ? vatSimplified : vatGeneral;
    var actualVatPayable = Math.max(0, actualVat);
    var vatRefund = actualVat < 0 ? Math.abs(actualVat) : 0;
    var cardCreditUsed = effectiveRegime === 'simplified' ? simpCardUsed : genCardUsed;

    // 종합소득세 과세표준 계산
    var netRevenue, recognizedExpense;
    if (effectiveRegime === 'general') {
      netRevenue = Math.round(salesKRW * 10 / 11);
      recognizedExpense = Math.round(taxBuyKRW * 10 / 11) + laborKRW;
    } else {
      netRevenue = salesKRW - actualVatPayable;
      recognizedExpense = taxBuyKRW + laborKRW;
    }
    var bizIncome = Math.max(0, netRevenue - recognizedExpense);
    var personalDeduct = deps * 1500000;
    var umbCap = yellowUmbrellaCap(bizIncome);
    var umbPaidAnnual = umbMonthly * 12 * 10000;
    var umbDeduct = Math.min(umbPaidAnnual, bizIncome, umbCap);

    var taxBaseBefore = Math.max(0, bizIncome - personalDeduct);
    var taxBase = Math.max(0, bizIncome - personalDeduct - umbDeduct);

    var progBefore = progressiveTax(taxBaseBefore);
    var progAfter = progressiveTax(taxBase);

    var stdTaxCredit = bizIncome > 0 ? 70000 : 0;
    var incomeTaxBefore = Math.max(0, progBefore.tax - stdTaxCredit);
    var totalIncomeTaxBefore = incomeTaxBefore * 1.1;

    var incomeTax = Math.max(0, progAfter.tax - stdTaxCredit);
    var localIncomeTax = incomeTax * 0.1;
    var totalIncomeTax = incomeTax + localIncomeTax;
    var umbTaxSaved = Math.max(0, totalIncomeTaxBefore - totalIncomeTax);

    var totalTaxPayable = actualVatPayable + totalIncomeTax;
    var cashNetAnnual = salesKRW - taxBuyKRW - laborKRW - actualVat + vatRefund * 0 - totalIncomeTax;
    // 정확히: salesKRW - taxBuyKRW - laborKRW - actualVat(음수면 환급으로 더함) - totalIncomeTax
    cashNetAnnual = salesKRW - taxBuyKRW - laborKRW - actualVat - totalIncomeTax;
    var cashNetMonthly = cashNetAnnual / 12;
    var effTaxRate = salesKRW > 0 ? (Math.max(0, actualVat + totalIncomeTax) / salesKRW) * 100 : 0;

    return {
      indKey: indKey, indName: ind.name, vRatePct: ind.vRate * 100, regimeReq: regimeReq, effectiveRegime: effectiveRegime,
      canSimplified: canSimplified, vatExempt: vatExempt, forcedGeneral: forcedGeneral,
      salesKRW: salesKRW, taxBuyKRW: taxBuyKRW, laborKRW: laborKRW,
      vatGeneral: vatGeneral, vatSimplified: canSimplified ? vatSimplified : null,
      actualVat: actualVat, actualVatPayable: actualVatPayable, vatRefund: vatRefund, cardCreditUsed: cardCreditUsed,
      vatDiff: canSimplified ? (Math.max(0, vatGeneral) - vatSimplified) : 0,
      bizIncome: bizIncome, taxBase: taxBase, bracketLabel: progAfter.label, bracketRate: progAfter.rate,
      incomeTax: incomeTax, localIncomeTax: localIncomeTax, totalIncomeTax: totalIncomeTax,
      umbPaidAnnual: umbPaidAnnual, umbCap: umbCap, umbDeduct: umbDeduct, umbTaxSaved: umbTaxSaved,
      totalTaxPayable: totalTaxPayable, cashNetAnnual: cashNetAnnual, cashNetMonthly: cashNetMonthly, effTaxRate: effTaxRate,
      breakdown: [
        { key: 'buy', label: '과세 매입원가', value: taxBuyKRW },
        { key: 'labor', label: '인건비·기타경비', value: laborKRW },
        { key: 'vat', label: '부가가치세(납부)', value: actualVatPayable },
        { key: 'itax', label: '종합소득세+지방세', value: totalIncomeTax },
        { key: 'net', label: '세후 실수령 순익', value: cashNetAnnual }
      ]
    };
  }

  /* ───────── 6. 상가 월세·환산보증금 5% 상한 판독 & 매장 손익분기점(BEP) 계산기 ───────── */
  function storeLease(p) {
    var regKey = LEASE_CAPS[p.region] ? p.region : 'seoul';
    var reg = LEASE_CAPS[regKey];
    var deposit = Math.max(0, n(p.deposit, 5000));      // 만원
    var rent = Math.max(0, n(p.rent, 300));             // 만원
    var maint = Math.max(0, n(p.maint, 80));            // 만원
    var laborMonthly = Math.max(0, n(p.labor, 450));    // 만원
    var ticket = Math.max(500, n(p.ticket, 18000));     // 원
    var varCostPct = clamp(n(p.varpct, 48), 1, 95);     // %
    var days = clamp(n(p.days, 26), 1, 31);
    var sunkStartup = Math.max(0, n(p.sunk, 8000));     // 만원 (권리금+인테리어+설비, 보증금 제외)
    var dailyOrders = Math.max(0, n(p.orders, 45));     // 건

    var convertedDeposit = deposit + rent * 100;        // 만원 (보증금 + 월세×100)
    var underCap = convertedDeposit <= reg.cap;
    var overAmount = Math.max(0, convertedDeposit - reg.cap);
    var maxRentNext5Pct = rent * 1.05;
    var maxRentHike5Pct = rent * 0.05;

    var occupancyKRW = (rent + maint) * 10000;
    var fixedKRW = (rent + maint + laborMonthly) * 10000;
    var cmRatio = (100 - varCostPct) / 100;
    var cmPerOrder = ticket * cmRatio;

    var bepMonthlySales = cmRatio > 0 ? fixedKRW / cmRatio : 0;
    var bepDailySales = bepMonthlySales / days;
    var bepMonthlyOrders = cmPerOrder > 0 ? Math.ceil(fixedKRW / cmPerOrder) : 0;
    var bepDailyOrders = Math.ceil(bepMonthlyOrders / days);

    var expMonthlyOrders = dailyOrders * days;
    var expMonthlySales = ticket * expMonthlyOrders;
    var expMonthlyProfit = expMonthlySales * cmRatio - fixedKRW;
    var rentRatioPct = expMonthlySales > 0 ? (occupancyKRW / expMonthlySales) * 100 : 0;

    var sunkKRW = sunkStartup * 10000;
    var paybackMonths = expMonthlyProfit > 0 ? sunkKRW / expMonthlyProfit : null;
    var status;
    if (expMonthlyProfit <= 0) status = 'danger';
    else if (paybackMonths != null && paybackMonths <= 24 && rentRatioPct <= 12) status = 'safe';
    else if (paybackMonths != null && paybackMonths <= 36 && rentRatioPct <= 16) status = 'caution';
    else status = 'danger';

    var cum = [];
    for (var m = 0; m <= 36; m++) {
      cum.push({ m: m, asIs: sunkKRW, toBe: Math.max(0, expMonthlyProfit * m) });
    }

    return {
      regionKey: regKey, regionName: reg.name, regionCap: reg.cap,
      deposit: deposit, rent: rent, maint: maint, laborMonthly: laborMonthly,
      convertedDeposit: convertedDeposit, underCap: underCap, overAmount: overAmount,
      maxRentNext5Pct: maxRentNext5Pct, maxRentHike5Pct: maxRentHike5Pct,
      occupancyKRW: occupancyKRW, fixedKRW: fixedKRW, ticket: ticket, varCostPct: varCostPct, cmRatioPct: cmRatio * 100, cmPerOrder: cmPerOrder,
      days: days, bepMonthlySales: bepMonthlySales, bepDailySales: bepDailySales, bepMonthlyOrders: bepMonthlyOrders, bepDailyOrders: bepDailyOrders,
      dailyOrders: dailyOrders, expMonthlySales: expMonthlySales, expMonthlyProfit: expMonthlyProfit, rentRatioPct: rentRatioPct,
      sunkStartup: sunkStartup, paybackMonths: paybackMonths, status: status, cum: cum
    };
  }

  /* ───────── 배달 세부 업종별 실무 기준치 (업종 선택 즉시 피드백용) ───────── */
  var DELIVERY_BIZ_SPECS = {
    chicken: { benchInd: 'food', name: '치킨·피자·야식', avgPrice: 23500, avgCost: 9600, cogsRange: [38, 44], recMargin: 22, tip: '원육·치즈·박스 포장재 비중이 높아 식자재+포장 원가율이 38~44% 수준입니다. 사이드 메뉴 추가 옵션으로 객단가를 25,000원 이상으로 올려 배달비 비중을 낮추는 것이 핵심입니다.' },
    food: { benchInd: 'food', name: '한식·분식·도시락', avgPrice: 18500, avgCost: 6500, cogsRange: [32, 38], recMargin: 24, tip: '다회용기·보온용기 포장재 원가(주문당 900~1,400원)가 숨은 복병입니다. 식자재+포장 합산 원가율을 35% 이내로 유지해야 광고·쿠폰 여력이 생깁니다.' },
    meat: { benchInd: 'food', name: '고기·족발·찜·탕', avgPrice: 34000, avgCost: 13600, cogsRange: [37, 43], recMargin: 25, tip: '객단가가 3만원 이상으로 높아 고정 배달비(3,400원) 방어에는 가장 유리합니다. 대신 원육 수율 로스와 서비스 막국수·반찬 원가를 반드시 포함해 계산하세요.' },
    cafe: { benchInd: 'cafe', name: '카페·디저트·베이커리', avgPrice: 14500, avgCost: 4200, cogsRange: [25, 32], recMargin: 26, tip: '원재료율은 낮지만 평균 주문단가가 낮아 14,000원대 주문에 배달비 3,400원이 붙으면 마진이 급감합니다. 최소주문금액 설계와 구움과자 세트 구성이 필수입니다.' }
  };

  /* ───────── 7. 창업 풀코스 A-to-Z & 12개월 계절 손익 시뮬레이터 ───────── */
  function startupMaster(p, profilesList) {
    var list = profilesList || [];
    var prof = list.find(function (x) { return x.id === p.profile; }) || list[0] || {
      id: 'takeout-coffee', name: '테이크아웃 커피전문점', group: '카페·디저트', pyeong: 12, deposit: 3000, rent: 220, maint: 55,
      interiorPerPyeong: 210, equip: 2800, premium: 1500, ticket: 5600, dailyOrders: 155, cogsPct: 29, feePct: 3.2, delivPct: 4,
      staffMonthly: 290, kioskCount: 1, kioskUnitManwon: 240, seasonality: [0.8,0.83,0.96,1.05,1.18,1.26,1.3,1.28,1.08,1.0,0.88,0.82],
      seasonNote: '', benchMargin: '', tips: []
    };

    var pyeong = clamp(n(p.pyeong, prof.pyeong), 3, 200);
    var deposit = Math.max(0, n(p.deposit, prof.deposit));          // 만원 (회수 가능 보증금)
    var rent = Math.max(0, n(p.rent, prof.rent));                   // 만원
    var maint = Math.max(0, n(p.maint, prof.maint));                // 만원
    var intMode = ['self', 'turnkey', 'takeover'].indexOf(p.intmode) >= 0 ? p.intmode : 'turnkey';
    var intFactor = intMode === 'self' ? 0.78 : (intMode === 'takeover' ? 0.42 : 1.0);
    var defInterior = Math.round(pyeong * prof.interiorPerPyeong * intFactor);
    var interior = Math.max(0, n(p.interior, defInterior));         // 만원
    var equip = Math.max(0, n(p.equip, prof.equip));                // 만원 (간판·주방·초도물품)
    var premium = Math.max(0, n(p.premium, prof.premium));          // 만원 (권리금)

    var kioskOn = String(p.kiosk) !== '0';
    var kioskCnt = kioskOn ? clamp(Math.round(n(p.kioskcnt, prof.kioskCount || 1)), 0, 30) : 0;
    var kioskUnit = prof.kioskUnitManwon || 240;
    var kioskGross = kioskCnt * kioskUnit;                          // 만원
    var subsidyOn = String(p.subsidy) !== '0';
    var kioskSubsidy = (kioskOn && subsidyOn && kioskGross > 0) ? Math.min(Math.round(kioskGross * 0.7), 500) : 0;
    var kioskSelf = Math.max(0, kioskGross - kioskSubsidy);

    var totalStartup = deposit + interior + equip + premium + kioskSelf; // 만원
    var sunkStartup = interior + equip + premium + kioskSelf;            // 만원 (보증금 제외 매몰 투자금)

    var ownCash = Math.max(0, n(p.own, Math.round(totalStartup * 0.65))); // 만원
    var loanNeeded = Math.max(0, totalStartup - ownCash);                 // 만원
    var loanType = ['policy', 'mixed', 'bank'].indexOf(p.loantype) >= 0 ? p.loantype : 'policy';
    var defLoanRate = loanType === 'policy' ? 3.5 : (loanType === 'mixed' ? 4.4 : 5.5);
    var loanRate = clamp(n(p.loanrate, defLoanRate), 0, 20);
    var loanYears = clamp(Math.round(n(p.loanyears, 5)), 1, 10);

    var loanPrincipalKRW = loanNeeded * 10000;
    var rMonth = loanRate / 100 / 12;
    var nMonths = loanYears * 12;
    var monthlyInterestKRW = loanPrincipalKRW * rMonth;
    var monthlyDebtServiceKRW = loanPrincipalKRW > 0
      ? (rMonth > 0 ? loanPrincipalKRW * rMonth / (1 - Math.pow(1 + rMonth, -nMonths)) : loanPrincipalKRW / nMonths)
      : 0;

    var ticket = Math.max(500, n(p.ticket, prof.ticket));
    var dailyOrders = Math.max(0, n(p.orders, prof.dailyOrders));
    var days = clamp(n(p.days, 26), 1, 31);
    var cogsPct = clamp(n(p.cogs, prof.cogsPct), 0, 92);
    var feePct = clamp(n(p.fee, prof.feePct), 0, 30);
    var delivPct = clamp(n(p.deliv, prof.delivPct), 0, 35);
    var staffManwon = Math.max(0, n(p.staff, prof.staffMonthly));
    var seasonOn = String(p.season) !== '0';

    var baseMonthlySales = ticket * dailyOrders * days;
    var varPctTotal = clamp(cogsPct + feePct + delivPct, 0, 98);
    var fixedMonthlyKRW = (rent + maint + staffManwon) * 10000;

    // 12개월 계절 시뮬레이션
    var sArr = prof.seasonality && prof.seasonality.length === 12 ? prof.seasonality : [1,1,1,1,1,1,1,1,1,1,1,1];
    var rawMonths = [];
    var annualSalesKRW = 0;
    for (var m = 0; m < 12; m++) {
      var factor = seasonOn ? sArr[m] : 1.0;
      var mSales = Math.round(baseMonthlySales * factor);
      var mCogs = Math.round(mSales * cogsPct / 100);
      var mFee = Math.round(mSales * feePct / 100);
      var mDeliv = Math.round(mSales * delivPct / 100);
      var mOpProfit = mSales - mCogs - mFee - mDeliv - fixedMonthlyKRW;
      annualSalesKRW += mSales;
      rawMonths.push({ month: m + 1, factor: factor, sales: mSales, cogs: mCogs, fee: mFee, deliv: mDeliv, fixed: fixedMonthlyKRW, opProfit: mOpProfit });
    }

    // 연간 부가세 + 종합소득세 산출 (vatIncome 엔진 연계)
    var taxInd = prof.group === '도소매' || prof.group === '이커머스' ? 'retail' : (prof.group === '개인서비스' ? 'service' : 'food');
    var taxBuyPctApprox = clamp(cogsPct + delivPct + (rent > 0 ? (rent * 120000 / Math.max(1, annualSalesKRW)) * 100 : 0), 0, 90);
    var taxSim = vatIncome({
      ind: taxInd,
      regime: 'auto',
      sales: annualSalesKRW / 10000,
      buy: taxBuyPctApprox,
      labor: staffManwon * 12 + maint * 6,
      cardpct: 88,
      deps: 1,
      umb: 25
    });
    var annualVatKRW = taxSim.actualVatPayable;
    var annualIncomeTaxKRW = taxSim.totalIncomeTax;
    var annualTotalTaxKRW = annualVatKRW + annualIncomeTaxKRW;

    var months = rawMonths.map(function (rm) {
      var share = annualSalesKRW > 0 ? rm.sales / annualSalesKRW : 1 / 12;
      var mTax = Math.round(annualTotalTaxKRW * share);
      var afterTaxInterest = rm.opProfit - mTax - Math.round(monthlyInterestKRW);
      var netCashFlow = rm.opProfit - mTax - Math.round(monthlyDebtServiceKRW);
      return Object.assign({}, rm, { tax: mTax, interest: Math.round(monthlyInterestKRW), debtService: Math.round(monthlyDebtServiceKRW), netProfit: afterTaxInterest, cashFlow: netCashFlow });
    });

    var annualOpProfit = months.reduce(function (a, x) { return a + x.opProfit; }, 0);
    var annualNetProfit = months.reduce(function (a, x) { return a + x.netProfit; }, 0);
    var annualCashFlow = months.reduce(function (a, x) { return a + x.cashFlow; }, 0);
    var avgMonthlyNetProfit = annualNetProfit / 12;
    var avgMonthlyCashFlow = annualCashFlow / 12;

    var bestMonth = months.reduce(function (b, x) { return x.cashFlow > b.cashFlow ? x : b; }, months[0]);
    var worstMonth = months.reduce(function (w, x) { return x.cashFlow < w.cashFlow ? x : w; }, months[0]);
    var deficitMonths = months.filter(function (x) { return x.cashFlow < 0; }).length;

    var paybackMonths = avgMonthlyNetProfit > 0 ? (sunkStartup * 10000) / avgMonthlyNetProfit : null;
    var netMarginPct = annualSalesKRW > 0 ? (annualNetProfit / annualSalesKRW) * 100 : 0;

    return {
      profile: prof, pyeong: pyeong, intMode: intMode,
      deposit: deposit, interior: interior, equip: equip, premium: premium,
      kioskCnt: kioskCnt, kioskGross: kioskGross, kioskSubsidy: kioskSubsidy, kioskSelf: kioskSelf,
      totalStartup: totalStartup, sunkStartup: sunkStartup, ownCash: ownCash, loanNeeded: loanNeeded,
      loanType: loanType, loanRate: loanRate, loanYears: loanYears,
      monthlyInterestKRW: monthlyInterestKRW, monthlyDebtServiceKRW: monthlyDebtServiceKRW,
      ticket: ticket, dailyOrders: dailyOrders, days: days, baseMonthlySales: baseMonthlySales,
      cogsPct: cogsPct, feePct: feePct, delivPct: delivPct, varPctTotal: varPctTotal,
      rent: rent, maint: maint, staffManwon: staffManwon, fixedMonthlyKRW: fixedMonthlyKRW,
      annualSalesKRW: annualSalesKRW, annualOpProfit: annualOpProfit,
      annualVatKRW: annualVatKRW, annualIncomeTaxKRW: annualIncomeTaxKRW, annualTotalTaxKRW: annualTotalTaxKRW,
      taxRegimeLabel: taxSim.effectiveRegime === 'simplified' ? '간이과세 추정' : '일반과세 추정',
      annualNetProfit: annualNetProfit, annualCashFlow: annualCashFlow,
      avgMonthlyNetProfit: avgMonthlyNetProfit, avgMonthlyCashFlow: avgMonthlyCashFlow,
      netMarginPct: netMarginPct, paybackMonths: paybackMonths,
      bestMonth: bestMonth, worstMonth: worstMonth, deficitMonths: deficitMonths,
      months: months,
      monthlyBreakdown: [
        { key: 'cogs', label: '식자재·상품 원가', value: Math.round(annualSalesKRW * cogsPct / 100 / 12) },
        { key: 'fee', label: '결제·플랫폼·배달비', value: Math.round(annualSalesKRW * (feePct + delivPct) / 100 / 12) },
        { key: 'rent', label: '임대료·관리공과금', value: (rent + maint) * 10000 },
        { key: 'staff', label: '인건비', value: staffManwon * 10000 },
        { key: 'tax', label: '부가세·종합소득세 적립', value: Math.round(annualTotalTaxKRW / 12) },
        { key: 'debt', label: '대출 원리금 상환', value: Math.round(monthlyDebtServiceKRW) },
        { key: 'net', label: '월평균 순현금흐름(실수령)', value: Math.round(avgMonthlyCashFlow) }
      ]
    };
  }

  /* ───────── 8. 사업자 대출 가능성 · 추정 한도 · 저금리 순서 진단기 ───────── */
  function loanDiagnose(p) {
    var purpose = ['startup', 'expand', 'urgent', 'refinance'].indexOf(p.purpose) >= 0 ? p.purpose : 'expand';
    var sales = Math.max(0, n(p.sales, 18000));          // 연매출 만원
    var credit = ['high', 'mid', 'low', 'sub'].indexOf(p.credit) >= 0 ? p.credit : 'mid';
    var collateral = ['none', 'realestate', 'deposit', 'securities'].indexOf(p.collateral) >= 0 ? p.collateral : 'none';
    var colVal = Math.max(0, n(p.colval, 0));           // 담보 평가액 만원
    var debt = Math.max(0, n(p.debt, 3000));            // 기존 사업자대출 만원
    var debtRate = clamp(n(p.debtrate, 8.2), 0, 25);
    var arrears = String(p.arrears) === '1';
    var soho = p.emp !== 'gte5';

    // 신용 계수
    var creditMult = credit === 'high' ? 1.0 : (credit === 'mid' ? 0.8 : (credit === 'low' ? 0.55 : 0.25));
    // 정책·보증 한도 추정 (만원)
    var policyCap = arrears ? 0 : Math.round((soho ? 7000 : 10000) * creditMult);
    if (purpose === 'startup' && sales === 0) policyCap = arrears ? 0 : Math.round(5000 * creditMult);

    // 매출 연동 신용 한도 추정 (통상 연매출의 15~30% - 기존 무담보 부채 일부)
    var salesCreditCap = arrears ? 0 : Math.max(0, Math.round(sales * 0.22 * creditMult));

    // 담보 여력 한도 추정
    var ltv = collateral === 'realestate' ? 0.70 : (collateral === 'securities' ? 0.60 : (collateral === 'deposit' ? 0.80 : 0));
    var collateralCap = Math.round(colVal * ltv);

    var grossLimit = policyCap + salesCreditCap + collateralCap;
    var netAdditionalLimit = arrears ? 0 : Math.max(0, grossLimit - Math.round(debt * (collateral === 'none' ? 0.7 : 0.4)));

    var grade, gradeLabel;
    if (arrears) {
      grade = 'danger';
      gradeLabel = '보류 (국세·지방세 체납 또는 연체 해소 선행 필수)';
    } else if (credit === 'sub' && collateral === 'none') {
      grade = 'caution';
      gradeLabel = '제한적 승인 (햇살론·소진공 취약차주 특례보증 우선 검토)';
    } else if (netAdditionalLimit >= 5000 || credit === 'high' || collateralCap >= 5000) {
      grade = 'safe';
      gradeLabel = '우수 (저금리 정책자금·1금융권 우선 실행 가능 구간)';
    } else {
      grade = 'caution';
      gradeLabel = '보통 (지역신보 보증서 선확보 후 은행 연계 권장)';
    }

    var ladder = [];
    if (arrears) {
      ladder.push({ step: 1, name: '국세·지방세 체납 완납 또는 징수유예 승인', rate: '-', limit: '선행 필수', why: '체납 상태에서는 모든 정책자금·보증서·제1금융권 전산 심사가 자동 거절됩니다.' });
    } else {
      if (debt > 0 && debtRate >= 7.0 && soho) {
        var refiAmt = Math.min(debt, 5000);
        ladder.push({ step: ladder.length + 1, name: '소상공인 저금리 대환대출 (연 4.5% 고정 전환)', rate: '연 4.5%', limit: '최대 ' + fmt(refiAmt) + '만원', why: '보유 중인 연 ' + debtRate + '% 대출을 갈아타 연 약 ' + won(refiAmt * 10000 * (debtRate - 4.5) / 100) + ' 이자를 먼저 줄이세요.' });
      }
      ladder.push({ step: ladder.length + 1, name: '지자체 이차보전 + 지역신용보증재단 특례보증', rate: '실질 연 2.1~3.4%', limit: '약 ' + fmt(Math.min(policyCap, 7000)) + '만원 이내', why: '이자를 지자체가 1.0~2.5%p 보전해 주므로 대한민국에서 가장 금리가 낮은 1순위 자금입니다.' });
      if (soho) {
        ladder.push({ step: ladder.length + 1, name: '소진공 일반경영안정 · 혁신성장촉진자금', rate: '연 3.2~3.9%', limit: '운전 7,000만 / 시설·혁신 최대 2억', why: '보증재단 한도와 별개로 직접대출 트랙을 활용하면 총 한도를 한 단계 더 넓힐 수 있습니다.' });
      } else {
        ladder.push({ step: ladder.length + 1, name: '중진공 중소기업 정책자금 · 신보/기보 보증', rate: '연 2.9~4.1%', limit: '매출·설비 규모별 산정', why: '상시근로자 5인 이상 사업장은 소진공 대신 중진공·신용보증기금 기업 보증이 주력 창구입니다.' });
      }
      if (collateral === 'realestate' && collateralCap > 0) {
        ladder.push({ step: ladder.length + 1, name: '제1금융권 사업자 부동산 담보대출', rate: '연 4.1~5.3%', limit: '추정 여력 약 ' + fmt(collateralCap) + '만원', why: '보유 부동산 담보 여력을 사업자 시설·운전자금으로 설정하면 신용대출보다 금리가 1.5~3%p 낮고 한도가 큽니다.' });
      } else if (collateral === 'securities' && collateralCap > 0) {
        ladder.push({ step: ladder.length + 1, name: '증권사 예탁증권 담보대출 (단기 브릿지)', rate: '연 5.4~8.2%', limit: '추정 여력 약 ' + fmt(collateralCap) + '만원', why: '급하게 물품대금·보증금을 치러야 할 때 당일 실행되며 중도상환수수료 없이 단기 상환이 가능합니다(담보비율 주의).' });
      }
      ladder.push({ step: ladder.length + 1, name: '주거래 시중·인터넷은행 카드가맹점 우대 한도대출', rate: '연 5.2~8.4%', limit: '추정 약 ' + fmt(salesCreditCap) + '만원', why: '카드 매출 입금계좌를 한 은행으로 집중하면 마이너스통장(한도대출) 금리 감면과 한도 우대를 받을 수 있습니다.' });
    }

    var refiAnnualSave = (!arrears && debt > 0 && debtRate >= 7.0 && soho) ? Math.min(debt, 5000) * 10000 * (debtRate - 4.5) / 100 : 0;

    return {
      purpose: purpose, sales: sales, credit: credit, collateral: collateral, colVal: colVal,
      debt: debt, debtRate: debtRate, arrears: arrears, soho: soho,
      grade: grade, gradeLabel: gradeLabel,
      policyCap: policyCap, salesCreditCap: salesCreditCap, collateralCap: collateralCap,
      netAdditionalLimit: netAdditionalLimit, refiAnnualSave: refiAnnualSave, ladder: ladder
    };
  }

  /* ───────── 인라인 미니 계산기 ───────── */
  function fmt(v, d) {
    if (v == null || !Number.isFinite(v)) return '-';
    return Number(v).toLocaleString('ko-KR', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 });
  }
  var won = function (v) { return (v < 0 ? '−' : '') + fmt(Math.abs(Math.round(v))) + '원'; };
  var pct = function (v, d) { return v == null || !Number.isFinite(v) ? '-' : fmt(v, d == null ? 1 : d) + '%'; };
  var manwon = function (v) { return (v < 0 ? '−' : '') + fmt(Math.abs(Math.round(v))) + '만원'; };

  var MINI = {
    'delivery-net': {
      inputs: [['price', '메뉴 판매가', 8000, 60000, 100, '원'], ['fee', '중개수수료', 0, 15, 0.1, '%'], ['dfee', '사장님 부담 배달비', 0, 5000, 100, '원'], ['cost', '식자재·포장 원가', 1000, 30000, 100, '원']],
      calc: function (v) {
        var r = delivery({ plan: 'custom', price: v.price, fee: v.fee, dfee: v.dfee, cost: v.cost, card: 3, vat: 1, promo: 0 });
        return [['1주문 순수익', won(r.net), r.net >= 0 ? 'good' : 'bad'], ['순마진율', pct(r.margin), r.margin >= 15 ? 'good' : r.margin >= 5 ? 'warn' : 'bad'], ['중개+결제수수료', won(r.commission + r.cardFee)], ['부가세(1/11)', won(r.vat)]];
      }
    },
    'delivery-compare': {
      inputs: [['price', '메뉴 판매가', 8000, 60000, 100, '원'], ['cost', '식자재·포장 원가', 1000, 30000, 100, '원']],
      calc: function (v) {
        return ['baemin-78', 'baemin-68b', 'baemin-20', 'coupang-98', 'yogiyo-97'].map(function (id) {
          var r = delivery({ plan: id, price: v.price, cost: v.cost, card: 3, vat: 1 });
          return [DELIVERY_PLANS[id].name, won(r.net) + ' (' + pct(r.margin) + ')', r.net >= 0 ? (r.margin >= 15 ? 'good' : 'warn') : 'bad'];
        });
      }
    },
    'target-price': {
      inputs: [['cost', '식자재·포장 원가', 1000, 30000, 100, '원'], ['fee', '중개수수료', 0, 15, 0.1, '%'], ['dfee', '사장님 부담 배달비', 0, 5000, 100, '원'], ['target', '목표 순마진율', 5, 40, 1, '%']],
      calc: function (v) {
        var r = delivery({ plan: 'custom', price: 20000, cost: v.cost, fee: v.fee, dfee: v.dfee, target: v.target, card: 3, vat: 1 });
        var chk = r.targetPrice ? delivery({ plan: 'custom', price: r.targetPrice, cost: v.cost, fee: v.fee, dfee: v.dfee, card: 3, vat: 1 }) : null;
        return [['목표 달성 메뉴가', r.targetPrice ? won(r.targetPrice) : '달성 불가(수수료 과다)', r.targetPrice ? 'good' : 'bad'], ['그 가격의 1주문 순수익', chk ? won(chk.net) : '-'], ['검산 순마진율', chk ? pct(chk.margin) : '-']];
      }
    },
    'breakeven-daily': {
      inputs: [['fixed', '월 고정비(임대료·인건비 등)', 1000000, 30000000, 100000, '원'], ['price', '평균 객단가', 5000, 80000, 500, '원'], ['margin', '변동이익률(원가·수수료 차감 후)', 5, 70, 1, '%'], ['days', '월 영업일', 15, 31, 1, '일']],
      calc: function (v) {
        var per = v.price * v.margin / 100;
        var monthly = per > 0 ? Math.ceil(v.fixed / per) : null;
        var daily = monthly ? Math.ceil(monthly / v.days) : null;
        return [['하루 손익분기 주문 수', daily ? fmt(daily) + '건' : '-', 'good'], ['월 손익분기 주문 수', monthly ? fmt(monthly) + '건' : '-'], ['월 손익분기 매출', monthly ? won(monthly * v.price) : '-'], ['1건당 공헌이익', won(per)]];
      }
    },
    'roas-breakeven': {
      inputs: [['price', '판매가', 5000, 200000, 100, '원'], ['cost', '개당 총변동비(원가+수수료+배송)', 1000, 180000, 100, '원']],
      calc: function (v) {
        var m = v.price - v.cost;
        var be = m > 0 ? v.price / m * 100 : null;
        return [['광고 전 개당 마진', won(m), m > 0 ? 'good' : 'bad'], ['마진율', pct(v.price ? m / v.price * 100 : 0)], ['손익분기 ROAS', be ? pct(be, 0) : '적자 구조', be ? (be <= 300 ? 'good' : be <= 500 ? 'warn' : 'bad') : 'bad'], ['최대 허용 CPA', won(Math.max(0, m))]];
      }
    },
    'landed-cost': {
      inputs: [['unit', '개당 사입가(위안)', 1, 500, 0.5, '¥'], ['fx', '적용 환율(원/위안)', 150, 250, 0.1, '원'], ['ship', '개당 해운·배대지 물류비', 0, 10000, 50, '원'], ['duty', '관세+수입부가세 합산', 0, 40, 0.5, '%']],
      calc: function (v) {
        var krw = v.unit * v.fx;
        var duty = (krw + v.ship) * v.duty / 100;
        var landed = krw + v.ship + duty;
        return [['개당 착지원가', won(landed), 'good'], ['원화 환산 사입가', won(krw)], ['관부가세', won(duty)], ['위안화 대비 배수', fmt(landed / Math.max(1, v.unit), 1) + '원/¥']];
      }
    },
    'return-loss': {
      inputs: [['price', '판매가', 5000, 200000, 100, '원'], ['margin', '반품 전 개당 순익', 0, 100000, 100, '원'], ['ret', '반품률', 0, 30, 0.5, '%'], ['retcost', '반품 1건당 손실(왕복배송·재포장·폐기)', 0, 50000, 100, '원']],
      calc: function (v) {
        var eff = v.margin * (1 - v.ret / 100) - v.retcost * v.ret / 100;
        var drop = v.margin > 0 ? (1 - eff / v.margin) * 100 : 0;
        return [['반품 반영 실질 개당 순익', won(eff), eff > 0 ? 'good' : 'bad'], ['마진 감소율', pct(drop), drop > 30 ? 'bad' : 'warn'], ['실질 순마진율', pct(v.price ? eff / v.price * 100 : 0)]];
      }
    },
    'refinance': {
      inputs: [['loan', '고금리 대출 잔액', 500, 10000, 100, '만원'], ['rate', '현재 금리', 7, 20, 0.1, '%']],
      calc: function (v) {
        var amt = Math.min(v.loan, 5000);
        var annual = amt * 10000 * (v.rate - 4.5) / 100;
        var ten = amortInterest(amt * 10000, v.rate, 10) - amortInterest(amt * 10000, 4.5, 10);
        return [['연간 이자 절감(첫해)', won(annual), 'good'], ['월 평균 절감', won(annual / 12)], ['10년 분할 총이자 절감', won(ten), 'good'], ['대환 적용액(한도 5,000만)', manwon(amt)]];
      }
    },
    'subsidy': {
      inputs: [['cost', '장비 공급가 합계', 100, 2000, 10, '만원'], ['rate', '국비 지원율', 50, 80, 5, '%']],
      calc: function (v) {
        var s = Math.min(v.cost * v.rate / 100, 500);
        return [['국비 지원액', manwon(s), 'good'], ['사장님 자부담', manwon(v.cost - s), 'warn'], ['실질 지원율', pct(v.cost ? s / v.cost * 100 : 0)], ['한도 초과 여부', v.cost * v.rate / 100 > 500 ? '500만원 한도 적용' : '한도 내']];
      }
    },
    'weekly-holiday': {
      inputs: [['wage', '시급 (26년 10,320 / 27년 10,700)', 10320, 20000, 10, '원'], ['hours', '주 근무시간', 1, 40, 0.5, '시간']],
      calc: function (v) {
        var yr = v.wage >= 10700 ? 2027 : 2026;
        var w = weeklyPay(v.wage, v.hours);
        var m = staffMonthly(v.wage, v.hours, true, yr);
        var m145 = staffMonthly(v.wage, 14.5, true, yr), m15 = staffMonthly(v.wage, 15, true, yr);
        return [['주휴수당(주)', won(w.holiday), v.hours >= 15 ? 'warn' : 'good'], ['월 인건비(4대보험 포함)', won(m.total)], ['14.5h → 15h 월 절벽', '+' + won(m15.total - m145.total), 'bad'], ['주휴 발생 여부', v.hours >= 15 ? '발생 (주 15시간 이상)' : '미발생']];
      }
    },
    'employer-cost': {
      inputs: [['pay', '월 급여(세전)', 500000, 5000000, 10000, '원']],
      calc: function (v) {
        var pen = v.pay * INS.pension / 100, hl = v.pay * INS.health / 100, ltc = hl * INS.ltcOfHealth / 100, em = v.pay * INS.employment / 100, ac = v.pay * INS.accident / 100;
        var tot26 = pen + hl + ltc + em + ac;
        var tot27 = v.pay * WAGE_YEARS[2027].insTotal / 100;
        return [['2026 사업주 4대보험(10.87%)', won(tot26), 'warn'], ['2027 사업주 4대보험(11.15%)', won(tot27), 'warn'], ['총 인건비(2026 급여+보험)', won(v.pay + tot26), 'good'], ['2027 인상 추가분(월)', '+' + won(tot27 - tot26)]];
      }
    },
    'payback': {
      inputs: [['invest', '초기 도입비(자부담)', 0, 20000000, 50000, '원'], ['saving', '월 순절감액', 10000, 3000000, 10000, '원']],
      calc: function (v) {
        var m = v.saving > 0 ? v.invest / v.saving : null;
        return [['원금회수 기간', m != null ? fmt(m, 1) + '개월' : '-', m != null && m <= 12 ? 'good' : 'warn'], ['1년 누적 순효과', won(v.saving * 12 - v.invest)], ['3년 누적 순효과', won(v.saving * 36 - v.invest), 'good']];
      }
    },
    'vat': {
      inputs: [['sales', '연 매출(공급대가)', 2000, 20000, 100, '만원'], ['buy', '매입 비율(과세 매입/매출)', 10, 80, 1, '%']],
      calc: function (v) {
        var s = v.sales * 10000, b = s * v.buy / 100;
        var general = Math.max(0, s / 11 - b / 11);
        var simple = Math.max(0, s * 0.15 * 0.1 - b * 0.005);
        var exempt = s < 48000000;
        var eligible = s < 104000000;
        return [['일반과세 연 부가세(세액공제전)', won(general)], ['간이과세 연 부가세(음식점 15%)', eligible ? (exempt ? '납부면제 (4,800만 미만)' : won(simple)) : '간이 불가(1억400만↑)', 'good'], ['차액', eligible ? won(general - (exempt ? 0 : simple)) : '-', 'warn']];
      }
    },
    'franchise-payback': {
      inputs: [['invest', '총 창업비(가맹비·인테리어·보증금 제외 후)', 3000, 50000, 100, '만원'], ['profit', '월 순익(점주 인건비 제외 후)', 50, 2000, 10, '만원']],
      calc: function (v) {
        var m = v.profit > 0 ? v.invest / v.profit : null;
        return [['투자 회수 기간', m ? fmt(m, 1) + '개월' : '-', m && m <= 24 ? 'good' : m && m <= 36 ? 'warn' : 'bad'], ['연 투자수익률', pct(v.invest ? v.profit * 12 / v.invest * 100 : 0)], ['3년 누적 순효과', manwon(v.profit * 36 - v.invest)]];
      }
    },
    'loan-payment': {
      inputs: [['loan', '대출 금액', 500, 20000, 100, '만원'], ['rate', '연 금리', 1, 15, 0.05, '%'], ['years', '총 기간', 2, 10, 1, '년'], ['grace', '거치 기간', 0, 3, 1, '년']],
      calc: function (v) {
        var P = v.loan * 10000, r = v.rate / 100 / 12, g = Math.min(v.grace, v.years - 1), m = (v.years - g) * 12;
        var graceMonthly = P * r;
        var pay = r > 0 ? P * r / (1 - Math.pow(1 + r, -m)) : P / m;
        var total = graceMonthly * g * 12 + pay * m - P;
        return [['거치기간 월 이자', won(graceMonthly)], ['상환기간 월 원리금', won(pay), 'warn'], ['총 이자 부담', won(total), 'bad']];
      }
    },
    'guarantee-fee': {
      inputs: [['loan', '보증 대출 금액', 500, 10000, 100, '만원'], ['rate', '은행 대출금리', 2, 10, 0.05, '%'], ['gfee', '보증료율', 0.5, 2, 0.05, '%'], ['sub', '지자체 이차보전', 0, 3, 0.1, '%p']],
      calc: function (v) {
        var eff = v.rate - v.sub + v.gfee;
        var P = v.loan * 10000;
        return [['실질 연 금융비용률', pct(eff, 2), 'good'], ['연 이자(이차보전 후)', won(P * (v.rate - v.sub) / 100)], ['연 보증료', won(P * v.gfee / 100)], ['연 총 금융비용', won(P * eff / 100), 'warn']];
      }
    }
  };

  function mini(type, values) {
    var def = MINI[type];
    if (!def) return [];
    var v = {};
    def.inputs.forEach(function (i) { v[i[0]] = n(values && values[i[0]], (i[2] + i[3]) / 2); });
    return def.calc(v);
  }

  return {
    WEEKS: WEEKS, WAGE_YEARS: WAGE_YEARS, MIN_WAGE_2026: MIN_WAGE_2026, MIN_WAGE_2027: MIN_WAGE_2027, INS: INS, INS_TOTAL: INS_TOTAL,
    DELIVERY_PLANS: DELIVERY_PLANS, DELIVERY_BIZ_SPECS: DELIVERY_BIZ_SPECS, MARKETS: MARKETS, VAT_INDS: VAT_INDS, LEASE_CAPS: LEASE_CAPS, REGION_GUARANTEE: REGION_GUARANTEE,
    delivery: delivery, seller: seller, policy: policy, labor: labor, vatIncome: vatIncome, storeLease: storeLease,
    startupMaster: startupMaster, loanDiagnose: loanDiagnose,
    weeklyPay: weeklyPay, staffMonthly: staffMonthly, amortInterest: amortInterest, progressiveTax: progressiveTax,
    MINI: MINI, mini: mini, fmt: fmt, won: won, pct: pct, manwon: manwon
  };
});
