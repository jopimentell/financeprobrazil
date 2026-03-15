import { useState } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Crown, XCircle, Gift, Search } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const { subscriptions, plans, assignSubscription, cancelSubscription, getUserPlan } = usePlan();
  const { users } = useAuth();
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');

  const regularUsers = users.filter(u => u.role === 'user');
  const filtered = regularUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!assignModal || !selectedPlan) return;
    assignSubscription(assignModal, selectedPlan);
    toast.success('Plano atribuído com sucesso');
    setAssignModal(null);
    setSelectedPlan('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Assinaturas</h1>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-9" placeholder="Buscar usuário..."
        />
      </div>

      {/* Users with plans */}
      <div className="space-y-3">
        {filtered.map(user => {
          const plan = getUserPlan(user.id);
          const sub = subscriptions.find(s => s.userId === user.id && s.status === 'active');

          return (
            <div key={user.id} className="finance-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{plan?.name || 'Free'}</p>
                  {sub && (
                    <p className="text-xs text-muted-foreground">
                      até {new Date(sub.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setAssignModal(user.id); setSelectedPlan(''); }}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Atribuir plano"
                  >
                    <Gift className="h-4 w-4" />
                  </button>
                  {sub && (
                    <button
                      onClick={() => { cancelSubscription(sub.id); toast.success('Assinatura cancelada'); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Cancelar"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setAssignModal(null)} />
          <div className="relative bg-card rounded-t-2xl sm:rounded-xl border border-border w-[95vw] h-[90vh] sm:w-[90vw] sm:max-w-[700px] sm:h-auto sm:max-h-[85vh] lg:w-[80vw] lg:max-w-[1100px] shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border shrink-0">
              <h3 className="font-bold text-foreground">Atribuir plano</h3>
              <p className="text-sm text-muted-foreground">Selecione o plano para o usuário:</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <select
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione...</option>
                {plans.filter(p => p.isActive).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — R$ {p.priceMonthly.toFixed(2).replace('.', ',')}/mês</option>
                ))}
              </select>
            </div>
            <div className="p-4 sm:p-6 border-t border-border shrink-0">
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAssignModal(null)} className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent">Cancelar</button>
                <button onClick={handleAssign} disabled={!selectedPlan} className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">Atribuir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
