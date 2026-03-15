import { useState, useMemo, useRef, useCallback } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { ImportStatementModal } from '@/components/ImportStatementModal';
import { Transaction } from '@/types/finance';
import { Plus, Filter, Upload, Send, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { detectTransactionType, suggestCategory } from '@/utils/transactionIntelligence';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Quick-add state
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const [quickCategoryId, setQuickCategoryId] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().split('T')[0]);
  const descRef = useRef<HTMLInputElement>(null);

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const quickCategories = quickType === 'income' ? incomeCategories : expenseCategories;

  const handleDescChange = useCallback((desc: string) => {
    setQuickDesc(desc);
    if (desc.length > 3) {
      const detected = detectTransactionType(desc);
      if (detected !== 'unknown') setQuickType(detected);
      const suggested = suggestCategory(desc);
      if (suggested !== 'Outros') {
        const cats = detected === 'income' ? incomeCategories : expenseCategories;
        const match = cats.find(c => c.name.toLowerCase().includes(suggested.toLowerCase()));
        if (match) setQuickCategoryId(match.id);
      }
    }
  }, [incomeCategories, expenseCategories]);

  const handleQuickAdd = useCallback(() => {
    if (!quickDesc || !quickAmount) { toast.error('Preencha descrição e valor'); return; }
    const amount = parseFloat(quickAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) { toast.error('Valor inválido'); return; }
    addTransaction({
      description: quickDesc, amount, type: quickType,
      categoryId: quickCategoryId || quickCategories[0]?.id || '',
      accountId: accounts[0]?.id || '', date: quickDate,
      status: 'paid', recurrence: 'none', origin: 'manual',
    });
    toast.success('Transação adicionada!');
    setQuickDesc(''); setQuickAmount(''); setQuickCategoryId('');
    setQuickDate(new Date().toISOString().split('T')[0]);
    descRef.current?.focus();
  }, [quickDesc, quickAmount, quickType, quickCategoryId, quickDate, quickCategories, accounts, addTransaction]);

  const handleQuickKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickAdd(); }
  };

  const activeFilterCount = [filterType, filterCategory, filterStatus, filterOrigin].filter(f => f !== 'all').length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => filterType === 'all' || t.type === filterType)
      .filter(t => filterCategory === 'all' || t.categoryId === filterCategory)
      .filter(t => filterStatus === 'all' || t.status === filterStatus)
      .filter(t => filterOrigin === 'all' || (t.origin || 'manual') === filterOrigin)
      .filter(t => !search || t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, filterStatus, filterOrigin, search]);

  // Summary
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Transações</h1>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-input bg-background text-sm font-medium hover:bg-accent transition-colors min-h-[44px]">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          <button onClick={() => { setEditTx(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="finance-card !p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Receitas</p>
          <p className="text-base font-bold finance-income mt-1">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="finance-card !p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Despesas</p>
          <p className="text-base font-bold finance-expense mt-1">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="finance-card !p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo</p>
          <p className={`text-base font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'finance-income' : 'finance-expense'}`}>
            R$ {(totalIncome - totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Quick Add - Compact */}
      <div className="finance-card !p-3">
        <div className="flex items-center gap-2 mb-2">
          <Send className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">Registro Rápido</span>
        </div>
        <div className="space-y-2" onKeyDown={handleQuickKeyDown}>
          <div className="flex gap-2">
            <input ref={descRef} value={quickDesc} onChange={e => handleDescChange(e.target.value)}
              placeholder="Descrição..." className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]" />
            <input value={quickAmount} onChange={e => setQuickAmount(e.target.value)}
              placeholder="Valor" type="number" step="0.01"
              className="w-24 px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]" />
          </div>
          <div className="flex gap-2">
            <select value={quickType} onChange={e => { setQuickType(e.target.value as 'income' | 'expense'); setQuickCategoryId(''); }}
              className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm min-h-[44px]">
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
            <select value={quickCategoryId} onChange={e => setQuickCategoryId(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm min-h-[44px]">
              <option value="">Categoria...</option>
              {quickCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={handleQuickAdd}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0 min-h-[44px]">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar transações..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px]" />
          </div>
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-input bg-background text-sm font-medium hover:bg-accent transition-colors min-h-[44px] relative">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <div className="finance-card !p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm min-h-[44px]">
                <option value="all">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm min-h-[44px]">
                <option value="all">Todas categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm min-h-[44px]">
                <option value="all">Todos status</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
              <select value={filterOrigin} onChange={e => setFilterOrigin(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm min-h-[44px]">
                <option value="all">Todas origens</option>
                <option value="manual">Manual</option>
                <option value="importacao">Importação</option>
                <option value="parcelamento">Parcelamento</option>
              </select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Transaction List */}
      <div className="finance-card !p-3 md:!p-5">
        <TransactionTable transactions={filtered} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        <div className="mt-3 text-xs text-muted-foreground text-center">{filtered.length} transação(ões)</div>
      </div>

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} />
      <ImportStatementModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
