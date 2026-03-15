import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#6b7280', '#10b981'];

export default function AdminAnalyticsPage() {
  const { users } = useAuth();
  const { allTransactions, allCategories, getUserTransactions } = useFinance();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

  const regularUsers = useMemo(() => users.filter(u => u.role === 'user'), [users]);
  const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const avgTxPerUser = regularUsers.length > 0 ? Math.round(regularUsers.reduce((s, u) => s + getUserTransactions(u.id).length, 0) / regularUsers.length) : 0;
  const avgIncome = regularUsers.length > 0 ? totalIncome / regularUsers.length : 0;
  const avgExpenses = regularUsers.length > 0 ? totalExpenses / regularUsers.length : 0;

  const dailyActive = regularUsers.filter(u => u.lastLogin >= today).length;
  const weeklyActive = regularUsers.filter(u => u.lastLogin >= weekAgo).length;
  const monthlyActive = regularUsers.filter(u => u.lastLogin >= monthAgo).length;

  const txPerMonth = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      const monthTx = allTransactions.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y; });
      return {
        month: new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        despesas: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [allTransactions, currentMonth, currentYear]);

  const categoryDistribution = useMemo(() => {
    const expenseCats = allCategories.filter(c => c.type === 'expense');
    const uniqueNames = [...new Set(expenseCats.map(c => c.name))];
    return uniqueNames.map(name => {
      const cats = expenseCats.filter(c => c.name === name);
      const catIds = cats.map(c => c.id);
      return {
        name,
        value: allTransactions.filter(t => catIds.includes(t.categoryId)).reduce((s, t) => s + t.amount, 0),
        color: cats[0]?.color,
      };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [allTransactions, allCategories]);

  const topUsers = useMemo(() => {
    return regularUsers
      .map(u => ({ name: u.name, transacoes: getUserTransactions(u.id).length }))
      .sort((a, b) => b.transacoes - a.transacoes)
      .slice(0, 10);
  }, [regularUsers, getUserTransactions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Analytics da Plataforma</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card"><p className="text-xs text-muted-foreground">Ativos hoje</p><p className="text-2xl font-bold mt-1">{dailyActive}</p></div>
        <div className="finance-card"><p className="text-xs text-muted-foreground">Ativos na semana</p><p className="text-2xl font-bold mt-1">{weeklyActive}</p></div>
        <div className="finance-card"><p className="text-xs text-muted-foreground">Ativos no mês</p><p className="text-2xl font-bold mt-1">{monthlyActive}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Receita total</p>
          <p className="text-xl font-bold finance-income mt-1">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Despesa total</p>
          <p className="text-xl font-bold finance-expense mt-1">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Saldo agregado</p>
          <p className={`text-xl font-bold mt-1 ${totalIncome - totalExpenses >= 0 ? 'finance-income' : 'finance-expense'}`}>
            R$ {(totalIncome - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card"><p className="text-xs text-muted-foreground">Média tx/usuário</p><p className="text-2xl font-bold mt-1">{avgTxPerUser}</p></div>
        <div className="finance-card"><p className="text-xs text-muted-foreground">Média receitas/usuário</p><p className="text-xl font-bold finance-income mt-1">R$ {avgIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
        <div className="finance-card"><p className="text-xs text-muted-foreground">Média despesas/usuário</p><p className="text-xl font-bold finance-expense mt-1">R$ {avgExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Receitas vs Despesas por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={txPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(var(--finance-income))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(var(--finance-expense))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Categorias mais utilizadas</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="finance-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Top Usuários por Transações</h3>
          {topUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topUsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip />
                <Bar dataKey="transacoes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}
