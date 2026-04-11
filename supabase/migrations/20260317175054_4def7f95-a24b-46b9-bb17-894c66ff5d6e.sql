
-- Idea versions for pivot tracking
CREATE TABLE public.idea_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea text NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  analysis jsonb NOT NULL,
  scores jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.idea_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own versions" ON public.idea_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own versions" ON public.idea_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own versions" ON public.idea_versions FOR DELETE USING (auth.uid() = user_id);

-- Community ideas for public sharing and voting
CREATE TABLE public.community_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea text NOT NULL,
  description text,
  analysis_summary jsonb,
  viability_score integer,
  is_anonymous boolean NOT NULL DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view community ideas" ON public.community_ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own community ideas" ON public.community_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own community ideas" ON public.community_ideas FOR DELETE USING (auth.uid() = user_id);

-- Community votes
CREATE TABLE public.community_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea_id uuid NOT NULL REFERENCES public.community_ideas(id) ON DELETE CASCADE,
  vote_type text NOT NULL DEFAULT 'up' CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, idea_id)
);
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view votes" ON public.community_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own votes" ON public.community_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own votes" ON public.community_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.community_votes FOR DELETE USING (auth.uid() = user_id);

-- Community comments
CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idea_id uuid NOT NULL REFERENCES public.community_ideas(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view community comments" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE USING (auth.uid() = user_id);
