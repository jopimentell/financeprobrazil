-- 1) Merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  default_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS merchants_user_name_lower_uniq
  ON public.merchants (user_id, lower(name));
CREATE INDEX IF NOT EXISTS merchants_user_idx ON public.merchants(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.merchants TO authenticated;
GRANT ALL ON public.merchants TO service_role;

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own merchants"
  ON public.merchants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all merchants"
  ON public.merchants FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Add merchant_id to transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_user_merchant_idx
  ON public.transactions(user_id, merchant_id);
