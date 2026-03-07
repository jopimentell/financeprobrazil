import { useState } from 'react';
import { Plus, X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface FABProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
}

export function FloatingActionButton({ onAddIncome, onAddExpense }: FABProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 animate-slide-up">
          <button
            onClick={() => { onAddIncome(); setOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium text-white transition-transform"
            style={{ backgroundColor: 'hsl(142 71% 45%)' }}
          >
            <ArrowDownCircle className="h-4 w-4" /> Receita
          </button>
          <button
            onClick={() => { onAddExpense(); setOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium text-white transition-transform"
            style={{ backgroundColor: 'hsl(0 84% 60%)' }}
          >
            <ArrowUpCircle className="h-4 w-4" /> Despesa
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
}
