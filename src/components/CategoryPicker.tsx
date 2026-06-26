import { useMemo, useState } from 'react';
import { Category } from '@/types/finance';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search } from 'lucide-react';

interface CategoryPickerProps {
  categories: Category[];
  currentId?: string;
  type?: 'income' | 'expense';
  onSelect: (id: string) => void;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

export function CategoryPicker({ categories, currentId, type, onSelect, children, align = 'start' }: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    const pool = type ? categories.filter((c) => c.type === type) : categories;
    return pool.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, type, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-60 p-2" align={align} onClick={(e) => e.stopPropagation()}>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoria..."
            className="w-full pl-7 pr-2 py-1.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(c.id);
                setOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-left text-xs ${c.id === currentId ? 'bg-accent/60' : ''}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{c.type}</span>
            </button>
          ))}
          {!list.length && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma categoria</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
