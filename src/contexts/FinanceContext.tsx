import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, Category, Account, Debt, Investment, Forecast, FinanceState } from '@/types/finance';
import { defaultCategories, defaultAccounts, defaultTransactions, defaultDebts, defaultInvestments, defaultForecast } from '@/data/seedData';

interface FinanceContextType extends FinanceState {
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
  addDebt: (d: Omit<Debt, 'id'>) => void;
  updateDebt: (d: Debt) => void;
  deleteDebt: (id: string) => void;
  addInvestment: (i: Omit<Investment, 'id'>) => void;
  updateInvestment: (i: Investment) => void;
  deleteInvestment: (id: string) => void;
  updateForecast: (f: Forecast[]) => void;
  syncToSheet: () => void;
  getMonthTransactions: (year: number, month: number) => Transaction[];
  getYearTransactions: (year: number) => Transaction[];
  getCategoryName: (id: string) => string;
  getAccountName: (id: string) => string;
  getCategoryColor: (id: string) => string;
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
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('transactions', defaultTransactions));
  const [categories, setCategories] = useState<Category[]>(() => loadState('categories', defaultCategories));
  const [accounts, setAccounts] = useState<Account[]>(() => loadState('accounts', defaultAccounts));
  const [debts, setDebts] = useState<Debt[]>(() => loadState('debts', defaultDebts));
  const [investments, setInvestments] = useState<Investment[]>(() => loadState('investments', defaultInvestments));
  const [forecast, setForecast] = useState<Forecast[]>(() => loadState('forecast', defaultForecast));

  useEffect(() => { saveState('transactions', transactions); }, [transactions]);
  useEffect(() => { saveState('categories', categories); }, [categories]);
  useEffect(() => { saveState('accounts', accounts); }, [accounts]);
  useEffect(() => { saveState('debts', debts); }, [debts]);
  useEffect(() => { saveState('investments', investments); }, [investments]);
  useEffect(() => { saveState('forecast', forecast); }, [forecast]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => setTransactions(prev => [...prev, { ...t, id: uid() }]), []);
  const updateTransaction = useCallback((t: Transaction) => setTransactions(prev => prev.map(x => x.id === t.id ? t : x)), []);
  const deleteTransaction = useCallback((id: string) => setTransactions(prev => prev.filter(x => x.id !== id)), []);

  const addCategory = useCallback((c: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...c, id: uid() }]), []);
  const updateCategory = useCallback((c: Category) => setCategories(prev => prev.map(x => x.id === c.id ? c : x)), []);
  const deleteCategory = useCallback((id: string) => setCategories(prev => prev.filter(x => x.id !== id)), []);

  const addAccount = useCallback((a: Omit<Account, 'id'>) => setAccounts(prev => [...prev, { ...a, id: uid() }]), []);
  const updateAccount = useCallback((a: Account) => setAccounts(prev => prev.map(x => x.id === a.id ? a : x)), []);
  const deleteAccount = useCallback((id: string) => setAccounts(prev => prev.filter(x => x.id !== id)), []);

  const addDebt = useCallback((d: Omit<Debt, 'id'>) => setDebts(prev => [...prev, { ...d, id: uid() }]), []);
  const updateDebt = useCallback((d: Debt) => setDebts(prev => prev.map(x => x.id === d.id ? d : x)), []);
  const deleteDebt = useCallback((id: string) => setDebts(prev => prev.filter(x => x.id !== id)), []);

  const addInvestment = useCallback((i: Omit<Investment, 'id'>) => setInvestments(prev => [...prev, { ...i, id: uid() }]), []);
  const updateInvestment = useCallback((i: Investment) => setInvestments(prev => prev.map(x => x.id === i.id ? i : x)), []);
  const deleteInvestment = useCallback((id: string) => setInvestments(prev => prev.filter(x => x.id !== id)), []);

  const updateForecast = useCallback((f: Forecast[]) => setForecast(f), []);

  const syncToSheet = useCallback(() => {
    // Mock sync - in real app would POST to Google Sheets API
    console.log('Syncing to Google Sheets...');
    setTimeout(() => {
      console.log('Sync complete');
    }, 1000);
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

  const getCategoryName = useCallback((id: string) => categories.find(c => c.id === id)?.name || 'Sem categoria', [categories]);
  const getAccountName = useCallback((id: string) => accounts.find(a => a.id === id)?.name || 'Sem conta', [accounts]);
  const getCategoryColor = useCallback((id: string) => categories.find(c => c.id === id)?.color || '#6b7280', [categories]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, debts, investments, forecast,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addAccount, updateAccount, deleteAccount,
      addDebt, updateDebt, deleteDebt,
      addInvestment, updateInvestment, deleteInvestment,
      updateForecast, syncToSheet,
      getMonthTransactions, getYearTransactions,
      getCategoryName, getAccountName, getCategoryColor,
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
