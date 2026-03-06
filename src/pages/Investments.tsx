import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { InvestmentCard } from '@/components/InvestmentCard';
import { Investment } from '@/types/finance';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Investments() {
  const { investments, addInvestment, updateInvestment, deleteInvestment } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [form, setForm] = useState({ name: '', type: 'fixed_income' as Investment['type'], investedAmount: '', currentValue: '' });

  const openNew = () => { setEditing(null); setForm({ name: '', type: 'fixed_income', investedAmount: '', currentValue: '' }); setModalOpen(true); };
  const openEdit = (i: Investment) => {
    setEditing(i);
    setForm({ name: i.name, type: i.type, investedAmount: String(i.investedAmount), currentValue: String(i.currentValue) });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.investedAmount) { toast.error('Preencha os campos obrigatórios'); return; }
    const invested = parseFloat(form.investedAmount);
    const current = parseFloat(form.currentValue) || invested;
    const data = { name: form.name, type: form.type, investedAmount: invested, currentValue: current, profit: current - invested };
    if (editing) { updateInvestment({ ...data, id: editing.id }); toast.success('Investimento atualizado'); }
    else { addInvestment(data); toast.success('Investimento adicionado'); }
    setModalOpen(false);
  };

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalProfit = totalCurrent - totalInvested;

  const chartData = investments.map(i => ({ name: i.name.substring(0, 10), investido: i.investedAmount, atual: i.currentValue }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investimentos</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo Investimento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Total Investido</span>
          <span className="text-2xl font-bold finance-info">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Valor Atual</span>
          <span className="text-2xl font-bold">R$ {totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Rentabilidade</span>
          <span className={`text-2xl font-bold ${totalProfit >= 0 ? 'finance-income' : 'finance-expense'}`}>
            {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Evolução do Patrimônio</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="investido" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="atual" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map(i => (
          <InvestmentCard key={i.id} investment={i} onEdit={openEdit} onDelete={(id) => { deleteInvestment(id); toast.success('Investimento excluído'); }} />
        ))}
      </div>
      {!investments.length && <div className="text-center py-8 text-muted-foreground">Nenhum investimento cadastrado</div>}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-xl shadow-lg w-full max-w-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Editar Investimento' : 'Novo Investimento'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Investment['type'] }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="fixed_income">Renda Fixa</option>
                  <option value="stocks">Ações</option>
                  <option value="crypto">Cripto</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Investido *</label>
                <input type="number" step="0.01" value={form.investedAmount} onChange={e => setForm(f => ({ ...f, investedAmount: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Atual</label>
                <input type="number" step="0.01" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))}
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
