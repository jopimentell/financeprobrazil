import { useState } from 'react';
import { useAuth, hasActiveOwner } from '@/contexts/AuthContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const EMERGENCY_CODE = 'RECOVER-2026';

const schema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  code: z.string().min(1, 'Código de verificação obrigatório'),
});

export default function AdminEmergencyAccessPage() {
  const { users, login, refreshUsers } = useAuth();
  const { addLog } = useAdminLogs();
  const navigate = useNavigate();

  const ownerExists = hasActiveOwner(users);

  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (ownerExists) {
      toast.error('O sistema já possui um Owner ativo. Emergency Access não é necessário.');
      return;
    }

    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (form.code !== EMERGENCY_CODE) {
      setErrors({ code: 'Código de verificação inválido' });
      return;
    }

    setLoading(true);
    try {
      // Validate credentials
      const PASSWORDS_KEY = 'finance_passwords';
      const passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
      if (passwords[form.email] !== form.password) {
        setErrors({ email: 'Credenciais inválidas' });
        setLoading(false);
        return;
      }

      const USERS_KEY = 'finance_users';
      const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const targetUser = storedUsers.find((u: any) => u.email === form.email);
      if (!targetUser) {
        setErrors({ email: 'Usuário não encontrado' });
        setLoading(false);
        return;
      }

      // Promote to owner
      targetUser.role = 'owner';
      targetUser.isProtectedOwner = true;
      targetUser.status = 'active';
      localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
      window.dispatchEvent(new Event('admin-user-created'));

      addLog({
        adminId: targetUser.id,
        adminName: targetUser.name,
        action: 'Emergency Access utilizado — promovido a Owner protegido',
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
      });

      toast.success('Acesso de emergência executado. Faça login novamente.');
      refreshUsers();
      navigate('/login');
    } catch {
      toast.error('Erro ao processar Emergency Access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Emergency Access</h1>
          <p className="text-sm text-muted-foreground">Recuperação de acesso administrativo</p>
        </div>

        {ownerExists ? (
          <div className="finance-card border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Acesso Bloqueado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O sistema já possui um Owner ativo. Emergency Access só pode ser utilizado quando não há nenhum Owner ativo no sistema.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="finance-card border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700">Atenção</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta ação promoverá o usuário informado para Owner protegido do sistema. Use somente em caso de perda total de acesso administrativo.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="finance-card space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="input-field mt-1" placeholder="email@exemplo.com" />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Senha</label>
                <input type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} className="input-field mt-1" placeholder="Sua senha atual" />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Código de Verificação
                </label>
                <input type="text" value={form.code} onChange={e => handleChange('code', e.target.value)} className="input-field mt-1" placeholder="Código de emergência" />
                {errors.code && <p className="text-xs text-destructive mt-1">{errors.code}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
                <ShieldAlert className="h-4 w-4" /> {loading ? 'Processando...' : 'Executar Emergency Access'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Voltar ao login</a>
        </p>
      </div>
    </div>
  );
}
