import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceContext';
import {
  Upload, FileText, ClipboardPaste, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Save, Trash2, Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import { detectTransactionType, suggestCategory, learnType, learnCategory } from '@/utils/transactionIntelligence';
import { parseBRNumber } from '@/utils/parsers/numberUtils';
import { parseDate, isValidDate } from '@/utils/parsers/dateUtils';
import { parseRawFile, parseOFXToRaw, RawFileData } from '@/utils/rawFileParser';
import {
  ColumnMapping, ColumnRole, TypeDetectionMode, ImportTemplate,
  autoDetectMappings, getSavedTemplates, saveTemplate, deleteTemplate, ROLE_LABELS
} from '@/utils/importTemplates';
import type { ParsedRow } from '@/utils/parsers/types';

type Step = 'upload' | 'mapping' | 'review' | 'summary';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImportStatementModal({ open, onClose }: Props) {
  const { transactions, categories, accounts, addTransaction } = useFinance();

  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');

  // Raw file data
  const [rawData, setRawData] = useState<RawFileData | null>(null);

  // Column mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [typeMode, setTypeMode] = useState<TypeDetectionMode>('by-sign');
  const [templateName, setTemplateName] = useState('');

  // Review state
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const savedTemplates = useMemo(() => getSavedTemplates(), [step]); // refresh on step change

  const resetState = useCallback(() => {
    setStep('upload');
    setRows([]);
    setPasteText('');
    setImportMode('file');
    setBulkCategory('');
    setFileName('');
    setRawData(null);
    setMappings([]);
    setTypeMode('by-sign');
    setTemplateName('');
  }, []);

  const handleClose = () => { resetState(); onClose(); };

  // ── File Upload ──
  const processFileText = useCallback((text: string, name: string) => {
    const ext = name.toLowerCase();
    let data: RawFileData;

    if (ext.endsWith('.ofx') || ext.endsWith('.qfx')) {
      data = parseOFXToRaw(text);
    } else {
      data = parseRawFile(text);
    }

    if (data.rows.length === 0) {
      toast.error('Não foi possível interpretar o arquivo. Verifique o formato.');
      return;
    }

    setRawData(data);
    setMappings(autoDetectMappings(data.headers));
    setStep('mapping');
    toast.success(`${data.rows.length} linhas detectadas.`);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const readerUtf8 = new FileReader();
    readerUtf8.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        // Check if it looks garbled (ISO-8859-1 read as UTF-8)
        const hasGarbled = text.includes('�') || text.includes('Ã§') || text.includes('Ã£');
        if (!hasGarbled) {
          processFileText(text, file.name);
          return;
        }
      }
      // Fallback: ISO-8859-1
      const readerLatin = new FileReader();
      readerLatin.onload = (ev2) => {
        const t = ev2.target?.result as string;
        if (t) processFileText(t, file.name);
        else toast.error('Erro ao ler arquivo.');
      };
      readerLatin.readAsText(file, 'ISO-8859-1');
    };
    readerUtf8.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) { toast.error('Cole o texto do extrato.'); return; }
    setFileName('texto colado');
    processFileText(pasteText, 'paste.csv');
  };

  // ── Apply Template ──
  const applyTemplate = (template: ImportTemplate) => {
    if (!rawData) return;
    const newMappings = rawData.headers.map((h, i) => {
      const saved = template.columnMappings.find(m => m.columnIndex === i);
      return saved || { columnIndex: i, columnHeader: h, role: 'ignore' as ColumnRole };
    });
    setMappings(newMappings);
    setTypeMode(template.typeMode);
    toast.success(`Modelo "${template.name}" aplicado.`);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) { toast.error('Digite um nome para o modelo.'); return; }
    const id = `tpl_${Date.now()}`;
    saveTemplate({ id, name: templateName, separator: rawData?.separator || ',', columnMappings: mappings, typeMode, createdAt: new Date().toISOString() });
    toast.success(`Modelo "${templateName}" salvo!`);
    setTemplateName('');
  };

  // ── Column Mapping Update ──
  const updateMapping = (index: number, role: ColumnRole) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, role } : m));
  };

  // ── Validation ──
  const mappingValidation = useMemo(() => {
    const hasDate = mappings.some(m => m.role === 'date');
    const hasAmount = mappings.some(m => m.role === 'amount');
    const hasDescription = mappings.some(m => m.role === 'description' || m.role === 'beneficiary');
    return { hasDate, hasAmount, hasDescription, isValid: hasDate && hasAmount && hasDescription };
  }, [mappings]);

  // ── Process Mapping → ParsedRows ──
  const matchCategory = useCallback((suggestion: string, type: 'income' | 'expense') => {
    const cats = type === 'income' ? incomeCategories : expenseCategories;
    const found = cats.find(c => c.name.toLowerCase().includes(suggestion.toLowerCase()));
    return found?.id || cats[0]?.id || '';
  }, [expenseCategories, incomeCategories]);

  const applyMapping = () => {
    if (!rawData || !mappingValidation.isValid) return;

    const dateIdx = mappings.findIndex(m => m.role === 'date');
    const amountIdx = mappings.findIndex(m => m.role === 'amount');
    const descIdx = mappings.findIndex(m => m.role === 'description');
    const beneIdx = mappings.findIndex(m => m.role === 'beneficiary');
    const typeIdx = mappings.findIndex(m => m.role === 'type');

    const TYPE_INCOME_WORDS = ['receita', 'entrada', 'crédito', 'credito', 'credit', 'income'];
    const TYPE_EXPENSE_WORDS = ['despesa', 'saída', 'saida', 'débito', 'debito', 'debit', 'expense'];

    const parsed: ParsedRow[] = [];

    for (const row of rawData.rows) {
      const rawDate = row[dateIdx]?.trim();
      if (!rawDate || !isValidDate(rawDate)) continue;
      const date = parseDate(rawDate);

      const amount = parseBRNumber(row[amountIdx] || '');
      if (isNaN(amount) || amount === 0) continue;

      // Build description
      const descParts: string[] = [];
      if (descIdx >= 0 && row[descIdx]?.trim()) descParts.push(row[descIdx].trim());
      if (beneIdx >= 0 && row[beneIdx]?.trim()) descParts.push(row[beneIdx].trim());
      const description = descParts.join(' - ').replace(/\s+/g, ' ').trim() || 'Transação importada';

      // Determine type
      let type: 'income' | 'expense';
      let typeConfirmed = true;

      if (typeMode === 'all-income') {
        type = 'income';
      } else if (typeMode === 'all-expense') {
        type = 'expense';
      } else if (typeMode === 'by-column' && typeIdx >= 0) {
        const typeVal = (row[typeIdx] || '').toLowerCase().trim();
        if (TYPE_INCOME_WORDS.some(w => typeVal.includes(w))) type = 'income';
        else if (TYPE_EXPENSE_WORDS.some(w => typeVal.includes(w))) type = 'expense';
        else { type = amount >= 0 ? 'income' : 'expense'; typeConfirmed = false; }
      } else {
        // by-sign: also check description keywords first
        const detected = detectTransactionType(description, amount);
        type = detected === 'unknown' ? (amount >= 0 ? 'income' : 'expense') : detected;
        typeConfirmed = detected !== 'unknown';
      }

      const suggested = suggestCategory(description);
      const isDuplicate = transactions.some(t =>
        t.date === date && Math.abs(t.amount - Math.abs(amount)) < 0.01 &&
        t.description.toLowerCase() === description.toLowerCase()
      );

      parsed.push({
        date, description, amount: Math.abs(amount), type,
        categoryId: matchCategory(suggested, type), suggestedCategory: suggested,
        selected: true, isDuplicate, typeConfirmed,
      });
    }

    if (parsed.length === 0) {
      toast.error('Nenhuma transação válida encontrada. Verifique o mapeamento.');
      return;
    }

    setRows(parsed);
    setStep('review');
  };

  // ── Review helpers ──
  const toggleRow = (i: number) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleAll = () => { const all = rows.every(r => r.selected); setRows(prev => prev.map(r => ({ ...r, selected: !all }))); };
  const updateRow = (i: number, field: keyof ParsedRow, value: any) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const applyBulkCategory = () => {
    if (!bulkCategory) return;
    setRows(prev => prev.map(r => r.selected ? { ...r, categoryId: bulkCategory } : r));
    toast.success('Categoria aplicada.');
  };

  const selectedRows = useMemo(() => rows.filter(r => r.selected), [rows]);
  const incomeCount = useMemo(() => selectedRows.filter(r => r.type === 'income').length, [selectedRows]);
  const expenseCount = useMemo(() => selectedRows.filter(r => r.type === 'expense').length, [selectedRows]);
  const duplicateCount = useMemo(() => rows.filter(r => r.isDuplicate).length, [rows]);

  const handleConfirmImport = () => {
    const accountId = accounts[0]?.id || '';
    let imported = 0;
    for (const row of selectedRows) {
      learnType(row.description, row.type);
      const catName = categories.find(c => c.id === row.categoryId)?.name;
      if (catName) learnCategory(row.description, catName);
      addTransaction({
        description: row.description, amount: row.amount, type: row.type,
        categoryId: row.categoryId, accountId, date: row.date,
        status: 'paid', recurrence: 'none', origin: 'importacao' as any,
      });
      imported++;
    }
    toast.success(`${imported} transação(ões) importada(s) com sucesso!`);
    setStep('summary');
  };

  // Preview rows for mapping step (first 5)
  const previewRows = rawData?.rows.slice(0, 5) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {step === 'upload' && 'Importar Extrato'}
            {step === 'mapping' && 'Mapear Colunas'}
            {step === 'review' && 'Revisar Transações'}
            {step === 'summary' && 'Importação Concluída'}
          </DialogTitle>
        </DialogHeader>

        {/* ─── Step 1: Upload ─── */}
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
                  Formatos aceitos: <strong>CSV</strong>, <strong>OFX</strong>, <strong>QFX</strong>, <strong>TXT</strong>
                </p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl p-10 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Clique para selecionar arquivo</span>
                  <span className="text-xs text-muted-foreground mt-1">ou arraste e solte aqui</span>
                  <input type="file" accept=".csv,.ofx,.qfx,.txt,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
                </label>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p>Após o upload, você poderá <strong>mapear as colunas</strong> do arquivo.</p>
                  <p>Compatível com qualquer banco: Inter, Nubank, Santander, Itaú, Bradesco, etc.</p>
                </div>
              </div>
            )}

            {importMode === 'paste' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Cole o extrato do banco abaixo:</p>
                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder={"07/03/2026;Pix recebido;João Silva;24,00\n07/03/2026;Pix enviado;Maria Santos;-5,00"}
                  className="w-full h-48 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <Button onClick={handlePasteImport} className="w-full">Processar Texto</Button>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Column Mapping ─── */}
        {step === 'mapping' && rawData && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4 py-2">
            {/* Saved templates */}
            {savedTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Modelos salvos:</p>
                <div className="flex flex-wrap gap-2">
                  {savedTemplates.map(tpl => (
                    <div key={tpl.id} className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => applyTemplate(tpl)} className="text-xs">
                        <Settings2 className="h-3 w-3 mr-1" /> {tpl.name}
                      </Button>
                      <button onClick={() => { deleteTemplate(tpl.id); toast.success('Modelo removido.'); }} className="text-muted-foreground hover:text-destructive p-1">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Column mapping selectors */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Defina o que cada coluna representa:</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(mappings.length, 6)}, 1fr)` }}>
                {mappings.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate" title={m.columnHeader}>{m.columnHeader}</p>
                    <select
                      value={m.role}
                      onChange={e => updateMapping(i, e.target.value as ColumnRole)}
                      className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-xs"
                    >
                      {(Object.entries(ROLE_LABELS) as [ColumnRole, string][]).map(([role, label]) => (
                        <option key={role} value={role}>{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Type detection mode */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Como identificar Receita / Despesa?</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'by-sign', label: 'Pelo sinal do valor (+/-)', desc: 'Positivo = receita, negativo = despesa' },
                  { value: 'by-column', label: 'Por coluna do arquivo', desc: 'Coluna mapeada como "Tipo"' },
                  { value: 'all-income', label: 'Tudo é receita', desc: 'Marcar todas como receita' },
                  { value: 'all-expense', label: 'Tudo é despesa', desc: 'Marcar todas como despesa' },
                ] as { value: TypeDetectionMode; label: string; desc: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeMode(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
                      typeMode === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium block">{opt.label}</span>
                    <span className="text-muted-foreground">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pré-visualização ({previewRows.length} de {rawData.rows.length} linhas):</p>
              <div className="overflow-auto rounded-lg border border-border max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {mappings.map((m, i) => (
                        <th key={i} className={`p-2 text-left whitespace-nowrap ${m.role !== 'ignore' ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {ROLE_LABELS[m.role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-b border-border">
                        {row.map((cell, ci) => (
                          <td key={ci} className={`p-2 truncate max-w-[200px] ${mappings[ci]?.role === 'ignore' ? 'text-muted-foreground/50' : ''}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation */}
            {!mappingValidation.isValid && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive space-y-1">
                <p className="font-medium">Mapeamento incompleto:</p>
                {!mappingValidation.hasDate && <p>• Faltando: coluna de <strong>Data</strong></p>}
                {!mappingValidation.hasAmount && <p>• Faltando: coluna de <strong>Valor</strong></p>}
                {!mappingValidation.hasDescription && <p>• Faltando: coluna de <strong>Descrição</strong> ou <strong>Favorecido</strong></p>}
              </div>
            )}

            {/* Save template + actions */}
            <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="Nome do modelo (ex: Banco Inter)"
                  className="px-2 py-1 rounded border border-input bg-background text-xs w-48"
                />
                <Button variant="outline" size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                  <Save className="h-3 w-3 mr-1" /> Salvar modelo
                </Button>
              </div>
              <Button onClick={applyMapping} disabled={!mappingValidation.isValid}>
                <ChevronRight className="h-4 w-4 mr-1" /> Revisar Transações
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Review ─── */}
        {step === 'review' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-muted font-medium">{rows.length} transações</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">{incomeCount} receitas</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">{expenseCount} despesas</span>
              {duplicateCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {duplicateCount} possíveis duplicatas
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {rows.every(r => r.selected) ? 'Desmarcar tudo' : 'Selecionar tudo'}
              </Button>
              <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="px-2 py-1 rounded border border-input bg-background text-sm">
                <option value="">Categoria em massa...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button variant="secondary" size="sm" onClick={applyBulkCategory} disabled={!bulkCategory}>Aplicar</Button>
            </div>

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
                        <input value={row.description} onChange={e => updateRow(i, 'description', e.target.value)}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0" />
                      </td>
                      <td className={`p-2 text-right font-medium ${row.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {row.type === 'income' ? '+' : '-'}R$ {row.amount.toFixed(2)}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <select value={row.type} onChange={e => updateRow(i, 'type', e.target.value)}
                            className={`bg-transparent border-0 p-0 text-sm ${!row.typeConfirmed ? 'text-amber-600 font-medium' : ''}`}>
                            <option value="income">Receita</option>
                            <option value="expense">Despesa</option>
                          </select>
                          {!row.typeConfirmed && <span title="Confirme o tipo" className="text-amber-500">?</span>}
                        </div>
                      </td>
                      <td className="p-2">
                        <select value={row.categoryId} onChange={e => updateRow(i, 'categoryId', e.target.value)}
                          className="bg-transparent border-0 p-0 text-sm max-w-[140px]">
                          <option value="">Selecionar...</option>
                          {(row.type === 'income' ? incomeCategories : expenseCategories).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        {row.isDuplicate && <span title="Possível duplicata"><AlertTriangle className="h-4 w-4 text-yellow-500" /></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar ao Mapeamento
              </Button>
              <Button onClick={handleConfirmImport} disabled={selectedRows.length === 0}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Importar {selectedRows.length} transações
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Summary ─── */}
        {step === 'summary' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold">Importação concluída!</h3>
            <p className="text-muted-foreground">{selectedRows.length} transação(ões) foram adicionadas ao sistema.</p>
            <div className="flex justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">{incomeCount} receitas</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">{expenseCount} despesas</span>
            </div>
            {fileName && <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>}
            <Button onClick={handleClose} className="mt-4">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
