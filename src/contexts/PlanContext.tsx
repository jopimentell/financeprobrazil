import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Plan, PlanLimits, Subscription, PlanSystemSettings, PlanFeature, LimitCheckResult } from '@/types/plans';
import { defaultPlans, defaultPlanLimits, defaultPlanSettings } from '@/data/planData';
import { useAuth } from '@/contexts/AuthContext';

interface PlanContextType {
  // Data
  plans: Plan[];
  planLimits: PlanLimits[];
  subscriptions: Subscription[];
  settings: PlanSystemSettings;
  // Current user
  currentPlan: Plan | null;
  currentLimits: PlanLimits | null;
  currentSubscription: Subscription | null;
  // Limit checking
  checkLimit: (feature: PlanFeature, currentUsage: number) => LimitCheckResult;
  isFeatureAllowed: (feature: PlanFeature) => boolean;
  // Admin CRUD
  addPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => void;
  updatePlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  updatePlanLimits: (limits: PlanLimits) => void;
  // Subscription management
  assignSubscription: (userId: string, planId: string, billingCycle?: 'monthly' | 'yearly') => void;
  cancelSubscription: (subscriptionId: string) => void;
  getUserSubscription: (userId: string) => Subscription | undefined;
  getUserPlan: (userId: string) => Plan | null;
  // Settings
  updateSettings: (s: Partial<PlanSystemSettings>) => void;
}

const PlanContext = createContext<PlanContextType | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(`plan_${key}`);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}

function save(key: string, value: unknown) {
  localStorage.setItem(`plan_${key}`, JSON.stringify(value));
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const [plans, setPlans] = useState<Plan[]>(() => load('plans', defaultPlans));
  const [planLimits, setPlanLimits] = useState<PlanLimits[]>(() => load('plan_limits', defaultPlanLimits));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => load('subscriptions', []));
  const [settings, setSettings] = useState<PlanSystemSettings>(() => load('settings', defaultPlanSettings));

  useEffect(() => { save('plans', plans); }, [plans]);
  useEffect(() => { save('plan_limits', planLimits); }, [planLimits]);
  useEffect(() => { save('subscriptions', subscriptions); }, [subscriptions]);
  useEffect(() => { save('settings', settings); }, [settings]);

  const getUserSubscription = useCallback((userId: string) => {
    return subscriptions.find(s => s.userId === userId && (s.status === 'active' || s.status === 'trial'));
  }, [subscriptions]);

  const getUserPlan = useCallback((userId: string) => {
    const sub = getUserSubscription(userId);
    if (sub) return plans.find(p => p.id === sub.planId) || null;
    return plans.find(p => p.id === settings.defaultPlanId) || plans.find(p => p.isFree) || null;
  }, [getUserSubscription, plans, settings.defaultPlanId]);

  const currentSubscription = useMemo(() => getUserSubscription(currentUserId) || null, [getUserSubscription, currentUserId]);
  const currentPlan = useMemo(() => getUserPlan(currentUserId), [getUserPlan, currentUserId]);
  const currentLimits = useMemo(() => {
    if (!currentPlan) return null;
    return planLimits.find(l => l.planId === currentPlan.id) || null;
  }, [currentPlan, planLimits]);

  const checkLimit = useCallback((feature: PlanFeature, currentUsage: number): LimitCheckResult => {
    // If monetization is disabled, always allow
    if (!settings.monetizationEnabled) {
      return { allowed: true, current: currentUsage, limit: -1, feature, planName: currentPlan?.name || 'Free' };
    }
    if (!currentLimits || !currentPlan) {
      return { allowed: true, current: currentUsage, limit: -1, feature, planName: 'Free' };
    }

    let limit = -1;
    switch (feature) {
      case 'accounts': limit = currentLimits.maxAccounts; break;
      case 'transactions': limit = currentLimits.maxTransactionsPerMonth; break;
      case 'categories': limit = currentLimits.maxCategories; break;
      case 'goals': limit = currentLimits.maxGoals; break;
      default: limit = -1;
    }

    const allowed = limit === -1 || currentUsage < limit;
    return { allowed, current: currentUsage, limit, feature, planName: currentPlan.name };
  }, [settings.monetizationEnabled, currentLimits, currentPlan]);

  const isFeatureAllowed = useCallback((feature: PlanFeature): boolean => {
    if (!settings.monetizationEnabled) return true;
    if (!currentLimits) return true;
    switch (feature) {
      case 'exports': return currentLimits.allowExports;
      case 'reports': return currentLimits.allowReports;
      case 'advanced_analytics': return currentLimits.allowAdvancedAnalytics;
      default: return true;
    }
  }, [settings.monetizationEnabled, currentLimits]);

  const addPlan = useCallback((plan: Omit<Plan, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const newPlan: Plan = { ...plan, id, createdAt: new Date().toISOString() };
    setPlans(prev => [...prev, newPlan]);
    // Create default limits
    const newLimits: PlanLimits = {
      id: crypto.randomUUID(), planId: id,
      maxAccounts: 5, maxTransactionsPerMonth: 500, maxCategories: 20, maxGoals: 5,
      allowExports: false, allowReports: false, allowAdvancedAnalytics: false,
    };
    setPlanLimits(prev => [...prev, newLimits]);
  }, []);

  const updatePlan = useCallback((plan: Plan) => {
    setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
  }, []);

  const deletePlan = useCallback((id: string) => {
    if (id === settings.defaultPlanId) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    setPlanLimits(prev => prev.filter(l => l.planId !== id));
  }, [settings.defaultPlanId]);

  const updatePlanLimits = useCallback((limits: PlanLimits) => {
    setPlanLimits(prev => prev.map(l => l.planId === limits.planId ? limits : l));
  }, []);

  const assignSubscription = useCallback((userId: string, planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    // Cancel existing
    setSubscriptions(prev => prev.map(s =>
      s.userId === userId && s.status === 'active' ? { ...s, status: 'canceled' as const } : s
    ));
    const now = new Date();
    const end = new Date(now);
    if (billingCycle === 'monthly') end.setMonth(end.getMonth() + 1);
    else end.setFullYear(end.getFullYear() + 1);

    const newSub: Subscription = {
      id: crypto.randomUUID(), userId, planId,
      status: 'active', startDate: now.toISOString(), endDate: end.toISOString(),
      billingCycle, createdAt: now.toISOString(),
    };
    setSubscriptions(prev => [...prev, newSub]);
  }, []);

  const cancelSubscription = useCallback((subscriptionId: string) => {
    setSubscriptions(prev => prev.map(s =>
      s.id === subscriptionId ? { ...s, status: 'canceled' as const } : s
    ));
  }, []);

  const updateSettings = useCallback((s: Partial<PlanSystemSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  }, []);

  return (
    <PlanContext.Provider value={{
      plans, planLimits, subscriptions, settings,
      currentPlan, currentLimits, currentSubscription,
      checkLimit, isFeatureAllowed,
      addPlan, updatePlan, deletePlan, updatePlanLimits,
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
