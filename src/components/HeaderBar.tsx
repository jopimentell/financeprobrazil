import { MobileMenuDrawer } from './SidebarNavigation';
import { useFinance } from '@/contexts/FinanceContext';
import { Cloud, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function HeaderBar() {
  const { syncToSheet } = useFinance();
  const navigate = useNavigate();

  const handleSync = () => {
    syncToSheet();
    toast.success('Sincronização iniciada com a planilha');
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
        <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-accent transition-colors text-muted-foreground">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
