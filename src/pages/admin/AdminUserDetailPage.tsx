import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { ArrowLeft, Lock, Unlock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, user: currentUser, toggleUserStatus, deleteUser } = useAuth();
  const { transactions, getCategoryName } = useFinance();
  const { addLog } = useAdminLogs();

  const targetUser = users.find(u => u.id === id);

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Mock: all transactions belong to this user in the demo
  const userTransactions = useMemo(() => {
    let txs = transactions;
    if (typeFilter !== 'all') txs = txs.filter(t => t.type === typeFilter);
    return txs;
  }, [transactions, typeFilter]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const totalPages = Math.ceil(userTransactions.length / pageSize);
  const paginated = userTransactions.slice(page * pageSize, (page + 1) * pageSize);

  if (!targetUser) {
    return (
      <div className="space-y-4 animate-fade-in">
        <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <p className="text-center text-muted-foreground py-12">Usuário não encontrado</p>
      </div>
    );
  }

  const handleBlock = () => {
    toggleUserStatus(targetUser.id);
    const action = targetUser.status === 'active' ? 'bloqueou' : 'desbloqueou';
    addLog({ adminId: currentUser!.id, adminName: currentUser!.name, action: `${action} usuário`, targetUserId: targetUser.id, targetUserName: targetUser.name });
    toast.success(`Usuário ${targetUser.status === 'active' ? 'bloqueado' : 'desbloqueado'}`);
  };

  const handleDelete = () => {
    deleteUser(targetUser.id);
    addLog({ adminId: currentUser!.id, adminName: currentUser!.name, action: 'excluiu usuário', targetUserId: targetUser.id, targetUserName: targetUser.name });
    toast.success('Usuário excluído');
    navigate('/admin/users');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para lista
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{targetUser.name}</h1>
          <p className="text-muted-foreground text-sm">{targetUser.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBlock}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${targetUser.status === 'active' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            {targetUser.status === 'active' ? <><Lock className="h-4 w-4" /> Bloquear</> : <><Unlock className="h-4 w-4" /> Desbloquear</>}
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Status</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${targetUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {targetUser.status === 'active' ? 'Ativo' : 'Bloqueado'}
          </span>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Cadastro</p>
          <p className="text-lg font-bold mt-0.5">{new Date(targetUser.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Último login</p>
          <p className="text-lg font-bold mt-0.5">{targetUser.lastLogin}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Total de transações</p>
          <p className="text-lg font-bold mt-0.5">{transactions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Total Receitas</p>
          <p className="text-xl font-bold finance-income mt-0.5">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Total Despesas</p>
          <p className="text-xl font-bold finance-expense mt-0.5">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Saldo</p>
          <p className={`text-xl font-bold mt-0.5 ${balance >= 0 ? 'finance-income' : 'finance-expense'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="finance-card p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Histórico de Transações</h3>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as any); setPage(0); }}
            className="input-field w-auto text-xs py-1 px-2">
            <option value="all">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Valor</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 font-medium">{t.description}</td>
                  <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{getCategoryName(t.categoryId)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${t.type === 'income' ? 'finance-income' : 'finance-expense'}`}>
                    {t.type === 'income' ? '+' : '-'}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma transação</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1.5 rounded hover:bg-accent disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1.5 rounded hover:bg-accent disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
