/**
 * Reads a CSV/text file and extracts raw rows (string[][]) plus detected headers.
 * Handles semicolon and comma separators, quoted fields, and broken lines.
 */

import { parseBRNumber } from './parsers/numberUtils';

export interface RawFileData {
  headers: string[];
  rows: string[][];
  separator: string;
  hasHeader: boolean;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(s => s.trim().replace(/^"|"$/g, '').trim());
}

function detectSeparator(text: string): string {
  const firstLines = text.split('\n').slice(0, 5).join('');
  const semicolons = (firstLines.match(/;/g) || []).length;
  const commas = (firstLines.match(/,/g) || []).length;
  const tabs = (firstLines.match(/\t/g) || []).length;
  if (tabs > semicolons && tabs > commas) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function isLikelyHeader(cells: string[]): boolean {
  // A header row typically has no parseable numbers or dates
  const hasNumber = cells.some(c => !isNaN(parseBRNumber(c)) && c.trim() !== '');
  const hasDate = cells.some(c => /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(c.trim()));
  const hasTextLabels = cells.filter(c =>
    /^[a-záàâãéèêíïóôõöúçñ\s()\/$.]+$/i.test(c.trim()) && c.trim().length > 1
  ).length >= 2;
  return !hasDate && !hasNumber && hasTextLabels;
}

/**
 * Merge broken lines for Brazilian bank CSVs.
 * A valid line starts with a date-like pattern. Lines that don't are continuations.
 */
function mergeLines(lines: string[]): string[] {
  const merged: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const startsWithDate = /^\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}/.test(trimmed);
    if (startsWithDate || merged.length === 0) {
      merged.push(trimmed);
    } else {
      // Continuation line — likely broken number
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        if (/[-\d]$/.test(prev) && /^\d/.test(trimmed)) {
          merged[merged.length - 1] = prev + ',' + trimmed;
        } else {
          merged[merged.length - 1] = prev + trimmed;
        }
      }
    }
  }
  return merged;
}

export function parseRawFile(text: string): RawFileData {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sep = detectSeparator(cleaned);

  // Merge broken lines (Inter fix)
  const rawLines = cleaned.split('\n').filter(l => l.trim());
  const mergedLines = mergeLines(rawLines);

  if (mergedLines.length === 0) return { headers: [], rows: [], separator: sep, hasHeader: false };

  const allCells = mergedLines.map(l => splitCSVLine(l, sep));
  const maxCols = Math.max(...allCells.map(r => r.length));

  // Normalize all rows to same column count
  const normalized = allCells.map(r => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  // Detect header
  const hasHeader = normalized.length > 1 && isLikelyHeader(normalized[0]);
  const headers = hasHeader
    ? normalized[0].map((h, i) => h || `Coluna ${i + 1}`)
    : normalized[0].map((_, i) => `Coluna ${i + 1}`);
  const dataRows = hasHeader ? normalized.slice(1) : normalized;

  // Filter out empty rows
  const validRows = dataRows.filter(row => row.some(cell => cell.trim() !== ''));

  return { headers, rows: validRows, separator: sep, hasHeader };
}

/**
 * Parse OFX into raw rows for the column mapper.
 */
export function parseOFXToRaw(text: string): RawFileData {
  const rows: string[][] = [];
  const stmtTrns = text.split('<STMTTRN>').slice(1);

  for (const block of stmtTrns) {
    const getVal = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\\n]+)`));
      return m ? m[1].trim() : '';
    };

    const dtPosted = getVal('DTPOSTED');
    const name = getVal('NAME') || getVal('MEMO');
    const trnAmt = getVal('TRNAMT');

    if (!dtPosted || !trnAmt) continue;
    const date = `${dtPosted.slice(0, 2)}/${dtPosted.slice(2, 4)}/${dtPosted.slice(4, 8)}`;

    rows.push([date, name || 'Transação importada', trnAmt]);
  }

  return {
    headers: ['Data', 'Descrição', 'Valor'],
    rows,
    separator: ',',
    hasHeader: true,
  };
}
