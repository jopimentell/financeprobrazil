import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { Users, ArrowLeftRight, TrendingUp, TrendingDown, UserPlus, Activity, AlertTriangle, UserX, Ghost } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminDashboardPage() {
  const { users } = useAuth();
  const { allTransactions, getUserTransactions } = useFinance();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const today = now.toISOString().split('T')[0];

  const regularUsers = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  const stats = useMemo(() => {
    const totalUsers = regularUsers.length;
    const activeUsers = regularUsers.filter(u => u.status === 'active').length;
    const totalTransactions = allTransactions.length;
    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
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

    return { totalUsers, activeUsers, totalTransactions, totalIncome, totalExpenses, registeredToday, growthPct };
  }, [regularUsers, allTransactions, currentMonth, currentYear, today]);

  // Telemetry
  const telemetry = useMemo(() => {
    const neverTransacted = regularUsers.filter(u => getUserTransactions(u.id).length === 0).length;
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    const inactive30d = regularUsers.filter(u => u.lastLogin < monthAgo && u.status === 'active').length;
    const activeToday = regularUsers.filter(u => u.lastLogin >= today).length;
    const activeWeek = regularUsers.filter(u => u.lastLogin >= weekAgo).length;
    const activeMonth = regularUsers.filter(u => u.lastLogin >= monthAgo).length;
    const avgTxPerUser = regularUsers.length > 0
      ? Math.round(regularUsers.reduce((s, u) => s + getUserTransactions(u.id).length, 0) / regularUsers.length)
      : 0;
    const retentionRate = regularUsers.length > 0
      ? Math.round((activeMonth / regularUsers.length) * 100)
      : 0;

    return { neverTransacted, inactive30d, activeToday, activeWeek, activeMonth, avgTxPerUser, retentionRate };
  }, [regularUsers, getUserTransactions, today, now]);

  const monthlyUsersChart = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      const count = regularUsers.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;
      return { month: new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' }), usuarios: count };
    });
  }, [regularUsers, currentMonth, currentYear]);

  const monthlyTxChart = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      const monthTx = allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
      return {
        month: new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: monthTx.filter(t => t.type === 'income').length,
        despesas: monthTx.filter(t => t.type === 'expense').length,
      };
    });
  }, [allTransactions, currentMonth, currentYear]);

  const growthChart = useMemo(() => {
    let cumulative = 0;
    return Array.from({ length: 12 }, (_, i) => {
      const m = (currentMonth - 11 + i + 12) % 12;
      const y = currentMonth - 11 + i < 0 ? currentYear - 1 : currentYear;
      cumulative += regularUsers.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === m && d.getFullYear() === y;
      }).length;
      return { month: new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'short' }), total: cumulative };
    });
  }, [regularUsers, currentMonth, currentYear]);

  const cards = [
    { label: 'Usuários cadastrados', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Usuários ativos', value: stats.activeUsers, icon: Activity, color: 'text-primary' },
    { label: 'Total de transações', value: stats.totalTransactions, icon: ArrowLeftRight, color: 'text-primary' },
    { label: 'Receita total', value: `R$ ${stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'finance-income' },
    { label: 'Despesas totais', value: `R$ ${stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: 'finance-expense' },
    { label: 'Cadastros hoje', value: stats.registeredToday, icon: UserPlus, color: 'text-primary' },
    { label: 'Crescimento mensal', value: `${stats.growthPct >= 0 ? '+' : ''}${stats.growthPct}%`, icon: stats.growthPct >= 0 ? TrendingUp : TrendingDown, color: stats.growthPct >= 0 ? 'finance-income' : 'finance-expense' },
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

      {/* Telemetry - Product Health */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Saúde do Produto
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="finance-card flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <Ghost className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nunca transacionaram</p>
              <p className="text-xl font-bold mt-0.5">{telemetry.neverTransacted}</p>
              <p className="text-[10px] text-muted-foreground">{regularUsers.length > 0 ? `${Math.round((telemetry.neverTransacted / regularUsers.length) * 100)}% dos usuários` : ''}</p>
            </div>
          </div>
          <div className="finance-card flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inativos 30+ dias</p>
              <p className="text-xl font-bold mt-0.5">{telemetry.inactive30d}</p>
            </div>
          </div>
          <div className="finance-card flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Média tx/usuário</p>
              <p className="text-xl font-bold mt-0.5">{telemetry.avgTxPerUser}</p>
            </div>
          </div>
          <div className="finance-card flex items-start gap-3">
            <div className={`p-2 rounded-lg ${telemetry.retentionRate >= 50 ? 'bg-accent' : 'bg-destructive/10'}`}>
              <AlertTriangle className={`h-5 w-5 ${telemetry.retentionRate >= 50 ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de retenção (30d)</p>
              <p className="text-xl font-bold mt-0.5">{telemetry.retentionRate}%</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="finance-card text-center">
            <p className="text-xs text-muted-foreground">Ativos hoje</p>
            <p className="text-2xl font-bold mt-1">{telemetry.activeToday}</p>
          </div>
          <div className="finance-card text-center">
            <p className="text-xs text-muted-foreground">Ativos na semana</p>
            <p className="text-2xl font-bold mt-1">{telemetry.activeWeek}</p>
          </div>
          <div className="finance-card text-center">
            <p className="text-xs text-muted-foreground">Ativos no mês</p>
            <p className="text-2xl font-bold mt-1">{telemetry.activeMonth}</p>
          </div>
        </div>
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
