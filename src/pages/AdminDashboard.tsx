import { useMemo, useState } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { FinanceMetricCard } from '@/components/FinanceMetricCard';
import { Users, UserPlus, ArrowLeftRight, TrendingUp, TrendingDown, Activity, Eye, Ban, Trash2, Shield, ShieldOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { users, updateUserRole, toggleUserStatus, deleteUser } = useAuth();
  const { transactions } = useFinance();
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().getMonth();
    const activeUsers = users.filter(u => u.status === 'active').length;
    const todaySignups = users.filter(u => u.createdAt === today).length;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { total: users.length, active: activeUsers, todaySignups, totalTx: transactions.length, totalIncome, totalExpense };
  }, [users, transactions]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((name, i) => {
      const newUsers = users.filter(u => new Date(u.createdAt).getMonth() === i).length;
      const monthTx = transactions.filter(t => new Date(t.date).getMonth() === i).length;
      return { name, usuarios: newUsers, transacoes: monthTx };
    });
  }, [users, transactions]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => filterStatus === 'all' || u.status === filterStatus);
  }, [users, filterStatus]);

  const handleToggleAdmin = (u: User) => {
    updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin');
    toast.success(u.role === 'admin' ? 'Permissão de admin removida' : 'Usuário promovido a admin');
  };

  const handleToggleStatus = (u: User) => {
    toggleUserStatus(u.id);
    toast.success(u.status === 'active' ? 'Usuário bloqueado' : 'Usuário desbloqueado');
  };

  const handleDelete = (u: User) => {
    deleteUser(u.id);
    toast.success('Usuário excluído');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Painel Administrativo</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <FinanceMetricCard title="Total de Usuários" value={stats.total} icon={Users} type="info" isCurrency={false} />
        <FinanceMetricCard title="Usuários Ativos" value={stats.active} icon={Activity} type="income" isCurrency={false} />
        <FinanceMetricCard title="Cadastros Hoje" value={stats.todaySignups} icon={UserPlus} type="info" isCurrency={false} />
        <FinanceMetricCard title="Total Transações" value={stats.totalTx} icon={ArrowLeftRight} type="info" isCurrency={false} />
        <FinanceMetricCard title="Receitas Totais" value={stats.totalIncome} icon={TrendingUp} type="income" />
        <FinanceMetricCard title="Despesas Totais" value={stats.totalExpense} icon={TrendingDown} type="expense" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Novos Usuários por Mês</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="usuarios" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Transações por Mês</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="transacoes" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Management */}
      <div className="finance-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Gestão de Usuários</h3>
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
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'}`}>
                      {u.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-finance-income/10 finance-income' : 'bg-finance-expense/10 finance-expense'}`}>
                      {u.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewUser(u)} className="p-1.5 rounded hover:bg-accent" title="Visualizar"><Eye className="h-4 w-4 text-muted-foreground" /></button>
                      <button onClick={() => handleToggleAdmin(u)} className="p-1.5 rounded hover:bg-accent" title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}>
                        {u.role === 'admin' ? <ShieldOff className="h-4 w-4 text-primary" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <button onClick={() => handleToggleStatus(u)} className="p-1.5 rounded hover:bg-accent" title={u.status === 'active' ? 'Bloquear' : 'Desbloquear'}>
                        <Ban className={`h-4 w-4 ${u.status === 'active' ? 'text-muted-foreground' : 'finance-expense'}`} />
                      </button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 rounded hover:bg-accent" title="Excluir"><Trash2 className="h-4 w-4 finance-expense" /></button>
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
          <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg p-6 animate-scale-in max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Perfil: {viewUser.name}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{viewUser.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span>{viewUser.role}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cadastro</span><span>{new Date(viewUser.createdAt).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Último Login</span><span>{new Date(viewUser.lastLogin).toLocaleDateString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{viewUser.status === 'active' ? 'Ativo' : 'Inativo'}</span></div>
              <div className="border-t border-border pt-3 mt-3">
                <h3 className="font-medium mb-2">Resumo Financeiro (dados globais)</h3>
                <div className="flex justify-between"><span className="text-muted-foreground">Transações</span><span>{transactions.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Receitas</span><span className="finance-income">R$ {transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Despesas</span><span className="finance-expense">R$ {transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>
            <button onClick={() => setViewUser(null)} className="w-full mt-5 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
