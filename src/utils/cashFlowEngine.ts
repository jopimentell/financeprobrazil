/**
 * Cash Flow engine — chronological ledger with running balance.
 * Business rules:
 *  - Only `income` and `expense` participate. `transfer` is ALWAYS ignored.
 *  - Running balance is computed strictly in chronological order.
 *  - Opening balance comes from the global balance engine (accounts + prior flow).
 */

import { Account, Transaction } from '@/types/finance';
import { computeGlobalBalance } from '@/utils/balanceEngine';
import { parseLocalDate, previousDayISO, toISODate } from '@/utils/periodUtils';

export interface CashFlowFilters {
  from: string; // YYYY-MM-DD inclusive
  to: string;   // YYYY-MM-DD inclusive
  accountId?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  includePending?: boolean;
}

export interface LedgerRow {
  tx: Transaction;
  amountIn: number;
  amountOut: number;
  runningBalance: number;
}

export interface LedgerDay {
  date: string;
  rows: LedgerRow[];
  income: number;
  expense: number;
  net: number;
  endingBalance: number;
}

export interface CashFlowTotals {
  income: number;
  expense: number;
  profit: number;
  openingBalance: number;
  finalBalance: number;
}

/** Only cash-flow relevant transactions (never transfers). */
export function isCashFlowTx(tx: Transaction): boolean {
  return tx.type === 'income' || tx.type === 'expense';
}

function matchesFilters(tx: Transaction, f: CashFlowFilters): boolean {
  if (!isCashFlowTx(tx)) return false;
  if (!f.includePending && tx.status !== 'paid') return false;
  if (tx.date < f.from || tx.date > f.to) return false;
  if (f.accountId && tx.accountId !== f.accountId) return false;
  if (f.categoryId && tx.categoryId !== f.categoryId) return false;
  if (f.type && tx.type !== f.type) return false;
  return true;
}

export function filterCashFlow(transactions: Transaction[], f: CashFlowFilters): Transaction[] {
  return transactions.filter((t) => matchesFilters(t, f));
}

const previousDay = previousDayISO;

/**
 * Opening balance for the period. When an account filter is active the opening
 * balance is scoped to that account (its own prior movement), otherwise it is
 * the global cash position. Transfers never move the global figure.
 */
export function computeOpeningBalance(
  accounts: Account[],
  transactions: Transaction[],
  f: CashFlowFilters,
): number {
  const upTo = previousDay(f.from);
  const opts = { upTo, includePending: f.includePending };
  if (f.accountId) {
    const acc = accounts.find((a) => a.id === f.accountId);
    if (!acc) return 0;
    // Account-scoped opening: transfers do affect the individual account.
    let bal = Number(acc.balance || 0);
    for (const tx of transactions) {
      if (!opts.includePending && tx.status !== 'paid') continue;
      if (tx.date > upTo) continue;
      if (tx.type === 'transfer') {
        if (tx.accountId === acc.id) bal -= tx.amount;
        else if (tx.transferAccountId === acc.id) bal += tx.amount;
        continue;
      }
      if (tx.accountId !== acc.id) continue;
      bal += tx.type === 'income' ? tx.amount : -tx.amount;
    }
    return bal;
  }
  return computeGlobalBalance(accounts, transactions, opts);
}

/** Build the chronological ledger grouped by day. */
export function buildLedger(
  accounts: Account[],
  transactions: Transaction[],
  f: CashFlowFilters,
): { days: LedgerDay[]; totals: CashFlowTotals } {
  const rows = filterCashFlow(transactions, f).slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  const openingBalance = computeOpeningBalance(accounts, transactions, f);
  let running = openingBalance;
  let income = 0;
  let expense = 0;

  const byDay = new Map<string, LedgerDay>();
  for (const tx of rows) {
    const amountIn = tx.type === 'income' ? tx.amount : 0;
    const amountOut = tx.type === 'expense' ? tx.amount : 0;
    running += amountIn - amountOut;
    income += amountIn;
    expense += amountOut;

    let day = byDay.get(tx.date);
    if (!day) {
      day = { date: tx.date, rows: [], income: 0, expense: 0, net: 0, endingBalance: running };
      byDay.set(tx.date, day);
    }
    day.rows.push({ tx, amountIn, amountOut, runningBalance: running });
    day.income += amountIn;
    day.expense += amountOut;
    day.net = day.income - day.expense;
    day.endingBalance = running;
  }

  return {
    days: Array.from(byDay.values()),
    totals: {
      income,
      expense,
      profit: income - expense,
      openingBalance,
      finalBalance: running,
    },
  };
}

export interface MonthlyPoint {
  month: number;
  name: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Monthly grouped series for a given year, honouring the non-date filters. */
export function computeMonthlySeries(
  transactions: Transaction[],
  year: number,
  f: Omit<CashFlowFilters, 'from' | 'to'>,
): MonthlyPoint[] {
  const base: CashFlowFilters = { ...f, from: `${year}-01-01`, to: `${year}-12-31` };
  const points: MonthlyPoint[] = MONTH_SHORT.map((name, month) => ({
    name, month, receitas: 0, despesas: 0, lucro: 0,
  }));
  for (const tx of filterCashFlow(transactions, base)) {
    const m = Number(tx.date.slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    if (tx.type === 'income') points[m].receitas += tx.amount;
    else points[m].despesas += tx.amount;
  }
  points.forEach((p) => { p.lucro = p.receitas - p.despesas; });
  return points;
}

export interface DailyPoint {
  date: string;
  label: string;
  receitas: number;
  despesas: number;
}

/** Daily revenue series across an arbitrary range (dense, includes empty days). */
export function computeDailySeries(
  transactions: Transaction[],
  f: CashFlowFilters,
): DailyPoint[] {
  const map = new Map<string, DailyPoint>();
  const cursor = parseLocalDate(f.from);
  const end = parseLocalDate(f.to);
  let guard = 0;
  while (cursor <= end && guard < 400) {
    const key = toISODate(cursor);
    map.set(key, { date: key, label: key.slice(8, 10) + '/' + key.slice(5, 7), receitas: 0, despesas: 0 });
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  for (const tx of filterCashFlow(transactions, f)) {
    const p = map.get(tx.date);
    if (!p) continue;
    if (tx.type === 'income') p.receitas += tx.amount;
    else p.despesas += tx.amount;
  }
  return Array.from(map.values());
}

/** Revenue booked on a single day (used by the "Daily Revenue" KPI). */
export function computeDayRevenue(
  transactions: Transaction[],
  date: string,
  f: Omit<CashFlowFilters, 'from' | 'to'>,
): number {
  return filterCashFlow(transactions, { ...f, from: date, to: date })
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
}
