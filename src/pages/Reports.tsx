import { useState, useMemo } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { CategoryDetailModal } from '@/components/CategoryDetailModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ChevronRight, ChevronLeft, Scale } from 'lucide-react';
import { computePeriodSummary } from '@/utils/balanceEngine';
import { monthBoundsISO, yearBoundsISO, todayISO, monthOf, yearOf, dayOf, isInRange, formatDateBR } from '@/utils/periodUtils';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const monthLong = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type PeriodMode = 'month' | 'year' | 'custom';

export default function Reports() {
  const { transactions, accounts, getCategoryName, getCategoryColor } = useFinance();
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [customStart, setCustomStart] = useState(monthBoundsISO(now.getFullYear(), now.getMonth()).from);
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);

  const { start, end, label } = useMemo(() => {
    if (mode === 'month') {
      const b = monthBoundsISO(year, month);
      return { start: b.from, end: b.to, label: `${monthLong[month]} ${year}` };
    }
    if (mode === 'year') {
      const b = yearBoundsISO(year);
      return { start: b.from, end: b.to, label: `${year}` };
    }
    return { start: customStart, end: customEnd, label: `${formatDateBR(customStart)} → ${formatDateBR(customEnd)}` };
  }, [mode, year, month, customStart, customEnd]);

  /** Somente movimentos realizados (pagos) compõem receitas, despesas e saldo. */
  const periodTx = useMemo(
    () => transactions.filter((t) => t.status === 'paid' && isInRange(t.date, start, end)),
    [transactions, start, end],
  );

  // FONTE ÚNICA DE VERDADE
  const summary = useMemo(
    () => computePeriodSummary(accounts, transactions, start, end),
    [accounts, transactions, start, end],
  );

  const totalIncome = summary.income;
  const totalExpense = summary.expense;
  const result = summary.result;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    periodTx.filter(t => t.type === 'expense').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ id, name: getCategoryName(id), value, color: getCategoryColor(id) })).sort((a, b) => b.value - a.value);
  }, [periodTx, getCategoryName, getCategoryColor]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    periodTx.filter(t => t.type === 'income').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
    return Object.entries(map).map(([id, value]) => ({ id, name: getCategoryName(id), value, color: getCategoryColor(id) })).sort((a, b) => b.value - a.value);
  }, [periodTx, getCategoryName, getCategoryColor]);

  // For timeline charts — if month mode, show daily; else monthly
  const timeline = useMemo(() => {
    if (mode === 'month') {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dTx = periodTx.filter(t => dayOf(t.date) === day);
        return {
          name: String(day).padStart(2, '0'),
          receitas: dTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          despesas: dTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        };
      });
    }
    // year or custom: group by month
    const months: Record<string, { receitas: number; despesas: number; sortKey: number }> = {};
    periodTx.forEach(t => {
      const y = yearOf(t.date);
      const m = monthOf(t.date);
      const key = `${monthNames[m]}/${String(y).slice(2)}`;
      const sortKey = y * 12 + m;
      if (!months[key]) months[key] = { receitas: 0, despesas: 0, sortKey };
      if (t.type === 'income') months[key].receitas += t.amount;
      else if (t.type === 'expense') months[key].despesas += t.amount;
    });
    return Object.entries(months)
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .map(([name, v]) => ({ name, receitas: v.receitas, despesas: v.despesas }));
  }, [periodTx, mode, year, month]);

  /**
   * Fluxo de caixa acumulado: começa do SALDO INICIAL real do período
   * (saldo final do período anterior), nunca de zero.
   */
  const cashFlow = useMemo(() => {
    let acc = summary.openingBalance;
    return timeline.map(p => {
      acc += p.receitas - p.despesas;
      return { name: p.name, saldo: acc };
    });
  }, [timeline, summary.openingBalance]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;


  const navigate = (dir: -1 | 1) => {
    if (mode === 'month') {
      const m = month + dir;
      if (m < 0) { setMonth(11); setYear(y => y - 1); }
      else if (m > 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m);
    } else if (mode === 'year') {
      setYear(y => y + dir);
    }
  };

  const goCurrent = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Relatórios</h1>
      </div>

      {/* Period Selector */}
      <div className="finance-card !p-3 space-y-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-accent/40 w-fit">
          {([
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
            { id: 'custom', label: 'Período' },
          ] as { id: PeriodMode; label: string }[]).map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === opt.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {mode !== 'custom' ? (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-accent min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold capitalize">{label}</p>
              <button onClick={goCurrent} className="text-[10px] text-primary hover:underline">
                Ir para hoje
              </button>
            </div>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-lg hover:bg-accent min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">De</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Até</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="finance-card !p-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: 'hsl(var(--finance-income) / 0.1)' }}>
            <TrendingUp className="h-3.5 w-3.5 finance-income" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Receitas</p>
          <p className="text-sm sm:text-base font-bold finance-income mt-0.5 truncate">{fmt(totalIncome)}</p>
        </div>
        <div className="finance-card !p-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: 'hsl(var(--finance-expense) / 0.1)' }}>
            <TrendingDown className="h-3.5 w-3.5 finance-expense" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Despesas</p>
          <p className="text-sm sm:text-base font-bold finance-expense mt-0.5 truncate">{fmt(totalExpense)}</p>
        </div>
        <div className="finance-card !p-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <Scale className="h-3.5 w-3.5 text-foreground" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Resultado</p>
          <p className={`text-sm sm:text-base font-bold mt-0.5 truncate ${result >= 0 ? 'finance-income' : 'finance-expense'}`}>{fmt(result)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Receitas − Despesas</p>
        </div>
        <div className="finance-card !p-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: 'hsl(var(--finance-info) / 0.1)' }}>
            <DollarSign className="h-3.5 w-3.5 finance-info" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo Final</p>
          <p className={`text-sm sm:text-base font-bold mt-0.5 truncate ${summary.finalBalance >= 0 ? 'finance-income' : 'finance-expense'}`}>{fmt(summary.finalBalance)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Inicial {fmt(summary.openingBalance)}</p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">
            {mode === 'month' ? 'Movimento Diário' : 'Comparação Mensal'}
          </h3>
          {timeline.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8 text-sm">Sem dados no período</p>}
        </div>

        {/* Cash Flow */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Fluxo de Caixa Acumulado</h3>
          {cashFlow.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="saldo" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8 text-sm">Sem dados no período</p>}
        </div>

        {/* Expense by Category */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Despesas por Categoria</h3>
          {expenseByCategory.length ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    onClick={(e: any) => e?.id && setDrillCategoryId(e.id)}
                    cursor="pointer"
                  >
                    {expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {expenseByCategory.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setDrillCategoryId(cat.id)}
                    className="w-full flex items-center justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-accent/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-xs font-medium">{fmt(cat.value)}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">Toque em uma categoria para análise detalhada</p>
            </div>
          ) : <p className="text-muted-foreground text-center py-8 text-sm">Sem dados</p>}
        </div>

        {/* Income by Category */}
        <div className="finance-card">
          <h3 className="text-sm font-semibold mb-4">Receitas por Categoria</h3>
          {incomeByCategory.length ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    onClick={(e: any) => e?.id && setDrillCategoryId(e.id)}
                    cursor="pointer"
                  >
                    {incomeByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {incomeByCategory.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setDrillCategoryId(cat.id)}
                    className="w-full flex items-center justify-between py-1.5 px-2 -mx-2 rounded-md hover:bg-accent/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-xs font-medium">{fmt(cat.value)}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-center py-8 text-sm">Sem dados</p>}
        </div>
      </div>

      <CategoryDetailModal
        open={!!drillCategoryId}
        onClose={() => setDrillCategoryId(null)}
        categoryId={drillCategoryId}
        year={year}
        transactions={periodTx}
      />
    </div>
  );
}
