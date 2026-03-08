import { ParsedRow } from './types';
import { parseBRNumber } from './numberUtils';
import { parseDate, isValidDate } from './dateUtils';
import { detectTransactionType, suggestCategory } from '../transactionIntelligence';

/**
 * Banco Inter CSV parser
 * 
 * Handles Inter's quirks:
 * - Separator: ; (semicolon)
 * - Encoding: may be ISO-8859-1
 * - Broken lines: values like "-5\n00" split across lines
 * - Broken values: "00;-1" fragments from split decimals
 * - Formats:
 *   With header: Data Lançamento;Histórico;Descrição;Valor;Saldo
 *   Without header: DD/MM/YYYY;Histórico;Descrição;Valor[;Saldo]
 */

const INTER_HEADER_KEYWORDS = [
  'data lançamento', 'data lancamento', 'histórico', 'historico',
];

export function isInterFormat(text: string): boolean {
  const normalized = normalizeInterText(text);
  const lines = normalized.split('\n').slice(0, 10);

  const firstLine = lines[0]?.toLowerCase() || '';
  if (INTER_HEADER_KEYWORDS.some(kw => firstLine.includes(kw))) return true;

  // Heuristic: semicolon-separated, first col is date, has a parseable number
  for (const line of lines) {
    const parts = line.split(';').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length >= 4 && isValidDate(parts[0])) {
      const val = parseBRNumber(parts[3]);
      if (!isNaN(val)) return true;
    }
  }
  return false;
}

/**
 * Pre-process Inter CSV text to fix broken lines.
 * 
 * Inter sometimes splits values across lines:
 *   07/03/2026;Pix enviado ;Terezinha;-5
 *   00;-1
 *   76
 * 
 * Should become:
 *   07/03/2026;Pix enviado;Terezinha;-5,00;-1,76
 * 
 * Strategy: A valid Inter line starts with a date (DD/MM/YYYY).
 * Lines that don't start with a date are continuations of the previous line.
 */
function normalizeInterText(text: string): string {
  // Replace \r\n with \n
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rawLines = cleaned.split('\n');
  const merged: string[] = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if this line starts with a date or is a header
    const startsWithDate = /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(trimmed);
    const isHeader = INTER_HEADER_KEYWORDS.some(kw => trimmed.toLowerCase().includes(kw));

    if (startsWithDate || isHeader || merged.length === 0) {
      merged.push(trimmed);
    } else {
      // This is a continuation — append to previous line
      // The break likely happened in the middle of a number like "-5\n00"
      // We join without separator so "-5" + "00" = "-500" then we fix below
      // But actually the break is "-5\n00;-1\n76" meaning "-5,00;-1,76"
      // So we join with comma if the fragment looks like a decimal part
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        // If previous line ends with a digit or minus, and this starts with digits,
        // it's a broken decimal — join with comma
        if (/[-\d]$/.test(prev) && /^\d/.test(trimmed)) {
          merged[merged.length - 1] = prev + ',' + trimmed;
        } else {
          merged[merged.length - 1] = prev + trimmed;
        }
      }
    }
  }

  return merged.join('\n');
}

/**
 * Clean a raw value cell that may contain broken fragments.
 * e.g. "-5,00" is already fine, but "- 5,00" or "-5, 00" need cleanup.
 */
function cleanValue(raw: string): number {
  // Remove extra spaces inside the number
  const cleaned = raw.replace(/\s/g, '').replace(/"/g, '');
  return parseBRNumber(cleaned);
}

export function parseInter(text: string): ParsedRow[] {
  const normalized = normalizeInterText(text);
  const lines = normalized.split('\n').filter(l => l.trim());
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

    const historico = parts[1]?.replace(/\s+/g, ' ').trim() || '';
    const descricao = parts[2]?.replace(/\s+/g, ' ').trim() || '';
    const rawValor = parts[3];

    const amount = cleanValue(rawValor);
    if (isNaN(amount) || amount === 0) return null;

    // Build clean description: "Histórico - Descrição"
    let description: string;
    if (historico && descricao) {
      description = `${historico} - ${descricao}`.replace(/\s+/g, ' ').trim();
    } else {
      description = (descricao || historico || 'Transação importada').replace(/\s+/g, ' ').trim();
    }

    // Detect type primarily from "historico" field
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
