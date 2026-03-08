import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog, CreditCard, CreditCardExpense, PaidInvoice } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';
import * as financeService from '@/services/financeService';
import { supabase } from '@/integrations/supabase/client';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
  creditCards: CreditCard[];
  creditCardExpenses: CreditCardExpense[];
  paidInvoices: PaidInvoice[];
  allTransactions: Transaction[];
  allCategories: Category[];
  allAccounts: Account[];
  allDebts: Debt[];
  allInvestments: Investment[];
  addTransaction: (t: Omit<Transaction, 'id' | 'userId'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id' | 'userId'>) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addAccount: (a: Omit<Account, 'id' | 'userId'>) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
  addDebt: (d: Omit<Debt, 'id' | 'userId'>) => void;
  updateDebt: (d: Debt) => void;
  deleteDebt: (id: string) => void;
  addInvestment: (i: Omit<Investment, 'id' | 'userId'>) => void;
  updateInvestment: (i: Investment) => void;
  deleteInvestment: (id: string) => void;
  updateForecast: (f: Forecast[]) => void;
  addCreditCard: (c: Omit<CreditCard, 'id' | 'userId' | 'createdAt'>) => void;
  updateCreditCard: (c: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
  addCreditCardExpense: (e: Omit<CreditCardExpense, 'id' | 'userId'>) => void;
  updateCreditCardExpense: (id: string, updates: Partial<CreditCardExpense>) => void;
  deleteCreditCardExpense: (id: string) => void;
  payInvoice: (cardId: string, month: string, amount: number) => void;
  syncToSheet: () => void;
  getMonthTransactions: (year: number, month: number) => Transaction[];
  getYearTransactions: (year: number) => Transaction[];
  getCategoryName: (id: string) => string;
  getAccountName: (id: string) => string;
  getCategoryColor: (id: string) => string;
  getUserTransactions: (userId: string) => Transaction[];
  getUserCategories: (userId: string) => Category[];
  getUserAccounts: (userId: string) => Account[];
  getUserDebts: (userId: string) => Debt[];
  getUserInvestments: (userId: string) => Investment[];
  systemLogs: SystemLog[];
  addSystemLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, users: allUsers } = useAuth();
  const currentUserId = user?.id || '';
  const isAdmin = user?.role === 'admin';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditCardExpenses, setCreditCardExpenses] = useState<CreditCardExpense[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<PaidInvoice[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const loadedUserRef = useRef<string>('');

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!currentUserId || currentUserId === loadedUserRef.current) return;
    loadedUserRef.current = currentUserId;

    if (isAdmin) {
      setTransactions([]); setCategories([]); setAccounts([]);
      setDebts([]); setInvestments([]); setForecast([]);
      setCreditCards([]); setCreditCardExpenses([]); setPaidInvoices([]);
      // Load system logs for admin
      financeService.getSystemLogs().then(logs => setSystemLogs(logs));
      return;
    }

    (async () => {
      // Seed defaults if new user
      await financeService.seedDefaultData(currentUserId);
      const data = await financeService.fetchAllUserData(currentUserId);
      setTransactions(data.transactions);
      setCategories(data.categories);
      setAccounts(data.accounts);
      setDebts(data.debts);
      setInvestments(data.investments);
      setForecast(data.forecast);
      setCreditCards(data.creditCards);
      setCreditCardExpenses(data.creditCardExpenses);
      setPaidInvoices(data.paidInvoices);
    })();
  }, [currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId) loadedUserRef.current = '';
  }, [currentUserId]);

  // Admin aggregated data
  const [adminData, setAdminData] = useState<{
    allTx: Transaction[]; allCat: Category[]; allAcc: Account[];
    allDbt: Debt[]; allInv: Investment[];
  } | null>(null);

  useEffect(() => {
    if (!isAdmin) { setAdminData(null); return; }
    (async () => {
      const [txRes, catRes, accRes, debtRes, invRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('debts').select('*'),
        supabase.from('investments').select('*'),
      ]);
      setAdminData({
        allTx: (txRes.data || []).map((r: any) => ({ id: r.id, userId: r.user_id, description: r.description, amount: Number(r.amount), type: r.type, categoryId: r.category_id || '', accountId: r.account_id || '', date: r.date, status: r.status, recurrence: r.recurrence, installments: r.installments, notes: r.notes, parcelamentoId: r.parcelamento_id, origin: r.origin, parcelaAtual: r.parcela_atual, totalParcelas: r.total_parcelas })),
        allCat: (catRes.data || []).map((r: any) => ({ id: r.id, userId: r.user_id, name: r.name, type: r.type, color: r.color })),
        allAcc: (accRes.data || []).map((r: any) => ({ id: r.id, userId: r.user_id, name: r.name, type: r.type, balance: Number(r.balance) })),
        allDbt: (debtRes.data || []).map((r: any) => ({ id: r.id, userId: r.user_id, creditor: r.creditor, totalAmount: Number(r.total_amount), remainingAmount: Number(r.remaining_amount), installments: r.installments, paidInstallments: r.paid_installments, interestRate: Number(r.interest_rate), dueDate: r.due_date })),
        allInv: (invRes.data || []).map((r: any) => ({ id: r.id, userId: r.user_id, name: r.name, type: r.type, investedAmount: Number(r.invested_amount), currentValue: Number(r.current_value), profit: Number(r.profit) })),
      });
    })();
  }, [isAdmin, user?.id]);

  const allTransactions = isAdmin ? (adminData?.allTx || []) : transactions;
  const allCategories = isAdmin ? (adminData?.allCat || []) : categories;
  const allAccounts = isAdmin ? (adminData?.allAcc || []) : accounts;
  const allDebts = isAdmin ? (adminData?.allDbt || []) : debts;
  const allInvestments = isAdmin ? (adminData?.allInv || []) : investments;

  const addSystemLogFn = useCallback((log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newLog = { ...log, id, timestamp };
    setSystemLogs(prev => [newLog, ...prev].slice(0, 1000));
    financeService.createSystemLog(log); // fire-and-forget
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'userId'>) => {
    const id = crypto.randomUUID();
    const newTx: Transaction = { ...t, id, userId: currentUserId };
    setTransactions(prev => [...prev, newTx]);
    financeService.addTransaction(currentUserId, t).then(result => {
      // Update with server-assigned id if different
      if (result.id !== id) {
        setTransactions(prev => prev.map(x => x.id === id ? result : x));
      }
    });
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'create_transaction', entity: 'transaction', details: t.description });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const updateTransaction = useCallback((t: Transaction) => {
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
    financeService.updateTransaction(currentUserId, t);
  }, [currentUserId]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
    financeService.deleteTransaction(currentUserId, id);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'delete_transaction', entity: 'transaction', entityId: id });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'userId'>) => {
    const id = crypto.randomUUID();
    const newCat: Category = { ...c, id, userId: currentUserId };
    setCategories(prev => [...prev, newCat]);
    financeService.addCategory(currentUserId, c);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'create_category', entity: 'category', details: c.name });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const updateCategory = useCallback((c: Category) => {
    setCategories(prev => prev.map(x => x.id === c.id ? c : x));
    financeService.updateCategory(currentUserId, c);
  }, [currentUserId]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
    financeService.deleteCategory(currentUserId, id);
  }, [currentUserId]);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'userId'>) => {
    const id = crypto.randomUUID();
    const newAcc: Account = { ...a, id, userId: currentUserId };
    setAccounts(prev => [...prev, newAcc]);
    financeService.addAccount(currentUserId, a);
  }, [currentUserId]);

  const updateAccount = useCallback((a: Account) => {
    setAccounts(prev => prev.map(x => x.id === a.id ? a : x));
    financeService.updateAccount(currentUserId, a);
  }, [currentUserId]);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(x => x.id !== id));
    financeService.deleteAccount(currentUserId, id);
  }, [currentUserId]);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'userId'> & { categoryId?: string; accountId?: string }) => {
    const categoryId = d.categoryId || categories.find(c => c.type === 'expense')?.id || '';
    const accountId = d.accountId || accounts[0]?.id || '';

    // Optimistic: add debt immediately
    const tempDebtId = crypto.randomUUID();
    const tempDebt: Debt = { ...d, id: tempDebtId, userId: currentUserId };
    setDebts(prev => [...prev, tempDebt]);

    financeService.addDebtWithInstallments(currentUserId, d, categoryId, accountId).then(({ debt, installments }) => {
      setDebts(prev => prev.map(x => x.id === tempDebtId ? debt : x));
      setTransactions(prev => [...prev, ...installments]);
    });

    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'create_debt', entity: 'debt', details: `${d.creditor} - ${d.installments} parcelas` });
  }, [currentUserId, categories, accounts, user?.name, addSystemLogFn]);

  const updateDebt = useCallback((d: Debt) => {
    setDebts(prev => prev.map(x => x.id === d.id ? d : x));
    financeService.updateDebt(currentUserId, d);
  }, [currentUserId]);

  const deleteDebt = useCallback((id: string) => {
    setDebts(prev => prev.filter(x => x.id !== id));
    setTransactions(prev => prev.filter(tx => tx.parcelamentoId !== id));
    financeService.deleteDebt(currentUserId, id);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'delete_debt', entity: 'debt', entityId: id });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const addInvestment = useCallback((i: Omit<Investment, 'id' | 'userId'>) => {
    const id = crypto.randomUUID();
    const newInv: Investment = { ...i, id, userId: currentUserId };
    setInvestments(prev => [...prev, newInv]);
    financeService.addInvestment(currentUserId, i);
  }, [currentUserId]);

  const updateInvestment = useCallback((i: Investment) => {
    setInvestments(prev => prev.map(x => x.id === i.id ? i : x));
    financeService.updateInvestment(currentUserId, i);
  }, [currentUserId]);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(x => x.id !== id));
    financeService.deleteInvestment(currentUserId, id);
  }, [currentUserId]);

  const updateForecastFn = useCallback((f: Forecast[]) => {
    setForecast(f);
    financeService.updateForecast(currentUserId, f);
  }, [currentUserId]);

  const syncToSheet = useCallback(() => {
    console.log('Syncing to Google Sheets...');
  }, []);

  const getMonthTransactions = useCallback((year: number, month: number) => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [transactions]);

  const getYearTransactions = useCallback((year: number) => {
    return transactions.filter(t => new Date(t.date).getFullYear() === year);
  }, [transactions]);

  const getCategoryName = useCallback((id: string) => {
    const all = isAdmin ? allCategories : categories;
    return all.find(c => c.id === id)?.name || 'Sem categoria';
  }, [categories, allCategories, isAdmin]);

  const getAccountName = useCallback((id: string) => {
    const all = isAdmin ? allAccounts : accounts;
    return all.find(a => a.id === id)?.name || 'Sem conta';
  }, [accounts, allAccounts, isAdmin]);

  const getCategoryColor = useCallback((id: string) => {
    const all = isAdmin ? allCategories : categories;
    return all.find(c => c.id === id)?.color || '#6b7280';
  }, [categories, allCategories, isAdmin]);

  // These return from local state for the admin view
  const getUserTransactions = useCallback((userId: string) => allTransactions.filter(t => t.userId === userId), [allTransactions]);
  const getUserCategories = useCallback((userId: string) => allCategories.filter(c => c.userId === userId), [allCategories]);
  const getUserAccounts = useCallback((userId: string) => allAccounts.filter(a => a.userId === userId), [allAccounts]);
  const getUserDebts = useCallback((userId: string) => allDebts.filter(d => d.userId === userId), [allDebts]);
  const getUserInvestments = useCallback((userId: string) => allInvestments.filter(i => i.userId === userId), [allInvestments]);

  // Credit card operations
  const addCreditCardFn = useCallback((c: Omit<CreditCard, 'id' | 'userId' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const newCard: CreditCard = { ...c, id, userId: currentUserId, createdAt: new Date().toISOString().split('T')[0] };
    setCreditCards(prev => [...prev, newCard]);
    financeService.addCreditCard(currentUserId, c);
  }, [currentUserId]);

  const updateCreditCardFn = useCallback((c: CreditCard) => {
    setCreditCards(prev => prev.map(x => x.id === c.id ? c : x));
    financeService.updateCreditCard(currentUserId, c);
  }, [currentUserId]);

  const deleteCreditCardFn = useCallback((id: string) => {
    setCreditCards(prev => prev.filter(x => x.id !== id));
    setCreditCardExpenses(prev => prev.filter(x => x.cardId !== id));
    financeService.deleteCreditCard(currentUserId, id);
  }, [currentUserId]);

  const addCreditCardExpenseFn = useCallback((e: Omit<CreditCardExpense, 'id' | 'userId'>) => {
    financeService.addCreditCardExpense(currentUserId, e).then(generated => {
      setCreditCardExpenses(prev => [...prev, ...generated]);
    });
  }, [currentUserId]);

  const updateCreditCardExpenseFn = useCallback((id: string, updates: Partial<CreditCardExpense>) => {
    setCreditCardExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    financeService.updateCreditCardExpense(currentUserId, id, updates);
  }, [currentUserId]);

  const deleteCreditCardExpenseFn = useCallback((id: string) => {
    const expense = creditCardExpenses.find(e => e.id === id);
    if (expense) {
      const parentId = expense.parentExpenseId || expense.id;
      setCreditCardExpenses(prev => prev.filter(e => e.id !== parentId && e.parentExpenseId !== parentId));
    }
    financeService.deleteCreditCardExpense(currentUserId, id);
  }, [currentUserId, creditCardExpenses]);

  const payInvoiceFn = useCallback((cardId: string, month: string, amount: number) => {
    const categoryId = categories.find(c => c.type === 'expense')?.id || '';
    const accountId = accounts[0]?.id || '';
    financeService.markInvoicePaid(currentUserId, cardId, month, amount, categoryId, accountId).then(({ paidInvoice, transaction }) => {
      setPaidInvoices(prev => [...prev, paidInvoice]);
      setTransactions(prev => [...prev, transaction]);
    });
  }, [currentUserId, categories, accounts]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, debts, investments, forecast,
      creditCards, creditCardExpenses, paidInvoices,
      allTransactions, allCategories, allAccounts, allDebts, allInvestments,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addAccount, updateAccount, deleteAccount,
      addDebt, updateDebt, deleteDebt,
      addInvestment, updateInvestment, deleteInvestment,
      updateForecast: updateForecastFn,
      addCreditCard: addCreditCardFn, updateCreditCard: updateCreditCardFn,
      deleteCreditCard: deleteCreditCardFn,
      addCreditCardExpense: addCreditCardExpenseFn,
      updateCreditCardExpense: updateCreditCardExpenseFn,
      deleteCreditCardExpense: deleteCreditCardExpenseFn,
      payInvoice: payInvoiceFn,
      syncToSheet,
      getMonthTransactions, getYearTransactions,
      getCategoryName, getAccountName, getCategoryColor,
      getUserTransactions, getUserCategories, getUserAccounts, getUserDebts, getUserInvestments,
      systemLogs, addSystemLog: addSystemLogFn,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
