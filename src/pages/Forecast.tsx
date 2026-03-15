import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function ForecastPage() {
  const { forecast, updateForecast } = useFinance();
  const [year, setYear] = useState(new Date().getFullYear());
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const chartData = forecast.map((f, i) => ({
    name: monthNames[i]?.substring(0, 3) || `M${i + 1}`,
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projeção Financeira</h1>
        <MonthNavigator year={year} month={0} onPrev={() => setYear(y => y - 1)} onNext={() => setYear(y => y + 1)} mode="year" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Receitas Projetadas</span>
          <span className="text-2xl font-bold finance-income">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Despesas Projetadas</span>
          <span className="text-2xl font-bold finance-expense">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="finance-metric">
          <span className="text-sm text-muted-foreground">Saldo Projetado</span>
          <span className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'finance-income' : 'finance-expense'}`}>
            R$ {(totalIncome - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="finance-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Projeção Anual</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            <Legend />
            <Line type="monotone" dataKey="receitas" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
            <Line type="monotone" dataKey="despesas" stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
            <Line type="monotone" dataKey="saldo" stroke="hsl(217, 91%, 60%)" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="finance-card overflow-x-auto">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Tabela de Projeção</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2">Mês</th>
              <th className="text-right py-2 px-2">Receitas Previstas</th>
              <th className="text-right py-2 px-2">Despesas Previstas</th>
              <th className="text-right py-2 px-2">Saldo Projetado</th>
              <th className="text-center py-2 px-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((f, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                <td className="py-2 px-2 font-medium">{monthNames[i]}</td>
                <td className="py-2 px-2 text-right">
                  {editIdx === i ? (
                    <input type="number" className="w-28 px-2 py-1 text-right rounded border border-input bg-background text-sm"
                      value={f.expectedIncome} onChange={e => handleEdit(i, 'expectedIncome', parseFloat(e.target.value) || 0)} />
                  ) : (
                    <span className="finance-income">R$ {f.expectedIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </td>
                <td className="py-2 px-2 text-right">
                  {editIdx === i ? (
                    <input type="number" className="w-28 px-2 py-1 text-right rounded border border-input bg-background text-sm"
                      value={f.expectedExpenses} onChange={e => handleEdit(i, 'expectedExpenses', parseFloat(e.target.value) || 0)} />
                  ) : (
                    <span className="finance-expense">R$ {f.expectedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </td>
                <td className={`py-2 px-2 text-right font-semibold ${f.projectedBalance >= 0 ? 'finance-income' : 'finance-expense'}`}>
                  R$ {f.projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-2 text-center">
                  <button onClick={() => setEditIdx(editIdx === i ? null : i)} className="text-xs px-2 py-1 rounded hover:bg-accent text-primary">
                    {editIdx === i ? 'Salvar' : 'Editar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
