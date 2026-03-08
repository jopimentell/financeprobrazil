import { useState, useEffect } from 'react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  defaultType?: 'income' | 'expense';
}

export function TransactionModal({ open, onClose, transaction, defaultType }: TransactionModalProps) {
  const { categories, accounts, addTransaction, updateTransaction } = useFinance();
  const isEdit = !!transaction;

  const [form, setForm] = useState({
    description: '', amount: '', type: defaultType || 'expense' as 'income' | 'expense',
    categoryId: '', accountId: '', date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'paid' | 'pending', recurrence: 'none' as 'none' | 'monthly' | 'yearly',
    notes: '',
  });

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
      updateTransaction({ ...data, id: transaction.id, userId: transaction.userId });
      toast.success('Transação atualizada');
    } else {
      addTransaction(data);
      toast.success('Transação adicionada');
    }
    onClose();
  };

  if (!open) return null;

  return (
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
  );
}
