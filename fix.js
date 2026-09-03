const fs = require('fs');

let content = fs.readFileSync('backend/service/insights/db_schema.js', 'utf8');

content = content.replace(/INSERT INTO public\.market_insights[\s\S]*?\);/g, `INSERT INTO public.market_insights (category, title, keywords, summary, impact_analysis, source_links, view_count, like_count) VALUES ('stock', 'AI Test Dummy 1', '{"AI", "Test"}', 'This is a test summary', 'This is an impact analysis', '[]', 145, 32), ('real_estate', 'AI Test Dummy 2', '{"Test"}', 'Test 2 summary', 'Test 2 impact', '[]', 320, 88);`);

fs.writeFileSync('backend/service/insights/db_schema.js', content, 'utf8');
console.log('Fixed db_schema.js');
