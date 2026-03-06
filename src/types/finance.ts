export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  accountId: string;
  date: string;
  status: 'paid' | 'pending';
  recurrence: 'none' | 'monthly' | 'yearly';
  installments?: number;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'wallet' | 'credit_card';
  balance: number;
}

export interface Debt {
  id: string;
  creditor: string;
  totalAmount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
  interestRate: number;
  dueDate: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'stocks' | 'crypto' | 'fixed_income';
  investedAmount: number;
  currentValue: number;
  profit: number;
}

export interface Forecast {
  month: string;
  expectedIncome: number;
  expectedExpenses: number;
  projectedBalance: number;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
}
