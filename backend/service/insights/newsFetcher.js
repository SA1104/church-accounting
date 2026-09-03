const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));
const { query } = require('../../core/db');

// Map categories to search keywords for Naver News API
const CATEGORY_KEYWORDS = {
  'stock': '주식 시장',
  'real_estate': '부동산 시장',
  'economy': '거시 경제',
  'politics': '정치 정책'
};

async function fetchNaverNewsAPI(keyword) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[News Fetcher] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is missing!');
    return [];
  }

  try {
    const encodedKeyword = encodeURIComponent(keyword);
    let url = `https://openapi.naver.com/v1/search/news.json?query=${encodedKeyword}&display=20&sort=date`;
    
    // NCP API HUB typically uses these headers even for legacy APIs, or the legacy ones.
    // We try the standard X-Naver-Client-Id first, if 401, we fallback to X-NCP-APIGW headers.
    let res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret
      }
    });

    if (res.status === 401) {
      console.log('[News Fetcher] X-Naver-Client-Id failed with 401. Trying X-NCP-APIGW-API-KEY headers...');
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': clientId,
          'X-NCP-APIGW-API-KEY': clientSecret
        }
      });
    }

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[News Fetcher] Naver API Error: ${res.status} - ${errorText}`);
      return [];
    }

    const data = await res.json();
    
    // Naver News items have: title, originallink, link, description, pubDate
    const items = data.items.map(item => ({
      title: item.title.replace(/<[^>]*>?/gm, '').trim(), // strip HTML tags (Naver returns <b> tags for match)
      link: item.link,
      pubDate: new Date(item.pubDate),
      description: item.description.replace(/<[^>]*>?/gm, '').trim()
    }));
    
    return items;
  } catch (err) {
    console.error(`[News Fetcher] Failed to fetch news for ${keyword}:`, err);
    return [];
  }
}

async function fetchAndStoreCandidates() {
  console.log('[News Fetcher] Starting to fetch news candidates from Naver...');
  let totalSaved = 0;
  
  for (const [category, keyword] of Object.entries(CATEGORY_KEYWORDS)) {
    console.log(`[News Fetcher] Fetching candidates for ${category}...`);
    const articles = await fetchNaverNewsAPI(keyword);
    
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
