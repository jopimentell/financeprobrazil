import { MobileMenuDrawer } from './SidebarNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function HeaderBar() {
  const { syncToSheet } = useFinance();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSync = () => {
    syncToSheet();
    toast.success('Sincronização iniciada com a planilha');
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center gap-2 min-w-[48px]">
        <MobileMenuDrawer />
      </div>

      {/* Center: Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 md:static md:translate-x-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">F</span>
        </div>
        <span className="text-sm font-bold text-foreground hidden sm:block">FinancePro</span>
      </div>

      {/* Right: sync (desktop) + avatar */}
      <div className="flex items-center gap-2 min-w-[48px] justify-end">
        <button
          onClick={handleSync}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent hover:bg-accent/80 transition-colors text-accent-foreground"
        >
          <Cloud className="h-4 w-4" />
          <span>Sincronizar</span>
        </button>

        {user && (
          <button
            onClick={() => navigate('/perfil')}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </div>
    </header>
  );
}
