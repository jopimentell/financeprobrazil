
-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.transaction_status AS ENUM ('paid', 'pending');
CREATE TYPE public.transaction_recurrence AS ENUM ('none', 'monthly', 'yearly');
CREATE TYPE public.transaction_origin AS ENUM ('manual', 'parcelamento', 'importacao');
CREATE TYPE public.account_type AS ENUM ('bank', 'wallet', 'credit_card');
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

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'BRL',
  closing_day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. USER ROLES
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280'
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. ACCOUNTS
-- ============================================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type public.account_type NOT NULL DEFAULT 'bank',
  balance NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. TRANSACTIONS
-- ============================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type public.transaction_type NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  recurrence public.transaction_recurrence NOT NULL DEFAULT 'none',
  installments INTEGER,
  notes TEXT,
  parcelamento_id UUID,
  origin public.transaction_origin DEFAULT 'manual',
  parcela_atual INTEGER,
  total_parcelas INTEGER
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. DEBTS
-- ============================================================
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  creditor TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  installments INTEGER NOT NULL DEFAULT 1,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. INVESTMENTS
-- ============================================================
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type public.investment_type NOT NULL DEFAULT 'fixed_income',
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. FORECAST
-- ============================================================
CREATE TABLE public.forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  expected_income NUMERIC NOT NULL DEFAULT 0,
  expected_expenses NUMERIC NOT NULL DEFAULT 0,
  projected_balance NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (user_id, month)
);
ALTER TABLE public.forecast ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. CREDIT CARDS
-- ============================================================
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  "limit" NUMERIC NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 1,
  due_day INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. CREDIT CARD EXPENSES
-- ============================================================
CREATE TABLE public.credit_card_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  installments INTEGER,
  current_installment INTEGER,
  total_installments INTEGER,
  parent_expense_id UUID
);
ALTER TABLE public.credit_card_expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. PAID INVOICES
-- ============================================================
CREATE TABLE public.paid_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.credit_cards(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  amount NUMERIC NOT NULL DEFAULT 0,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL
);
ALTER TABLE public.paid_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. SYSTEM LOGS
-- ============================================================
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action public.log_action NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 15. RLS POLICIES
-- ============================================================

-- Profiles: users see own, admins see all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles: only admins manage
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Financial tables: users own data only
CREATE POLICY "Own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own debts" ON public.debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own investments" ON public.investments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own forecast" ON public.forecast FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own credit cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own credit card expenses" ON public.credit_card_expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own paid invoices" ON public.paid_invoices FOR ALL USING (auth.uid() = user_id);

-- Admin policies for financial tables
CREATE POLICY "Admin view all categories" ON public.categories FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin view all accounts" ON public.accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin view all debts" ON public.debts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin view all investments" ON public.investments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System logs: own + admin
CREATE POLICY "Own logs" ON public.system_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin view all logs" ON public.system_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 16. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
