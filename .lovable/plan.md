# Implementation Plan

Delivered in 3 sequenced phases so each can be verified before the next. No existing feature is removed.

---

## Phase A — Establishments (Merchants)

### Data model (Supabase migration)
- New table `public.merchants`: `id`, `user_id`, `name`, `icon` (nullable), `default_category_id` (nullable, FK categories), `created_at`, `updated_at`. Unique `(user_id, lower(name))`.
- Full grants + RLS (`user_id = auth.uid()`), updated_at trigger.
- `transactions` gets `merchant_id UUID NULL` (FK merchants, ON DELETE SET NULL) + index `(user_id, merchant_id)`.
- **Original description stays untouched** — `description` column is never rewritten.

### Backfill
- One-time insert: for each user, group existing transactions by `normalizeMerchant(description)`, insert distinct merchants, then update `transactions.merchant_id`.

### Types & service
- `Transaction.merchantId?: string`, new `Merchant` type.
- `financeService.ts`: CRUD for merchants + map new column.
- `FinanceContext` exposes `merchants`, `addMerchant`, `updateMerchant`, `deleteMerchant`, `assignMerchantToTransactions(ids, merchantId)`.

### UI
- New page `/estabelecimentos` (Establishments) — list, rename, merge, set default category, delete (nullifies FK, does not touch transactions).
- Transactions list shows `merchant.name` as a subtle chip under the description; description stays visible.
- `TransactionModal` gains a Merchant picker (autocomplete + create-new-inline, similar to CategoryPicker).

### Bulk actions
- Extend `BulkActionsBar` with a third popover: **Establishment** (search + create). Applies via existing `onApply({ merchantId })` path.

### Smart recognition
- After a single-transaction merchant edit, run `findSimilarByDescription(desc, allTx, { minSimilarity: 0.6, sameSign: true })` using the existing Jaccard util in `transferRules.ts` (generalized into `src/utils/similarity.ts`).
- Show a modal `SmartMerchantPromptModal`: **Update all N**, **Only this one**, **Never ask again** (persisted per-merchant in `localStorage` under `merchant.silence.<merchantId>` — non-sensitive).

---

## Phase B — Period defaults & Monthly pagination

- `Receitas.tsx` and `Despesas.tsx` already default to current month via `MonthNavigator`; verify Custom-period stub prop and keep behavior. Ensure the selected month persists across navigation (already via URL params).
- `Transactions.tsx`: introduce `MonthNavigator` at the top, filter transactions to selected month by default with a "Ver todas" escape hatch. Filters (type, category, account, search) persist across month changes via URL params. Totals/statistics cards recompute from the visible slice.

---

## Phase C — Balance Engine Audit (single source of truth)

### New module `src/utils/balanceEngine.ts`
Pure functions, no side effects, used by Dashboard, Accounts, Reports, Forecast:

```ts
signedAmount(tx)               // income:+, expense:-, transfer:0 (global) 
accountDelta(tx, accountId)    // transfer: -amount if source, +amount if dest, else 0
computeAccountBalance(account, txs)          // account.balance (opening) + Σ accountDelta
computeGlobalBalance(txs, {upTo?})           // Σ signedAmount over paid txs
computeMonthlyCarryOver(txs, year, month)    // opening = balance up to end of prev month
computePeriodTotals(txs, {from,to})          // income, expense, net, endingBalance
```

Rules enforced in the engine:
- **Transfers are neutral globally** — they never affect Dashboard/global net, never appear in income/expense KPIs or category charts.
- **Transfers move money between accounts** — reflected only in per-account balances.
- **Only `status === 'paid'` counts toward realized balances**; pending flows go into Forecast only.
- **Credit-card expenses** don't hit account balance until the invoice-payment transaction is recorded (unchanged from current logic — verified).
- **Debts** don't hit balance until the installment is booked as an expense transaction (unchanged — verified).

### Wire-up
- `Dashboard.tsx`, `Accounts.tsx`, `Reports.tsx`, `CashFlowChart.tsx`, `Forecast.tsx`, `MonthNavigator` summaries all call the engine — remove ad-hoc `.reduce` totals.
- Account list page displays `computeAccountBalance(...)` instead of the stored `balance` (opening balance shown separately as "Saldo inicial").
- Monthly view: opening balance = `computeMonthlyCarryOver(...)`; ending = opening + period net. Year rollover works because engine sums by absolute date, not per-year buckets.

### Transfer conversion bug (item 9)
Root cause to fix: `ConvertToTransferModal` currently keeps the original `type`/`amount` sign on one side while creating the paired transfer, which double-counts. Fix: after conversion, the single transaction becomes `type='transfer'` with `accountId` (source) + `transferAccountId` (dest); no second transaction is created and no income/expense row remains. Verified against `TransactionTable` rendering.

### Validation harness
- Add `src/utils/balanceEngine.test.ts` (vitest) with fixtures covering: income only, expense only, transfer neutrality, month carry-over across year boundary, mixed paid/pending, credit-card payment.
- Run `bunx vitest run` before finishing.

---

## Out of scope for this pass
- Merging duplicate merchants UI (rename covers most cases; merge can come next).
- Custom-date-range picker UI (data layer ready, UI stub only).

## Delivery order
1. Phase A migration → backfill → context/service → UI (list page, picker, bulk, smart modal).
2. Phase B pagination on Transactions.
3. Phase C engine module → rewire consumers → fix ConvertToTransfer → tests.

Each phase compiles and ships independently; nothing existing is removed.
