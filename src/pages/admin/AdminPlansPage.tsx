import { useState } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import { Plan, PlanLimits } from '@/types/plans';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Save, X, Settings, ChevronDown, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { allFeatures, featureCategoryLabels } from '@/data/planData';

export default function AdminPlansPage() {
  const { plans, planLimits, settings, updateSettings, updatePlan, deletePlan, addPlan, updatePlanLimits, getPlanFeatures, togglePlanFeature, setPlanFeaturesAll } = usePlan();
  const [editing, setEditing] = useState<string | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<string | null>(null);
  const [expandedLimits, setExpandedLimits] = useState<string | null>(null);

  const categories = [...new Set(allFeatures.map(f => f.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Gestão de Planos</h1>
        <button
          onClick={() => addPlan({ name: 'Novo Plano', description: 'Descrição do plano', priceMonthly: 9.90, priceYearly: 99.90, isActive: false, isFree: false })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Novo Plano
        </button>
      </div>

      {/* Monetization toggle */}
      <div className="finance-card flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground flex items-center gap-2"><Settings className="h-4 w-4" /> Monetização</p>
          <p className="text-xs text-muted-foreground">{settings.monetizationEnabled ? 'Limites e features estão sendo aplicados por plano' : 'Todos os usuários têm acesso completo a todas as features'}</p>
        </div>
        <button
          onClick={() => { updateSettings({ monetizationEnabled: !settings.monetizationEnabled }); toast.success(settings.monetizationEnabled ? 'Monetização desativada' : 'Monetização ativada'); }}
          className={`w-11 h-6 rounded-full transition-colors relative ${settings.monetizationEnabled ? 'bg-primary' : 'bg-border'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-card shadow absolute top-0.5 transition-transform ${settings.monetizationEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map(plan => {
          const limits = planLimits.find(l => l.planId === plan.id);
          const isEditing = editing === plan.id;
          const showFeatures = expandedFeatures === plan.id;
          const showLimits = expandedLimits === plan.id;
          const planFeatRels = getPlanFeatures(plan.id);
          const enabledCount = planFeatRels.filter(pf => pf.enabled).length;

          return (
            <div key={plan.id} className="finance-card space-y-0">
              {isEditing ? (
                <PlanEditForm plan={plan} onSave={(p) => { updatePlan(p); setEditing(null); toast.success('Plano atualizado'); }} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{plan.isActive ? 'Ativo' : 'Inativo'}</span>
                      {plan.isFree && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">Gratuito</span>}
                      <span className="text-xs text-muted-foreground">{enabledCount}/{allFeatures.length} features</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <p className="text-sm font-medium text-foreground mt-1">R$ {plan.priceMonthly.toFixed(2).replace('.', ',')}/mês — R$ {plan.priceYearly.toFixed(2).replace('.', ',')}/ano</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(plan.id)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title="Editar"><Edit2 className="h-4 w-4" /></button>
                    {!plan.isFree && <button onClick={() => { deletePlan(plan.id); toast.success('Plano removido'); }} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              )}

              {/* Limits toggle */}
              <button
                onClick={() => setExpandedLimits(showLimits ? null : plan.id)}
                className="flex items-center gap-2 w-full pt-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showLimits ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Limites de uso
              </button>
              {showLimits && limits && (
                <LimitsEditForm limits={limits} onSave={(l) => { updatePlanLimits(l); toast.success('Limites atualizados'); }} />
              )}

              {/* Features toggle */}
              <button
                onClick={() => setExpandedFeatures(showFeatures ? null : plan.id)}
                className="flex items-center gap-2 w-full pt-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showFeatures ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Features ({enabledCount} ativas)
              </button>
              {showFeatures && (
                <div className="pt-3 space-y-4">
                  {/* Bulk actions */}
                  <div className="flex gap-2">
                    <button onClick={() => { setPlanFeaturesAll(plan.id, true); toast.success('Todas as features ativadas'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <ToggleRight className="h-3.5 w-3.5" /> Ativar todas
                    </button>
                    <button onClick={() => { setPlanFeaturesAll(plan.id, false); toast.success('Todas as features desativadas'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-muted text-muted-foreground hover:bg-accent transition-colors">
                      <ToggleLeft className="h-3.5 w-3.5" /> Desativar todas
                    </button>
                  </div>

                  {categories.map(cat => {
                    const catFeatures = allFeatures.filter(f => f.category === cat);
                    return (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">{featureCategoryLabels[cat]}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {catFeatures.map(feat => {
                            const rel = planFeatRels.find(pf => pf.featureKey === feat.key);
                            const enabled = rel?.enabled || false;
                            return (
                              <label key={feat.key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${enabled ? 'bg-primary/5 text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  onChange={(e) => togglePlanFeature(plan.id, feat.key, e.target.checked)}
                                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{feat.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{feat.description}</p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanEditForm({ plan, onSave, onCancel }: { plan: Plan; onSave: (p: Plan) => void; onCancel: () => void }) {
  const [form, setForm] = useState(plan);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nome" />
        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Descrição" />
        <input type="number" step="0.01" value={form.priceMonthly} onChange={e => setForm({ ...form, priceMonthly: parseFloat(e.target.value) || 0 })} className="input-field" placeholder="Preço mensal" />
        <input type="number" step="0.01" value={form.priceYearly} onChange={e => setForm({ ...form, priceYearly: parseFloat(e.target.value) || 0 })} className="input-field" placeholder="Preço anual" />
      </div>
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" /> Ativo</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} className="rounded" /> Gratuito</label>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(form)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground"><Save className="h-3.5 w-3.5" /> Salvar</button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-accent"><X className="h-3.5 w-3.5" /> Cancelar</button>
      </div>
    </div>
  );
}

function LimitsEditForm({ limits, onSave }: { limits: PlanLimits; onSave: (l: PlanLimits) => void }) {
  const [form, setForm] = useState(limits);
  return (
    <div className="pt-3 space-y-3">
      <p className="text-xs text-muted-foreground">Use -1 para ilimitado</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className="text-xs text-muted-foreground">Contas</label><input type="number" value={form.maxAccounts} onChange={e => setForm({ ...form, maxAccounts: parseInt(e.target.value) })} className="input-field" /></div>
        <div><label className="text-xs text-muted-foreground">Transações/mês</label><input type="number" value={form.maxTransactionsPerMonth} onChange={e => setForm({ ...form, maxTransactionsPerMonth: parseInt(e.target.value) })} className="input-field" /></div>
        <div><label className="text-xs text-muted-foreground">Categorias</label><input type="number" value={form.maxCategories} onChange={e => setForm({ ...form, maxCategories: parseInt(e.target.value) })} className="input-field" /></div>
        <div><label className="text-xs text-muted-foreground">Metas</label><input type="number" value={form.maxGoals} onChange={e => setForm({ ...form, maxGoals: parseInt(e.target.value) })} className="input-field" /></div>
      </div>
      <button onClick={() => onSave(form)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground"><Save className="h-3.5 w-3.5" /> Salvar limites</button>
    </div>
  );
}
