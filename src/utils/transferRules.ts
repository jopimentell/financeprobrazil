/**
 * Transfer Rules — learn from user manual transfer conversions
 * and apply automatic suggestions to similar transactions.
 */
import { Transaction } from '@/types/finance';

export interface TransferRule {
  /** Pattern keywords (normalized) e.g. "pix recebido jo brandao" */
  pattern: string;
  /** Which side: "income" → incoming transfer (originating account is fixed),
   *  "expense" → outgoing transfer (destination account is fixed). */
  side: 'income' | 'expense';
  /** Account ID on the "current side": for income it's the destination; for expense it's the origin */
  currentAccountId: string;
  /** Other account: for income this is the origin; for expense this is the destination */
  otherAccountId: string;
  createdAt: string;
  hits: number;
}

const KEY = 'finance_transfer_rules';

/** Normalize a description for pattern matching: strip diacritics, digits, punctuation */
export function normalizeForRule(desc: string): string {
  return (desc || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 6)
    .join(' ');
}

/** Generate token set for similarity scoring */
function tokens(desc: string): Set<string> {
  return new Set(normalizeForRule(desc).split(' ').filter(Boolean));
}

/** Jaccard similarity between two token sets (0..1) */
export function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  const union = ta.size + tb.size - inter;
  return union ? inter / union : 0;
}

export function getRules(): TransferRule[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRules(rules: TransferRule[]) {
  localStorage.setItem(KEY, JSON.stringify(rules.slice(0, 300)));
}

export function addRule(rule: Omit<TransferRule, 'createdAt' | 'hits'>): TransferRule {
  const rules = getRules();
  const existing = rules.find(
    (r) =>
      r.pattern === rule.pattern &&
      r.side === rule.side &&
      r.currentAccountId === rule.currentAccountId,
  );
  if (existing) {
    existing.otherAccountId = rule.otherAccountId;
    existing.hits += 1;
    saveRules(rules);
    return existing;
  }
  const created: TransferRule = { ...rule, createdAt: new Date().toISOString(), hits: 1 };
  rules.unshift(created);
  saveRules(rules);
  return created;
}

/** Find a matching rule for a transaction (used at import or quick suggestion) */
export function matchRule(t: Pick<Transaction, 'description' | 'accountId' | 'type'>): TransferRule | null {
  if (t.type !== 'income' && t.type !== 'expense') return null;
  const rules = getRules().filter((r) => r.side === t.type && r.currentAccountId === t.accountId);
  if (!rules.length) return null;
  const desc = normalizeForRule(t.description);
  let best: { r: TransferRule; score: number } | null = null;
  for (const r of rules) {
    const score = similarity(desc, r.pattern);
    if (score >= 0.5 && (!best || score > best.score)) best = { r, score };
  }
  return best?.r || null;
}

/** Find similar non-transfer transactions to a given one (excluding itself) */
export function findSimilar(
  source: Transaction,
  pool: Transaction[],
  threshold = 0.55,
): Transaction[] {
  const srcNorm = normalizeForRule(source.description);
  if (!srcNorm) return [];
  return pool.filter(
    (t) =>
      t.id !== source.id &&
      t.type === source.type &&
      t.accountId === source.accountId &&
      similarity(srcNorm, t.description) >= threshold,
  );
}
