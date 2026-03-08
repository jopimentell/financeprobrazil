import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog } from '@/types/finance';
import { defaultCategories, defaultAccounts, defaultTransactions, defaultDebts, defaultInvestments, defaultForecast, createDefaultCategories, createDefaultAccounts, createDefaultForecast } from '@/data/seedData';
import { useAuth } from '@/contexts/AuthContext';

interface FinanceContextType {
  // User-scoped (for regular pages)
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
  // All data (for admin)
  allTransactions: Transaction[];
  allCategories: Category[];
  allAccounts: Account[];
  allDebts: Debt[];
  allInvestments: Investment[];
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
  // Admin helpers
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
  const isAdmin = user?.role === 'admin';

  const [allTx, setAllTx] = useState<Transaction[]>(() => loadState('transactions', defaultTransactions));
  const [allCat, setAllCat] = useState<Category[]>(() => loadState('categories', defaultCategories));
  const [allAcc, setAllAcc] = useState<Account[]>(() => loadState('accounts', defaultAccounts));
  const [allDbt, setAllDbt] = useState<Debt[]>(() => loadState('debts', defaultDebts));
  const [allInv, setAllInv] = useState<Investment[]>(() => loadState('investments', defaultInvestments));
  const [allFc, setAllFc] = useState<Forecast[]>(() => loadState('forecast', defaultForecast));
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => loadState('system_logs', []));

  useEffect(() => { saveState('transactions', allTx); }, [allTx]);
  useEffect(() => { saveState('categories', allCat); }, [allCat]);
  useEffect(() => { saveState('accounts', allAcc); }, [allAcc]);
  useEffect(() => { saveState('debts', allDbt); }, [allDbt]);
  useEffect(() => { saveState('investments', allInv); }, [allInv]);
  useEffect(() => { saveState('forecast', allFc); }, [allFc]);
  useEffect(() => { saveState('system_logs', systemLogs); }, [systemLogs]);

  // Ensure new users get default data
  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    const hasCategories = allCat.some(c => c.userId === currentUserId);
    if (!hasCategories) {
      setAllCat(prev => [...prev, ...createDefaultCategories(currentUserId)]);
      setAllAcc(prev => [...prev, ...createDefaultAccounts(currentUserId)]);
      setAllFc(prev => [...prev, ...createDefaultForecast(currentUserId)]);
    }
  }, [currentUserId, isAdmin]);

  // User-scoped data (default exports for pages)
  const transactions = useMemo(() => isAdmin ? allTx : allTx.filter(t => t.userId === currentUserId), [allTx, currentUserId, isAdmin]);
  const categories = useMemo(() => isAdmin ? allCat : allCat.filter(c => c.userId === currentUserId), [allCat, currentUserId, isAdmin]);
  const accounts = useMemo(() => isAdmin ? allAcc : allAcc.filter(a => a.userId === currentUserId), [allAcc, currentUserId, isAdmin]);
  const debts = useMemo(() => isAdmin ? allDbt : allDbt.filter(d => d.userId === currentUserId), [allDbt, currentUserId, isAdmin]);
  const investments = useMemo(() => isAdmin ? allInv : allInv.filter(i => i.userId === currentUserId), [allInv, currentUserId, isAdmin]);
  const forecast = useMemo(() => isAdmin ? allFc : allFc.filter(f => f.userId === currentUserId), [allFc, currentUserId, isAdmin]);

  const addSystemLog = useCallback((log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    setSystemLogs(prev => [{ ...log, id: uid(), timestamp: new Date().toISOString() }, ...prev].slice(0, 1000));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'userId'>) => {
    setAllTx(prev => [...prev, { ...t, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_transaction', entity: 'transaction', details: t.description });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateTransaction = useCallback((t: Transaction) => {
    setAllTx(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setAllTx(prev => prev.filter(x => x.id !== id));
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'delete_transaction', entity: 'transaction', entityId: id });
  }, [currentUserId, user?.name, addSystemLog]);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'userId'>) => {
    setAllCat(prev => [...prev, { ...c, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_category', entity: 'category', details: c.name });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateCategory = useCallback((c: Category) => setAllCat(prev => prev.map(x => x.id === c.id ? c : x)), []);
  const deleteCategory = useCallback((id: string) => {
    setAllCat(prev => prev.filter(x => x.id !== id));
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'userId'>) => {
    setAllAcc(prev => [...prev, { ...a, id: uid(), userId: currentUserId }]);
  }, [currentUserId]);

  const updateAccount = useCallback((a: Account) => setAllAcc(prev => prev.map(x => x.id === a.id ? a : x)), []);
  const deleteAccount = useCallback((id: string) => setAllAcc(prev => prev.filter(x => x.id !== id)), []);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'userId'>) => {
    setAllDbt(prev => [...prev, { ...d, id: uid(), userId: currentUserId }]);
  }, [currentUserId]);

  const updateDebt = useCallback((d: Debt) => setAllDbt(prev => prev.map(x => x.id === d.id ? d : x)), []);
  const deleteDebt = useCallback((id: string) => setAllDbt(prev => prev.filter(x => x.id !== id)), []);

  const addInvestment = useCallback((i: Omit<Investment, 'id' | 'userId'>) => {
    setAllInv(prev => [...prev, { ...i, id: uid(), userId: currentUserId }]);
  }, [currentUserId]);

  const updateInvestment = useCallback((i: Investment) => setAllInv(prev => prev.map(x => x.id === i.id ? i : x)), []);
  const deleteInvestment = useCallback((id: string) => setAllInv(prev => prev.filter(x => x.id !== id)), []);

  const updateForecast = useCallback((f: Forecast[]) => setAllFc(prev => {
    const others = prev.filter(x => x.userId !== currentUserId);
    return [...others, ...f];
  }), [currentUserId]);

  const syncToSheet = useCallback(() => {
    console.log('Syncing to Google Sheets...');
    setTimeout(() => console.log('Sync complete'), 1000);
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

  const getCategoryName = useCallback((id: string) => allCat.find(c => c.id === id)?.name || 'Sem categoria', [allCat]);
  const getAccountName = useCallback((id: string) => allAcc.find(a => a.id === id)?.name || 'Sem conta', [allAcc]);
  const getCategoryColor = useCallback((id: string) => allCat.find(c => c.id === id)?.color || '#6b7280', [allCat]);

  const getUserTransactions = useCallback((userId: string) => allTx.filter(t => t.userId === userId), [allTx]);
  const getUserCategories = useCallback((userId: string) => allCat.filter(c => c.userId === userId), [allCat]);
  const getUserAccounts = useCallback((userId: string) => allAcc.filter(a => a.userId === userId), [allAcc]);
  const getUserDebts = useCallback((userId: string) => allDbt.filter(d => d.userId === userId), [allDbt]);
  const getUserInvestments = useCallback((userId: string) => allInv.filter(i => i.userId === userId), [allInv]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, debts, investments, forecast,
      allTransactions: allTx, allCategories: allCat, allAccounts: allAcc, allDebts: allDbt, allInvestments: allInv,
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
