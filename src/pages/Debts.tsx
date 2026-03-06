import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { DebtProgressCard } from '@/components/DebtProgressCard';
import { Debt } from '@/types/finance';
import { Plus, X } from 'lucide-react';
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
    if (editing) { updateDebt({ ...data, id: editing.id }); toast.success('Dívida atualizada'); }
    else { addDebt(data); toast.success('Dívida adicionada'); }
    setModalOpen(false);
  };

  const totalDebt = debts.reduce((s, d) => s + d.remainingAmount, 0);
  const totalPaid = debts.reduce((s, d) => s + (d.totalAmount - d.remainingAmount), 0);

  const chartData = debts.map(d => ({
    name: d.creditor.substring(0, 15),
    pago: d.totalAmount - d.remainingAmount,
    restante: d.remainingAmount,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dívidas</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova Dívida
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Total Restante</span>
          <span className="text-2xl font-bold finance-expense">R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Total Pago</span>
          <span className="text-2xl font-bold finance-income">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Progresso de Quitação</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Bar dataKey="pago" stackId="a" fill="hsl(142, 71%, 45%)" />
              <Bar dataKey="restante" stackId="a" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {debts.map(d => (
          <DebtProgressCard key={d.id} debt={d} onEdit={openEdit} onDelete={(id) => { deleteDebt(id); toast.success('Dívida excluída'); }} />
        ))}
      </div>
      {!debts.length && <div className="text-center py-8 text-muted-foreground">Nenhuma dívida cadastrada</div>}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Editar Dívida' : 'Nova Dívida'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Credor *</label>
                <input value={form.creditor} onChange={e => setForm(f => ({ ...f, creditor: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total *</label>
                  <input type="number" step="0.01" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Restante</label>
                  <input type="number" step="0.01" value={form.remainingAmount} onChange={e => setForm(f => ({ ...f, remainingAmount: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Parcelas</label>
                  <input type="number" value={form.installments} onChange={e => setForm(f => ({ ...f, installments: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pagas</label>
                  <input type="number" value={form.paidInstallments} onChange={e => setForm(f => ({ ...f, paidInstallments: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Juros %</label>
                  <input type="number" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vencimento</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">
                {editing ? 'Salvar' : 'Adicionar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
