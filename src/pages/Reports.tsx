import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Reports() {
  const { transactions, getCategoryName, getCategoryColor } = useFinance();
  const [year, setYear] = useState(new Date().getFullYear());

  const yearTx = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === year), [transactions, year]);

  const totalIncome = yearTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = yearTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearTx.filter(t => t.type === 'expense').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ name: getCategoryName(id), value, color: getCategoryColor(id) })).sort((a, b) => b.value - a.value);
  }, [yearTx, getCategoryName, getCategoryColor]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearTx.filter(t => t.type === 'income').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ name: getCategoryName(id), value, color: getCategoryColor(id) })).sort((a, b) => b.value - a.value);
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
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Relatórios</h1>
        <MonthNavigator year={year} month={0} onPrev={() => setYear(y => y - 1)} onNext={() => setYear(y => y + 1)} mode="year" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="finance-card !p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-income) / 0.1)' }}>
              <TrendingUp className="h-3.5 w-3.5 finance-income" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Receitas</p>
          <p className="text-sm sm:text-base font-bold finance-income mt-0.5 truncate">{fmt(totalIncome)}</p>
        </div>
        <div className="finance-card !p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-expense) / 0.1)' }}>
              <TrendingDown className="h-3.5 w-3.5 finance-expense" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Despesas</p>
          <p className="text-sm sm:text-base font-bold finance-expense mt-0.5 truncate">{fmt(totalExpense)}</p>
        </div>
        <div className="finance-card !p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-info) / 0.1)' }}>
              <DollarSign className="h-3.5 w-3.5 finance-info" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo</p>
          <p className={`text-sm sm:text-base font-bold mt-0.5 truncate ${totalBalance >= 0 ? 'finance-income' : 'finance-expense'}`}>{fmt(totalBalance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Comparison */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Comparação Mensal</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Fluxo de Caixa Acumulado</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="saldo" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by Category */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Despesas por Categoria</h3>
          {expenseByCategory.length ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              {/* Category list */}
              <div className="space-y-1 mt-2">
                {expenseByCategory.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs truncate">{cat.name}</span>
                    </div>
                    <span className="text-xs font-medium shrink-0 ml-2">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-center py-8 text-sm">Sem dados</p>}
        </div>

        {/* Income by Category */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Receitas por Categoria</h3>
          {incomeByCategory.length ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    {incomeByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {incomeByCategory.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs truncate">{cat.name}</span>
                    </div>
                    <span className="text-xs font-medium shrink-0 ml-2">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-center py-8 text-sm">Sem dados</p>}
        </div>
      </div>
    </div>
  );
}
