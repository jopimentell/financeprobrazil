import { useState, useMemo } from 'react';
import { useAuth, User, canModifyUser, canImpersonate, hasPermission, ROLE_LABELS, ROLE_COLORS, UserRole } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import ImpersonationModal from '@/components/ImpersonationModal';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Lock, Unlock, Trash2, Eye, ArrowUpDown, UserCheck, Shield, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

type SortKey = 'name' | 'createdAt' | 'transactions';
type SortDir = 'asc' | 'desc';
type RoleFilter = 'all' | UserRole;
type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminUsersPage() {
  const { users, realUser, toggleUserStatus, deleteUser } = useAuth();
  const { getUserTransactions } = useFinance();
  const { addLog } = useAdminLogs();
  const { requestImpersonation, pendingTarget } = useImpersonation();
  const navigate = useNavigate();

  const currentUser = realUser;
  const myRole = currentUser?.role || 'user';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const getUserTxCount = (userId: string) => getUserTransactions(userId).length;

  const filtered = useMemo(() => {
    let list = [...users];
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') list = list.filter(u => u.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'createdAt') cmp = a.createdAt.localeCompare(b.createdAt);
      else cmp = getUserTxCount(a.id) - getUserTxCount(b.id);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [users, roleFilter, statusFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleBlock = (u: User) => {
    if (!currentUser) return;
    const check = canModifyUser(currentUser, u);
    if (!check.allowed) { toast.error(check.error); return; }
    toggleUserStatus(u.id);
    const action = u.status === 'active' ? 'bloqueou' : 'desbloqueou';
    addLog({ adminId: currentUser.id, adminName: currentUser.name, action: `${action} ${ROLE_LABELS[u.role]}`, targetUserId: u.id, targetUserName: u.name });
    toast.success(`${ROLE_LABELS[u.role]} ${u.status === 'active' ? 'desativado' : 'reativado'}`);
  };

  const handleDelete = (u: User) => {
    if (!currentUser) return;
    const check = canModifyUser(currentUser, u);
    if (!check.allowed) { toast.error(check.error); return; }
    deleteUser(u.id);
    addLog({ adminId: currentUser.id, adminName: currentUser.name, action: `excluiu ${ROLE_LABELS[u.role]}`, targetUserId: u.id, targetUserName: u.name });
    toast.success('Usuário excluído');
  };

  const handleImpersonate = (u: User) => {
    if (!currentUser) return;
    if (!canImpersonate(currentUser, u)) {
      toast.error('Não é possível impersonar este usuário');
      return;
    }
    requestImpersonation(u);
  };

  const canCreate = hasPermission(myRole, 'create_staff');
  const canBlock = hasPermission(myRole, 'block_users');

  return (
    <div className="space-y-6 animate-fade-in">
      {pendingTarget && <ImpersonationModal onSuccess={() => navigate('/dashboard')} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        {canCreate && (
          <Link to="/admin/admins/create" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <UserPlus className="h-4 w-4" /> Novo Staff
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="input-field pl-9" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value as RoleFilter); setPage(0); }} className="input-field w-full sm:w-40">
          <option value="all">Todos os tipos</option>
          <option value="user">Usuários</option>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as StatusFilter); setPage(0); }} className="input-field w-full sm:w-40">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Bloqueados</option>
        </select>
      </div>

      <div className="finance-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-foreground">Nome <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-foreground">Cadastro <ArrowUpDown className="h-3 w-3" /></button>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Último acesso</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => {
                const isSelf = u.id === currentUser?.id;
                const canMod = currentUser ? canModifyUser(currentUser, u).allowed : false;
                const canImp = currentUser ? canImpersonate(currentUser, u) : false;

                return (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        {u.name}
                        {isSelf && <span className="text-xs text-muted-foreground">(você)</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {(u.role === 'admin' || u.role === 'owner') && <Shield className="h-3 w-3" />}
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{u.lastLogin}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-0.5">
                        <button onClick={() => navigate(`/admin/users/${u.id}`)} className="p-1.5 rounded hover:bg-accent" title="Ver perfil">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {canImp && (
                          <button onClick={() => handleImpersonate(u)} className="p-1.5 rounded hover:bg-accent" title="Impersonar">
                            <UserCheck className="h-4 w-4 text-amber-500" />
                          </button>
                        )}
                        {canBlock && canMod && (
                          <button onClick={() => handleBlock(u)} className="p-1.5 rounded hover:bg-accent" title={u.status === 'active' ? 'Desativar' : 'Reativar'}>
                            {u.status === 'active' ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Unlock className="h-4 w-4 text-primary" />}
                          </button>
                        )}
                        {canMod && u.role === 'user' && (
                          <button onClick={() => handleDelete(u)} className="p-1.5 rounded hover:bg-accent" title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages} ({filtered.length} registros)</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1.5 rounded hover:bg-accent disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1.5 rounded hover:bg-accent disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
