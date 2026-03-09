
-- Fix ALL RLS policies: RESTRICTIVE → PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Admin select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Admin select all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users select own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_roles
DROP POLICY IF EXISTS "Admin manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users select own role" ON public.user_roles;
CREATE POLICY "Admin manage all roles" ON public.user_roles AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users select own role" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- transactions
DROP POLICY IF EXISTS "Admin select all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
CREATE POLICY "Admin select all transactions" ON public.transactions AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users manage own transactions" ON public.transactions AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categories
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
CREATE POLICY "Users manage own categories" ON public.categories AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounts
DROP POLICY IF EXISTS "Users manage own accounts" ON public.accounts;
CREATE POLICY "Users manage own accounts" ON public.accounts AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- debts
DROP POLICY IF EXISTS "Admin select all debts" ON public.debts;
DROP POLICY IF EXISTS "Users manage own debts" ON public.debts;
CREATE POLICY "Admin select all debts" ON public.debts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users manage own debts" ON public.debts AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- investments
DROP POLICY IF EXISTS "Admin select all investments" ON public.investments;
DROP POLICY IF EXISTS "Users manage own investments" ON public.investments;
CREATE POLICY "Admin select all investments" ON public.investments AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users manage own investments" ON public.investments AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Admin select all logs" ON public.system_logs;
DROP POLICY IF EXISTS "Users manage own logs" ON public.system_logs;
CREATE POLICY "Admin select all logs" ON public.system_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users manage own logs" ON public.system_logs AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
