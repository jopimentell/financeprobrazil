import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { FinanceMetricCard } from '@/components/FinanceMetricCard';
import { CashFlowChart } from '@/components/CashFlowChart';
import { ExpenseCategoryChart } from '@/components/ExpenseCategoryChart';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { EmptyState } from '@/components/EmptyState';
import { DashboardSortableCard } from '@/components/DashboardSortableCard';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, BarChart3, CalendarClock } from 'lucide-react';
import { Transaction } from '@/types/finance';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const DEFAULT_LAYOUT = ['metrics', 'forecast-installments', 'charts', 'pending', 'annual-table', 'recent-transactions'];

function loadLayout(userId: string): string[] {
  try {
    const stored = localStorage.getItem(`dashboard_layout_${userId}`);
    return stored ? JSON.parse(stored) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function saveLayout(userId: string, layout: string[]) {
  localStorage.setItem(`dashboard_layout_${userId}`, JSON.stringify(layout));
}

export default function Dashboard() {
  const now = new Date();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMonthTransactions, getYearTransactions, transactions: allUserTx } = useFinance();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [annualView, setAnnualView] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);

  useEffect(() => {
    if (user?.id) setLayout(loadLayout(user.id));
  }, [user?.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const monthTx = useMemo(() => getMonthTransactions(year, month), [getMonthTransactions, year, month]);
  const yearTx = useMemo(() => getYearTransactions(year), [getYearTransactions, year]);

  // Previous month for trend calculation
  const prevMonthIdx = month === 0 ? 11 : month - 1;
  const prevYearIdx = month === 0 ? year - 1 : year;
  const prevMonthTx = useMemo(() => getMonthTransactions(prevYearIdx, prevMonthIdx), [getMonthTransactions, prevYearIdx, prevMonthIdx]);

  const currentTx = annualView ? yearTx : monthTx;
  const income = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const prevIncome = prevMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const incomeTrend = !annualView && prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : null;
  const expenseTrend = !annualView && prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : null;

  const pendingTx = monthTx.filter(t => t.status === 'pending').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Future installment expenses (parcelas futuras)
  const futureInstallments = useMemo(() => {
    const now = new Date();
    const currentMonthKey = now.getFullYear() * 12 + now.getMonth();
    return allUserTx.filter(tx => {
      if (tx.origin !== 'parcelamento') return false;
      const txDate = new Date(tx.date);
      const txMonthKey = txDate.getFullYear() * 12 + txDate.getMonth();
      return txMonthKey > currentMonthKey;
    });
  }, [allUserTx]);

  const futureInstallmentTotal = futureInstallments.reduce((s, t) => s + t.amount, 0);

  // Group future installments by month for preview
  const futureByMonth = useMemo(() => {
    const grouped: Record<string, { label: string; total: number; items: typeof futureInstallments }> = {};
    futureInstallments.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!grouped[key]) {
        grouped[key] = { label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, total: 0, items: [] };
      }
      grouped[key].total += tx.amount;
      grouped[key].items.push(tx);
    });
    return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label)).slice(0, 6);
  }, [futureInstallments]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const openModal = (type: 'income' | 'expense') => { setModalType(type); setEditTx(null); setModalOpen(true); };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLayout(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        const newLayout = arrayMove(prev, oldIndex, newIndex);
        if (user?.id) saveLayout(user.id, newLayout);
        return newLayout;
      });
    }
  }, [user?.id]);

  const isEmpty = currentTx.length === 0;

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'metrics':
        return (
          <DashboardSortableCard id="metrics" key="metrics" className="col-span-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <FinanceMetricCard
                title={annualView ? 'Saldo Anual' : 'Saldo do Mês'}
                value={balance} icon={DollarSign}
                type={balance >= 0 ? 'info' : 'expense'}
              />
              <FinanceMetricCard
                title="Receitas" value={income} icon={TrendingUp} type="income"
                trend={incomeTrend}
                onClick={() => navigate(annualView ? `/receitas?year=${year}` : `/receitas?month=${year}-${String(month + 1).padStart(2, '0')}`)}
              />
              <FinanceMetricCard
                title="Despesas" value={expense} icon={TrendingDown} type="expense"
                trend={expenseTrend}
                onClick={() => navigate(annualView ? `/despesas?year=${year}` : `/despesas?month=${year}-${String(month + 1).padStart(2, '0')}`)}
              />
              <FinanceMetricCard
                title="Resultado" value={balance} icon={Wallet}
                type={balance >= 0 ? 'income' : 'expense'}
              />
            </div>
          </DashboardSortableCard>
        );
      case 'charts':
        if (isEmpty) return null;
        return (
          <DashboardSortableCard id="charts" key="charts" className="col-span-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CashFlowChart transactions={currentTx} mode={annualView ? 'year' : 'month'} />
              <ExpenseCategoryChart transactions={currentTx} />
            </div>
          </DashboardSortableCard>
        );
      case 'pending':
        if (pendingTx.length === 0 || annualView) return null;
        return (
          <DashboardSortableCard id="pending" key="pending" className="col-span-full">
            <div className="finance-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Próximas Contas</h3>
              <div className="space-y-2">
                {pendingTx.slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center py-2.5 border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-medium text-sm">{t.description}</span>
                      <span className="text-xs text-muted-foreground ml-2">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className="font-semibold text-sm finance-expense">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </DashboardSortableCard>
        );
      case 'annual-table':
        if (!annualView) return null;
        return (
          <DashboardSortableCard id="annual-table" key="annual-table" className="col-span-full">
            <div className="finance-card overflow-x-auto">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Resumo por Mês</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2">Mês</th>
                    <th className="text-right py-2 px-2">Receitas</th>
                    <th className="text-right py-2 px-2">Despesas</th>
                    <th className="text-right py-2 px-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {monthNames.map((name, i) => {
                    const mTx = yearTx.filter(t => new Date(t.date).getMonth() === i);
                    const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                    const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                        <td className="py-2.5 px-2">{name}</td>
                        <td className="py-2.5 px-2 text-right finance-income">R$ {inc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-2 text-right finance-expense">R$ {exp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-2.5 px-2 text-right font-semibold ${inc - exp >= 0 ? 'finance-income' : 'finance-expense'}`}>
                          R$ {(inc - exp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </DashboardSortableCard>
        );
      case 'recent-transactions':
        if (annualView) return null;
        if (isEmpty) return null;
        return (
          <DashboardSortableCard id="recent-transactions" key="recent-transactions" className="col-span-full">
            <div className="finance-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Últimas Transações</h3>
              <TransactionTable transactions={monthTx.slice(-10).reverse()} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
            </div>
          </DashboardSortableCard>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {annualView ? (
          <MonthNavigator year={year} month={month} onPrev={() => setYear(y => y - 1)} onNext={() => setYear(y => y + 1)} mode="year" />
        ) : (
          <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openModal('income')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-income text-sm font-medium active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="h-4 w-4" /> Receita
          </button>
          <button
            onClick={() => openModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-expense text-sm font-medium active:scale-95 transition-transform shadow-sm"
          >
            <Plus className="h-4 w-4" /> Despesa
          </button>
          <button
            onClick={() => setAnnualView(!annualView)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{annualView ? 'Visão Mensal' : 'Visão Anual'}</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && !annualView && (
        <EmptyState
          onAddIncome={() => openModal('income')}
          onAddExpense={() => openModal('expense')}
        />
      )}

      {/* Dashboard Sections with Drag and Drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layout} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4">
            {layout.map(id => renderSection(id))}
          </div>
        </SortableContext>
      </DndContext>

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} defaultType={modalType} />
    </div>
  );
}
