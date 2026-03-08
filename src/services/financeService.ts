/**
 * Finance service layer — backed by Supabase.
 * All write operations are async and persist to the database.
 * Read operations return from Supabase directly.
 */

import { Transaction, Category, Account, Debt, Investment, Forecast, SystemLog, CreditCard, CreditCardExpense, PaidInvoice } from '@/types/finance';
import { supabase } from '@/integrations/supabase/client';

const uid = () => crypto.randomUUID();

// ── Helper: map DB row to TypeScript type ──────────────

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    categoryId: row.category_id || '',
    accountId: row.account_id || '',
    date: row.date,
    status: row.status,
    recurrence: row.recurrence,
    installments: row.installments,
    notes: row.notes,
    parcelamentoId: row.parcelamento_id,
    origin: row.origin,
    parcelaAtual: row.parcela_atual,
    totalParcelas: row.total_parcelas,
  };
}

function mapCategory(row: any): Category {
  return { id: row.id, userId: row.user_id, name: row.name, type: row.type, color: row.color };
}

function mapAccount(row: any): Account {
  return { id: row.id, userId: row.user_id, name: row.name, type: row.type, balance: Number(row.balance) };
}

function mapDebt(row: any): Debt {
  return {
    id: row.id, userId: row.user_id, creditor: row.creditor,
    totalAmount: Number(row.total_amount), remainingAmount: Number(row.remaining_amount),
    installments: row.installments, paidInstallments: row.paid_installments,
    interestRate: Number(row.interest_rate), dueDate: row.due_date,
  };
}

function mapInvestment(row: any): Investment {
  return {
    id: row.id, userId: row.user_id, name: row.name, type: row.type,
    investedAmount: Number(row.invested_amount), currentValue: Number(row.current_value),
    profit: Number(row.profit),
  };
}

function mapForecast(row: any): Forecast {
  return {
    userId: row.user_id, month: row.month,
    expectedIncome: Number(row.expected_income), expectedExpenses: Number(row.expected_expenses),
    projectedBalance: Number(row.projected_balance),
  };
}

function mapCreditCard(row: any): CreditCard {
  return {
    id: row.id, userId: row.user_id, name: row.name,
    limit: Number(row.limit), closingDay: row.closing_day,
    dueDay: row.due_day, createdAt: row.created_at?.split('T')[0] || '',
  };
}

function mapCreditCardExpense(row: any): CreditCardExpense {
  return {
    id: row.id, userId: row.user_id, cardId: row.card_id,
    description: row.description, amount: Number(row.amount),
    category: row.category, purchaseDate: row.purchase_date,
    installments: row.installments, currentInstallment: row.current_installment,
    totalInstallments: row.total_installments, parentExpenseId: row.parent_expense_id,
  };
}

function mapSystemLog(row: any): SystemLog {
  return {
    id: row.id, userId: row.user_id, userName: row.user_name,
    action: row.action, entity: row.entity, entityId: row.entity_id,
    details: row.details, timestamp: row.timestamp,
  };
}

// ── Fetch all user data ────────────────────────────────

export async function fetchAllUserData(userId: string) {
  const [txRes, catRes, accRes, debtRes, invRes, fcRes, ccRes, cceRes, piRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId),
    supabase.from('categories').select('*').eq('user_id', userId),
    supabase.from('accounts').select('*').eq('user_id', userId),
    supabase.from('debts').select('*').eq('user_id', userId),
    supabase.from('investments').select('*').eq('user_id', userId),
    supabase.from('forecast').select('*').eq('user_id', userId),
    supabase.from('credit_cards').select('*').eq('user_id', userId),
    supabase.from('credit_card_expenses').select('*').eq('user_id', userId),
    supabase.from('paid_invoices').select('*').eq('user_id', userId),
  ]);

  return {
    transactions: (txRes.data || []).map(mapTransaction),
    categories: (catRes.data || []).map(mapCategory),
    accounts: (accRes.data || []).map(mapAccount),
    debts: (debtRes.data || []).map(mapDebt),
    investments: (invRes.data || []).map(mapInvestment),
    forecast: (fcRes.data || []).map(mapForecast),
    creditCards: (ccRes.data || []).map(mapCreditCard),
    creditCardExpenses: (cceRes.data || []).map(mapCreditCardExpense),
    paidInvoices: (piRes.data || []).map((r: any) => ({
      cardId: r.card_id, month: r.month, paidAt: r.paid_at,
      amount: Number(r.amount), transactionId: r.transaction_id,
    } as PaidInvoice)),
  };
}

// ── Transactions ───────────────────────────────────────

export function getTransactions(userId: string): Transaction[] {
  // Sync wrapper — callers should use fetchAllUserData for initial load
  return [];
}

export async function addTransaction(userId: string, t: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> {
  const id = uid();
  const row = {
    id, user_id: userId, description: t.description, amount: t.amount,
    type: t.type, category_id: t.categoryId || null, account_id: t.accountId || null,
    date: t.date, status: t.status, recurrence: t.recurrence,
    installments: t.installments, notes: t.notes,
    parcelamento_id: t.parcelamentoId, origin: t.origin || 'manual',
    parcela_atual: t.parcelaAtual, total_parcelas: t.totalParcelas,
  };
  await supabase.from('transactions').insert(row);
  return { ...t, id, userId };
}

export async function updateTransaction(userId: string, t: Transaction): Promise<void> {
  await supabase.from('transactions').update({
    description: t.description, amount: t.amount, type: t.type,
    category_id: t.categoryId || null, account_id: t.accountId || null,
    date: t.date, status: t.status, recurrence: t.recurrence,
    installments: t.installments, notes: t.notes,
    parcelamento_id: t.parcelamentoId, origin: t.origin,
    parcela_atual: t.parcelaAtual, total_parcelas: t.totalParcelas,
  }).eq('id', t.id);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  await supabase.from('transactions').delete().eq('id', id);
}

// ── Categories ─────────────────────────────────────────

export function getCategories(userId: string): Category[] { return []; }

export async function addCategory(userId: string, c: Omit<Category, 'id' | 'userId'>): Promise<Category> {
  const id = uid();
  await supabase.from('categories').insert({ id, user_id: userId, name: c.name, type: c.type, color: c.color });
  return { ...c, id, userId };
}

export async function updateCategory(userId: string, c: Category): Promise<void> {
  await supabase.from('categories').update({ name: c.name, type: c.type, color: c.color }).eq('id', c.id);
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  await supabase.from('categories').delete().eq('id', id);
}

// ── Accounts ───────────────────────────────────────────

export function getAccounts(userId: string): Account[] { return []; }

export async function addAccount(userId: string, a: Omit<Account, 'id' | 'userId'>): Promise<Account> {
  const id = uid();
  await supabase.from('accounts').insert({ id, user_id: userId, name: a.name, type: a.type, balance: a.balance });
  return { ...a, id, userId };
}

export async function updateAccount(userId: string, a: Account): Promise<void> {
  await supabase.from('accounts').update({ name: a.name, type: a.type, balance: a.balance }).eq('id', a.id);
}

export async function deleteAccount(userId: string, id: string): Promise<void> {
  await supabase.from('accounts').delete().eq('id', id);
}

// ── Debts ──────────────────────────────────────────────

export function getDebts(userId: string): Debt[] { return []; }

export async function addDebtWithInstallments(
  userId: string,
  d: Omit<Debt, 'id' | 'userId'>,
  categoryId: string,
  accountId: string,
): Promise<{ debt: Debt; installments: Transaction[] }> {
  const debtId = uid();
  const newDebt: Debt = { ...d, id: debtId, userId };

  await supabase.from('debts').insert({
    id: debtId, user_id: userId, creditor: d.creditor,
    total_amount: d.totalAmount, remaining_amount: d.remainingAmount,
    installments: d.installments, paid_installments: d.paidInstallments,
    interest_rate: d.interestRate, due_date: d.dueDate,
  });

  const numInstallments = d.installments || 1;
  const installmentAmount = Math.round((d.totalAmount / numInstallments) * 100) / 100;
  const startDate = new Date(d.dueDate);
  const generatedTxs: Transaction[] = [];

  for (let i = 0; i < numInstallments; i++) {
    const txDate = new Date(startDate);
    txDate.setMonth(txDate.getMonth() + i);
    const tx: Transaction = {
      id: uid(), userId,
      description: `${d.creditor} (${i + 1}/${numInstallments})`,
      amount: installmentAmount, type: 'expense',
      categoryId, accountId,
      date: txDate.toISOString().split('T')[0],
      status: 'pending', recurrence: 'none',
      parcelamentoId: debtId, origin: 'parcelamento',
      parcelaAtual: i + 1, totalParcelas: numInstallments,
    };
    generatedTxs.push(tx);
  }

  // Batch insert transactions
  if (generatedTxs.length > 0) {
    await supabase.from('transactions').insert(generatedTxs.map(tx => ({
      id: tx.id, user_id: userId, description: tx.description, amount: tx.amount,
      type: tx.type, category_id: categoryId || null, account_id: accountId || null,
      date: tx.date, status: tx.status, recurrence: tx.recurrence,
      parcelamento_id: tx.parcelamentoId, origin: tx.origin,
      parcela_atual: tx.parcelaAtual, total_parcelas: tx.totalParcelas,
    })));
  }

  return { debt: newDebt, installments: generatedTxs };
}

export async function addDebt(userId: string, d: Omit<Debt, 'id' | 'userId'>): Promise<Debt> {
  const id = uid();
  await supabase.from('debts').insert({
    id, user_id: userId, creditor: d.creditor,
    total_amount: d.totalAmount, remaining_amount: d.remainingAmount,
    installments: d.installments, paid_installments: d.paidInstallments,
    interest_rate: d.interestRate, due_date: d.dueDate,
  });
  return { ...d, id, userId };
}

export async function updateDebt(userId: string, d: Debt): Promise<void> {
  await supabase.from('debts').update({
    creditor: d.creditor, total_amount: d.totalAmount,
    remaining_amount: d.remainingAmount, installments: d.installments,
    paid_installments: d.paidInstallments, interest_rate: d.interestRate,
    due_date: d.dueDate,
  }).eq('id', d.id);
}

export async function deleteDebt(userId: string, id: string): Promise<void> {
  await supabase.from('debts').delete().eq('id', id);
  // Remove future installment transactions
  const now = new Date();
  const { data: txs } = await supabase.from('transactions')
    .select('id, date')
    .eq('user_id', userId)
    .eq('parcelamento_id', id);

  if (txs) {
    const currentMonth = now.getFullYear() * 12 + now.getMonth();
    const futureIds = txs.filter((tx: any) => {
      const d = new Date(tx.date);
      return (d.getFullYear() * 12 + d.getMonth()) > currentMonth;
    }).map((tx: any) => tx.id);

    if (futureIds.length > 0) {
      await supabase.from('transactions').delete().in('id', futureIds);
    }
  }
}

// ── Investments ────────────────────────────────────────

export function getInvestments(userId: string): Investment[] { return []; }

export async function addInvestment(userId: string, i: Omit<Investment, 'id' | 'userId'>): Promise<Investment> {
  const id = uid();
  await supabase.from('investments').insert({
    id, user_id: userId, name: i.name, type: i.type,
    invested_amount: i.investedAmount, current_value: i.currentValue, profit: i.profit,
  });
  return { ...i, id, userId };
}

export async function updateInvestment(userId: string, i: Investment): Promise<void> {
  await supabase.from('investments').update({
    name: i.name, type: i.type, invested_amount: i.investedAmount,
    current_value: i.currentValue, profit: i.profit,
  }).eq('id', i.id);
}

export async function deleteInvestment(userId: string, id: string): Promise<void> {
  await supabase.from('investments').delete().eq('id', id);
}

// ── Forecast ───────────────────────────────────────────

export async function updateForecast(userId: string, f: Forecast[]): Promise<void> {
  // Upsert forecast records
  const rows = f.map(fc => ({
    user_id: userId, month: fc.month,
    expected_income: fc.expectedIncome, expected_expenses: fc.expectedExpenses,
    projected_balance: fc.projectedBalance,
  }));

  for (const row of rows) {
    await supabase.from('forecast').upsert(row, { onConflict: 'user_id,month' });
  }
}

// ── System Logs ────────────────────────────────────────

export async function getSystemLogs(): Promise<SystemLog[]> {
  const { data } = await supabase.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(1000);
  return (data || []).map(mapSystemLog);
}

export async function createSystemLog(log: Omit<SystemLog, 'id' | 'timestamp'>): Promise<SystemLog> {
  const id = uid();
  const timestamp = new Date().toISOString();
  await supabase.from('system_logs').insert({
    id, user_id: log.userId, user_name: log.userName,
    action: log.action, entity: log.entity, entity_id: log.entityId,
    details: log.details, timestamp,
  });
  return { ...log, id, timestamp };
}

// ── Credit Cards ───────────────────────────────────────

export async function addCreditCard(userId: string, c: Omit<CreditCard, 'id' | 'userId' | 'createdAt'>): Promise<CreditCard> {
  const id = uid();
  const createdAt = new Date().toISOString().split('T')[0];
  await supabase.from('credit_cards').insert({
    id, user_id: userId, name: c.name, limit: c.limit,
    closing_day: c.closingDay, due_day: c.dueDay,
  });
  return { ...c, id, userId, createdAt };
}

export async function updateCreditCard(userId: string, c: CreditCard): Promise<void> {
  await supabase.from('credit_cards').update({
    name: c.name, limit: c.limit, closing_day: c.closingDay, due_day: c.dueDay,
  }).eq('id', c.id);
}

export async function deleteCreditCard(userId: string, id: string): Promise<void> {
  await supabase.from('credit_card_expenses').delete().eq('card_id', id);
  await supabase.from('credit_cards').delete().eq('id', id);
}

// ── Credit Card Expenses ──────────────────────────────

export function getCreditCardExpenses(userId: string): CreditCardExpense[] { return []; }

export async function addCreditCardExpense(
  userId: string,
  e: Omit<CreditCardExpense, 'id' | 'userId'>,
): Promise<CreditCardExpense[]> {
  const numInstallments = e.installments || 1;
  const installmentAmount = Math.round((e.amount / numInstallments) * 100) / 100;
  const parentId = uid();
  const startDate = new Date(e.purchaseDate);
  const generated: CreditCardExpense[] = [];

  for (let i = 0; i < numInstallments; i++) {
    const txDate = new Date(startDate);
    txDate.setMonth(txDate.getMonth() + i);
    const exp: CreditCardExpense = {
      id: i === 0 ? parentId : uid(),
      userId, cardId: e.cardId,
      description: numInstallments > 1 ? `${e.description} (${i + 1}/${numInstallments})` : e.description,
      amount: installmentAmount, category: e.category,
      purchaseDate: txDate.toISOString().split('T')[0],
      currentInstallment: i + 1, totalInstallments: numInstallments,
      parentExpenseId: i === 0 ? undefined : parentId,
    };
    generated.push(exp);
  }

  await supabase.from('credit_card_expenses').insert(generated.map(exp => ({
    id: exp.id, user_id: userId, card_id: exp.cardId,
    description: exp.description, amount: exp.amount,
    category: exp.category, purchase_date: exp.purchaseDate,
    installments: exp.installments, current_installment: exp.currentInstallment,
    total_installments: exp.totalInstallments,
    parent_expense_id: exp.parentExpenseId || null,
  })));

  return generated;
}

export async function deleteCreditCardExpense(userId: string, id: string): Promise<void> {
  // Find the expense to check if it's a parent
  const { data } = await supabase.from('credit_card_expenses').select('id, parent_expense_id').eq('id', id).single();
  if (!data) return;
  const parentId = data.parent_expense_id || data.id;
  await supabase.from('credit_card_expenses').delete().or(`id.eq.${parentId},parent_expense_id.eq.${parentId}`);
}

export async function updateCreditCardExpense(userId: string, id: string, updates: Partial<CreditCardExpense>): Promise<void> {
  const row: any = {};
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.amount !== undefined) row.amount = updates.amount;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.purchaseDate !== undefined) row.purchase_date = updates.purchaseDate;
  await supabase.from('credit_card_expenses').update(row).eq('id', id);
}

// ── Paid Invoices ─────────────────────────────────────

export async function markInvoicePaid(
  userId: string, cardId: string, month: string,
  amount: number, categoryId: string, accountId: string,
): Promise<{ paidInvoice: PaidInvoice; transaction: Transaction }> {
  const txId = uid();
  const { data: cards } = await supabase.from('credit_cards').select('name').eq('id', cardId).single();
  const cardName = cards?.name || 'Cartão';

  const tx: Transaction = {
    id: txId, userId,
    description: `Pagamento fatura ${cardName} - ${month}`,
    amount, type: 'expense', categoryId, accountId,
    date: new Date().toISOString().split('T')[0],
    status: 'paid', recurrence: 'none', origin: 'manual',
  };

  await supabase.from('transactions').insert({
    id: txId, user_id: userId, description: tx.description,
    amount, type: 'expense', category_id: categoryId || null,
    account_id: accountId || null, date: tx.date,
    status: 'paid', recurrence: 'none', origin: 'manual',
  });

  const paid: PaidInvoice = {
    cardId, month, paidAt: new Date().toISOString(), amount, transactionId: txId,
  };

  await supabase.from('paid_invoices').insert({
    user_id: userId, card_id: cardId, month,
    amount, transaction_id: txId,
  });

  return { paidInvoice: paid, transaction: tx };
}

/**
 * Compute invoices for a credit card with proper status logic including overdue and paid.
 */
export function computeInvoices(
  card: CreditCard,
  expenses: CreditCardExpense[],
  paidInvoices?: PaidInvoice[],
): import('@/types/finance').CreditCardInvoice[] {
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const paidMap = new Set((paidInvoices || []).filter(p => p.cardId === card.id).map(p => p.month));

  const grouped: Record<string, CreditCardExpense[]> = {};
  expenses.forEach(exp => {
    const d = new Date(exp.purchaseDate);
    let invoiceMonth: Date;
    if (d.getDate() > card.closingDay) {
      invoiceMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    } else {
      invoiceMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const key = `${invoiceMonth.getFullYear()}-${String(invoiceMonth.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(exp);
  });

  return Object.entries(grouped)
    .map(([month, exps]) => {
      const [y, m] = month.split('-').map(Number);
      const dueDate = new Date(y, m - 1, card.dueDay);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      let status: 'open' | 'closed' | 'overdue' | 'paid' | 'future';
      if (paidMap.has(month)) {
        status = 'paid';
      } else if (month > currentKey) {
        status = 'future';
      } else if (month === currentKey) {
        status = now.getDate() <= card.closingDay ? 'open' : 'closed';
      } else {
        status = dueDate < now ? 'overdue' : 'closed';
      }

      return { cardId: card.id, month, total: exps.reduce((s, e) => s + e.amount, 0), status, expenses: exps.sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate)), dueDate: dueDateStr };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

// ── Seed default data for new users ───────────────────

export async function seedDefaultData(userId: string): Promise<void> {
  // Check if user already has categories
  const { data: existingCats } = await supabase.from('categories').select('id').eq('user_id', userId).limit(1);
  if (existingCats && existingCats.length > 0) return; // Already seeded

  const defaultCategories = [
    { user_id: userId, name: 'Salário', type: 'income' as const, color: '#22c55e' },
    { user_id: userId, name: 'Freelance', type: 'income' as const, color: '#3b82f6' },
    { user_id: userId, name: 'Investimentos', type: 'income' as const, color: '#8b5cf6' },
    { user_id: userId, name: 'Outros', type: 'income' as const, color: '#6b7280' },
    { user_id: userId, name: 'Alimentação', type: 'expense' as const, color: '#ef4444' },
    { user_id: userId, name: 'Transporte', type: 'expense' as const, color: '#f59e0b' },
    { user_id: userId, name: 'Moradia', type: 'expense' as const, color: '#8b5cf6' },
    { user_id: userId, name: 'Saúde', type: 'expense' as const, color: '#ec4899' },
    { user_id: userId, name: 'Educação', type: 'expense' as const, color: '#3b82f6' },
    { user_id: userId, name: 'Lazer', type: 'expense' as const, color: '#14b8a6' },
    { user_id: userId, name: 'Compras', type: 'expense' as const, color: '#f97316' },
    { user_id: userId, name: 'Outros', type: 'expense' as const, color: '#6b7280' },
  ];
  await supabase.from('categories').insert(defaultCategories);

  const defaultAccounts = [
    { user_id: userId, name: 'Conta Principal', type: 'bank' as const, balance: 0 },
    { user_id: userId, name: 'Carteira', type: 'wallet' as const, balance: 0 },
  ];
  await supabase.from('accounts').insert(defaultAccounts);
}
