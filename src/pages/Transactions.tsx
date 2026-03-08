import { useState, useMemo, useRef, useCallback } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { ImportStatementModal } from '@/components/ImportStatementModal';
import { Transaction } from '@/types/finance';
import { Plus, Filter, Upload, Send } from 'lucide-react';
import { toast } from 'sonner';
import { detectTransactionType, suggestCategory } from '@/utils/transactionIntelligence';

export default function Transactions() {
  const { transactions, categories, accounts, addTransaction } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  // Quick-add state
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const [quickCategoryId, setQuickCategoryId] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const amountRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const quickCategories = quickType === 'income' ? incomeCategories : expenseCategories;

  // Auto-detect type when description changes
  const handleDescChange = useCallback((desc: string) => {
    setQuickDesc(desc);
    if (desc.length > 3) {
      const detected = detectTransactionType(desc);
      if (detected !== 'unknown') {
        setQuickType(detected);
      }
      // Auto-suggest category
      const suggested = suggestCategory(desc);
      if (suggested !== 'Outros') {
        const cats = detected === 'income' ? incomeCategories : expenseCategories;
        const match = cats.find(c => c.name.toLowerCase().includes(suggested.toLowerCase()));
        if (match) setQuickCategoryId(match.id);
      }
    }
  }, [incomeCategories, expenseCategories]);

  const handleQuickAdd = useCallback(() => {
    if (!quickDesc || !quickAmount) {
      toast.error('Preencha descrição e valor');
      return;
    }
    const amount = parseFloat(quickAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Valor inválido');
      return;
    }
    const categoryId = quickCategoryId || quickCategories[0]?.id || '';
    const accountId = accounts[0]?.id || '';

    addTransaction({
      description: quickDesc,
      amount,
      type: quickType,
      categoryId,
      accountId,
      date: quickDate,
      status: 'paid',
      recurrence: 'none',
      origin: 'manual',
    });

    toast.success('Transação adicionada!');
    setQuickDesc('');
    setQuickAmount('');
    setQuickCategoryId('');
    setQuickDate(new Date().toISOString().split('T')[0]);
    descRef.current?.focus();
  }, [quickDesc, quickAmount, quickType, quickCategoryId, quickDate, quickCategories, accounts, addTransaction]);

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.categoryId === filterCategory)
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => filterOrigin === 'all' || (t.origin || 'manual') === filterOrigin)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, filterStatus, filterOrigin, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Transações</h1>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="h-4 w-4" /> Importar Extrato
          </button>
          <button onClick={() => { setEditTx(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Nova Transação
          </button>
        </div>
      </div>

      {/* Quick Add */}
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-3">
          <Send className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Registro Rápido</span>
          <span className="text-xs text-muted-foreground ml-1">(Enter para salvar)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2" onKeyDown={handleQuickKeyDown}>
          <input
            ref={descRef}
            value={quickDesc}
            onChange={e => handleDescChange(e.target.value)}
            placeholder="Descrição..."
            className="col-span-2 sm:col-span-2 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            ref={amountRef}
            value={quickAmount}
            onChange={e => setQuickAmount(e.target.value)}
            placeholder="Valor"
            type="number"
            step="0.01"
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select value={quickType} onChange={e => { setQuickType(e.target.value as 'income' | 'expense'); setQuickCategoryId(''); }}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
          <select value={quickCategoryId} onChange={e => setQuickCategoryId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="">Categoria...</option>
            {quickCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={quickDate}
              onChange={e => setQuickDate(e.target.value)}
              className="flex-1 px-2 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={handleQuickAdd}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
              title="Adicionar (Enter)">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="finance-card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
          <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
            <option value="all">Todas origens</option>
            <option value="manual">Manual</option>
            <option value="importacao">Importação</option>
            <option value="parcelamento">Parcelamento</option>
            <option value="cartao">Cartão</option>
          </select>
        </div>
      </div>

      <div className="finance-card">
        <TransactionTable transactions={filtered} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        <div className="mt-3 text-xs text-muted-foreground">{filtered.length} transação(ões) encontrada(s)</div>
      </div>

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} />
      <ImportStatementModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
