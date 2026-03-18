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
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, BarChart3, CalendarClock, CreditCard as CreditCardIcon, Eye, EyeOff } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { computeInvoices } from '@/services/financeService';
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

const DEFAULT_LAYOUT = ['metrics', 'credit-cards-summary', 'forecast-installments', 'charts', 'pending', 'annual-table', 'recent-transactions'];

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
  const { getMonthTransactions, getYearTransactions, transactions: allUserTx, creditCards, creditCardExpenses, paidInvoices, accounts } = useFinance();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [annualView, setAnnualView] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  const [hideValues, setHideValues] = useState(false);

  useEffect(() => {
    if (user?.id) setLayout(loadLayout(user.id));
  }, [user?.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const monthTx = useMemo(() => getMonthTransactions(year, month), [getMonthTransactions, year, month]);
  const yearTx = useMemo(() => getYearTransactions(year), [getYearTransactions, year]);

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

  const fmt = (v: number) => hideValues ? '•••••' : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Credit card invoice summary
  const ccSummary = useMemo(() => {
    if (creditCards.length === 0) return null;
    let openTotal = 0;
    let closedTotal = 0;
    let overdueTotal = 0;
    let futureTotal = 0;
    creditCards.forEach(card => {
      const exps = creditCardExpenses.filter(e => e.cardId === card.id);
      const invs = computeInvoices(card, exps, paidInvoices);
      invs.forEach(inv => {
        if (inv.status === 'open') openTotal += inv.total;
        else if (inv.status === 'closed') closedTotal += inv.total;
        else if (inv.status === 'overdue') overdueTotal += inv.total;
        else if (inv.status === 'future') futureTotal += inv.total;
      });
    });
    return { openTotal, closedTotal, overdueTotal, futureTotal };
  }, [creditCards, creditCardExpenses, paidInvoices]);

  const pendingTx = monthTx.filter(t => t.status === 'pending').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'metrics':
        return (
          <DashboardSortableCard id="metrics" key="metrics" className="col-span-full">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <FinanceMetricCard
                title={annualView ? 'Saldo Anual' : 'Saldo do Mês'}
                value={hideValues ? 0 : balance} icon={DollarSign}
                type={balance >= 0 ? 'info' : 'expense'}
                hideValue={hideValues}
              />
              <FinanceMetricCard
                title="Receitas" value={hideValues ? 0 : income} icon={TrendingUp} type="income"
                trend={incomeTrend}
                onClick={() => navigate(annualView ? `/receitas?year=${year}` : `/receitas?month=${year}-${String(month + 1).padStart(2, '0')}`)}
                hideValue={hideValues}
              />
              <FinanceMetricCard
                title="Despesas" value={hideValues ? 0 : expense} icon={TrendingDown} type="expense"
                trend={expenseTrend}
                onClick={() => navigate(annualView ? `/despesas?year=${year}` : `/despesas?month=${year}-${String(month + 1).padStart(2, '0')}`)}
                hideValue={hideValues}
              />
              <FinanceMetricCard
                title="Patrimônio" value={hideValues ? 0 : totalBalance} icon={Wallet}
                type={totalBalance >= 0 ? 'income' : 'expense'}
                hideValue={hideValues}
              />
            </div>
          </DashboardSortableCard>
        );
      case 'credit-cards-summary':
        if (!ccSummary || annualView || (ccSummary.openTotal === 0 && ccSummary.closedTotal === 0 && ccSummary.overdueTotal === 0 && ccSummary.futureTotal === 0)) return null;
        return (
          <DashboardSortableCard id="credit-cards-summary" key="credit-cards-summary" className="col-span-full">
            <div className="finance-card cursor-pointer" onClick={() => navigate('/cartoes')}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                  <CreditCardIcon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Cartões de Crédito</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ccSummary.openTotal > 0 && (
                  <div className="rounded-xl bg-accent/50 p-3">
                    <p className="text-xs text-muted-foreground">Fatura Aberta</p>
                    <p className="text-base font-bold mt-1">{fmt(ccSummary.openTotal)}</p>
                  </div>
                )}
                {ccSummary.closedTotal > 0 && (
                  <div className="rounded-xl bg-accent/50 p-3">
                    <p className="text-xs text-muted-foreground">Aguardando</p>
                    <p className="text-base font-bold mt-1">{fmt(ccSummary.closedTotal)}</p>
                  </div>
                )}
                {ccSummary.overdueTotal > 0 && (
                  <div className="rounded-xl bg-destructive/10 p-3">
                    <p className="text-xs text-destructive">Vencidas</p>
                    <p className="text-base font-bold text-destructive mt-1">{fmt(ccSummary.overdueTotal)}</p>
                  </div>
                )}
                {ccSummary.futureTotal > 0 && (
                  <div className="rounded-xl bg-accent/50 p-3">
                    <p className="text-xs text-muted-foreground">Futuras</p>
                    <p className="text-base font-bold text-muted-foreground mt-1">{fmt(ccSummary.futureTotal)}</p>
                  </div>
                )}
              </div>
            </div>
          </DashboardSortableCard>
        );
      case 'forecast-installments':
        if (futureInstallments.length === 0 || annualView) return null;
        return (
          <DashboardSortableCard id="forecast-installments" key="forecast-installments" className="col-span-full">
            <div className="finance-card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-warning) / 0.1)' }}>
                  <CalendarClock className="h-4 w-4" style={{ color: 'hsl(var(--finance-warning))' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">Parcelas Futuras</h3>
                </div>
                <span className="text-base font-bold finance-expense shrink-0">{fmt(futureInstallmentTotal)}</span>
              </div>
              <div className="space-y-2">
                {futureByMonth.map(group => (
                  <div key={group.label} className="rounded-xl bg-accent/50 p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{group.label}</span>
                      <span className="text-sm font-semibold finance-expense">{fmt(group.total)}</span>
                    </div>
                    <div className="space-y-1">
                      {group.items.slice(0, 3).map(tx => (
                        <div key={tx.id} className="flex justify-between text-xs text-muted-foreground">
                          <span className="truncate mr-2">{tx.description}</span>
                          <span className="shrink-0">{fmt(tx.amount)}</span>
                        </div>
                      ))}
                      {group.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">+{group.items.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
              <h3 className="text-sm font-semibold mb-3">📋 Próximas Contas</h3>
              <div className="space-y-1">
                {pendingTx.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm truncate block">{t.description}</span>
                      <span className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span className="font-semibold text-sm finance-expense shrink-0 ml-3">{fmt(t.amount)}</span>
                  </div>
                ))}
                {pendingTx.length > 5 && (
                  <button onClick={() => navigate('/planejamento')} className="w-full text-center text-xs text-primary font-medium py-2 mt-1">
                    Ver todas ({pendingTx.length})
                  </button>
                )}
              </div>
            </div>
          </DashboardSortableCard>
        );
      case 'annual-table':
        if (!annualView) return null;
        return (
          <DashboardSortableCard id="annual-table" key="annual-table" className="col-span-full">
            <div className="finance-card">
              <h3 className="text-sm font-semibold mb-3">Resumo por Mês</h3>
              <div className="space-y-1">
                {monthNames.map((name, i) => {
                  const mTx = yearTx.filter(t => new Date(t.date).getMonth() === i);
                  const inc = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                  const exp = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                  if (inc === 0 && exp === 0) return null;
                  const bal = inc - exp;
                  return (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium">{name}</span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="finance-income hidden sm:inline">+{fmt(inc)}</span>
                        <span className="finance-expense hidden sm:inline">-{fmt(exp)}</span>
                        <span className={`font-semibold text-sm ${bal >= 0 ? 'finance-income' : 'finance-expense'}`}>
                          {fmt(bal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DashboardSortableCard>
        );
      case 'recent-transactions':
        if (annualView) return null;
        if (isEmpty) return null;
        return (
          <DashboardSortableCard id="recent-transactions" key="recent-transactions" className="col-span-full">
            <div className="finance-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Últimas Transações</h3>
                <button onClick={() => navigate('/transacoes')} className="text-xs text-primary font-medium">
                  Ver todas
                </button>
              </div>
              <TransactionTable transactions={monthTx.slice(-10).reverse()} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} pageSize={5} />
            </div>
          </DashboardSortableCard>
        );
      default:
        return null;
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Greeting + Hide Values */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Aqui está seu resumo financeiro</p>
        </div>
        <button
          onClick={() => setHideValues(!hideValues)}
          className="p-2.5 rounded-xl hover:bg-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
        >
          {hideValues ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Period Navigator + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {annualView ? (
          <MonthNavigator year={year} month={month} onPrev={() => setYear(y => y - 1)} onNext={() => setYear(y => y + 1)} mode="year" />
        ) : (
          <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => openModal('income')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl btn-income text-sm font-medium active:scale-95 transition-transform min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Receita</span>
          </button>
          <button
            onClick={() => openModal('expense')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl btn-expense text-sm font-medium active:scale-95 transition-transform min-h-[44px]"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Despesa</span>
          </button>
          <button
            onClick={() => setAnnualView(!annualView)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 active:scale-95 transition-all min-h-[44px]"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{annualView ? 'Mensal' : 'Anual'}</span>
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

      {/* Dashboard Sections */}
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
