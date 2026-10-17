const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
const db = require('../../core/db');

// Map categories to search keywords for Google News RSS
const CATEGORY_KEYWORDS = {
  'stock': '(코스피 OR 코스닥 OR 국내증시 OR 주식시장) -Vietnam.vn -IDNFinancials',
  'real_estate': '(부동산 시장 OR 집값 OR 전세값 OR 분양 시장) -Vietnam.vn -IDNFinancials',
  'economy': '(기준금리 OR 환율 OR 소비자물가 OR 한국은행 OR 경제성장률 OR 무역수지) -Vietnam.vn -IDNFinancials',
  'politics': '(국회 OR 여야 OR 대통령실 OR 정당 OR 국정감사) -Vietnam.vn -IDNFinancials'
};

const BLOCKED_SOURCES = [
  'vietnam.vn',
  'idnfinancials',
  'calgary roughnecks'
];

function isBlockedArticle(title = '', desc = '', link = '', source = '') {
  const combined = `${title} ${desc} ${link} ${source}`.toLowerCase();
  return BLOCKED_SOURCES.some(blocked => combined.includes(blocked));
}

async function fetchGoogleNewsRSS(keyword) {
  try {
    const encodedKeyword = encodeURIComponent(keyword + ' when:1d');
    const url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ko&gl=KR&ceid=KR:ko`;
    
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[News Fetcher] Google RSS Error: ${res.status}`);
      return [];
    }

    const text = await res.text();
    const items = [];
    const regex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>([^<]+)<\/title>/)?.[1];
      const link = itemXml.match(/<link>([^<]+)<\/link>/)?.[1];
      const pubDate = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1];
      const source = itemXml.match(/<source[^>]*>([^<]+)<\/source>/)?.[1] || '';
      let desc = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
      
      // Clean HTML from title and description
      const cleanTitle = title ? title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/<[^>]*>?/gm, '').trim() : '';
      const cleanDesc = desc ? desc.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>?/gm, '').trim() : '';
      
      if (cleanTitle && link && !isBlockedArticle(cleanTitle, cleanDesc, link, source)) {
        items.push({
          title: cleanTitle,
          link,
          pubDate: new Date(pubDate || Date.now()),
          description: cleanDesc
        });
      }
    }
    
    // Google returns many, limit to 20 like Naver did
    return items.slice(0, 20);
  } catch (err) {
    console.error(`[News Fetcher] Failed to fetch news for ${keyword}:`, err);
    return [];
  }
}

async function fetchAndStoreCandidates() {
  console.log('[News Fetcher] Starting to fetch news candidates from Google RSS...');
  let totalSaved = 0;

  try {
    const cleanupRes = await db.pool.query(`
      DELETE FROM public.insight_candidates
      WHERE is_used = false
        AND (
          title ILIKE '%Vietnam.vn%'
          OR description ILIKE '%Vietnam.vn%'
          OR link ILIKE '%vietnam.vn%'
          OR title ILIKE '%IDNFinancials%'
          OR description ILIKE '%IDNFinancials%'
          OR title ILIKE '%Calgary Roughnecks%'
        )
    `);
    if (cleanupRes.rowCount > 0) {
      console.log(`[News Fetcher] Cleaned up ${cleanupRes.rowCount} foreign/spam candidate articles.`);
    }
  } catch (cleanupErr) {
    console.error('[News Fetcher] Failed to clean up foreign/spam candidates:', cleanupErr.message);
  }
  
  for (const [category, keyword] of Object.entries(CATEGORY_KEYWORDS)) {
    console.log(`[News Fetcher] Fetching candidates for ${category}...`);
    const articles = await fetchGoogleNewsRSS(keyword);
    
    for (const article of articles) {
      // Check if it already exists by link to avoid unique constraint violations
      const existsResult = await db.pool.query(
        `SELECT id FROM public.insight_candidates WHERE link = $1`, 
        [article.link]
      );
      const exists = existsResult.rows.length > 0;
      
      if (!exists) {
        await db.pool.query(`
          INSERT INTO public.insight_candidates (category, title, link, pub_date, description)
          VALUES ($1, $2, $3, $4, $5)
        `, [category, article.title, article.link, article.pubDate, article.description]);
        totalSaved++;
      }
    }
  }
  
  console.log(`[News Fetcher] Finished fetching. Total new candidates saved: ${totalSaved}`);
  return totalSaved;
}

module.exports = {
  fetchAndStoreCandidates
};
