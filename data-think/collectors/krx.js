'use strict';
/**
 * Data Think Engine - KRX (한국거래소) 수집기
 * 방식: KRX 공개 HTTP API (data.krx.co.kr 직접 요청)
 *
 * 수집 대상:
 * 1. 종목 목록 (KOSPI / KOSDAQ 전체) → securities 테이블 upsert
 * 2. 일봉 데이터 (시가총액 상위 100개)  → security_prices_daily 테이블 upsert
 * 3. 시장 지수 (KOSPI, KOSDAQ, KOSPI200) → indicator_observations 테이블 upsert
 * 4. 투자자별 수급 (외국인/기관/개인)   → indicator_observations 테이블 upsert
 *
 * KRX 공개 API 주의사항:
 *  - 별도 API 키 불필요 (공개 데이터)
 *  - User-Agent 설정 필수 (미설정 시 차단될 수 있음)
 *  - 과도한 요청 시 IP 차단 위험 → 요청 간 sleep 필수
 *  - 장 마감 후 (~17:00 KST) 데이터가 갱신됨
 */

require('dotenv').config();
const { BaseCollector, supabase } = require('./base');

// ──────────────────────────────────────────────
// 상수 정의
// ──────────────────────────────────────────────

const KRX_BASE_URL = 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';

/** KRX 요청 시 필요한 공통 헤더 */
const KRX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'http://data.krx.co.kr/',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
};

/** Yahoo Finance fallback 기본 URL */
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

/**
 * KRX 시장 코드 정의
 * STK = 유가증권시장 (KOSPI)
 * KSQ = 코스닥시장 (KOSDAQ)
 */
const MARKETS = [
  { mktId: 'STK', market: 'KOSPI',  name: '유가증권시장' },
  { mktId: 'KSQ', market: 'KOSDAQ', name: '코스닥시장' },
];

/**
 * 시장 지수 코드 매핑
 * indicator_code → KRX 지수 코드 (idxIndMktClss + idxIndClss)
 */
const INDEX_MAP = [
  { indicatorCode: 'KOSPI',    idxIndMktClss: '1', idxIndClss: '001' },
  { indicatorCode: 'KOSDAQ',   idxIndMktClss: '2', idxIndClss: '001' },
  { indicatorCode: 'KOSPI200', idxIndMktClss: '1', idxIndClss: '028' },
];

// ──────────────────────────────────────────────
// KRX 수집기 클래스
// ──────────────────────────────────────────────

class KrxCollector extends BaseCollector {
  constructor() {
    super('KRX_DAILY_PRICE', 'KRX');
    /** 수집 날짜 (거래일 기준, 기본: 어제) */
    this.tradeDate = null;
  }

  // ────────────────────────────────────────────
  // 유틸리티 메서드
  // ────────────────────────────────────────────

  /**
   * KRX POST 요청 래퍼 (form-urlencoded 방식)
   * KRX API는 GET이 아닌 POST + form body 방식으로만 응답함
   * @param {Object} body - form 파라미터
   * @returns {Object} 응답 JSON
   */
  async fetchKrx(body) {
    const formData = new URLSearchParams(body).toString();
    const data = await this.postWithRetry(KRX_BASE_URL, formData, KRX_HEADERS);
    return data;
  }

  /**
   * 숫자 문자열 파싱 (콤마 제거 후 float 변환)
   * @param {string} str
   * @returns {number|null}
   */
  parseNum(str) {
    if (str === null || str === undefined || str === '' || str === '-') return null;
    const n = parseFloat(String(str).replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }

  /**
   * Yahoo Finance에서 한국 주식 데이터 가져오기 (KRX 실패 시 fallback)
   * ticker: '005930' → Yahoo symbol: '005930.KS' (KOSPI), '005930.KQ' (KOSDAQ)
   * @param {string} ticker - 종목 코드 (6자리)
   * @param {string} market - 'KOSPI' | 'KOSDAQ'
   * @returns {Object|null} price data or null
   */
  async fetchYahooFinance(ticker, market) {
    const suffix = market === 'KOSDAQ' ? '.KQ' : '.KS';
    const symbol = `${ticker}${suffix}`;
    const url = `${YAHOO_BASE_URL}/${symbol}`;

    try {
      const data = await this.fetchWithRetry(url, {
        interval: '1d',
        range: '5d',
      }, {
        'User-Agent': 'Mozilla/5.0',
      });

      const result = data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta || {};
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};

      if (timestamps.length === 0) return null;

      // 가장 최근 거래일 데이터 사용
      const lastIdx = timestamps.length - 1;
      return {
        open: quotes.open?.[lastIdx],
        high: quotes.high?.[lastIdx],
        low: quotes.low?.[lastIdx],
        close: quotes.close?.[lastIdx],
        volume: quotes.volume?.[lastIdx],
        market_cap: meta.marketCap || null,
        adjusted_close: result.indicators?.adjclose?.[0]?.adjclose?.[lastIdx] || null,
        source: 'yahoo_finance',
      };
    } catch (err) {
      console.warn(`[KRX] Yahoo Finance 조회 실패 (${symbol}):`, err.message);
      return null;
    }
  }

  // ────────────────────────────────────────────
  // 종목 목록 수집
  // ────────────────────────────────────────────

  /**
   * KRX에서 전체 종목 목록 조회
   * bld: dbms/MDC/STAT/standard/MDCSTAT01901 (상장주식정보)
   * @param {string} mktId - 'STK' (KOSPI) | 'KSQ' (KOSDAQ)
   * @param {string} trdDd - 거래일 (YYYYMMDD)
   * @returns {Array} 종목 목록
   */
  async fetchStockList(mktId, trdDd) {
    const body = {
      bld: 'dbms/MDC/STAT/standard/MDCSTAT01901',
      mktId,
      trdDd,
      share: '1',   // 주식수 포함
      money: '1',   // 금액 단위 (억원)
      csvxls_isNo: 'false',
    };

    const raw = await this.fetchKrx(body);
    const rows = raw?.OutBlock_1 || raw?.output || [];
    this.stats.rows_fetched += rows.length;
    return rows;
  }

  /**
   * 종목 목록 → securities 테이블 upsert
   * ON CONFLICT: ticker + market
   * @param {Array} rows - KRX 응답 rows
   * @param {string} market - 'KOSPI' | 'KOSDAQ'
   */
  async upsertSecurities(rows, market) {
    for (const row of rows) {
      const ticker = row.ISU_SRT_CD || row.isuSrtCd || '';
      const isin   = row.ISU_CD || row.isuCd || '';
      const name   = row.ISU_ABBRV || row.isuAbbrv || '';
      const mktCap = this.parseNum(row.MKTCAP || row.mktcap);

      if (!ticker || !name) continue;

      const record = {
        ticker,
        isin,
        name_ko: name,
        name_en: name,   // 영문명은 KRX에서 별도 제공 안 함
        market,
        country: 'KR',
        currency: 'KRW',
        asset_type: 'stock',
        market_cap: mktCap,
        is_active: true,
        raw_payload_json: row,
        collected_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('securities')
        .upsert(record, {
          onConflict: 'ticker,market',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`[KRX] 종목 upsert 실패 (${ticker}):`, error.message);
        this.stats.rows_failed++;
      } else {
        this.stats.rows_inserted++;
      }
    }
  }

  // ────────────────────────────────────────────
  // 일봉 데이터 수집
  // ────────────────────────────────────────────

  /**
   * 시가총액 상위 100개 종목 조회 (DB에서)
   * @param {string} market
   * @returns {Array} 종목 목록 [{id, ticker, isin, name_ko}]
   */
  async getTop100Securities(market) {
    const { data, error } = await supabase
      .from('securities')
      .select('id, ticker, isin, name_ko')
      .eq('market', market)
      .eq('is_active', true)
      .order('market_cap', { ascending: false })
      .limit(100);

    if (error) {
      console.error(`[KRX] top100 조회 실패 (${market}):`, error.message);
      return [];
    }
    return data || [];
  }

  /**
   * 개별 종목 일봉 데이터 조회
   * bld: dbms/MDC/STAT/standard/MDCSTAT02201 (주식 일별 매매정보)
   * @param {string} isuCd - ISIN 코드
   * @param {string} trdDd - 거래일 (YYYYMMDD)
   * @returns {Object|null} 일봉 데이터
   */
  async fetchDailyPrice(isuCd, trdDd) {
    const body = {
      bld: 'dbms/MDC/STAT/standard/MDCSTAT02201',
      isuCd,
      strtDd: trdDd,
      endDd: trdDd,
      adjStkPrc_check: 'N',  // 수정주가 미적용
      csvxls_isNo: 'false',
    };

    try {
      const raw = await this.fetchKrx(body);
      const rows = raw?.output || raw?.OutBlock_1 || [];
      if (rows.length === 0) return null;

      // 해당 날짜 행 찾기
      const row = rows.find((r) => (r.TRD_DD || r.trdDd || '').replace(/\//g, '') === trdDd)
        || rows[rows.length - 1];

      return row || null;
    } catch (err) {
      console.warn(`[KRX] 일봉 조회 실패 (${isuCd}):`, err.message);
      return null;
    }
  }

  /**
   * 일봉 데이터 → security_prices_daily 테이블 upsert
   * @param {Object} security - {id, ticker, isin}
   * @param {string} trdDd - 거래일 (YYYYMMDD)
   * @param {Object} row - KRX 응답 행
   */
  async processDailyPrice(security, trdDd, row) {
    // KRX 필드명 매핑 (대소문자 두 가지 가능)
    const get = (k1, k2) => row[k1] ?? row[k2] ?? null;

    const tradeDate = `${trdDd.slice(0, 4)}-${trdDd.slice(4, 6)}-${trdDd.slice(6, 8)}`;

    const priceData = {
      open:          this.parseNum(get('TDD_OPNPRC', 'tddOpnprc')),
      high:          this.parseNum(get('TDD_HGPRC',  'tddHgprc')),
      low:           this.parseNum(get('TDD_LWPRC',  'tddLwprc')),
      close:         this.parseNum(get('TDD_CLSPRC', 'tddClsprc')),
      volume:        this.parseNum(get('ACC_TRDVOL', 'accTrdvol')),
      trading_value: this.parseNum(get('ACC_TRDVAL', 'accTrdval')),
      market_cap:    this.parseNum(get('MKTCAP',     'mktcap')),
      change_rate:   this.parseNum(get('FLUC_RT',    'flucRt')),
      per:           this.parseNum(get('PER',        'per')),
      pbr:           this.parseNum(get('PBR',        'pbr')),
      eps:           this.parseNum(get('EPS',        'eps')),
      raw_payload:   row,
    };

    return this.upsertDailyPrice(security.id, tradeDate, priceData);
  }

  // ────────────────────────────────────────────
  // 시장 지수 수집
  // ────────────────────────────────────────────

  /**
   * KOSPI/KOSDAQ/KOSPI200 지수 데이터 조회
   * bld: dbms/MDC/STAT/standard/MDCSTAT00101 (주가지수 시세)
   * @param {string} trdDd - 거래일 (YYYYMMDD)
   */
  async collectMarketIndices(trdDd) {
    console.log('[KRX] 시장 지수 수집 시작...');

    const body = {
      bld: 'dbms/MDC/STAT/standard/MDCSTAT00101',
      strtDd: trdDd,
      endDd: trdDd,
      idxIndMktClss: '1',  // KOSPI 계열
      csvxls_isNo: 'false',
    };

    try {
      const raw = await this.fetchKrx(body);
      const rows = raw?.output || raw?.OutBlock_1 || [];

      for (const indexDef of INDEX_MAP) {
        const indicatorId = await this.getIndicatorId(indexDef.indicatorCode);
        if (!indicatorId) {
          console.warn(`[KRX] 지수 지표 없음: ${indexDef.indicatorCode}`);
          continue;
        }

        // 해당 지수 행 찾기
        const row = rows.find((r) =>
          (r.IDX_IND_NM || r.idxIndNm || '').includes(indexDef.indicatorCode)
        );

        if (!row) {
          console.warn(`[KRX] 지수 데이터 없음: ${indexDef.indicatorCode}`);
          continue;
        }

        const closeVal = this.parseNum(row.CLSPRC_IDX || row.clsprcIdx);
        const periodDate = `${trdDd.slice(0, 4)}-${trdDd.slice(4, 6)}-${trdDd.slice(6, 8)}`;

        await this.upsertObservation(indicatorId, periodDate, closeVal, '', {
          country: 'KR',
          raw_payload: row,
        });

        await this.sleep(200);
      }
    } catch (err) {
      console.error('[KRX] 시장 지수 수집 실패:', err.message);
    }
  }

  // ────────────────────────────────────────────
  // 투자자별 수급 수집
  // ────────────────────────────────────────────

  /**
   * KOSPI 투자자별 순매수 데이터 수집
   * bld: dbms/MDC/STAT/standard/MDCSTAT02303 (투자자별 거래실적)
   * 외국인, 기관, 개인의 순매수 금액을 지표로 저장
   * @param {string} trdDd - 거래일 (YYYYMMDD)
   */
  async collectInvestorFlow(trdDd) {
    console.log('[KRX] 투자자별 수급 수집 시작...');

    const body = {
      bld: 'dbms/MDC/STAT/standard/MDCSTAT02303',
      mktId: 'STK',  // KOSPI 기준
      strtDd: trdDd,
      endDd: trdDd,
      csvxls_isNo: 'false',
    };

    try {
      const raw = await this.fetchKrx(body);
      const rows = raw?.output || raw?.OutBlock_1 || [];
      if (rows.length === 0) return;

      const row = rows[rows.length - 1];  // 가장 최근 행
      const periodDate = `${trdDd.slice(0, 4)}-${trdDd.slice(4, 6)}-${trdDd.slice(6, 8)}`;

      // 투자자별 순매수 금액 (억원) 지표 코드 매핑
      const flowMap = [
        { code: 'KRX_NET_BUY_FOREIGN', field: 'FRNG_NETBID_TRDVAL' },
        { code: 'KRX_NET_BUY_INSTITUTION', field: 'ORGN_NETBID_TRDVAL' },
        { code: 'KRX_NET_BUY_INDIVIDUAL', field: 'INDV_NETBID_TRDVAL' },
      ];

      for (const { code, field } of flowMap) {
        const indicatorId = await this.getIndicatorId(code);
        if (!indicatorId) continue;

        const value = this.parseNum(row[field] || row[field.toLowerCase()]);
        await this.upsertObservation(indicatorId, periodDate, value, '', {
          country: 'KR',
          raw_payload: row,
        });
      }
    } catch (err) {
      console.error('[KRX] 투자자 수급 수집 실패:', err.message);
    }
  }

  // ────────────────────────────────────────────
  // 메인 수집 로직
  // ────────────────────────────────────────────

  async collect() {
    // 거래일 설정 (어제 날짜 기준)
    const yesterday = this.getYesterday();
    this.tradeDate = this.formatDate(yesterday); // YYYYMMDD

    console.log(`[KRX] 수집 대상 거래일: ${this.tradeDate}`);

    // ── Step 1: 종목 목록 갱신 ─────────────────────
    for (const { mktId, market } of MARKETS) {
      try {
        console.log(`[KRX] ${market} 종목 목록 수집 중...`);
        const rows = await this.fetchStockList(mktId, this.tradeDate);
        console.log(`[KRX] ${market} 종목 수: ${rows.length}`);
        await this.upsertSecurities(rows, market);
      } catch (err) {
        console.error(`[KRX] ${market} 종목 목록 수집 실패:`, err.message);
      }
      await this.sleep(500);
    }

    // ── Step 2: 시가총액 상위 100개 일봉 수집 ─────
    for (const { market } of MARKETS) {
      const top100 = await this.getTop100Securities(market);
      console.log(`[KRX] ${market} 상위 100 일봉 수집 시작 (${top100.length}개)`);

      for (const security of top100) {
        try {
          // KRX에서 일봉 조회 시도
          let row = await this.fetchDailyPrice(security.isin, this.tradeDate);

          if (row) {
            await this.processDailyPrice(security, this.tradeDate, row);
          } else {
            // KRX 실패 시 Yahoo Finance fallback
            console.warn(`[KRX] ${security.ticker} KRX 데이터 없음 → Yahoo Finance 시도`);
            const yahooData = await this.fetchYahooFinance(security.ticker, market);
            if (yahooData) {
              const tradeDate = `${this.tradeDate.slice(0, 4)}-${this.tradeDate.slice(4, 6)}-${this.tradeDate.slice(6, 8)}`;
              await this.upsertDailyPrice(security.id, tradeDate, yahooData);
            }
          }
        } catch (err) {
          console.error(`[KRX] 일봉 수집 실패 (${security.ticker}):`, err.message);
          this.stats.rows_failed++;
        }

        // 요청 간 500ms 대기 (KRX IP 차단 방지)
        await this.sleep(500);
      }
    }

    // ── Step 3: 시장 지수 수집 ─────────────────────
    await this.sleep(500);
    await this.collectMarketIndices(this.tradeDate);

    // ── Step 4: 투자자별 수급 수집 ─────────────────
    await this.sleep(500);
    await this.collectInvestorFlow(this.tradeDate);

    console.log(`[KRX] 전체 수집 완료:`, this.stats);
  }
}

module.exports = KrxCollector;

// 직접 실행 시 테스트
if (require.main === module) {
  const collector = new KrxCollector();
  collector.run()
    .then(() => console.log('[KRX] 수집 완료'))
    .catch(console.error);
}
