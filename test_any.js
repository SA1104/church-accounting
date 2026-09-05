const { Pool } = require('pg');
require('dotenv').config({path: 'backend/.env.development'});
const pool = new Pool({connectionString: process.env.DATABASE_URL});
(async () => {
    try {
        const candidateIds = ['8a510c4f-c006-4442-8924-f3c75ab73cf6'];
        const res = await pool.query('SELECT id FROM platform_projects WHERE id = ANY($1::uuid[])', [candidateIds]);
        console.log('Success:', res.rows);
    } catch(e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
})();
