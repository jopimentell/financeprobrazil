/**
 * Single source of truth for financial calculations.
 * Every screen (Dashboard, Accounts, Reports, Forecast) MUST use these
 * helpers so balances always agree across the app.
 *
 * Rules:
 *  - `income` adds money globally, credits `accountId`.
 *  - `expense` removes money globally, debits `accountId`.
 *  - `transfer` is neutral globally — it only moves money between two accounts
 *    (`accountId` = source, `transferAccountId` = destination). It never appears
 *    in income/expense KPIs, category charts, or the global "money I own" total.
 *  - Only `status === 'paid'` counts toward realized balances. Pending is forecast.
 */

import { Account, Transaction } from '@/types/finance';

/** Signed contribution to the *global* balance (transfers are neutral). */
export function signedAmount(tx: Transaction): number {
  if (tx.type === 'income') return tx.amount;
  if (tx.type === 'expense') return -tx.amount;
  return 0; // transfer
}

/** Signed contribution of `tx` to `accountId`'s balance. */
export function accountDelta(tx: Transaction, accountId: string): number {
  if (tx.type === 'transfer') {
    if (tx.accountId === accountId) return -tx.amount;
    if (tx.transferAccountId === accountId) return tx.amount;
    return 0;
  }
  if (tx.accountId !== accountId) return 0;
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

export interface BalanceOptions {
  /** Include only transactions with `date <= upTo` (inclusive, YYYY-MM-DD). */
  upTo?: string;
  /** Include pending transactions in the sum (default: only 'paid'). */
  includePending?: boolean;
}

function passesFilter(tx: Transaction, opts?: BalanceOptions) {
  if (!opts?.includePending && tx.status !== 'paid') return false;
  if (opts?.upTo && tx.date > opts.upTo) return false;
  return true;
}

/** Current computed balance for an account = opening balance + Σ deltas. */
export function computeAccountBalance(
  account: Account,
  transactions: Transaction[],
  opts?: BalanceOptions,
): number {
  let bal = Number(account.balance || 0);
  for (const tx of transactions) {
    if (!passesFilter(tx, opts)) continue;
    bal += accountDelta(tx, account.id);
  }
  return bal;
}

/** Global net = opening total across accounts + Σ signed amounts. */
export function computeGlobalBalance(
  accounts: Account[],
  transactions: Transaction[],
  opts?: BalanceOptions,
): number {
  const opening = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const flow = transactions.reduce((s, tx) => (passesFilter(tx, opts) ? s + signedAmount(tx) : s), 0);
  return opening + flow;
}

/** Sum patrimony across accounts using dynamic balances. */
export function computeTotalPatrimony(
  accounts: Account[],
  transactions: Transaction[],
  opts?: BalanceOptions,
): number {
  return accounts.reduce((s, a) => s + computeAccountBalance(a, transactions, opts), 0);
}

export interface PeriodTotals {
  income: number;
  expense: number;
  net: number;
  openingBalance: number;
  endingBalance: number;
}

/** Totals for a period (inclusive). Transfers excluded from income/expense. */
export function computePeriodTotals(
  accounts: Account[],
  transactions: Transaction[],
  from: string,
  to: string,
): PeriodTotals {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.status !== 'paid') continue;
    if (tx.date < from || tx.date > to) continue;
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') expense += tx.amount;
  }
  // Opening = global balance up to the day before `from`.
  const prevDay = new Date(from);
  prevDay.setDate(prevDay.getDate() - 1);
  const upTo = prevDay.toISOString().split('T')[0];
  const openingBalance = computeGlobalBalance(accounts, transactions, { upTo });
  const net = income - expense;
  return { income, expense, net, openingBalance, endingBalance: openingBalance + net };
}

/** Opening balance of a given month = closing balance of previous month. */
export function computeMonthlyCarryOver(
  accounts: Account[],
  transactions: Transaction[],
  year: number,
  month: number, // 0-11
): number {
  const first = new Date(year, month, 1);
  const prev = new Date(first);
  prev.setDate(prev.getDate() - 1);
  const upTo = prev.toISOString().split('T')[0];
  return computeGlobalBalance(accounts, transactions, { upTo });
}

/** Convenience: month bounds as YYYY-MM-DD strings. */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  const from = new Date(year, month, 1).toISOString().split('T')[0];
  const to = new Date(year, month + 1, 0).toISOString().split('T')[0];
  return { from, to };
}
