const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`UPDATE politics_annual_stats SET dynamic_metrics = coalesce(dynamic_metrics, '{}'::jsonb) || '{"morality_index": 85, "wealth_fluctuation": 5.2, "sns_power": 90, "demographic_appeal": 75}'::jsonb WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '이재명')`);
    await pool.query(`UPDATE politics_annual_stats SET dynamic_metrics = coalesce(dynamic_metrics, '{}'::jsonb) || '{"morality_index": 92, "wealth_fluctuation": 2.1, "sns_power": 95, "demographic_appeal": 82}'::jsonb WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '한동훈')`);
    await pool.query(`UPDATE politics_annual_stats SET dynamic_metrics = coalesce(dynamic_metrics, '{}'::jsonb) || '{"morality_index": 88, "wealth_fluctuation": -1.5, "sns_power": 70, "demographic_appeal": 60}'::jsonb WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '안철수')`);
    await pool.query(`UPDATE politics_annual_stats SET dynamic_metrics = coalesce(dynamic_metrics, '{}'::jsonb) || '{"morality_index": 90, "wealth_fluctuation": 4.0, "sns_power": 80, "demographic_appeal": 70}'::jsonb WHERE politician_id = (SELECT id FROM politics_politicians WHERE name = '오세훈')`);
    console.log('Metrics added');
  } catch(e) {
    console.log(e);
  } finally {
    pool.end();
  }
}
run();
