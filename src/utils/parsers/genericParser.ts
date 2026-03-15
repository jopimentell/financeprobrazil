import { ParsedRow } from './types';
import { parseBRNumber } from './numberUtils';
import { parseDate, isValidDate } from './dateUtils';
import { detectTransactionType, suggestCategory } from '../transactionIntelligence';

/**
 * Generic CSV parser — fallback for unknown bank formats.
 * Expects at least: date, description, amount columns.
 */
export function parseGenericCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('data') || header.includes('date') || header.includes('descri');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map(line => {
    const parts = splitCSVLineGeneric(line, sep);
    if (parts.length < 3) return null;

    const rawDate = parts[0];
    if (!isValidDate(rawDate)) return null;
    const date = parseDate(rawDate);

    const description = parts[1]?.replace(/\s+/g, ' ').trim();
    if (!description) return null;

    const amount = parseBRNumber(parts[2]);
    if (isNaN(amount)) return null;

    const detected = detectTransactionType(description, amount);
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
      bank: 'generic',
    };
  }).filter(Boolean) as ParsedRow[];
}

function splitCSVLineGeneric(line: string, sep: string): string[] {
  if (sep === ',') {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === sep && !inQuotes) { result.push(current); current = ''; }
      else { current += ch; }
    }
    result.push(current);
    return result.map(s => s.trim().replace(/^"|"$/g, '').trim());
  }
  return line.split(sep).map(p => p.trim().replace(/^"|"$/g, '').trim());
}
