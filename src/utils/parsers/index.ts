import { ParsedRow, BankType } from './types';
import { isInterFormat, parseInter } from './interParser';
import { isSantanderFormat, parseSantander } from './santanderParser';
import { parseGenericCSV } from './genericParser';

export type { ParsedRow, BankType };
export { parseDate, isValidDate } from './dateUtils';
export { parseBRNumber } from './numberUtils';

/**
 * Detect bank from CSV/text content header.
 */
export function detectBank(text: string): BankType {
  if (isInterFormat(text)) return 'inter';
  const firstLines = text.split('\n').slice(0, 5).join('\n');
  if (isSantanderFormat(firstLines)) return 'santander';
  return 'generic';
}

/**
 * Unified CSV parser — auto-detects bank and applies the right parser.
 */
export function parseCSVSmart(text: string): { rows: ParsedRow[]; bank: BankType } {
  const bank = detectBank(text);

  let rows: ParsedRow[];
  switch (bank) {
    case 'inter':
      rows = parseInter(text);
      break;
    case 'santander':
      rows = parseSantander(text);
      break;
    default:
      rows = parseGenericCSV(text);
  }

  return { rows, bank };
}

export const BANK_NAMES: Record<BankType, string> = {
  inter: 'Banco Inter',
  santander: 'Santander',
  generic: 'Formato genérico',
  unknown: 'Desconhecido',
};
