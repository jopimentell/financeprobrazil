import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog } from '@/types/finance';
import { createDefaultCategories, createDefaultAccounts, createDefaultForecast } from '@/data/seedData';
import { useAuth } from '@/contexts/AuthContext';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
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

// Per-user storage helpers
function userKey(userId: string, entity: string) {
  return `finance_user_${userId}_${entity}`;
}

function loadUserData<T>(userId: string, entity: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(userKey(userId, entity));
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

function saveUserData(userId: string, entity: string, value: unknown) {
  localStorage.setItem(userKey(userId, entity), JSON.stringify(value));
}

// Shared storage for system-wide data (logs)
function loadShared<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`finance_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}
function saveShared(key: string, value: unknown) {
  localStorage.setItem(`finance_${key}`, JSON.stringify(value));
}

const uid = () => crypto.randomUUID();

// Initialize a user's data if they have none yet
function ensureUserData(userId: string): {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
} {
  const hasData = localStorage.getItem(userKey(userId, 'initialized'));

  if (hasData) {
    return {
      transactions: loadUserData(userId, 'transactions', []),
      categories: loadUserData(userId, 'categories', []),
      accounts: loadUserData(userId, 'accounts', []),
      debts: loadUserData(userId, 'debts', []),
      investments: loadUserData(userId, 'investments', []),
      forecast: loadUserData(userId, 'forecast', []),
    };
  }

  // New user — create default categories, accounts, forecast; everything else empty
  const categories = createDefaultCategories(userId);
  const accounts = createDefaultAccounts(userId);
  const forecast = createDefaultForecast(userId);
  const transactions: Transaction[] = [];
  const debts: Debt[] = [];
  const investments: Investment[] = [];

  saveUserData(userId, 'transactions', transactions);
  saveUserData(userId, 'categories', categories);
  saveUserData(userId, 'accounts', accounts);
  saveUserData(userId, 'debts', debts);
  saveUserData(userId, 'investments', investments);
  saveUserData(userId, 'forecast', forecast);
  localStorage.setItem(userKey(userId, 'initialized'), 'true');

  return { transactions, categories, accounts, debts, investments, forecast };
}

// For admin: load all users' data by iterating known user IDs
function loadAllUsersData(users: { id: string; role: string }[]) {
  const allTx: Transaction[] = [];
  const allCat: Category[] = [];
  const allAcc: Account[] = [];
  const allDbt: Debt[] = [];
  const allInv: Investment[] = [];

  for (const u of users) {
    if (u.role === 'admin') continue; // admins don't have finance data
    allTx.push(...loadUserData(u.id, 'transactions', []));
    allCat.push(...loadUserData(u.id, 'categories', []));
    allAcc.push(...loadUserData(u.id, 'accounts', []));
    allDbt.push(...loadUserData(u.id, 'debts', []));
    allInv.push(...loadUserData(u.id, 'investments', []));
  }

  return { allTx, allCat, allAcc, allDbt, allInv };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, users: allUsers } = useAuth();
  const currentUserId = user?.id || '';
  const isAdmin = user?.role === 'admin';

  // Per-user state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => loadShared('system_logs', []));

  // Track which user's data is loaded
  const loadedUserRef = useRef<string>('');

  // Load user data when currentUserId changes
  useEffect(() => {
    if (!currentUserId || currentUserId === loadedUserRef.current) return;
    loadedUserRef.current = currentUserId;

    if (isAdmin) {
      // Admin doesn't have own finance data — we'll compute aggregates in useMemo
      setTransactions([]);
      setCategories([]);
      setAccounts([]);
      setDebts([]);
      setInvestments([]);
      setForecast([]);
      return;
    }

    const data = ensureUserData(currentUserId);
    setTransactions(data.transactions);
    setCategories(data.categories);
    setAccounts(data.accounts);
    setDebts(data.debts);
    setInvestments(data.investments);
    setForecast(data.forecast);
  }, [currentUserId, isAdmin]);

  // Reset loaded ref on logout
  useEffect(() => {
    if (!currentUserId) loadedUserRef.current = '';
  }, [currentUserId]);

  // Persist per-user data on changes
  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    saveUserData(currentUserId, 'transactions', transactions);
  }, [transactions, currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    saveUserData(currentUserId, 'categories', categories);
  }, [categories, currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    saveUserData(currentUserId, 'accounts', accounts);
  }, [accounts, currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    saveUserData(currentUserId, 'debts', debts);
  }, [debts, currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    saveUserData(currentUserId, 'investments', investments);
  }, [investments, currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    saveUserData(currentUserId, 'forecast', forecast);
  }, [forecast, currentUserId, isAdmin]);

  useEffect(() => { saveShared('system_logs', systemLogs); }, [systemLogs]);

  // Admin aggregated data — computed from all users
  const adminData = useMemo(() => {
    if (!isAdmin) return null;
    return loadAllUsersData(allUsers);
  }, [isAdmin, allUsers, /* refresh when any user CRUD happens */ transactions]);

  const allTransactions = isAdmin ? (adminData?.allTx || []) : transactions;
  const allCategories = isAdmin ? (adminData?.allCat || []) : categories;
  const allAccounts = isAdmin ? (adminData?.allAcc || []) : accounts;
  const allDebts = isAdmin ? (adminData?.allDbt || []) : debts;
  const allInvestments = isAdmin ? (adminData?.allInv || []) : investments;

  const addSystemLog = useCallback((log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    setSystemLogs(prev => [{ ...log, id: uid(), timestamp: new Date().toISOString() }, ...prev].slice(0, 1000));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'userId'>) => {
    setTransactions(prev => [...prev, { ...t, id: uid(), userId: currentUserId }]);
    addSystemLog({ userId: currentUserId, userName: user?.name || '', action: 'create_transaction', entity: 'transaction', details: t.description });
  }, [currentUserId, user?.name, addSystemLog]);

  const updateTransaction = useCallback((t: Transaction) => {
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  }, []);

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
  }, []);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'userId'>) => {
    setAccounts(prev => [...prev, { ...a, id: uid(), userId: currentUserId }]);
  }, [currentUserId]);

  const updateAccount = useCallback((a: Account) => setAccounts(prev => prev.map(x => x.id === a.id ? a : x)), []);
  const deleteAccount = useCallback((id: string) => setAccounts(prev => prev.filter(x => x.id !== id)), []);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'userId'>) => {
    setDebts(prev => [...prev, { ...d, id: uid(), userId: currentUserId }]);
  }, [currentUserId]);

  const updateDebt = useCallback((d: Debt) => setDebts(prev => prev.map(x => x.id === d.id ? d : x)), []);
  const deleteDebt = useCallback((id: string) => setDebts(prev => prev.filter(x => x.id !== id)), []);

  const addInvestment = useCallback((i: Omit<Investment, 'id' | 'userId'>) => {
    setInvestments(prev => [...prev, { ...i, id: uid(), userId: currentUserId }]);
  }, [currentUserId]);

  const updateInvestment = useCallback((i: Investment) => setInvestments(prev => prev.map(x => x.id === i.id ? i : x)), []);
  const deleteInvestment = useCallback((id: string) => setInvestments(prev => prev.filter(x => x.id !== id)), []);

  const updateForecast = useCallback((f: Forecast[]) => setForecast(f), []);

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

  // Admin helpers — load specific user data from their isolated storage
  const getUserTransactions = useCallback((userId: string) => loadUserData<Transaction[]>(userId, 'transactions', []), []);
  const getUserCategories = useCallback((userId: string) => loadUserData<Category[]>(userId, 'categories', []), []);
  const getUserAccounts = useCallback((userId: string) => loadUserData<Account[]>(userId, 'accounts', []), []);
  const getUserDebts = useCallback((userId: string) => loadUserData<Debt[]>(userId, 'debts', []), []);
  const getUserInvestments = useCallback((userId: string) => loadUserData<Investment[]>(userId, 'investments', []), []);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, debts, investments, forecast,
      allTransactions, allCategories, allAccounts, allDebts, allInvestments,
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
