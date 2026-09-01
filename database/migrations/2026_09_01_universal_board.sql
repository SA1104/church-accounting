-- Migration: Universal Board Schema for BoozaThink Portal
-- Description: Creates posts, comments, and likes tables shared across all 6 services.

BEGIN;

-- 1. Create enum for service categories
DO $$ BEGIN
    CREATE TYPE service_category AS ENUM (
        'stock', 'real_estate', 'politics', 'economy', 'mission', 'word_sharing'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create posts table
CREATE TABLE IF NOT EXISTS public.board_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category service_category NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create comments table
CREATE TABLE IF NOT EXISTS public.board_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create post likes table
CREATE TABLE IF NOT EXISTS public.board_post_likes (
    post_id UUID NOT NULL REFERENCES public.board_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- 5. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON public.board_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON public.board_comments(post_id, created_at ASC);

-- 6. Setup RLS (Row Level Security)
ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_post_likes ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for board_posts
-- Everyone can read
CREATE POLICY "Anyone can view posts" ON public.board_posts
    FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can create posts" ON public.board_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update/delete their own posts
CREATE POLICY "Users can update own posts" ON public.board_posts
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.board_posts
    FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS Policies for board_comments
CREATE POLICY "Anyone can view comments" ON public.board_comments
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.board_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.board_comments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.board_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 9. RLS Policies for board_post_likes
CREATE POLICY "Anyone can view likes" ON public.board_post_likes
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can toggle likes" ON public.board_post_likes
    FOR ALL USING (auth.uid() = user_id);

COMMIT;
