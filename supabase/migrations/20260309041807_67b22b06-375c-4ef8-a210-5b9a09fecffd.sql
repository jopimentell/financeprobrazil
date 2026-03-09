-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Users manage own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Own credit card expenses" ON public.credit_card_expenses;
DROP POLICY IF EXISTS "Own credit cards" ON public.credit_cards;
DROP POLICY IF EXISTS "Own debts" ON public.debts;
DROP POLICY IF EXISTS "Admin view all debts" ON public.debts;
DROP POLICY IF EXISTS "Own forecast" ON public.forecast;
DROP POLICY IF EXISTS "Own investments" ON public.investments;
DROP POLICY IF EXISTS "Admin view all investments" ON public.investments;
DROP POLICY IF EXISTS "Own paid invoices" ON public.paid_invoices;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Own logs" ON public.system_logs;
DROP POLICY IF EXISTS "Admin view all logs" ON public.system_logs;
DROP POLICY IF EXISTS "Own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create PERMISSIVE policies for accounts
CREATE POLICY "Users manage own accounts" 
ON public.accounts AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE policies for categories
CREATE POLICY "Users manage own categories" 
ON public.categories AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE policies for credit_card_expenses
CREATE POLICY "Users manage own credit card expenses" 
ON public.credit_card_expenses AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE policies for credit_cards
CREATE POLICY "Users manage own credit cards" 
ON public.credit_cards AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE policies for debts
CREATE POLICY "Users manage own debts" 
ON public.debts AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all debts" 
ON public.debts AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE policies for forecast
CREATE POLICY "Users manage own forecast" 
ON public.forecast AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE policies for investments
CREATE POLICY "Users manage own investments" 
ON public.investments AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all investments" 
ON public.investments AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE policies for paid_invoices
CREATE POLICY "Users manage own paid invoices" 
ON public.paid_invoices AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create PERMISSIVE policies for profiles (auth.uid() = id pattern)
CREATE POLICY "Users can view own profile" 
ON public.profiles AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles AS PERMISSIVE 
FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE policies for system_logs
CREATE POLICY "Users manage own logs" 
ON public.system_logs AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all logs" 
ON public.system_logs AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE policies for transactions
CREATE POLICY "Users manage own transactions" 
ON public.transactions AS PERMISSIVE 
FOR ALL TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all transactions" 
ON public.transactions AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create PERMISSIVE policies for user_roles
CREATE POLICY "Users can read own role" 
ON public.user_roles AS PERMISSIVE 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" 
ON public.user_roles AS PERMISSIVE 
FOR ALL TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));