// ===== Feature Definition =====
export interface Feature {
  id: string;
  key: string;
  name: string;
  description: string;
  category: FeatureCategory;
}

export type FeatureCategory =
  | 'finance'
  | 'accounts'
  | 'limits'
  | 'reports'
  | 'analytics'
  | 'planning'
  | 'productivity'
  | 'imports'
  | 'customization'
  | 'security';

// ===== Plan =====
export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  isFree: boolean;
  createdAt: string;
  badge?: string;
  color?: string;
}

// ===== Plan ↔ Feature relation =====
export interface PlanFeatureRelation {
  id: string;
  planId: string;
  featureKey: string;
  enabled: boolean;
}

// ===== Plan Limits =====
export interface PlanLimits {
  id: string;
  planId: string;
  maxAccounts: number;        // -1 = unlimited
  maxTransactionsPerMonth: number;
  maxCategories: number;
  maxGoals: number;
}

// ===== Subscription =====
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'trial' | 'canceled' | 'expired';
  startDate: string;
  endDate: string;
  billingCycle: 'monthly' | 'yearly';
  createdAt: string;
}

// ===== System Settings =====
export interface PlanSystemSettings {
  monetizationEnabled: boolean;
  defaultPlanId: string;
}

// ===== Limit check =====
export type LimitKey = 'accounts' | 'transactions' | 'categories' | 'goals';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  limitKey: LimitKey;
  planName: string;
}
