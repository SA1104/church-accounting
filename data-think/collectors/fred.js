'use strict';
/**
 * Data Think Engine - FRED 글로벌 지표 수집기
 * API: https://api.stlouisfed.org/fred/series/observations
 *
 * 수집 대상 (일별):
 * - FEDFUNDS  : 미국 기준금리 (연방기금금리)
 * - DGS2      : 미국 국채 2년물 수익률
 * - DGS10     : 미국 국채 10년물 수익률
 * - SP500     : S&P 500 지수
 * - VIXCLS    : VIX 공포지수
 * - DCOILWTICO: WTI 원유 현물가
 * - DTWEXBGS  : 달러 인덱스 (무역가중 달러 인덱스)
 * - T10Y2Y    : 장단기 금리차 (10년 - 2년)
 * - DJIA      : 다우존스 산업평균지수
 * - NASDAQCOM : 나스닥 종합지수
 * - RU2000TR  : 러셀 2000 지수 (TR)
 *
 * API 제한:
 * - 1분당 최대 120 요청 (실질적으로 초당 2건)
 * - 무료 API 키: https://fred.stlouisfed.org/docs/api/api_key.html
 * - 데이터 업데이트 시점: 매일 갱신 (시계열에 따라 다름)
 * - '.' 값은 결측값(데이터 없음)으로 처리
 */

require('dotenv').config();
const { BaseCollector } = require('./base');

// ──────────────────────────────────────────────
// 상수 정의
// ──────────────────────────────────────────────

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

/**
 * FRED 시계열 ID → 내부 indicator_code 매핑
 * fred_series_id: FRED에서 사용하는 고유 시계열 코드
 * indicator_code: Data Think DB의 indicators 테이블 indicator_code 값
 */
const FRED_SERIES_MAP = {
  // 금리
  'FEDFUNDS':   'FED_FUNDS_RATE',   // 미국 연방기금금리 (실효)
  'DGS2':       'US_TREASURY_2Y',   // 미국채 2년물
  'DGS10':      'US_TREASURY_10Y',  // 미국채 10년물
  'T10Y2Y':     'US_YIELD_SPREAD',  // 장단기금리차 (10Y-2Y)

  // 주식 지수
  'SP500':      'SP500',            // S&P 500
  'DJIA':       'DJIA',            // 다우존스 산업평균
  'NASDAQCOM':  'NASDAQ',          // 나스닥 종합
  'RU2000TR':   'RUSSELL2000',     // 러셀 2000 (TR)

  // 시장 변동성/위험
  'VIXCLS':     'VIX',             // CBOE 변동성 지수

  // 원자재
  'DCOILWTICO': 'WTI_OIL',        // WTI 원유 현물가 (달러/배럴)

  // 달러
  'DTWEXBGS':   'DXY_GLOBAL',     // 무역가중 달러지수 (글로벌)
};

/**
 * 시계열 단위 정보 (DB 저장 시 참고)
 * 실제 unit 값은 FRED series 메타데이터에서 가져올 수 있으나,
 * 편의상 하드코딩
 */
const FRED_UNIT_MAP = {
  'FEDFUNDS':   '%',
  'DGS2':       '%',
  'DGS10':      '%',
  'T10Y2Y':     '% points',
  'SP500':      'Index',
  'DJIA':       'Index',
  'NASDAQCOM':  'Index',
  'RU2000TR':   'Index',
  'VIXCLS':     'Index',
  'DCOILWTICO': 'USD/Barrel',
  'DTWEXBGS':   'Index Jan 2006=100',
};

/** 요청 간 대기 시간 (ms) - 120req/min 제한 준수를 위해 600ms */
const REQUEST_INTERVAL_MS = 600;

/** 수집 기간 (일): 최근 30일 */
const OBSERVATION_DAYS = 30;

// ──────────────────────────────────────────────
// FRED 수집기 클래스
// ──────────────────────────────────────────────

class FredCollector extends BaseCollector {
  constructor() {
    super('FRED_DAILY', 'FRED');
    this.apiKey = process.env.FRED_API_KEY;

    if (!this.apiKey) {
      console.warn('[FRED] 경고: FRED_API_KEY 환경변수가 설정되지 않았습니다.');
      console.warn('[FRED]  → https://fred.stlouisfed.org/docs/api/api_key.html 에서 발급받으세요.');
    }
  }

  // ────────────────────────────────────────────
  // FRED API 호출
  // ────────────────────────────────────────────

  /**
   * FRED 시계열 관측값 조회
   * @param {string} seriesId - FRED 시계열 코드 (예: 'DGS10')
   * @param {string} observationStart - 조회 시작일 (YYYY-MM-DD)
   * @param {string} observationEnd - 조회 종료일 (YYYY-MM-DD)
   * @returns {Array} 관측값 배열 [{date, value}, ...]
   */
  async fetchFredSeries(seriesId, observationStart, observationEnd) {
    const params = {
      series_id: seriesId,
      api_key: this.apiKey,
      file_type: 'json',
      observation_start: observationStart,
      observation_end: observationEnd,
      sort_order: 'asc',   // 날짜 오름차순
      limit: 1000,          // 최대 반환 건수
    };

    const raw = await this.fetchWithRetry(FRED_BASE_URL, params);

    if (!raw || !raw.observations) {
      throw new Error(`FRED 응답 오류: 시계열 '${seriesId}'에 observations 없음`);
    }

    const observations = raw.observations;
    this.stats.rows_fetched += observations.length;

    console.log(`[FRED] ${seriesId}: ${observations.length}개 관측값 수신`);
    return observations;
  }

  // ────────────────────────────────────────────
  // 날짜 유틸리티
  // ────────────────────────────────────────────

  /**
   * 최근 N일의 날짜 범위 반환
   * @returns {{ start: string, end: string }} YYYY-MM-DD 형식
   */
  getDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - OBSERVATION_DAYS);

    return {
      start: this.formatDate(start, 'YYYY-MM-DD'),
      end:   this.formatDate(end,   'YYYY-MM-DD'),
    };
  }

  // ────────────────────────────────────────────
  // 메인 수집 로직
  // ────────────────────────────────────────────

  async collect() {
    if (!this.apiKey) {
      throw new Error('FRED_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }

    const { start, end } = this.getDateRange();
    console.log(`[FRED] 수집 기간: ${start} ~ ${end}`);

    const seriesEntries = Object.entries(FRED_SERIES_MAP);

    for (const [seriesId, indicatorCode] of seriesEntries) {
      console.log(`[FRED] 수집 중: ${seriesId} → ${indicatorCode}`);

      try {
        // 내부 indicator_id 조회
        const indicatorId = await this.getIndicatorId(indicatorCode);
        if (!indicatorId) {
          console.warn(`[FRED] 지표 ID 없음: ${indicatorCode} (DB에 indicators 시드 필요)`);
          continue;
        }

        // FRED API 호출
        const observations = await this.fetchFredSeries(seriesId, start, end);

        // 관측값 처리
        let savedCount = 0;
        for (const obs of observations) {
          const date  = obs.date;   // 'YYYY-MM-DD' 형식
          const value = obs.value;  // 문자열, 결측값은 '.'

          // FRED 결측값 처리: '.' 또는 빈 문자열은 저장하지 않음
          if (value === '.' || value === null || value === undefined || value === '') {
            continue;
          }

          const saved = await this.upsertObservation(
            indicatorId,
            date,
            parseFloat(value),
            '',   // region: 미국 지표는 지역 구분 없음
            {
              country: 'US',
              unit: FRED_UNIT_MAP[seriesId] || null,
              raw_payload: {
                series_id:   seriesId,
                date:        date,
                value:       value,
                realtime_st: obs.realtime_start,
                realtime_ed: obs.realtime_end,
              },
            }
          );

          if (saved) savedCount++;
        }

        console.log(`[FRED] ${seriesId}: ${savedCount}개 저장 완료`);

        // 시계열 간 600ms 대기 (120req/min 제한 준수)
        await this.sleep(REQUEST_INTERVAL_MS);

      } catch (err) {
        console.error(`[FRED] ${seriesId} 수집 실패:`, err.message);
        this.stats.rows_failed++;

        // 오류 발생 시에도 다음 시계열 전 대기
        await this.sleep(REQUEST_INTERVAL_MS);
      }
    }

    console.log('[FRED] 전체 수집 완료:', this.stats);
  }
}

module.exports = FredCollector;

// 직접 실행 시 테스트
if (require.main === module) {
  const collector = new FredCollector();
  collector.run()
    .then(() => console.log('[FRED] 수집 완료'))
    .catch(console.error);
}
