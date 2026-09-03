const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../../../scratch/church-accounting/backend/.env.development') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`ALTER TABLE politics_politicians ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) DEFAULT 'ASSEMBLY_MEMBER'`);
    await pool.query(`ALTER TABLE politics_annual_stats ADD COLUMN IF NOT EXISTS dynamic_metrics JSONB DEFAULT '{}'::jsonb`);
    
    // Set Han Dong-hoon as EXTRA_PARLIAMENTARY (원외인사)
    await pool.query(`UPDATE politics_politicians SET role_type = 'EXTRA_PARLIAMENTARY' WHERE name = '한동훈'`);
    
    // Add Oh Se-hoon as MAYOR
    const ohId = await pool.query(`
      INSERT INTO politics_politicians (id, name, profile_image_url, gender, party_name, namuwiki_url, role_type, created_at, updated_at)
      VALUES (gen_random_uuid(), '오세훈', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Oh_Se-hoon_in_2021.jpg/500px-Oh_Se-hoon_in_2021.jpg?utm_source=ko.wikipedia.org&utm_campaign=api&utm_content=thumbnail_unscaled', 'MALE', '국민의힘', 'https://namu.wiki/w/%EC%98%A4%EC%84%B8%ED%9B%88', 'MAYOR', NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET role_type = 'MAYOR'
      RETURNING id
    `);
    
    // Add stats for Oh Se-hoon
    await pool.query(`
      INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, buzz_index, dynamic_metrics)
      VALUES ($1, 2026, 5900000000, 85, '{"admin_rating": 72, "budget_execution": 95, "presidential_support": 35}')
      ON CONFLICT (politician_id, record_year) DO UPDATE SET buzz_index = 85
    `, [ohId.rows[0].id]);
    
    // Add dynamic metrics for Han Dong-hoon
    await pool.query(`
      UPDATE politics_annual_stats 
      SET dynamic_metrics = '{"party_control": 88, "presidential_support": 42}'
      WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '한동훈')
    `);
    
    console.log('Schema and mock data updated.');
  } catch (e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
}
run();
