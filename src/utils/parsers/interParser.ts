import { ParsedRow } from './types';
import { parseBRNumber } from './numberUtils';
import { parseDate, isValidDate } from './dateUtils';
import { detectTransactionType, suggestCategory } from '../transactionIntelligence';

/**
 * Banco Inter CSV parser
 * Header: Data Lançamento;Histórico;Descrição;Valor;Saldo
 * Separator: ;
 */
export function isInterFormat(header: string): boolean {
  const lower = header.toLowerCase();
  return lower.includes('data lançamento') || lower.includes('data lancamento') ||
    (lower.includes('histórico') && lower.includes('descrição') && lower.includes('saldo'));
}

export function parseInter(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const dataLines = lines.slice(1); // skip header

  return dataLines.map(line => {
    const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 4) return null;

    const [rawDate, historico, descricao, rawValor] = parts;

    if (!isValidDate(rawDate)) return null;
    const date = parseDate(rawDate);

    const amount = parseBRNumber(rawValor);
    if (isNaN(amount)) return null;

    // Build description: "Histórico - Descrição" or just one
    const description = (historico && descricao)
      ? `${historico.trim()} - ${descricao.trim()}`.replace(/\s+/g, ' ').trim()
      : (descricao || historico || '').trim();

    if (!description) return null;

    // Detect type from both historico and full description
    const fullText = `${historico} ${descricao}`;
    const detected = detectTransactionType(fullText, amount);
    const type: 'income' | 'expense' = detected === 'unknown'
      ? (amount >= 0 ? 'income' : 'expense')
      : detected;

    return {
      date,
      description,
      amount: Math.abs(amount),
      type,
      categoryId: '',
      suggestedCategory: suggestCategory(fullText),
      selected: true,
      isDuplicate: false,
      typeConfirmed: detected !== 'unknown',
      bank: 'inter',
    };
  }).filter(Boolean) as ParsedRow[];
}
