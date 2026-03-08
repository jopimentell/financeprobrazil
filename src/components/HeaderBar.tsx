import { MobileMenuDrawer } from './SidebarNavigation';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Cloud, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function HeaderBar() {
  const { syncToSheet } = useFinance();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSync = () => {
    syncToSheet();
    toast.success('Sincronização iniciada com a planilha');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <MobileMenuDrawer />
        <span className="text-sm font-medium text-muted-foreground hidden sm:block">Finance Manager Pro</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleSync} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent hover:bg-accent/80 transition-colors text-accent-foreground">
          <Cloud className="h-4 w-4" />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
