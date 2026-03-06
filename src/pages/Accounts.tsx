import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Account } from '@/types/finance';
import { Plus, Pencil, Trash2, X, Building2, Wallet, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons = { bank: Building2, wallet: Wallet, credit_card: CreditCard };
const typeLabels = { bank: 'Banco', wallet: 'Carteira', credit_card: 'Cartão de Crédito' };

export default function Accounts() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', type: 'bank' as Account['type'], balance: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', type: 'bank', balance: '' }); setModalOpen(true); };
  const openEdit = (a: Account) => { setEditing(a); setForm({ name: a.name, type: a.type, balance: String(a.balance) }); setModalOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Nome é obrigatório'); return; }
    const data = { name: form.name, type: form.type, balance: parseFloat(form.balance) || 0 };
    if (editing) { updateAccount({ ...data, id: editing.id }); toast.success('Conta atualizada'); }
    else { addAccount(data); toast.success('Conta criada'); }
    setModalOpen(false);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova Conta
        </button>
      </div>

      <div className="finance-metric">
        <span className="text-sm text-muted-foreground">Patrimônio Total</span>
        <span className={`text-2xl font-bold ${totalBalance >= 0 ? 'finance-income' : 'finance-expense'}`}>
          R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(a => {
          const Icon = typeIcons[a.type];
          return (
            <div key={a.id} className="finance-card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-accent"><Icon className="h-5 w-5 finance-info" /></div>
                  <div>
                    <h4 className="font-semibold">{a.name}</h4>
                    <span className="text-xs text-muted-foreground">{typeLabels[a.type]}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1 rounded hover:bg-accent"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                  <button onClick={() => { deleteAccount(a.id); toast.success('Conta excluída'); }} className="p-1 rounded hover:bg-accent"><Trash2 className="h-4 w-4 finance-expense" /></button>
                </div>
              </div>
              <span className={`text-xl font-bold ${a.balance >= 0 ? 'finance-income' : 'finance-expense'}`}>
                R$ {a.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-xl shadow-lg w-full max-w-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
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
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Account['type'] }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="bank">Banco</option>
                  <option value="wallet">Carteira</option>
                  <option value="credit_card">Cartão de Crédito</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Saldo</label>
                <input type="number" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
