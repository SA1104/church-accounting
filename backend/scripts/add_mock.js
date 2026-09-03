const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.development') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const members = [
      { name: '김동연', party: '더불어민주당', role: 'MAYOR', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 89, "wealth_fluctuation": 1.2, "sns_power": 65, "demographic_appeal": 78}', approval: 65, buzz: 72 },
      { name: '정청래', party: '더불어민주당', role: 'ASSEMBLY_MEMBER', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 50, "wealth_fluctuation": 8.5, "sns_power": 92, "demographic_appeal": 45}', approval: 40, buzz: 95 },
      { name: '고민정', party: '더불어민주당', role: 'ASSEMBLY_MEMBER', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 75, "wealth_fluctuation": 3.0, "sns_power": 85, "demographic_appeal": 60}', approval: 55, buzz: 80 },
      { name: '이준석', party: '개혁신당', role: 'ASSEMBLY_MEMBER', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 65, "wealth_fluctuation": 2.5, "sns_power": 98, "demographic_appeal": 85}', approval: 45, buzz: 99 },
      { name: '천하람', party: '개혁신당', role: 'ASSEMBLY_MEMBER', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 85, "wealth_fluctuation": 1.0, "sns_power": 75, "demographic_appeal": 70}', approval: 60, buzz: 65 },
      { name: '홍준표', party: '국민의힘', role: 'MAYOR', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 55, "wealth_fluctuation": 4.2, "sns_power": 90, "demographic_appeal": 50}', approval: 42, buzz: 88 },
      { name: '유승민', party: '국민의힘', role: 'EXTRA_PARLIAMENTARY', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/200px-User_icon_2.svg.png', dyn: '{"morality_index": 95, "wealth_fluctuation": 0.5, "sns_power": 60, "demographic_appeal": 75}', approval: 68, buzz: 55 },
    ];
    
    for (const m of members) {
      const url = `https://namu.wiki/w/${encodeURIComponent(m.name)}`;
      const pRes = await pool.query(`
        INSERT INTO politics_politicians (id, name, profile_image_url, gender, party_name, namuwiki_url, role_type, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, 'MALE', $3, $4, $5, NOW(), NOW())
        ON CONFLICT (name) DO UPDATE SET role_type = $5, party_name = $3
        RETURNING id
      `, [m.name, m.img, m.party, url, m.role]);
      
      await pool.query(`
        INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, buzz_index, approval_rating, dynamic_metrics)
        VALUES ($1, 2026, 2000000000, $2, $3, $4::jsonb)
        ON CONFLICT (politician_id, record_year) DO UPDATE SET buzz_index = $2, approval_rating = $3, dynamic_metrics = $4::jsonb
      `, [pRes.rows[0].id, m.buzz, m.approval, m.dyn]);
    }
    
    console.log('Extra mock data added');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
