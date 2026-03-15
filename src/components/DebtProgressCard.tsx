import { Debt } from '@/types/finance';

interface DebtProgressCardProps {
  debt: Debt;
  onEdit?: (d: Debt) => void;
  onDelete?: (id: string) => void;
}

export function DebtProgressCard({ debt, onEdit, onDelete }: DebtProgressCardProps) {
  const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;

  return (
    <div className="finance-card">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold">{debt.creditor}</h4>
          <p className="text-xs text-muted-foreground">{debt.paidInstallments}/{debt.installments} parcelas • {debt.interestRate}% juros</p>
        </div>
        <div className="flex gap-1">
          {onEdit && <button onClick={() => onEdit(debt)} className="text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground">Editar</button>}
          {onDelete && <button onClick={() => onDelete(debt.id)} className="text-xs px-2 py-1 rounded hover:bg-accent finance-expense">Excluir</button>}
        </div>
      </div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">Pago: R$ {(debt.totalAmount - debt.remainingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <span className="font-medium">R$ {debt.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="w-full bg-accent rounded-full h-3">
        <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{progress.toFixed(0)}% quitado</span>
        <span>Restante: R$ {debt.remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
