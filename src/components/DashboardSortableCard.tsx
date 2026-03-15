import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ReactNode } from 'react';

interface SortableCardProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DashboardSortableCard({ id, children, className = '' }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group/drag ${className}`}>
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1 rounded-md opacity-0 group-hover/drag:opacity-60 hover:!opacity-100 transition-opacity duration-200 text-muted-foreground hover:bg-accent cursor-grab active:cursor-grabbing touch-manipulation"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}
