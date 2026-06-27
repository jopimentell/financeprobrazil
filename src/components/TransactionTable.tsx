import { useState, useRef, useCallback } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { Check, Pencil, Trash2, Copy, ChevronLeft, ChevronRight, MoreHorizontal, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryPicker } from '@/components/CategoryPicker';

interface TransactionTableProps {
  transactions: Transaction[];
  showActions?: boolean;
  onEdit?: (t: Transaction) => void;
  pageSize?: number;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function TransactionTable({
  transactions,
  showActions = true,
  onEdit,
  pageSize = 10,
  selectable = false,
  selectedIds,
  onSelectionChange,
}: TransactionTableProps) {
  const { deleteTransaction, updateTransaction, addTransaction, getCategoryName, getAccountName, getCategoryColor, categories, accounts } = useFinance();
  const [convertTx, setConvertTx] = useState<Transaction | null>(null);
  const [convertDest, setConvertDest] = useState<string>('');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const lastClickedIndex = useRef<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const paginated = transactions.slice(page * pageSize, (page + 1) * pageSize);

  const sel = selectedIds ?? new Set<string>();
  const allPageSelected = paginated.length > 0 && paginated.every((t) => sel.has(t.id));
  const somePageSelected = paginated.some((t) => sel.has(t.id));

  const emit = (next: Set<string>) => onSelectionChange?.(new Set(next));

  const toggleOne = (id: string, idxInPage: number, e?: React.MouseEvent) => {
    if (!onSelectionChange) return;
    const next = new Set(sel);
    const globalIndex = page * pageSize + idxInPage;
    // Shift-click range
    if (e?.shiftKey && lastClickedIndex.current !== null) {
      const [from, to] = [lastClickedIndex.current, globalIndex].sort((a, b) => a - b);
      const shouldSelect = !sel.has(id);
      for (let i = from; i <= to; i++) {
        const t = transactions[i];
        if (!t) continue;
        if (shouldSelect) next.add(t.id);
        else next.delete(t.id);
      }
    } else {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    lastClickedIndex.current = globalIndex;
    emit(next);
  };

  const togglePage = () => {
    if (!onSelectionChange) return;
    const next = new Set(sel);
    if (allPageSelected) paginated.forEach((t) => next.delete(t.id));
    else paginated.forEach((t) => next.add(t.id));
    emit(next);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('Transação excluída');
  };
  const handleMarkPaid = (t: Transaction) => {
    updateTransaction({ ...t, status: 'paid' });
    toast.success('Transação marcada como paga');
  };
  const handleDuplicate = (t: Transaction) => {
    const { id, ...rest } = t;
    addTransaction({ ...rest, date: new Date().toISOString().split('T')[0], status: 'pending' });
    toast.success('Transação duplicada');
  };
  const handleQuickCategory = useCallback(
    (t: Transaction, newCatId: string) => {
      updateTransaction({ ...t, categoryId: newCatId });
      toast.success('Categoria atualizada');
    },
    [updateTransaction],
  );

  const handleConfirmConvert = () => {
    if (!convertTx || !convertDest) return;
    if (convertDest === convertTx.accountId) { toast.error('Destino deve ser diferente da origem'); return; }
    updateTransaction({
      ...convertTx,
      type: 'transfer',
      transferAccountId: convertDest,
      categoryId: '',
    });
    toast.success('Convertido em transferência');
    setConvertTx(null);
    setConvertDest('');
  };

  if (!transactions.length) {
    return <div className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</div>;
  }

  return (
    <div>
      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {selectable && (
          <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground">
            <Checkbox
              checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
              onCheckedChange={togglePage}
            />
            <span>Selecionar página ({paginated.length})</span>
          </div>
        )}
        {paginated.map((t, idx) => {
          const isExpanded = expandedId === t.id;
          const isSelected = sel.has(t.id);
          return (
            <div
              key={t.id}
              className={`finance-card !p-3 active:scale-[0.99] transition-all ${isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : t.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {selectable && (
                  <div onClick={(e) => { e.stopPropagation(); toggleOne(t.id, idx, e); }} className="shrink-0">
                    <Checkbox checked={isSelected} />
                  </div>
                )}
                <CategoryPicker
                  categories={categories}
                  currentId={t.categoryId}
                  type={t.type === 'transfer' ? undefined : t.type}
                  onSelect={(id) => handleQuickCategory(t, id)}
                >
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                    style={{ backgroundColor: t.type === 'transfer' ? '#64748b20' : `${getCategoryColor(t.categoryId)}20` }}
                    title={t.type === 'transfer' ? 'Transferência' : 'Alterar categoria'}
                  >
                    {t.type === 'transfer'
                      ? <ArrowLeftRight className="h-4 w-4 text-slate-500" />
                      : <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />}
                  </button>
                </CategoryPicker>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t.type === 'transfer'
                      ? `${getAccountName(t.accountId)} → ${getAccountName(t.transferAccountId || '')}`
                      : `${getCategoryName(t.categoryId)} • ${getAccountName(t.accountId)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm ${t.type === 'income' ? 'finance-income' : t.type === 'expense' ? 'finance-expense' : 'text-slate-500'}`}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '↔ '}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {t.status === 'pending' && <span className="ml-1 text-[10px] finance-warning">• Pendente</span>}
                  </p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Data: {new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    {t.origin && t.origin !== 'manual' && (
                      <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px]">
                        {t.origin === 'importacao' ? 'Importado' : t.origin === 'parcelamento' ? `${t.parcelaAtual}/${t.totalParcelas}` : t.origin}
                      </span>
                    )}
                    {t.notes && <span>Notas: {t.notes}</span>}
                  </div>
                  {showActions && (
                    <div className="flex gap-2">
                      {t.status === 'pending' && (
                        <button onClick={() => handleMarkPaid(t)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-accent text-xs font-medium min-h-[44px]">
                          <Check className="h-4 w-4 finance-income" /> Pagar
                        </button>
                      )}
                      <button onClick={() => handleDuplicate(t)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-accent text-xs font-medium min-h-[44px]">
                        <Copy className="h-4 w-4" /> Duplicar
                      </button>
                      {onEdit && (
                        <button onClick={() => onEdit(t)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-accent text-xs font-medium min-h-[44px]">
                          <Pencil className="h-4 w-4" /> Editar
                        </button>
                      )}
                      <button onClick={() => handleDelete(t.id)} className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-destructive/10 text-xs font-medium text-destructive min-h-[44px]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {selectable && (
                <th className="py-3 px-2 w-10">
                  <Checkbox
                    checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                    onCheckedChange={togglePage}
                  />
                </th>
              )}
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Categoria</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Conta</th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
              {showActions && <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, idx) => {
              const isSelected = sel.has(t.id);
              return (
                <tr
                  key={t.id}
                  className={`border-b border-border/50 transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/50'}`}
                >
                  {selectable && (
                    <td className="py-3 px-2">
                      <div onClick={(e) => toggleOne(t.id, idx, e)}>
                        <Checkbox checked={isSelected} />
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-2 font-medium">
                    <div className="flex items-center gap-2 min-w-0">
                      {t.type === 'transfer' && <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
                      <span className="truncate">{t.description}</span>
                      {t.origin && t.origin !== 'manual' && (
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                          t.origin === 'importacao' ? 'bg-accent text-accent-foreground' :
                          t.origin === 'parcelamento' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {t.origin === 'importacao' ? 'Importado' : t.origin === 'parcelamento' ? `${t.parcelaAtual}/${t.totalParcelas}` : t.origin}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {t.type === 'transfer' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <ArrowLeftRight className="h-3 w-3" /> Transferência
                      </span>
                    ) : (
                      <CategoryPicker
                        categories={categories}
                        currentId={t.categoryId}
                        type={t.type}
                        onSelect={(id) => handleQuickCategory(t, id)}
                      >
                        <button className="inline-flex items-center gap-1.5 px-2 py-1 -mx-2 -my-1 rounded-md hover:bg-accent transition-colors max-w-full">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />
                          <span className="truncate">{getCategoryName(t.categoryId)}</span>
                        </button>
                      </CategoryPicker>
                    )}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground truncate">
                    {t.type === 'transfer'
                      ? <span>{getAccountName(t.accountId)} <span className="opacity-50">→</span> {getAccountName(t.transferAccountId || '')}</span>
                      : getAccountName(t.accountId)}
                  </td>
                  <td className={`py-3 px-2 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'finance-income' : t.type === 'expense' ? 'finance-expense' : 'text-slate-500'}`}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '↔ '}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'paid' ? 'bg-finance-income/10 finance-income' : 'bg-finance-warning/10 finance-warning'}`}>
                      {t.status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  {showActions && (
                    <td className="py-3 px-2 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded hover:bg-accent">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {t.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleMarkPaid(t)}>
                              <Check className="h-4 w-4 mr-2 finance-income" /> Marcar como pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(t)}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                          )}
                          {t.type !== 'transfer' && (
                            <DropdownMenuItem onClick={() => { setConvertTx(t); setConvertDest(''); }}>
                              <ArrowLeftRight className="h-4 w-4 mr-2" /> Converter em transferência
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {convertTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setConvertTx(null)}>
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
          <div className="relative bg-card rounded-2xl shadow-lg w-full max-w-md p-5 space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2"><ArrowLeftRight className="h-4 w-4" /> Converter em transferência</h3>
              <p className="text-xs text-muted-foreground mt-1">{convertTx.description} • R$ {convertTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Conta de destino</label>
              <select value={convertDest} onChange={(e) => setConvertDest(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm">
                <option value="">Selecione</option>
                {accounts.filter((a) => a.id !== convertTx.accountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-2">Origem: {getAccountName(convertTx.accountId)}</p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setConvertTx(null)} className="px-3 py-2 text-sm rounded-lg hover:bg-accent">Cancelar</button>
              <button onClick={handleConfirmConvert} disabled={!convertDest}
                className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
                Converter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

