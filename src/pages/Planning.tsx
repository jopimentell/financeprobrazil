import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionTable } from '@/components/TransactionTable';
import { Transaction } from '@/types/finance';
import { MonthNavigator } from '@/components/MonthNavigator';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Planejamento</h1>
        <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setModalType('income'); setEditTx(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-income text-sm font-medium">
          <Plus className="h-4 w-4" /> Receita Planejada
        </button>
        <button onClick={() => { setModalType('expense'); setEditTx(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-expense text-sm font-medium">
          <Plus className="h-4 w-4" /> Despesa Planejada
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Receitas Pendentes</span>
          <span className="text-2xl font-bold finance-income">R$ {pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Despesas Pendentes</span>
          <span className="text-2xl font-bold finance-expense">R$ {pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {pendingTx.length > 0 && (
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">📋 Pendentes</h3>
          <TransactionTable transactions={pendingTx} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        </div>
      )}

      {paidTx.length > 0 && (
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">✅ Realizadas</h3>
          <TransactionTable transactions={paidTx} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        </div>
      )}

      {!transactions.length && <div className="text-center py-8 text-muted-foreground">Nenhuma transação planejada para este mês</div>}

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} defaultType={modalType} />
    </div>
  );
}
