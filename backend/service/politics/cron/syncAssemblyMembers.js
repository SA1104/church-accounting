const { Pool } = require('pg');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env.development') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function syncAssemblyMembers() {
  console.log('[Cron:Politics] Starting National Assembly members sync...');
  const apiKey = process.env.NATIONAL_ASSEMBLY_API_KEY;
  
  if (!apiKey) {
    console.warn('[Cron:Politics] NATIONAL_ASSEMBLY_API_KEY is not set. Skipping real API fetch, using fallback dummy sync for testing.');
    await runFallbackSync();
    return;
  }

  try {
    // API endpoint for 22nd National Assembly members
    const url = `https://open.assembly.go.kr/portal/openapi/nwvrqwxyaytdioiqd?KEY=${apiKey}&Type=json&pIndex=1&pSize=300`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    
    if (!data.nwvrqwxyaytdioiqd || !data.nwvrqwxyaytdioiqd[1]) {
      throw new Error('Unexpected API response format');
    }
    
    const members = data.nwvrqwxyaytdioiqd[1].row;
    console.log(`[Cron:Politics] Fetched ${members.length} members from National Assembly API.`);
    
    await processMembers(members);
  } catch (error) {
    console.error('[Cron:Politics] Failed to sync members:', error);
  }
}

async function runFallbackSync() {
  // Generate 5 dummy members for testing the pipeline if API key is missing
  console.log('[Cron:Politics] Generating fallback dummy members to test DB insertion...');
  const dummies = [
    { HG_NM: '김철수', POLY_NM: '더불어민주당', SEX_GBN_NM: '남', ORIG_NM: '서울 강남구' },
    { HG_NM: '이영희', POLY_NM: '국민의힘', SEX_GBN_NM: '여', ORIG_NM: '부산 해운대구' },
    { HG_NM: '박지성', POLY_NM: '조국혁신당', SEX_GBN_NM: '남', ORIG_NM: '비례대표' },
    { HG_NM: '최수종', POLY_NM: '개혁신당', SEX_GBN_NM: '남', ORIG_NM: '광주 서구' },
    { HG_NM: '김태희', POLY_NM: '더불어민주당', SEX_GBN_NM: '여', ORIG_NM: '서울 서초구' }
  ];
  await processMembers(dummies);
}

async function processMembers(members) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const m of members) {
      // Map API fields to DB columns
      const name = m.HG_NM; // 이름
      const party = m.POLY_NM; // 정당
      const gender = m.SEX_GBN_NM === '여' ? 'FEMALE' : 'MALE';
      
      // We use Wikipedia default image if we don't scrape it individually
      const defaultImage = `https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png`;
      const namuwikiUrl = `https://namu.wiki/w/${encodeURIComponent(name)}`;
      
      // Upsert into politics_politicians
      const insertQuery = `
        INSERT INTO politics_politicians (id, name, profile_image_url, gender, party_name, namuwiki_url, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE 
        SET party_name = $4, updated_at = NOW()
        RETURNING id
      `;
      const res = await client.query(insertQuery, [name, defaultImage, gender, party, namuwikiUrl]);
      const politicianId = res.rows[0].id;
      
      // Upsert into politics_annual_stats (Generate some random stats for now since we don't have wealth/attendance API yet)
      const recordYear = 2026;
      const wealth = Math.floor(Math.random() * 5000000000) + 100000000;
      const pledge = (Math.random() * 40 + 60).toFixed(2);
      const attendance = (Math.random() * 20 + 80).toFixed(2);
      const buzz = Math.floor(Math.random() * 50) + 50;
      const approval = (Math.random() * 30 + 30).toFixed(2);
      
      const statQuery = `
        INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, pledge_fulfillment_rate, attendance_rate, buzz_index, approval_rating)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (politician_id, record_year) DO UPDATE
        SET declared_wealth = $3, pledge_fulfillment_rate = $4, attendance_rate = $5, buzz_index = $6, approval_rating = $7
      `;
      await client.query(statQuery, [politicianId, recordYear, wealth, pledge, attendance, buzz, approval]);
    }
    
    await client.query('COMMIT');
    console.log(`[Cron:Politics] Successfully upserted ${members.length} members into DB.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Cron:Politics] DB transaction failed:', error);
  } finally {
    client.release();
  }
}

// Export for testing or cron runner
module.exports = { syncAssemblyMembers };

// If run directly from CLI:
if (require.main === module) {
  syncAssemblyMembers().then(() => pool.end());
}
