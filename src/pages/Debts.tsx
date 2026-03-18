import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DebtProgressCard } from '@/components/DebtProgressCard';
import { Debt } from '@/types/finance';
import { Plus, X, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Debts() {
  const { debts, addDebt, updateDebt, deleteDebt } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [form, setForm] = useState({ creditor: '', totalAmount: '', remainingAmount: '', installments: '', paidInstallments: '', interestRate: '', dueDate: '' });

  const openNew = () => {
    setEditing(null);
    setForm({ creditor: '', totalAmount: '', remainingAmount: '', installments: '', paidInstallments: '', interestRate: '', dueDate: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };
  const openEdit = (d: Debt) => {
    setEditing(d);
    setForm({ creditor: d.creditor, totalAmount: String(d.totalAmount), remainingAmount: String(d.remainingAmount), installments: String(d.installments), paidInstallments: String(d.paidInstallments), interestRate: String(d.interestRate), dueDate: d.dueDate });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.creditor || !form.totalAmount) { toast.error('Preencha os campos obrigatórios'); return; }
    const data = {
      creditor: form.creditor, totalAmount: parseFloat(form.totalAmount), remainingAmount: parseFloat(form.remainingAmount) || 0,
      installments: parseInt(form.installments) || 1, paidInstallments: parseInt(form.paidInstallments) || 0,
      interestRate: parseFloat(form.interestRate) || 0, dueDate: form.dueDate,
    };
    if (editing) { updateDebt({ ...data, id: editing.id, userId: editing.userId }); toast.success('Dívida atualizada'); }
    else { addDebt(data); toast.success('Dívida adicionada'); }
    setModalOpen(false);
  };

  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalPaid = debts.reduce((s, d) => s + (d.totalAmount - d.remainingAmount), 0);

  const chartData = debts.map(d => ({
    name: d.creditor.substring(0, 12),
    pago: d.totalAmount - d.remainingAmount,
    restante: d.remainingAmount,
  }));

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dívidas</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 min-h-[44px]">
          <Plus className="h-4 w-4" /> Nova Dívida
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="finance-metric">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-expense) / 0.1)' }}>
              <TrendingDown className="h-3.5 w-3.5 finance-expense" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Restante</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold finance-expense truncate">{fmt(totalDebt)}</span>
        </div>
        <div className="finance-metric">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-income) / 0.1)' }}>
              <DollarSign className="h-3.5 w-3.5 finance-income" />
            </div>
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Pago</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold finance-income truncate">{fmt(totalPaid)}</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Progresso de Quitação</h3>
          <ResponsiveContainer width="100%" height={Math.max(150, debts.length * 50)}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="pago" stackId="a" fill="hsl(142, 71%, 45%)" />
              <Bar dataKey="restante" stackId="a" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {debts.map(d => (
          <DebtProgressCard key={d.id} debt={d} onEdit={openEdit} onDelete={(id) => { deleteDebt(id); toast.success('Dívida excluída'); }} />
        ))}
      </div>
      {!debts.length && <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma dívida cadastrada</div>}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-xl shadow-lg w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] flex flex-col animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg font-bold">{editing ? 'Editar Dívida' : 'Nova Dívida'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credor *</label>
                  <input value={form.creditor} onChange={e => setForm(f => ({ ...f, creditor: e.target.value }))} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Total *</label>
                    <input type="number" step="0.01" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Restante</label>
                    <input type="number" step="0.01" value={form.remainingAmount} onChange={e => setForm(f => ({ ...f, remainingAmount: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Parcelas</label>
                    <input type="number" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pagas</label>
                    <input type="number" value={form.paidInstallments} onChange={e => setForm(f => ({ ...f, paidInstallments: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Juros %</label>
                    <input type="number" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-border shrink-0">
                <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 min-h-[44px]">
                  {editing ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
