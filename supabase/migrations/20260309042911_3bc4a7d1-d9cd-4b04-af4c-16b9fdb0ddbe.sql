
-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================
-- DROP ALL EXISTING TABLES (order matters for FK)
-- ============================================
DROP TABLE IF EXISTS public.paid_invoices CASCADE;
DROP TABLE IF EXISTS public.credit_card_expenses CASCADE;
DROP TABLE IF EXISTS public.credit_cards CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.forecast CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- DROP EXISTING ENUMS (recreate cleanly)
-- ============================================
DROP TYPE IF EXISTS public.account_type CASCADE;
DROP TYPE IF EXISTS public.transaction_type CASCADE;
DROP TYPE IF EXISTS public.transaction_status CASCADE;
DROP TYPE IF EXISTS public.transaction_recurrence CASCADE;
DROP TYPE IF EXISTS public.transaction_origin CASCADE;
DROP TYPE IF EXISTS public.investment_type CASCADE;
DROP TYPE IF EXISTS public.log_action CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================
-- CREATE ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.account_type AS ENUM ('bank', 'wallet', 'credit_card');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.transaction_status AS ENUM ('paid', 'pending');
CREATE TYPE public.transaction_recurrence AS ENUM ('none', 'monthly', 'yearly');
CREATE TYPE public.transaction_origin AS ENUM ('manual', 'parcelamento', 'importacao');
CREATE TYPE public.investment_type AS ENUM ('stocks', 'crypto', 'fixed_income');
CREATE TYPE public.log_action AS ENUM (
  'login', 'logout', 'register',
  'create_transaction', 'delete_transaction', 'update_transaction',
  'create_category', 'delete_category',
  'create_account', 'delete_account',
  'create_debt', 'delete_debt',
  'create_investment', 'delete_investment',
  'admin_action'
);

-- ============================================
-- CREATE TABLES
-- ============================================

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'BRL',
  closing_day integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz NOT NULL DEFAULT now()
);

-- accounts
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type account_type NOT NULL DEFAULT 'bank',
  balance numeric NOT NULL DEFAULT 0
);

-- categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type transaction_type NOT NULL,
  color text NOT NULL DEFAULT '#6b7280'
);

-- transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  type transaction_type NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status transaction_status NOT NULL DEFAULT 'pending',
  recurrence transaction_recurrence NOT NULL DEFAULT 'none',
  installments integer,
  notes text,
  parcelamento_id uuid,
  origin transaction_origin DEFAULT 'manual',
  parcela_atual integer,
  total_parcelas integer
);

-- debts
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creditor text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  paid_installments integer NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT CURRENT_DATE
);

-- forecast
CREATE TABLE public.forecast (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  expected_income numeric NOT NULL DEFAULT 0,
  expected_expenses numeric NOT NULL DEFAULT 0,
  projected_balance numeric NOT NULL DEFAULT 0
);

-- investments
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type investment_type NOT NULL DEFAULT 'fixed_income',
  invested_amount numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0
);

-- credit_cards
CREATE TABLE public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  "limit" numeric NOT NULL DEFAULT 0,
  closing_day integer NOT NULL DEFAULT 1,
  due_day integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- credit_card_expenses
CREATE TABLE public.credit_card_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  installments integer,
  current_installment integer,
  total_installments integer,
  parent_expense_id uuid
);

-- paid_invoices
CREATE TABLE public.paid_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  month text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL
);

-- system_logs
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  action log_action NOT NULL,
  entity text,
  entity_id text,
  details text,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paid_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- PERMISSIVE RLS POLICIES
-- ============================================

-- profiles (auth.uid() = id)
CREATE POLICY "Users select own profile" ON public.profiles AS PERMISSIVE
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles AS PERMISSIVE
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin select all profiles" ON public.profiles AS PERMISSIVE
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- accounts
CREATE POLICY "Users manage own accounts" ON public.accounts AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categories
CREATE POLICY "Users manage own categories" ON public.categories AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- transactions
CREATE POLICY "Users manage own transactions" ON public.transactions AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all transactions" ON public.transactions AS PERMISSIVE
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- debts
CREATE POLICY "Users manage own debts" ON public.debts AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all debts" ON public.debts AS PERMISSIVE
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- forecast
CREATE POLICY "Users manage own forecast" ON public.forecast AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- investments
CREATE POLICY "Users manage own investments" ON public.investments AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all investments" ON public.investments AS PERMISSIVE
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- credit_cards
CREATE POLICY "Users manage own credit cards" ON public.credit_cards AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- credit_card_expenses
CREATE POLICY "Users manage own cc expenses" ON public.credit_card_expenses AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- paid_invoices
CREATE POLICY "Users manage own paid invoices" ON public.paid_invoices AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- system_logs
CREATE POLICY "Users manage own logs" ON public.system_logs AS PERMISSIVE
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin select all logs" ON public.system_logs AS PERMISSIVE
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
CREATE POLICY "Users select own role" ON public.user_roles AS PERMISSIVE
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin manage all roles" ON public.user_roles AS PERMISSIVE
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGER: auto-create profile + role on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- BACKFILL existing auth users
-- ============================================
INSERT INTO public.profiles (id, name, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'name', ''), COALESCE(u.email, '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT (user_id, role) DO NOTHING;
