/**
 * ============================================================
 *  FONTE ÚNICA DE VERDADE FINANCEIRA
 * ============================================================
 * Todas as telas (Dashboard, Relatórios, Fluxo de Caixa, Contas,
 * Projeção, Planejamento, Calendário, Cartões, Dívidas, Investimentos)
 * DEVEM consumir estas funções. Nenhuma tela pode inventar fórmula própria.
 *
 * CONCEITOS — nunca misturar:
 *
 *  1. SALDO BANCÁRIO (caixa)
 *     Quanto dinheiro existe nas contas.
 *     saldo inicial da conta + entradas - saídas (inclui empréstimos, repasses).
 *
 *  2. RESULTADO DO PERÍODO
 *     receitas do período - despesas do período.
 *     É movimentação líquida do período, NÃO é saldo.
 *
 *  3. SALDO INICIAL do período
 *     saldo final do período anterior (contínuo na linha do tempo).
 *
 *  4. SALDO FINAL do período
 *     saldo inicial + entradas - saídas.
 *
 *  5. PATRIMÔNIO LÍQUIDO
 *     ativos (contas + investimentos) - obrigações (dívidas + faturas abertas).
 *     Nunca é a soma de resultados mensais.
 *
 * REGRAS:
 *  - `income` entra no caixa e credita `accountId`.
 *  - `expense` sai do caixa e debita `accountId`.
 *  - `transfer` é SEMPRE neutra no total: debita `accountId`, credita
 *    `transferAccountId`. Nunca aparece em receitas/despesas nem altera
 *    patrimônio.
 *  - Datas são `YYYY-MM-DD` e comparadas como string (ver periodUtils) para
 *    evitar deslocamento de fuso horário.
 *  - Por padrão só `status === 'paid'` compõe saldo realizado; `pending` é
 *    projeção e precisa ser pedido explicitamente.
 */

import { Account, CreditCard, CreditCardExpense, Debt, Investment, PaidInvoice, Transaction } from '@/types/finance';
import { isInRange, monthBoundsISO, previousDayISO, toISODate } from '@/utils/periodUtils';

// ── Sinais elementares ─────────────────────────────────────

/** Contribuição para o CAIXA global (transferências são neutras). */
export function signedAmount(tx: Transaction): number {
  if (tx.type === 'income') return tx.amount;
  if (tx.type === 'expense') return -tx.amount;
  return 0; // transfer
}

/** Contribuição de `tx` para o saldo da conta `accountId`. */
export function accountDelta(tx: Transaction, accountId: string): number {
  if (tx.type === 'transfer') {
    if (tx.accountId === accountId) return -tx.amount;
    if (tx.transferAccountId === accountId) return tx.amount;
    return 0;
  }
  if (tx.accountId !== accountId) return 0;
  return tx.type === 'income' ? tx.amount : -tx.amount;
}

export interface BalanceOptions {
  /** Considera apenas transações com `date <= upTo` (inclusive, YYYY-MM-DD). */
  upTo?: string;
  /** Inclui transações pendentes (padrão: somente 'paid'). */
  includePending?: boolean;
  /** Restringe a uma conta específica. */
  accountId?: string;
}

function passesFilter(tx: Transaction, opts?: BalanceOptions) {
  if (!opts?.includePending && tx.status !== 'paid') return false;
  if (opts?.upTo && tx.date.slice(0, 10) > opts.upTo) return false;
  return true;
}

// ── Saldos ─────────────────────────────────────────────────

/** Saldo de uma conta = saldo inicial informado + Σ deltas. */
export function computeAccountBalance(
  account: Account,
  transactions: Transaction[],
  opts?: BalanceOptions,
): number {
  let bal = Number(account.balance || 0);
  for (const tx of transactions) {
    if (!passesFilter(tx, opts)) continue;
    bal += accountDelta(tx, account.id);
  }
  return bal;
}

/**
 * Saldo de caixa (global ou de uma conta) numa data.
 * Global = Σ saldos iniciais das contas + Σ entradas - Σ saídas.
 * Transferências não alteram o global (só a composição entre contas).
 */
export function computeCashBalance(
  accounts: Account[],
  transactions: Transaction[],
  opts?: BalanceOptions,
): number {
  if (opts?.accountId) {
    const acc = accounts.find(a => a.id === opts.accountId);
    if (!acc) return 0;
    return computeAccountBalance(acc, transactions, opts);
  }
  const opening = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const flow = transactions.reduce((s, tx) => (passesFilter(tx, opts) ? s + signedAmount(tx) : s), 0);
  return opening + flow;
}

/** Alias histórico — mantido para compatibilidade. */
export const computeGlobalBalance = computeCashBalance;

/** Soma dos saldos de todas as contas (idêntico ao caixa global). */
export function computeTotalPatrimony(
  accounts: Account[],
  transactions: Transaction[],
  opts?: BalanceOptions,
): number {
  return accounts.reduce((s, a) => s + computeAccountBalance(a, transactions, opts), 0);
}

// ── Resumo de período (saldo inicial → resultado → saldo final) ──

export interface PeriodSummary {
  from: string;
  to: string;
  /** Receitas do período (nunca inclui transferências). */
  income: number;
  /** Despesas do período (nunca inclui transferências). */
  expense: number;
  /** Resultado do período = receitas - despesas. NÃO é saldo. */
  result: number;
  /** Saldo disponível ANTES do período (= saldo final do período anterior). */
  openingBalance: number;
  /** Saldo disponível ao FINAL do período = saldo inicial + resultado. */
  finalBalance: number;
  /** Quantidade de movimentos considerados. */
  count: number;
}

/**
 * Resumo canônico de um período. Esta é a função que Dashboard, Relatórios,
 * Fluxo de Caixa, Projeção e Planejamento devem usar.
 */
export function computePeriodSummary(
  accounts: Account[],
  transactions: Transaction[],
  from: string,
  to: string,
  opts?: { includePending?: boolean; accountId?: string },
): PeriodSummary {
  const includePending = !!opts?.includePending;
  const accountId = opts?.accountId;

  let income = 0;
  let expense = 0;
  let count = 0;

  for (const tx of transactions) {
    if (!includePending && tx.status !== 'paid') continue;
    if (!isInRange(tx.date, from, to)) continue;
    if (accountId) {
      // Numa visão por conta, a transferência é entrada/saída daquela conta.
      const delta = accountDelta(tx, accountId);
      if (delta === 0) continue;
      count++;
      if (delta > 0) income += delta;
      else expense += -delta;
      continue;
    }
    if (tx.type === 'income') { income += tx.amount; count++; }
    else if (tx.type === 'expense') { expense += tx.amount; count++; }
  }

  const openingBalance = computeCashBalance(accounts, transactions, {
    upTo: previousDayISO(from),
    includePending,
    accountId,
  });
  const result = income - expense;

  return {
    from, to, income, expense, result,
    openingBalance,
    finalBalance: openingBalance + result,
    count,
  };
}

/** Resumo de um mês (0-11). */
export function computeMonthSummary(
  accounts: Account[],
  transactions: Transaction[],
  year: number,
  month: number,
  opts?: { includePending?: boolean; accountId?: string },
): PeriodSummary {
  const { from, to } = monthBoundsISO(year, month);
  return computePeriodSummary(accounts, transactions, from, to, opts);
}

/** Compatibilidade: mesma estrutura antiga, agora derivada do resumo. */
export interface PeriodTotals {
  income: number;
  expense: number;
  net: number;
  openingBalance: number;
  endingBalance: number;
}

export function computePeriodTotals(
  accounts: Account[],
  transactions: Transaction[],
  from: string,
  to: string,
): PeriodTotals {
  const s = computePeriodSummary(accounts, transactions, from, to);
  return {
    income: s.income, expense: s.expense, net: s.result,
    openingBalance: s.openingBalance, endingBalance: s.finalBalance,
  };
}

/** Saldo inicial de um mês = saldo final do mês anterior. */
export function computeMonthlyCarryOver(
  accounts: Account[],
  transactions: Transaction[],
  year: number,
  month: number,
  opts?: { includePending?: boolean; accountId?: string },
): number {
  return computeMonthSummary(accounts, transactions, year, month, opts).openingBalance;
}

/** Bounds de mês como YYYY-MM-DD (timezone-safe). */
export function monthBounds(year: number, month: number): { from: string; to: string } {
  return monthBoundsISO(year, month);
}

/** Série contínua de saldos mês a mês — a curva nunca reinicia em zero. */
export interface MonthlyBalancePoint {
  year: number;
  month: number;
  key: string;
  openingBalance: number;
  income: number;
  expense: number;
  result: number;
  finalBalance: number;
}

export function computeMonthlyBalanceSeries(
  accounts: Account[],
  transactions: Transaction[],
  year: number,
  opts?: { includePending?: boolean; accountId?: string },
): MonthlyBalancePoint[] {
  const points: MonthlyBalancePoint[] = [];
  for (let m = 0; m < 12; m++) {
    const s = computeMonthSummary(accounts, transactions, year, m, opts);
    points.push({
      year, month: m, key: `${year}-${String(m + 1).padStart(2, '0')}`,
      openingBalance: s.openingBalance, income: s.income, expense: s.expense,
      result: s.result, finalBalance: s.finalBalance,
    });
  }
  return points;
}

// ── Cartão de crédito ──────────────────────────────────────

/**
 * Fatura em aberto de um cartão = despesas do cartão ainda não pagas.
 * IMPORTANTE (evita dupla contagem): as compras em `credit_card_expenses`
 * NÃO entram no caixa nem em despesas de transações. O impacto financeiro
 * acontece quando a fatura é paga, e o pagamento é uma transação normal
 * (`transactions`) criada por `markInvoicePaid`. Portanto a compra do cartão é
 * uma OBRIGAÇÃO (passivo) até o pagamento — nunca uma despesa duplicada.
 */
export function computeOpenInvoiceTotal(
  cardId: string,
  expenses: CreditCardExpense[],
  paidInvoices: PaidInvoice[],
): number {
  const paidMonths = new Set(paidInvoices.filter(p => p.cardId === cardId).map(p => p.month));
  return expenses
    .filter(e => e.cardId === cardId)
    .filter(e => !paidMonths.has(e.purchaseDate.slice(0, 7)))
    .reduce((s, e) => s + e.amount, 0);
}

export function computeTotalCardLiability(
  cards: CreditCard[],
  expenses: CreditCardExpense[],
  paidInvoices: PaidInvoice[],
): number {
  return cards.reduce((s, c) => s + computeOpenInvoiceTotal(c.id, expenses, paidInvoices), 0);
}

// ── Patrimônio líquido ─────────────────────────────────────

export interface NetWorth {
  /** Dinheiro em contas (caixa). */
  cash: number;
  /** Valor atual dos investimentos. */
  investments: number;
  /** Ativos totais. */
  assets: number;
  /** Dívidas em aberto. */
  debts: number;
  /** Faturas de cartão em aberto. */
  cardLiabilities: number;
  /** Obrigações totais. */
  liabilities: number;
  /** Patrimônio líquido = ativos - obrigações. */
  netWorth: number;
}

/**
 * Posição patrimonial ATUAL. Nunca soma resultados mensais.
 * Uma transferência entre contas (ou para investimento) não altera o total:
 * apenas muda a composição.
 */
export function computeNetWorth(input: {
  accounts: Account[];
  transactions: Transaction[];
  investments?: Investment[];
  debts?: Debt[];
  creditCards?: CreditCard[];
  creditCardExpenses?: CreditCardExpense[];
  paidInvoices?: PaidInvoice[];
  opts?: BalanceOptions;
}): NetWorth {
  const { accounts, transactions, opts } = input;
  const cash = computeTotalPatrimony(accounts, transactions, opts);
  const investments = (input.investments || []).reduce((s, i) => s + Number(i.currentValue || 0), 0);
  const debts = (input.debts || []).reduce((s, d) => s + Number(d.remainingAmount || 0), 0);
  const cardLiabilities = computeTotalCardLiability(
    input.creditCards || [], input.creditCardExpenses || [], input.paidInvoices || [],
  );
  const assets = cash + investments;
  const liabilities = debts + cardLiabilities;
  return { cash, investments, assets, debts, cardLiabilities, liabilities, netWorth: assets - liabilities };
}

/** Data de hoje em ISO local (atalho). */
export function today(): string {
  return toISODate(new Date());
}
