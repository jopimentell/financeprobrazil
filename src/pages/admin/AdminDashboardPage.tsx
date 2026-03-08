import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { Users, ArrowLeftRight, TrendingUp, TrendingDown, UserPlus, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboardPage() {
  const { users } = useAuth();
  const { transactions } = useFinance();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const regularUsers = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  const stats = useMemo(() => {
    const totalUsers = regularUsers.length;

    const activeThisMonth = new Set(
      transactions
        .filter(t => { const d = new Date(t.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
        .map(() => 'user-activity') // mock: in real app would use userId
    ).size > 0 ? Math.min(Math.ceil(totalUsers * 0.7), totalUsers) : 0;

    const totalTransactions = transactions.length;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const today = now.toISOString().split('T')[0];
    const registeredToday = regularUsers.filter(u => u.createdAt === today).length;

    const thisMonthUsers = regularUsers.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const lastMonthUsers = regularUsers.filter(u => {
      const d = new Date(u.createdAt);
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lm && d.getFullYear() === ly;
    }).length;
    const growthPct = lastMonthUsers === 0 ? (thisMonthUsers > 0 ? 100 : 0) : Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100);

    return { totalUsers, activeThisMonth, totalTransactions, totalIncome, totalExpenses, registeredToday, growthPct, thisMonthUsers };
  }, [regularUsers, transactions, currentMonth, currentYear, now]);

  const monthlyUsersChart = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      const count = regularUsers.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;
      const label = new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' });
      return { month: label, usuarios: count };
    });
  }, [regularUsers, currentMonth, currentYear]);

  const monthlyTxChart = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
      const label = new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' });
      return {
        month: label,
        receitas: monthTx.filter(t => t.type === 'income').length,
        despesas: monthTx.filter(t => t.type === 'expense').length,
      };
    });
  }, [transactions, currentMonth, currentYear]);

  const growthChart = useMemo(() => {
    let cumulative = 0;
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      const count = regularUsers.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;
      cumulative += count;
      const label = new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' });
      return { month: label, total: cumulative };
    });
  }, [regularUsers, currentMonth, currentYear]);

  const cards = [
    { label: 'Usuários cadastrados', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Ativos no mês', value: stats.activeThisMonth, icon: Activity, color: 'finance-info' },
    { label: 'Total de transações', value: stats.totalTransactions, icon: ArrowLeftRight, color: 'text-primary' },
    { label: 'Receita total', value: `R$ ${stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'finance-income' },
    { label: 'Despesas totais', value: `R$ ${stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: 'finance-expense' },
    { label: 'Cadastros hoje', value: stats.registeredToday, icon: UserPlus, color: 'text-primary' },
    {
      label: 'Crescimento mensal',
      value: `${stats.growthPct >= 0 ? '+' : ''}${stats.growthPct}%`,
      icon: stats.growthPct >= 0 ? TrendingUp : TrendingDown,
      color: stats.growthPct >= 0 ? 'finance-income' : 'finance-expense',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="finance-card flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-accent ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold mt-0.5">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Novos Usuários por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyUsersChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="usuarios" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Transações por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTxChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(var(--finance-income))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="hsl(var(--finance-expense))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="finance-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Crescimento da Base de Usuários</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
