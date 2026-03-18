import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Pencil, Check, X } from 'lucide-react';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function ForecastPage() {
  const { forecast, updateForecast } = useFinance();
  const [year, setYear] = useState(new Date().getFullYear());
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const chartData = forecast.map((f, i) => ({
    name: monthShort[i] || `M${i + 1}`,
    receitas: f.expectedIncome,
    despesas: f.expectedExpenses,
    saldo: f.projectedBalance,
  }));

  const handleEdit = (idx: number, field: 'expectedIncome' | 'expectedExpenses', value: number) => {
    const updated = [...forecast];
    updated[idx] = { ...updated[idx], [field]: value, projectedBalance: field === 'expectedIncome' ? value - updated[idx].expectedExpenses : updated[idx].expectedIncome - value };
    updateForecast(updated);
  };

  const totalIncome = forecast.reduce((s, f) => s + f.expectedIncome, 0);
  const totalExpenses = forecast.reduce((s, f) => s + f.expectedExpenses, 0);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Projeção Financeira</h1>
        <MonthNavigator year={year} month={0} onPrev={() => setYear(y => y - 1)} onNext={() => setYear(y => y + 1)} mode="year" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="finance-metric">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Receitas</span>
          <span className="text-lg sm:text-2xl font-bold finance-income truncate">{fmt(totalIncome)}</span>
        </div>
        <div className="finance-metric">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Despesas</span>
          <span className="text-lg sm:text-2xl font-bold finance-expense truncate">{fmt(totalExpenses)}</span>
        </div>
        <div className="finance-metric">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Saldo</span>
          <span className={`text-lg sm:text-2xl font-bold truncate ${totalIncome - totalExpenses >= 0 ? 'finance-income' : 'finance-expense'}`}>
            {fmt(totalIncome - totalExpenses)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="finance-card">
        <h3 className="text-sm font-semibold mb-4">Projeção Anual</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={60} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend />
            <Line type="monotone" dataKey="receitas" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
            <Line type="monotone" dataKey="despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
            <Line type="monotone" dataKey="saldo" stroke="hsl(221, 83%, 53%)" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Cards (mobile-first, replaces table) */}
      <div className="finance-card">
        <h3 className="text-sm font-semibold mb-3">Projeção Mensal</h3>
        <div className="space-y-1">
          {forecast.map((f, i) => {
            const isEditing = editIdx === i;
            return (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-2">
                <span className="text-sm font-medium w-20 shrink-0">{monthNames[i]?.substring(0, 3)}</span>
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <input type="number" className="w-full px-2 py-1.5 text-right rounded-lg border border-input bg-background text-xs min-h-[36px]"
                        value={f.expectedIncome} onChange={e => handleEdit(i, 'expectedIncome', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input type="number" className="w-full px-2 py-1.5 text-right rounded-lg border border-input bg-background text-xs min-h-[36px]"
                        value={f.expectedExpenses} onChange={e => handleEdit(i, 'expectedExpenses', parseFloat(e.target.value) || 0)} />
                    </div>
                    <button onClick={() => setEditIdx(null)} className="p-1.5 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center">
                      <Check className="h-4 w-4 finance-income" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                    <div className="text-right min-w-0">
                      <div className="text-xs text-muted-foreground">
                        <span className="finance-income">+{fmt(f.expectedIncome)}</span>
                        <span className="mx-1">·</span>
                        <span className="finance-expense">-{fmt(f.expectedExpenses)}</span>
                      </div>
                      <div className={`text-sm font-semibold ${f.projectedBalance >= 0 ? 'finance-income' : 'finance-expense'}`}>
                        {fmt(f.projectedBalance)}
                      </div>
                    </div>
                    <button onClick={() => setEditIdx(i)} className="p-1.5 rounded-lg hover:bg-accent min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
