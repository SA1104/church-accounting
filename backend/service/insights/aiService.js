const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));

async function generateMarketInsight(category, apiKey, selectedArticles = []) {
  if (!apiKey) {
    console.error('[AI] Cannot generate insight: OPENAI_API_KEY is missing.');
    return null;
  }
  
  if (!selectedArticles || selectedArticles.length === 0) {
    console.error('[AI] No articles selected for HITL generation.');
    return null;
  }

  const systemPrompt = `You are 'BoozaThink AI', an elite market analyst and strategist. Your job is to analyze the provided news articles and synthesize them into a concise, highly actionable market insight.
Respond ONLY with a valid raw JSON object. Do not include markdown code blocks like \`\`\`json.`;

  const articlesText = selectedArticles.map((a, i) => `[Article ${i+1}] Title: ${a.title}\nSummary: ${a.description}`).join('\n\n');

  const userPrompt = `Synthesize the following real-world news articles into a single, high-quality daily market insight for the category "${category}".

RAW ARTICLES:
${articlesText}

The output must be a single JSON object with the following exact keys:
{
  "category": "${category}",
  "title": "[Catchy title summarizing the main theme, with one relevant emoji at the start]",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "[2-3 sentences briefly explaining the core situation or news for the summary card view]",
  "content_detailed": "[A comprehensive, deep-dive analysis (3-5 paragraphs) synthesizing the facts from the articles, explaining the broader context and market implications. Use markdown formatting like bold text and bullet points if helpful.]",
  "impact_analysis": "[2-3 sentences explaining the overarching actionable advice for investors]",
  "affected_sectors": ["Sector 1", "Sector 2"],
  "source_links": [{"title": "Source 1", "url": "https://..."}]
}

CRITICAL RULES:
1. For "affected_sectors", list the broader industries or sectors (e.g., "반도체 장비", "건설 자재", "금융업") that will likely benefit or suffer. DO NOT name specific individual companies (e.g., "Samsung Electronics") to avoid risk.
2. For "source_links", extract the titles and URLs of the most important 1 or 2 articles from the provided RAW ARTICLES.
3. Ensure the text is written in professional, natural Korean (한국어).`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use a smarter model for synthesis
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content.trim();
    
    // Clean up potential markdown formatting if the AI disobeys
    let cleanText = rawText;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    return JSON.parse(cleanText.trim());
  } catch (err) {
    console.error('[AI] Failed to generate insight:', err.message);
    return null;
  }
}

module.exports = {
  generateMarketInsight
};
