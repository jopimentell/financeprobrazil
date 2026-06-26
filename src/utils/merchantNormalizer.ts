/**
 * Normalize transaction descriptions into a canonical "merchant" label
 * so that variations like "IFOOD*", "IFOOD SA", "IFOOD PEDIDO 123"
 * collapse into the same group ("iFood").
 */

const KNOWN_MERCHANTS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bifood\b/i, label: 'iFood' },
  { pattern: /\bifd\*/i, label: 'iFood' },
  { pattern: /\bubereats?\b|\buber\s*eats?\b/i, label: 'Uber Eats' },
  { pattern: /\buber\b/i, label: 'Uber' },
  { pattern: /99(\s|app|tax)/i, label: '99' },
  { pattern: /\brappi\b/i, label: 'Rappi' },
  { pattern: /\bmcdonald'?s?\b|\bmc\s*don/i, label: "McDonald's" },
  { pattern: /\bburger\s*king\b|\bbk\b/i, label: 'Burger King' },
  { pattern: /\bsubway\b/i, label: 'Subway' },
  { pattern: /\bstarbucks\b/i, label: 'Starbucks' },
  { pattern: /\bspotify\b/i, label: 'Spotify' },
  { pattern: /\bnetflix\b/i, label: 'Netflix' },
  { pattern: /\bdisney\+?|disneyplus\b/i, label: 'Disney+' },
  { pattern: /\bprime\s*video|amazon\s*prime\b/i, label: 'Amazon Prime' },
  { pattern: /\bamazon\b|\bamzn\b/i, label: 'Amazon' },
  { pattern: /\bmercado\s*livre\b|\bml\b/i, label: 'Mercado Livre' },
  { pattern: /\bshopee\b/i, label: 'Shopee' },
  { pattern: /\baliexpress\b/i, label: 'AliExpress' },
  { pattern: /\bposto\b|\bshell\b|\bipiranga\b|\bpetrobras\b|\bale\b/i, label: 'Posto Combustível' },
  { pattern: /\bcarrefour\b/i, label: 'Carrefour' },
  { pattern: /\bextra\b/i, label: 'Extra' },
  { pattern: /\bp[aã]o\s*de\s*a[çc]ucar\b/i, label: 'Pão de Açúcar' },
  { pattern: /\bassai\b|\batacad[aã]o\b/i, label: 'Atacadão' },
  { pattern: /\bdrogaria\b|\bdrogasil\b|\bpacheco\b|\braia\b/i, label: 'Farmácia' },
  { pattern: /\bvivo\b|\bclaro\b|\btim\b|\boi\b/i, label: 'Telefonia' },
  { pattern: /\baluguel\b|\bali?quel\b/i, label: 'Aluguel' },
  { pattern: /\bsalario\b|\bsal[áa]rio\b|\bpagamento\b/i, label: 'Salário' },
];

/**
 * Returns a canonical merchant label for the given description.
 * Falls back to a cleaned-up version of the description.
 */
export function normalizeMerchant(description: string): string {
  const raw = (description || '').trim();
  if (!raw) return 'Sem descrição';

  for (const { pattern, label } of KNOWN_MERCHANTS) {
    if (pattern.test(raw)) return label;
  }

  // Generic cleanup: remove asterisks, trailing IDs/numbers, extra symbols
  const cleaned = raw
    .replace(/[*#].*$/, '')
    .replace(/\b(pag|pagto|compra|debito|cred|crd|deb)\b.*$/i, '')
    .replace(/\b\d{2,}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return raw;

  // Title-case first 3 words for a stable label
  return cleaned
    .toLowerCase()
    .split(' ')
    .slice(0, 3)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
