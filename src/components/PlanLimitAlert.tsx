import { usePlan } from '@/contexts/PlanContext';
import { LimitKey } from '@/types/plans';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LimitAlertProps {
  limitKey: LimitKey;
  currentUsage: number;
}

export function PlanLimitAlert({ limitKey, currentUsage }: LimitAlertProps) {
  const { checkLimit, settings } = usePlan();
  if (!settings.monetizationEnabled) return null;
  const result = checkLimit(limitKey, currentUsage);
  if (result.allowed) return null;

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">Limite atingido no plano {result.planName}</p>
        <p className="text-xs text-muted-foreground">{result.current} de {result.limit} usados. Faça upgrade para continuar.</p>
      </div>
      <Link to="/plans" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 shrink-0">
        Ver planos <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

interface FeatureGateProps {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ featureKey, children, fallback }: FeatureGateProps) {
  const { hasFeature, settings } = usePlan();
  if (!settings.monetizationEnabled || hasFeature(featureKey)) return <>{children}</>;
  return fallback ? <>{fallback}</> : null;
}
