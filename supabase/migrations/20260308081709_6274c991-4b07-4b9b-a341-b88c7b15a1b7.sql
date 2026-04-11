
CREATE TABLE public.shared_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  permission text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shares" ON public.shared_analyses FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Recipients can view shares" ON public.shared_analyses FOR SELECT TO authenticated USING (shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE TABLE public.analysis_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible analyses" ON public.analysis_comments FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.analyses WHERE id = analysis_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.shared_analyses WHERE analysis_id = analysis_comments.analysis_id AND shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Authenticated users can insert comments" ON public.analysis_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.analysis_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_comments;
