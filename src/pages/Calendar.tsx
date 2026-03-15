import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { MonthNavigator } from '@/components/MonthNavigator';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { getMonthTransactions, getCategoryName } = useFinance();

  const transactions = useMemo(() => getMonthTransactions(year, month), [getMonthTransactions, year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getTransactionsForDay = (day: number) => {
    return transactions.filter(t => new Date(t.date).getDate() === day);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendário Financeiro</h1>
        <MonthNavigator year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      </div>

      <div className="finance-card overflow-x-auto">
        <div className="grid grid-cols-7 gap-px min-w-[600px]">
          {dayNames.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
          {days.map(day => {
            const dayTx = getTransactionsForDay(day);
            const income = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const hasPending = dayTx.some(t => t.status === 'pending');
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

            return (
              <div key={day} className={`p-2 min-h-[80px] border border-border/30 rounded-lg ${isToday ? 'bg-primary/5 border-primary/30' : ''}`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? 'finance-info' : ''}`}>{day}</div>
                {income > 0 && (
                  <div className="text-xs finance-income truncate">+R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                )}
                {expense > 0 && (
                  <div className="text-xs finance-expense truncate">-R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                )}
                {hasPending && (
                  <div className="w-2 h-2 rounded-full bg-finance-warning mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-finance-income" /> Receita</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-finance-expense" /> Despesa</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-finance-warning" /> Pendente</span>
      </div>
    </div>
  );
}
