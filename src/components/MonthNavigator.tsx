import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface MonthNavigatorProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  mode?: 'month' | 'year';
}

export function MonthNavigator({ year, month, onPrev, onNext, mode = 'month' }: MonthNavigatorProps) {
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePrev = () => {
    setDirection('right');
    onPrev();
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDirection(null), 300);
  };

  const handleNext = () => {
    setDirection('left');
    onNext();
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDirection(null), 300);
  };

  const label = mode === 'month' ? `${monthNames[month]} ${year}` : `${year}`;

  return (
    <div className="flex items-center w-full sm:w-auto gap-2 bg-card border border-border rounded-xl px-2 py-1.5 shadow-sm">
      <button
        onClick={handlePrev}
        className="p-2.5 rounded-lg hover:bg-accent active:scale-95 transition-all duration-150 touch-manipulation"
        aria-label="Período anterior"
      >
        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0 overflow-hidden">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
        <span
          className={`text-sm sm:text-base font-semibold text-foreground whitespace-nowrap transition-all duration-300 ${
            direction === 'left' ? 'animate-slide-label-left' : direction === 'right' ? 'animate-slide-label-right' : ''
          }`}
        >
          {label}
        </span>
      </div>
      <button
        onClick={handleNext}
        className="p-2.5 rounded-lg hover:bg-accent active:scale-95 transition-all duration-150 touch-manipulation"
        aria-label="Próximo período"
      >
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>
    </div>
  );
}
