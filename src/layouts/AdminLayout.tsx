import { useState, useMemo } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, hasPermission, ROLE_LABELS, isAdminRole } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, BarChart3, ShieldAlert, ChevronLeft,
  LogOut, Menu, X, Shield, ScrollText, Settings, Crown, CreditCard
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<any>;
  permission?: string;
}

const allAdminNav: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Usuários', icon: Users, permission: 'view_users' },
  { path: '/admin/plans', label: 'Planos', icon: Crown, permission: 'manage_plans' },
  { path: '/admin/subscriptions', label: 'Assinaturas', icon: CreditCard, permission: 'manage_subscriptions' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, permission: 'view_analytics' },
  { path: '/admin/security', label: 'Segurança', icon: ShieldAlert, permission: 'view_security' },
  { path: '/admin/logs', label: 'Logs', icon: ScrollText, permission: 'view_logs' },
  { path: '/admin/settings', label: 'Configurações', icon: Settings, permission: 'manage_settings' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, realUser, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const myRole = realUser?.role || 'user';
  const adminNav = allAdminNav.filter(item => !item.permission || hasPermission(myRole, item.permission as any));

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
      {adminNav.map(item => {
        const active = location.pathname === item.path || (item.path === '/admin/users' && location.pathname.startsWith('/admin/users'));
        return (
          <Link key={item.path} to={item.path} onClick={onNavigate} title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
            <item.icon className="shrink-0" style={{ width: 18, height: 18 }} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen`}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
                <Shield className="h-4 w-4 text-destructive-foreground" />
              </div>
              <h1 className="text-base font-bold text-sidebar-foreground">Admin Panel</h1>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-muted transition-colors">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <NavContent />
        <div className="p-3 border-t border-sidebar-border">
          {!collapsed && (
            <div className="px-3 py-1.5 mb-2">
              <p className="text-xs text-sidebar-muted truncate">{realUser?.name}</p>
              <span className="text-[10px] text-sidebar-muted/70 uppercase tracking-wider">{ROLE_LABELS[myRole]}</span>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all w-full">
            <LogOut style={{ width: 18, height: 18 }} className="shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card p-4 animate-fade-in shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
                  <Shield className="h-4 w-4 text-destructive-foreground" />
                </div>
                <h2 className="text-base font-bold">Admin Panel</h2>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <NavContent onNavigate={() => setMobileOpen(false)} />
            <div className="pt-3 border-t border-border">
              <div className="px-3 py-1.5 mb-2">
                <p className="text-sm font-medium">{realUser?.name}</p>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{ROLE_LABELS[myRole]}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all w-full">
                <LogOut style={{ width: 18, height: 18 }} /><span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen w-full">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-accent"><Menu className="h-5 w-5" /></button>
            <span className="text-sm font-medium text-muted-foreground">Painel Administrativo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${myRole === 'owner' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {ROLE_LABELS[myRole]}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-destructive" />
              </div>
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate hidden sm:block">{realUser?.name}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
