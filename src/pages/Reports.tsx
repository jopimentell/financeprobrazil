import { useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Reports() {
  const { transactions, getCategoryName, getCategoryColor } = useFinance();
  const year = new Date().getFullYear();

  const yearTx = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === year), [transactions, year]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearTx.filter(t => t.type === 'expense').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ name: getCategoryName(id), value, color: getCategoryColor(id) }));
  }, [yearTx, getCategoryName, getCategoryColor]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearTx.filter(t => t.type === 'income').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ name: getCategoryName(id), value, color: getCategoryColor(id) }));
  }, [yearTx, getCategoryName, getCategoryColor]);

  const monthlyComparison = useMemo(() => {
    return monthNames.map((name, i) => {
      const mTx = yearTx.filter(t => new Date(t.date).getMonth() === i);
      return {
        name,
        receitas: mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        despesas: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [yearTx]);

  const cashFlow = useMemo(() => {
    let acc = 0;
    return monthNames.map((name, i) => {
      const mTx = yearTx.filter(t => new Date(t.date).getMonth() === i);
      const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      acc += inc - exp;
      return { name, saldo: acc };
    });
  }, [yearTx]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Relatórios - {year}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Despesas por Categoria</h3>
          {expenseByCategory.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                  {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8">Sem dados</p>}
        </div>

        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Receitas por Categoria</h3>
          {incomeByCategory.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                  {incomeByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8">Sem dados</p>}
        </div>

        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Comparação Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Fluxo de Caixa Acumulado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="saldo" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="hsl(217, 91%, 60%)" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
