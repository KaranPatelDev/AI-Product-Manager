
CREATE TABLE public.task_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_id uuid NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  priority text DEFAULT 'nice-to-have',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.task_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.task_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.task_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.task_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.task_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
