import { Wallet, Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export function EmptyState({ onAddIncome, onAddExpense }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(var(--finance-info) / 0.1)' }}>
        <Wallet className="h-8 w-8 finance-info" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Nenhuma transação neste período</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">Comece registrando suas receitas e despesas para acompanhar suas finanças.</p>
      <div className="flex gap-3">
        <button
          onClick={onAddIncome}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-income text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" /> Receita
        </button>
        <button
          onClick={onAddExpense}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-expense text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" /> Despesa
        </button>
      </div>
    </div>
  );
}
