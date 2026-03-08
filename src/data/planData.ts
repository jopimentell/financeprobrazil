import { Plan, PlanLimits, PlanSystemSettings } from '@/types/plans';

export const defaultPlans: Plan[] = [
  {
    id: 'plan-free',
    name: 'Free',
    description: 'Para quem está começando a organizar suas finanças.',
    priceMonthly: 0,
    priceYearly: 0,
    isActive: true,
    isFree: true,
    createdAt: '2026-01-01',
    badge: 'Gratuito',
    color: 'hsl(var(--muted-foreground))',
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    description: 'Para quem quer controle total com recursos avançados.',
    priceMonthly: 19.90,
    priceYearly: 189.90,
    isActive: true,
    isFree: false,
    createdAt: '2026-01-01',
    badge: 'Popular',
    color: 'hsl(var(--primary))',
  },
  {
    id: 'plan-premium',
    name: 'Premium',
    description: 'Para profissionais que exigem o máximo do sistema.',
    priceMonthly: 39.90,
    priceYearly: 379.90,
    isActive: true,
    isFree: false,
    createdAt: '2026-01-01',
    badge: 'Completo',
    color: 'hsl(45, 93%, 47%)',
  },
];

export const defaultPlanLimits: PlanLimits[] = [
  {
    id: 'limits-free',
    planId: 'plan-free',
    maxAccounts: 2,
    maxTransactionsPerMonth: 100,
    maxCategories: 10,
    maxGoals: 2,
    allowExports: false,
    allowReports: false,
    allowAdvancedAnalytics: false,
  },
  {
    id: 'limits-pro',
    planId: 'plan-pro',
    maxAccounts: 10,
    maxTransactionsPerMonth: 1000,
    maxCategories: 50,
    maxGoals: 20,
    allowExports: true,
    allowReports: true,
    allowAdvancedAnalytics: false,
  },
  {
    id: 'limits-premium',
    planId: 'plan-premium',
    maxAccounts: -1,
    maxTransactionsPerMonth: -1,
    maxCategories: -1,
    maxGoals: -1,
    allowExports: true,
    allowReports: true,
    allowAdvancedAnalytics: true,
  },
];

export const defaultPlanSettings: PlanSystemSettings = {
  monetizationEnabled: false,
  defaultPlanId: 'plan-free',
};
