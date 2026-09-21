import { useState } from 'react';
import { FinancialNature, Person, Debt, TransactionType } from '@/types/finance';
import { naturesForType, natureMeta } from '@/utils/natureEngine';
import { Plus, Check } from 'lucide-react';

export interface NatureValue {
  nature: FinancialNature;
  personId?: string;
  relatedDebtId?: string;
  reserveGoal?: string;
}

interface NaturePickerProps {
  type: TransactionType;
  value: NatureValue;
  people: Person[];
  debts?: Debt[];
  onChange: (v: NatureValue) => void;
  onCreatePerson?: (name: string) => Promise<{ id: string } | null>;
  /** Show the explanation text under the options */
  compact?: boolean;
}

/**
 * Second classification layer selector: what the movement represents
 * financially, plus the related person / debt / reserve goal when relevant.
 */
export function NaturePicker({
  type,
  value,
  people,
  debts = [],
  onChange,
  onCreatePerson,
  compact = false,
}: NaturePickerProps) {
  const [newPerson, setNewPerson] = useState('');
  const [creating, setCreating] = useState(false);
  const options = naturesForType(type);
  const meta = natureMeta(value.nature);

  const createPerson = async () => {
    const name = newPerson.trim();
    if (!name || !onCreatePerson) return;
    const created = await onCreatePerson(name);
    if (created) onChange({ ...value, personId: created.id });
    setNewPerson('');
    setCreating(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          O que essa movimentação representa?
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {options.map((opt) => {
            const active = value.nature === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ nature: opt.value })}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium text-left min-h-[44px] transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent text-foreground'
                }`}
              >
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {!compact && (
          <p className="text-[11px] text-muted-foreground mt-1.5">{meta.description}</p>
        )}
      </div>

      {meta.requiresPerson && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Pessoa relacionada
          </label>
          {creating ? (
            <div className="flex gap-1.5">
              <input
                autoFocus
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), createPerson())}
                placeholder="Nome da pessoa"
                className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
              />
              <button
                type="button"
                onClick={createPerson}
                className="px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium min-h-[44px]"
              >
                Salvar
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <select
                value={value.personId || ''}
                onChange={(e) => onChange({ ...value, personId: e.target.value || undefined })}
                className="flex-1 px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
              >
                <option value="">Selecione…</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {onCreatePerson && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="px-3 rounded-lg border border-border hover:bg-accent min-h-[44px]"
                  title="Nova pessoa"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {meta.allowsDebt && debts.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Dívida relacionada (opcional)
          </label>
          <select
            value={value.relatedDebtId || ''}
            onChange={(e) => onChange({ ...value, relatedDebtId: e.target.value || undefined })}
            className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
          >
            <option value="">Nenhuma</option>
            {debts.map((d) => (
              <option key={d.id} value={d.id}>{d.creditor}</option>
            ))}
          </select>
        </div>
      )}

      {meta.allowsGoal && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">
            Objetivo da reserva (opcional)
          </label>
          <input
            value={value.reserveGoal || ''}
            onChange={(e) => onChange({ ...value, reserveGoal: e.target.value || undefined })}
            placeholder="Ex.: Reserva de emergência"
            className="w-full px-2.5 py-2 rounded-lg border border-input bg-background text-sm min-h-[44px]"
          />
        </div>
      )}
    </div>
  );
}
