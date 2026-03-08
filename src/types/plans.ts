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

export interface PlanLimits {
  id: string;
  planId: string;
  maxAccounts: number; // -1 = unlimited
  maxTransactionsPerMonth: number; // -1 = unlimited
  maxCategories: number; // -1 = unlimited
  maxGoals: number; // -1 = unlimited
  allowExports: boolean;
  allowReports: boolean;
  allowAdvancedAnalytics: boolean;
}

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

export interface PlanSystemSettings {
  monetizationEnabled: boolean;
  defaultPlanId: string;
}

export type PlanFeature = 'accounts' | 'transactions' | 'categories' | 'goals' | 'exports' | 'reports' | 'advanced_analytics';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number; // -1 = unlimited
  feature: PlanFeature;
  planName: string;
}
