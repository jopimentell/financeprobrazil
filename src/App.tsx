import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import Receitas from "@/pages/Receitas";
import Despesas from "@/pages/Despesas";
import Categories from "@/pages/Categories";
import Accounts from "@/pages/Accounts";
import Debts from "@/pages/Debts";
import Investments from "@/pages/Investments";
import ForecastPage from "@/pages/Forecast";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Planning from "@/pages/Planning";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FinanceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
              </Route>
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
                <Route path="/investimentos" element={<Investments />} />
                <Route path="/projecao" element={<ForecastPage />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
