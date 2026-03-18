/**
 * Categorization rules service — backed by Supabase.
 * Finds similar transactions, applies bulk category updates,
 * manages user-specific categorization rules, and auto-categorizes on import.
 */

import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/finance';

export interface CategorizationRule {
  id: string;
  userId: string;
  pattern: string;
  matchType: 'contains' | 'exact' | 'starts_with';
  categoryId: string;
  createdAt: string;
}

function mapRule(row: any): CategorizationRule {
  return {
    id: row.id,
    userId: row.user_id,
    pattern: row.pattern,
    matchType: row.match_type,
    categoryId: row.category_id,
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

/** Fetch all categorization rules for a user */
export async function fetchRules(userId: string): Promise<CategorizationRule[]> {
  const { data } = await supabase
    .from('categorization_rules')
    .select('*')
    .eq('user_id', userId);
  return (data || []).map(mapRule);
}

/** Save a new categorization rule */
export async function saveRule(
  userId: string,
  pattern: string,
  matchType: 'contains' | 'exact' | 'starts_with',
  categoryId: string,
): Promise<CategorizationRule> {
  const id = crypto.randomUUID();
  const row = {
    id,
    user_id: userId,
    pattern,
    match_type: matchType,
    category_id: categoryId,
  };
  await supabase.from('categorization_rules').insert(row);
  return { id, userId, pattern, matchType, categoryId, createdAt: new Date().toISOString() };
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
  // Supabase doesn't support .in() with update well for large arrays, batch in chunks
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
function matchesRule(description: string, rule: CategorizationRule): boolean {
  const normalized = normalizeDescription(description);
  const pattern = rule.pattern.toLowerCase();

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

/** Apply all user rules to a list of transactions (for import). Returns transactions with updated categoryId. */
export function applyRulesToTransactions(
  rules: CategorizationRule[],
  transactions: Array<{ description: string; categoryId: string; [key: string]: any }>,
): typeof transactions {
  if (rules.length === 0) return transactions;

  return transactions.map(t => {
    for (const rule of rules) {
      if (matchesRule(t.description, rule)) {
        return { ...t, categoryId: rule.categoryId };
      }
    }
    return t;
  });
}
