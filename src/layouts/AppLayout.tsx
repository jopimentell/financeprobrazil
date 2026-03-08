import { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { SidebarNavigation, MobileBottomNavigation } from '@/components/SidebarNavigation';
import { HeaderBar } from '@/components/HeaderBar';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { TransactionModal } from '@/components/TransactionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin, loading } = useAuth();
  const { isImpersonating } = useImpersonation();
  const [fabModal, setFabModal] = useState(false);
  const [fabType, setFabType] = useState<'income' | 'expense'>('expense');

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  // Admin users cannot access financial pages unless impersonating
  if (isAdmin && !isImpersonating) return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className={`flex min-h-screen w-full bg-background ${isImpersonating ? 'pt-[52px]' : ''}`}>
      <SidebarNavigation collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <HeaderBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNavigation />
      <FloatingActionButton
        onAddIncome={() => { setFabType('income'); setFabModal(true); }}
        onAddExpense={() => { setFabType('expense'); setFabModal(true); }}
      />
      <TransactionModal open={fabModal} onClose={() => setFabModal(false)} defaultType={fabType} />
    </div>
  );
}
