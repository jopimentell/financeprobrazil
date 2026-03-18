import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Category } from '@/types/finance';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', type: 'expense' as 'income' | 'expense', color: '#6b7280' });

  const openNew = () => { setEditing(null); setForm({ name: '', type: 'expense', color: '#6b7280' }); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, type: c.type, color: c.color }); setModalOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    if (editing) { updateCategory({ ...editing, ...form }); toast.success('Categoria atualizada'); }
    else { addCategory(form); toast.success('Categoria criada'); }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => { deleteCategory(id); toast.success('Categoria excluída'); };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Categorias</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 min-h-[44px]">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Categories */}
        <div className="finance-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-income) / 0.1)' }}>
              <span className="text-sm">💰</span>
            </div>
            <h3 className="text-sm font-semibold">Receitas</h3>
            <span className="text-xs text-muted-foreground">({incomeCategories.length})</span>
          </div>
          <div className="space-y-1">
            {incomeCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-accent/50 transition-colors group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-medium text-sm truncate">{c.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 finance-expense" />
                  </button>
                </div>
              </div>
            ))}
            {!incomeCategories.length && <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma categoria de receita</p>}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="finance-card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-expense) / 0.1)' }}>
              <span className="text-sm">💸</span>
            </div>
            <h3 className="text-sm font-semibold">Despesas</h3>
            <span className="text-xs text-muted-foreground">({expenseCategories.length})</span>
          </div>
          <div className="space-y-1">
            {expenseCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-accent/50 transition-colors group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="font-medium text-sm truncate">{c.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 finance-expense" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-xl shadow-lg w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] flex flex-col animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg font-bold">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'income' | 'expense' }))} className="input-field">
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cor</label>
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full mt-1 h-12 rounded-xl border border-input cursor-pointer" />
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-border shrink-0">
                <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 min-h-[44px]">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
