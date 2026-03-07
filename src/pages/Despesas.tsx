import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { Transaction } from '@/types/finance';
import { Plus, ArrowUpCircle } from 'lucide-react';

export default function Despesas() {
  const { transactions } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const expenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const total = expenses.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(0 84% 60% / 0.1)' }}>
            <ArrowUpCircle className="h-5 w-5 finance-expense" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Despesas</h1>
            <p className="text-sm text-muted-foreground">Total: <span className="finance-expense font-semibold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
          </div>
        </div>
        <button onClick={() => { setEditTx(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg btn-expense text-sm font-medium">
          <Plus className="h-4 w-4" /> Nova Despesa
        </button>
      </div>
      <div className="finance-card">
        <TransactionTable transactions={expenses} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        <div className="mt-3 text-xs text-muted-foreground">{expenses.length} despesa(s)</div>
      </div>
      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} defaultType="expense" />
    </div>
  );
}
