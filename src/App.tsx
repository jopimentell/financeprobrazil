import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLogProvider } from "@/contexts/AdminLogContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { PlanProvider } from "@/contexts/PlanContext";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Receitas from "@/pages/Receitas";
import Despesas from "@/pages/Despesas";
import Categories from "@/pages/Categories";
import Accounts from "@/pages/Accounts";
import Debts from "@/pages/Debts";
import CreditCardsPage from "@/pages/CreditCards";
import Investments from "@/pages/Investments";
import ForecastPage from "@/pages/Forecast";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Planning from "@/pages/Planning";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminSecurityPage from "@/pages/admin/AdminSecurityPage";
import AdminLogsPage from "@/pages/admin/AdminLogsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminPlansPage from "@/pages/admin/AdminPlansPage";
import AdminCreatePage from "@/pages/admin/AdminCreatePage";
import AdminSubscriptionsPage from "@/pages/admin/AdminSubscriptionsPage";
import PlansPage from "@/pages/Plans";
import SubscriptionPage from "@/pages/Subscription";
import ProfilePage from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import Welcome from "@/pages/Welcome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PlanProvider>
          <FinanceProvider>
            <AdminLogProvider>
              <ImpersonationProvider>
              <Toaster />
              <Sonner />
              <ImpersonationBanner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Welcome />} />
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                  </Route>
                  {/* User financial routes */}
                  <Route element={<AppLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transacoes" element={<Transactions />} />
                    <Route path="/transacoes/nova" element={<Transactions />} />
                    <Route path="/receitas" element={<Receitas />} />
                    <Route path="/despesas" element={<Despesas />} />
                    <Route path="/planejamento" element={<Planning />} />
                    <Route path="/calendario" element={<Calendar />} />
                    <Route path="/categorias" element={<Categories />} />
                    <Route path="/contas" element={<Accounts />} />
                    <Route path="/dividas" element={<Debts />} />
                    <Route path="/cartoes" element={<CreditCardsPage />} />
                    <Route path="/investimentos" element={<Investments />} />
                    <Route path="/projecao" element={<ForecastPage />} />
                    <Route path="/relatorios" element={<Reports />} />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/account/subscription" element={<SubscriptionPage />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                  </Route>
                  {/* Admin routes */}
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
                    <Route path="/admin/admins/create" element={<AdminCreatePage />} />
                    <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                    <Route path="/admin/security" element={<AdminSecurityPage />} />
                    <Route path="/admin/logs" element={<AdminLogsPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/plans" element={<AdminPlansPage />} />
                    <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </ImpersonationProvider>
            </AdminLogProvider>
          </FinanceProvider>
        </PlanProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
