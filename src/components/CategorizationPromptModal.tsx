import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Wand2, Tag } from 'lucide-react';
import { Transaction } from '@/types/finance';

interface CategorizationPromptModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  categoryName: string;
  similarCount: number;
  pattern: string;
  onApplyAll: () => void;
  onApplyOnly: () => void;
  onCreateRule: () => void;
}

export function CategorizationPromptModal({
  open,
  onClose,
  transaction,
  categoryName,
  similarCount,
  pattern,
  onApplyAll,
  onApplyOnly,
  onCreateRule,
}: CategorizationPromptModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'all' | 'only' | 'rule') => {
    setLoading(action);
    try {
      if (action === 'all') await onApplyAll();
      else if (action === 'only') await onApplyOnly();
      else if (action === 'rule') await onCreateRule();
    } finally {
      setLoading(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Categorização Inteligente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Context info */}
          <div className="rounded-lg bg-accent/50 p-3 space-y-1">
            <p className="text-sm font-medium truncate">{transaction.description}</p>
            <p className="text-xs text-muted-foreground">
              Nova categoria: <span className="font-medium text-foreground">{categoryName}</span>
            </p>
          </div>

          {/* Similar transactions found */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center space-y-1">
            <p className="text-2xl font-bold text-primary">{similarCount}</p>
            <p className="text-sm text-muted-foreground">
              transações similares encontradas com <span className="font-mono text-xs bg-accent px-1.5 py-0.5 rounded">"{pattern}"</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => handleAction('all')}
              disabled={loading !== null}
              className="w-full justify-start gap-3 h-auto py-3"
              variant="default"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Aplicar a todas similares</p>
                <p className="text-xs opacity-80">
                  Atualizar {similarCount} transações para "{categoryName}"
                </p>
              </div>
            </Button>

            <Button
              onClick={() => handleAction('only')}
              disabled={loading !== null}
              className="w-full justify-start gap-3 h-auto py-3"
              variant="outline"
            >
              <Tag className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Aplicar somente a esta</p>
                <p className="text-xs text-muted-foreground">
                  Alterar apenas esta transação
                </p>
              </div>
            </Button>

            <Button
              onClick={() => handleAction('rule')}
              disabled={loading !== null}
              className="w-full justify-start gap-3 h-auto py-3"
              variant="outline"
            >
              <Wand2 className="h-5 w-5 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Criar regra automática</p>
                <p className="text-xs text-muted-foreground">
                  Aplicar a todas e categorizar automaticamente no futuro
                </p>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
