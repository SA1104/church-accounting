const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
const { query } = require('../../core/db');

// Map categories to search keywords for Google News RSS
const CATEGORY_KEYWORDS = {
  'stock': '주식 시장 OR 증시',
  'real_estate': '부동산 시장 OR 아파트 가격',
  'economy': '거시 경제 OR 금리 OR 환율',
  'politics': '정치 OR 국회 OR 정책'
};

async function fetchGoogleNewsRSS(keyword) {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    // Use Google News RSS feed for the query (Korean, South Korea)
    const url = `https://news.google.com/rss/search?q=${encodedKeyword}&hl=ko&gl=KR&ceid=KR:ko`;
    const res = await fetch(url);
    const xml = await res.text();
    
    // Very basic regex-based XML parsing to avoid large dependencies like xml2js if possible
    // Note: For production, a proper XML parser is recommended. 
    // We extract <item> blocks.
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          description: descMatch ? descMatch[1].replace(/<[^>]*>?/gm, '').trim() : '' // strip HTML tags
        });
      }
    }
    
    return items.slice(0, 20); // Top 20 results
  } catch (err) {
    console.error(`[News Fetcher] Failed to fetch news for ${keyword}:`, err);
    return [];
  }
}

async function fetchAndStoreCandidates() {
  console.log('[News Fetcher] Starting to fetch news candidates...');
  let totalSaved = 0;
  
  for (const [category, keyword] of Object.entries(CATEGORY_KEYWORDS)) {
    console.log(`[News Fetcher] Fetching candidates for ${category}...`);
    const articles = await fetchGoogleNewsRSS(keyword);
    
    for (const article of articles) {
      // Check if it already exists to avoid duplicates
      const exists = await query.get(
        `SELECT id FROM public.insight_candidates WHERE category = ? AND title = ?`, 
        [category, article.title]
      );
      
      if (!exists) {
        await query.run(`
          INSERT INTO public.insight_candidates (category, title, link, pub_date, description)
          VALUES (?, ?, ?, ?, ?)
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
