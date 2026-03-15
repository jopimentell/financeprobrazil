export function parseDate(raw: string): string {
  const trimmed = raw.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }

  // DD/MM/YY
  const dmyShort = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmyShort) {
    const year = parseInt(dmyShort[3]) > 50 ? `19${dmyShort[3]}` : `20${dmyShort[3]}`;
    return `${year}-${dmyShort[2].padStart(2, '0')}-${dmyShort[1].padStart(2, '0')}`;
  }

  // DD/MM (assume current year)
  const dm = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (dm) {
    const year = new Date().getFullYear();
    return `${year}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`;
  }

  return trimmed;
}

export function isValidDate(dateStr: string): boolean {
  const parsed = parseDate(dateStr);
  return /^\d{4}-\d{2}-\d{2}$/.test(parsed) && !isNaN(Date.parse(parsed));
}
