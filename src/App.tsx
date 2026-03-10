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
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import ResetPassword from "@/pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
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
                      <Route path="/reset-password" element={<ResetPassword />} />
                    </Route>
                    {/* User financial routes */}
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                      <Route path="/transacoes" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
                      <Route path="/transacoes/nova" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
                      <Route path="/receitas" element={<ErrorBoundary><Receitas /></ErrorBoundary>} />
                      <Route path="/despesas" element={<ErrorBoundary><Despesas /></ErrorBoundary>} />
                      <Route path="/planejamento" element={<ErrorBoundary><Planning /></ErrorBoundary>} />
                      <Route path="/calendario" element={<ErrorBoundary><Calendar /></ErrorBoundary>} />
                      <Route path="/categorias" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
                      <Route path="/contas" element={<ErrorBoundary><Accounts /></ErrorBoundary>} />
                      <Route path="/dividas" element={<ErrorBoundary><Debts /></ErrorBoundary>} />
                      <Route path="/cartoes" element={<ErrorBoundary><CreditCardsPage /></ErrorBoundary>} />
                      <Route path="/investimentos" element={<ErrorBoundary><Investments /></ErrorBoundary>} />
                      <Route path="/projecao" element={<ErrorBoundary><ForecastPage /></ErrorBoundary>} />
                      <Route path="/relatorios" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
                      <Route path="/plans" element={<ErrorBoundary><PlansPage /></ErrorBoundary>} />
                      <Route path="/account/subscription" element={<ErrorBoundary><SubscriptionPage /></ErrorBoundary>} />
                      <Route path="/perfil" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                    </Route>
                    {/* Admin routes */}
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="/admin/dashboard" element={<ErrorBoundary><AdminDashboardPage /></ErrorBoundary>} />
                      <Route path="/admin/users" element={<ErrorBoundary><AdminUsersPage /></ErrorBoundary>} />
                      <Route path="/admin/users/:id" element={<ErrorBoundary><AdminUserDetailPage /></ErrorBoundary>} />
                      <Route path="/admin/admins/create" element={<ErrorBoundary><AdminCreatePage /></ErrorBoundary>} />
                      <Route path="/admin/analytics" element={<ErrorBoundary><AdminAnalyticsPage /></ErrorBoundary>} />
                      <Route path="/admin/security" element={<ErrorBoundary><AdminSecurityPage /></ErrorBoundary>} />
                      <Route path="/admin/logs" element={<ErrorBoundary><AdminLogsPage /></ErrorBoundary>} />
                      <Route path="/admin/settings" element={<ErrorBoundary><AdminSettingsPage /></ErrorBoundary>} />
                      <Route path="/admin/plans" element={<ErrorBoundary><AdminPlansPage /></ErrorBoundary>} />
                      <Route path="/admin/subscriptions" element={<ErrorBoundary><AdminSubscriptionsPage /></ErrorBoundary>} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                </ImpersonationProvider>
              </AdminLogProvider>
            </FinanceProvider>
          </PlanProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
