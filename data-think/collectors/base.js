'use strict';
/**
 * Data Think Engine - Base Collector
 * 모든 수집기의 공통 베이스 클래스
 * - 재시도 로직 (Exponential Backoff)
 * - 수집 로그 기록
 * - 중복 체크
 * - Rate Limit 관리
 */

require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.DATA_THINK_SUPABASE_URL || 'http://localhost:54321',
  process.env.DATA_THINK_SUPABASE_KEY || 'your-service-role-key'
);

const RETRY_MAX = parseInt(process.env.COLLECTION_RETRY_MAX || '3', 10);
const RETRY_DELAY_MS = parseInt(process.env.COLLECTION_RETRY_DELAY_MS || '2000', 10);
const TIMEOUT_MS = parseInt(process.env.COLLECTION_TIMEOUT_MS || '30000', 10);

class BaseCollector {
  constructor(jobCode, sourceName) {
    this.jobCode = jobCode;
    this.sourceName = sourceName;
    this.jobId = null;
    this.logId = null;
    this.stats = {
      rows_fetched: 0,
      rows_inserted: 0,
      rows_updated: 0,
      rows_failed: 0,
    };
  }

  /**
   * HTTP GET 요청 (재시도 로직 포함)
   */
  async fetchWithRetry(url, params = {}, headers = {}, retryCount = 0) {
    try {
      const response = await axios.get(url, {
        params,
        headers,
        timeout: TIMEOUT_MS,
      });
      return response.data;
    } catch (error) {
      const isRetryable = error.code === 'ECONNRESET'
        || error.code === 'ETIMEDOUT'
        || (error.response && error.response.status >= 500)
        || (error.response && error.response.status === 429);

      if (isRetryable && retryCount < RETRY_MAX) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
        console.warn(`[${this.jobCode}] 요청 실패 (${retryCount + 1}/${RETRY_MAX}). ${delay}ms 후 재시도...`);
        await this.sleep(delay);
        return this.fetchWithRetry(url, params, headers, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * HTTP POST 요청 (재시도 로직 포함)
   */
  async postWithRetry(url, data = {}, headers = {}, retryCount = 0) {
    try {
      const response = await axios.post(url, data, {
        headers,
        timeout: TIMEOUT_MS,
      });
      return response.data;
    } catch (error) {
      if (retryCount < RETRY_MAX) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await this.sleep(delay);
        return this.postWithRetry(url, data, headers, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 지표 관측값 Upsert (중복 방지)
   */
  async upsertObservation(indicatorId, periodDate, value, region = '', extras = {}) {
    const row = {
      indicator_id: indicatorId,
      period_date: periodDate,
      value: value !== null && value !== undefined && value !== '.' ? parseFloat(value) : null,
      value_text: extras.value_text || null,
      unit: extras.unit || null,
      region: region || '',
      country: extras.country || 'KR',
      revised_flag: extras.revised_flag || false,
      raw_payload_json: extras.raw_payload || null,
      collected_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('indicator_observations')
      .upsert(row, {
        onConflict: 'indicator_id,period_date,region',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[${this.jobCode}] Upsert 오류:`, error.message);
      this.stats.rows_failed++;
      return false;
    }

    this.stats.rows_inserted++;
    return true;
  }

  /**
   * 종목 일봉 Upsert
   */
  async upsertDailyPrice(securityId, tradeDate, priceData) {
    const row = {
      security_id: securityId,
      trade_date: tradeDate,
      open: priceData.open || null,
      high: priceData.high || null,
      low: priceData.low || null,
      close: priceData.close || null,
      adjusted_close: priceData.adjusted_close || priceData.close || null,
      volume: priceData.volume || null,
      trading_value: priceData.trading_value || null,
      market_cap: priceData.market_cap || null,
      change_rate: priceData.change_rate || null,
      per: priceData.per || null,
      pbr: priceData.pbr || null,
      eps: priceData.eps || null,
      raw_payload_json: priceData.raw_payload || null,
      collected_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('security_prices_daily')
      .upsert(row, {
        onConflict: 'security_id,trade_date',
        ignoreDuplicates: false,
      });

    if (error) {
      this.stats.rows_failed++;
      return false;
    }

    this.stats.rows_inserted++;
    return true;
  }

  /**
   * indicator_id 조회 (코드로 찾기)
   */
  async getIndicatorId(indicatorCode) {
    const { data, error } = await supabase
      .from('indicators')
      .select('id')
      .eq('indicator_code', indicatorCode)
      .single();

    if (error || !data) {
      console.warn(`[${this.jobCode}] 지표 코드 '${indicatorCode}'를 찾을 수 없습니다.`);
      return null;
    }

    return data.id;
  }

  /**
   * security_id 조회 (ticker로 찾기)
   */
  async getSecurityId(market, ticker) {
    const { data, error } = await supabase
      .from('securities')
      .select('id')
      .eq('market', market)
      .eq('ticker', ticker)
      .single();

    if (error || !data) return null;
    return data.id;
  }

  /**
   * 수집 Job ID 조회
   */
  async getJobId() {
    if (this.jobId) return this.jobId;

    const { data, error } = await supabase
      .from('data_collection_jobs')
      .select('id')
      .eq('job_code', this.jobCode)
      .single();

    if (error || !data) {
      console.warn(`[${this.jobCode}] Job을 DB에서 찾을 수 없습니다.`);
      return null;
    }

    this.jobId = data.id;
    return this.jobId;
  }

  /**
   * 수집 시작 로그
   */
  async startLog() {
    const jobId = await this.getJobId();
    if (!jobId) return;

    // Job 상태 업데이트
    await supabase
      .from('data_collection_jobs')
      .update({ status: 'running', last_started_at: new Date().toISOString() })
      .eq('id', jobId);

    // 로그 레코드 생성
    const { data } = await supabase
      .from('data_collection_logs')
      .insert({
        job_id: jobId,
        started_at: new Date().toISOString(),
        status: 'running',
      })
      .select('id')
      .single();

    if (data) this.logId = data.id;
    console.log(`[${this.jobCode}] 수집 시작`);
  }

  /**
   * 수집 완료 로그
   */
  async endLog(status = 'success', errorMessage = null) {
    const jobId = await this.getJobId();
    const now = new Date().toISOString();

    if (jobId) {
      await supabase
        .from('data_collection_jobs')
        .update({
          status,
          last_finished_at: now,
          last_success_at: status === 'success' ? now : undefined,
          last_error_message: errorMessage,
          error_count: status === 'error'
            ? supabase.rpc('increment_error_count', { job_id: jobId })
            : 0,
        })
        .eq('id', jobId);
    }

    if (this.logId) {
      await supabase
        .from('data_collection_logs')
        .update({
          finished_at: now,
          status,
          rows_fetched: this.stats.rows_fetched,
          rows_inserted: this.stats.rows_inserted,
          rows_updated: this.stats.rows_updated,
          rows_failed: this.stats.rows_failed,
          error_message: errorMessage,
        })
        .eq('id', this.logId);
    }

    console.log(`[${this.jobCode}] 수집 완료:`, {
      status,
      ...this.stats,
      error: errorMessage,
    });
  }

  /**
   * 수집 실행 래퍼 (로그 자동 처리)
   */
  async run() {
    await this.startLog();
    try {
      await this.collect();
      await this.endLog('success');
    } catch (error) {
      console.error(`[${this.jobCode}] 수집 중 오류 발생:`, error.message);
      await this.endLog('error', error.message);
      throw error;
    }
  }

  /**
   * 하위 클래스에서 구현
   */
  async collect() {
    throw new Error('collect() 메서드를 구현해야 합니다.');
  }

  /**
   * 날짜 유틸
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  formatDate(date, format = 'YYYYMMDD') {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (format === 'YYYYMM') return `${year}${month}`;
    if (format === 'YYYY') return `${year}`;
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    return `${year}${month}${day}`;
  }

  getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }

  getLastMonth() {
    const d = new Date();
    d.setDate(0); // 전월 마지막 날
    return d;
  }
}

module.exports = { BaseCollector, supabase };
