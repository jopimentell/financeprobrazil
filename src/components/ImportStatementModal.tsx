import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/contexts/FinanceContext';
import {
  Upload, FileText, ClipboardPaste, CheckCircle2, AlertTriangle,
  ChevronLeft, ChevronRight, Save, Trash2, Settings2, Plus, Wallet,
  ArrowLeftRight, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { detectTransactionType, suggestCategory, learnType, learnCategory } from '@/utils/transactionIntelligence';
import { fetchRules, applyRulesToTransactions } from '@/services/categorizationService';
import { useAuth } from '@/contexts/AuthContext';
import { parseBRNumber } from '@/utils/parsers/numberUtils';
import { parseDate, isValidDate } from '@/utils/parsers/dateUtils';
import { parseRawFile, parseOFXToRaw, RawFileData } from '@/utils/rawFileParser';
import {
  ColumnMapping, ColumnRole, TypeDetectionMode, ImportTemplate,
  autoDetectMappings, getSavedTemplates, saveTemplate, deleteTemplate, ROLE_LABELS
} from '@/utils/importTemplates';
import type { ParsedRow } from '@/utils/parsers/types';
import { QuickAccountModal } from './QuickAccountModal';
import { scoreTransferLikelihood } from '@/utils/transferDetection';
import { Account, TransactionType } from '@/types/finance';

type Step = 'account' | 'upload' | 'mapping' | 'review' | 'transfers' | 'summary';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ImportRow extends ParsedRow {
  type: TransactionType;
  isTransfer?: boolean;
  transferAccountId?: string;
  transferConfidence?: number;
  transferReason?: string;
}

export function ImportStatementModal({ open, onClose }: Props) {
  const { transactions, categories, accounts, addTransaction } = useFinance();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('account');
  const [fileName, setFileName] = useState('');
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');

  // Account selection
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [quickAccountOpen, setQuickAccountOpen] = useState(false);

  // Raw file data
  const [rawData, setRawData] = useState<RawFileData | null>(null);

  // Column mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [typeMode, setTypeMode] = useState<TypeDetectionMode>('by-sign');
  const [templateName, setTemplateName] = useState('');

  // Review state
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');

  const expenseCategories = useMemo(() => categories.filter(c => c.type === 'expense'), [categories]);
  const incomeCategories = useMemo(() => categories.filter(c => c.type === 'income'), [categories]);
  const savedTemplates = useMemo(() => getSavedTemplates(), [step]);
  const otherAccounts = useMemo(() => accounts.filter(a => a.id !== targetAccountId), [accounts, targetAccountId]);
  const targetAccount = accounts.find(a => a.id === targetAccountId);

  const resetState = useCallback(() => {
    setStep('account');
    setRows([]);
    setPasteText('');
    setImportMode('file');
    setBulkCategory('');
    setFileName('');
    setRawData(null);
    setMappings([]);
    setTypeMode('by-sign');
    setTemplateName('');
    setTargetAccountId('');
  }, []);

  const handleClose = () => { resetState(); onClose(); };

  // ── File Upload ──
  const processFileText = useCallback((text: string, name: string) => {
    const ext = name.toLowerCase();
    let data: RawFileData;
    if (ext.endsWith('.ofx') || ext.endsWith('.qfx')) data = parseOFXToRaw(text);
    else data = parseRawFile(text);

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
        const hasGarbled = text.includes('�') || text.includes('Ã§') || text.includes('Ã£');
        if (!hasGarbled) { processFileText(text, file.name); return; }
      }
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

  const updateMapping = (index: number, role: ColumnRole) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, role } : m));
  };

  const mappingValidation = useMemo(() => {
    const hasDate = mappings.some(m => m.role === 'date');
    const hasAmount = mappings.some(m => m.role === 'amount');
    const hasDescription = mappings.some(m => m.role === 'description' || m.role === 'beneficiary');
    return { hasDate, hasAmount, hasDescription, isValid: hasDate && hasAmount && hasDescription };
  }, [mappings]);

  const matchCategory = useCallback((suggestion: string, type: 'income' | 'expense') => {
    const cats = type === 'income' ? incomeCategories : expenseCategories;
    const found = cats.find(c => c.name.toLowerCase().includes(suggestion.toLowerCase()));
    return found?.id || cats[0]?.id || '';
  }, [expenseCategories, incomeCategories]);

  const applyMapping = async () => {
    if (!rawData || !mappingValidation.isValid) return;
    let userRules: Awaited<ReturnType<typeof fetchRules>> = [];
    if (user?.id) { try { userRules = await fetchRules(user.id); } catch { /* ignore */ } }

    const dateIdx = mappings.findIndex(m => m.role === 'date');
    const amountIdx = mappings.findIndex(m => m.role === 'amount');
    const descIdx = mappings.findIndex(m => m.role === 'description');
    const beneIdx = mappings.findIndex(m => m.role === 'beneficiary');
    const typeIdx = mappings.findIndex(m => m.role === 'type');

    const TYPE_INCOME_WORDS = ['receita', 'entrada', 'crédito', 'credito', 'credit', 'income'];
    const TYPE_EXPENSE_WORDS = ['despesa', 'saída', 'saida', 'débito', 'debito', 'debit', 'expense'];

    const parsed: ImportRow[] = [];
    for (const row of rawData.rows) {
      const rawDate = row[dateIdx]?.trim();
      if (!rawDate || !isValidDate(rawDate)) continue;
      const date = parseDate(rawDate);
      const amount = parseBRNumber(row[amountIdx] || '');
      if (isNaN(amount) || amount === 0) continue;

      const descParts: string[] = [];
      if (descIdx >= 0 && row[descIdx]?.trim()) descParts.push(row[descIdx].trim());
      if (beneIdx >= 0 && row[beneIdx]?.trim()) descParts.push(row[beneIdx].trim());
      const description = descParts.join(' - ').replace(/\s+/g, ' ').trim() || 'Transação importada';

      let type: 'income' | 'expense';
      let typeConfirmed = true;
      if (typeMode === 'all-income') type = 'income';
      else if (typeMode === 'all-expense') type = 'expense';
      else if (typeMode === 'by-column' && typeIdx >= 0) {
        const typeVal = (row[typeIdx] || '').toLowerCase().trim();
        if (TYPE_INCOME_WORDS.some(w => typeVal.includes(w))) type = 'income';
        else if (TYPE_EXPENSE_WORDS.some(w => typeVal.includes(w))) type = 'expense';
        else { type = amount >= 0 ? 'income' : 'expense'; typeConfirmed = false; }
      } else {
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

    const withRules = userRules.length > 0
      ? (applyRulesToTransactions(userRules, parsed as ParsedRow[]) as ImportRow[])
      : parsed;
    const rulesApplied = withRules.filter((r, i) => r.categoryId !== parsed[i].categoryId).length;

    setRows(withRules);
    setStep('review');
    if (rulesApplied > 0) {
      toast.success(`${rulesApplied} transações categorizadas automaticamente por regras.`);
    }
  };

  // ── Review helpers ──
  const toggleRow = (i: number) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleAll = () => { const all = rows.every(r => r.selected); setRows(prev => prev.map(r => ({ ...r, selected: !all }))); };
  const updateRow = (i: number, field: keyof ImportRow, value: any) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const applyBulkCategory = () => {
    if (!bulkCategory) return;
    setRows(prev => prev.map(r => r.selected ? { ...r, categoryId: bulkCategory } : r));
    toast.success('Categoria aplicada.');
  };

  const selectedRows = useMemo(() => rows.filter(r => r.selected), [rows]);
  const incomeCount = useMemo(() => selectedRows.filter(r => r.type === 'income').length, [selectedRows]);
  const expenseCount = useMemo(() => selectedRows.filter(r => r.type === 'expense').length, [selectedRows]);
  const transferCount = useMemo(() => selectedRows.filter(r => r.type === 'transfer').length, [selectedRows]);
  const duplicateCount = useMemo(() => rows.filter(r => r.isDuplicate).length, [rows]);

  // ── Step 4 → 5: detect transfer candidates ──
  const goToTransfers = () => {
    const scored = rows.map((r) => {
      if (r.type === 'transfer') return r;
      const { score, reason } = scoreTransferLikelihood(r as ParsedRow, accounts);
      const defaultDest = otherAccounts[0]?.id;
      return { ...r, transferConfidence: score, transferReason: reason, transferAccountId: r.transferAccountId || defaultDest };
    });
    setRows(scored);
    setStep('transfers');
  };

  const candidates = useMemo(
    () => rows.map((r, i) => ({ ...r, _idx: i })).filter(r => (r.transferConfidence || 0) >= 50 && r.selected),
    [rows],
  );

  const confirmAsTransfer = (i: number, destAccountId: string) => {
    setRows(prev => prev.map((r, idx) => idx === i
      ? { ...r, type: 'transfer' as TransactionType, transferAccountId: destAccountId, categoryId: '' }
      : r));
  };
  const dismissTransfer = (i: number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, transferConfidence: 0 } : r));
  };
  const confirmAllTransfers = () => {
    setRows(prev => prev.map(r => {
      if ((r.transferConfidence || 0) >= 50 && r.selected && r.type !== 'transfer' && r.transferAccountId) {
        return { ...r, type: 'transfer' as TransactionType, categoryId: '' };
      }
      return r;
    }));
    toast.success(`${candidates.length} transferência(s) confirmadas`);
  };

  // ── Final import ──
  const handleConfirmImport = async () => {
    if (!targetAccountId) { toast.error('Selecione a conta destino'); return; }
    let imported = 0;
    for (const row of selectedRows) {
      if (row.type !== 'transfer') {
        learnType(row.description, row.type);
        const catName = categories.find(c => c.id === row.categoryId)?.name;
        if (catName) learnCategory(row.description, catName);
      }
      addTransaction({
        description: row.description, amount: row.amount, type: row.type,
        categoryId: row.type === 'transfer' ? '' : row.categoryId,
        accountId: targetAccountId,
        transferAccountId: row.type === 'transfer' ? row.transferAccountId : undefined,
        date: row.date,
        status: 'paid', recurrence: 'none', origin: 'importacao' as any,
      });
      imported++;
    }
    toast.success(`${imported} transação(ões) importada(s)!`);
    setStep('summary');
  };

  const previewRows = rawData?.rows.slice(0, 5) || [];

  // ── stepper ──
  const stepIndex = (['account', 'upload', 'mapping', 'review', 'transfers', 'summary'] as Step[]).indexOf(step);
  const stepLabels = ['Conta', 'Arquivo', 'Mapear', 'Revisar', 'Transferências', 'Concluído'];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="p-0 w-[95vw] max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 border-b border-border shrink-0 space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Importar extrato
          </DialogTitle>
          {/* Stepper */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1 shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium ${
                  i === stepIndex ? 'bg-primary text-primary-foreground' :
                  i < stepIndex ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < stepLabels.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6">
        {/* ─── Step 1: Account selection ─── */}
        {step === 'account' && (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="text-base font-semibold mb-1">Qual conta este extrato pertence?</h3>
              <p className="text-sm text-muted-foreground">Todas as transações importadas serão vinculadas a esta conta.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {accounts.map((a) => (
                <button key={a.id} type="button" onClick={() => setTargetAccountId(a.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all min-h-[64px] ${
                    targetAccountId === a.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-input hover:border-primary/50'
                  }`}>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {a.type === 'credit_card' ? <Building2 className="h-5 w-5 text-primary" /> : <Wallet className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">Saldo: R$ {a.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  {targetAccountId === a.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                </button>
              ))}
              <button type="button" onClick={() => setQuickAccountOpen(true)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-input hover:border-primary text-sm font-medium text-muted-foreground hover:text-primary transition-colors min-h-[64px]">
                <Plus className="h-4 w-4" /> Criar nova conta
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep('upload')} disabled={!targetAccountId}>
                Continuar <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Upload ─── */}
        {step === 'upload' && (
          <div className="space-y-4 py-2">
            {targetAccount && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 text-xs">
                <Wallet className="h-4 w-4 text-primary" />
                <span>Importando para <strong>{targetAccount.name}</strong></span>
                <button onClick={() => setStep('account')} className="ml-auto text-primary hover:underline">Trocar</button>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant={importMode === 'file' ? 'default' : 'outline'} onClick={() => setImportMode('file')} className="flex-1">
                <FileText className="h-4 w-4 mr-1" /> Arquivo (CSV / OFX)
              </Button>
              <Button variant={importMode === 'paste' ? 'default' : 'outline'} onClick={() => setImportMode('paste')} className="flex-1">
                <ClipboardPaste className="h-4 w-4 mr-1" /> Colar texto
              </Button>
            </div>

            {importMode === 'file' && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl p-10 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Clique para selecionar arquivo</span>
                  <span className="text-xs text-muted-foreground mt-1">CSV, OFX, QFX ou TXT</span>
                  <input type="file" accept=".csv,.ofx,.qfx,.txt,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}
            {importMode === 'paste' && (
              <div className="space-y-3">
                <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                  placeholder={"07/03/2026;Pix recebido;João Silva;24,00\n07/03/2026;Pix enviado;Maria Santos;-5,00"}
                  className="w-full h-48 px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono resize-none" />
                <Button onClick={handlePasteImport} className="w-full">Processar texto</Button>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('account')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Mapping ─── */}
        {step === 'mapping' && rawData && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4 py-2">
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

            <div className="space-y-2">
              <p className="text-sm font-medium">Defina o que cada coluna representa:</p>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {mappings.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-xs text-muted-foreground truncate" title={m.columnHeader}>{m.columnHeader}</p>
                    <select value={m.role} onChange={e => updateMapping(i, e.target.value as ColumnRole)}
                      className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-xs">
                      {(Object.entries(ROLE_LABELS) as [ColumnRole, string][]).map(([role, label]) => (
                        <option key={role} value={role}>{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Como identificar Receita / Despesa?</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'by-sign', label: 'Pelo sinal do valor (+/-)', desc: 'Positivo = receita' },
                  { value: 'by-column', label: 'Por coluna', desc: 'Coluna "Tipo"' },
                  { value: 'all-income', label: 'Tudo é receita', desc: '' },
                  { value: 'all-expense', label: 'Tudo é despesa', desc: '' },
                ] as { value: TypeDetectionMode; label: string; desc: string }[]).map(opt => (
                  <button key={opt.value} onClick={() => setTypeMode(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
                      typeMode === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:border-primary/50'
                    }`}>
                    <span className="font-medium block">{opt.label}</span>
                    {opt.desc && <span className="text-muted-foreground">{opt.desc}</span>}
                  </button>
                ))}
              </div>
            </div>

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

            {!mappingValidation.isValid && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                Mapeamento incompleto: defina <strong>Data</strong>, <strong>Valor</strong> e <strong>Descrição</strong>.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
                <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                  placeholder="Nome do modelo"
                  className="px-2 py-1 rounded border border-input bg-background text-xs w-40" />
                <Button variant="outline" size="sm" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                  <Save className="h-3 w-3 mr-1" /> Salvar
                </Button>
              </div>
              <Button onClick={applyMapping} disabled={!mappingValidation.isValid}>
                Revisar <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Review ─── */}
        {step === 'review' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 rounded-full bg-muted font-medium">{rows.length} transações</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">{incomeCount} receitas</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">{expenseCount} despesas</span>
              {transferCount > 0 && <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 font-medium">{transferCount} transferências</span>}
              {duplicateCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {duplicateCount} duplicatas
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
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={`border-b border-border ${row.isDuplicate ? 'bg-yellow-500/5' : ''} ${!row.selected ? 'opacity-50' : ''}`}>
                      <td className="p-2"><input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} className="rounded" /></td>
                      <td className="p-2 font-mono text-xs">{row.date}</td>
                      <td className="p-2">
                        <input value={row.description} onChange={e => updateRow(i, 'description', e.target.value)}
                          className="w-full bg-transparent border-0 p-0 text-sm focus:outline-none" />
                      </td>
                      <td className={`p-2 text-right font-medium ${row.type === 'income' ? 'text-emerald-600' : row.type === 'expense' ? 'text-red-500' : 'text-slate-500'}`}>
                        {row.type === 'income' ? '+' : row.type === 'expense' ? '-' : '↔'}R$ {row.amount.toFixed(2)}
                      </td>
                      <td className="p-2">
                        <select value={row.type} onChange={e => updateRow(i, 'type', e.target.value)}
                          className={`bg-transparent border-0 p-0 text-sm ${!row.typeConfirmed ? 'text-amber-600 font-medium' : ''}`}>
                          <option value="income">Receita</option>
                          <option value="expense">Despesa</option>
                          <option value="transfer">Transferência</option>
                        </select>
                      </td>
                      <td className="p-2">
                        {row.type === 'transfer' ? (
                          <select value={row.transferAccountId || ''} onChange={e => updateRow(i, 'transferAccountId', e.target.value)}
                            className="bg-transparent border-0 p-0 text-sm max-w-[140px]">
                            <option value="">→ Conta destino</option>
                            {otherAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        ) : (
                          <select value={row.categoryId} onChange={e => updateRow(i, 'categoryId', e.target.value)}
                            className="bg-transparent border-0 p-0 text-sm max-w-[140px]">
                            <option value="">Selecionar...</option>
                            {(row.type === 'income' ? incomeCategories : expenseCategories).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-2 gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Mapeamento
              </Button>
              <Button onClick={goToTransfers} disabled={selectedRows.length === 0}>
                <ArrowLeftRight className="h-4 w-4 mr-1" /> Revisar transferências
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 5: Transfer review ─── */}
        {step === 'transfers' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4" /> Possíveis transferências entre suas contas
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Transferências não afetam receitas, despesas ou relatórios. Confirme para que o saldo fique correto.
              </p>
            </div>

            {candidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                Nenhuma transferência detectada. Você pode prosseguir.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{candidates.length} candidato(s)</span>
                  <Button size="sm" variant="outline" onClick={confirmAllTransfers}>Confirmar todas</Button>
                </div>
                <div className="flex-1 overflow-auto space-y-2">
                  {candidates.map((c) => {
                    const isConfirmed = c.type === 'transfer';
                    return (
                      <div key={c._idx} className={`rounded-xl border p-3 ${isConfirmed ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-input'}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm truncate">{c.description}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                {c.transferConfidence}%
                              </span>
                              {isConfirmed && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">
                                  Confirmada
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.date} • R$ {c.amount.toFixed(2)} • {c.transferReason || 'palavras-chave de transferência'}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              <span className="text-muted-foreground">{targetAccount?.name}</span>
                              <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                              <select value={c.transferAccountId || ''}
                                onChange={(e) => updateRow(c._idx, 'transferAccountId', e.target.value)}
                                className="px-2 py-1 rounded border border-input bg-background text-xs">
                                <option value="">Conta destino</option>
                                {otherAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <Button size="sm" variant={isConfirmed ? 'default' : 'outline'}
                              onClick={() => c.transferAccountId && confirmAsTransfer(c._idx, c.transferAccountId)}
                              disabled={!c.transferAccountId}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirmar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => dismissTransfer(c._idx)}>
                              Ignorar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep('review')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleConfirmImport}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Importar {selectedRows.length} transação(ões)
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 6: Summary ─── */}
        {step === 'summary' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-bold">Importação concluída!</h3>
            <p className="text-muted-foreground">{selectedRows.length} transação(ões) foram adicionadas a <strong>{targetAccount?.name}</strong>.</p>
            <div className="flex justify-center gap-2 text-sm flex-wrap">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">{incomeCount} receitas</span>
              <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">{expenseCount} despesas</span>
              {transferCount > 0 && <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 font-medium">{transferCount} transferências</span>}
            </div>
            {fileName && <p className="text-xs text-muted-foreground">Arquivo: {fileName}</p>}
            <Button onClick={handleClose} className="mt-4">Fechar</Button>
          </div>
        )}
        </div>

        <QuickAccountModal
          open={quickAccountOpen}
          onClose={() => setQuickAccountOpen(false)}
          onCreated={(acc: Account) => { setTargetAccountId(acc.id); }}
        />
      </DialogContent>
    </Dialog>
  );
}
