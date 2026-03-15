import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminLogs } from '@/contexts/AdminLogContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const adminSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(128),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export default function AdminCreatePage() {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin } = useAuth();
  const { addLog } = useAdminLogs();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!isAdmin) {
      toast.error('Apenas administradores podem criar novos admins');
      return;
    }

    const result = adminSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      // Call the secured edge function
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: {
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      addLog({
        adminId: currentUser!.id,
        adminName: currentUser!.name,
        action: 'criou administrador',
        targetUserId: data.user_id,
        targetUserName: form.name.trim(),
      });

      toast.success(`Administrador "${form.name.trim()}" criado com sucesso`);
      navigate('/admin/users');
    } catch (err: any) {
      console.error('Error creating admin:', err);
      if (err.message?.includes('Forbidden')) {
        toast.error('Você não tem permissão para criar administradores');
      } else if (err.message?.includes('already registered')) {
        setErrors({ email: 'Este email já está cadastrado' });
      } else {
        toast.error(err.message || 'Erro ao criar administrador');
      }
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
        <h1 className="text-2xl font-bold text-foreground">Novo Administrador</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo administrador do sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="finance-card space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">Nome completo</label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className="input-field mt-1"
            placeholder="Nome do administrador"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => handleChange('email', e.target.value)}
            className="input-field mt-1"
            placeholder="admin@exemplo.com"
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Senha</label>
          <div className="relative mt-1">
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              className="input-field pr-10"
              placeholder="Mínimo 6 caracteres"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Confirmar senha</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={e => handleChange('confirmPassword', e.target.value)}
            className="input-field mt-1"
            placeholder="Repita a senha"
          />
          {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Criando...' : 'Criar Administrador'}
          </button>
        </div>
      </form>

      <div className="finance-card bg-accent/30 border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Nota de segurança:</strong> O novo administrador será criado no Supabase Auth e terá acesso completo ao painel administrativo, incluindo gestão de usuários, logs e configurações.
        </p>
      </div>
    </div>
  );
}
