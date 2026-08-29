-- 1. People
CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT ALL ON public.people TO service_role;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "people_all" ON public.people FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE UNIQUE INDEX people_user_name_uniq ON public.people (user_id, lower(name));

-- 2. Categorization rules
CREATE TABLE public.categorization_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern text NOT NULL,
  match_type text NOT NULL DEFAULT 'contains',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  nature text,
  person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorization_rules TO authenticated;
GRANT ALL ON public.categorization_rules TO service_role;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorization_rules_all" ON public.categorization_rules FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.categorization_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX categorization_rules_user_idx ON public.categorization_rules (user_id, priority);

-- 3. Transaction classification columns
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS nature text NOT NULL DEFAULT 'unclassified',
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_debt_id uuid REFERENCES public.debts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserve_goal text,
  ADD COLUMN IF NOT EXISTS nature_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nature_source text NOT NULL DEFAULT 'manual';

CREATE INDEX IF NOT EXISTS transactions_nature_idx ON public.transactions (user_id, nature);
CREATE INDEX IF NOT EXISTS transactions_person_idx ON public.transactions (user_id, person_id);

-- 4. Safe backfill: existing transfers are confirmed internal transfers, everything else stays to review
UPDATE public.transactions SET nature = 'internal_transfer', nature_confirmed = true
  WHERE type = 'transfer';
UPDATE public.transactions SET nature = 'unclassified', nature_confirmed = false
  WHERE type <> 'transfer';