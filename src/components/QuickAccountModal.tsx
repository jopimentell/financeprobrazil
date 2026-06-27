import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Account } from '@/types/finance';
import * as financeService from '@/services/financeService';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (account: Account) => void;
}

const COLORS = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export function QuickAccountModal({ open, onClose, onCreated }: Props) {
  const { accounts } = useFinance();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<'bank' | 'wallet' | 'credit_card'>('bank');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(''); setBank(''); setColor(COLORS[0]);
    setType('bank'); setBalance(''); setSaving(false);
  };
  const close = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe o nome da conta'); return; }
    if (!user?.id) { toast.error('Sessão inválida'); return; }
    setSaving(true);
    const acc: Omit<Account, 'id' | 'userId'> = {
      name: bank ? `${bank} — ${name}`.trim() : name.trim(),
      type,
      balance: balance ? parseFloat(balance.replace(',', '.')) || 0 : 0,
    };
    try {
      const created = await financeService.addAccount(user.id, acc);
      // Optimistically append to context (a refetch will reconcile)
      (accounts as Account[]).push(created);
      toast.success('Conta criada');
      onCreated(created);
      close();
    } catch {
      toast.error('Erro ao criar conta');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Conta corrente"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Banco</label>
            <input value={bank} onChange={(e) => setBank(e.target.value)}
              placeholder="Ex: Nubank, Inter, Itaú…"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm">
                <option value="bank">Banco</option>
                <option value="wallet">Carteira</option>
                <option value="credit_card">Cartão</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Saldo inicial</label>
              <input value={balance} onChange={(e) => setBalance(e.target.value)}
                type="number" step="0.01" placeholder="0,00"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Cor</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={close} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Criando…' : 'Criar e continuar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
