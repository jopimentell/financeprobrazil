import { ParsedRow } from './types';
import { parseBRNumber } from './numberUtils';
import { parseDate, isValidDate } from './dateUtils';
import { detectTransactionType, suggestCategory } from '../transactionIntelligence';

/**
 * Banco Inter CSV parser
 * Formats:
 *   With header: Data Lançamento;Histórico;Descrição;Valor;Saldo
 *   Without header: DD/MM/YYYY;Histórico;Descrição;Valor[;Saldo]
 * Separator: ;
 */

const INTER_HEADER_KEYWORDS = [
  'data lançamento', 'data lancamento', 'histórico', 'historico',
];

export function isInterFormat(text: string): boolean {
  const lines = text.trim().split('\n').slice(0, 5);
  
  // Check header keywords
  const firstLine = lines[0]?.toLowerCase() || '';
  if (INTER_HEADER_KEYWORDS.some(kw => firstLine.includes(kw))) return true;

  // Heuristic: semicolon-separated, 4-5 columns, first col is date, 4th col is number
  const sep = ';';
  for (const line of lines) {
    const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length >= 4 && isValidDate(parts[0])) {
      const val = parseBRNumber(parts[3]);
      if (!isNaN(val)) return true;
    }
  }
  return false;
}

export function parseInter(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 1) return [];

  // Skip header if present
  const firstLineLower = lines[0].toLowerCase();
  const hasHeader = INTER_HEADER_KEYWORDS.some(kw => firstLineLower.includes(kw));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length < 4) return null;

    const rawDate = parts[0];
    if (!isValidDate(rawDate)) return null;
    const date = parseDate(rawDate);

    const historico = parts[1]?.trim() || '';
    const descricao = parts[2]?.trim() || '';
    const rawValor = parts[3];

    const amount = parseBRNumber(rawValor);
    if (isNaN(amount)) return null;

    // Build clean description: "Histórico - Descrição"
    let description: string;
    if (historico && descricao) {
      description = `${historico} - ${descricao}`.replace(/\s+/g, ' ').trim();
    } else {
      description = (descricao || historico || 'Transação importada').replace(/\s+/g, ' ').trim();
    }

    // Detect type primarily from "historico" field (Pix recebido, Pix enviado, Compra no débito, etc.)
    // Then fallback to full text, then to amount sign
    const detected = detectTransactionType(historico, amount) !== 'unknown'
      ? detectTransactionType(historico, amount)
      : detectTransactionType(description, amount);

    const type: 'income' | 'expense' = detected === 'unknown'
      ? (amount >= 0 ? 'income' : 'expense')
      : detected;

    return {
      date,
      description,
      amount: Math.abs(amount),
      type,
      categoryId: '',
      suggestedCategory: suggestCategory(description),
      selected: true,
      isDuplicate: false,
      typeConfirmed: detected !== 'unknown',
      bank: 'inter',
    };
  }).filter(Boolean) as ParsedRow[];
}
