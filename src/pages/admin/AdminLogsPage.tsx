import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { SystemLog } from '@/types/finance';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ChevronLeft, ChevronRight, Filter, LogIn, LogOut, Plus, Trash2, Edit, UserPlus, Shield } from 'lucide-react';

const actionLabels: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  register: 'Cadastro',
  create_transaction: 'Criou transação',
  delete_transaction: 'Excluiu transação',
  update_transaction: 'Atualizou transação',
  create_category: 'Criou categoria',
  delete_category: 'Excluiu categoria',
  create_account: 'Criou conta',
  delete_account: 'Excluiu conta',
  create_debt: 'Criou dívida',
  delete_debt: 'Excluiu dívida',
  create_investment: 'Criou investimento',
  delete_investment: 'Excluiu investimento',
  admin_action: 'Ação admin',
};

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  logout: LogOut,
  register: UserPlus,
  create_transaction: Plus,
  delete_transaction: Trash2,
  update_transaction: Edit,
  create_category: Plus,
  delete_category: Trash2,
  create_account: Plus,
  delete_account: Trash2,
  admin_action: Shield,
};

export default function AdminLogsPage() {
  const { systemLogs } = useFinance();
  const { users } = useAuth();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const filtered = useMemo(() => {
    let logs = systemLogs;
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l => l.userName.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || l.action.toLowerCase().includes(q));
    }
    if (actionFilter !== 'all') logs = logs.filter(l => l.action === actionFilter);
    return logs;
  }, [systemLogs, search, actionFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const actionTypes = [...new Set(systemLogs.map(l => l.action))];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Logs do Sistema</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Total de eventos</p>
          <p className="text-2xl font-bold mt-1">{systemLogs.length}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Eventos hoje</p>
          <p className="text-2xl font-bold mt-1">{systemLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().split('T')[0])).length}</p>
        </div>
        <div className="finance-card">
          <p className="text-xs text-muted-foreground">Usuários únicos</p>
          <p className="text-2xl font-bold mt-1">{new Set(systemLogs.map(l => l.userId)).size}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar nos logs..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="input-field pl-9" />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="input-field w-full sm:w-48">
          <option value="all">Todos os eventos</option>
          {actionTypes.map(a => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
        </select>
      </div>

      <div className="finance-card p-0 overflow-hidden">
        {paginated.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhum log encontrado</p>
        ) : (
          <div className="divide-y divide-border">
            {paginated.map(log => {
              const Icon = actionIcons[log.action] || Filter;
              const userName = users.find(u => u.id === log.userId)?.name || log.userName;
              return (
                <div key={log.id} className="p-3 px-4 flex items-start gap-3 hover:bg-accent/30 transition-colors">
                  <div className="p-1.5 rounded-lg bg-accent shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-medium text-sm">{userName}</span>
                        <span className="text-sm text-muted-foreground"> — {actionLabels[log.action] || log.action}</span>
                        {log.details && <span className="text-sm text-muted-foreground">: {log.details}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {log.entity && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Entidade: {log.entity} {log.entityId && `(${log.entityId.substring(0, 8)}...)`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Página {page + 1} de {totalPages} ({filtered.length} logs)</span>
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
