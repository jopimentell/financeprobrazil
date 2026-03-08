import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Welcome() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // If already logged in, skip to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Splash timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (user) return null;

  // Splash Screen
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50">
        <div className="animate-scale-in flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground text-4xl font-bold">F</span>
          </div>
          <h1 className="text-primary-foreground text-3xl font-bold tracking-tight">FinancePro</h1>
          <div className="mt-8 w-8 h-8 border-3 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Welcome Screen
  return (
    <div className="fixed inset-0 bg-background flex flex-col animate-fade-in">
      {/* Top section with logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
          <span className="text-primary-foreground text-3xl font-bold">F</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center leading-tight mb-4">
          Controle suas finanças com simplicidade
        </h1>
        <p className="text-muted-foreground text-center text-base md:text-lg max-w-md leading-relaxed">
          Organize receitas, despesas, cartões e planeje seu futuro financeiro.
        </p>
      </div>

      {/* Bottom section with buttons */}
      <div className="px-6 pb-10 pt-4 w-full max-w-md mx-auto space-y-3">
        <button
          onClick={() => navigate('/login?mode=register')}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity shadow-md"
        >
          Criar conta
        </button>
        <button
          onClick={() => navigate('/login?mode=login')}
          className="w-full py-4 rounded-2xl border border-border bg-card text-foreground font-semibold text-base hover:bg-accent transition-colors"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
