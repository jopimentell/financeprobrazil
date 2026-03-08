import { useImpersonation } from '@/contexts/ImpersonationContext';
import { ShieldAlert, X, Clock } from 'lucide-react';

export default function ImpersonationBanner() {
  const { isImpersonating, session, remainingTime, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !session) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const isLow = remainingTime <= 300; // 5 min warning

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-amber-500 text-amber-950 shadow-lg">
      <div className="max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1 rounded bg-amber-600/30 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              Você está acessando a conta de <strong>{session.userName}</strong> como administrador.
            </p>
            <p className="text-xs opacity-80">
              Todas as ações estão sendo registradas no sistema de auditoria.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-2 py-1 rounded ${isLow ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600/30'}`}>
            <Clock className="h-3 w-3" />
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950 text-amber-100 hover:bg-amber-900 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Encerrar impersonação
          </button>
        </div>
      </div>
    </div>
  );
}
