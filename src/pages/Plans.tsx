import { useState } from 'react';
import { usePlan } from '@/contexts/PlanContext';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';

const planIcons: Record<string, React.ReactNode> = {
  'plan-free': <Zap className="h-6 w-6" />,
  'plan-pro': <Sparkles className="h-6 w-6" />,
  'plan-premium': <Crown className="h-6 w-6" />,
};

export default function PlansPage() {
  const { plans, planLimits, currentPlan, settings } = usePlan();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const activePlans = plans.filter(p => p.isActive);

  const formatLimit = (val: number) => val === -1 ? 'Ilimitado' : String(val);

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
        <p className="text-muted-foreground">Desbloqueie todo o potencial do FinancePro</p>
        {!settings.monetizationEnabled && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Acesso completo liberado para todos — aproveite!
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Anual <span className="text-xs text-primary ml-1">-20%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activePlans.map(plan => {
          const limits = planLimits.find(l => l.planId === plan.id);
          const isCurrent = currentPlan?.id === plan.id;
          const isPro = plan.id === 'plan-pro';
          const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;

          return (
            <div
              key={plan.id}
              className={`finance-card relative flex flex-col ${isPro ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Mais popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPro ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {planIcons[plan.id] || <Zap className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                  {plan.badge && <span className="text-xs text-muted-foreground">{plan.badge}</span>}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

              <div className="mb-6">
                {plan.isFree ? (
                  <div className="text-3xl font-bold text-foreground">Grátis</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">R$ {price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-sm text-muted-foreground">/{billing === 'monthly' ? 'mês' : 'ano'}</span>
                  </div>
                )}
              </div>

              {limits && (
                <ul className="space-y-2.5 mb-6 flex-1">
                  <LimitRow label="Contas" value={formatLimit(limits.maxAccounts)} />
                  <LimitRow label="Transações/mês" value={formatLimit(limits.maxTransactionsPerMonth)} />
                  <LimitRow label="Categorias" value={formatLimit(limits.maxCategories)} />
                  <LimitRow label="Metas" value={formatLimit(limits.maxGoals)} />
                  <FeatureRow label="Exportações" allowed={limits.allowExports} />
                  <FeatureRow label="Relatórios" allowed={limits.allowReports} />
                  <FeatureRow label="Analytics avançado" allowed={limits.allowAdvancedAnalytics} />
                </ul>
              )}

              <button
                onClick={() => {
                  if (isCurrent) return;
                  if (!settings.monetizationEnabled) {
                    toast.info('Monetização desativada. Todos os recursos estão liberados.');
                    return;
                  }
                  toast.info('Integração com gateway de pagamento em breve!');
                }}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isCurrent
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : isPro
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border border-border text-foreground hover:bg-accent'
                }`}
              >
                {isCurrent ? 'Plano atual' : plan.isFree ? 'Começar grátis' : 'Fazer upgrade'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span className="text-foreground">{label}:</span>
      <span className="text-muted-foreground font-medium ml-auto">{value}</span>
    </li>
  );
}

function FeatureRow({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {allowed ? (
        <Check className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
      <span className={allowed ? 'text-foreground' : 'text-muted-foreground/50'}>{label}</span>
    </li>
  );
}
