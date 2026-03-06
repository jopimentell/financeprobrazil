import { Investment } from '@/types/finance';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface InvestmentCardProps {
  investment: Investment;
  onEdit?: (i: Investment) => void;
  onDelete?: (id: string) => void;
}

const typeLabels: Record<string, string> = {
  stocks: 'Ações',
  crypto: 'Cripto',
  fixed_income: 'Renda Fixa',
};

export function InvestmentCard({ investment, onEdit, onDelete }: InvestmentCardProps) {
  const profitPercent = ((investment.profit / investment.investedAmount) * 100).toFixed(1);
  const isPositive = investment.profit >= 0;

  return (
    <div className="finance-card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold">{investment.name}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{typeLabels[investment.type]}</span>
        </div>
        <div className="flex gap-1">
          {onEdit && <button onClick={() => onEdit(investment)} className="text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground">Editar</button>}
          {onDelete && <button onClick={() => onDelete(investment.id)} className="text-xs px-2 py-1 rounded hover:bg-accent finance-expense">Excluir</button>}
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Investido</span>
          <span>R$ {investment.investedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valor Atual</span>
          <span className="font-semibold">R$ {investment.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Rentabilidade</span>
          <span className={`flex items-center gap-1 font-semibold ${isPositive ? 'finance-income' : 'finance-expense'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? '+' : ''}R$ {investment.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({profitPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
