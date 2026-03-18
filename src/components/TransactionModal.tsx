import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { CategorizationPromptModal } from './CategorizationPromptModal';
import {
  findSimilarTransactions,
  normalizeDescription,
  bulkUpdateCategory,
  saveRule,
} from '@/services/categorizationService';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  defaultType?: 'income' | 'expense';
}

export function TransactionModal({ open, onClose, transaction, defaultType }: TransactionModalProps) {
  const { categories, accounts, transactions, addTransaction, updateTransaction } = useFinance();
  const { user } = useAuth();
  const isEdit = !!transaction;

  const [form, setForm] = useState({
    description: '', amount: '', type: defaultType || 'expense' as 'income' | 'expense',
    categoryId: '', accountId: '', date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'paid' | 'pending', recurrence: 'none' as 'none' | 'monthly' | 'yearly',
    notes: '',
  });

  // Categorization prompt state
  const [promptOpen, setPromptOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<Transaction | null>(null);
  const [similarTxs, setSimilarTxs] = useState<Transaction[]>([]);
  const [matchPattern, setMatchPattern] = useState('');

  useEffect(() => {
    if (transaction) {
      setForm({
        description: transaction.description, amount: String(transaction.amount), type: transaction.type,
        categoryId: transaction.categoryId, accountId: transaction.accountId, date: transaction.date,
        status: transaction.status, recurrence: transaction.recurrence, notes: transaction.notes || '',
      });
    } else {
      setForm(f => ({
        ...f, description: '', amount: '', type: defaultType || 'expense',
        categoryId: '', accountId: '', date: new Date().toISOString().split('T')[0],
        status: 'pending', recurrence: 'none', notes: '',
      }));
    }
  }, [transaction, defaultType, open]);

  const filteredCategories = categories.filter(c => c.type === form.type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.categoryId || !form.accountId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const data = { ...form, amount: parseFloat(form.amount) };

    if (isEdit) {
      const updatedTx = { ...data, id: transaction.id, userId: transaction.userId };
      
      // Check if category changed during edit
      const categoryChanged = transaction.categoryId !== form.categoryId;
      if (categoryChanged && form.description) {
        const similar = findSimilarTransactions(form.description, transactions, transaction.id);
        if (similar.length > 0) {
          const pattern = normalizeDescription(form.description);
          const words = pattern.split(' ').filter(w => w.length >= 4).sort((a, b) => b.length - a.length);
          const displayPattern = words[0] || pattern.split(' ')[0] || pattern;
          
          setPendingTransaction(updatedTx as Transaction);
          setSimilarTxs(similar);
          setMatchPattern(displayPattern);
          setPromptOpen(true);
          return;
        }
      }
      
      updateTransaction(updatedTx as Transaction);
      toast.success('Transação atualizada');
    } else {
      addTransaction(data);
      toast.success('Transação adicionada');
    }
    onClose();
  };

  const getCategoryName = useCallback((id: string) => {
    return categories.find(c => c.id === id)?.name || '';
  }, [categories]);

  const handleApplyOnly = useCallback(async () => {
    if (!pendingTransaction) return;
    updateTransaction(pendingTransaction);
    toast.success('Transação atualizada');
    onClose();
  }, [pendingTransaction, updateTransaction, onClose]);

  const handleApplyAll = useCallback(async () => {
    if (!pendingTransaction || !user?.id) return;
    updateTransaction(pendingTransaction);
    const ids = similarTxs.map(t => t.id);
    await bulkUpdateCategory(user.id, ids, pendingTransaction.categoryId);
    // Update local state
    similarTxs.forEach(t => {
      updateTransaction({ ...t, categoryId: pendingTransaction.categoryId });
    });
    toast.success(`${ids.length + 1} transações atualizadas`);
    onClose();
  }, [pendingTransaction, similarTxs, user?.id, updateTransaction, onClose]);

  const handleCreateRule = useCallback(async () => {
    if (!pendingTransaction || !user?.id) return;
    updateTransaction(pendingTransaction);
    const ids = similarTxs.map(t => t.id);
    await bulkUpdateCategory(user.id, ids, pendingTransaction.categoryId);
    similarTxs.forEach(t => {
      updateTransaction({ ...t, categoryId: pendingTransaction.categoryId });
    });
    await saveRule(user.id, matchPattern, 'contains', pendingTransaction.categoryId);
    toast.success(`Regra criada e ${ids.length + 1} transações atualizadas`);
    onClose();
  }, [pendingTransaction, similarTxs, matchPattern, user?.id, updateTransaction, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
        <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card rounded-t-2xl sm:rounded-xl shadow-lg w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] flex flex-col animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border shrink-0">
            <h2 className="text-lg font-bold">{isEdit ? 'Editar Transação' : 'Nova Transação'}</h2>
            <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="h-5 w-5" /></button>
          </div>
          {/* Scrollable form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'income', categoryId: '' }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'income' ? 'btn-income' : 'bg-accent text-accent-foreground'}`}>
                  Receita
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, type: 'expense', categoryId: '' }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === 'expense' ? 'btn-expense' : 'bg-accent text-accent-foreground'}`}>
                  Despesa
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição *</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor *</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria *</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Conta *</label>
                  <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Selecione</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'paid' | 'pending' }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Recorrência</label>
                <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value as 'none' | 'monthly' | 'yearly' }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="none">Nenhuma</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observação</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" rows={2} />
              </div>
            </div>
            {/* Fixed footer */}
            <div className="p-4 sm:p-6 border-t border-border shrink-0">
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                {isEdit ? 'Salvar Alterações' : 'Adicionar Transação'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Categorization Prompt */}
      {pendingTransaction && (
        <CategorizationPromptModal
          open={promptOpen}
          onClose={() => {
            setPromptOpen(false);
            // If closed without action, just apply to this one
            if (pendingTransaction) {
              updateTransaction(pendingTransaction);
              toast.success('Transação atualizada');
              onClose();
            }
          }}
          transaction={pendingTransaction}
          categoryName={getCategoryName(pendingTransaction.categoryId)}
          similarCount={similarTxs.length}
          pattern={matchPattern}
          onApplyAll={handleApplyAll}
          onApplyOnly={handleApplyOnly}
          onCreateRule={handleCreateRule}
        />
      )}
    </>
  );
}
