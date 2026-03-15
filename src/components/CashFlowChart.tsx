import { Transaction } from '@/types/finance';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CashFlowChartProps {
  transactions: Transaction[];
  mode?: 'month' | 'year';
}

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function CashFlowChart({ transactions, mode = 'month' }: CashFlowChartProps) {
  let data: { name: string; receitas: number; despesas: number }[];

  if (mode === 'year') {
    data = monthLabels.map((name, i) => {
      const monthTx = transactions.filter(t => new Date(t.date).getMonth() === i);
      return {
        name,
        receitas: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        despesas: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  } else {
    // Group by week
    const weeks: Record<string, { receitas: number; despesas: number }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const week = `Sem ${Math.ceil(d.getDate() / 7)}`;
      if (!weeks[week]) weeks[week] = { receitas: 0, despesas: 0 };
      if (t.type === 'income') weeks[week].receitas += t.amount;
      else weeks[week].despesas += t.amount;
    });
    data = Object.entries(weeks).map(([name, v]) => ({ name, ...v }));
  }

  return (
    <div className="finance-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Fluxo de Caixa</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
          <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 16%, 47%)" />
          <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
          <Legend />
          <Bar dataKey="receitas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
