/**
 * Saved import templates (column mappings per bank).
 * Stored in localStorage.
 */

export interface ImportTemplate {
  id: string;
  name: string;
  separator: string;
  columnMappings: ColumnMapping[];
  typeMode: TypeDetectionMode;
  createdAt: string;
}

export type ColumnRole = 'date' | 'description' | 'beneficiary' | 'amount' | 'type' | 'ignore';

export interface ColumnMapping {
  columnIndex: number;
  columnHeader: string;
  role: ColumnRole;
}

export type TypeDetectionMode = 'by-column' | 'by-sign' | 'all-income' | 'all-expense';

const TEMPLATES_KEY = 'finance_import_templates';

export function getSavedTemplates(): ImportTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveTemplate(template: ImportTemplate) {
  const templates = getSavedTemplates();
  const existing = templates.findIndex(t => t.id === template.id);
  if (existing >= 0) {
    templates[existing] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function deleteTemplate(id: string) {
  const templates = getSavedTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

/**
 * Try to auto-detect column roles from header names.
 */
export function autoDetectMappings(headers: string[]): ColumnMapping[] {
  return headers.map((header, i) => {
    const h = header.toLowerCase().trim();
    let role: ColumnRole = 'ignore';

    if (/^(data|date|dt|data lan[çc]amento)/.test(h)) role = 'date';
    else if (/^(descri[çc][ãa]o|description|hist[oó]rico|memo)/.test(h)) role = 'description';
    else if (/^(nome|favorecido|benefici[áa]rio|pagador)/.test(h)) role = 'beneficiary';
    else if (/^(valor|value|amount|cr[ée]dito|d[ée]bito)/.test(h)) role = 'amount';
    else if (/^(tipo|type|natureza)/.test(h)) role = 'type';
    else if (/^(saldo|balance|docto|situa[çc][ãa]o|documento)/.test(h)) role = 'ignore';

    return { columnIndex: i, columnHeader: header, role };
  });
}

export const ROLE_LABELS: Record<ColumnRole, string> = {
  date: '📅 Data',
  description: '📝 Descrição',
  beneficiary: '👤 Favorecido',
  amount: '💰 Valor',
  type: '🏷️ Tipo (Receita/Despesa)',
  ignore: '⛔ Ignorar',
};
