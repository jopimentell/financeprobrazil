import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { normalizeMerchant } from '@/utils/merchantNormalizer';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Lightbulb, Receipt, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface CategoryDetailModalProps {
  open: boolean;
  onClose: () => void;
  categoryId: string | null;
  year: number;
  transactions: Transaction[];
}

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function CategoryDetailModal({ open, onClose, categoryId, year, transactions }: CategoryDetailModalProps) {
  const { getCategoryName, getCategoryColor } = useFinance();

  const categoryTx = useMemo(
    () => transactions.filter((t) => t.categoryId === categoryId),
    [transactions, categoryId],
  );

  const stats = useMemo(() => {
    if (!categoryTx.length) return null;
    const total = categoryTx.reduce((s, t) => s + t.amount, 0);
    const amounts = categoryTx.map((t) => t.amount);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const avgTicket = total / categoryTx.length;
    const monthsWithTx = new Set(categoryTx.map((t) => new Date(t.date).getMonth())).size || 1;
    const monthlyAvg = total / monthsWithTx;
    return {
      total,
      count: categoryTx.length,
      max,
      min,
      avgTicket,
      monthlyAvg,
    };
  }, [categoryTx]);

  const merchantGroups = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number; txs: Transaction[] }>();
    categoryTx.forEach((t) => {
      const key = normalizeMerchant(t.description);
      const ex = map.get(key);
      if (ex) {
        ex.total += t.amount;
        ex.count += 1;
        ex.txs.push(t);
      } else {
        map.set(key, { name: key, total: t.amount, count: 1, txs: [t] });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [categoryTx]);

  const monthlyTimeline = useMemo(
    () =>
      monthNames.map((name, i) => {
        const mTx = categoryTx.filter((t) => new Date(t.date).getMonth() === i);
        return { name, value: mTx.reduce((s, t) => s + t.amount, 0) };
      }),
    [categoryTx],
  );

  const largestTx = useMemo(
    () => [...categoryTx].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [categoryTx],
  );

  const insights = useMemo(() => {
    if (!stats || !merchantGroups.length) return [];
    const out: string[] = [];
    const top3 = merchantGroups.slice(0, 3).reduce((s, m) => s + m.total, 0);
    const top3Pct = (top3 / stats.total) * 100;
    if (top3Pct > 60 && merchantGroups.length >= 3) {
      out.push(`${top3Pct.toFixed(0)}% das suas despesas vêm de apenas 3 estabelecimentos.`);
    }
    const top = merchantGroups[0];
    out.push(`${top.name} representa ${((top.total / stats.total) * 100).toFixed(0)}% dos gastos desta categoria.`);
    if (top.count > 1) {
      out.push(`Você gasta em média R$ ${(top.total / top.count).toFixed(2)} por compra em ${top.name}.`);
    }
    // Month-over-month comparison (last vs previous with data)
    const monthsWithData = monthlyTimeline.filter((m) => m.value > 0);
    if (monthsWithData.length >= 2) {
      const last = monthsWithData[monthsWithData.length - 1];
      const prev = monthsWithData[monthsWithData.length - 2];
      if (prev.value > 0) {
        const diff = ((last.value - prev.value) / prev.value) * 100;
        const dir = diff >= 0 ? 'aumentou' : 'diminuiu';
        out.push(`Em ${last.name} seus gastos ${dir} ${Math.abs(diff).toFixed(0)}% comparado a ${prev.name}.`);
      }
    }
    return out;
  }, [stats, merchantGroups, monthlyTimeline]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  const categoryName = categoryId ? getCategoryName(categoryId) : '';
  const categoryColor = categoryId ? getCategoryColor(categoryId) : '#6b7280';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 sticky top-0 bg-background z-10 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: categoryColor }} />
            <span className="truncate">{categoryName}</span>
            <span className="ml-auto text-xs text-muted-foreground font-normal">{year}</span>
          </DialogTitle>
        </DialogHeader>

        {!stats ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Sem transações nesta categoria.</div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                <p className="text-base font-bold mt-0.5 truncate">{fmt(stats.total)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transações</p>
                <p className="text-base font-bold mt-0.5">{stats.count}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Média mensal</p>
                <p className="text-base font-bold mt-0.5 truncate">{fmt(stats.monthlyAvg)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Maior gasto</p>
                <p className="text-base font-bold mt-0.5 finance-expense truncate">{fmt(stats.max)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Menor</p>
                <p className="text-base font-bold mt-0.5 truncate">{fmt(stats.min)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ticket médio</p>
                <p className="text-base font-bold mt-0.5 truncate">{fmt(stats.avgTicket)}</p>
              </div>
            </div>

            {/* Smart Insights */}
            {insights.length > 0 && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold">Insights</span>
                </div>
                <ul className="space-y-1.5">
                  {insights.map((insight, i) => (
                    <li key={i} className="text-xs text-foreground/90 flex gap-2">
                      <span className="text-primary shrink-0">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Top Merchants */}
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" /> Principais origens
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={merchantGroups.slice(0, 5)} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={90}
                    tickFormatter={(v) => (v.length > 14 ? v.slice(0, 13) + '…' : v)}
                  />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="total" fill={categoryColor} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {merchantGroups.slice(0, 5).map((m) => (
                  <div key={m.name} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium truncate">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{m.count} tx</span>
                    </div>
                    <span className="text-xs font-semibold shrink-0 ml-2">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold mb-2">Evolução mensal</h4>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={50} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={categoryColor}
                    strokeWidth={2}
                    dot={{ r: 3, fill: categoryColor }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Largest transactions */}
            <div>
              <h4 className="text-xs font-semibold mb-2">Maiores transações</h4>
              <div className="space-y-1">
                {largestTx.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-accent/50 border-b border-border/40 last:border-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${categoryColor}20` }}>
                      {t.type === 'income' ? (
                        <ArrowUpRight className="h-3.5 w-3.5 finance-income" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 finance-expense" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <p className={`text-xs font-semibold shrink-0 ${t.type === 'income' ? 'finance-income' : 'finance-expense'}`}>
                      {fmt(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
