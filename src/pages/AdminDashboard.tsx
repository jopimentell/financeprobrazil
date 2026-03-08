import { useMemo, useState } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import {
  Users, UserPlus, ArrowLeftRight, TrendingUp, TrendingDown, Activity,
  Eye, Ban, Trash2, Shield, ShieldOff, ArrowUp, ArrowDown, CalendarDays
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { toast } from 'sonner';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function MetricCard({ title, value, icon: Icon, subtitle, trend, format = 'number' }: {
  title: string; value: number; icon: React.ElementType; subtitle?: string;
  trend?: { value: number; label: string }; format?: 'number' | 'currency';
}) {
  const formatted = format === 'currency'
    ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : value.toLocaleString('pt-BR');

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-primary" style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{formatted}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend.value >= 0
            ? <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
            : <ArrowDown className="h-3.5 w-3.5 text-red-500" />}
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
      {subtitle && !trend && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { users, isAdmin, toggleUserStatus, deleteUser } = useAuth();
  const { transactions } = useFinance();
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    const today = now.toISOString().split('T')[0];
    const activeThisMonth = users.filter(u => {
      const ll = new Date(u.lastLogin);
      return ll.getMonth() === currentMonth && ll.getFullYear() === currentYear && u.status === 'active';
    }).length;
    const todaySignups = users.filter(u => u.createdAt === today).length;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const thisMonthUsers = users.filter(u => {
      const d = new Date(u.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const lastMonthUsers = users.filter(u => {
      const d = new Date(u.createdAt);
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lm && d.getFullYear() === ly;
    }).length;
    const growth = lastMonthUsers > 0 ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : thisMonthUsers > 0 ? 100 : 0;

    return {
      total: users.length, activeThisMonth, todaySignups,
      totalTx: transactions.length, totalIncome, totalExpense,
      growth, thisMonthUsers
    };
  }, [users, transactions, currentMonth, currentYear]);

  const monthlyNewUsers = useMemo(() => {
    return MONTHS.map((name, i) => {
      const count = users.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      }).length;
      return { name, usuarios: count };
    });
  }, [users, currentYear]);

  const monthlyTransactions = useMemo(() => {
    return MONTHS.map((name, i) => {
      const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return {
        name,
        receitas: monthTx.filter(t => t.type === 'income').length,
        despesas: monthTx.filter(t => t.type === 'expense').length,
      };
    });
  }, [transactions, currentYear]);

  const cumulativeUsers = useMemo(() => {
    let acc = 0;
    return MONTHS.map((name, i) => {
      acc += users.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      }).length;
      return { name, total: acc };
    });
  }, [users, currentYear]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => filterStatus === 'all' || u.status === filterStatus);
  }, [users, filterStatus]);

  const handleToggleAdmin = (u: User) => {
    toast.error('Promoção de admin removida. Use /admin/admins/create.');
  };

  const handleToggleStatus = (u: User) => {
    toggleUserStatus(u.id);
    toast.success(u.status === 'active' ? 'Usuário bloqueado' : 'Usuário desbloqueado');
  };

  const handleDelete = (u: User) => {
    deleteUser(u.id);
    toast.success('Usuário excluído');
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: {
      background: 'hsl(0 0% 100%)',
      border: '1px solid hsl(220 13% 91%)',
      borderRadius: '8px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema e gestão de usuários</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total de Usuários" value={stats.total} icon={Users} subtitle={`${stats.activeThisMonth} ativos este mês`} />
        <MetricCard title="Usuários Ativos no Mês" value={stats.activeThisMonth} icon={Activity} subtitle="Com transações este mês" />
        <MetricCard title="Total de Transações" value={stats.totalTx} icon={ArrowLeftRight} subtitle="Receitas e despesas" />
        <MetricCard title="Cadastros Hoje" value={stats.todaySignups} icon={UserPlus} subtitle="Novos usuários" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Receita Total" value={stats.totalIncome} icon={TrendingUp} format="currency" />
        <MetricCard title="Despesas Totais" value={stats.totalExpense} icon={TrendingDown} format="currency" />
        <MetricCard
          title="Crescimento de Usuários"
          value={stats.thisMonthUsers}
          icon={CalendarDays}
          trend={{ value: stats.growth, label: 'vs mês anterior' }}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* New Users per Month */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-1">Novos Usuários por Mês</h3>
          <p className="text-xs text-muted-foreground mb-4">Cadastros mensais em {currentYear}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyNewUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="usuarios" name="Usuários" fill="hsl(221 83% 53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions per Month */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-1">Transações por Mês</h3>
          <p className="text-xs text-muted-foreground mb-4">Receitas vs Despesas em {currentYear}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyTransactions}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(0 84% 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative Growth */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-1">Crescimento da Base de Usuários</h3>
        <p className="text-xs text-muted-foreground mb-4">Acumulado em {currentYear}</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={cumulativeUsers}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="total" name="Total Usuários" stroke="hsl(221 83% 53%)" strokeWidth={2.5} fill="url(#colorTotal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* User Management */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Gestão de Usuários</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{users.length} usuários cadastrados</p>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm w-auto">
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nome</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Cadastro</th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Último Login</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Role</th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-2 font-medium">{u.name}</td>
                  <td className="py-3 px-2 hidden sm:table-cell text-muted-foreground">{u.email}</td>
                  <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">{new Date(u.lastLogin).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewUser(u)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></button>
                      <button onClick={() => handleToggleAdmin(u)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}>
                        {u.role === 'admin' ? <ShieldOff className="h-4 w-4 text-primary" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button onClick={() => handleToggleStatus(u)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title={u.status === 'active' ? 'Bloquear' : 'Desbloquear'}>
                        <Ban className={`h-4 w-4 ${u.status === 'active' ? 'text-muted-foreground' : 'text-red-500'}`} />
                      </button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Excluir"><Trash2 className="h-4 w-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setViewUser(null)} />
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-y-auto border border-border">
            <h2 className="text-lg font-bold mb-4">Perfil: {viewUser.name}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewUser.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${viewUser.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'}`}>
                  {viewUser.role === 'admin' ? 'Admin' : 'Usuário'}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cadastro</span><span>{new Date(viewUser.createdAt).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Último Login</span><span>{new Date(viewUser.lastLogin).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${viewUser.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                  {viewUser.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="border-t border-border pt-3 mt-3">
                <h3 className="font-medium mb-3">Resumo Financeiro</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-accent/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Transações</p>
                    <p className="text-lg font-bold">{transactions.length}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Receitas</p>
                    <p className="text-lg font-bold text-emerald-600">R$ {transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Despesas</p>
                    <p className="text-lg font-bold text-red-500">R$ {transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-lg font-bold text-primary">R$ {(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setViewUser(null)} className="w-full mt-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
