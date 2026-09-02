const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const insight = {
    category: 'politics',
    title: '⚖️ [정치/정책] 여야 대치 심화 속 AI 기본법 입법 속도전',
    summary: '최근 여당과 야당의 정치적 대치가 심화되는 가운데서도, 국가 미래 경쟁력과 직결되는 "AI 기본법" 및 "반도체 지원법" 통과에는 모처럼 한목소리를 내고 있습니다. 이는 관련 산업의 법적 불확실성을 해소하는 긍정적 시그널입니다.',
    keywords: ['AI기본법', '반도체지원법', '여야협치', '입법영향도'],
    impact_analysis: '투자자 및 기업 입장에서는 AI와 반도체 섹터에 대한 규제 완화와 세제 혜택이 가시화됨에 따라, 관련 기업(설비투자, R&D)에 대한 투자 심리가 크게 개선될 것으로 기대됩니다. 정책 수혜주를 중심으로 한 포트폴리오 재편이 유효할 수 있습니다.',
    source_links: [
      { title: '국회 입법예고 시스템', url: 'https://pal.assembly.go.kr' }
    ]
  };
  const { data } = await supabase.from('market_insights').insert([insight]).select();
  console.log('Inserted:', data[0].id);
}
run();
