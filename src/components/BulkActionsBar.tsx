import { useState, useMemo } from 'react';
import { Transaction, Category, Account } from '@/types/finance';
import { Tag, Wallet, Calendar as CalendarIcon, TrendingUp, TrendingDown, Trash2, X, Search, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface BulkActionsBarProps {
  selectedIds: string[];
  totalFiltered: number;
  categories: Category[];
  accounts: Account[];
  onClear: () => void;
  onSelectAll: () => void;
  onApply: (updates: Partial<Transaction>) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function BulkActionsBar({
  selectedIds,
  totalFiltered,
  categories,
  accounts,
  onClear,
  onSelectAll,
  onApply,
  onDelete,
}: BulkActionsBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [accSearch, setAccSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const filteredCats = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase())),
    [categories, catSearch],
  );
  const filteredAccs = useMemo(
    () => accounts.filter((a) => a.name.toLowerCase().includes(accSearch.toLowerCase())),
    [accounts, accSearch],
  );

  const count = selectedIds.length;
  if (!count) return null;

  const applyAndClose = async (updates: Partial<Transaction>, label: string) => {
    await onApply(updates);
    toast.success(`${label} aplicado(a) a ${count} transação(ões)`);
    setOpenPopover(null);
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] max-w-3xl animate-fade-in">
        <div className="finance-card !p-2 shadow-xl border border-primary/30 bg-background/95 backdrop-blur">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-2 py-1 min-w-0">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                {count}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">selecionada(s)</span>
              {count < totalFiltered && (
                <button
                  onClick={onSelectAll}
                  className="text-xs text-primary font-medium hover:underline whitespace-nowrap"
                >
                  Selecionar todas ({totalFiltered})
                </button>
              )}
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-1 flex-wrap">
              {/* Change Category */}
              <Popover open={openPopover === 'cat'} onOpenChange={(o) => setOpenPopover(o ? 'cat' : null)}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-accent text-xs font-medium min-h-[40px]">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Categoria</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder="Buscar categoria..."
                      className="w-full pl-7 pr-2 py-1.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-0.5">
                    {filteredCats.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => applyAndClose({ categoryId: c.id }, `Categoria "${c.name}"`)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-left text-xs"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{c.type}</span>
                      </button>
                    ))}
                    {!filteredCats.length && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhuma categoria</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Change Account */}
              <Popover open={openPopover === 'acc'} onOpenChange={(o) => setOpenPopover(o ? 'acc' : null)}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-accent text-xs font-medium min-h-[40px]">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Conta</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      autoFocus
                      value={accSearch}
                      onChange={(e) => setAccSearch(e.target.value)}
                      placeholder="Buscar conta..."
                      className="w-full pl-7 pr-2 py-1.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-0.5">
                    {filteredAccs.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => applyAndClose({ accountId: a.id }, `Conta "${a.name}"`)}
                        className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-left text-xs"
                      >
                        <span className="flex-1 truncate">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Change Date */}
              <Popover open={openPopover === 'date'} onOpenChange={(o) => setOpenPopover(o ? 'date' : null)}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-accent text-xs font-medium min-h-[40px]">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Data</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" align="end">
                  <p className="text-xs font-medium mb-2">Alterar data</p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() => applyAndClose({ date }, 'Data')}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium"
                  >
                    <Check className="h-3.5 w-3.5" /> Aplicar
                  </button>
                </PopoverContent>
              </Popover>

              <button
                onClick={() => applyAndClose({ type: 'income' }, 'Tipo Receita')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-accent text-xs font-medium min-h-[40px]"
                title="Marcar como receita"
              >
                <TrendingUp className="h-3.5 w-3.5 finance-income" />
              </button>
              <button
                onClick={() => applyAndClose({ type: 'expense' }, 'Tipo Despesa')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-accent text-xs font-medium min-h-[40px]"
                title="Marcar como despesa"
              >
                <TrendingDown className="h-3.5 w-3.5 finance-expense" />
              </button>

              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-destructive/10 text-destructive text-xs font-medium min-h-[40px]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </button>

              <div className="w-px h-6 bg-border mx-1" />

              <button
                onClick={onClear}
                className="p-2 rounded-lg hover:bg-accent min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Limpar seleção"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {count} transação(ões)?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {count} transação(ões). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onDelete();
                toast.success(`${count} transação(ões) excluída(s)`);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
