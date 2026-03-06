import { Category, Account, Transaction, Debt, Investment, Forecast } from '@/types/finance';

export const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Salário', type: 'income', color: '#22c55e' },
  { id: 'cat-2', name: 'Freelance', type: 'income', color: '#10b981' },
  { id: 'cat-3', name: 'Investimentos', type: 'income', color: '#06b6d4' },
  { id: 'cat-4', name: 'Alimentação', type: 'expense', color: '#ef4444' },
  { id: 'cat-5', name: 'Transporte', type: 'expense', color: '#f97316' },
  { id: 'cat-6', name: 'Moradia', type: 'expense', color: '#8b5cf6' },
  { id: 'cat-7', name: 'Saúde', type: 'expense', color: '#ec4899' },
  { id: 'cat-8', name: 'Educação', type: 'expense', color: '#3b82f6' },
  { id: 'cat-9', name: 'Lazer', type: 'expense', color: '#f59e0b' },
  { id: 'cat-10', name: 'Outros', type: 'expense', color: '#6b7280' },
];

export const defaultAccounts: Account[] = [
  { id: 'acc-1', name: 'Banco Principal', type: 'bank', balance: 12500 },
  { id: 'acc-2', name: 'Carteira', type: 'wallet', balance: 350 },
  { id: 'acc-3', name: 'Cartão Crédito', type: 'credit_card', balance: -2100 },
];

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

function d(day: number, monthOffset = 0) {
  return new Date(y, m + monthOffset, day).toISOString().split('T')[0];
}

export const defaultTransactions: Transaction[] = [
  { id: 'tx-1', description: 'Salário', amount: 8500, type: 'income', categoryId: 'cat-1', accountId: 'acc-1', date: d(5), status: 'paid', recurrence: 'monthly' },
  { id: 'tx-2', description: 'Freelance Design', amount: 2200, type: 'income', categoryId: 'cat-2', accountId: 'acc-1', date: d(12), status: 'paid', recurrence: 'none' },
  { id: 'tx-3', description: 'Aluguel', amount: 2800, type: 'expense', categoryId: 'cat-6', accountId: 'acc-1', date: d(1), status: 'paid', recurrence: 'monthly' },
  { id: 'tx-4', description: 'Supermercado', amount: 890, type: 'expense', categoryId: 'cat-4', accountId: 'acc-3', date: d(8), status: 'paid', recurrence: 'none' },
  { id: 'tx-5', description: 'Combustível', amount: 320, type: 'expense', categoryId: 'cat-5', accountId: 'acc-3', date: d(10), status: 'paid', recurrence: 'none' },
  { id: 'tx-6', description: 'Academia', amount: 150, type: 'expense', categoryId: 'cat-7', accountId: 'acc-1', date: d(5), status: 'paid', recurrence: 'monthly' },
  { id: 'tx-7', description: 'Curso Online', amount: 297, type: 'expense', categoryId: 'cat-8', accountId: 'acc-3', date: d(15), status: 'paid', recurrence: 'none' },
  { id: 'tx-8', description: 'Cinema', amount: 85, type: 'expense', categoryId: 'cat-9', accountId: 'acc-2', date: d(18), status: 'paid', recurrence: 'none' },
  { id: 'tx-9', description: 'Conta de Luz', amount: 210, type: 'expense', categoryId: 'cat-6', accountId: 'acc-1', date: d(20), status: 'pending', recurrence: 'monthly' },
  { id: 'tx-10', description: 'Internet', amount: 120, type: 'expense', categoryId: 'cat-6', accountId: 'acc-1', date: d(22), status: 'pending', recurrence: 'monthly' },
  { id: 'tx-11', description: 'Dividendos', amount: 450, type: 'income', categoryId: 'cat-3', accountId: 'acc-1', date: d(25), status: 'pending', recurrence: 'none' },
  // Previous month
  { id: 'tx-12', description: 'Salário', amount: 8500, type: 'income', categoryId: 'cat-1', accountId: 'acc-1', date: d(5, -1), status: 'paid', recurrence: 'monthly' },
  { id: 'tx-13', description: 'Aluguel', amount: 2800, type: 'expense', categoryId: 'cat-6', accountId: 'acc-1', date: d(1, -1), status: 'paid', recurrence: 'monthly' },
  { id: 'tx-14', description: 'Supermercado', amount: 750, type: 'expense', categoryId: 'cat-4', accountId: 'acc-3', date: d(10, -1), status: 'paid', recurrence: 'none' },
  { id: 'tx-15', description: 'Restaurante', amount: 180, type: 'expense', categoryId: 'cat-9', accountId: 'acc-2', date: d(14, -1), status: 'paid', recurrence: 'none' },
];

export const defaultDebts: Debt[] = [
  { id: 'debt-1', creditor: 'Financiamento Auto', totalAmount: 45000, remainingAmount: 32000, installments: 48, paidInstallments: 16, interestRate: 1.2, dueDate: d(15) },
  { id: 'debt-2', creditor: 'Empréstimo Pessoal', totalAmount: 10000, remainingAmount: 4500, installments: 12, paidInstallments: 7, interestRate: 2.5, dueDate: d(20) },
];

export const defaultInvestments: Investment[] = [
  { id: 'inv-1', name: 'Tesouro Selic', type: 'fixed_income', investedAmount: 15000, currentValue: 16200, profit: 1200 },
  { id: 'inv-2', name: 'Ações PETR4', type: 'stocks', investedAmount: 5000, currentValue: 5800, profit: 800 },
  { id: 'inv-3', name: 'Bitcoin', type: 'crypto', investedAmount: 3000, currentValue: 4100, profit: 1100 },
  { id: 'inv-4', name: 'CDB 120%', type: 'fixed_income', investedAmount: 8000, currentValue: 8650, profit: 650 },
];

export const defaultForecast: Forecast[] = Array.from({ length: 12 }, (_, i) => {
  const month = new Date(y, i, 1).toISOString().split('T')[0];
  const income = 8500 + Math.round(Math.random() * 3000);
  const expenses = 4500 + Math.round(Math.random() * 2000);
  return { month, expectedIncome: income, expectedExpenses: expenses, projectedBalance: income - expenses };
});
