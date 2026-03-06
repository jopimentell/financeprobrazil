import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionTableProps {
  transactions: Transaction[];
  showActions?: boolean;
  onEdit?: (t: Transaction) => void;
}

export function TransactionTable({ transactions, showActions = true, onEdit }: TransactionTableProps) {
  const { deleteTransaction, updateTransaction, getCategoryName, getAccountName, getCategoryColor } = useFinance();

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('Transação excluída');
  };

  const handleMarkPaid = (t: Transaction) => {
    updateTransaction({ ...t, status: 'paid' });
    toast.success('Transação marcada como paga');
  };

  if (!transactions.length) {
    return <div className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</div>;
  }

  return (
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
          {transactions.map(t => (
            <tr key={t.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
              <td className="py-3 px-2">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
              <td className="py-3 px-2 font-medium">{t.description}</td>
              <td className="py-3 px-2 hidden sm:table-cell">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(t.categoryId) }} />
                  {getCategoryName(t.categoryId)}
                </span>
              </td>
              <td className="py-3 px-2 hidden md:table-cell">{getAccountName(t.accountId)}</td>
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
                  <div className="flex justify-end gap-1">
                    {t.status === 'pending' && (
                      <button onClick={() => handleMarkPaid(t)} className="p-1.5 rounded hover:bg-accent" title="Marcar como pago">
                        <Check className="h-4 w-4 finance-income" />
                      </button>
                    )}
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
  );
}
