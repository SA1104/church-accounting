'use strict';
/**
 * Data Think Engine - DART 공시 수집기
 * API: https://opendart.fss.or.kr/api/
 *
 * 수집 대상:
 * - 공시 목록 (list.json): 당일 또는 전일 공시 전체
 * - 보고서 유형 분류 (A~E 카테고리)
 * - 공시 법인 → securities 테이블 매칭 후 security_id 연결
 *
 * API 제한:
 * - 회원 가입 후 인증키(crtfc_key) 발급 필요
 * - https://opendart.fss.or.kr 에서 발급
 * - 1일 최대 10,000건 요청 가능
 */

require('dotenv').config();
const { BaseCollector, supabase } = require('./base');

// ──────────────────────────────────────────────
// 상수 정의
// ──────────────────────────────────────────────

const DART_BASE_URL = 'https://opendart.fss.or.kr/api';

/**
 * DART 공시 유형(pblntf_ty) → 카테고리 매핑
 * 공시 유형 코드는 DART 공식 문서 참조
 * https://opendart.fss.or.kr/guide/detail.do?apiGrpCd=DS001&apiCd=DS001001
 */
const DISCLOSURE_TYPE_MAP = {
  // A: 정기공시 (사업보고서, 반기보고서, 분기보고서 등)
  A: { category: '정기공시', description: '사업보고서·반기보고서·분기보고서 등 정기 공시' },
  // B: 주요사항보고서 (합병, 분할, 자산양수도 등)
  B: { category: '주요사항보고서', description: '합병·분할·자산양수도·영업양수도 등' },
  // C: 발행공시 (유상증자, 무상증자, 전환사채 등)
  C: { category: '발행공시', description: '유상증자·무상증자·전환사채·신주인수권부사채 등' },
  // D: 지분공시 (최대주주변경, 주식대량보유 등)
  D: { category: '지분공시', description: '최대주주변경·주식대량보유상황보고 등' },
  // E: 기타공시 (자기주식, 임원변동 등)
  E: { category: '기타공시', description: '자기주식취득·임원변동·불성실공시 등' },
};

/**
 * 수집할 공시 유형 목록 (null이면 전체)
 * 필요에 따라 특정 유형만 수집하도록 제한 가능
 */
const TARGET_PBLNTF_TYPES = ['A', 'B', 'C', 'D', 'E'];

/** 페이지당 최대 공시 수 */
const PAGE_SIZE = 100;

// ──────────────────────────────────────────────
// DART 수집기 클래스
// ──────────────────────────────────────────────

class DartCollector extends BaseCollector {
  constructor() {
    super('DART_DAILY', 'DART');
    this.apiKey = process.env.DART_API_KEY;

    if (!this.apiKey) {
      console.warn('[DART] 경고: DART_API_KEY 환경변수가 설정되지 않았습니다.');
      console.warn('[DART]  → https://opendart.fss.or.kr 에서 인증키를 발급받아 .env에 설정하세요.');
    }
  }

  // ────────────────────────────────────────────
  // DART API 호출 메서드
  // ────────────────────────────────────────────

  /**
   * DART 공시 목록 조회 (단일 페이지)
   * @param {Object} params - API 파라미터
   * @param {string} params.bgn_de - 시작일 (YYYYMMDD)
   * @param {string} params.end_de - 종료일 (YYYYMMDD)
   * @param {string} params.pblntf_ty - 공시 유형 (A~E)
   * @param {number} params.page_no - 페이지 번호
   * @returns {Object} { list: Array, total_count, total_page }
   */
  async fetchDisclosureList({ bgn_de, end_de, pblntf_ty, page_no = 1 }) {
    const url = `${DART_BASE_URL}/list.json`;

    const params = {
      crtfc_key: this.apiKey,
      bgn_de,
      end_de,
      pblntf_ty,
      page_no,
      page_count: PAGE_SIZE,
      sort: 'rdt',        // 접수일자 기준 정렬
      sort_mth: 'desc',   // 최신순
    };

    const raw = await this.fetchWithRetry(url, params);

    // DART API 오류 응답 처리
    // 정상: status '000', 데이터 없음: status '013'
    if (raw.status && raw.status !== '000') {
      if (raw.status === '013') {
        // 조회된 데이터 없음 → 빈 결과 반환 (오류 아님)
        return { list: [], total_count: 0, total_page: 0 };
      }
      throw new Error(`DART API 오류: ${raw.status} - ${raw.message}`);
    }

    const list = raw.list || [];
    this.stats.rows_fetched += list.length;

    return {
      list,
      total_count: parseInt(raw.total_count || '0', 10),
      total_page: parseInt(raw.total_page || '1', 10),
    };
  }

  /**
   * 특정 유형의 공시 전체 페이지 수집
   * @param {string} bgnDe - 시작일
   * @param {string} endDe - 종료일
   * @param {string} pblntfTy - 공시 유형 코드
   * @returns {Array} 전체 공시 목록
   */
  async fetchAllPagesForType(bgnDe, endDe, pblntfTy) {
    const allItems = [];

    // 첫 페이지 조회로 전체 페이지 수 파악
    const firstPage = await this.fetchDisclosureList({
      bgn_de: bgnDe,
      end_de: endDe,
      pblntf_ty: pblntfTy,
      page_no: 1,
    });

    allItems.push(...firstPage.list);
    const totalPage = firstPage.total_page;

    // 2페이지부터 마지막 페이지까지 순차 수집
    for (let page = 2; page <= totalPage; page++) {
      console.log(`[DART] ${pblntfTy}유형 ${page}/${totalPage} 페이지 수집 중...`);

      const pageData = await this.fetchDisclosureList({
        bgn_de: bgnDe,
        end_de: endDe,
        pblntf_ty: pblntfTy,
        page_no: page,
      });

      allItems.push(...pageData.list);

      // 페이지 간 300ms 대기 (API Rate Limit 준수)
      await this.sleep(300);
    }

    return allItems;
  }

  // ────────────────────────────────────────────
  // securities 매칭
  // ────────────────────────────────────────────

  /**
   * 법인명 또는 티커로 security_id 조회
   * DART 응답의 stock_code(종목코드) 또는 corp_name(법인명)으로 매칭
   * @param {Object} item - DART 공시 항목
   * @returns {string|null} security_id (UUID) or null
   */
  async resolveSecurityId(item) {
    const stockCode = item.stock_code?.trim();
    const corpName  = item.corp_name?.trim();

    // 1차: 티커(종목코드)로 조회 (더 정확)
    if (stockCode && stockCode !== '') {
      const { data } = await supabase
        .from('securities')
        .select('id')
        .eq('ticker', stockCode)
        .limit(1)
        .single();

      if (data?.id) return data.id;
    }

    // 2차: 법인명으로 fuzzy 매칭 (name_ko ILIKE)
    if (corpName) {
      const { data } = await supabase
        .from('securities')
        .select('id')
        .ilike('name_ko', `%${corpName}%`)
        .limit(1)
        .single();

      if (data?.id) return data.id;
    }

    return null;
  }

  // ────────────────────────────────────────────
  // 공시 upsert
  // ────────────────────────────────────────────

  /**
   * DART 공시 항목 → disclosures 테이블 upsert
   * disclosure_id = rcept_no (접수번호, DART 고유 식별자)
   * @param {Object} item - DART 공시 항목
   * @param {string} pblntfTy - 공시 유형 코드
   */
  async upsertDisclosure(item, pblntfTy) {
    const typeInfo = DISCLOSURE_TYPE_MAP[pblntfTy] || {
      category: '기타',
      description: '',
    };

    // securities 테이블 매칭 시도
    const securityId = await this.resolveSecurityId(item);

    // 접수일시 파싱: 'YYYYMMDD' 형식
    const rceptDt = item.rcept_dt || '';
    const receivedAt = rceptDt.length === 8
      ? `${rceptDt.slice(0, 4)}-${rceptDt.slice(4, 6)}-${rceptDt.slice(6, 8)}`
      : null;

    const record = {
      disclosure_id:  item.rcept_no,           // DART 접수번호 (고유키)
      corp_code:      item.corp_code || null,   // DART 법인코드
      corp_name:      item.corp_name || null,   // 법인명
      ticker:         item.stock_code || null,  // 종목코드
      security_id:    securityId,               // securities 테이블 FK (nullable)
      title:          item.report_nm || null,   // 공시 제목
      disclosure_type: pblntfTy,                // 공시 유형 코드 (A~E)
      category:       typeInfo.category,        // 공시 유형 한글명
      rcept_no:       item.rcept_no || null,    // 접수번호
      received_at:    receivedAt,               // 접수일
      flr_nm:         item.flr_nm || null,      // 제출인명
      rm:             item.rm || null,          // 비고
      source:         'DART',
      raw_payload_json: item,
      collected_at:   new Date().toISOString(),
    };

    const { error } = await supabase
      .from('disclosures')
      .upsert(record, {
        onConflict: 'disclosure_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[DART] 공시 upsert 실패 (${item.rcept_no}):`, error.message);
      this.stats.rows_failed++;
      return false;
    }

    this.stats.rows_inserted++;
    return true;
  }

  // ────────────────────────────────────────────
  // 메인 수집 로직
  // ────────────────────────────────────────────

  async collect() {
    if (!this.apiKey) {
      throw new Error('DART_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    }

    // 수집 날짜 범위: 최근 1일 (어제 ~ 오늘)
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const endDe = this.formatDate(today);
    const bgnDe = this.formatDate(yesterday);

    console.log(`[DART] 수집 기간: ${bgnDe} ~ ${endDe}`);

    // 공시 유형별 순차 수집
    for (const pblntfTy of TARGET_PBLNTF_TYPES) {
      const typeInfo = DISCLOSURE_TYPE_MAP[pblntfTy];
      console.log(`[DART] ${pblntfTy}유형 (${typeInfo.category}) 수집 시작...`);

      try {
        const items = await this.fetchAllPagesForType(bgnDe, endDe, pblntfTy);
        console.log(`[DART] ${pblntfTy}유형 총 ${items.length}건 수집됨`);

        for (const item of items) {
          await this.upsertDisclosure(item, pblntfTy);
        }
      } catch (err) {
        console.error(`[DART] ${pblntfTy}유형 수집 실패:`, err.message);
        this.stats.rows_failed++;
      }

      // 유형 간 500ms 대기
      await this.sleep(500);
    }

    console.log('[DART] 전체 수집 완료:', this.stats);
  }
}

module.exports = DartCollector;

// 직접 실행 시 테스트
if (require.main === module) {
  const collector = new DartCollector();
  collector.run()
    .then(() => console.log('[DART] 수집 완료'))
    .catch(console.error);
}
