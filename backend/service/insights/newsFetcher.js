const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
const db = require('../../core/db');

// Map categories to search keywords for Google News RSS
const CATEGORY_KEYWORDS = {
  'stock': '주식 시장',
  'real_estate': '부동산 시장',
  'economy': '거시 경제',
  'politics': '정치 정책'
};

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
      let desc = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
      
      // Clean HTML from title and description
      const cleanTitle = title ? title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/<[^>]*>?/gm, '').trim() : '';
      const cleanDesc = desc ? desc.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>?/gm, '').trim() : '';
      
      if (cleanTitle && link) {
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
  
  for (const [category, keyword] of Object.entries(CATEGORY_KEYWORDS)) {
    console.log(`[News Fetcher] Fetching candidates for ${category}...`);
    const articles = await fetchGoogleNewsRSS(keyword);
    
    for (const article of articles) {
      // Check if it already exists to avoid duplicates
      const existsResult = await db.pool.query(
        `SELECT id FROM public.insight_candidates WHERE category = $1 AND title = $2`, 
        [category, article.title]
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
