import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Plan, PlanLimits, PlanFeatureRelation, Subscription, PlanSystemSettings, LimitKey, LimitCheckResult } from '@/types/plans';
import { allFeatures } from '@/data/planData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PlanContextType {
  plans: Plan[];
  planLimits: PlanLimits[];
  planFeatures: PlanFeatureRelation[];
  subscriptions: Subscription[];
  settings: PlanSystemSettings;
  currentPlan: Plan | null;
  currentLimits: PlanLimits | null;
  currentSubscription: Subscription | null;
  loading: boolean;
  hasFeature: (featureKey: string) => boolean;
  getPlanFeatures: (planId: string) => PlanFeatureRelation[];
  getPlanEnabledKeys: (planId: string) => string[];
  checkLimit: (limitKey: LimitKey, currentUsage: number) => LimitCheckResult;
  addPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => void;
  updatePlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  updatePlanLimits: (limits: PlanLimits) => void;
  togglePlanFeature: (planId: string, featureKey: string, enabled: boolean) => void;
  setPlanFeaturesAll: (planId: string, enabled: boolean) => void;
  assignSubscription: (userId: string, planId: string, billingCycle?: 'monthly' | 'yearly') => void;
  cancelSubscription: (subscriptionId: string) => void;
  getUserSubscription: (userId: string) => Subscription | undefined;
  getUserPlan: (userId: string) => Plan | null;
  updateSettings: (s: Partial<PlanSystemSettings>) => void;
}

const PlanContext = createContext<PlanContextType | null>(null);

// ---- DB → App type mappers ----
function dbToPlan(row: any): Plan {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceMonthly: Number(row.price_monthly),
    priceYearly: Number(row.price_yearly),
    isActive: row.is_active,
    isFree: row.is_free,
    badge: row.badge ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.created_at,
  };
}

function dbToLimits(row: any): PlanLimits {
  return {
    id: row.id,
    planId: row.plan_id,
    maxAccounts: row.max_accounts,
    maxTransactionsPerMonth: row.max_transactions_per_month,
    maxCategories: row.max_categories,
    maxGoals: row.max_goals,
  };
}

function dbToFeature(row: any): PlanFeatureRelation {
  return { id: row.id, planId: row.plan_id, featureKey: row.feature_key, enabled: row.enabled };
}

function dbToSubscription(row: any): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    billingCycle: row.billing_cycle,
    createdAt: row.created_at,
  };
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.id || '';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [planLimits, setPlanLimits] = useState<PlanLimits[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureRelation[]>([]);
  const [subscriptions, setSubs] = useState<Subscription[]>([]);
  const [settings, setSettings] = useState<PlanSystemSettings>({ monetizationEnabled: false, defaultPlanId: '' });
  const [loading, setLoading] = useState(true);

  // ---- Fetch all plan data on mount ----
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [plansRes, limitsRes, featuresRes, settingsRes] = await Promise.all([
        supabase.from('plans').select('*').order('price_monthly'),
        supabase.from('plan_limits').select('*'),
        supabase.from('plan_features').select('*'),
        supabase.from('plan_settings').select('*').limit(1).single(),
      ]);
      if (cancelled) return;

      if (plansRes.data) setPlans(plansRes.data.map(dbToPlan));
      if (limitsRes.data) setPlanLimits(limitsRes.data.map(dbToLimits));
      if (featuresRes.data) setPlanFeatures(featuresRes.data.map(dbToFeature));
      if (settingsRes.data) {
        setSettings({
          monetizationEnabled: settingsRes.data.monetization_enabled,
          defaultPlanId: settingsRes.data.default_plan_id || '',
        });
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch user subscription when uid changes
  useEffect(() => {
    if (!uid) { setSubs([]); return; }
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', uid)
      .then(({ data }) => {
        if (data) setSubs(data.map(dbToSubscription));
      });
  }, [uid]);

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

  // ---- Admin CRUD ----
  const addPlan = useCallback(async (plan: Omit<Plan, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('plans').insert({
      name: plan.name, description: plan.description,
      price_monthly: plan.priceMonthly, price_yearly: plan.priceYearly,
      is_active: plan.isActive, is_free: plan.isFree, badge: plan.badge, color: plan.color,
    }).select().single();
    if (error || !data) return;
    const newPlan = dbToPlan(data);
    setPlans(prev => [...prev, newPlan]);

    // Create default limits
    const { data: limData } = await supabase.from('plan_limits').insert({
      plan_id: newPlan.id, max_accounts: 5, max_transactions_per_month: 500, max_categories: 20, max_goals: 5,
    }).select().single();
    if (limData) setPlanLimits(prev => [...prev, dbToLimits(limData)]);

    // Create feature relations (all disabled)
    const featureRows = allFeatures.map(f => ({ plan_id: newPlan.id, feature_key: f.key, enabled: false }));
    const { data: fData } = await supabase.from('plan_features').insert(featureRows).select();
    if (fData) setPlanFeatures(prev => [...prev, ...fData.map(dbToFeature)]);
  }, []);

  const updatePlan = useCallback(async (plan: Plan) => {
    await supabase.from('plans').update({
      name: plan.name, description: plan.description,
      price_monthly: plan.priceMonthly, price_yearly: plan.priceYearly,
      is_active: plan.isActive, is_free: plan.isFree, badge: plan.badge, color: plan.color,
    }).eq('id', plan.id);
    setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    if (id === settings.defaultPlanId) return;
    await supabase.from('plans').delete().eq('id', id);
    setPlans(prev => prev.filter(p => p.id !== id));
    setPlanLimits(prev => prev.filter(l => l.planId !== id));
    setPlanFeatures(prev => prev.filter(pf => pf.planId !== id));
  }, [settings.defaultPlanId]);

  const updatePlanLimits = useCallback(async (limits: PlanLimits) => {
    await supabase.from('plan_limits').update({
      max_accounts: limits.maxAccounts,
      max_transactions_per_month: limits.maxTransactionsPerMonth,
      max_categories: limits.maxCategories,
      max_goals: limits.maxGoals,
    }).eq('plan_id', limits.planId);
    setPlanLimits(prev => prev.map(l => l.planId === limits.planId ? limits : l));
  }, []);

  const togglePlanFeature = useCallback(async (planId: string, featureKey: string, enabled: boolean) => {
    await supabase.from('plan_features').update({ enabled }).eq('plan_id', planId).eq('feature_key', featureKey);
    setPlanFeatures(prev => prev.map(pf => pf.planId === planId && pf.featureKey === featureKey ? { ...pf, enabled } : pf));
  }, []);

  const setPlanFeaturesAll = useCallback(async (planId: string, enabled: boolean) => {
    await supabase.from('plan_features').update({ enabled }).eq('plan_id', planId);
    setPlanFeatures(prev => prev.map(pf => pf.planId === planId ? { ...pf, enabled } : pf));
  }, []);

  const assignSubscription = useCallback(async (userId: string, planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    // Cancel existing active
    await supabase.from('subscriptions').update({ status: 'canceled' }).eq('user_id', userId).eq('status', 'active');
    const now = new Date();
    const end = new Date(now);
    if (billingCycle === 'monthly') end.setMonth(end.getMonth() + 1); else end.setFullYear(end.getFullYear() + 1);
    const { data } = await supabase.from('subscriptions').insert({
      user_id: userId, plan_id: planId, status: 'active', billing_cycle: billingCycle,
      start_date: now.toISOString(), end_date: end.toISOString(),
    }).select().single();
    if (data) setSubs(prev => [...prev.map(s => s.userId === userId && s.status === 'active' ? { ...s, status: 'canceled' as const } : s), dbToSubscription(data)]);
  }, []);

  const cancelSubscription = useCallback(async (subId: string) => {
    await supabase.from('subscriptions').update({ status: 'canceled' }).eq('id', subId);
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'canceled' as const } : s));
  }, []);

  const updateSettings = useCallback(async (s: Partial<PlanSystemSettings>) => {
    const newSettings = { ...settings, ...s };
    await supabase.from('plan_settings').update({
      monetization_enabled: newSettings.monetizationEnabled,
      default_plan_id: newSettings.defaultPlanId || null,
    }).not('id', 'is', null); // update the single row
    setSettings(newSettings);
  }, [settings]);

  return (
    <PlanContext.Provider value={{
      plans, planLimits, planFeatures, subscriptions, settings, loading,
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
