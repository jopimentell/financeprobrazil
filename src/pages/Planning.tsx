import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionTable } from '@/components/TransactionTable';
import { Transaction } from '@/types/finance';
import { MonthNavigator } from '@/components/MonthNavigator';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';

export default function Planning() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { getMonthTransactions } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const transactions = useMemo(() => getMonthTransactions(year, month), [getMonthTransactions, year, month]);
  const pendingTx = transactions.filter(t => t.status === 'pending');
  const paidTx = transactions.filter(t => t.status === 'paid');

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const pendingIncome = pendingTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const pendingExpense = pendingTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Planejamento</h1>
        <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setModalType('income'); setEditTx(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-income text-sm font-medium min-h-[44px]">
          <Plus className="h-4 w-4" /> Receita
        </button>
        <button onClick={() => { setModalType('expense'); setEditTx(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-expense text-sm font-medium min-h-[44px]">
          <Plus className="h-4 w-4" /> Despesa
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="finance-metric">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-income) / 0.1)' }}>
              <TrendingUp className="h-3.5 w-3.5 finance-income" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Receitas</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold finance-income truncate">{fmt(pendingIncome)}</span>
        </div>
        <div className="finance-metric">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-expense) / 0.1)' }}>
              <TrendingDown className="h-3.5 w-3.5 finance-expense" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Despesas</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold finance-expense truncate">{fmt(pendingExpense)}</span>
        </div>
      </div>

      {pendingTx.length > 0 && (
        <div className="finance-card !p-3 md:!p-5">
          <h3 className="text-sm font-semibold mb-3">📋 Pendentes ({pendingTx.length})</h3>
          <TransactionTable transactions={pendingTx} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        </div>
      )}

      {paidTx.length > 0 && (
        <div className="finance-card !p-3 md:!p-5">
          <h3 className="text-sm font-semibold mb-3">✅ Realizadas ({paidTx.length})</h3>
          <TransactionTable transactions={paidTx} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        </div>
      )}

      {!transactions.length && <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma transação planejada para este mês</div>}

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} defaultType={modalType} />
    </div>
  );
}
