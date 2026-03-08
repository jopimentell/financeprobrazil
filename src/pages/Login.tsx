import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, user, isAdmin } = useAuth();
  const initialMode = (searchParams.get('mode') as 'login' | 'register') || 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'register' || m === 'login') setMode(m);
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(isAdmin ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Preencha todos os campos'); return; }
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      toast.success('Login realizado com sucesso!');
      // Navigation handled by useEffect above
    } else {
      toast.error('Email ou senha incorretos');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) { toast.error('Preencha todos os campos'); return; }
    if (password.length < 8) { toast.error('Senha deve ter no mínimo 8 caracteres'); return; }
    if (password !== confirmPassword) { toast.error('Senhas não conferem'); return; }
    setSubmitting(true);
    const success = await register(name, email, password);
    setSubmitting(false);
    if (success) {
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      // Navigation handled by useEffect above once session is established
    } else {
      toast.error('Erro ao criar conta. Tente novamente.');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Digite seu email'); return; }
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast.success('Link de recuperação enviado para seu email');
    setMode('login');
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-6">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
          <span className="text-primary-foreground text-2xl font-bold">F</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">FinancePro</h1>
        <p className="text-muted-foreground text-sm">Gestão financeira inteligente</p>
      </div>

      <div className="finance-card">
        {mode === 'login' && (
          <>
            <h2 className="text-lg font-bold mb-5">Entrar</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Senha</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className="input-field pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <div className="flex justify-between mt-4">
              <button onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">Esqueci minha senha</button>
              <button onClick={() => setMode('register')} className="text-sm text-primary hover:underline">Criar conta</button>
            </div>
          </>
        )}

        {mode === 'register' && (
          <>
            <h2 className="text-lg font-bold mb-5">Criar Conta</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="input-field" placeholder="Seu nome completo" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field" placeholder="Mínimo 8 caracteres" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Confirmar Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field" placeholder="Repita a senha" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? 'Criando...' : 'Criar Conta'}
              </button>
            </form>
            <button onClick={() => setMode('login')} className="w-full mt-4 text-sm text-primary hover:underline">
              Já tem conta? Entrar
            </button>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h2 className="text-lg font-bold mb-5">Recuperar Senha</h2>
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="seu@email.com" />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Enviar link de recuperação
              </button>
            </form>
            <button onClick={() => setMode('login')} className="w-full mt-4 text-sm text-primary hover:underline">
              Voltar ao login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
