import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceContext';
import { Transaction } from '@/types/finance';
import { Upload, FileText, ClipboardPaste, CheckCircle2, AlertTriangle, X, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { detectTransactionType, suggestCategory, learnType, learnCategory } from '@/utils/transactionIntelligence';
import { parseCSVSmart, BANK_NAMES, type ParsedRow, type BankType, parseDate, parseBRNumber } from '@/utils/parsers';

function parsePastedText(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());

  return lines.map(line => {
    // Try: DD/MM description value
    const match = line.match(/^(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+([-+]?\d[\d.,]*)\s*$/);
    if (match) {
      const date = parseDate(match[1]);
      const description = match[2].trim();
      const amount = parseBRNumber(match[3]);

      if (isNaN(amount)) return null;

      const detected = detectTransactionType(description, amount);
      const type: 'income' | 'expense' = detected === 'unknown' ? (amount >= 0 ? 'income' : 'expense') : detected;
      const suggested = suggestCategory(description);

      return {
        date,
        description,
        amount: Math.abs(amount),
        type,
        categoryId: '',
        suggestedCategory: suggested,
        selected: true,
        isDuplicate: false,
        typeConfirmed: detected !== 'unknown',
      };
    }

    // Try: CSV-like
    const parts = line.split(/[;,\t]/).map(p => p.trim());
    if (parts.length >= 3) {
      const date = parseDate(parts[0]);
      const description = parts[1];
      const amount = parseBRNumber(parts[2]);

      if (isNaN(amount)) return null;

      const detected = detectTransactionType(description, amount);
      const type: 'income' | 'expense' = detected === 'unknown' ? (amount >= 0 ? 'income' : 'expense') : detected;
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
      };
    }

    return null;
  }).filter(Boolean) as ParsedRow[];
}

function parseOFX(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
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

    // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
    const date = `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`;
    const amount = parseBRNumber(trnAmt);
    if (isNaN(amount)) continue;

    const desc = name || 'Transação importada';
    const detected = detectTransactionType(desc, amount);
    const type: 'income' | 'expense' = detected === 'unknown' ? (amount >= 0 ? 'income' : 'expense') : detected;
    rows.push({
      date,
      description: desc,
      amount: Math.abs(amount),
      type,
      categoryId: '',
      suggestedCategory: suggestCategory(desc),
      selected: true,
      isDuplicate: false,
      typeConfirmed: detected !== 'unknown',
    });
  }

  return rows;
}

type Step = 'upload' | 'review' | 'summary';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportStatementModal({ open, onClose }: Props) {
  const { transactions, categories, accounts, addTransaction } = useFinance();
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [bulkCategory, setBulkCategory] = useState('');
  const [fileName, setFileName] = useState('');
  const [detectedBank, setDetectedBank] = useState<BankType>('unknown');

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);

  const resetState = useCallback(() => {
    setStep('upload');
    setRows([]);
    setPasteText('');
    setImportMode('file');
    setBulkCategory('');
    setFileName('');
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Match categories by suggestion name
  const matchCategory = useCallback((suggestion: string, type: 'income' | 'expense') => {
    const cats = type === 'income' ? incomeCategories : expenseCategories;
    const found = cats.find(c => c.name.toLowerCase().includes(suggestion.toLowerCase()));
    return found?.id || cats[0]?.id || '';
  }, [expenseCategories, incomeCategories]);

  // Check duplicates
  const checkDuplicates = useCallback((parsed: ParsedRow[]): ParsedRow[] => {
    return parsed.map(row => {
      const isDuplicate = transactions.some(t =>
        t.date === row.date &&
        Math.abs(t.amount - row.amount) < 0.01 &&
        t.description.toLowerCase() === row.description.toLowerCase()
      );
      return { ...row, isDuplicate };
    });
  }, [transactions]);

  const processRows = useCallback((parsed: ParsedRow[]) => {
    const withCategories = parsed.map(r => ({
      ...r,
      categoryId: matchCategory(r.suggestedCategory, r.type),
    }));
    const withDuplicates = checkDuplicates(withCategories);
    setRows(withDuplicates);
    setStep('review');
  }, [matchCategory, checkDuplicates]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Try UTF-8 first, then fallback to ISO-8859-1 (common for Brazilian bank files)
    const tryParse = (text: string): boolean => {
      let parsed: ParsedRow[];
      const ext = file.name.toLowerCase();

      if (ext.endsWith('.ofx') || ext.endsWith('.qfx')) {
        parsed = parseOFX(text);
        setDetectedBank('unknown');
      } else {
        const result = parseCSVSmart(text);
        parsed = result.rows;
        setDetectedBank(result.bank);
        if (result.bank !== 'generic') {
          toast.info(`Banco detectado: ${BANK_NAMES[result.bank]}`);
        }
      }

      if (parsed.length === 0) return false;
      processRows(parsed);
      return true;
    };

    const readerUtf8 = new FileReader();
    readerUtf8.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text && tryParse(text)) return;

      // Fallback: try ISO-8859-1 encoding (Banco Inter, etc.)
      const readerLatin = new FileReader();
      readerLatin.onload = (ev2) => {
        const textLatin = ev2.target?.result as string;
        if (!textLatin || !tryParse(textLatin)) {
          toast.error('Não foi possível interpretar o arquivo. Verifique o formato.');
        }
      };
      readerLatin.readAsText(file, 'ISO-8859-1');
    };
    readerUtf8.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) {
      toast.error('Cole o texto do extrato.');
      return;
    }
    const parsed = parsePastedText(pasteText);
    if (parsed.length === 0) {
      toast.error('Não foi possível interpretar o texto. Use o formato: data descrição valor');
      return;
    }
    processRows(parsed);
  };

  const toggleRow = (i: number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = () => {
    const allSelected = rows.every(r => r.selected);
    setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const updateRow = (i: number, field: keyof ParsedRow, value: any) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const applyBulkCategory = () => {
    if (!bulkCategory) return;
    setRows(prev => prev.map(r => r.selected ? { ...r, categoryId: bulkCategory } : r));
    toast.success('Categoria aplicada às transações selecionadas.');
  };

  const selectedRows = useMemo(() => rows.filter(r => r.selected), [rows]);
  const incomeCount = useMemo(() => selectedRows.filter(r => r.type === 'income').length, [selectedRows]);
  const expenseCount = useMemo(() => selectedRows.filter(r => r.type === 'expense').length, [selectedRows]);
  const duplicateCount = useMemo(() => rows.filter(r => r.isDuplicate).length, [rows]);

  const handleConfirmImport = () => {
    const accountId = accounts[0]?.id || '';
    let imported = 0;

    for (const row of selectedRows) {
      // Learn from user choices
      learnType(row.description, row.type);
      const catName = categories.find(c => c.id === row.categoryId)?.name;
      if (catName) learnCategory(row.description, catName);

      addTransaction({
        description: row.description,
        amount: row.amount,
        type: row.type,
        categoryId: row.categoryId,
        accountId,
        date: row.date,
        status: 'paid',
        recurrence: 'none',
        origin: 'importacao' as any,
      });
      imported++;
    }

    toast.success(`${imported} transação(ões) importada(s) com sucesso!`);
    setStep('summary');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {step === 'upload' && 'Importar Extrato'}
            {step === 'review' && 'Revisar Transações'}
            {step === 'summary' && 'Importação Concluída'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="flex gap-2">
              <Button variant={importMode === 'file' ? 'default' : 'outline'} onClick={() => setImportMode('file')} className="flex-1">
                <FileText className="h-4 w-4 mr-1" /> Arquivo (CSV / OFX)
              </Button>
              <Button variant={importMode === 'paste' ? 'default' : 'outline'} onClick={() => setImportMode('paste')} className="flex-1">
                <ClipboardPaste className="h-4 w-4 mr-1" /> Colar Texto
              </Button>
            </div>

            {importMode === 'file' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: <strong>CSV</strong>, <strong>OFX</strong>, <strong>QFX</strong>
                </p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl p-10 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Clique para selecionar arquivo</span>
                  <span className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</span>
                  <input type="file" accept=".csv,.ofx,.qfx,.txt" className="hidden" onChange={handleFileUpload} />
                </label>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p><strong>CSV esperado:</strong> data, descrição, valor</p>
                  <p><strong>OFX:</strong> formato padrão de bancos brasileiros</p>
                  <p>Valores negativos = despesa, positivos = receita</p>
                </div>
              </div>
            )}

            {importMode === 'paste' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Cole o extrato do banco abaixo:</p>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={"01/03 Salário 4000\n02/03 Supermercado -250\n03/03 Netflix -39"}
                  className="w-full h-48 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <Button onClick={handlePasteImport} className="w-full">
                  Processar Texto
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-muted font-medium">{rows.length} transações</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">{incomeCount} receitas</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">{expenseCount} despesas</span>
              {detectedBank !== 'unknown' && detectedBank !== 'generic' && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {BANK_NAMES[detectedBank]}
                </span>
              )}
              {duplicateCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {duplicateCount} possíveis duplicatas
                </span>
              )}
            </div>

            {/* Bulk actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {rows.every(r => r.selected) ? 'Desmarcar tudo' : 'Selecionar tudo'}
              </Button>
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                className="px-2 py-1 rounded border border-input bg-background text-sm"
              >
                <option value="">Categoria em massa...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button variant="secondary" size="sm" onClick={applyBulkCategory} disabled={!bulkCategory}>
                Aplicar
              </Button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-8"></th>
                    <th className="p-2 text-left">Data</th>
                    <th className="p-2 text-left">Descrição</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Categoria</th>
                    <th className="p-2 text-left w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-b border-border ${row.isDuplicate ? 'bg-yellow-500/5' : ''} ${!row.selected ? 'opacity-50' : ''}`}>
                      <td className="p-2">
                        <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} className="rounded" />
                      </td>
                      <td className="p-2 font-mono text-xs">{row.date}</td>
                      <td className="p-2">
                        <input
                          value={row.description}
                          onChange={e => updateRow(i, 'description', e.target.value)}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0"
                        />
                      </td>
                      <td className={`p-2 text-right font-medium ${row.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {row.type === 'income' ? '+' : '-'}R$ {row.amount.toFixed(2)}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <select
                            value={row.type}
                            onChange={e => updateRow(i, 'type', e.target.value)}
                            className={`bg-transparent border-0 p-0 text-sm ${!row.typeConfirmed ? 'text-amber-600 font-medium' : ''}`}
                          >
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
                          </select>
                          {!row.typeConfirmed && (
                            <span title="Tipo não identificado automaticamente — confirme" className="text-amber-500">?</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <select
                          value={row.categoryId}
                          onChange={e => updateRow(i, 'categoryId', e.target.value)}
                          className="bg-transparent border-0 p-0 text-sm max-w-[140px]"
                        >
                          <option value="">Selecionar...</option>
                          {(row.type === 'income' ? incomeCategories : expenseCategories).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        {row.isDuplicate && (
                          <span title="Possível duplicata">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleConfirmImport} disabled={selectedRows.length === 0}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Importar {selectedRows.length} transações
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 'summary' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold">Importação concluída!</h3>
            <p className="text-muted-foreground">
              {selectedRows.length} transação(ões) foram adicionadas ao sistema.
            </p>
            <div className="flex justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
                {incomeCount} receitas
              </span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">
                {expenseCount} despesas
              </span>
            </div>
            {fileName && (
              <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>
            )}
            <Button onClick={handleClose} className="mt-4">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
