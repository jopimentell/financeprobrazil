import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Account } from '@/types/finance';
import { Plus, Pencil, Trash2, X, Building2, Wallet, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons = { bank: Building2, wallet: Wallet, credit_card: CreditCard };
const typeLabels = { bank: 'Banco', wallet: 'Carteira', credit_card: 'Cartão de Crédito' };
const typeBgColors = {
  bank: 'hsl(var(--finance-info) / 0.1)',
  wallet: 'hsl(var(--finance-income) / 0.1)',
  credit_card: 'hsl(var(--finance-warning) / 0.1)',
};

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
    if (editing) { updateAccount({ ...data, id: editing.id, userId: editing.userId }); toast.success('Conta atualizada'); }
    else { addAccount(data); toast.success('Conta criada'); }
    setModalOpen(false);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Contas</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 min-h-[44px]">
          <Plus className="h-4 w-4" /> Nova Conta
        </button>
      </div>

      {/* Total Balance */}
      <div className="finance-card !p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Patrimônio Total</p>
            <p className={`text-2xl font-bold mt-1 ${totalBalance >= 0 ? 'finance-income' : 'finance-expense'}`}>{fmt(totalBalance)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-info) / 0.1)' }}>
            <Wallet className="h-5 w-5 finance-info" />
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map(a => {
          const Icon = typeIcons[a.type];
          return (
            <div key={a.id} className="finance-card group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: typeBgColors[a.type] }}>
                    <Icon className="h-5 w-5 finance-info" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm truncate">{a.name}</h4>
                    <span className="text-xs text-muted-foreground">{typeLabels[a.type]}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => { deleteAccount(a.id); toast.success('Conta excluída'); }} className="p-2 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 finance-expense" />
                  </button>
                </div>
              </div>
              <span className={`text-xl font-bold ${a.balance >= 0 ? 'finance-income' : 'finance-expense'}`}>{fmt(a.balance)}</span>
            </div>
          );
        })}
      </div>

      {!accounts.length && <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma conta cadastrada</div>}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-xl shadow-lg w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] flex flex-col animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg font-bold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
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
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Account['type'] }))} className="input-field">
                    <option value="bank">Banco</option>
                    <option value="wallet">Carteira</option>
                    <option value="credit_card">Cartão de Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Saldo</label>
                  <input type="number" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} className="input-field" />
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
