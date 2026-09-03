/**
 * trendFetcher.js
 * Fetches politician buzz (search volume) data from NAVER API HUB Search Trend API (DataLab)
 * and stores it in politics_trends table.
 * 
 * NAVER Search Trend API:
 *   URL: https://naveropenapi.apigw.ntruss.com/datalab/v1/search  (legacy)
 *     or https://naverapihub.apigw.ntruss.com/search-trend/v1/search  (NCP API HUB)
 *   Method: POST
 *   Headers: X-NCP-APIGW-API-KEY-ID, X-NCP-APIGW-API-KEY, Content-Type: application/json
 *   Body: { startDate, endDate, timeUnit, keywordGroups: [{ groupName, keywords }] }
 *   Response: { results: [{ title, keywords, data: [{ period, ratio }] }] }
 *     ratio: 0~100 relative search volume (100 = peak within the request)
 */
const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env.development') });
const { logCronExecution } = require('../../../core/cronLogger');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Naver API HUB Search Trend endpoints (try both)
const TREND_URLS = [
  'https://naverapihub.apigw.ntruss.com/search-trend/v1/search',
  'https://naveropenapi.apigw.ntruss.com/datalab/v1/search'
];

/**
 * Fetch trend data for a batch of politicians (max 5 keyword groups per request).
 * @param {Array<{id, name, search_keyword}>} politicians
 * @param {string} startDate  YYYY-MM-DD
 * @param {string} endDate    YYYY-MM-DD
 * @param {string} timeUnit   'date' | 'week' | 'month'
 */
async function fetchTrendBatch(politicians, startDate, endDate, timeUnit = 'date') {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[TrendFetcher] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is missing!');
    return null;
  }

  const keywordGroups = politicians.map(p => ({
    groupName: p.name,
    keywords: [p.search_keyword || p.name]
  }));

  const body = {
    startDate,
    endDate,
    timeUnit,
    keywordGroups
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY': clientSecret
  };

  // Try both endpoints
  for (const url of TREND_URLS) {
    try {
      console.log(`[TrendFetcher] Trying ${url}...`);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[TrendFetcher] Success from ${url}`);
        return data;
      }

      // If 401, try legacy X-Naver headers on openapi.naver.com
      if (res.status === 401) {
        console.log(`[TrendFetcher] 401 from ${url}, trying next...`);
        continue;
      }

      const errorText = await res.text();
      console.error(`[TrendFetcher] ${res.status} from ${url}: ${errorText}`);
    } catch (err) {
      console.error(`[TrendFetcher] Network error for ${url}:`, err.message);
    }
  }

  // Last resort: try openapi.naver.com/v1/datalab/search with X-Naver-Client headers
  try {
    const legacyUrl = 'https://openapi.naver.com/v1/datalab/search';
    console.log(`[TrendFetcher] Trying legacy ${legacyUrl}...`);
    const res = await fetch(legacyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[TrendFetcher] Success from legacy endpoint`);
      return data;
    }
    const errorText = await res.text();
    console.error(`[TrendFetcher] Legacy also failed: ${res.status} - ${errorText}`);
  } catch (err) {
    console.error(`[TrendFetcher] Legacy network error:`, err.message);
  }

  return null;
}

/**
 * Main: Fetch all active politicians' trends and store in DB.
 */
async function fetchAndStoreTrends() {
  const startTime = Date.now();
  console.log('[TrendFetcher] Starting politics trend fetch...');

  try {
    // Get all politicians with search_keyword
    const result = await pool.query(`
      SELECT id, name, search_keyword FROM politics_politicians 
      WHERE search_keyword IS NOT NULL 
      ORDER BY name ASC
    `);
    const politicians = result.rows;

    if (politicians.length === 0) {
      console.log('[TrendFetcher] No politicians found in DB.');
      await logCronExecution('fetch_politics_trends', 'SKIPPED', 'No politicians in DB', Date.now() - startTime);
      return;
    }

    console.log(`[TrendFetcher] Found ${politicians.length} politicians.`);

    // Naver Trend API allows max 5 keyword groups per request, so we batch
    const BATCH_SIZE = 5;
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const startDate = sixMonthsAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    let totalInserted = 0;

    for (let i = 0; i < politicians.length; i += BATCH_SIZE) {
      const batch = politicians.slice(i, i + BATCH_SIZE);
      console.log(`[TrendFetcher] Fetching batch ${Math.floor(i/BATCH_SIZE)+1}: ${batch.map(p => p.name).join(', ')}`);

      const data = await fetchTrendBatch(batch, startDate, endDate, 'week');

      if (!data || !data.results) {
        console.error(`[TrendFetcher] No data returned for batch starting at ${i}`);
        continue;
      }

      // Process each politician's result
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const result of data.results) {
          // Find the politician by matching groupName -> name
          const politician = batch.find(p => p.name === result.title);
          if (!politician) {
            console.warn(`[TrendFetcher] Could not match result title "${result.title}" to any politician.`);
            continue;
          }

          for (const point of result.data) {
            // point.period = "2026-03-01", point.ratio = 75.23
            await client.query(`
              INSERT INTO politics_trends (politician_id, record_date, buzz_score, source)
              VALUES ($1, $2, $3, 'NAVER_DATALAB')
              ON CONFLICT (politician_id, record_date) DO UPDATE
              SET buzz_score = $3
            `, [politician.id, point.period, point.ratio]);
            totalInserted++;
          }
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('[TrendFetcher] DB error:', err.message);
      } finally {
        client.release();
      }

      // Rate limiting: wait 200ms between batches
      if (i + BATCH_SIZE < politicians.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const msg = `Fetched trends for ${politicians.length} politicians, inserted ${totalInserted} data points`;
    console.log(`[TrendFetcher] ${msg}`);
    await logCronExecution('fetch_politics_trends', 'SUCCESS', msg, Date.now() - startTime);

  } catch (err) {
    console.error('[TrendFetcher] Fatal error:', err.message);
    await logCronExecution('fetch_politics_trends', 'FAILED', err.message, Date.now() - startTime);
  }
}

module.exports = { fetchAndStoreTrends };

// CLI direct run
if (require.main === module) {
  fetchAndStoreTrends().then(() => {
    console.log('[TrendFetcher] Done.');
    pool.end();
  });
}
