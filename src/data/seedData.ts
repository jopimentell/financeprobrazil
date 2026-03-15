import { Category, Account, Transaction, Debt, Investment, Forecast } from '@/types/finance';

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

function d(day: number, monthOffset = 0) {
  return new Date(y, m + monthOffset, day).toISOString().split('T')[0];
}

export function createDefaultCategories(userId: string): Category[] {
  return [
    { id: `cat-1-${userId}`, userId, name: 'Salário', type: 'income', color: '#22c55e' },
    { id: `cat-2-${userId}`, userId, name: 'Freelance', type: 'income', color: '#10b981' },
    { id: `cat-3-${userId}`, userId, name: 'Investimentos', type: 'income', color: '#06b6d4' },
    { id: `cat-4-${userId}`, userId, name: 'Alimentação', type: 'expense', color: '#ef4444' },
    { id: `cat-5-${userId}`, userId, name: 'Transporte', type: 'expense', color: '#f97316' },
    { id: `cat-6-${userId}`, userId, name: 'Moradia', type: 'expense', color: '#8b5cf6' },
    { id: `cat-7-${userId}`, userId, name: 'Saúde', type: 'expense', color: '#ec4899' },
    { id: `cat-8-${userId}`, userId, name: 'Educação', type: 'expense', color: '#3b82f6' },
    { id: `cat-9-${userId}`, userId, name: 'Lazer', type: 'expense', color: '#f59e0b' },
    { id: `cat-10-${userId}`, userId, name: 'Outros', type: 'expense', color: '#6b7280' },
  ];
}

export function createDefaultAccounts(userId: string): Account[] {
  return [
    { id: `acc-1-${userId}`, userId, name: 'Banco Principal', type: 'bank', balance: 12500 },
    { id: `acc-2-${userId}`, userId, name: 'Carteira', type: 'wallet', balance: 350 },
    { id: `acc-3-${userId}`, userId, name: 'Cartão Crédito', type: 'credit_card', balance: -2100 },
  ];
}

export function createDefaultTransactions(userId: string): Transaction[] {
  const cats = createDefaultCategories(userId);
  const accs = createDefaultAccounts(userId);
  return [
    { id: `tx-1-${userId}`, userId, description: 'Salário', amount: 8500, type: 'income', categoryId: cats[0].id, accountId: accs[0].id, date: d(5), status: 'paid', recurrence: 'monthly' },
    { id: `tx-2-${userId}`, userId, description: 'Freelance Design', amount: 2200, type: 'income', categoryId: cats[1].id, accountId: accs[0].id, date: d(12), status: 'paid', recurrence: 'none' },
    { id: `tx-3-${userId}`, userId, description: 'Aluguel', amount: 2800, type: 'expense', categoryId: cats[5].id, accountId: accs[0].id, date: d(1), status: 'paid', recurrence: 'monthly' },
    { id: `tx-4-${userId}`, userId, description: 'Supermercado', amount: 890, type: 'expense', categoryId: cats[3].id, accountId: accs[2].id, date: d(8), status: 'paid', recurrence: 'none' },
    { id: `tx-5-${userId}`, userId, description: 'Combustível', amount: 320, type: 'expense', categoryId: cats[4].id, accountId: accs[2].id, date: d(10), status: 'paid', recurrence: 'none' },
    { id: `tx-6-${userId}`, userId, description: 'Academia', amount: 150, type: 'expense', categoryId: cats[6].id, accountId: accs[0].id, date: d(5), status: 'paid', recurrence: 'monthly' },
    { id: `tx-7-${userId}`, userId, description: 'Curso Online', amount: 297, type: 'expense', categoryId: cats[7].id, accountId: accs[2].id, date: d(15), status: 'paid', recurrence: 'none' },
    { id: `tx-8-${userId}`, userId, description: 'Cinema', amount: 85, type: 'expense', categoryId: cats[8].id, accountId: accs[1].id, date: d(18), status: 'paid', recurrence: 'none' },
    { id: `tx-9-${userId}`, userId, description: 'Conta de Luz', amount: 210, type: 'expense', categoryId: cats[5].id, accountId: accs[0].id, date: d(20), status: 'pending', recurrence: 'monthly' },
    { id: `tx-10-${userId}`, userId, description: 'Internet', amount: 120, type: 'expense', categoryId: cats[5].id, accountId: accs[0].id, date: d(22), status: 'pending', recurrence: 'monthly' },
    { id: `tx-11-${userId}`, userId, description: 'Dividendos', amount: 450, type: 'income', categoryId: cats[2].id, accountId: accs[0].id, date: d(25), status: 'pending', recurrence: 'none' },
    { id: `tx-12-${userId}`, userId, description: 'Salário', amount: 8500, type: 'income', categoryId: cats[0].id, accountId: accs[0].id, date: d(5, -1), status: 'paid', recurrence: 'monthly' },
    { id: `tx-13-${userId}`, userId, description: 'Aluguel', amount: 2800, type: 'expense', categoryId: cats[5].id, accountId: accs[0].id, date: d(1, -1), status: 'paid', recurrence: 'monthly' },
    { id: `tx-14-${userId}`, userId, description: 'Supermercado', amount: 750, type: 'expense', categoryId: cats[3].id, accountId: accs[2].id, date: d(10, -1), status: 'paid', recurrence: 'none' },
    { id: `tx-15-${userId}`, userId, description: 'Restaurante', amount: 180, type: 'expense', categoryId: cats[8].id, accountId: accs[1].id, date: d(14, -1), status: 'paid', recurrence: 'none' },
  ];
}

export function createDefaultDebts(userId: string): Debt[] {
  return [
    { id: `debt-1-${userId}`, userId, creditor: 'Financiamento Auto', totalAmount: 45000, remainingAmount: 32000, installments: 48, paidInstallments: 16, interestRate: 1.2, dueDate: d(15) },
    { id: `debt-2-${userId}`, userId, creditor: 'Empréstimo Pessoal', totalAmount: 10000, remainingAmount: 4500, installments: 12, paidInstallments: 7, interestRate: 2.5, dueDate: d(20) },
  ];
}

export function createDefaultInvestments(userId: string): Investment[] {
  return [
    { id: `inv-1-${userId}`, userId, name: 'Tesouro Selic', type: 'fixed_income', investedAmount: 15000, currentValue: 16200, profit: 1200 },
    { id: `inv-2-${userId}`, userId, name: 'Ações PETR4', type: 'stocks', investedAmount: 5000, currentValue: 5800, profit: 800 },
    { id: `inv-3-${userId}`, userId, name: 'Bitcoin', type: 'crypto', investedAmount: 3000, currentValue: 4100, profit: 1100 },
    { id: `inv-4-${userId}`, userId, name: 'CDB 120%', type: 'fixed_income', investedAmount: 8000, currentValue: 8650, profit: 650 },
  ];
}

export function createDefaultForecast(userId: string): Forecast[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(y, i, 1).toISOString().split('T')[0];
    const income = 8500 + Math.round(Math.random() * 3000);
    const expenses = 4500 + Math.round(Math.random() * 2000);
    return { userId, month, expectedIncome: income, expectedExpenses: expenses, projectedBalance: income - expenses };
  });
}

// Seed data for demo users
const seedUserIds = ['user-1', 'user-2', 'user-3'];

export const defaultCategories: Category[] = seedUserIds.flatMap(createDefaultCategories);
export const defaultAccounts: Account[] = seedUserIds.flatMap(createDefaultAccounts);
export const defaultTransactions: Transaction[] = seedUserIds.flatMap(createDefaultTransactions);
export const defaultDebts: Debt[] = seedUserIds.flatMap(createDefaultDebts);
export const defaultInvestments: Investment[] = seedUserIds.flatMap(createDefaultInvestments);
export const defaultForecast: Forecast[] = seedUserIds.flatMap(createDefaultForecast);
