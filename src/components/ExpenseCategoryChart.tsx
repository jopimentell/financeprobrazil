import { Transaction } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseCategoryChartProps {
  transactions: Transaction[];
}

export function ExpenseCategoryChart({ transactions }: ExpenseCategoryChartProps) {
  const { getCategoryName, getCategoryColor } = useFinance();
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const byCategory: Record<string, number> = {};
  expenses.forEach(t => {
    byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount;
  });

  const data = Object.entries(byCategory).map(([id, value]) => ({
    name: getCategoryName(id),
    value,
    color: getCategoryColor(id),
  }));

  if (!data.length) return null;

  return (
    <div className="finance-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
