import { ParsedRow } from './types';
import { parseBRNumber } from './numberUtils';
import { parseDate, isValidDate } from './dateUtils';
import { detectTransactionType, suggestCategory } from '../transactionIntelligence';

const IGNORE_LINES = ['total', 'saldo anterior', 'saldo do dia', 'saldo final', 'saldo'];

/**
 * Santander CSV parser
 * Header: Data ,Descrição ,Docto ,Situação ,Crédito (R$) ,Débito (R$) ,Saldo (R$)
 * Separator: , (with values possibly quoted)
 */
export function isSantanderFormat(header: string): boolean {
  const lower = header.toLowerCase();
  return (lower.includes('crédito') || lower.includes('credito')) &&
    (lower.includes('débito') || lower.includes('debito'));
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^"|"$/g, '').trim());
}

export function parseSantander(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Find header line
  const headerIdx = lines.findIndex(l => isSantanderFormat(l));
  if (headerIdx === -1) return [];

  const header = splitCSVLine(lines[headerIdx]).map(h => h.toLowerCase());
  const dateCol = header.findIndex(h => h.includes('data'));
  const descCol = header.findIndex(h => h.includes('descri'));
  const creditCol = header.findIndex(h => h.includes('crédit') || h.includes('credit'));
  const debitCol = header.findIndex(h => h.includes('débit') || h.includes('debit'));

  if (dateCol === -1 || descCol === -1) return [];

  const dataLines = lines.slice(headerIdx + 1);

  return dataLines.map(line => {
    const parts = splitCSVLine(line);
    if (parts.length < Math.max(dateCol, descCol) + 1) return null;

    const rawDate = parts[dateCol];
    if (!isValidDate(rawDate)) return null;
    const date = parseDate(rawDate);

    const description = parts[descCol]?.replace(/\s+/g, ' ').trim();
    if (!description) return null;

    // Skip non-transaction lines
    if (IGNORE_LINES.some(s => description.toLowerCase().startsWith(s))) return null;

    // Get credit and debit values
    const creditVal = creditCol >= 0 ? parseBRNumber(parts[creditCol] || '') : NaN;
    const debitVal = debitCol >= 0 ? parseBRNumber(parts[debitCol] || '') : NaN;

    let amount: number;
    let type: 'income' | 'expense';

    if (!isNaN(creditVal) && creditVal !== 0) {
      amount = Math.abs(creditVal);
      type = 'income';
    } else if (!isNaN(debitVal) && debitVal !== 0) {
      amount = Math.abs(debitVal);
      type = 'expense';
    } else {
      return null; // no value
    }

    const detected = detectTransactionType(description, type === 'income' ? amount : -amount);
    const typeConfirmed = detected !== 'unknown';
    // Prefer column-based type over keyword detection for Santander
    // since credit/debit columns are explicit

    return {
      date,
      description,
      amount,
      type,
      categoryId: '',
      suggestedCategory: suggestCategory(description),
      selected: true,
      isDuplicate: false,
      typeConfirmed: true, // Santander has explicit credit/debit columns
      bank: 'santander',
    };
  }).filter(Boolean) as ParsedRow[];
}
