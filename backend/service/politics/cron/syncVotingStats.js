/**
 * syncVotingStats.js
 * Fetches plenary session voting data from National Assembly OpenAPI
 * Calculates voting participation rate (입법 참여도) for each politician,
 * stores the raw evidence in politics_voting_records,
 * and updates politics_annual_stats.
 */
const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env.development') });
const { logCronExecution } = require('../../../core/cronLogger');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncVotingStats() {
  const startTime = Date.now();
  console.log('[Cron:Politics] Starting voting stats sync with evidence...');
  const apiKey = process.env.NATIONAL_ASSEMBLY_API_KEY;
  
  if (!apiKey) {
    const msg = '[Cron:Politics] NATIONAL_ASSEMBLY_API_KEY is not set. Skipping voting stats sync.';
    console.warn(msg);
    await logCronExecution('sync_voting_stats', 'SKIPPED', msg, Date.now() - startTime);
    return;
  }

  try {
    // 1. Fetch recent voted bills
    const billsUrl = `https://open.assembly.go.kr/portal/openapi/ncocpgfiaoituanbr?KEY=${apiKey}&Type=json&pIndex=1&pSize=50&AGE=22`;
    const billsRes = await fetch(billsUrl);
    if (!billsRes.ok) throw new Error(`Bills API Error: ${billsRes.status}`);
    const billsData = await billsRes.json();
    
    if (!billsData.ncocpgfiaoituanbr || !billsData.ncocpgfiaoituanbr[1]) {
      throw new Error('Unexpected Bills API response format');
    }
    
    const bills = billsData.ncocpgfiaoituanbr[1].row;
    console.log(`[Cron:Politics] Fetched ${bills.length} recent bills. Processing votes...`);

    const voteStats = {}; // { name: { total: 0, voted: 0 } }
    const rawRecords = []; // { name, billId, billNo, billName, voteDate, voteResult }

    // 2. Fetch votes for each bill
    for (let i = 0; i < bills.length; i++) {
      const billId = bills[i].BILL_ID;
      const billNo = bills[i].BILL_NO;
      const billName = bills[i].BILL_NAME;
      const procDt = bills[i].PROC_DT; // e.g. "2026-09-03"

      const votesUrl = `https://open.assembly.go.kr/portal/openapi/nojepdqqaweusdfbi?KEY=${apiKey}&Type=json&pIndex=1&pSize=500&AGE=22&BILL_ID=${billId}`;
      
      const votesRes = await fetch(votesUrl);
      if (!votesRes.ok) {
        console.warn(`[Cron:Politics] Failed to fetch votes for bill ${billId}`);
        continue;
      }
      
      const votesData = await votesRes.json();
      if (!votesData.nojepdqqaweusdfbi || !votesData.nojepdqqaweusdfbi[1]) continue;
      
      const votes = votesData.nojepdqqaweusdfbi[1].row;
      
      for (const v of votes) {
        const name = v.HG_NM;
        const result = v.RESULT_VOTE_MOD ? v.RESULT_VOTE_MOD.trim() : '불참';
        
        if (!voteStats[name]) voteStats[name] = { total: 0, voted: 0 };
        
        voteStats[name].total++;
        if (['찬성', '반대', '기권'].includes(result)) {
          voteStats[name].voted++;
        }
        
        rawRecords.push({
          name,
          billId,
          billNo,
          billName,
          voteDate: procDt,
          voteResult: result
        });
      }
      
      // Delay to avoid hitting API rate limits too hard
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`[Cron:Politics] Aggregated vote stats for ${Object.keys(voteStats).length} members. Saving ${rawRecords.length} evidence records...`);

    // 3. Upsert stats and evidence into DB
    const client = await pool.connect();
    let updatedCount = 0;
    try {
      await client.query('BEGIN');
      
      // Get current politicians to map names to IDs
      const polRes = await client.query('SELECT id, name FROM politics_politicians');
      const polMap = {};
      polRes.rows.forEach(p => polMap[p.name] = p.id);
      
      const recordYear = 2026;
      
      // Upsert Evidence Records
      for (const record of rawRecords) {
        const polId = polMap[record.name];
        if (!polId) continue;
        
        const insertRecordQuery = `
          INSERT INTO politics_voting_records (politician_id, bill_id, bill_no, bill_name, vote_date, vote_result)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (politician_id, bill_id) 
          DO UPDATE SET vote_result = EXCLUDED.vote_result, updated_at = NOW()
        `;
        await client.query(insertRecordQuery, [
          polId, record.billId, record.billNo, record.billName, record.voteDate, record.voteResult
        ]);
      }

      // Upsert Annual Stats
      for (const [name, stats] of Object.entries(voteStats)) {
        const polId = polMap[name];
        if (!polId) continue;
        
        const rate = stats.total > 0 ? ((stats.voted / stats.total) * 100).toFixed(2) : 0;
        
        const updateQuery = `
          UPDATE politics_annual_stats 
          SET attendance_rate = $1
          WHERE politician_id = $2 AND record_year = $3
        `;
        const result = await client.query(updateQuery, [rate, polId, recordYear]);
        
        if (result.rowCount === 0) {
          const insertQuery = `
            INSERT INTO politics_annual_stats (politician_id, record_year, attendance_rate, declared_wealth, pledge_fulfillment_rate, buzz_index, approval_rating)
            VALUES ($1, $2, $3, 0, 0, 50, 0)
          `;
          await client.query(insertQuery, [polId, recordYear, rate]);
        }
        updatedCount++;
      }
      
      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    const msg = `Successfully saved voting evidence and updated rates for ${updatedCount} politicians.`;
    console.log(`[Cron:Politics] ${msg}`);
    await logCronExecution('sync_voting_stats', 'SUCCESS', msg, Date.now() - startTime);

  } catch (error) {
    const msg = error.message;
    console.error('[Cron:Politics] Failed to sync voting stats:', msg);
    await logCronExecution('sync_voting_stats', 'FAILED', msg, Date.now() - startTime);
  }
}

module.exports = { syncVotingStats };

if (require.main === module) {
  syncVotingStats().then(() => pool.end());
}
