import { LucideIcon } from 'lucide-react';

interface FinanceMetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  type?: 'income' | 'expense' | 'info' | 'neutral';
}

export function FinanceMetricCard({ title, value, icon: Icon, type = 'neutral' }: FinanceMetricCardProps) {
  const colorClass = {
    income: 'finance-income',
    expense: 'finance-expense',
    info: 'finance-info',
    neutral: 'text-foreground',
  }[type];

  return (
    <div className="finance-metric">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <span className={`text-2xl font-bold ${colorClass}`}>
        {value < 0 ? '-' : ''}R$ {Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    </div>
  );
}
