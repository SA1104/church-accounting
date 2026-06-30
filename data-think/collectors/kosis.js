'use strict';
/**
 * Data Think Engine - KOSIS (국가통계포털) 수집기
 * API: https://kosis.kr/openapi/statisticsData.do
 *
 * 수집 대상:
 * - 소비자물가지수 (CPI)
 * - 고용률, 실업률
 * - 산업생산지수
 * - 소매판매
 * - 건설수주
 * - 인구, 세대수
 */

require('dotenv').config();
const { BaseCollector } = require('./base');

const KOSIS_BASE_URL = 'https://kosis.kr/openapi/statisticsData.do';
const API_KEY = process.env.KOSIS_API_KEY;

/**
 * KOSIS 통계표 코드 매핑
 * 참고: 정확한 userStatsId는 KOSIS 홈페이지 통계표 URL 또는
 *       statisticsList.do API에서 확인 필요
 *
 * format: { indicator_code: { orgId, tblId, prdSe, objL1, itmId } }
 */
const KOSIS_STAT_MAP = {
  // 소비자물가지수 (월별)
  // 참고: https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1J00001
  LIVING_PRICE_INDEX: {
    orgId: '101',
    tblId: 'DT_1J00001',
    prdSe: 'M',
    objL1: 'ALL',
    itmId: 'T10',
    frequency: 'monthly',
  },

  // 고용통계 (월별)
  // 참고: 경제활동인구조사
  EMPLOYMENT_RATE: {
    orgId: '101',
    tblId: 'DT_1DA7001',
    prdSe: 'M',
    objL1: '000',
    itmId: 'T2',
    frequency: 'monthly',
  },
  UNEMPLOYMENT_RATE: {
    orgId: '101',
    tblId: 'DT_1DA7001',
    prdSe: 'M',
    objL1: '000',
    itmId: 'T4',
    frequency: 'monthly',
  },
  LABOR_PARTICIPATION: {
    orgId: '101',
    tblId: 'DT_1DA7001',
    prdSe: 'M',
    objL1: '000',
    itmId: 'T1',
    frequency: 'monthly',
  },

  // 산업생산지수 (월별)
  INDUSTRIAL_PRODUCTION: {
    orgId: '101',
    tblId: 'DT_1J22001',
    prdSe: 'M',
    objL1: 'ALL',
    itmId: 'T10',
    frequency: 'monthly',
  },

  // 소매판매액 (월별)
  RETAIL_SALES: {
    orgId: '101',
    tblId: 'DT_1J14001',
    prdSe: 'M',
    objL1: 'ALL',
    itmId: 'T1',
    frequency: 'monthly',
  },

  // 인구 (연별)
  POPULATION: {
    orgId: '101',
    tblId: 'DT_1IN1503',
    prdSe: 'Y',
    objL1: '000',
    itmId: 'T1',
    frequency: 'yearly',
  },
};

class KosisCollector extends BaseCollector {
  constructor(frequency = 'monthly') {
    const jobCode = frequency === 'yearly' ? 'KOSIS_YEARLY' : 'KOSIS_MONTHLY';
    super(jobCode, 'KOSIS');
    this.frequency = frequency;
  }

  async fetchKosisData(config) {
    if (!API_KEY) {
      throw new Error('KOSIS_API_KEY 환경변수가 설정되지 않았습니다.');
    }

    // KOSIS userStatsId 형식: orgId/tblId/분류코드들/항목코드
    const userStatsId = `${config.orgId}/${config.tblId}/A/A/${config.objL1}/A/${config.itmId}`;

    const params = {
      method: 'getList',
      apiKey: API_KEY,
      format: 'json',
      jsonVD: 'Y',
      userStatsId,
      prdSe: config.prdSe,
      newEstPrdCnt: this.frequency === 'monthly' ? '6' : '3', // 최근 N개 시점
    };

    const raw = await this.fetchWithRetry(KOSIS_BASE_URL, params);

    // KOSIS 에러 처리
    if (!Array.isArray(raw)) {
      console.warn('[KOSIS] 예상치 못한 응답 형식:', JSON.stringify(raw).slice(0, 200));
      return [];
    }

    this.stats.rows_fetched += raw.length;
    return raw;
  }

  /**
   * KOSIS 날짜 형식 변환
   * 월별: '202312' -> '2023-12-01'
   * 연별: '2023' -> '2023-01-01'
   */
  parsePeriodDate(time, prdSe) {
    if (!time) return null;
    if (prdSe === 'M' && time.length === 6) {
      return `${time.slice(0, 4)}-${time.slice(4, 6)}-01`;
    }
    if (prdSe === 'Y' && time.length === 4) {
      return `${time}-01-01`;
    }
    if (prdSe === 'Q' && time.length === 7) {
      // '2023Q1' -> '2023-01-01'
      const quarter = parseInt(time.slice(5), 10);
      const month = String((quarter - 1) * 3 + 1).padStart(2, '0');
      return `${time.slice(0, 4)}-${month}-01`;
    }
    return null;
  }

  async collect() {
    const targetIndicators = Object.entries(KOSIS_STAT_MAP)
      .filter(([_, config]) => config.frequency === this.frequency);

    for (const [indicatorCode, config] of targetIndicators) {
      try {
        console.log(`[KOSIS] 수집 중: ${indicatorCode}`);

        const indicatorId = await this.getIndicatorId(indicatorCode);
        if (!indicatorId) {
          console.warn(`[KOSIS] 지표 ID 없음: ${indicatorCode}`);
          continue;
        }

        const rows = await this.fetchKosisData(config);

        for (const row of rows) {
          // KOSIS 응답의 시점 필드 (PRD_DE 또는 C1_NM 등)
          const time = row.PRD_DE || row.PRD_SE || '';
          const periodDate = this.parsePeriodDate(time, config.prdSe);
          if (!periodDate) continue;

          const value = row.DT; // 데이터 값 필드

          await this.upsertObservation(
            indicatorId,
            periodDate,
            value,
            '',
            { raw_payload: row },
          );
        }

        await this.sleep(500); // Rate Limit 방지
      } catch (error) {
        console.error(`[KOSIS] 지표 ${indicatorCode} 수집 실패:`, error.message);
        this.stats.rows_failed++;
      }
    }
  }
}

module.exports = KosisCollector;

// 직접 실행 시 테스트
if (require.main === module) {
  const collector = new KosisCollector('monthly');
  collector.run()
    .then(() => console.log('KOSIS 수집 완료'))
    .catch(console.error);
}
