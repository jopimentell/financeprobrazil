/**
 * Financial nature engine — single source of truth for the second
 * classification layer.
 *
 * Category answers: "where did the money go?"
 * Nature answers:   "what does this movement represent financially?"
 *
 * Rules:
 *  - Only `own_income` counts as REAL income.
 *  - Only `own_expense` counts as REAL expense (consumo).
 *  - Repasses (transfer_in/transfer_out), empréstimos (loan_*), reservas
 *    (reserve) and internal transfers NEVER appear in real income/expense KPIs.
 *  - Refunds reduce the net cost of the linked expense; they are not income.
 *  - `unclassified` keeps legacy behaviour (counts as income/expense by `type`)
 *    so historical numbers do not change until the user reviews them.
 */

import { FinancialNature, Transaction, TransactionType } from '@/types/finance';

export type NatureGroup = 'real' | 'passthrough' | 'financial' | 'reserve' | 'neutral' | 'pending';

export interface NatureMeta {
  value: FinancialNature;
  label: string;
  short: string;
  description: string;
  group: NatureGroup;
  appliesTo: TransactionType[];
  /** Requires a related person to make sense */
  requiresPerson?: boolean;
  /** Offers linking to another transaction */
  allowsRelatedTransaction?: boolean;
  /** Offers linking to a debt */
  allowsDebt?: boolean;
  /** Offers a reserve goal field */
  allowsGoal?: boolean;
  /** Tailwind classes for the badge */
  badgeClass: string;
}

export const NATURES: NatureMeta[] = [
  {
    value: 'own_income',
    label: 'Receita própria',
    short: 'Receita',
    description: 'Dinheiro que é realmente seu. Entra no resultado do mês.',
    group: 'real',
    appliesTo: ['income'],
    badgeClass: 'bg-finance-income/10 text-finance-income border-finance-income/20',
  },
  {
    value: 'own_expense',
    label: 'Despesa própria',
    short: 'Despesa',
    description: 'Consumo real seu. Entra no resultado do mês.',
    group: 'real',
    appliesTo: ['expense'],
    allowsRelatedTransaction: true,
    badgeClass: 'bg-finance-expense/10 text-finance-expense border-finance-expense/20',
  },
  {
    value: 'transfer_in',
    label: 'Recebimento para repasse',
    short: 'A repassar',
    description: 'Dinheiro de terceiro que passou pela sua conta. Não é receita.',
    group: 'passthrough',
    appliesTo: ['income'],
    requiresPerson: true,
    allowsRelatedTransaction: true,
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
  {
    value: 'transfer_out',
    label: 'Repasse a terceiro',
    short: 'Repasse',
    description: 'Você pagou algo de outra pessoa. Não é despesa sua.',
    group: 'passthrough',
    appliesTo: ['expense'],
    requiresPerson: true,
    allowsRelatedTransaction: true,
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
  {
    value: 'loan_received',
    label: 'Empréstimo recebido',
    short: 'Empréstimo',
    description: 'Entrou dinheiro, mas gera obrigação futura. Não é receita.',
    group: 'financial',
    appliesTo: ['income'],
    requiresPerson: true,
    allowsDebt: true,
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    value: 'loan_repaid',
    label: 'Pagamento de empréstimo',
    short: 'Pgto empréstimo',
    description: 'Quitação de dívida. Reduz obrigação, não é consumo.',
    group: 'financial',
    appliesTo: ['expense'],
    requiresPerson: true,
    allowsDebt: true,
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    value: 'refund',
    label: 'Reembolso recebido',
    short: 'Reembolso',
    description: 'Devolução de um gasto que você já pagou. Reduz o custo, não é receita.',
    group: 'passthrough',
    appliesTo: ['income'],
    allowsRelatedTransaction: true,
    requiresPerson: false,
    badgeClass: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
  {
    value: 'reserve',
    label: 'Reserva / aporte',
    short: 'Reserva',
    description: 'Dinheiro guardado. Continua seu, não é consumo.',
    group: 'reserve',
    appliesTo: ['expense', 'income'],
    allowsGoal: true,
    badgeClass: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  },
  {
    value: 'internal_transfer',
    label: 'Transferência entre contas',
    short: 'Transferência',
    description: 'Movimento entre suas próprias contas. Neutro no resultado.',
    group: 'neutral',
    appliesTo: ['transfer'],
    badgeClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  },
  {
    value: 'unclassified',
    label: 'A identificar',
    short: 'A identificar',
    description: 'Ainda não classificada. Conta como receita/despesa até revisão.',
    group: 'pending',
    appliesTo: ['income', 'expense', 'transfer'],
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
];

const BY_VALUE = new Map<FinancialNature, NatureMeta>(NATURES.map(n => [n.value, n]));

export function natureMeta(nature?: FinancialNature | null): NatureMeta {
  return BY_VALUE.get((nature || 'unclassified') as FinancialNature) || BY_VALUE.get('unclassified')!;
}

export function natureLabel(nature?: FinancialNature | null): string {
  return natureMeta(nature).label;
}

/** Natures selectable for a given transaction type. */
export function naturesForType(type: TransactionType): NatureMeta[] {
  return NATURES.filter(n => n.value !== 'unclassified' && n.appliesTo.includes(type));
}

/** Default nature when the user has not classified anything yet. */
export function defaultNatureForType(type: TransactionType): FinancialNature {
  if (type === 'income') return 'own_income';
  if (type === 'expense') return 'own_expense';
  return 'internal_transfer';
}

export function natureOf(tx: Transaction): FinancialNature {
  return (tx.nature || 'unclassified') as FinancialNature;
}

export function isUnclassified(tx: Transaction): boolean {
  return natureOf(tx) === 'unclassified' && tx.type !== 'transfer';
}

/** Real income: own money earned. Legacy unclassified income still counts. */
export function isRealIncome(tx: Transaction): boolean {
  const n = natureOf(tx);
  if (n === 'own_income') return true;
  return n === 'unclassified' && tx.type === 'income';
}

/** Real expense: actual consumption. Legacy unclassified expense still counts. */
export function isRealExpense(tx: Transaction): boolean {
  const n = natureOf(tx);
  if (n === 'own_expense') return true;
  return n === 'unclassified' && tx.type === 'expense';
}

/** Any movement that touches the bank account (everything but nothing excluded). */
export function isCashMovement(tx: Transaction): boolean {
  return tx.type === 'income' || tx.type === 'expense';
}

/** Money that arrived/left but is not yours (repasses, empréstimos, reembolsos). */
export function isPassthrough(tx: Transaction): boolean {
  const g = natureMeta(natureOf(tx)).group;
  return g === 'passthrough' || g === 'financial';
}

export function isReserve(tx: Transaction): boolean {
  return natureOf(tx) === 'reserve';
}

/** Signed contribution to the REAL result (receita própria - despesa própria). */
export function realResultAmount(tx: Transaction): number {
  if (isRealIncome(tx)) return tx.amount;
  if (isRealExpense(tx)) return -tx.amount;
  return 0;
}

export interface RealTotals {
  income: number;
  expense: number;
  result: number;
  passthroughIn: number;
  passthroughOut: number;
  loansIn: number;
  loansOut: number;
  refunds: number;
  reserves: number;
  unclassified: number;
}

export function computeRealTotals(transactions: Transaction[]): RealTotals {
  const t: RealTotals = {
    income: 0, expense: 0, result: 0,
    passthroughIn: 0, passthroughOut: 0,
    loansIn: 0, loansOut: 0, refunds: 0, reserves: 0, unclassified: 0,
  };
  for (const tx of transactions) {
    const n = natureOf(tx);
    if (isRealIncome(tx)) t.income += tx.amount;
    else if (isRealExpense(tx)) t.expense += tx.amount;
    switch (n) {
      case 'transfer_in': t.passthroughIn += tx.amount; break;
      case 'transfer_out': t.passthroughOut += tx.amount; break;
      case 'loan_received': t.loansIn += tx.amount; break;
      case 'loan_repaid': t.loansOut += tx.amount; break;
      case 'refund': t.refunds += tx.amount; break;
      case 'reserve': t.reserves += tx.type === 'expense' ? tx.amount : -tx.amount; break;
      default: break;
    }
    if (isUnclassified(tx)) t.unclassified += 1;
  }
  t.result = t.income - t.expense;
  return t;
}

/**
 * Net cost of an expense = amount - refunds linked to it - repasses split out
 * of it (children with a passthrough nature).
 */
export function netCostOf(tx: Transaction, all: Transaction[]): number {
  if (tx.type !== 'expense') return tx.amount;
  let net = tx.amount;
  for (const other of all) {
    if (other.id === tx.id) continue;
    const n = natureOf(other);
    if (other.relatedTransactionId === tx.id && (n === 'refund' || n === 'transfer_in')) {
      net -= other.amount;
    }
  }
  return Math.max(net, 0);
}

export interface PersonBalance {
  personId: string;
  /** Money you advanced for this person (repasses / pagamentos por ela) */
  paidForThem: number;
  /** Money they gave you to pass along or to repay you */
  receivedFromThem: number;
  /** Positive = they owe you. Negative = you owe them. */
  balance: number;
  loanReceived: number;
  loanRepaid: number;
  count: number;
}

export function computePersonBalances(transactions: Transaction[]): PersonBalance[] {
  const map = new Map<string, PersonBalance>();
  const get = (id: string) => {
    let p = map.get(id);
    if (!p) {
      p = { personId: id, paidForThem: 0, receivedFromThem: 0, balance: 0, loanReceived: 0, loanRepaid: 0, count: 0 };
      map.set(id, p);
    }
    return p;
  };
  for (const tx of transactions) {
    if (!tx.personId) continue;
    const p = get(tx.personId);
    p.count += 1;
    switch (natureOf(tx)) {
      case 'transfer_out': p.paidForThem += tx.amount; break;
      case 'transfer_in': p.receivedFromThem += tx.amount; break;
      case 'refund': p.receivedFromThem += tx.amount; break;
      case 'loan_received': p.loanReceived += tx.amount; break;
      case 'loan_repaid': p.loanRepaid += tx.amount; break;
      default: break;
    }
  }
  for (const p of map.values()) {
    p.balance = p.paidForThem - p.receivedFromThem - (p.loanReceived - p.loanRepaid);
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
}
