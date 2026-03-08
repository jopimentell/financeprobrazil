import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getCreatableRoles, ROLE_LABELS, UserRole } from '@/contexts/AuthContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const adminSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
  confirmPassword: z.string(),
  role: z.enum(['support', 'admin']),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export default function AdminCreatePage() {
  const navigate = useNavigate();
  const { users, realUser } = useAuth();
  const { addLog } = useAdminLogs();

  const currentUser = realUser;
  const creatableRoles = getCreatableRoles(currentUser?.role || 'user');

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: creatableRoles[0] || 'support' as string });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (creatableRoles.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
        <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <p className="text-center text-muted-foreground py-12">Você não tem permissão para criar administradores.</p>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = adminSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!creatableRoles.includes(form.role as UserRole)) {
      setErrors({ role: 'Você não tem permissão para criar este tipo de conta' });
      return;
    }

    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setErrors({ email: 'Este email já está cadastrado' });
      return;
    }

    setLoading(true);
    try {
      const USERS_KEY = 'finance_users';
      const PASSWORDS_KEY = 'finance_passwords';
      const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      const storedPasswords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');

      const newStaff = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role as UserRole,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: '—',
        status: 'active' as const,
      };

      storedUsers.push(newStaff);
      storedPasswords[newStaff.email] = form.password;
      localStorage.setItem(USERS_KEY, JSON.stringify(storedUsers));
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(storedPasswords));
      window.dispatchEvent(new Event('admin-user-created'));

      addLog({
        adminId: currentUser!.id,
        adminName: currentUser!.name,
        action: `criou ${ROLE_LABELS[form.role as UserRole]}`,
        targetUserId: newStaff.id,
        targetUserName: newStaff.name,
      });

      toast.success(`${ROLE_LABELS[form.role as UserRole]} "${newStaff.name}" criado com sucesso`);
      navigate('/admin/users');
    } catch {
      toast.error('Erro ao criar conta');
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
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Novo Staff</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo membro da equipe administrativa</p>
      </div>

      <form onSubmit={handleSubmit} className="finance-card space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Nome completo</label>
          <input type="text" value={form.name} onChange={e => handleChange('name', e.target.value)} className="input-field mt-1" placeholder="Nome" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="input-field mt-1" placeholder="email@exemplo.com" />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Role</label>
          <select value={form.role} onChange={e => handleChange('role', e.target.value)} className="input-field mt-1">
            {creatableRoles.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {errors.role && <p className="text-xs text-destructive mt-1">{errors.role}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {form.role === 'support' && 'Support: pode visualizar usuários e usar impersonate para suporte.'}
            {form.role === 'admin' && 'Admin: pode gerenciar usuários, bloquear, analytics e impersonate.'}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Senha</label>
          <div className="relative mt-1">
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => handleChange('password', e.target.value)} className="input-field pr-10" placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Confirmar senha</label>
          <input type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} className="input-field mt-1" placeholder="Repita a senha" />
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={() => navigate('/admin/users')} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
            <UserPlus className="h-4 w-4" /> {loading ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </form>

      <div className="finance-card bg-accent/30 border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Nota de segurança:</strong> Membros da equipe administrativa não possuem conta financeira. Suas permissões dependem do role atribuído.
        </p>
      </div>
    </div>
  );
}
