/**
 * Transaction intelligence engine.
 * Detects type (income/expense) from description keywords,
 * suggests categories, and learns from user choices.
 */

// ── Type Detection Rules ──────────────────────────────

const INCOME_KEYWORDS = [
  'pix recebido', 'pix receb', 'pix crédito', 'pix credito',
  'transferência recebida', 'transferencia recebida',
  'ted recebida', 'doc recebido',
  'depósito', 'deposito', 'crédito', 'credito em conta',
  'rendimento', 'dividendo', 'cashback', 'reembolso', 'estorno',
  'salário', 'salario', 'pagamento recebido', 'venda',
  'resgate', 'devolução', 'devoluç',
];

const EXPENSE_KEYWORDS = [
  'pix enviado', 'pix envio', 'pix débito', 'pix debito',
  'transferência enviada', 'transferencia enviada',
  'ted enviada', 'doc enviado',
  'débito', 'debito automático', 'débito automático',
  'compra', 'pagamento de', 'pagamento fatura', 'boleto',
  'saque', 'tarifa', 'taxa', 'anuidade', 'juros', 'multa',
  'iof', 'imposto',
];

export type DetectedType = 'income' | 'expense' | 'unknown';

/**
 * Detect transaction type from description text.
 * Priority: 1) description keywords, 2) amount sign, 3) unknown
 */
export function detectTransactionType(description: string, amount?: number): DetectedType {
  const lower = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lowerOriginal = description.toLowerCase();

  // Check description first (highest priority)
  for (const kw of INCOME_KEYWORDS) {
    if (lowerOriginal.includes(kw)) return 'income';
  }
  for (const kw of EXPENSE_KEYWORDS) {
    if (lowerOriginal.includes(kw)) return 'expense';
  }

  // Check learned rules
  const learned = getLearnedType(description);
  if (learned) return learned;

  // Fall back to amount sign
  if (amount !== undefined) {
    if (amount > 0) return 'income';
    if (amount < 0) return 'expense';
  }

  return 'unknown';
}

// ── Category Suggestion ───────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': ['supermercado', 'mercado', 'padaria', 'restaurante', 'ifood', 'rappi', 'burger', 'pizza', 'lanche', 'açougue', 'hortifruti', 'sacolão', 'feira'],
  'Transporte': ['uber', '99', 'cabify', 'combustível', 'gasolina', 'estacionamento', 'pedágio', 'ônibus', 'metrô', 'posto', 'shell', 'ipiranga'],
  'Assinaturas': ['netflix', 'spotify', 'disney', 'hbo', 'amazon prime', 'youtube', 'apple', 'google one', 'deezer', 'globoplay', 'paramount'],
  'Saúde': ['farmácia', 'drogaria', 'hospital', 'clínica', 'médico', 'dentista', 'plano de saúde', 'unimed', 'amil', 'droga raia', 'drogasil'],
  'Educação': ['escola', 'faculdade', 'curso', 'udemy', 'alura', 'livro', 'mensalidade escolar'],
  'Moradia': ['aluguel', 'condomínio', 'luz', 'energia', 'água', 'gás', 'internet', 'telefone', 'celular', 'vivo', 'claro', 'tim', 'oi', 'enel', 'cpfl', 'sabesp', 'copasa'],
  'Lazer': ['cinema', 'teatro', 'show', 'ingresso', 'viagem', 'hotel', 'bar', 'parque', 'airbnb'],
  'Salário': ['salário', 'salario', 'pagamento', 'vencimento', 'remuneração', 'folha'],
  'Freelance': ['freelance', 'serviço prestado', 'consultoria', 'projeto', 'nota fiscal'],
  'Transferências': ['pix', 'ted', 'doc', 'transferência', 'transferencia'],
  'Compras': ['compra', 'loja', 'magazine', 'americanas', 'mercado livre', 'shopee', 'shein', 'amazon'],
  'Bancos': ['tarifa', 'taxa', 'anuidade', 'iof', 'juros', 'multa'],
};

export function suggestCategory(description: string): string {
  const lower = description.toLowerCase();

  // Check learned categories first
  const learned = getLearnedCategory(description);
  if (learned) return learned;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return 'Outros';
}

// ── Simple Learning (localStorage) ────────────────────

const LEARNED_TYPES_KEY = 'finance_learned_types';
const LEARNED_CATEGORIES_KEY = 'finance_learned_categories';

interface LearnedRule {
  keyword: string; // normalized description fragment
  value: string;   // type or category name
  count: number;   // how many times confirmed
}

function getLearnedRules(key: string): LearnedRule[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function saveLearnedRules(key: string, rules: LearnedRule[]) {
  localStorage.setItem(key, JSON.stringify(rules.slice(0, 500)));
}

function normalizeForLearning(description: string): string {
  // Remove numbers, dates, amounts — keep meaningful words
  return description
    .toLowerCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')
    .replace(/r?\$?\s*[\d.,]+/g, '')
    .replace(/[^a-záàâãéèêíïóôõöúçñ\s]/gi, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 4)
    .join(' ');
}

function getLearnedType(description: string): DetectedType | null {
  const normalized = normalizeForLearning(description);
  if (!normalized) return null;
  const rules = getLearnedRules(LEARNED_TYPES_KEY);
  const match = rules.find(r => normalized.includes(r.keyword) || r.keyword.includes(normalized));
  if (match && match.count >= 1) return match.value as DetectedType;
  return null;
}

function getLearnedCategory(description: string): string | null {
  const normalized = normalizeForLearning(description);
  if (!normalized) return null;
  const rules = getLearnedRules(LEARNED_CATEGORIES_KEY);
  const match = rules.find(r => normalized.includes(r.keyword) || r.keyword.includes(normalized));
  if (match && match.count >= 1) return match.value;
  return null;
}

/** Record a user's type choice for learning */
export function learnType(description: string, type: 'income' | 'expense') {
  const keyword = normalizeForLearning(description);
  if (!keyword) return;
  const rules = getLearnedRules(LEARNED_TYPES_KEY);
  const existing = rules.find(r => r.keyword === keyword);
  if (existing) {
    existing.value = type;
    existing.count++;
  } else {
    rules.push({ keyword, value: type, count: 1 });
  }
  saveLearnedRules(LEARNED_TYPES_KEY, rules);
}

/** Record a user's category choice for learning */
export function learnCategory(description: string, categoryName: string) {
  const keyword = normalizeForLearning(description);
  if (!keyword || categoryName === 'Outros') return;
  const rules = getLearnedRules(LEARNED_CATEGORIES_KEY);
  const existing = rules.find(r => r.keyword === keyword);
  if (existing) {
    existing.value = categoryName;
    existing.count++;
  } else {
    rules.push({ keyword, value: categoryName, count: 1 });
  }
  saveLearnedRules(LEARNED_CATEGORIES_KEY, rules);
}
