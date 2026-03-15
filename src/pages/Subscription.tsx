import { usePlan } from '@/contexts/PlanContext';
import { useFinance } from '@/contexts/FinanceContext';
import { Progress } from '@/components/ui/progress';
import { Crown, ArrowRight, Sparkles, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { allFeatures, featureCategoryLabels } from '@/data/planData';

export default function SubscriptionPage() {
  const { currentPlan, currentLimits, currentSubscription, settings, getPlanEnabledKeys } = usePlan();
  const { accounts, categories, transactions } = useFinance();

  const now = new Date();
  const monthTx = transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;

  const enabledKeys = currentPlan ? getPlanEnabledKeys(currentPlan.id) : [];

  const usageItems = currentLimits ? [
    { label: 'Contas', current: accounts.length, max: currentLimits.maxAccounts },
    { label: 'Transações (mês)', current: monthTx, max: currentLimits.maxTransactionsPerMonth },
    { label: 'Categorias', current: categories.length, max: currentLimits.maxCategories },
  ] : [];

  const featureCategories = [...new Set(allFeatures.map(f => f.category))];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground">Minha Assinatura</h1>

      {!settings.monetizationEnabled && (
        <div className="finance-card flex items-center gap-3 border-primary/30 bg-primary/5">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Acesso completo liberado</p>
            <p className="text-xs text-muted-foreground">Todos os recursos estão disponíveis para você.</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="finance-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{currentPlan?.name || 'Free'}</h2>
              <p className="text-xs text-muted-foreground">{currentPlan?.description}</p>
            </div>
          </div>
          {currentSubscription && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${currentSubscription.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
              {currentSubscription.status === 'active' ? 'Ativo' : currentSubscription.status === 'trial' ? 'Trial' : 'Cancelado'}
            </span>
          )}
        </div>
        {currentSubscription && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Início</p><p className="font-medium text-foreground">{new Date(currentSubscription.startDate).toLocaleDateString('pt-BR')}</p></div>
            <div><p className="text-muted-foreground">Próxima cobrança</p><p className="font-medium text-foreground">{new Date(currentSubscription.endDate).toLocaleDateString('pt-BR')}</p></div>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{enabledKeys.length} de {allFeatures.length} funcionalidades ativas</p>
      </div>

      {/* Usage */}
      <div className="finance-card space-y-4">
        <h3 className="font-semibold text-foreground">Uso do plano</h3>
        {usageItems.map(item => {
          const isUnlimited = item.max === -1;
          const pct = isUnlimited ? 0 : Math.min((item.current / item.max) * 100, 100);
          const isNear = !isUnlimited && pct >= 80;
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{item.label}</span>
                <span className={`font-medium ${isNear ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {item.current} de {isUnlimited ? '∞' : item.max}
                </span>
              </div>
              <Progress value={isUnlimited ? 5 : pct} className="h-2" />
            </div>
          );
        })}
      </div>

      {/* Features list */}
      <div className="finance-card space-y-4">
        <h3 className="font-semibold text-foreground">Funcionalidades do plano</h3>
        {featureCategories.map(cat => {
          const catFeatures = allFeatures.filter(f => f.category === cat);
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{featureCategoryLabels[cat]}</p>
              <div className="space-y-1">
                {catFeatures.map(f => {
                  const enabled = !settings.monetizationEnabled || enabledKeys.includes(f.key);
                  return (
                    <div key={f.key} className="flex items-center gap-2 text-sm">
                      {enabled ? <Check className="h-3.5 w-3.5 text-primary shrink-0" /> : <X className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
                      <span className={enabled ? 'text-foreground' : 'text-muted-foreground/50'}>{f.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {currentPlan?.isFree && settings.monetizationEnabled && (
        <Link to="/plans" className="finance-card flex items-center justify-between hover:border-primary/30 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
            <div>
              <p className="font-semibold text-foreground">Faça upgrade para o Pro</p>
              <p className="text-xs text-muted-foreground">Desbloqueie mais funcionalidades e limites</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      )}
    </div>
  );
}
