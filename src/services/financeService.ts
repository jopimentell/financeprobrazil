/**
 * Finance service layer.
 * Wraps database calls with business logic.
 * When migrating to a real backend, replace these with API calls.
 */

import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog } from '@/types/finance';
import * as db from '@/database/localDatabase';

const uid = () => crypto.randomUUID();

// ── Transactions ───────────────────────────────────────

export function getTransactions(userId: string): Transaction[] {
  return db.getUserData(userId).transactions;
}

export function getTransactionsByMonth(userId: string, year: number, month: number): Transaction[] {
  return getTransactions(userId).filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getTransactionsByYear(userId: string, year: number): Transaction[] {
  return getTransactions(userId).filter(t => new Date(t.date).getFullYear() === year);
}

export function addTransaction(userId: string, t: Omit<Transaction, 'id' | 'userId'>): Transaction {
  const newTx: Transaction = { ...t, id: uid(), userId };
  db.updateUserEntity(userId, 'transactions', prev => [...prev, newTx]);
  return newTx;
}

export function updateTransaction(userId: string, t: Transaction): void {
  db.updateUserEntity(userId, 'transactions', prev => prev.map(x => x.id === t.id ? t : x));
}

export function deleteTransaction(userId: string, id: string): void {
  db.updateUserEntity(userId, 'transactions', prev => prev.filter(x => x.id !== id));
}

// ── Categories ─────────────────────────────────────────

export function getCategories(userId: string): Category[] {
  return db.getUserData(userId).categories;
}

export function addCategory(userId: string, c: Omit<Category, 'id' | 'userId'>): Category {
  const newCat: Category = { ...c, id: uid(), userId };
  db.updateUserEntity(userId, 'categories', prev => [...prev, newCat]);
  return newCat;
}

export function updateCategory(userId: string, c: Category): void {
  db.updateUserEntity(userId, 'categories', prev => prev.map(x => x.id === c.id ? c : x));
}

export function deleteCategory(userId: string, id: string): void {
  db.updateUserEntity(userId, 'categories', prev => prev.filter(x => x.id !== id));
}

// ── Accounts ───────────────────────────────────────────

export function getAccounts(userId: string): Account[] {
  return db.getUserData(userId).accounts;
}

export function addAccount(userId: string, a: Omit<Account, 'id' | 'userId'>): Account {
  const newAcc: Account = { ...a, id: uid(), userId };
  db.updateUserEntity(userId, 'accounts', prev => [...prev, newAcc]);
  return newAcc;
}

export function updateAccount(userId: string, a: Account): void {
  db.updateUserEntity(userId, 'accounts', prev => prev.map(x => x.id === a.id ? a : x));
}

export function deleteAccount(userId: string, id: string): void {
  db.updateUserEntity(userId, 'accounts', prev => prev.filter(x => x.id !== id));
}

// ── Debts ──────────────────────────────────────────────

export function getDebts(userId: string): Debt[] {
  return db.getUserData(userId).debts;
}

/**
 * Creates a debt and auto-generates installment expense transactions.
 * Each installment is linked via `parcelamentoId` = debt.id.
 * Returns the debt and the generated transactions.
 */
export function addDebtWithInstallments(
  userId: string,
  d: Omit<Debt, 'id' | 'userId'>,
  categoryId: string,
  accountId: string,
): { debt: Debt; installments: Transaction[] } {
  const debtId = uid();
  const newDebt: Debt = { ...d, id: debtId, userId };
  db.updateUserEntity(userId, 'debts', prev => [...prev, newDebt]);

  const numInstallments = d.installments || 1;
  const installmentAmount = Math.round((d.totalAmount / numInstallments) * 100) / 100;
  const startDate = new Date(d.dueDate);
  const now = new Date();
  const generatedTxs: Transaction[] = [];

  for (let i = 0; i < numInstallments; i++) {
    const txDate = new Date(startDate);
    txDate.setMonth(txDate.getMonth() + i);
    const isPastOrCurrent = txDate <= now || (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth());

    const tx: Transaction = {
      id: uid(),
      userId,
      description: `${d.creditor} (${i + 1}/${numInstallments})`,
      amount: installmentAmount,
      type: 'expense',
      categoryId,
      accountId,
      date: txDate.toISOString().split('T')[0],
      status: isPastOrCurrent ? 'pending' : 'pending',
      recurrence: 'none',
      parcelamentoId: debtId,
      origin: 'parcelamento',
      parcelaAtual: i + 1,
      totalParcelas: numInstallments,
    };
    generatedTxs.push(tx);
  }

  db.updateUserEntity(userId, 'transactions', prev => [...prev, ...generatedTxs]);
  return { debt: newDebt, installments: generatedTxs };
}

/** Legacy addDebt without installment generation */
export function addDebt(userId: string, d: Omit<Debt, 'id' | 'userId'>): Debt {
  const newDebt: Debt = { ...d, id: uid(), userId };
  db.updateUserEntity(userId, 'debts', prev => [...prev, newDebt]);
  return newDebt;
}

export function updateDebt(userId: string, d: Debt): void {
  db.updateUserEntity(userId, 'debts', prev => prev.map(x => x.id === d.id ? d : x));
}

/**
 * Deletes a debt and removes all future installment transactions.
 * Past/current month installments are kept.
 */
export function deleteDebt(userId: string, id: string): void {
  db.updateUserEntity(userId, 'debts', prev => prev.filter(x => x.id !== id));
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  db.updateUserEntity(userId, 'transactions', prev =>
    prev.filter(tx => {
      if (tx.parcelamentoId !== id) return true;
      const txDate = new Date(tx.date);
      const txMonth = txDate.getFullYear() * 12 + txDate.getMonth();
      return txMonth <= currentMonth; // keep past/current, remove future
    })
  );
}

// ── Investments ────────────────────────────────────────

export function getInvestments(userId: string): Investment[] {
  return db.getUserData(userId).investments;
}

export function addInvestment(userId: string, i: Omit<Investment, 'id' | 'userId'>): Investment {
  const newInv: Investment = { ...i, id: uid(), userId };
  db.updateUserEntity(userId, 'investments', prev => [...prev, newInv]);
  return newInv;
}

export function updateInvestment(userId: string, i: Investment): void {
  db.updateUserEntity(userId, 'investments', prev => prev.map(x => x.id === i.id ? i : x));
}

export function deleteInvestment(userId: string, id: string): void {
  db.updateUserEntity(userId, 'investments', prev => prev.filter(x => x.id !== id));
}

// ── Forecast ───────────────────────────────────────────

export function getForecast(userId: string): Forecast[] {
  return db.getUserData(userId).forecast;
}

export function updateForecast(userId: string, f: Forecast[]): void {
  db.updateUserEntity(userId, 'forecast', () => f);
}

// ── System Logs ────────────────────────────────────────

export function getSystemLogs(): SystemLog[] {
  return db.getSystemLogs();
}

export function createSystemLog(log: Omit<SystemLog, 'id' | 'timestamp'>): SystemLog {
  const newLog: SystemLog = { ...log, id: uid(), timestamp: new Date().toISOString() };
  db.addSystemLog(newLog);
  return newLog;
}

// ── Financial Summary ──────────────────────────────────

export function getResumoFinanceiro(userId: string, year: number, month: number) {
  const txs = getTransactionsByMonth(userId, year, month);
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses, transactions: txs };
}

// ── Export / Import ────────────────────────────────────

export { exportDatabase, importDatabase } from '@/database/localDatabase';
