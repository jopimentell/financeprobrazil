import { FinancialNature } from '@/types/finance';
import { natureMeta } from '@/utils/natureEngine';
import { AlertCircle } from 'lucide-react';

interface NatureBadgeProps {
  nature?: FinancialNature;
  /** false = suggestion waiting for confirmation */
  confirmed?: boolean;
  className?: string;
  onClick?: () => void;
}

/** Small pill showing what a movement represents financially. */
export function NatureBadge({ nature, confirmed = true, className = '', onClick }: NatureBadgeProps) {
  const meta = natureMeta(nature || 'unclassified');
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${meta.badgeClass} ${
        !confirmed ? 'opacity-70 border border-dashed border-current' : ''
      } ${onClick ? 'hover:opacity-80 cursor-pointer' : ''} ${className}`}
      title={!confirmed ? 'Sugestão — confirme a classificação' : meta.label}
    >
      {!confirmed && <AlertCircle className="h-2.5 w-2.5" />}
      {meta.label}
    </Tag>
  );
}
