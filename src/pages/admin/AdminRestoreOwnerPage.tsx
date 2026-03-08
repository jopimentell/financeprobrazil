import { useState } from 'react';
import { useAuth, hasPermission, ROLE_LABELS } from '@/contexts/AuthContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminRestoreOwnerPage() {
  const { users, realUser, changeUserRole } = useAuth();
  const { addLog } = useAdminLogs();
  const navigate = useNavigate();

  const currentUser = realUser;
  const canRestore = hasPermission(currentUser?.role || 'user', 'restore_owner');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!canRestore) {
    return (
      <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
        <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <p className="text-center text-muted-foreground py-12">Apenas Owners podem restaurar o role de Owner.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const target = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!target) {
      toast.error('Usuário não encontrado com este email.');
      return;
    }

    if (target.role === 'owner') {
      toast.error('Este usuário já é Owner.');
      return;
    }

    setLoading(true);
    try {
      const oldRole = target.role;
      const success = changeUserRole(target.id, 'owner');
      if (!success) {
        toast.error('Não foi possível alterar o role.');
        return;
      }

      addLog({
        adminId: currentUser.id,
        adminName: currentUser.name,
        action: `restaurou ${target.name} de ${ROLE_LABELS[oldRole]} para Owner`,
        targetUserId: target.id,
        targetUserName: target.name,
      });

      toast.success(`${target.name} promovido a Owner com sucesso.`);
      setEmail('');
    } catch {
      toast.error('Erro ao restaurar Owner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para lista
      </button>

      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <Crown className="h-6 w-6 text-amber-700" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Restaurar Owner</h1>
        <p className="text-sm text-muted-foreground">Promova um usuário existente para Owner</p>
      </div>

      <form onSubmit={handleSubmit} className="finance-card space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Email do usuário</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-9" placeholder="email@exemplo.com" required />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={() => navigate('/admin/users')} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <Crown className="h-4 w-4" /> {loading ? 'Restaurando...' : 'Restaurar Owner'}
          </button>
        </div>
      </form>

      <div className="finance-card bg-accent/30 border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Nota de segurança:</strong> Esta ação será registrada nos logs administrativos. Apenas Owners podem promover outros usuários a Owner.
        </p>
      </div>
    </div>
  );
}
