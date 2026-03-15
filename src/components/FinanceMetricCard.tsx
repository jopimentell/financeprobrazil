import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FinanceMetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  type?: 'income' | 'expense' | 'info' | 'neutral';
  isCurrency?: boolean;
  onClick?: () => void;
  trend?: number | null;
}

export function FinanceMetricCard({ title, value, icon: Icon, type = 'neutral', isCurrency = true, onClick, trend }: FinanceMetricCardProps) {
  const colorClass = {
    income: 'finance-income',
    expense: 'finance-expense',
    info: 'finance-info',
    neutral: 'text-foreground',
  }[type];

  const bgStyle = {
    income: { backgroundColor: 'hsl(var(--finance-income) / 0.1)' },
    expense: { backgroundColor: 'hsl(var(--finance-expense) / 0.1)' },
    info: { backgroundColor: 'hsl(var(--finance-info) / 0.1)' },
    neutral: { backgroundColor: 'hsl(var(--muted))' },
  }[type];

  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-green-600' : trend && trend < 0 ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div
      className={`finance-metric group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, hsl(var(--${type === 'income' ? 'finance-income' : type === 'expense' ? 'finance-expense' : type === 'info' ? 'finance-info' : 'muted'}) / 0.03), transparent)` }}
      />

      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style={bgStyle}>
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <span className={`text-xl md:text-2xl font-bold tracking-tight ${colorClass}`}>
          {isCurrency
            ? `${value < 0 ? '-' : ''}R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : value
          }
        </span>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor} pb-1`}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(trend).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {onClick && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      )}
    </div>
  );
}
