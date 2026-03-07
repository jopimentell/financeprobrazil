import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { FinanceMetricCard } from '@/components/FinanceMetricCard';
import { CashFlowChart } from '@/components/CashFlowChart';
import { ExpenseCategoryChart } from '@/components/ExpenseCategoryChart';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, BarChart3 } from 'lucide-react';
import { Transaction } from '@/types/finance';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Dashboard() {
  const now = new Date();
  const { getMonthTransactions, getYearTransactions, transactions } = useFinance();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [annualView, setAnnualView] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const monthTx = useMemo(() => getMonthTransactions(year, month), [getMonthTransactions, year, month]);
  const yearTx = useMemo(() => getYearTransactions(year), [getYearTransactions, year]);

  const currentTx = annualView ? yearTx : monthTx;
  const income = currentTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = currentTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const pendingTx = monthTx.filter(t => t.status === 'pending').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const openModal = (type: 'income' | 'expense') => { setModalType(type); setEditTx(null); setModalOpen(true); };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {annualView ? (
          <MonthNavigator year={year} month={month} onPrev={() => setYear(y => y - 1)} onNext={() => setYear(y => y + 1)} mode="year" />
        ) : (
          <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
        )}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => openModal('income')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-income text-sm font-medium">
            <Plus className="h-4 w-4" /> Receita
          </button>
          <button onClick={() => openModal('expense')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-expense text-sm font-medium">
            <Plus className="h-4 w-4" /> Despesa
          </button>
          <button onClick={() => setAnnualView(!annualView)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{annualView ? 'Visão Mensal' : 'Visão Anual'}</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <FinanceMetricCard title={annualView ? 'Saldo Anual' : 'Saldo do Mês'} value={balance} icon={DollarSign} type={balance >= 0 ? 'info' : 'expense'} />
        <FinanceMetricCard title="Receitas" value={income} icon={TrendingUp} type="income" />
        <FinanceMetricCard title="Despesas" value={expense} icon={TrendingDown} type="expense" />
        <FinanceMetricCard title="Resultado" value={balance} icon={Wallet} type={balance >= 0 ? 'income' : 'expense'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CashFlowChart transactions={currentTx} mode={annualView ? 'year' : 'month'} />
        <ExpenseCategoryChart transactions={currentTx} />
      </div>

      {/* Pending bills */}
      {pendingTx.length > 0 && !annualView && (
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Próximas Contas</h3>
          <div className="space-y-2">
            {pendingTx.slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="font-medium text-sm">{t.description}</span>
                  <span className="text-xs text-muted-foreground ml-2">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className="font-semibold text-sm finance-expense">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annual summary table */}
      {annualView && (
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
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/50">
                    <td className="py-2 px-2">{name}</td>
                    <td className="py-2 px-2 text-right finance-income">R$ {inc.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-2 text-right finance-expense">R$ {exp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={`py-2 px-2 text-right font-semibold ${inc - exp >= 0 ? 'finance-income' : 'finance-expense'}`}>
                      R$ {(inc - exp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent transactions */}
      {!annualView && (
        <div className="finance-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Últimas Transações</h3>
          <TransactionTable transactions={monthTx.slice(-10).reverse()} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        </div>
      )}

      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} defaultType={modalType} />
    </div>
  );
}
