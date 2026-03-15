import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { Check, Pencil, Trash2, Copy, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TransactionTableProps {
  transactions: Transaction[];
  showActions?: boolean;
  onEdit?: (t: Transaction) => void;
  pageSize?: number;
}

export function TransactionTable({ transactions, showActions = true, onEdit, pageSize = 10 }: TransactionTableProps) {
  const { deleteTransaction, updateTransaction, addTransaction, getCategoryName, getAccountName, getCategoryColor } = useFinance();
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(transactions.length / pageSize);
  const paginated = transactions.slice(page * pageSize, (page + 1) * pageSize);

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

  if (!transactions.length) {
    return <div className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</div>;
  }

  return (
    <div>
      {/* Mobile: Card List */}
      <div className="md:hidden space-y-2">
        {paginated.map(t => {
          const isExpanded = expandedId === t.id;
          return (
            <div
              key={t.id}
              className="finance-card !p-3 active:scale-[0.99] transition-transform"
              onClick={() => setExpandedId(isExpanded ? null : t.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Category color dot */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${getCategoryColor(t.categoryId)}20` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />
                </div>

                {/* Description + account */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{t.description}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getCategoryName(t.categoryId)} • {getAccountName(t.accountId)}
                  </p>
                </div>

                {/* Value + status */}
                <div className="text-right shrink-0">
                  <p className={`font-semibold text-sm ${t.type === 'income' ? 'finance-income' : 'finance-expense'}`}>
                    {t.type === 'income' ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    {t.status === 'pending' && (
                      <span className="ml-1 text-[10px] finance-warning">• Pendente</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Expanded details + actions */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in" onClick={e => e.stopPropagation()}>
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
            {paginated.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="py-3 px-2 font-medium">
                  <div className="flex items-center gap-2 min-w-0">
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
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />
                    <span className="truncate">{getCategoryName(t.categoryId)}</span>
                  </span>
                </td>
                <td className="py-3 px-2 text-muted-foreground truncate">{getAccountName(t.accountId)}</td>
                <td className={`py-3 px-2 text-right font-semibold whitespace-nowrap ${t.type === 'income' ? 'finance-income' : 'finance-expense'}`}>
                  {t.type === 'income' ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        <DropdownMenuItem onClick={() => handleDelete(t.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
