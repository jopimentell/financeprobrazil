export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  suggestedCategory: string;
  selected: boolean;
  isDuplicate: boolean;
  typeConfirmed: boolean;
  bank?: string;
}

export type BankType = 'inter' | 'santander' | 'generic' | 'unknown';
