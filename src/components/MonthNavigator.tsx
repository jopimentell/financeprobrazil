import { ChevronLeft, ChevronRight } from 'lucide-react';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  mode?: 'month' | 'year';
}

export function MonthNavigator({ year, month, onPrev, onNext, mode = 'month' }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-4">
      <button onClick={onPrev} className="p-2 rounded-lg hover:bg-accent transition-colors">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-lg font-semibold min-w-[180px] text-center">
        {mode === 'month' ? `${monthNames[month]} ${year}` : `${year}`}
      </span>
      <button onClick={onNext} className="p-2 rounded-lg hover:bg-accent transition-colors">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
