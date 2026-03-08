import { Feature, Plan, PlanFeatureRelation, PlanLimits, PlanSystemSettings } from '@/types/plans';

// ===================== ALL SYSTEM FEATURES =====================

export const allFeatures: Feature[] = [
  // finance
  { id: 'f1', key: 'create_income', name: 'Criar receitas', description: 'Adicionar receitas ao sistema', category: 'finance' },
  { id: 'f2', key: 'create_expense', name: 'Criar despesas', description: 'Adicionar despesas ao sistema', category: 'finance' },
  { id: 'f3', key: 'edit_transactions', name: 'Editar transações', description: 'Editar transações existentes', category: 'finance' },
  { id: 'f4', key: 'delete_transactions', name: 'Excluir transações', description: 'Remover transações', category: 'finance' },
  { id: 'f5', key: 'transfer_between_accounts', name: 'Transferência entre contas', description: 'Transferir valores entre contas', category: 'finance' },
  { id: 'f6', key: 'attachments', name: 'Anexar comprovantes', description: 'Upload de comprovantes nas transações', category: 'finance' },
  // accounts
  { id: 'f7', key: 'create_accounts', name: 'Criar contas financeiras', description: 'Adicionar contas bancárias', category: 'accounts' },
  { id: 'f8', key: 'unlimited_accounts', name: 'Contas ilimitadas', description: 'Sem limite de contas financeiras', category: 'accounts' },
  { id: 'f9', key: 'multi_accounts', name: 'Multi contas', description: 'Gerenciar múltiplas contas', category: 'accounts' },
  // reports
  { id: 'f10', key: 'basic_reports', name: 'Relatórios básicos', description: 'Relatórios financeiros simples', category: 'reports' },
  { id: 'f11', key: 'advanced_reports', name: 'Relatórios avançados', description: 'Relatórios detalhados com filtros', category: 'reports' },
  { id: 'f12', key: 'export_data', name: 'Exportar dados', description: 'Exportar dados financeiros', category: 'reports' },
  { id: 'f13', key: 'export_csv', name: 'Exportar CSV', description: 'Exportar em formato CSV', category: 'reports' },
  { id: 'f14', key: 'export_excel', name: 'Exportar Excel', description: 'Exportar em formato Excel', category: 'reports' },
  { id: 'f15', key: 'export_pdf', name: 'Exportar PDF', description: 'Exportar em formato PDF', category: 'reports' },
  // analytics
  { id: 'f16', key: 'financial_charts', name: 'Gráficos financeiros', description: 'Visualizações gráficas', category: 'analytics' },
  { id: 'f17', key: 'advanced_dashboard', name: 'Dashboard avançado', description: 'Dashboard com métricas avançadas', category: 'analytics' },
  { id: 'f18', key: 'category_analysis', name: 'Análise por categoria', description: 'Análise detalhada por categoria', category: 'analytics' },
  { id: 'f19', key: 'monthly_analysis', name: 'Análise mensal', description: 'Comparativo mensal', category: 'analytics' },
  { id: 'f20', key: 'financial_insights', name: 'Insights automáticos', description: 'Sugestões inteligentes baseadas nos dados', category: 'analytics' },
  // planning
  { id: 'f21', key: 'financial_goals', name: 'Metas financeiras', description: 'Definir e acompanhar metas', category: 'planning' },
  { id: 'f22', key: 'monthly_budget', name: 'Orçamentos mensais', description: 'Planejar orçamento por mês', category: 'planning' },
  { id: 'f23', key: 'debt_simulator', name: 'Simulador de dívidas', description: 'Simular quitação de dívidas', category: 'planning' },
  { id: 'f24', key: 'wealth_planner', name: 'Planejamento de patrimônio', description: 'Planejar crescimento patrimonial', category: 'planning' },
  // productivity
  { id: 'f25', key: 'search_transactions', name: 'Busca de transações', description: 'Pesquisar transações', category: 'productivity' },
  { id: 'f26', key: 'advanced_filters', name: 'Filtros avançados', description: 'Filtros detalhados', category: 'productivity' },
  { id: 'f27', key: 'duplicate_transactions', name: 'Duplicar transações', description: 'Copiar transações existentes', category: 'productivity' },
  { id: 'f28', key: 'recurring_transactions', name: 'Transações recorrentes', description: 'Automatizar transações mensais', category: 'productivity' },
  // imports
  { id: 'f29', key: 'import_csv', name: 'Importar CSV', description: 'Importar dados via CSV', category: 'imports' },
  { id: 'f30', key: 'import_ofx', name: 'Importar OFX', description: 'Importar extrato bancário OFX', category: 'imports' },
  { id: 'f31', key: 'auto_import', name: 'Importação automática', description: 'Sincronização automática', category: 'imports' },
  // customization
  { id: 'f32', key: 'custom_categories', name: 'Categorias personalizadas', description: 'Criar categorias próprias', category: 'customization' },
  { id: 'f33', key: 'transaction_tags', name: 'Tags em transações', description: 'Adicionar tags para organização', category: 'customization' },
  { id: 'f34', key: 'transaction_notes', name: 'Notas nas transações', description: 'Adicionar anotações', category: 'customization' },
  // security
  { id: 'f35', key: 'two_factor_auth', name: '2FA', description: 'Autenticação em dois fatores', category: 'security' },
  { id: 'f36', key: 'login_history', name: 'Histórico de login', description: 'Visualizar acessos anteriores', category: 'security' },
  { id: 'f37', key: 'active_sessions', name: 'Sessões ativas', description: 'Gerenciar sessões abertas', category: 'security' },
];

export const featureCategoryLabels: Record<string, string> = {
  finance: 'Gestão Financeira',
  accounts: 'Contas Financeiras',
  reports: 'Relatórios',
  analytics: 'Análises',
  planning: 'Planejamento Financeiro',
  productivity: 'Produtividade',
  imports: 'Importação de Dados',
  customization: 'Personalização',
  security: 'Segurança',
};

// ===================== DEFAULT PLANS =====================

export const defaultPlans: Plan[] = [
  { id: 'plan-free', name: 'Free', description: 'Para quem está começando a organizar suas finanças.', priceMonthly: 0, priceYearly: 0, isActive: true, isFree: true, createdAt: '2026-01-01', badge: 'Gratuito' },
  { id: 'plan-pro', name: 'Pro', description: 'Para quem quer controle total com recursos avançados.', priceMonthly: 19.90, priceYearly: 189.90, isActive: true, isFree: false, createdAt: '2026-01-01', badge: 'Popular' },
  { id: 'plan-premium', name: 'Premium', description: 'Para profissionais que exigem o máximo do sistema.', priceMonthly: 39.90, priceYearly: 379.90, isActive: true, isFree: false, createdAt: '2026-01-01', badge: 'Completo' },
];

// Free features
const freeKeys = [
  'create_income', 'create_expense', 'edit_transactions', 'delete_transactions',
  'create_accounts', 'basic_reports', 'financial_charts', 'category_analysis',
  'monthly_analysis', 'search_transactions', 'custom_categories', 'transaction_notes',
  'financial_goals',
];

// Pro adds
const proKeys = [
  ...freeKeys,
  'transfer_between_accounts', 'multi_accounts', 'advanced_reports',
  'export_data', 'export_csv', 'export_excel',
  'advanced_dashboard', 'monthly_budget', 'debt_simulator',
  'advanced_filters', 'duplicate_transactions', 'recurring_transactions',
  'import_csv', 'transaction_tags', 'login_history',
];

// Premium = all
const premiumKeys = allFeatures.map(f => f.key);

function buildRelations(planId: string, enabledKeys: string[]): PlanFeatureRelation[] {
  return allFeatures.map(f => ({
    id: `${planId}-${f.key}`,
    planId,
    featureKey: f.key,
    enabled: enabledKeys.includes(f.key),
  }));
}

export const defaultPlanFeatures: PlanFeatureRelation[] = [
  ...buildRelations('plan-free', freeKeys),
  ...buildRelations('plan-pro', proKeys),
  ...buildRelations('plan-premium', premiumKeys),
];

export const defaultPlanLimits: PlanLimits[] = [
  { id: 'limits-free', planId: 'plan-free', maxAccounts: 2, maxTransactionsPerMonth: 100, maxCategories: 10, maxGoals: 2 },
  { id: 'limits-pro', planId: 'plan-pro', maxAccounts: 10, maxTransactionsPerMonth: 1000, maxCategories: 50, maxGoals: 20 },
  { id: 'limits-premium', planId: 'plan-premium', maxAccounts: -1, maxTransactionsPerMonth: -1, maxCategories: -1, maxGoals: -1 },
];

export const defaultPlanSettings: PlanSystemSettings = {
  monetizationEnabled: false,
  defaultPlanId: 'plan-free',
};
