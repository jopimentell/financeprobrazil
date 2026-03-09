

## Diagnosis

After thorough analysis of the codebase, database schema, and RLS policies, the root cause is clear:

**All RLS policies across every table are RESTRICTIVE (`Permissive: No`) instead of PERMISSIVE.** In PostgreSQL RLS:
- PERMISSIVE policies are OR'd together (at least one must pass to grant access)
- RESTRICTIVE policies are AND'd together, but they can only *narrow* access granted by permissive policies
- **If there are ONLY restrictive policies and NO permissive policies, no rows are ever returned**

This means:
1. `fetchProfile()` never returns profile data → `.single()` returns error → profile is null
2. `fetchIsAdmin()` never returns role data → always returns false
3. All finance data queries (transactions, categories, accounts, etc.) return empty arrays
4. The fallback user mechanism should work for login, but the `onAuthStateChange` listener and `login()` function both race to resolve these broken queries, and the combination with `FinanceContext` trying to seed data (which also fails due to RLS) causes the app to get stuck

**Why the button stays "Entrando..."**: After login succeeds (200), the `onAuthStateChange` callback fires and attempts `fetchProfile` + `fetchIsAdmin`. Meanwhile `login()` also does the same. The user gets set via fallback, but navigation to `/dashboard` triggers `AppLayout` → `FinanceContext` which calls `seedDefaultData()` and `fetchAllUserData()` — all silently failing. The cascading broken queries create timing issues and potentially unresolved promises.

**Why direct URLs show white screen**: `AppLayout` checks `loading` from `useAuth()`. If the auth initialization queries hang or the component tree crashes from downstream context errors, nothing renders.

## Plan

### Step 1: Fix all RLS policies — change from RESTRICTIVE to PERMISSIVE

Create a single migration that drops all existing RESTRICTIVE policies and recreates them as PERMISSIVE (the PostgreSQL default). This affects all 10 tables:

- `profiles` (4 policies)
- `user_roles` (2 policies)
- `transactions` (2 policies)
- `categories` (1 policy)
- `accounts` (1 policy)
- `debts` (2 policies)
- `investments` (2 policies)
- `credit_cards` (1 policy)
- `credit_card_expenses` (1 policy)
- `paid_invoices` (1 policy)
- `forecast` (1 policy)
- `system_logs` (2 policies)

Each policy will be dropped and recreated with the same logic but as PERMISSIVE.

### Step 2: Add missing INSERT policy on `profiles`

Currently profiles has no INSERT policy, which means the `handle_new_user` trigger (SECURITY DEFINER) can insert, but if any client-side code tries to insert, it fails. This is actually correct for security — profile creation should only happen via the trigger. No change needed.

### Step 3: Add error handling to `handleLogin` in Login.tsx

Wrap the `await login()` call in try/catch to ensure `setSubmitting(false)` always runs, even if an unexpected error occurs.

### Technical Details

The migration SQL will follow this pattern for each policy:
```sql
DROP POLICY IF EXISTS "Policy Name" ON public.table_name;
CREATE POLICY "Policy Name" ON public.table_name
  AS PERMISSIVE
  FOR command
  TO authenticated
  USING (expression)
  WITH CHECK (expression);
```

The Login.tsx change adds a try/catch:
```typescript
try {
  const success = await login(email, password);
  if (success) { toast.success(...); }
  else { toast.error(...); }
} catch (err) {
  toast.error('Erro inesperado ao fazer login');
} finally {
  setSubmitting(false);
}
```

