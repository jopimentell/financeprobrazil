import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { InvestmentCard } from '@/components/InvestmentCard';
import { Investment } from '@/types/finance';
import { Plus, X, TrendingUp, Wallet, BarChart3 } from 'lucide-react';
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
    if (editing) { updateInvestment({ ...data, id: editing.id, userId: editing.userId }); toast.success('Investimento atualizado'); }
    else { addInvestment(data); toast.success('Investimento adicionado'); }
    setModalOpen(false);
  };

  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalProfit = totalCurrent - totalInvested;

  const chartData = investments.map(i => ({ name: i.name.substring(0, 10), investido: i.investedAmount, atual: i.currentValue }));
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Investimentos</h1>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 min-h-[44px]">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="finance-metric">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-info) / 0.1)' }}>
              <Wallet className="h-3.5 w-3.5 finance-info" />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Investido</span>
          <span className="text-base sm:text-xl font-bold finance-info truncate">{fmt(totalInvested)}</span>
        </div>
        <div className="finance-metric">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              <BarChart3 className="h-3.5 w-3.5 text-foreground" />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Atual</span>
          <span className="text-base sm:text-xl font-bold truncate">{fmt(totalCurrent)}</span>
        </div>
        <div className="finance-metric">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: totalProfit >= 0 ? 'hsl(var(--finance-income) / 0.1)' : 'hsl(var(--finance-expense) / 0.1)' }}>
              <TrendingUp className={`h-3.5 w-3.5 ${totalProfit >= 0 ? 'finance-income' : 'finance-expense'}`} />
            </div>
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Rentabilidade</span>
          <span className={`text-base sm:text-xl font-bold truncate ${totalProfit >= 0 ? 'finance-income' : 'finance-expense'}`}>
            {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}
          </span>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Comparativo de Investimentos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="investido" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="atual" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {investments.map(i => (
          <InvestmentCard key={i.id} investment={i} onEdit={openEdit} onDelete={(id) => { deleteInvestment(id); toast.success('Investimento excluído'); }} />
        ))}
      </div>
      {!investments.length && <div className="text-center py-8 text-muted-foreground text-sm">Nenhum investimento cadastrado</div>}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-xl shadow-lg w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] flex flex-col animate-fade-in overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-border shrink-0">
              <h2 className="text-lg font-bold">{editing ? 'Editar Investimento' : 'Novo Investimento'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Investment['type'] }))} className="input-field">
                    <option value="fixed_income">Renda Fixa</option>
                    <option value="stocks">Ações</option>
                    <option value="crypto">Cripto</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Investido *</label>
                  <input type="number" step="0.01" value={form.investedAmount} onChange={e => setForm(f => ({ ...f, investedAmount: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Atual</label>
                  <input type="number" step="0.01" value={form.currentValue} onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} className="input-field" />
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
