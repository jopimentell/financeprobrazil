import { useState } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { Check, Pencil, Trash2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionTableProps {
  transactions: Transaction[];
  showActions?: boolean;
  onEdit?: (t: Transaction) => void;
  pageSize?: number;
}

export function TransactionTable({ transactions, showActions = true, onEdit, pageSize = 10 }: TransactionTableProps) {
  const { deleteTransaction, updateTransaction, addTransaction, getCategoryName, getAccountName, getCategoryColor } = useFinance();
  const [page, setPage] = useState(0);

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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Data</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
              <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Conta</th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">Valor</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
              {showActions && <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                <td className="py-3 px-2 text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="py-3 px-2 font-medium">
                  <div className="flex items-center gap-2">
                    {t.description}
                    {t.origin && t.origin !== 'manual' && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        t.origin === 'importacao' ? 'bg-accent text-accent-foreground' :
                        t.origin === 'parcelamento' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {t.origin === 'importacao' ? 'Importado' : t.origin === 'parcelamento' ? `${t.parcelaAtual}/${t.totalParcelas}` : t.origin}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />
                    {getCategoryName(t.categoryId)}
                  </span>
                </td>
                <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">{getAccountName(t.accountId)}</td>
                <td className={`py-3 px-2 text-right font-semibold ${t.type === 'income' ? 'finance-income' : 'finance-expense'}`}>
                  {t.type === 'income' ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'paid' ? 'bg-finance-income/10 finance-income' : 'bg-finance-warning/10 finance-warning'}`}>
                    {t.status === 'paid' ? 'Pago' : 'Pendente'}
                  </span>
                </td>
                {showActions && (
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-0.5">
                      {t.status === 'pending' && (
                        <button onClick={() => handleMarkPaid(t)} className="p-1.5 rounded hover:bg-accent" title="Marcar como pago">
                          <Check className="h-4 w-4 finance-income" />
                        </button>
                      )}
                      <button onClick={() => handleDuplicate(t)} className="p-1.5 rounded hover:bg-accent" title="Duplicar">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {onEdit && (
                        <button onClick={() => onEdit(t)} className="p-1.5 rounded hover:bg-accent" title="Editar">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-accent" title="Excluir">
                        <Trash2 className="h-4 w-4 finance-expense" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
