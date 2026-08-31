import { describe, it, expect } from 'vitest';
import {
  computePeriodSummary,
  computeMonthSummary,
  computeCashBalance,
  computeNetWorth,
  computeMonthlyBalanceSeries,
} from '@/utils/balanceEngine';
import { Account, Transaction } from '@/types/finance';

const acc = (id: string, balance = 0): Account => ({
  id, userId: 'u1', name: id, type: 'bank', balance,
});

let seq = 0;
const tx = (p: Partial<Transaction> & { amount: number; date: string; type: Transaction['type'] }): Transaction => ({
  id: `t${++seq}`,
  userId: 'u1',
  description: p.description || 'x',
  amount: p.amount,
  type: p.type,
  categoryId: p.categoryId || 'c1',
  accountId: p.accountId || 'A',
  transferAccountId: p.transferAccountId,
  date: p.date,
  status: p.status || 'paid',
  recurrence: 'none',
  ...p,
});

describe('Cenário 1 — saldo acumulado entre meses', () => {
  const accounts = [acc('A', 500)];
  const transactions = [
    tx({ type: 'income', amount: 4000, date: '2026-01-10' }),
    tx({ type: 'expense', amount: 2000, date: '2026-01-15' }),
    tx({ type: 'income', amount: 1000, date: '2026-02-10' }),
    tx({ type: 'expense', amount: 2000, date: '2026-02-15' }),
  ];

  it('janeiro: saldo inicial 500 → saldo final 2500', () => {
    const jan = computeMonthSummary(accounts, transactions, 2026, 0);
    expect(jan.openingBalance).toBe(500);
    expect(jan.income).toBe(4000);
    expect(jan.expense).toBe(2000);
    expect(jan.result).toBe(2000);
    expect(jan.finalBalance).toBe(2500);
  });

  it('fevereiro: herda 2500, resultado -1000, saldo final 1500', () => {
    const feb = computeMonthSummary(accounts, transactions, 2026, 1);
    expect(feb.openingBalance).toBe(2500);
    expect(feb.result).toBe(-1000);
    expect(feb.finalBalance).toBe(1500);
  });

  it('a série mensal é contínua (saldo final = saldo inicial do mês seguinte)', () => {
    const series = computeMonthlyBalanceSeries(accounts, transactions, 2026);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].openingBalance).toBeCloseTo(series[i - 1].finalBalance, 2);
    }
  });
});

describe('Cenário 2 — mês negativo sem saldo negativo', () => {
  it('resultado -600 com saldo inicial 1000 → saldo final 400', () => {
    const accounts = [acc('A', 1000)];
    const transactions = [tx({ type: 'expense', amount: 600, date: '2026-03-05' })];
    const s = computeMonthSummary(accounts, transactions, 2026, 2);
    expect(s.openingBalance).toBe(1000);
    expect(s.result).toBe(-600);
    expect(s.finalBalance).toBe(400);
    expect(s.result).toBeLessThan(0);
    expect(s.finalBalance).toBeGreaterThan(0);
  });
});

describe('Cenário 3 — saldo insuficiente fica negativo', () => {
  it('saldo inicial 500, resultado -800 → saldo final -300', () => {
    const accounts = [acc('A', 500)];
    const transactions = [tx({ type: 'expense', amount: 800, date: '2026-03-05' })];
    const s = computeMonthSummary(accounts, transactions, 2026, 2);
    expect(s.finalBalance).toBe(-300);
  });
});

describe('Cenário 4 — transferência não altera patrimônio', () => {
  const accounts = [acc('A', 2000), acc('B', 0)];
  const transactions = [
    tx({ type: 'transfer', amount: 500, date: '2026-01-10', accountId: 'A', transferAccountId: 'B' }),
  ];

  it('caixa total permanece 2000', () => {
    expect(computeCashBalance(accounts, transactions)).toBe(2000);
  });

  it('composição muda: A = 1500, B = 500', () => {
    expect(computeCashBalance(accounts, transactions, { accountId: 'A' })).toBe(1500);
    expect(computeCashBalance(accounts, transactions, { accountId: 'B' })).toBe(500);
  });

  it('não aparece em receitas nem despesas', () => {
    const s = computeMonthSummary(accounts, transactions, 2026, 0);
    expect(s.income).toBe(0);
    expect(s.expense).toBe(0);
    expect(s.result).toBe(0);
  });

  it('patrimônio líquido permanece 2000', () => {
    expect(computeNetWorth({ accounts, transactions }).netWorth).toBe(2000);
  });
});

describe('Cenário 5/6 — empréstimo entra/sai do caixa sem ser receita/despesa própria', () => {
  const accounts = [acc('A', 0)];

  it('empréstimo recebido aumenta o caixa em 500', () => {
    const transactions = [
      tx({ type: 'income', amount: 500, date: '2026-01-10', nature: 'loan_received' }),
    ];
    expect(computeCashBalance(accounts, transactions)).toBe(500);
  });

  it('devolução reduz o caixa e zera o resultado real', () => {
    const transactions = [
      tx({ type: 'income', amount: 500, date: '2026-01-10', nature: 'loan_received' }),
      tx({ type: 'expense', amount: 500, date: '2026-02-10', nature: 'loan_repaid' }),
    ];
    expect(computeCashBalance(accounts, transactions)).toBe(0);
  });
});

describe('Patrimônio líquido = ativos - obrigações', () => {
  it('não soma resultados mensais', () => {
    const accounts = [acc('A', 0)];
    const transactions = [
      tx({ type: 'income', amount: 5000, date: '2026-01-10' }),
      tx({ type: 'expense', amount: 1000, date: '2026-01-11' }),
      tx({ type: 'expense', amount: 2000, date: '2026-02-11' }),
    ];
    const nw = computeNetWorth({
      accounts,
      transactions,
      investments: [{ id: 'i1', userId: 'u1', name: 'CDB', type: 'fixed_income', investedAmount: 1000, currentValue: 1200, profit: 200 }],
      debts: [{ id: 'd1', userId: 'u1', creditor: 'Banco', totalAmount: 1000, remainingAmount: 700, installments: 10, paidInstallments: 3, interestRate: 0, dueDate: '2026-03-01' }],
    });
    expect(nw.cash).toBe(2000);
    expect(nw.assets).toBe(3200);
    expect(nw.liabilities).toBe(700);
    expect(nw.netWorth).toBe(2500);
  });
});

describe('Fuso horário — transação do dia 1 não vaza para o mês anterior', () => {
  it('01/02 pertence a fevereiro', () => {
    const accounts = [acc('A', 0)];
    const transactions = [tx({ type: 'expense', amount: 11, date: '2026-02-01' })];
    expect(computeMonthSummary(accounts, transactions, 2026, 0).expense).toBe(0);
    expect(computeMonthSummary(accounts, transactions, 2026, 1).expense).toBe(11);
  });
});

describe('Período personalizado herda saldo inicial real', () => {
  it('15/02 a 20/02 parte do saldo em 14/02', () => {
    const accounts = [acc('A', 0)];
    const transactions = [
      tx({ type: 'income', amount: 1000, date: '2026-02-01' }),
      tx({ type: 'expense', amount: 200, date: '2026-02-17' }),
    ];
    const s = computePeriodSummary(accounts, transactions, '2026-02-15', '2026-02-20');
    expect(s.openingBalance).toBe(1000);
    expect(s.result).toBe(-200);
    expect(s.finalBalance).toBe(800);
  });
});

describe('Pendentes só entram quando pedido', () => {
  it('inclui pendente apenas com includePending', () => {
    const accounts = [acc('A', 0)];
    const transactions = [tx({ type: 'expense', amount: 210, date: '2026-01-05', status: 'pending' })];
    expect(computeMonthSummary(accounts, transactions, 2026, 0).expense).toBe(0);
    expect(computeMonthSummary(accounts, transactions, 2026, 0, { includePending: true }).expense).toBe(210);
  });
});
