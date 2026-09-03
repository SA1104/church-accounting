const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));

async function generateMarketInsight(category, apiKey, previousInsight = null) {
  if (!apiKey) {
    console.error('[AI] Cannot generate insight: OPENAI_API_KEY is missing.');
    return null;
  }

  const systemPrompt = `You are 'BoozaThink AI', an elite market analyst and strategist. Your job is to analyze current market trends and provide concise, highly actionable insights.
Respond ONLY with a valid raw JSON object. Do not include markdown code blocks like \`\`\`json.`;

  let userPrompt = `Generate a high-quality, realistic daily market insight for the category "${category}" focusing on current real-world South Korean or Global economic trends (e.g., AI semiconductors, Fed rate cuts, real estate policies).

The output must be a single JSON object with the following exact keys:
{
  "category": "${category}",
  "title": "[Catchy title with one relevant emoji at the start]",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "summary": "[2-3 sentences explaining the core situation or news]",
  "impact_analysis": "[2-3 sentences explaining what this means for investors and actionable advice]",
  "source_links": [{"title": "관련 기사 검색", "url": "https://search.naver.com/search.naver?query=시장동향"}]
}
Ensure the text is written in professional, natural Korean (한국어).`;

  // Deduplication check logic: only ask AI to deduplicate if the last insight was within the last 12 hours
  const isRecent = previousInsight && previousInsight.created_at && (Date.now() - new Date(previousInsight.created_at).getTime() < 12 * 60 * 60 * 1000);

  if (previousInsight && isRecent) {
    userPrompt += `

[CRITICAL INSTRUCTION FOR DEDUPLICATION]
The previous insight generated for this category was:
Title: ${previousInsight.title}
Summary: ${previousInsight.summary}

Since market situations do not change drastically multiple times a day, there is a high probability that the news is identical or very similar to the previous insight.
Simulate whether a significant new market event has occurred.
If the current news or situation is very similar to the previous insight, or if you have nothing significantly new to report, you MUST skip generation to prevent user fatigue.
If you decide to skip, return EXACTLY this JSON and nothing else:
{ "skip": true }`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
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
