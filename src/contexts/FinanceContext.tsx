import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Category, Account, Debt, Investment, Forecast, FinanceState, SystemLog } from '@/types/finance';
import { defaultCategories, defaultAccounts, defaultTransactions, defaultDebts, defaultInvestments, defaultForecast, createDefaultCategories, createDefaultAccounts, createDefaultForecast } from '@/data/seedData';
import { useAuth } from '@/contexts/AuthContext';

interface FinanceContextType extends FinanceState {
  // Current user's filtered data
  myTransactions: Transaction[];
  myCategories: Category[];
  myAccounts: Account[];
  myDebts: Debt[];
  myInvestments: Investment[];
  myForecast: Forecast[];
  // CRUD (auto-injects userId)
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
  syncToSheet: () => void;
  getMonthTransactions: (year: number, month: number) => Transaction[];
  getYearTransactions: (year: number) => Transaction[];
  getCategoryName: (id: string) => string;
  getAccountName: (id: string) => string;
  getCategoryColor: (id: string) => string;
  // Admin: get data for specific user
  getUserTransactions: (userId: string) => Transaction[];
  getUserCategories: (userId: string) => Category[];
  getUserAccounts: (userId: string) => Account[];
  getUserDebts: (userId: string) => Debt[];
  getUserInvestments: (userId: string) => Investment[];
  // System logs
  systemLogs: SystemLog[];
  addSystemLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

function loadState<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`finance_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

function saveState(key: string, value: unknown) {
  localStorage.setItem(`finance_${key}`, JSON.stringify(value));
}

const uid = () => crypto.randomUUID();

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('transactions', defaultTransactions));
  const [categories, setCategories] = useState<Category[]>(() => loadState('categories', defaultCategories));
  const [accounts, setAccounts] = useState<Account[]>(() => loadState('accounts', defaultAccounts));
  const [debts, setDebts] = useState<Debt[]>(() => loadState('debts', defaultDebts));
  const [investments, setInvestments] = useState<Investment[]>(() => loadState('investments', defaultInvestments));
  const [forecast, setForecast] = useState<Forecast[]>(() => loadState('forecast', defaultForecast));
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => loadState('system_logs', []));

  useEffect(() => { saveState('transactions', transactions); }, [transactions]);
  useEffect(() => { saveState('categories', categories); }, [categories]);
  useEffect(() => { saveState('accounts', accounts); }, [accounts]);
  useEffect(() => { saveState('debts', debts); }, [debts]);
  useEffect(() => { saveState('investments', investments); }, [investments]);
  useEffect(() => { saveState('forecast', forecast); }, [forecast]);
  useEffect(() => { saveState('system_logs', systemLogs); }, [systemLogs]);

  // Ensure new users get default data
  useEffect(() => {
    if (!currentUserId || user?.role === 'admin') return;
    const hasCategories = categories.some(c => c.userId === currentUserId);
    if (!hasCategories) {
      setCategories(prev => [...prev, ...createDefaultCategories(currentUserId)]);
      setAccounts(prev => [...prev, ...createDefaultAccounts(currentUserId)]);
      setForecast(prev => [...prev, ...createDefaultForecast(currentUserId)]);
    }
  }, [currentUserId, user?.role]);

  // Filtered data for current user
  const myTransactions = transactions.filter(t => t.userId === currentUserId);
  const myCategories = categories.filter(c => c.userId === currentUserId);
  const myAccounts = accounts.filter(a => a.userId === currentUserId);
  const myDebts = debts.filter(d => d.userId === currentUserId);
  const myInvestments = investments.filter(i => i.userId === currentUserId);
  const myForecast = forecast.filter(f => f.userId === currentUserId);

  const addSystemLog = useCallback((log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    setSystemLogs(prev => [{ ...log, id: uid(), timestamp: new Date().toISOString() }, ...prev].slice(0, 1000));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'userId'>) => {
    const newTx = { ...t, id: uid(), userId: currentUserId };
    setTransactions(prev => [...prev, newTx]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_transaction', entity: 'transaction', details: t.description });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateTransaction = useCallback((t: Transaction) => {
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'update_transaction', entity: 'transaction', entityId: t.id });
  }, [currentUserId, user?.name, addSystemLog]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'delete_transaction', entity: 'transaction', entityId: id });
  }, [currentUserId, user?.name, addSystemLog]);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'userId'>) => {
    setCategories(prev => [...prev, { ...c, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_category', entity: 'category', details: c.name });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateCategory = useCallback((c: Category) => setCategories(prev => prev.map(x => x.id === c.id ? c : x)), []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(x => x.id !== id));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'delete_category', entity: 'category', entityId: id });
  }, [currentUserId, user?.name, addSystemLog]);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'userId'>) => {
    setAccounts(prev => [...prev, { ...a, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_account', entity: 'account', details: a.name });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateAccount = useCallback((a: Account) => setAccounts(prev => prev.map(x => x.id === a.id ? a : x)), []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts(prev => prev.filter(x => x.id !== id));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'delete_account', entity: 'account', entityId: id });
  }, [currentUserId, user?.name, addSystemLog]);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'userId'>) => {
    setDebts(prev => [...prev, { ...d, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_debt', entity: 'debt', details: d.creditor });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateDebt = useCallback((d: Debt) => setDebts(prev => prev.map(x => x.id === d.id ? d : x)), []);

  const deleteDebt = useCallback((id: string) => {
    setDebts(prev => prev.filter(x => x.id !== id));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'delete_debt', entity: 'debt', entityId: id });
  }, [currentUserId, user?.name, addSystemLog]);

  const addInvestment = useCallback((i: Omit<Investment, 'id' | 'userId'>) => {
    setInvestments(prev => [...prev, { ...i, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_investment', entity: 'investment', details: i.name });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateInvestment = useCallback((i: Investment) => setInvestments(prev => prev.map(x => x.id === i.id ? i : x)), []);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(x => x.id !== id));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'delete_investment', entity: 'investment', entityId: id });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateForecast = useCallback((f: Forecast[]) => setForecast(prev => {
    const others = prev.filter(x => x.userId !== currentUserId);
    return [...others, ...f];
  }), [currentUserId]);

  const syncToSheet = useCallback(() => {
    console.log('Syncing to Google Sheets...');
    setTimeout(() => console.log('Sync complete'), 1000);
  }, []);

  const getMonthTransactions = useCallback((year: number, month: number) => {
    return myTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [myTransactions]);

  const getYearTransactions = useCallback((year: number) => {
    return myTransactions.filter(t => new Date(t.date).getFullYear() === year);
  }, [myTransactions]);

  // Use all categories (for lookups across users in admin)
  const getCategoryName = useCallback((id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria', [categories]);
  const getAccountName = useCallback((id: string) => accounts.find(a => a.id === id)?.name || 'Sem conta', [accounts]);
  const getCategoryColor = useCallback((id: string) => categories.find(c => c.id === id)?.color || '#6b7280', [categories]);

  // Admin helpers
  const getUserTransactions = useCallback((userId: string) => transactions.filter(t => t.userId === userId), [transactions]);
  const getUserCategories = useCallback((userId: string) => categories.filter(c => c.userId === userId), [categories]);
  const getUserAccounts = useCallback((userId: string) => accounts.filter(a => a.userId === userId), [accounts]);
  const getUserDebts = useCallback((userId: string) => debts.filter(d => d.userId === userId), [debts]);
  const getUserInvestments = useCallback((userId: string) => investments.filter(i => i.userId === userId), [investments]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, debts, investments, forecast,
      myTransactions, myCategories, myAccounts, myDebts, myInvestments, myForecast,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addAccount, updateAccount, deleteAccount,
      addDebt, updateDebt, deleteDebt,
      addInvestment, updateInvestment, deleteInvestment,
      updateForecast, syncToSheet,
      getMonthTransactions, getYearTransactions,
      getCategoryName, getAccountName, getCategoryColor,
      getUserTransactions, getUserCategories, getUserAccounts, getUserDebts, getUserInvestments,
      systemLogs, addSystemLog,
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
