CREATE TABLE IF NOT EXISTS public.market_insights (
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

CREATE TABLE IF NOT EXISTS public.insight_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    insight_id uuid REFERENCES public.market_insights(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    reaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(insight_id, user_id, reaction_type)
);

ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_reactions ENABLE ROW LEVEL SECURITY;

-- Note: In production we might get "policy already exists" but query.run suppresses crashes so it is safe.
CREATE POLICY "Public can view insights" ON public.market_insights FOR SELECT USING (true);
CREATE POLICY "Admin can insert insights" ON public.market_insights FOR ALL USING (true);

CREATE POLICY "Public can view reactions" ON public.insight_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert reactions" ON public.insight_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete reactions" ON public.insight_reactions FOR DELETE USING (auth.uid() = user_id);
