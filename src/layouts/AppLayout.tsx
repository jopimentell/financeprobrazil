import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarNavigation, MobileBottomNavigation } from '@/components/SidebarNavigation';
import { HeaderBar } from '@/components/HeaderBar';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarNavigation collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <HeaderBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
