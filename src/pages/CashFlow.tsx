import { useMemo, useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight,
  Download, FileSpreadsheet, FileText, Filter, DollarSign, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  buildLedger, computeDailySeries, computeDayRevenue, computeMonthlySeries,
  CashFlowFilters,
} from '@/utils/cashFlowEngine';
import {
  exportCashFlowCSV, exportCashFlowPDF, exportCashFlowXLSX,
} from '@/utils/cashFlowExport';

const monthLong = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
type PeriodMode = 'month' | 'year' | 'custom';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const iso = (d: Date) => d.toISOString().split('T')[0];
const dateBR = (s: string) => s.split('-').reverse().join('/');
const weekday = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });

export default function CashFlow() {
  const { transactions, accounts, categories, getCategoryName, getAccountName } = useFinance();
  const now = new Date();

  const [mode, setMode] = useState<PeriodMode>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [customStart, setCustomStart] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(iso(now));
  const [accountId, setAccountId] = useState<string>('all');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [chartYear, setChartYear] = useState(now.getFullYear());
  const [showFilters, setShowFilters] = useState(false);

  const { from, to, label } = useMemo(() => {
    if (mode === 'month') {
      return {
        from: iso(new Date(year, month, 1)),
        to: iso(new Date(year, month + 1, 0)),
        label: `${monthLong[month]} ${year}`,
      };
    }
    if (mode === 'year') {
      return { from: `${year}-01-01`, to: `${year}-12-31`, label: String(year) };
    }
    return { from: customStart, to: customEnd, label: `${dateBR(customStart)} → ${dateBR(customEnd)}` };
  }, [mode, year, month, customStart, customEnd]);

  const baseFilters = useMemo(() => ({
    accountId: accountId === 'all' ? undefined : accountId,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    type: typeFilter === 'all' ? undefined : (typeFilter as 'income' | 'expense'),
  }), [accountId, categoryId, typeFilter]);

  const filters: CashFlowFilters = useMemo(() => ({ ...baseFilters, from, to }), [baseFilters, from, to]);

  const { days, totals } = useMemo(
    () => buildLedger(accounts, transactions, filters),
    [accounts, transactions, filters],
  );

  const monthlySeries = useMemo(
    () => computeMonthlySeries(transactions, chartYear, baseFilters),
    [transactions, chartYear, baseFilters],
  );

  const dailySeries = useMemo(() => computeDailySeries(transactions, filters), [transactions, filters]);

  const todayRevenue = useMemo(
    () => computeDayRevenue(transactions, iso(now), baseFilters),
    [transactions, baseFilters],
  );

  const currentMonthTotals = useMemo(() => {
    const f: CashFlowFilters = {
      ...baseFilters,
      from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
    return buildLedger(accounts, transactions, f).totals;
  }, [accounts, transactions, baseFilters]);

  const cashBalance = useMemo(
    () => buildLedger(accounts, transactions, { ...baseFilters, from: '1900-01-01', to: iso(now) }).totals.finalBalance,
    [accounts, transactions, baseFilters],
  );

  const filtersLabel = [
    accountId === 'all' ? 'Todas as contas' : getAccountName(accountId),
    categoryId === 'all' ? 'Todas as categorias' : getCategoryName(categoryId),
    typeFilter === 'all' ? 'Receitas e despesas' : typeFilter === 'income' ? 'Somente receitas' : 'Somente despesas',
  ].join(' • ');

  const exportMeta = { periodLabel: label, filtersLabel, getCategoryName, getAccountName };

  const shiftPeriod = (dir: 1 | -1) => {
    if (mode === 'month') {
      const d = new Date(year, month + dir, 1);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
    } else if (mode === 'year') {
      setYear((y) => y + dir);
    }
  };

  const kpis = [
    { label: 'Receita do dia', value: todayRevenue, icon: DollarSign, tone: 'income' as const },
    { label: 'Receita do mês', value: currentMonthTotals.income, icon: TrendingUp, tone: 'income' as const },
    { label: 'Despesa do mês', value: currentMonthTotals.expense, icon: TrendingDown, tone: 'expense' as const },
    { label: 'Lucro do mês', value: currentMonthTotals.profit, icon: TrendingUp, tone: currentMonthTotals.profit >= 0 ? 'income' as const : 'expense' as const },
    { label: 'Saldo em caixa', value: cashBalance, icon: Wallet, tone: 'neutral' as const },
  ];

  const toneClass = (tone: 'income' | 'expense' | 'neutral') =>
    tone === 'income' ? 'text-success' : tone === 'expense' ? 'text-destructive' : 'text-foreground';
  const toneBg = (tone: 'income' | 'expense' | 'neutral') =>
    tone === 'income' ? 'bg-success/10 text-success' : tone === 'expense' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Controle financeiro e desempenho do período</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="md:hidden min-h-[44px]">
            <Filter className="h-4 w-4 mr-1.5" /> Filtros
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="min-h-[44px]">
                <Download className="h-4 w-4 mr-1.5" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCashFlowPDF(days, totals, exportMeta)}>
                <FileText className="h-4 w-4 mr-2" /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCashFlowXLSX(days, totals, exportMeta)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCashFlowCSV(days, totals, exportMeta)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Period selector */}
      <div className="finance-card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-muted p-1">
            {(['month', 'year', 'custom'] as PeriodMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-h-[36px] ${
                  mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {m === 'month' ? 'Mês' : m === 'year' ? 'Ano' : 'Período'}
              </button>
            ))}
          </div>
          {mode !== 'custom' && (
            <div className="flex items-center gap-1 ml-auto">
              <Button variant="ghost" size="icon" onClick={() => shiftPeriod(-1)} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[130px] text-center">{label}</span>
              <Button variant="ghost" size="icon" onClick={() => shiftPeriod(1)} className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {mode === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="sm:w-44" />
            <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="sm:w-44" />
          </div>
        )}

        <div className={`${showFilters ? 'grid' : 'hidden'} md:grid grid-cols-1 sm:grid-cols-3 gap-2`}>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger><SelectValue placeholder="Conta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Receitas e despesas</SelectItem>
              <SelectItem value="income">Somente receitas</SelectItem>
              <SelectItem value="expense">Somente despesas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="finance-card">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] md:text-xs text-muted-foreground leading-tight">{k.label}</p>
              <div className={`p-1.5 rounded-lg ${toneBg(k.tone)}`}>
                <k.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className={`mt-2 text-base md:text-lg font-bold tabular-nums ${toneClass(k.tone)}`}>{brl(k.value)}</p>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="finance-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Fluxo de caixa mensal</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setChartYear((y) => y - 1)} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold w-12 text-center">{chartYear}</span>
            <Button variant="ghost" size="icon" onClick={() => setChartYear((y) => y + 1)} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70}
              tickFormatter={(v: number) => v.toLocaleString('pt-BR', { notation: 'compact' })} />
            <Tooltip formatter={(v: number) => brl(v)} />
            <Legend />
            <Bar name="Receitas" dataKey="receitas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            <Bar name="Despesas" dataKey="despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            <Bar name="Lucro" dataKey="lucro" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily chart */}
      <div className="finance-card">
        <h3 className="text-sm font-semibold mb-4">Receita diária — {label}</h3>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70}
              tickFormatter={(v: number) => v.toLocaleString('pt-BR', { notation: 'compact' })} />
            <Tooltip formatter={(v: number) => brl(v)} />
            <Legend />
            <Line name="Receitas" type="monotone" dataKey="receitas" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
            <Line name="Despesas" type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ledger */}
      <div className="finance-card">
        <h3 className="text-sm font-semibold mb-1">Livro caixa</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Saldo inicial do período: <span className="font-semibold tabular-nums">{brl(totals.openingBalance)}</span>
        </p>

        {days.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Nenhuma movimentação neste período.
          </div>
        )}

        {/* Desktop table */}
        {days.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left py-2 font-medium">Data</th>
                  <th className="text-left py-2 font-medium">Tipo</th>
                  <th className="text-left py-2 font-medium">Categoria</th>
                  <th className="text-left py-2 font-medium">Descrição</th>
                  <th className="text-right py-2 font-medium">Entrada</th>
                  <th className="text-right py-2 font-medium">Saída</th>
                  <th className="text-right py-2 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <>
                    <tr key={`h-${day.date}`} className="bg-muted/50">
                      <td colSpan={7} className="py-1.5 px-1 text-xs font-semibold capitalize">
                        {dateBR(day.date)} · {weekday(day.date)}
                      </td>
                    </tr>
                    {day.rows.map((r) => (
                      <tr key={r.tx.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 tabular-nums text-muted-foreground text-xs">{dateBR(r.tx.date)}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${r.amountIn ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {r.amountIn ? 'Receita' : 'Despesa'}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{getCategoryName(r.tx.categoryId)}</td>
                        <td className="py-2 max-w-[280px] truncate">{r.tx.description}</td>
                        <td className="py-2 text-right tabular-nums text-success">{r.amountIn ? brl(r.amountIn) : '—'}</td>
                        <td className="py-2 text-right tabular-nums text-destructive">{r.amountOut ? brl(r.amountOut) : '—'}</td>
                        <td className={`py-2 text-right tabular-nums font-medium ${r.runningBalance < 0 ? 'text-destructive' : ''}`}>{brl(r.runningBalance)}</td>
                      </tr>
                    ))}
                    <tr key={`t-${day.date}`} className="text-xs text-muted-foreground">
                      <td colSpan={4} className="py-1.5 text-right pr-3">Resumo do dia</td>
                      <td className="py-1.5 text-right tabular-nums">{brl(day.income)}</td>
                      <td className="py-1.5 text-right tabular-nums">{brl(day.expense)}</td>
                      <td className="py-1.5 text-right tabular-nums font-semibold">{brl(day.endingBalance)}</td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {days.length > 0 && (
          <div className="md:hidden space-y-4">
            {days.map((day) => (
              <div key={day.date} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold capitalize">{dateBR(day.date)} · {weekday(day.date)}</span>
                  <span className={`font-semibold tabular-nums ${day.net >= 0 ? 'text-success' : 'text-destructive'}`}>{brl(day.net)}</span>
                </div>
                {day.rows.map((r) => (
                  <div key={r.tx.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.tx.description}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {getCategoryName(r.tx.categoryId)} · {getAccountName(r.tx.accountId)}
                        </p>
                      </div>
                      <p className={`text-sm font-bold tabular-nums shrink-0 ${r.amountIn ? 'text-success' : 'text-destructive'}`}>
                        {r.amountIn ? `+${brl(r.amountIn)}` : `-${brl(r.amountOut)}`}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Saldo: <span className="tabular-nums font-medium">{brl(r.runningBalance)}</span>
                    </p>
                  </div>
                ))}
                <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                  <span>Entradas {brl(day.income)} · Saídas {brl(day.expense)}</span>
                  <span>Saldo {brl(day.endingBalance)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      <div className="finance-card grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Receitas do período</p>
          <p className="text-base font-bold text-success tabular-nums">{brl(totals.income)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Despesas do período</p>
          <p className="text-base font-bold text-destructive tabular-nums">{brl(totals.expense)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lucro líquido</p>
          <p className={`text-base font-bold tabular-nums ${totals.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{brl(totals.profit)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Saldo final</p>
          <p className="text-base font-bold tabular-nums">{brl(totals.finalBalance)}</p>
        </div>
      </div>
    </div>
  );
}
