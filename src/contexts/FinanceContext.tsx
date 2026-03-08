import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog, CreditCard, CreditCardExpense } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';
import * as db from '@/database/localDatabase';
import * as financeService from '@/services/financeService';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
  creditCards: CreditCard[];
  creditCardExpenses: CreditCardExpense[];
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
  deleteCreditCard: (id: string) => void;
  addCreditCardExpense: (e: Omit<CreditCardExpense, 'id' | 'userId'>) => void;
  deleteCreditCardExpense: (e: Omit<CreditCardExpense, 'id' | 'userId'>) => void;
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

  // Per-user state (loaded from centralized database)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditCardExpenses, setCreditCardExpenses] = useState<CreditCardExpense[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(() => financeService.getSystemLogs());

  const loadedUserRef = useRef<string>('');

  // Load user data from centralized database when user changes
  useEffect(() => {
    if (!currentUserId || currentUserId === loadedUserRef.current) return;
    loadedUserRef.current = currentUserId;

    if (isAdmin) {
      setTransactions([]); setCategories([]); setAccounts([]);
      setDebts([]); setInvestments([]); setForecast([]);
      setCreditCards([]); setCreditCardExpenses([]);
      return;
    }

    const data = db.ensureUserData(currentUserId);
    setTransactions(data.transactions);
    setCategories(data.categories);
    setAccounts(data.accounts);
    setDebts(data.debts);
    setInvestments(data.investments);
    setForecast(data.forecast);
    setCreditCards(data.creditCards || []);
    setCreditCardExpenses(data.creditCardExpenses || []);
  }, [currentUserId, isAdmin]);

  // Reset loaded ref on logout
  useEffect(() => {
    if (!currentUserId) loadedUserRef.current = '';
  }, [currentUserId]);

  // Persist helper — writes current entity to centralized DB
  const persist = useCallback((entity: keyof db.UserFinanceData, value: unknown) => {
    if (!currentUserId || isAdmin) return;
    const dbInstance = db.loadDatabase();
    if (!dbInstance.userData[currentUserId]) db.ensureUserData(currentUserId);
    (dbInstance.userData[currentUserId] as any)[entity] = value;
    db.saveDatabase(dbInstance);
  }, [currentUserId, isAdmin]);

  // Persist per-user data on changes
  useEffect(() => { persist('transactions', transactions); }, [transactions, persist]);
  useEffect(() => { persist('categories', categories); }, [categories, persist]);
  useEffect(() => { persist('accounts', accounts); }, [accounts, persist]);
  useEffect(() => { persist('debts', debts); }, [debts, persist]);
  useEffect(() => { persist('investments', investments); }, [investments, persist]);
  useEffect(() => { persist('forecast', forecast); }, [forecast, persist]);
  useEffect(() => { persist('creditCards', creditCards); }, [creditCards, persist]);
  useEffect(() => { persist('creditCardExpenses', creditCardExpenses); }, [creditCardExpenses, persist]);

  useEffect(() => {
    // System logs are saved through the service layer
  }, [systemLogs]);

  // Admin aggregated data
  const adminData = useMemo(() => {
    if (!isAdmin) return null;
    const nonAdminIds = allUsers.filter(u => u.role !== 'admin').map(u => u.id);
    return db.getAllUsersData(nonAdminIds);
  }, [isAdmin, allUsers, transactions]);

  const allTransactions = isAdmin ? (adminData?.allTx || []) : transactions;
  const allCategories = isAdmin ? (adminData?.allCat || []) : categories;
  const allAccounts = isAdmin ? (adminData?.allAcc || []) : accounts;
  const allDebts = isAdmin ? (adminData?.allDbt || []) : debts;
  const allInvestments = isAdmin ? (adminData?.allInv || []) : investments;

  const addSystemLogFn = useCallback((log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const newLog = financeService.createSystemLog(log);
    setSystemLogs(prev => [newLog, ...prev].slice(0, 1000));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'userId'>) => {
    const newTx = financeService.addTransaction(currentUserId, t);
    setTransactions(prev => [...prev, newTx]);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'create_transaction', entity: 'transaction', details: t.description });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const updateTransaction = useCallback((t: Transaction) => {
    financeService.updateTransaction(currentUserId, t);
    setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  }, [currentUserId]);

  const deleteTransaction = useCallback((id: string) => {
    financeService.deleteTransaction(currentUserId, id);
    setTransactions(prev => prev.filter(x => x.id !== id));
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'delete_transaction', entity: 'transaction', entityId: id });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const addCategory = useCallback((c: Omit<Category, 'id' | 'userId'>) => {
    const newCat = financeService.addCategory(currentUserId, c);
    setCategories(prev => [...prev, newCat]);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'create_category', entity: 'category', details: c.name });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const updateCategory = useCallback((c: Category) => {
    financeService.updateCategory(currentUserId, c);
    setCategories(prev => prev.map(x => x.id === c.id ? c : x));
  }, [currentUserId]);

  const deleteCategory = useCallback((id: string) => {
    financeService.deleteCategory(currentUserId, id);
    setCategories(prev => prev.filter(x => x.id !== id));
  }, [currentUserId]);

  const addAccount = useCallback((a: Omit<Account, 'id' | 'userId'>) => {
    const newAcc = financeService.addAccount(currentUserId, a);
    setAccounts(prev => [...prev, newAcc]);
  }, [currentUserId]);

  const updateAccount = useCallback((a: Account) => {
    financeService.updateAccount(currentUserId, a);
    setAccounts(prev => prev.map(x => x.id === a.id ? a : x));
  }, [currentUserId]);

  const deleteAccount = useCallback((id: string) => {
    financeService.deleteAccount(currentUserId, id);
    setAccounts(prev => prev.filter(x => x.id !== id));
  }, [currentUserId]);

  const addDebt = useCallback((d: Omit<Debt, 'id' | 'userId'> & { categoryId?: string; accountId?: string }) => {
    const categoryId = d.categoryId || categories.find(c => c.type === 'expense')?.id || '';
    const accountId = d.accountId || accounts[0]?.id || '';
    const { debt: newDebt, installments } = financeService.addDebtWithInstallments(
      currentUserId, d, categoryId, accountId
    );
    setDebts(prev => [...prev, newDebt]);
    setTransactions(prev => [...prev, ...installments]);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'create_debt', entity: 'debt', details: `${d.creditor} - ${d.installments} parcelas` });
  }, [currentUserId, categories, accounts, user?.name, addSystemLogFn]);

  const updateDebt = useCallback((d: Debt) => {
    financeService.updateDebt(currentUserId, d);
    setDebts(prev => prev.map(x => x.id === d.id ? d : x));
  }, [currentUserId]);

  const deleteDebt = useCallback((id: string) => {
    financeService.deleteDebt(currentUserId, id);
    setDebts(prev => prev.filter(x => x.id !== id));
    // Reload transactions to reflect removed future installments
    const data = db.getUserData(currentUserId);
    setTransactions(data.transactions);
    addSystemLogFn({ userId: currentUserId, userName: user?.name || '', action: 'delete_debt', entity: 'debt', entityId: id });
  }, [currentUserId, user?.name, addSystemLogFn]);

  const addInvestment = useCallback((i: Omit<Investment, 'id' | 'userId'>) => {
    const newInv = financeService.addInvestment(currentUserId, i);
    setInvestments(prev => [...prev, newInv]);
  }, [currentUserId]);

  const updateInvestment = useCallback((i: Investment) => {
    financeService.updateInvestment(currentUserId, i);
    setInvestments(prev => prev.map(x => x.id === i.id ? i : x));
  }, [currentUserId]);

  const deleteInvestment = useCallback((id: string) => {
    financeService.deleteInvestment(currentUserId, id);
    setInvestments(prev => prev.filter(x => x.id !== id));
  }, [currentUserId]);

  const updateForecastFn = useCallback((f: Forecast[]) => {
    financeService.updateForecast(currentUserId, f);
    setForecast(f);
  }, [currentUserId]);

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

  // Admin helpers — read from centralized database
  const getUserTransactions = useCallback((userId: string) => financeService.getTransactions(userId), []);
  const getUserCategories = useCallback((userId: string) => financeService.getCategories(userId), []);
  const getUserAccounts = useCallback((userId: string) => financeService.getAccounts(userId), []);
  const getUserDebts = useCallback((userId: string) => financeService.getDebts(userId), []);
  const getUserInvestments = useCallback((userId: string) => financeService.getInvestments(userId), []);

  // Credit card operations
  const addCreditCardFn = useCallback((c: Omit<CreditCard, 'id' | 'userId' | 'createdAt'>) => {
    const newCard = financeService.addCreditCard(currentUserId, c);
    setCreditCards(prev => [...prev, newCard]);
  }, [currentUserId]);

  const deleteCreditCardFn = useCallback((id: string) => {
    financeService.deleteCreditCard(currentUserId, id);
    setCreditCards(prev => prev.filter(x => x.id !== id));
    setCreditCardExpenses(prev => prev.filter(x => x.cardId !== id));
  }, [currentUserId]);

  const addCreditCardExpenseFn = useCallback((e: Omit<CreditCardExpense, 'id' | 'userId'>) => {
    const generated = financeService.addCreditCardExpense(currentUserId, e);
    setCreditCardExpenses(prev => [...prev, ...generated]);
  }, [currentUserId]);

  const deleteCreditCardExpenseFn = useCallback((e: Omit<CreditCardExpense, 'id' | 'userId'>) => {
    // Find the actual expense by matching fields
    const all = financeService.getCreditCardExpenses(currentUserId);
    const found = all.find(x => x.cardId === e.cardId && x.description === e.description && x.purchaseDate === e.purchaseDate);
    if (found) {
      financeService.deleteCreditCardExpense(currentUserId, found.id);
      const updated = financeService.getCreditCardExpenses(currentUserId);
      setCreditCardExpenses(updated);
    }
  }, [currentUserId]);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, accounts, debts, investments, forecast,
      creditCards, creditCardExpenses,
      allTransactions, allCategories, allAccounts, allDebts, allInvestments,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addAccount, updateAccount, deleteAccount,
      addDebt, updateDebt, deleteDebt,
      addInvestment, updateInvestment, deleteInvestment,
      updateForecast: updateForecastFn,
      addCreditCard: addCreditCardFn, deleteCreditCard: deleteCreditCardFn,
      addCreditCardExpense: addCreditCardExpenseFn, deleteCreditCardExpense: deleteCreditCardExpenseFn,
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
