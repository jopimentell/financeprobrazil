import { useState, useMemo } from 'react';
import { Transaction, Account } from '@/types/finance';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Sparkles, Check, X } from 'lucide-react';
import { findSimilar, addRule, normalizeForRule } from '@/utils/transferRules';
import { toast } from 'sonner';

interface ConvertToTransferModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  /** Full pool to search for similar transactions */
  allTransactions: Transaction[];
  getAccountName: (id: string) => string;
  updateTransaction: (t: Transaction) => void | Promise<void>;
}

/**
 * Smart Convert-to-Transfer flow:
 *  - For income: current account is destination → ask origin.
 *  - For expense: current account is origin → ask destination.
 *  - After confirm: detect similar transactions and offer to apply to all.
 */
export function ConvertToTransferModal({
  open,
  onClose,
  transaction,
  accounts,
  allTransactions,
  getAccountName,
  updateTransaction,
}: ConvertToTransferModalProps) {
  const [otherAccountId, setOtherAccountId] = useState('');
  const [step, setStep] = useState<'pick' | 'similar'>('pick');
  const [similar, setSimilar] = useState<Transaction[]>([]);

  const side = transaction?.type === 'income' ? 'income' : 'expense';
  const isIncoming = side === 'income';

  const otherAccounts = useMemo(
    () => (transaction ? accounts.filter((a) => a.id !== transaction.accountId) : []),
    [accounts, transaction],
  );

  const reset = () => {
    setOtherAccountId('');
    setStep('pick');
    setSimilar([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  if (!open || !transaction) return null;

  const handleConfirm = async () => {
    if (!otherAccountId) {
      toast.error('Selecione a conta');
      return;
    }
    // For incoming: source=other, dest=current. For outgoing: source=current, dest=other.
    const accountId = isIncoming ? otherAccountId : transaction.accountId;
    const transferAccountId = isIncoming ? transaction.accountId : otherAccountId;

    await updateTransaction({
      ...transaction,
      type: 'transfer',
      accountId,
      transferAccountId,
      categoryId: '',
    });

    // Persist a rule
    addRule({
      pattern: normalizeForRule(transaction.description),
      side,
      currentAccountId: transaction.accountId,
      otherAccountId,
    });

    // Find similar
    const matches = findSimilar(transaction, allTransactions);
    if (matches.length > 0) {
      setSimilar(matches);
      setStep('similar');
      toast.success('Convertido — encontramos transações parecidas');
    } else {
      toast.success('Convertido em transferência');
      close();
    }
  };

  const handleApplyAll = async () => {
    const accountId = isIncoming ? otherAccountId : transaction.accountId;
    // For outgoing the destination is fixed; for incoming the source is fixed.
    await Promise.all(
      similar.map((t) => {
        const aId = isIncoming ? otherAccountId : t.accountId;
        const dId = isIncoming ? t.accountId : otherAccountId;
        return updateTransaction({
          ...t,
          type: 'transfer',
          accountId: aId,
          transferAccountId: dId,
          categoryId: '',
        });
      }),
    );
    toast.success(`${similar.length} transações convertidas`);
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={close}
    >
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div
        className="relative bg-card rounded-2xl shadow-lg w-full max-w-md p-5 space-y-4 animate-fade-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold">Converter em transferência</h3>
              <p className="text-xs text-muted-foreground truncate">
                {transaction.description} • R${' '}
                {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <button onClick={close} className="p-1 rounded hover:bg-accent shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'pick' && (
          <>
            <div className="rounded-xl border border-border bg-accent/40 p-3 flex items-center gap-3">
              {isIncoming ? (
                <ArrowDownLeft className="h-5 w-5 finance-income shrink-0" />
              ) : (
                <ArrowUpRight className="h-5 w-5 finance-expense shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-medium">
                  {isIncoming ? 'Entrada em' : 'Saída de'}:{' '}
                  <span className="text-foreground">{getAccountName(transaction.accountId)}</span>
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {isIncoming
                    ? 'De qual conta esse dinheiro veio?'
                    : 'Para qual conta esse dinheiro foi?'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {otherAccounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setOtherAccountId(a.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl border text-left text-sm transition-colors ${
                    otherAccountId === a.id
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <span className="font-medium truncate">{a.name}</span>
                  {otherAccountId === a.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              ))}
              {!otherAccounts.length && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Cadastre outra conta para registrar transferências.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={close} className="px-3 py-2 text-sm rounded-lg hover:bg-accent">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!otherAccountId}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                Converter
              </button>
            </div>
          </>
        )}

        {step === 'similar' && (
          <>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-medium">
                  Encontramos {similar.length} transações parecidas
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Aplicar a mesma regra de transferência a elas?
                </p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
              {similar.slice(0, 30).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 px-2 py-2 rounded-lg bg-accent/40 text-xs"
                >
                  <span className="truncate">{t.description}</span>
                  <span className="shrink-0 text-muted-foreground">
                    R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {similar.length > 30 && (
                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  +{similar.length - 30} outras…
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
              <button onClick={close} className="px-3 py-2 text-sm rounded-lg hover:bg-accent">
                Apenas esta
              </button>
              <button
                onClick={handleApplyAll}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium"
              >
                Aplicar a todas ({similar.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
