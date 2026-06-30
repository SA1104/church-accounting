'use strict';
/**
 * Data Think Engine - ECOS (한국은행) 수집기
 * API: https://ecos.bok.or.kr/api/
 *
 * 지원 지표:
 * - 기준금리 (060Y001)
 * - 시장금리 (817Y002) - 국고채, 회사채, CD, CP, 콜금리
 * - 환율 (731Y001) - 원/달러, 원/엔, 원/유로
 * - M1 (010Y002), M2 (722Y001)
 * - CPI (901Y010), PPI (404Y013)
 */

require('dotenv').config();
const { BaseCollector } = require('./base');

const ECOS_BASE_URL = 'https://ecos.bok.or.kr/api';
const API_KEY = process.env.ECOS_API_KEY || 'sample';

/**
 * ECOS 통계 코드 매핑
 * format: { indicator_code: { stat_code, item_code, period, description } }
 */
const ECOS_STAT_MAP = {
  // === 금리 (일별) ===
  BOK_BASE_RATE: {
    stat_code: '722Y001', // 한국은행 기준금리 (정확한 코드 확인 필요)
    item_code: '0101000', // 기준금리
    period: 'D',
    frequency: 'daily',
  },
  KTB_1Y: {
    stat_code: '817Y002', item_code: '010200000', period: 'D', frequency: 'daily',
  },
  KTB_3Y: {
    stat_code: '817Y002', item_code: '010300000', period: 'D', frequency: 'daily',
  },
  KTB_5Y: {
    stat_code: '817Y002', item_code: '010400000', period: 'D', frequency: 'daily',
  },
  KTB_10Y: {
    stat_code: '817Y002', item_code: '010500000', period: 'D', frequency: 'daily',
  },
  CORP_AA: {
    stat_code: '817Y002', item_code: '020300000', period: 'D', frequency: 'daily',
  },
  CORP_BBB: {
    stat_code: '817Y002', item_code: '020400000', period: 'D', frequency: 'daily',
  },
  CD_91D: {
    stat_code: '817Y002', item_code: '030300000', period: 'D', frequency: 'daily',
  },
  CP_91D: {
    stat_code: '817Y002', item_code: '030500000', period: 'D', frequency: 'daily',
  },
  CALL_RATE: {
    stat_code: '817Y002', item_code: '050100000', period: 'D', frequency: 'daily',
  },

  // === 환율 (일별) ===
  KRW_USD: {
    stat_code: '731Y001', item_code: '0000001', period: 'D', frequency: 'daily',
  },
  KRW_JPY: {
    stat_code: '731Y001', item_code: '0000002', period: 'D', frequency: 'daily',
  },
  KRW_EUR: {
    stat_code: '731Y001', item_code: '0000003', period: 'D', frequency: 'daily',
  },

  // === 통화 (월별) ===
  M1: {
    stat_code: '010Y002', item_code: 'BBSA00', period: 'M', frequency: 'monthly',
  },
  M2: {
    stat_code: '722Y001', item_code: 'BBSA00', period: 'M', frequency: 'monthly',
  },

  // === 물가 (월별) ===
  CPI: {
    stat_code: '901Y010', item_code: '0', period: 'M', frequency: 'monthly',
  },
  PPI: {
    stat_code: '404Y013', item_code: '10000', period: 'M', frequency: 'monthly',
  },

  // === 경상수지 (월별) ===
  CURRENT_ACCOUNT: {
    stat_code: '301Y017', item_code: 'W_CA', period: 'M', frequency: 'monthly',
  },
};

class EcosCollector extends BaseCollector {
  constructor(frequency = 'daily') {
    const jobCode = frequency === 'daily' ? 'ECOS_DAILY'
      : frequency === 'monthly' ? 'ECOS_MONTHLY'
        : 'ECOS_QUARTERLY';
    super(jobCode, 'ECOS');
    this.frequency = frequency;
  }

  /**
   * ECOS API StatisticSearch 호출
   * URL: /api/StatisticSearch/{API_KEY}/json/kr/{start}/{end}/{statCode}/{period}/{startDate}/{endDate}/{itemCode}
   */
  async fetchEcosData(statCode, itemCode, period, startDate, endDate) {
    const url = [
      ECOS_BASE_URL,
      'StatisticSearch',
      API_KEY,
      'json',
      'kr',
      '1',    // 시작 번호
      '1000', // 최대 반환 건수
      statCode,
      period,
      startDate,
      endDate,
      itemCode,
    ].join('/');

    const raw = await this.fetchWithRetry(url);

    // 오류 체크
    if (raw.RESULT) {
      const code = raw.RESULT.CODE;
      if (code !== 'INFO-000') {
        throw new Error(`ECOS API 오류: ${code} - ${raw.RESULT.MESSAGE}`);
      }
    }

    const rows = raw.StatisticSearch?.row || [];
    this.stats.rows_fetched += rows.length;
    return rows;
  }

  /**
   * 날짜 범위 계산
   */
  getDateRange() {
    const now = new Date();
    let startDate, endDate;

    if (this.frequency === 'daily') {
      // 최근 5영업일
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      startDate = this.formatDate(start);
      endDate = this.formatDate(now);
    } else if (this.frequency === 'monthly') {
      // 최근 3개월
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      startDate = this.formatDate(start, 'YYYYMM');
      endDate = this.formatDate(now, 'YYYYMM');
    } else if (this.frequency === 'quarterly') {
      // 최근 2년
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 2);
      startDate = this.formatDate(start, 'YYYYMM');
      endDate = this.formatDate(now, 'YYYYMM');
    }

    return { startDate, endDate };
  }

  async collect() {
    const { startDate, endDate } = this.getDateRange();

    // 이 frequency에 해당하는 지표만 수집
    const targetIndicators = Object.entries(ECOS_STAT_MAP)
      .filter(([_, config]) => config.frequency === this.frequency);

    for (const [indicatorCode, config] of targetIndicators) {
      try {
        console.log(`[ECOS] 수집 중: ${indicatorCode}`);

        const indicatorId = await this.getIndicatorId(indicatorCode);
        if (!indicatorId) {
          console.warn(`[ECOS] 지표 ID 없음: ${indicatorCode}`);
          continue;
        }

        const rows = await this.fetchEcosData(
          config.stat_code,
          config.item_code,
          config.period,
          startDate,
          endDate,
        );

        for (const row of rows) {
          // TIME 형식: 'YYYYMMDD' or 'YYYYMM' or 'YYYY'
          const time = row.TIME || '';
          let periodDate;
          if (time.length === 8) {
            periodDate = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;
          } else if (time.length === 6) {
            periodDate = `${time.slice(0, 4)}-${time.slice(4, 6)}-01`;
          } else if (time.length === 4) {
            periodDate = `${time}-01-01`;
          } else {
            continue;
          }

          await this.upsertObservation(
            indicatorId,
            periodDate,
            row.DATA_VALUE,
            '',
            { raw_payload: row },
          );
        }

        // Rate limit 방지: 지표 간 300ms 간격
        await this.sleep(300);
      } catch (error) {
        console.error(`[ECOS] 지표 ${indicatorCode} 수집 실패:`, error.message);
        this.stats.rows_failed++;
      }
    }
  }
}

module.exports = EcosCollector;

// 직접 실행 시 테스트
if (require.main === module) {
  const collector = new EcosCollector('daily');
  collector.run()
    .then(() => console.log('ECOS 수집 완료'))
    .catch(console.error);
}
