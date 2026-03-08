export interface Transaction {
  id: string;
  userId: string;
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
  /** Links installment transactions to the originating debt */
  parcelamentoId?: string;
  /** Origin of the transaction */
  origin?: 'manual' | 'parcelamento';
  /** Current installment number (e.g. 1 of 10) */
  parcelaAtual?: number;
  /** Total installments in the series */
  totalParcelas?: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'wallet' | 'credit_card';
  balance: number;
}

export interface Debt {
  id: string;
  userId: string;
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
  userId: string;
  name: string;
  type: 'stocks' | 'crypto' | 'fixed_income';
  investedAmount: number;
  currentValue: number;
  profit: number;
}

export interface Forecast {
  userId: string;
  month: string;
  expectedIncome: number;
  expectedExpenses: number;
  projectedBalance: number;
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'register' | 'create_transaction' | 'delete_transaction' | 'update_transaction' | 'create_category' | 'delete_category' | 'create_account' | 'delete_account' | 'create_debt' | 'delete_debt' | 'create_investment' | 'delete_investment' | 'admin_action';
  entity?: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface SystemSettings {
  defaultCurrency: string;
  defaultCategories: boolean;
  maxTransactionsPerUser: number;
  maxAccountsPerUser: number;
  googleSheetsEnabled: boolean;
  googleSheetsUrl: string;
  maintenanceMode: boolean;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  createdAt: string;
}

export interface CreditCardExpense {
  id: string;
  userId: string;
  cardId: string;
  description: string;
  amount: number;
  category: string;
  purchaseDate: string;
  installments?: number;
  currentInstallment?: number;
  totalInstallments?: number;
  parentExpenseId?: string;
}

export interface CreditCardInvoice {
  cardId: string;
  month: string; // YYYY-MM
  total: number;
  status: 'open' | 'closed' | 'paid' | 'future';
  expenses: CreditCardExpense[];
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  debts: Debt[];
  investments: Investment[];
  forecast: Forecast[];
  creditCards: CreditCard[];
  creditCardExpenses: CreditCardExpense[];
}
