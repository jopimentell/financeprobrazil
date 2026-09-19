/**
 * Categorization rules service — backed by Supabase.
 * Finds similar transactions, applies bulk category updates,
 * manages user-specific rules (category + financial nature),
 * and auto-classifies on import.
 */

import { supabase } from '@/integrations/supabase/client';
import { FinancialNature, Transaction } from '@/types/finance';

export interface CategorizationRule {
  id: string;
  userId: string;
  pattern: string;
  matchType: 'contains' | 'exact' | 'starts_with';
  categoryId?: string;
  /** Financial nature suggested by this rule (second classification layer) */
  nature?: FinancialNature;
  personId?: string;
  merchantId?: string;
  /** Lower number wins */
  priority: number;
  createdAt: string;
}

function mapRule(row: any): CategorizationRule {
  return {
    id: row.id,
    userId: row.user_id,
    pattern: row.pattern,
    matchType: row.match_type,
    categoryId: row.category_id || undefined,
    nature: (row.nature || undefined) as FinancialNature | undefined,
    personId: row.person_id || undefined,
    merchantId: row.merchant_id || undefined,
    priority: row.priority ?? 100,
    createdAt: row.created_at,
  };
}

/** Normalize a description for pattern matching: lowercase, strip numbers/special chars, keep meaningful words */
export function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')
    .replace(/r?\$?\s*[\d.,]+/g, '')
    .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/gi, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' ')
    .trim();
}

/** Find transactions with similar descriptions (client-side matching from provided list) */
export function findSimilarTransactions(
  description: string,
  transactions: Transaction[],
  excludeId?: string,
): Transaction[] {
  const normalized = normalizeDescription(description);
  if (!normalized || normalized.length < 3) return [];

  const words = normalized.split(' ');
  // Use the longest meaningful word (≥4 chars) or first word as primary matcher
  const primaryWord = words.filter(w => w.length >= 4).sort((a, b) => b.length - a.length)[0] || words[0];
  if (!primaryWord || primaryWord.length < 3) return [];

  return transactions.filter(t => {
    if (excludeId && t.id === excludeId) return false;
    const tNorm = normalizeDescription(t.description);
    return tNorm.includes(primaryWord);
  });
}

/** Best pattern to use in a rule built from a free-text description. */
export function suggestPattern(description: string): string {
  const normalized = normalizeDescription(description);
  const words = normalized.split(' ').filter(w => w.length >= 4).sort((a, b) => b.length - a.length);
  return words[0] || normalized.split(' ')[0] || normalized;
}

/** Fetch all categorization rules for a user, highest priority first */
export async function fetchRules(userId: string): Promise<CategorizationRule[]> {
  const { data } = await supabase
    .from('categorization_rules')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: true });
  return (data || []).map(mapRule);
}

export interface RuleInput {
  pattern: string;
  matchType: 'contains' | 'exact' | 'starts_with';
  categoryId?: string;
  nature?: FinancialNature;
  personId?: string;
  merchantId?: string;
  priority?: number;
}

/** Save a new rule (category and/or financial nature). */
export async function saveRuleFull(userId: string, r: RuleInput): Promise<CategorizationRule> {
  const id = crypto.randomUUID();
  await supabase.from('categorization_rules').insert({
    id,
    user_id: userId,
    pattern: r.pattern,
    match_type: r.matchType,
    category_id: r.categoryId || null,
    nature: r.nature || null,
    person_id: r.personId || null,
    merchant_id: r.merchantId || null,
    priority: r.priority ?? 100,
  });
  return {
    id, userId, pattern: r.pattern, matchType: r.matchType,
    categoryId: r.categoryId, nature: r.nature, personId: r.personId,
    merchantId: r.merchantId, priority: r.priority ?? 100,
    createdAt: new Date().toISOString(),
  };
}

/** Backwards-compatible helper: category-only rule. */
export async function saveRule(
  userId: string,
  pattern: string,
  matchType: 'contains' | 'exact' | 'starts_with',
  categoryId: string,
): Promise<CategorizationRule> {
  return saveRuleFull(userId, { pattern, matchType, categoryId });
}

export async function updateRule(userId: string, r: CategorizationRule): Promise<void> {
  await supabase.from('categorization_rules').update({
    pattern: r.pattern,
    match_type: r.matchType,
    category_id: r.categoryId || null,
    nature: r.nature || null,
    person_id: r.personId || null,
    merchant_id: r.merchantId || null,
    priority: r.priority,
  }).eq('id', r.id).eq('user_id', userId);
}

/** Delete a categorization rule */
export async function deleteRule(userId: string, ruleId: string): Promise<void> {
  await supabase.from('categorization_rules').delete().eq('id', ruleId).eq('user_id', userId);
}

/** Bulk update category for matching transactions */
export async function bulkUpdateCategory(
  userId: string,
  transactionIds: string[],
  categoryId: string,
): Promise<void> {
  const chunkSize = 50;
  for (let i = 0; i < transactionIds.length; i += chunkSize) {
    const chunk = transactionIds.slice(i, i + chunkSize);
    await supabase
      .from('transactions')
      .update({ category_id: categoryId })
      .in('id', chunk)
      .eq('user_id', userId);
  }
}

/** Check if a description matches a rule */
export function matchesRule(description: string, rule: CategorizationRule): boolean {
  const normalized = normalizeDescription(description);
  const pattern = normalizeDescription(rule.pattern) || rule.pattern.toLowerCase();

  switch (rule.matchType) {
    case 'exact':
      return normalized === pattern;
    case 'starts_with':
      return normalized.startsWith(pattern);
    case 'contains':
    default:
      return normalized.includes(pattern);
  }
}

/** First matching rule, honouring priority order. */
export function findMatchingRule(
  description: string,
  rules: CategorizationRule[],
): CategorizationRule | undefined {
  return [...rules]
    .sort((a, b) => a.priority - b.priority)
    .find(r => matchesRule(description, r));
}

export interface ClassifiableDraft {
  description: string;
  categoryId: string;
  nature?: FinancialNature;
  personId?: string;
  merchantId?: string;
  natureSource?: 'manual' | 'rule' | 'suggestion';
  natureConfirmed?: boolean;
  [key: string]: any;
}

/**
 * Apply all user rules to a list of drafts (used on import).
 * Rules fill the category AND the financial nature, always as a SUGGESTION
 * (`nature_source: 'rule'`, `nature_confirmed: false`) so the user reviews it.
 */
export function applyRulesToTransactions<T extends ClassifiableDraft>(
  rules: CategorizationRule[],
  transactions: T[],
): T[] {
  if (rules.length === 0) return transactions;
  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  return transactions.map(t => {
    const rule = sorted.find(r => matchesRule(t.description, r));
    if (!rule) return t;
    return {
      ...t,
      categoryId: rule.categoryId || t.categoryId,
      merchantId: rule.merchantId || t.merchantId,
      nature: rule.nature || t.nature,
      personId: rule.personId || t.personId,
      natureSource: rule.nature ? 'rule' : t.natureSource,
      natureConfirmed: rule.nature ? false : t.natureConfirmed,
    };
  });
}
