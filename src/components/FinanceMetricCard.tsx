import { LucideIcon } from 'lucide-react';

interface FinanceMetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  type?: 'income' | 'expense' | 'info' | 'neutral';
  isCurrency?: boolean;
  onClick?: () => void;
}

export function FinanceMetricCard({ title, value, icon: Icon, type = 'neutral', isCurrency = true }: FinanceMetricCardProps) {
  const colorClass = {
    income: 'finance-income',
    expense: 'finance-expense',
    info: 'finance-info',
    neutral: 'text-foreground',
  }[type];

  const bgStyle = {
    income: { backgroundColor: 'hsl(142 71% 45% / 0.08)' },
    expense: { backgroundColor: 'hsl(0 84% 60% / 0.08)' },
    info: { backgroundColor: 'hsl(221 83% 53% / 0.08)' },
    neutral: { backgroundColor: 'hsl(220 14% 96%)' },
  }[type];

  return (
    <div className="finance-metric">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={bgStyle}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </div>
      <span className={`text-xl md:text-2xl font-bold ${colorClass}`}>
        {isCurrency
          ? `${value < 0 ? '-' : ''}R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : value
        }
      </span>
    </div>
  );
}
