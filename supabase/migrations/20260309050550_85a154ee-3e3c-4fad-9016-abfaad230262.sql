
-- ===================== PLANS SYSTEM TABLES =====================

-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_free boolean NOT NULL DEFAULT false,
  badge text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read active plans
CREATE POLICY "Anyone can read active plans" ON public.plans AS PERMISSIVE FOR SELECT TO authenticated USING (true);
-- Only admins can manage plans
CREATE POLICY "Admins manage plans" ON public.plans AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Plan features table
CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  UNIQUE(plan_id, feature_key)
);
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan features" ON public.plan_features AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan features" ON public.plan_features AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Plan limits table
CREATE TABLE public.plan_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE UNIQUE,
  max_accounts integer NOT NULL DEFAULT 5,
  max_transactions_per_month integer NOT NULL DEFAULT 500,
  max_categories integer NOT NULL DEFAULT 20,
  max_goals integer NOT NULL DEFAULT 5
);
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan limits" ON public.plan_limits AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan limits" ON public.plan_limits AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'canceled', 'expired')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscriptions" ON public.subscriptions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Plan system settings (single-row table)
CREATE TABLE public.plan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monetization_enabled boolean NOT NULL DEFAULT false,
  default_plan_id uuid REFERENCES public.plans(id)
);
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan settings" ON public.plan_settings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan settings" ON public.plan_settings AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ===================== SEED DEFAULT DATA =====================

-- Insert default plans
INSERT INTO public.plans (id, name, description, price_monthly, price_yearly, is_active, is_free, badge) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Free', 'Para quem está começando a organizar suas finanças.', 0, 0, true, true, 'Gratuito'),
  ('00000000-0000-0000-0000-000000000002', 'Pro', 'Para quem quer controle total com recursos avançados.', 19.90, 189.90, true, false, 'Popular'),
  ('00000000-0000-0000-0000-000000000003', 'Premium', 'Para profissionais que exigem o máximo do sistema.', 39.90, 379.90, true, false, 'Completo');

-- Insert plan limits
INSERT INTO public.plan_limits (plan_id, max_accounts, max_transactions_per_month, max_categories, max_goals) VALUES
  ('00000000-0000-0000-0000-000000000001', 2, 100, 10, 2),
  ('00000000-0000-0000-0000-000000000002', 10, 1000, 50, 20),
  ('00000000-0000-0000-0000-000000000003', -1, -1, -1, -1);

-- Insert plan settings
INSERT INTO public.plan_settings (monetization_enabled, default_plan_id) VALUES (false, '00000000-0000-0000-0000-000000000001');

-- Insert plan features for Free plan
INSERT INTO public.plan_features (plan_id, feature_key, enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'create_income', true),
  ('00000000-0000-0000-0000-000000000001', 'create_expense', true),
  ('00000000-0000-0000-0000-000000000001', 'edit_transactions', true),
  ('00000000-0000-0000-0000-000000000001', 'delete_transactions', true),
  ('00000000-0000-0000-0000-000000000001', 'create_accounts', true),
  ('00000000-0000-0000-0000-000000000001', 'basic_reports', true),
  ('00000000-0000-0000-0000-000000000001', 'financial_charts', true),
  ('00000000-0000-0000-0000-000000000001', 'category_analysis', true),
  ('00000000-0000-0000-0000-000000000001', 'monthly_analysis', true),
  ('00000000-0000-0000-0000-000000000001', 'search_transactions', true),
  ('00000000-0000-0000-0000-000000000001', 'custom_categories', true),
  ('00000000-0000-0000-0000-000000000001', 'transaction_notes', true),
  ('00000000-0000-0000-0000-000000000001', 'financial_goals', true),
  ('00000000-0000-0000-0000-000000000001', 'transfer_between_accounts', false),
  ('00000000-0000-0000-0000-000000000001', 'attachments', false),
  ('00000000-0000-0000-0000-000000000001', 'unlimited_accounts', false),
  ('00000000-0000-0000-0000-000000000001', 'multi_accounts', false),
  ('00000000-0000-0000-0000-000000000001', 'advanced_reports', false),
  ('00000000-0000-0000-0000-000000000001', 'export_data', false),
  ('00000000-0000-0000-0000-000000000001', 'export_csv', false),
  ('00000000-0000-0000-0000-000000000001', 'export_excel', false),
  ('00000000-0000-0000-0000-000000000001', 'export_pdf', false),
  ('00000000-0000-0000-0000-000000000001', 'advanced_dashboard', false),
  ('00000000-0000-0000-0000-000000000001', 'financial_insights', false),
  ('00000000-0000-0000-0000-000000000001', 'monthly_budget', false),
  ('00000000-0000-0000-0000-000000000001', 'debt_simulator', false),
  ('00000000-0000-0000-0000-000000000001', 'wealth_planner', false),
  ('00000000-0000-0000-0000-000000000001', 'advanced_filters', false),
  ('00000000-0000-0000-0000-000000000001', 'duplicate_transactions', false),
  ('00000000-0000-0000-0000-000000000001', 'recurring_transactions', false),
  ('00000000-0000-0000-0000-000000000001', 'import_csv', false),
  ('00000000-0000-0000-0000-000000000001', 'import_ofx', false),
  ('00000000-0000-0000-0000-000000000001', 'auto_import', false),
  ('00000000-0000-0000-0000-000000000001', 'transaction_tags', false),
  ('00000000-0000-0000-0000-000000000001', 'two_factor_auth', false),
  ('00000000-0000-0000-0000-000000000001', 'login_history', false),
  ('00000000-0000-0000-0000-000000000001', 'active_sessions', false);

-- Insert plan features for Pro plan
INSERT INTO public.plan_features (plan_id, feature_key, enabled) VALUES
  ('00000000-0000-0000-0000-000000000002', 'create_income', true),
  ('00000000-0000-0000-0000-000000000002', 'create_expense', true),
  ('00000000-0000-0000-0000-000000000002', 'edit_transactions', true),
  ('00000000-0000-0000-0000-000000000002', 'delete_transactions', true),
  ('00000000-0000-0000-0000-000000000002', 'transfer_between_accounts', true),
  ('00000000-0000-0000-0000-000000000002', 'attachments', false),
  ('00000000-0000-0000-0000-000000000002', 'create_accounts', true),
  ('00000000-0000-0000-0000-000000000002', 'unlimited_accounts', false),
  ('00000000-0000-0000-0000-000000000002', 'multi_accounts', true),
  ('00000000-0000-0000-0000-000000000002', 'basic_reports', true),
  ('00000000-0000-0000-0000-000000000002', 'advanced_reports', true),
  ('00000000-0000-0000-0000-000000000002', 'export_data', true),
  ('00000000-0000-0000-0000-000000000002', 'export_csv', true),
  ('00000000-0000-0000-0000-000000000002', 'export_excel', true),
  ('00000000-0000-0000-0000-000000000002', 'export_pdf', false),
  ('00000000-0000-0000-0000-000000000002', 'financial_charts', true),
  ('00000000-0000-0000-0000-000000000002', 'advanced_dashboard', true),
  ('00000000-0000-0000-0000-000000000002', 'category_analysis', true),
  ('00000000-0000-0000-0000-000000000002', 'monthly_analysis', true),
  ('00000000-0000-0000-0000-000000000002', 'financial_insights', false),
  ('00000000-0000-0000-0000-000000000002', 'financial_goals', true),
  ('00000000-0000-0000-0000-000000000002', 'monthly_budget', true),
  ('00000000-0000-0000-0000-000000000002', 'debt_simulator', true),
  ('00000000-0000-0000-0000-000000000002', 'wealth_planner', false),
  ('00000000-0000-0000-0000-000000000002', 'search_transactions', true),
  ('00000000-0000-0000-0000-000000000002', 'advanced_filters', true),
  ('00000000-0000-0000-0000-000000000002', 'duplicate_transactions', true),
  ('00000000-0000-0000-0000-000000000002', 'recurring_transactions', true),
  ('00000000-0000-0000-0000-000000000002', 'import_csv', true),
  ('00000000-0000-0000-0000-000000000002', 'import_ofx', false),
  ('00000000-0000-0000-0000-000000000002', 'auto_import', false),
  ('00000000-0000-0000-0000-000000000002', 'custom_categories', true),
  ('00000000-0000-0000-0000-000000000002', 'transaction_tags', true),
  ('00000000-0000-0000-0000-000000000002', 'transaction_notes', true),
  ('00000000-0000-0000-0000-000000000002', 'two_factor_auth', false),
  ('00000000-0000-0000-0000-000000000002', 'login_history', true),
  ('00000000-0000-0000-0000-000000000002', 'active_sessions', false);

-- Insert plan features for Premium plan (all enabled)
INSERT INTO public.plan_features (plan_id, feature_key, enabled) VALUES
  ('00000000-0000-0000-0000-000000000003', 'create_income', true),
  ('00000000-0000-0000-0000-000000000003', 'create_expense', true),
  ('00000000-0000-0000-0000-000000000003', 'edit_transactions', true),
  ('00000000-0000-0000-0000-000000000003', 'delete_transactions', true),
  ('00000000-0000-0000-0000-000000000003', 'transfer_between_accounts', true),
  ('00000000-0000-0000-0000-000000000003', 'attachments', true),
  ('00000000-0000-0000-0000-000000000003', 'create_accounts', true),
  ('00000000-0000-0000-0000-000000000003', 'unlimited_accounts', true),
  ('00000000-0000-0000-0000-000000000003', 'multi_accounts', true),
  ('00000000-0000-0000-0000-000000000003', 'basic_reports', true),
  ('00000000-0000-0000-0000-000000000003', 'advanced_reports', true),
  ('00000000-0000-0000-0000-000000000003', 'export_data', true),
  ('00000000-0000-0000-0000-000000000003', 'export_csv', true),
  ('00000000-0000-0000-0000-000000000003', 'export_excel', true),
  ('00000000-0000-0000-0000-000000000003', 'export_pdf', true),
  ('00000000-0000-0000-0000-000000000003', 'financial_charts', true),
  ('00000000-0000-0000-0000-000000000003', 'advanced_dashboard', true),
  ('00000000-0000-0000-0000-000000000003', 'category_analysis', true),
  ('00000000-0000-0000-0000-000000000003', 'monthly_analysis', true),
  ('00000000-0000-0000-0000-000000000003', 'financial_insights', true),
  ('00000000-0000-0000-0000-000000000003', 'financial_goals', true),
  ('00000000-0000-0000-0000-000000000003', 'monthly_budget', true),
  ('00000000-0000-0000-0000-000000000003', 'debt_simulator', true),
  ('00000000-0000-0000-0000-000000000003', 'wealth_planner', true),
  ('00000000-0000-0000-0000-000000000003', 'search_transactions', true),
  ('00000000-0000-0000-0000-000000000003', 'advanced_filters', true),
  ('00000000-0000-0000-0000-000000000003', 'duplicate_transactions', true),
  ('00000000-0000-0000-0000-000000000003', 'recurring_transactions', true),
  ('00000000-0000-0000-0000-000000000003', 'import_csv', true),
  ('00000000-0000-0000-0000-000000000003', 'import_ofx', true),
  ('00000000-0000-0000-0000-000000000003', 'auto_import', true),
  ('00000000-0000-0000-0000-000000000003', 'custom_categories', true),
  ('00000000-0000-0000-0000-000000000003', 'transaction_tags', true),
  ('00000000-0000-0000-0000-000000000003', 'transaction_notes', true),
  ('00000000-0000-0000-0000-000000000003', 'two_factor_auth', true),
  ('00000000-0000-0000-0000-000000000003', 'login_history', true),
  ('00000000-0000-0000-0000-000000000003', 'active_sessions', true);
