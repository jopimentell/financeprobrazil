import { useState } from 'react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { ShieldAlert, Lock, X, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onSuccess: () => void;
}

export default function ImpersonationModal({ onSuccess }: Props) {
  const { pendingTarget, cancelRequest, confirmImpersonation, failedAttempts, isLocked, lockRemainingSeconds } = useImpersonation();
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!pendingTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const result = confirmImpersonation(password, reason);
      setLoading(false);

      if (result.success) {
        toast.success(`Impersonação iniciada para ${pendingTarget.name}`);
        setPassword('');
        setReason('');
        onSuccess();
      } else {
        setError(result.error || 'Erro ao confirmar');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={cancelRequest} />
      <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] flex flex-col animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Eye className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Impersonar Usuário</h2>
              <p className="text-xs text-muted-foreground">Confirmação de segurança obrigatória</p>
            </div>
          </div>
          <button onClick={cancelRequest} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-5 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Ação sensível de segurança</p>
              <p>Você está prestes a acessar a conta de <strong>{pendingTarget.name}</strong> ({pendingTarget.email}).
              Todas as ações serão registradas no sistema de auditoria.</p>
            </div>
          </div>
        </div>

        {/* Target info */}
        <div className="mx-5 mt-3 p-3 rounded-lg bg-accent/50">
          <p className="text-xs text-muted-foreground">Usuário alvo</p>
          <p className="text-sm font-semibold text-foreground">{pendingTarget.name}</p>
          <p className="text-xs text-muted-foreground">{pendingTarget.email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              <Lock className="h-3.5 w-3.5 inline mr-1" />
              Senha do Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Confirme sua senha"
              className="input-field w-full"
              required
              disabled={isLocked}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Suporte técnico - ticket #1234"
              className="input-field w-full resize-none"
              rows={2}
              disabled={isLocked}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {isLocked && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Bloqueado por {Math.ceil(lockRemainingSeconds / 60)} minuto(s)</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-muted-foreground">
              Sessão expira em 30 minutos
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={cancelRequest}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading || isLocked || !password}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Confirmar e entrar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
