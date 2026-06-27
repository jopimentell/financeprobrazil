/**
 * Heuristics to identify whether a row from a bank statement is likely a transfer
 * between the user's own accounts (rather than real income/expense).
 */
import type { ParsedRow } from '@/utils/parsers/types';
import type { Account } from '@/types/finance';

const TRANSFER_KEYWORDS = [
  'pix',
  'ted',
  'doc',
  'transferencia',
  'transferência',
  'transfer',
  'envio',
  'recebido de',
  'enviado para',
  'tef',
  'p2p',
];

/** Bank/fintech name fragments commonly seen in transfer descriptions. */
const BANK_HINTS = [
  'nubank', 'inter', 'itau', 'itaú', 'bradesco', 'santander', 'caixa', 'bb ',
  'banco do brasil', 'c6', 'bv ', 'sicoob', 'sicredi', 'next', 'mercado pago',
  'mercadopago', 'picpay', 'pagseguro', 'safra', 'original',
];

export interface TransferCandidate {
  /** index in the rows array */
  index: number;
  row: ParsedRow;
  confidence: number; // 0-100
  reason: string;
}

/** Score a single row's likelihood of being a transfer (vs. real income/expense). */
export function scoreTransferLikelihood(row: ParsedRow, accounts: Account[]): { score: number; reason: string } {
  const desc = row.description.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const kw of TRANSFER_KEYWORDS) {
    if (desc.includes(kw)) {
      score += 35;
      reasons.push(kw.toUpperCase());
      break;
    }
  }

  for (const bank of BANK_HINTS) {
    if (desc.includes(bank)) {
      score += 20;
      reasons.push(bank.trim());
      break;
    }
  }

  // Account name appearing in description
  for (const acc of accounts) {
    const n = acc.name.toLowerCase().trim();
    if (n.length >= 3 && desc.includes(n)) {
      score += 30;
      reasons.push(`conta "${acc.name}"`);
      break;
    }
  }

  return { score: Math.min(score, 100), reason: reasons.join(' • ') };
}

/** Mark each row with a transfer suggestion (does not mutate type). */
export function flagTransferCandidates(
  rows: ParsedRow[],
  accounts: Account[],
  threshold = 50,
): TransferCandidate[] {
  const out: TransferCandidate[] = [];
  rows.forEach((r, i) => {
    const { score, reason } = scoreTransferLikelihood(r, accounts);
    if (score >= threshold) {
      out.push({ index: i, row: r, confidence: score, reason });
    }
  });
  return out;
}
