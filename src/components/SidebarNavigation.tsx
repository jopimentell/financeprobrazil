import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, CalendarDays, Tag, Wallet,
  CreditCard, TrendingUp, LineChart, FileBarChart, Target, Menu, X, ChevronLeft,
  ArrowDownCircle, ArrowUpCircle, Crown
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transacoes', label: 'Transações', icon: ArrowLeftRight },
  { path: '/receitas', label: 'Receitas', icon: ArrowDownCircle },
  { path: '/despesas', label: 'Despesas', icon: ArrowUpCircle },
  { path: '/categorias', label: 'Categorias', icon: Tag },
  { path: '/contas', label: 'Contas', icon: Wallet },
  { path: '/dividas', label: 'Dívidas', icon: CreditCard },
  { path: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { path: '/planejamento', label: 'Planejamento', icon: Target },
  { path: '/calendario', label: 'Calendário', icon: CalendarDays },
  { path: '/projecao', label: 'Projeção', icon: LineChart },
  { path: '/relatorios', label: 'Relatórios', icon: FileBarChart },
  { path: '/plans', label: 'Planos', icon: Crown },
];

export function SidebarNavigation({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen`}>
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">F</span>
            </div>
            <h1 className="text-base font-bold text-sidebar-foreground">FinancePro</h1>
          </div>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-muted transition-colors">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" style={{ width: 18, height: 18 }} />
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex justify-around py-2">
        {mainItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-[56px]">{item.label}</span>
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
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card p-4 animate-fade-in shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">F</span>
                </div>
                <h2 className="text-base font-bold">FinancePro</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <nav className="space-y-0.5">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                  >
                    <item.icon style={{ width: 18, height: 18 }} />
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
