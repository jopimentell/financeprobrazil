
-- Drop existing tables to recreate aligned with app code
DROP TABLE IF EXISTS public.admin_logs CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.plan_limits CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.categorization_rules CASCADE;
DROP TABLE IF EXISTS public.planning CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.credit_cards CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;
DROP TYPE IF EXISTS public.account_type CASCADE;
DROP TYPE IF EXISTS public.category_type CASCADE;
DROP TYPE IF EXISTS public.subscription_status CASCADE;

-- ============ ACCOUNTS ============
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking',
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_all" ON public.accounts FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_all" ON public.categories FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ CREDIT CARDS ============
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "limit" NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 1,
  due_day INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_cards_all" ON public.credit_cards FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ TRANSACTIONS ============
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID,
  category_id UUID,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  date DATE NOT NULL,
  recurrence TEXT,
  installments INTEGER,
  notes TEXT,
  parcelamento_id UUID,
  origin TEXT DEFAULT 'manual',
  parcela_atual INTEGER,
  total_parcelas INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_all" ON public.transactions FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- ============ DEBTS ============
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor TEXT NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  installments INTEGER DEFAULT 1,
  paid_installments INTEGER DEFAULT 0,
  interest_rate NUMERIC(7,2) DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debts_all" ON public.debts FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ INVESTMENTS ============
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  invested_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  profit NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investments_all" ON public.investments FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ FORECAST ============
CREATE TABLE public.forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  expected_income NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  projected_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);
ALTER TABLE public.forecast ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forecast_all" ON public.forecast FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ CREDIT CARD EXPENSES ============
CREATE TABLE public.credit_card_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  category TEXT,
  purchase_date DATE NOT NULL,
  installments INTEGER,
  current_installment INTEGER,
  total_installments INTEGER,
  parent_expense_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_card_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cce_all" ON public.credit_card_expenses FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ PAID INVOICES ============
CREATE TABLE public.paid_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount NUMERIC(14,2) NOT NULL,
  transaction_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.paid_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paid_invoices_all" ON public.paid_invoices FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ SYSTEM LOGS ============
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_insert" ON public.system_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "logs_select" ON public.system_logs FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_free BOOLEAN NOT NULL DEFAULT false,
  badge TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_select" ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "plans_admin" ON public.plans FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PLAN LIMITS ============
CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE UNIQUE,
  max_accounts INTEGER NOT NULL DEFAULT 5,
  max_transactions_per_month INTEGER NOT NULL DEFAULT 100,
  max_categories INTEGER NOT NULL DEFAULT 20,
  max_goals INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_limits_select" ON public.plan_limits FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_limits_admin" ON public.plan_limits FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PLAN FEATURES ============
CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_features_select" ON public.plan_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_features_admin" ON public.plan_features FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PLAN SETTINGS ============
CREATE TABLE public.plan_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monetization_enabled BOOLEAN NOT NULL DEFAULT false,
  default_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_settings_select" ON public.plan_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_settings_admin" ON public.plan_settings FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs_admin" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TRIGGERS updated_at ============
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['accounts','categories','credit_cards','transactions','debts','investments','forecast','credit_card_expenses','plans','plan_limits','plan_features','plan_settings','subscriptions']
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
  END LOOP;
END $$;

-- ============ SEED PLANS ============
INSERT INTO public.plans (name, description, price_monthly, price_yearly, is_active, is_free, color)
VALUES ('Gratuito','Plano básico gratuito',0,0,true,true,'#6b7280');

INSERT INTO public.plan_limits (plan_id, max_accounts, max_transactions_per_month, max_categories, max_goals)
SELECT id, 3, 100, 20, 3 FROM public.plans WHERE name='Gratuito';

INSERT INTO public.plan_settings (monetization_enabled, default_plan_id)
SELECT false, id FROM public.plans WHERE name='Gratuito';
