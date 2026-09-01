CREATE TABLE public.market_insights (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category text NOT NULL,
    title text NOT NULL,
    keywords text[] DEFAULT '{}',
    summary text NOT NULL,
    impact_analysis text NOT NULL,
    source_links jsonb DEFAULT '[]',
    view_count int DEFAULT 0,
    like_count int DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.insight_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_id uuid REFERENCES public.market_insights(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(insight_id, user_id, reaction_type)
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view insights" ON public.market_insights FOR SELECT USING (true);
-- For now, allow all to insert insights (we will tighten this to cron/service role later)
CREATE POLICY "Admin can insert insights" ON public.market_insights FOR ALL USING (true);

CREATE POLICY "Public can view reactions" ON public.insight_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert reactions" ON public.insight_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete reactions" ON public.insight_reactions FOR DELETE USING (auth.uid() = user_id);

-- Dummy data insertion for testing (Simulating the AI has run)
INSERT INTO public.market_insights (category, title, keywords, summary, impact_analysis, source_links, view_count, like_count)
VALUES 
('stock', '🔥 금리 인하 기대감 확산, 유동성 장세 초입 진입', '{"금리인하", "유동성", "미연준"}', '미 연준의 9월 금리 인하 가능성이 90% 이상으로 점쳐지며, 국내외 증시로 대규모 자금이 유입되고 있습니다. 특히 성장주 위주의 반등이 거셉니다.', '단기적으로 부채 비율이 높은 기술주와 헬스케어 섹터의 밸류에이션 리레이팅이 기대됩니다. 현금 비중을 줄이고 주도주 편입 비중을 늘릴 시점입니다.', '[{"title": "연준 매파도 비둘기로...", "url": "https://news.naver.com"}]', 145, 32),
('real_estate', '🏗️ 서울 핵심지 아파트 신고가 속출, 양극화 심화', '{"신고가", "강남3구", "공급부족"}', '서울 강남3구와 마용성을 중심으로 전고점을 돌파하는 아파트 단지가 속출하고 있습니다. 반면 외곽 지역은 여전히 하락세를 면치 못하고 있습니다.', '핵심지 위주의 "똘똘한 한 채" 선호 현상이 굳어질 것입니다. 투자 목적이라면 교통 호재가 확실한 수도권 핵심지 청약이나 급매물을 노려야 합니다.', '[{"title": "서울 아파트값 10주 연속 상승", "url": "https://news.naver.com"}]', 320, 88),
('economy', '📉 원/달러 환율 1330원대 안착, 수출 기업 희비 교차', '{"환율", "수출", "달러약세"}', '미국의 금리 인하 시그널로 강달러 기조가 꺾이면서 환율이 하향 안정화되고 있습니다. 반도체, 자동차 등 주요 수출 기업들의 3분기 실적 전망치가 조정되고 있습니다.', '환율 하락은 수입 물가를 안정시켜 내수 소비에는 긍정적이지만, 수출 주도형 기업의 영업이익률 하락을 가져옵니다. 내수 방어주에 관심을 가질 필요가 있습니다.', '[{"title": "환율 1330원대 턱걸이", "url": "https://news.naver.com"}]', 89, 12);
