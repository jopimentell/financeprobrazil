import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { Transaction } from '@/types/finance';
import { Plus, Filter } from 'lucide-react';

export default function Transactions() {
  const { transactions, categories } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.categoryId === filterCategory)
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, filterStatus, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transações</h1>
        <button onClick={() => { setEditTx(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Nova Transação
        </button>
      </div>

      {/* Filters */}
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="all">Todas categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="all">Todos status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </select>
        </div>
      </div>

      <div className="finance-card">
        <TransactionTable transactions={filtered} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        <div className="mt-3 text-xs text-muted-foreground">{filtered.length} transação(ões) encontrada(s)</div>
      </div>

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} />
    </div>
  );
}
