import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, Lock, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FlaggedUser {
  id: string;
  name: string;
  email: string;
  alerts: string[];
  riskLevel: 'high' | 'medium';
  txCount: number;
  totalVolume: number;
}

export default function AdminSecurityPage() {
  const { users, user: currentUser, toggleUserStatus } = useAuth();
  const { transactions } = useFinance();
  const { logs, addLog } = useAdminLogs();
  const navigate = useNavigate();

  const regularUsers = useMemo(() => users.filter(u => u.role === 'user'), [users]);

  // Detect suspicious activity (simulated heuristics)
  const flaggedUsers: FlaggedUser[] = useMemo(() => {
    return regularUsers.map(u => {
      const alerts: string[] = [];
      // Mock: simulate suspicious patterns
      const txCount = transactions.length; // shared pool
      const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);

      if (txCount > 50) alerts.push(`${txCount} transações registradas`);
      if (totalVolume > 100000) alerts.push(`Volume movimentado: R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

      // Simulate: random users flagged for demo
      if (u.id === 'user-3') {
        alerts.push('Padrão de atividade incomum');
        alerts.push('Múltiplas tentativas de login');
      }

      if (alerts.length === 0) return null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        alerts,
        riskLevel: alerts.length >= 2 ? 'high' as const : 'medium' as const,
        txCount,
        totalVolume,
      };
    }).filter(Boolean) as FlaggedUser[];
  }, [regularUsers, transactions]);

  const handleBlock = (user: FlaggedUser) => {
    toggleUserStatus(user.id);
    addLog({ adminId: currentUser!.id, adminName: currentUser!.name, action: 'bloqueou usuário (segurança)', targetUserId: user.id, targetUserName: user.name });
    toast.success('Usuário bloqueado por segurança');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Segurança & Detecção de Fraude</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="finance-card flex items-start gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Usuários sinalizados</p>
            <p className="text-2xl font-bold mt-0.5">{flaggedUsers.length}</p>
          </div>
        </div>
        <div className="finance-card flex items-start gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Risco alto</p>
            <p className="text-2xl font-bold mt-0.5">{flaggedUsers.filter(u => u.riskLevel === 'high').length}</p>
          </div>
        </div>
        <div className="finance-card flex items-start gap-3">
          <div className="p-2 rounded-lg bg-accent">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ações administrativas</p>
            <p className="text-2xl font-bold mt-0.5">{logs.length}</p>
          </div>
        </div>
      </div>

      {/* Flagged users */}
      <div className="finance-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Usuários Suspeitos
          </h3>
        </div>
        {flaggedUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma atividade suspeita detectada</p>
        ) : (
          <div className="divide-y divide-border">
            {flaggedUsers.map(u => (
              <div key={u.id} className="p-4 hover:bg-accent/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.name}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${u.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.riskLevel === 'high' ? 'Alto risco' : 'Médio risco'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="mt-2 space-y-1">
                      {u.alerts.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate(`/admin/users/${u.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-accent hover:bg-accent/80 transition-colors">
                      <Eye className="h-4 w-4" /> Ver perfil
                    </button>
                    <button onClick={() => handleBlock(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
                      <Lock className="h-4 w-4" /> Bloquear
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin action logs */}
      <div className="finance-card p-0 overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Logs de Ações Administrativas
          </h3>
        </div>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma ação registrada</p>
        ) : (
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {logs.slice(0, 50).map(log => (
              <div key={log.id} className="p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                <div>
                  <span className="font-medium">{log.adminName}</span>
                  <span className="text-muted-foreground"> {log.action} </span>
                  {log.targetUserName && <span className="font-medium">{log.targetUserName}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
