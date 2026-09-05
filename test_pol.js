const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query(`SELECT id, name, party_name, original_url, (birth_date IS NOT NULL) as has_birth, (profile_image_url IS NOT NULL) as has_image, (election_precinct IS NOT NULL) as has_precinct, created_at FROM politics_politicians ORDER BY name ASC LIMIT 5`).then(res => {
    console.log(res.rows);
    process.exit(0);
}).catch(e => {
    console.error(e.message);
    process.exit(1);
});
