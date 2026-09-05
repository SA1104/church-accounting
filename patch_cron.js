const fs = require('fs');
let code = fs.readFileSync('backend/service/insights/cron.js', 'utf8');

if (!code.includes("const { Pool }")) {
    code = code.replace(
        "const { query } = require('../../core/db');",
        "const { query } = require('../../core/db');\nconst { Pool } = require('pg');\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL });"
    );
}

// Fix fetch query
code = code.replace(
    "const placeholders = candidateIds.map(() => '?').join(',');\n  const articlesRes = await query.all(`SELECT id, title, description FROM insight_candidates WHERE category = ? AND id IN (${placeholders})`, [category, ...candidateIds]);",
    "const articlesRes = await pool.query(`SELECT id, title, description FROM insight_candidates WHERE category = $1 AND id = ANY($2)`, [category, candidateIds]);\n  const articles = articlesRes.rows || [];"
);

// We need to remove the subsequent `const articles = articlesRes || [];` to avoid conflicts
code = code.replace(
    "const articles = articlesRes || [];",
    ""
);

// Fix INSERT query in cron.js to use pool.query
code = code.replace(
    /await query\.run\(`[\s\S]*?VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?, 'PUBLISHED'\)[\s\S]*?\]\);/,
    `await pool.query(\`
      INSERT INTO public.market_insights (category, title, keywords, summary, content_detailed, impact_analysis, affected_sectors, source_links, source_articles_used, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PUBLISHED')
    \`, [
      insight.category || category,
      insight.title,
      keywordsPg,
      insight.summary,
      insight.content_detailed || '',
      insight.impact_analysis,
      sectorsPg,
      JSON.stringify(insight.source_links || []),
      JSON.stringify(candidateIds)
    ]);`
);

// Fix UPDATE query
code = code.replace(
    "await query.run(`UPDATE insight_candidates SET is_used = true WHERE id IN (${placeholders})`, [...candidateIds]);",
    "await pool.query(`UPDATE insight_candidates SET is_used = true WHERE id = ANY($1)`, [candidateIds]);"
);

fs.writeFileSync('backend/service/insights/cron.js', code);
console.log('Patched cron.js');
