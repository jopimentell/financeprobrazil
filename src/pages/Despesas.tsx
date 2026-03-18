import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionModal } from '@/components/TransactionModal';
import { Transaction } from '@/types/finance';
import { Plus, ArrowUpCircle, BarChart3 } from 'lucide-react';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Despesas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { transactions } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const now = new Date();
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');

  const initialAnnual = !!yearParam && !monthParam;
  const [annualView, setAnnualView] = useState(initialAnnual);

  const parsedYear = yearParam ? parseInt(yearParam) : monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear();
  const parsedMonth = monthParam ? parseInt(monthParam.split('-')[1]) - 1 : now.getMonth();

  const [year, setYear] = useState(parsedYear);
  const [month, setMonth] = useState(parsedMonth);

  const updateUrl = (y: number, m: number, annual: boolean) => {
    if (annual) setSearchParams({ year: String(y) });
    else setSearchParams({ month: `${y}-${String(m + 1).padStart(2, '0')}` });
  };

  const prevMonth = () => { const nm = month === 0 ? 11 : month - 1; const ny = month === 0 ? year - 1 : year; setMonth(nm); setYear(ny); updateUrl(ny, nm, false); };
  const nextMonth = () => { const nm = month === 11 ? 0 : month + 1; const ny = month === 11 ? year + 1 : year; setMonth(nm); setYear(ny); updateUrl(ny, nm, false); };
  const prevYear = () => { setYear(y => { updateUrl(y - 1, month, true); return y - 1; }); };
  const nextYear = () => { setYear(y => { updateUrl(y + 1, month, true); return y + 1; }); };

  const toggleView = () => { const next = !annualView; setAnnualView(next); updateUrl(year, month, next); };

  const expenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .filter(t => { const d = new Date(t.date); if (annualView) return d.getFullYear() === year; return d.getFullYear() === year && d.getMonth() === month; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, year, month, annualView]);

  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--finance-expense) / 0.1)' }}>
            <ArrowUpCircle className="h-5 w-5 finance-expense" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Despesas</h1>
            <p className="text-sm text-muted-foreground">Total: <span className="finance-expense font-semibold">{fmt(total)}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditTx(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-expense text-sm font-medium min-h-[44px]">
            <Plus className="h-4 w-4" /> Nova Despesa
          </button>
          <button onClick={toggleView}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{annualView ? 'Mensal' : 'Anual'}</span>
          </button>
        </div>
      </div>

      {annualView ? (
        <MonthNavigator year={year} month={month} onPrev={prevYear} onNext={nextYear} mode="year" />
      ) : (
        <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      )}

      {/* Annual Summary - Card based */}
      {annualView && (
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-3">Resumo por Mês</h3>
          <div className="space-y-1">
            {monthNames.map((name, i) => {
              const mTx = expenses.filter(t => new Date(t.date).getMonth() === i);
              const exp = mTx.reduce((s, t) => s + t.amount, 0);
              if (exp === 0 && mTx.length === 0) return null;
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">({mTx.length})</span>
                  </div>
                  <span className="text-sm font-semibold finance-expense">{fmt(exp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="finance-card !p-3 md:!p-5">
        <TransactionTable transactions={expenses} onEdit={(t) => { setEditTx(t); setModalOpen(true); }} />
        <div className="mt-3 text-xs text-muted-foreground text-center">{expenses.length} despesa(s)</div>
      </div>
      <TransactionModal open={modalOpen} onClose={() => { setModalOpen(false); setEditTx(null); }} transaction={editTx} defaultType="expense" />
    </div>
  );
}
