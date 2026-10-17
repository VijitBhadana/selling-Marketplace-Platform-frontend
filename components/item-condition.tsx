import { Recycle } from 'lucide-react';
import { conditionLabel } from '@/lib/item-condition';

/** "Second hand" / "Refurbished" tag on a pre-owned item; renders nothing for a new one. */
export function ConditionBadge({ condition, className = '' }: { condition?: string | null; className?: string }) {
  const label = conditionLabel(condition);
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm ${className}`}
    >
      <Recycle size={10} className="shrink-0" /> {label}
    </span>
  );
}
