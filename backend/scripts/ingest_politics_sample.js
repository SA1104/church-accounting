require('dotenv').config({ path: 'backend/.env.development' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fetchWikiSummary(title) {
  const url = `https://ko.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&titles=${encodeURIComponent(title)}&format=json&pithumbsize=500`;
  const res = await fetch(url);
  const data = await res.json();
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  if (pageId === '-1') return null;
  
  const page = pages[pageId];
  return {
    extract: page.extract,
    imageUrl: page.thumbnail ? page.thumbnail.source : null,
    namuwikiUrl: `https://namu.wiki/w/${encodeURIComponent(title)}`
  };
}

async function run() {
  const politicians = ['이재명', '한동훈', '안철수'];
  
  for (const name of politicians) {
    console.log(`Fetching data for ${name}...`);
    const wikiData = await fetchWikiSummary(name);
    
    if (wikiData) {
      console.log(`- Image: ${wikiData.imageUrl}`);
      const gender = 'M';
      
      try {
        const query = `
          INSERT INTO politics_politicians (name, gender, profile_image_url, namuwiki_url) 
          VALUES ($1, $2, $3, $4) 
          ON CONFLICT DO NOTHING
          RETURNING id;
        `;
        const res = await pool.query(query, [name, gender, wikiData.imageUrl, wikiData.namuwikiUrl]);
        
        let pId = res.rows.length > 0 ? res.rows[0].id : null;
        if (!pId) {
          const fetchRes = await pool.query(`SELECT id FROM politics_politicians WHERE name = $1`, [name]);
          pId = fetchRes.rows[0].id;
        }
        
        console.log(`- Inserted into DB with ID: ${pId}`);
        
        const buzz = Math.floor(Math.random() * 30) + 70; 
        const wealth = Math.floor(Math.random() * 5000000000) + 1000000000;
        const fulfill = Math.floor(Math.random() * 40) + 50;
        
        await pool.query(`
          INSERT INTO politics_annual_stats (politician_id, record_year, declared_wealth, pledge_fulfillment_rate, attendance_rate, buzz_index, approval_rating)
          VALUES ($1, 2026, $2, $3, 95.0, $4, 40.0)
          ON CONFLICT (politician_id, record_year) DO NOTHING;
        `, [pId, wealth, fulfill, buzz]);
        
        console.log(`- Inserted annual stats for ${name}`);
      } catch (err) {
        console.error('DB Error:', err);
      }
    }
  }
  
  pool.end();
}

run();
