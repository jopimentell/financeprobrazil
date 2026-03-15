
-- ============================================================
-- FIX: Convert ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "Users select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin select all profiles" ON public.profiles;

CREATE POLICY "Users select own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin select all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update all profiles" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Users select own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin manage all roles" ON public.user_roles;

CREATE POLICY "Users select own role" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- transactions
DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin select all transactions" ON public.transactions;

CREATE POLICY "Users manage own transactions" ON public.transactions AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all transactions" ON public.transactions AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- categories
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;

CREATE POLICY "Users manage own categories" ON public.categories AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounts
DROP POLICY IF EXISTS "Users manage own accounts" ON public.accounts;

CREATE POLICY "Users manage own accounts" ON public.accounts AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- debts
DROP POLICY IF EXISTS "Users manage own debts" ON public.debts;
DROP POLICY IF EXISTS "Admin select all debts" ON public.debts;

CREATE POLICY "Users manage own debts" ON public.debts AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all debts" ON public.debts AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- investments
DROP POLICY IF EXISTS "Users manage own investments" ON public.investments;
DROP POLICY IF EXISTS "Admin select all investments" ON public.investments;

CREATE POLICY "Users manage own investments" ON public.investments AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all investments" ON public.investments AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- credit_cards
DROP POLICY IF EXISTS "Users manage own credit cards" ON public.credit_cards;

CREATE POLICY "Users manage own credit cards" ON public.credit_cards AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- credit_card_expenses
DROP POLICY IF EXISTS "Users manage own cc expenses" ON public.credit_card_expenses;

CREATE POLICY "Users manage own cc expenses" ON public.credit_card_expenses AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- paid_invoices
DROP POLICY IF EXISTS "Users manage own paid invoices" ON public.paid_invoices;

CREATE POLICY "Users manage own paid invoices" ON public.paid_invoices AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- forecast
DROP POLICY IF EXISTS "Users manage own forecast" ON public.forecast;

CREATE POLICY "Users manage own forecast" ON public.forecast AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- system_logs
DROP POLICY IF EXISTS "Users manage own logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin select all logs" ON public.system_logs;

CREATE POLICY "Users manage own logs" ON public.system_logs AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all logs" ON public.system_logs AS PERMISSIVE FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- plans (read for all authenticated, manage for admins)
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
DROP POLICY IF EXISTS "Admins manage plans" ON public.plans;

CREATE POLICY "Anyone can read active plans" ON public.plans AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plans" ON public.plans AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plan_features
DROP POLICY IF EXISTS "Anyone can read plan features" ON public.plan_features;
DROP POLICY IF EXISTS "Admins manage plan features" ON public.plan_features;

CREATE POLICY "Anyone can read plan features" ON public.plan_features AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan features" ON public.plan_features AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plan_limits
DROP POLICY IF EXISTS "Anyone can read plan limits" ON public.plan_limits;
DROP POLICY IF EXISTS "Admins manage plan limits" ON public.plan_limits;

CREATE POLICY "Anyone can read plan limits" ON public.plan_limits AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan limits" ON public.plan_limits AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- plan_settings
DROP POLICY IF EXISTS "Anyone can read plan settings" ON public.plan_settings;
DROP POLICY IF EXISTS "Admins manage plan settings" ON public.plan_settings;

CREATE POLICY "Anyone can read plan settings" ON public.plan_settings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan settings" ON public.plan_settings AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subscriptions
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;

CREATE POLICY "Users read own subscriptions" ON public.subscriptions AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscriptions" ON public.subscriptions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions AS PERMISSIVE FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add unique constraint on forecast for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'forecast_user_id_month_key'
  ) THEN
    ALTER TABLE public.forecast ADD CONSTRAINT forecast_user_id_month_key UNIQUE (user_id, month);
  END IF;
END $$;
