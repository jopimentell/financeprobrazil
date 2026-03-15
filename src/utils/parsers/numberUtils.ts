/**
 * Parse Brazilian number format: 1.234,56 → 1234.56
 * Handles quoted values like " 35,00" and "- 4,00"
 */
export function parseBRNumber(raw: string): number {
  let cleaned = raw
    .replace(/[R$\s"]/g, '')  // remove R$, spaces, quotes
    .trim();

  if (!cleaned) return NaN;

  // Brazilian format: dots are thousands, comma is decimal
  // Check if it has both dot and comma → BR format
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // Only comma → treat as decimal separator
    cleaned = cleaned.replace(',', '.');
  }
  // If only dots, could be thousands or decimal — check position
  // e.g., "1.234" = 1234 (thousands), "1.23" = 1.23 (decimal)
  // Brazilian bank files with only dots are rare, keep as-is

  return parseFloat(cleaned);
}
