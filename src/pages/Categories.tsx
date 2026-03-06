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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">💰 Receitas</h3>
          <div className="space-y-2">
            {incomeCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-medium text-sm">{c.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-accent"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-accent"><Trash2 className="h-4 w-4 finance-expense" /></button>
                </div>
              </div>
            ))}
            {!incomeCategories.length && <p className="text-sm text-muted-foreground">Nenhuma categoria de receita</p>}
          </div>
        </div>
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">💸 Despesas</h3>
          <div className="space-y-2">
            {expenseCategories.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-medium text-sm">{c.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-accent"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1 rounded hover:bg-accent"><Trash2 className="h-4 w-4 finance-expense" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-xl shadow-lg w-full max-w-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'income' | 'expense' }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cor</label>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-full mt-1 h-10 rounded-lg border border-input cursor-pointer" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">
                {editing ? 'Salvar' : 'Criar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
