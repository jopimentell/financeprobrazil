import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Transaction, FinancialNature } from '@/types/finance';
import { useFinance } from '@/contexts/FinanceContext';
import { naturesForType, defaultNatureForType } from '@/utils/natureEngine';
import { NaturePicker } from '@/components/NaturePicker';
import { Plus, Trash2, Scissors } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

interface PartDraft {
  key: string;
  description: string;
  amount: string;
  categoryId: string;
  nature: FinancialNature;
  personId?: string;
  reserveGoal?: string;
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Splits one transaction into several parts — e.g. a R$ 300 restaurant bill
 * becomes R$ 100 own expense + R$ 200 repasse. Values are never invented:
 * the parts must add up exactly to the original amount.
 */
export function SplitTransactionModal({ open, transaction, onClose }: Props) {
  const { categories, people, addPerson, splitTransaction } = useFinance();
  const [parts, setParts] = useState<PartDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const availableCats = useMemo(
    () => categories.filter((c) => !transaction || c.type === transaction.type),
    [categories, transaction],
  );

  // Initialise drafts when the modal opens with a new transaction
  const initKey = transaction?.id || '';
  const [initialisedFor, setInitialisedFor] = useState('');
  if (open && transaction && initialisedFor !== initKey) {
    setInitialisedFor(initKey);
    setParts([
      {
        key: crypto.randomUUID(),
        description: transaction.description,
        amount: transaction.amount.toFixed(2),
        categoryId: transaction.categoryId || '',
        nature: transaction.nature && transaction.nature !== 'unclassified'
          ? transaction.nature
          : defaultNatureForType(transaction.type),
        personId: transaction.personId,
      },
      {
        key: crypto.randomUUID(),
        description: transaction.description,
        amount: '0.00',
        categoryId: transaction.categoryId || '',
        nature: naturesForType(transaction.type)[1]?.value || defaultNatureForType(transaction.type),
      },
    ]);
  }

  if (!transaction) return null;

  const total = transaction.amount;
  const sum = parts.reduce((acc, p) => acc + (parseFloat(p.amount.replace(',', '.')) || 0), 0);
  const diff = +(total - sum).toFixed(2);

  const update = (key: string, patch: Partial<PartDraft>) =>
    setParts((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const addPart = () =>
    setParts((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        description: transaction.description,
        amount: diff > 0 ? diff.toFixed(2) : '0.00',
        categoryId: transaction.categoryId || '',
        nature: defaultNatureForType(transaction.type),
      },
    ]);

  const removePart = (key: string) =>
    setParts((prev) => (prev.length <= 2 ? prev : prev.filter((p) => p.key !== key)));

  const close = () => { setInitialisedFor(''); setSaving(false); onClose(); };

  const handleSave = async () => {
    if (Math.abs(diff) > 0.009) {
      toast.error(`As partes precisam somar ${fmt(total)} (faltam ${fmt(diff)})`);
      return;
    }
    if (parts.some((p) => (parseFloat(p.amount.replace(',', '.')) || 0) <= 0)) {
      toast.error('Cada parte precisa ter valor maior que zero');
      return;
    }
    setSaving(true);
    try {
      await splitTransaction(transaction, parts.map((p) => ({
        description: p.description,
        amount: parseFloat(p.amount.replace(',', '.')) || 0,
        categoryId: p.categoryId,
        nature: p.nature,
        personId: p.personId,
        reserveGoal: p.reserveGoal,
      })));
      toast.success(`Lançamento dividido em ${parts.length} partes`);
      close();
    } catch {
      toast.error('Erro ao dividir o lançamento');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-4 w-4" /> Dividir lançamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="finance-card !p-3">
            <p className="text-xs text-muted-foreground">Original</p>
            <p className="text-sm font-medium truncate">{transaction.description}</p>
            <p className="text-lg font-bold">{fmt(total)}</p>
          </div>

          {parts.map((p, i) => (
            <div key={p.key} className="rounded-xl border border-border p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Parte {i + 1}</span>
                {parts.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePart(p.key)}
                    className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={p.description}
                  onChange={(e) => update(p.key, { description: e.target.value })}
                  placeholder="Descrição"
                  className="px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
                />
                <input
                  value={p.amount}
                  onChange={(e) => update(p.key, { amount: e.target.value })}
                  type="number"
                  step="0.01"
                  className="px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
                />
              </div>

              <select
                value={p.categoryId}
                onChange={(e) => update(p.key, { categoryId: e.target.value })}
                className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
              >
                <option value="">Sem categoria</option>
                {availableCats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <NaturePicker
                compact
                type={transaction.type}
                people={people}
                value={{ nature: p.nature, personId: p.personId, reserveGoal: p.reserveGoal }}
                onChange={(v) => update(p.key, {
                  nature: v.nature,
                  personId: v.personId,
                  reserveGoal: v.reserveGoal,
                })}
                onCreatePerson={(name) => addPerson({ name })}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addPart}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-dashed border-border hover:bg-accent text-xs font-medium min-h-[44px]"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar parte
          </button>

          <div
            className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${
              Math.abs(diff) < 0.01
                ? 'bg-finance-income/10 text-finance-income'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            <span className="font-medium">Soma das partes</span>
            <span className="font-bold">
              {fmt(sum)}{Math.abs(diff) >= 0.01 && ` · faltam ${fmt(diff)}`}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={close} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || Math.abs(diff) >= 0.01}>
              {saving ? 'Dividindo…' : 'Dividir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
