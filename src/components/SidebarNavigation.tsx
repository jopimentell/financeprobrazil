import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CalendarDays, Tag, Wallet,
  CreditCard, TrendingUp, LineChart, FileBarChart, Target, Menu, X, ChevronLeft
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { path: '/planejamento', label: 'Planejamento', icon: Target },
  { path: '/calendario', label: 'Calendário', icon: CalendarDays },
  { path: '/categorias', label: 'Categorias', icon: Tag },
  { path: '/contas', label: 'Contas', icon: Wallet },
  { path: '/dividas', label: 'Dívidas', icon: CreditCard },
  { path: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { path: '/projecao', label: 'Projeção', icon: LineChart },
  { path: '/relatorios', label: 'Relatórios', icon: FileBarChart },
];

export function SidebarNavigation({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside className={`hidden md:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen`}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && <h1 className="text-lg font-bold text-sidebar-foreground">💰 FinancePro</h1>}
        <button onClick={onToggle} className="p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground">
          <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileBottomNavigation() {
  const location = useLocation();
  const mainItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around py-2">
        {mainItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileMenuDrawer() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-accent">
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">💰 FinancePro</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'}`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
