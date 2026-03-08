import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Plan, PlanLimits, PlanFeatureRelation, Subscription, PlanSystemSettings, LimitKey, LimitCheckResult } from '@/types/plans';
import { defaultPlans, defaultPlanLimits, defaultPlanFeatures, defaultPlanSettings, allFeatures } from '@/data/planData';
import { useAuth } from '@/contexts/AuthContext';

interface PlanContextType {
  plans: Plan[];
  planLimits: PlanLimits[];
  planFeatures: PlanFeatureRelation[];
  subscriptions: Subscription[];
  settings: PlanSystemSettings;
  currentPlan: Plan | null;
  currentLimits: PlanLimits | null;
  currentSubscription: Subscription | null;
  // Feature check
  hasFeature: (featureKey: string) => boolean;
  getPlanFeatures: (planId: string) => PlanFeatureRelation[];
  getPlanEnabledKeys: (planId: string) => string[];
  // Limit check
  checkLimit: (limitKey: LimitKey, currentUsage: number) => LimitCheckResult;
  // Admin CRUD
  addPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => void;
  updatePlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  updatePlanLimits: (limits: PlanLimits) => void;
  togglePlanFeature: (planId: string, featureKey: string, enabled: boolean) => void;
  setPlanFeaturesAll: (planId: string, enabled: boolean) => void;
  // Subscriptions
  assignSubscription: (userId: string, planId: string, billingCycle?: 'monthly' | 'yearly') => void;
  cancelSubscription: (subscriptionId: string) => void;
  getUserSubscription: (userId: string) => Subscription | undefined;
  getUserPlan: (userId: string) => Plan | null;
  // Settings
  updateSettings: (s: Partial<PlanSystemSettings>) => void;
}

const PlanContext = createContext<PlanContextType | null>(null);

function load<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(`plan_${key}`); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown) { localStorage.setItem(`plan_${key}`, JSON.stringify(value)); }

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id || '';

  const [plans, setPlans] = useState<Plan[]>(() => load('plans', defaultPlans));
  const [planLimits, setPlanLimits] = useState<PlanLimits[]>(() => load('plan_limits', defaultPlanLimits));
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureRelation[]>(() => load('plan_features', defaultPlanFeatures));
  const [subscriptions, setSubs] = useState<Subscription[]>(() => load('subscriptions', []));
  const [settings, setSettings] = useState<PlanSystemSettings>(() => load('settings', defaultPlanSettings));

  useEffect(() => { save('plans', plans); }, [plans]);
  useEffect(() => { save('plan_limits', planLimits); }, [planLimits]);
  useEffect(() => { save('plan_features', planFeatures); }, [planFeatures]);
  useEffect(() => { save('subscriptions', subscriptions); }, [subscriptions]);
  useEffect(() => { save('settings', settings); }, [settings]);

  const getUserSubscription = useCallback((userId: string) =>
    subscriptions.find(s => s.userId === userId && (s.status === 'active' || s.status === 'trial')),
  [subscriptions]);

  const getUserPlan = useCallback((userId: string) => {
    const sub = getUserSubscription(userId);
    if (sub) return plans.find(p => p.id === sub.planId) || null;
    return plans.find(p => p.id === settings.defaultPlanId) || plans.find(p => p.isFree) || null;
  }, [getUserSubscription, plans, settings.defaultPlanId]);

  const currentSubscription = useMemo(() => getUserSubscription(uid) || null, [getUserSubscription, uid]);
  const currentPlan = useMemo(() => getUserPlan(uid), [getUserPlan, uid]);
  const currentLimits = useMemo(() => currentPlan ? planLimits.find(l => l.planId === currentPlan.id) || null : null, [currentPlan, planLimits]);

  const getPlanFeatures = useCallback((planId: string) => planFeatures.filter(pf => pf.planId === planId), [planFeatures]);
  const getPlanEnabledKeys = useCallback((planId: string) => planFeatures.filter(pf => pf.planId === planId && pf.enabled).map(pf => pf.featureKey), [planFeatures]);

  const hasFeature = useCallback((featureKey: string): boolean => {
    if (!settings.monetizationEnabled) return true;
    if (!currentPlan) return true;
    const rel = planFeatures.find(pf => pf.planId === currentPlan.id && pf.featureKey === featureKey);
    return rel ? rel.enabled : false;
  }, [settings.monetizationEnabled, currentPlan, planFeatures]);

  const checkLimit = useCallback((limitKey: LimitKey, currentUsage: number): LimitCheckResult => {
    if (!settings.monetizationEnabled) return { allowed: true, current: currentUsage, limit: -1, limitKey, planName: currentPlan?.name || 'Free' };
    if (!currentLimits || !currentPlan) return { allowed: true, current: currentUsage, limit: -1, limitKey, planName: 'Free' };
    let limit = -1;
    switch (limitKey) {
      case 'accounts': limit = currentLimits.maxAccounts; break;
      case 'transactions': limit = currentLimits.maxTransactionsPerMonth; break;
      case 'categories': limit = currentLimits.maxCategories; break;
      case 'goals': limit = currentLimits.maxGoals; break;
    }
    return { allowed: limit === -1 || currentUsage < limit, current: currentUsage, limit, limitKey, planName: currentPlan.name };
  }, [settings.monetizationEnabled, currentLimits, currentPlan]);

  // Admin CRUD
  const addPlan = useCallback((plan: Omit<Plan, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    setPlans(prev => [...prev, { ...plan, id, createdAt: new Date().toISOString() }]);
    setPlanLimits(prev => [...prev, { id: crypto.randomUUID(), planId: id, maxAccounts: 5, maxTransactionsPerMonth: 500, maxCategories: 20, maxGoals: 5 }]);
    // Create feature relations (all disabled by default)
    const newRels = allFeatures.map(f => ({ id: `${id}-${f.key}`, planId: id, featureKey: f.key, enabled: false }));
    setPlanFeatures(prev => [...prev, ...newRels]);
  }, []);

  const updatePlan = useCallback((plan: Plan) => setPlans(prev => prev.map(p => p.id === plan.id ? plan : p)), []);
  const deletePlan = useCallback((id: string) => {
    if (id === settings.defaultPlanId) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    setPlanLimits(prev => prev.filter(l => l.planId !== id));
    setPlanFeatures(prev => prev.filter(pf => pf.planId !== id));
  }, [settings.defaultPlanId]);

  const updatePlanLimits = useCallback((limits: PlanLimits) => setPlanLimits(prev => prev.map(l => l.planId === limits.planId ? limits : l)), []);

  const togglePlanFeature = useCallback((planId: string, featureKey: string, enabled: boolean) => {
    setPlanFeatures(prev => prev.map(pf => pf.planId === planId && pf.featureKey === featureKey ? { ...pf, enabled } : pf));
  }, []);

  const setPlanFeaturesAll = useCallback((planId: string, enabled: boolean) => {
    setPlanFeatures(prev => prev.map(pf => pf.planId === planId ? { ...pf, enabled } : pf));
  }, []);

  const assignSubscription = useCallback((userId: string, planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    setSubs(prev => prev.map(s => s.userId === userId && s.status === 'active' ? { ...s, status: 'canceled' as const } : s));
    const now = new Date();
    const end = new Date(now);
    if (billingCycle === 'monthly') end.setMonth(end.getMonth() + 1); else end.setFullYear(end.getFullYear() + 1);
    setSubs(prev => [...prev, { id: crypto.randomUUID(), userId, planId, status: 'active', startDate: now.toISOString(), endDate: end.toISOString(), billingCycle, createdAt: now.toISOString() }]);
  }, []);

  const cancelSubscription = useCallback((subId: string) => {
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'canceled' as const } : s));
  }, []);

  const updateSettings = useCallback((s: Partial<PlanSystemSettings>) => setSettings(prev => ({ ...prev, ...s })), []);

  return (
    <PlanContext.Provider value={{
      plans, planLimits, planFeatures, subscriptions, settings,
      currentPlan, currentLimits, currentSubscription,
      hasFeature, getPlanFeatures, getPlanEnabledKeys,
      checkLimit,
      addPlan, updatePlan, deletePlan, updatePlanLimits,
      togglePlanFeature, setPlanFeaturesAll,
      assignSubscription, cancelSubscription, getUserSubscription, getUserPlan,
      updateSettings,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
