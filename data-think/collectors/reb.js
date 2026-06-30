'use strict';
/**
 * Data Think Engine - 한국부동산원 (REB) 부동산통계 수집기
 * API: https://www.reb.or.kr/r-one/openapi/SttsApiTbl.do
 *
 * 수집 대상:
 * - 아파트 매매가격지수 (전국, 서울, 수도권, 지방)
 * - 아파트 전세가격지수 (전국, 서울, 수도권, 지방)
 * - 주택 매매가격지수 (전국)
 * - 주택 전세가격지수 (전국)
 * - 아파트 거래량 (전국)
 *
 * ⚠️ 중요 주의사항:
 *  - API 키는 data.go.kr 공공데이터포털에서 발급 (DATA_GO_KR_API_KEY)
 *    또는 한국부동산원 R-ONE 포털에서 별도 발급 가능
 *  - STATBL_ID는 실제 포털에서 확인 필요 (아래 TODO 참조)
 *  - 데이터는 월별 발표 (매월 약 3~4주 후 발표)
 *  - 응답 형식: JSON (Type=json)
 *
 * 참고:
 *  - 한국부동산원 R-ONE 통계정보: https://www.reb.or.kr/r-one/statistics/statisticsR.do
 *  - API 가이드: https://www.reb.or.kr/r-one/openapi/guide.do
 */

require('dotenv').config();
const { BaseCollector } = require('./base');

// ──────────────────────────────────────────────
// 상수 정의
// ──────────────────────────────────────────────

const REB_BASE_URL = 'https://www.reb.or.kr/r-one/openapi/SttsApiTbl.do';

/**
 * 한국부동산원 통계표 코드(STATBL_ID) → 지표 매핑
 *
 * TODO: 아래 statbl_id 값은 플레이스홀더입니다.
 *       실제 STATBL_ID는 한국부동산원 R-ONE 포털에서 확인 필요:
 *       1. https://www.reb.or.kr/r-one/statistics/statisticsR.do 접속
 *       2. 원하는 통계표 선택 후 API 활용 신청
 *       3. 발급된 STATBL_ID를 아래 값에 대입
 *
 * 현재 알려진 실제 코드 (참고용, 변경될 수 있음):
 * - 아파트 매매가격지수: 'RT_APT_JEONSE_IDX' 계열
 * - 주간/월간 구분 주의
 */
const REB_STAT_MAP = {
  // ── 아파트 매매가격지수 ──────────────────────
  'APT_SALE_INDEX_NATIONAL': {
    // TODO: 실제 STATBL_ID로 교체 필요 (현재: 플레이스홀더)
    statbl_id: 'R_APT_TRADE_NTL',
    indicator_code: 'APT_SALE_INDEX_NATIONAL',
    region: '전국',
    description: '아파트 매매가격지수 (전국)',
    frequency: 'monthly',
  },
  'APT_SALE_INDEX_SEOUL': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_TRADE_SEOUL',
    indicator_code: 'APT_SALE_INDEX_SEOUL',
    region: '서울',
    description: '아파트 매매가격지수 (서울)',
    frequency: 'monthly',
  },
  'APT_SALE_INDEX_METRO': {
    // TODO: 실제 STATBL_ID로 교체 필요 (수도권 = 서울 + 경기 + 인천)
    statbl_id: 'R_APT_TRADE_METRO',
    indicator_code: 'APT_SALE_INDEX_METRO',
    region: '수도권',
    description: '아파트 매매가격지수 (수도권)',
    frequency: 'monthly',
  },
  'APT_SALE_INDEX_PROVINCES': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_TRADE_PROV',
    indicator_code: 'APT_SALE_INDEX_PROVINCES',
    region: '지방',
    description: '아파트 매매가격지수 (지방 5개 광역시 + 8개 도)',
    frequency: 'monthly',
  },

  // ── 아파트 전세가격지수 ──────────────────────
  'APT_RENT_INDEX_NATIONAL': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_RENT_NTL',
    indicator_code: 'APT_RENT_INDEX_NATIONAL',
    region: '전국',
    description: '아파트 전세가격지수 (전국)',
    frequency: 'monthly',
  },
  'APT_RENT_INDEX_SEOUL': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_RENT_SEOUL',
    indicator_code: 'APT_RENT_INDEX_SEOUL',
    region: '서울',
    description: '아파트 전세가격지수 (서울)',
    frequency: 'monthly',
  },
  'APT_RENT_INDEX_METRO': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_RENT_METRO',
    indicator_code: 'APT_RENT_INDEX_METRO',
    region: '수도권',
    description: '아파트 전세가격지수 (수도권)',
    frequency: 'monthly',
  },
  'APT_RENT_INDEX_PROVINCES': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_RENT_PROV',
    indicator_code: 'APT_RENT_INDEX_PROVINCES',
    region: '지방',
    description: '아파트 전세가격지수 (지방)',
    frequency: 'monthly',
  },

  // ── 주택 (종합) 가격지수 ─────────────────────
  'HOUSE_SALE_INDEX_NATIONAL': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_HOUSE_TRADE_NTL',
    indicator_code: 'HOUSE_SALE_INDEX_NATIONAL',
    region: '전국',
    description: '주택 매매가격지수 전국 (아파트+연립+단독)',
    frequency: 'monthly',
  },
  'HOUSE_RENT_INDEX_NATIONAL': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_HOUSE_RENT_NTL',
    indicator_code: 'HOUSE_RENT_INDEX_NATIONAL',
    region: '전국',
    description: '주택 전세가격지수 전국',
    frequency: 'monthly',
  },

  // ── 아파트 거래량 ────────────────────────────
  'APT_TRADE_VOLUME_NATIONAL': {
    // TODO: 실제 STATBL_ID로 교체 필요
    statbl_id: 'R_APT_VOLUME_NTL',
    indicator_code: 'APT_TRADE_VOLUME_NATIONAL',
    region: '전국',
    description: '아파트 매매 거래량 (전국, 건)',
    frequency: 'monthly',
  },
};

/** 응답에서 기간(날짜)을 추출할 필드명 후보 목록 (API 버전별 상이) */
const PERIOD_FIELD_CANDIDATES = ['WRTTIME', 'PRD_DE', 'PERIOD', 'YM', 'BASE_PERIOD'];

/** 응답에서 값을 추출할 필드명 후보 목록 */
const VALUE_FIELD_CANDIDATES = ['DTA_VAL', 'DATA_VALUE', 'VALUE', 'STTS_VAL'];

// ──────────────────────────────────────────────
// REB 수집기 클래스
// ──────────────────────────────────────────────

class RebCollector extends BaseCollector {
  constructor() {
    super('REB_MONTHLY', 'REB');
    this.apiKey = process.env.DATA_GO_KR_API_KEY;

    if (!this.apiKey) {
      console.warn('[REB] 경고: DATA_GO_KR_API_KEY 환경변수가 설정되지 않았습니다.');
      console.warn('[REB]  → https://www.data.go.kr 또는 https://www.reb.or.kr/r-one/openapi 에서 발급받으세요.');
    }
  }

  // ────────────────────────────────────────────
  // REB API 호출
  // ────────────────────────────────────────────

  /**
   * 한국부동산원 통계표 데이터 조회
   * @param {string} statblId - 통계표 코드
   * @param {number} pIndex - 페이지 번호 (기본: 1)
   * @param {number} pSize - 페이지 크기 (기본: 100)
   * @returns {Object} { items: Array, total_count: number }
   */
  async fetchRebData(statblId, pIndex = 1, pSize = 100) {
    const params = {
      KEY: this.apiKey,
      Type: 'json',
      STATBL_ID: statblId,
      pIndex,
      pSize,
    };

    const raw = await this.fetchWithRetry(REB_BASE_URL, params);

    // REB API 오류 응답 처리
    // 응답 형태: { SttsApiTbl: [ {head: ...}, {row: [...]} ] }
    // 또는 단순 JSON 오류 메시지
    if (!raw) {
      throw new Error(`REB API 응답 없음 (STATBL_ID: ${statblId})`);
    }

    // 오류 메시지 체크
    if (raw.RESULT) {
      throw new Error(`REB API 오류: ${JSON.stringify(raw.RESULT)}`);
    }

    // 응답 구조 파싱 (R-ONE API 응답 형식)
    const apiData = raw.SttsApiTbl || raw.sttsApiTbl || null;
    if (!apiData || !Array.isArray(apiData)) {
      // 플레이스홀더 STATBL_ID로 인한 빈 응답일 수 있음
      console.warn(`[REB] 예상치 못한 응답 형식 (STATBL_ID: ${statblId}). 실제 STATBL_ID 확인 필요.`);
      return { items: [], total_count: 0 };
    }

    // head (메타데이터) 와 row (데이터) 분리
    const headBlock = apiData.find((b) => b.head) || {};
    const rowBlock  = apiData.find((b) => b.row)  || {};

    const head = headBlock.head || [];
    const rows = rowBlock.row  || [];

    // 전체 건수 추출
    const totalCount = parseInt(
      head.find?.((h) => h.total_count)?.total_count || '0',
      10
    );

    this.stats.rows_fetched += rows.length;
    return { items: rows, total_count: totalCount };
  }

  // ────────────────────────────────────────────
  // 파싱 유틸리티
  // ────────────────────────────────────────────

  /**
   * 응답 행에서 기간 값 추출 (필드명 후보 순서로 시도)
   * REB API 응답 필드명이 버전별로 다를 수 있음
   * @param {Object} row - 응답 행
   * @returns {string|null} 기간 값 (예: '202312', '2023-12')
   */
  extractPeriod(row) {
    for (const field of PERIOD_FIELD_CANDIDATES) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        return String(row[field]).trim();
      }
    }
    return null;
  }

  /**
   * 응답 행에서 수치 값 추출
   * @param {Object} row - 응답 행
   * @returns {number|null}
   */
  extractValue(row) {
    for (const field of VALUE_FIELD_CANDIDATES) {
      if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
        const n = parseFloat(String(row[field]).replace(/,/g, ''));
        return isNaN(n) ? null : n;
      }
    }
    return null;
  }

  /**
   * 기간 문자열 → ISO 날짜 변환
   * 월별 데이터는 해당 월의 1일로 저장
   * 예: '202312' → '2023-12-01', '2023-12' → '2023-12-01'
   * @param {string} periodStr
   * @returns {string|null} YYYY-MM-DD
   */
  parsePeriodDate(periodStr) {
    if (!periodStr) return null;

    const cleaned = String(periodStr).replace(/[.\-/]/g, '');

    // YYYYMM 형식 (6자리)
    if (cleaned.length === 6 && /^\d{6}$/.test(cleaned)) {
      const year  = cleaned.slice(0, 4);
      const month = cleaned.slice(4, 6);
      return `${year}-${month}-01`;
    }

    // YYYYMMDD 형식 (8자리)
    if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
    }

    // YYYY 형식 (연간 데이터)
    if (cleaned.length === 4 && /^\d{4}$/.test(cleaned)) {
      return `${cleaned}-01-01`;
    }

    console.warn(`[REB] 기간 파싱 실패: '${periodStr}'`);
    return null;
  }

  // ────────────────────────────────────────────
  // 단일 통계표 수집
  // ────────────────────────────────────────────

  /**
   * 단일 통계표의 모든 페이지 수집 및 upsert
   * @param {string} indicatorKey - REB_STAT_MAP 키
   * @param {Object} statDef - REB_STAT_MAP 값
   */
  async collectSingleStat(indicatorKey, statDef) {
    console.log(`[REB] 수집 중: ${indicatorKey} (${statDef.description})`);

    // ⚠️ 플레이스홀더 STATBL_ID 경고
    if (statDef.statbl_id.startsWith('R_')) {
      console.warn(`[REB] ⚠️  '${indicatorKey}'의 STATBL_ID '${statDef.statbl_id}'는 플레이스홀더입니다.`);
      console.warn(`[REB]     실제 STATBL_ID를 https://www.reb.or.kr/r-one/openapi/guide.do 에서 확인하세요.`);
    }

    const indicatorId = await this.getIndicatorId(statDef.indicator_code);
    if (!indicatorId) {
      console.warn(`[REB] 지표 ID 없음: ${statDef.indicator_code}`);
      return;
    }

    try {
      // 1페이지 조회로 전체 건수 파악
      const firstPage = await this.fetchRebData(statDef.statbl_id, 1, 100);
      const allItems = [...firstPage.items];

      // 추가 페이지가 있으면 계속 수집
      const totalCount = firstPage.total_count;
      const totalPages = Math.ceil(totalCount / 100);

      for (let page = 2; page <= totalPages; page++) {
        console.log(`[REB] ${indicatorKey}: ${page}/${totalPages} 페이지 수집 중...`);
        const pageData = await this.fetchRebData(statDef.statbl_id, page, 100);
        allItems.push(...pageData.items);
        await this.sleep(300);
      }

      // 최근 12개월 데이터만 upsert (과거 데이터 전수 저장 방지)
      // 전체 데이터가 필요한 경우 limit 제거
      const recentItems = allItems.slice(0, 24);

      for (const item of recentItems) {
        const periodStr  = this.extractPeriod(item);
        const periodDate = this.parsePeriodDate(periodStr);
        const value      = this.extractValue(item);

        if (!periodDate) {
          console.warn(`[REB] 기간 파싱 실패, 항목 스킵:`, item);
          continue;
        }

        if (value === null) {
          // 값이 없는 경우 스킵 (공표 전 데이터)
          continue;
        }

        await this.upsertObservation(
          indicatorId,
          periodDate,
          value,
          statDef.region,
          {
            country: 'KR',
            unit: 'Index',   // 지수 기준 (기준시점 = 100)
            raw_payload: item,
          }
        );
      }

      console.log(`[REB] ${indicatorKey}: ${recentItems.length}개 처리 완료`);

    } catch (err) {
      console.error(`[REB] ${indicatorKey} 수집 실패:`, err.message);
      this.stats.rows_failed++;
    }
  }

  // ────────────────────────────────────────────
  // 메인 수집 로직
  // ────────────────────────────────────────────

  async collect() {
    if (!this.apiKey) {
      throw new Error('DATA_GO_KR_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }

    console.log('[REB] 한국부동산원 부동산 통계 수집 시작');
    console.log('[REB] ⚠️  실제 STATBL_ID 미설정 시 빈 데이터가 반환됩니다. collectors/reb.js의 REB_STAT_MAP을 확인하세요.');

    const statEntries = Object.entries(REB_STAT_MAP);

    for (const [key, statDef] of statEntries) {
      await this.collectSingleStat(key, statDef);

      // 통계표 간 500ms 대기
      await this.sleep(500);
    }

    console.log('[REB] 전체 수집 완료:', this.stats);
  }
}

module.exports = RebCollector;

// 직접 실행 시 테스트
if (require.main === module) {
  const collector = new RebCollector();
  collector.run()
    .then(() => console.log('[REB] 수집 완료'))
    .catch(console.error);
}
