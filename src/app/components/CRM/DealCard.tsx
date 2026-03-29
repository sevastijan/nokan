'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { CrmDeal } from '@/app/types/crmTypes';

const formatValue = (value: number): string =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/** Extract the raw color value (e.g. "slate-500") from the Tailwind class */
const STAGE_BORDER_COLORS: Record<string, string> = {
  lead: '#64748b',
  qualification: '#3b82f6',
  proposal: '#f59e0b',
  negotiation: '#a855f7',
  won: '#10b981',
  lost: '#ef4444',
};

interface DealCardProps {
  deal: CrmDeal;
  isDragOverlay?: boolean;
}

const DealCard = ({ deal, isDragOverlay }: DealCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/crm/deals/${deal.id}`);
  };

  const borderColor = STAGE_BORDER_COLORS[deal.stage] ?? '#64748b';

  return (
    <motion.div
      layout={!isDragOverlay}
      whileHover={isDragOverlay ? undefined : { scale: 1.02, y: -1 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className="relative bg-slate-800 rounded-lg px-3 py-2.5 cursor-pointer border border-slate-700/50 hover:shadow-lg hover:shadow-black/20 transition-shadow group"
      style={{ borderLeftWidth: '3px', borderLeftColor: borderColor }}
    >
      {/* Probability badge */}
      <div className="absolute top-2 right-2">
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded">
          {deal.probability}%
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-white pr-10 leading-snug truncate">
        {deal.title}
      </p>

      {/* Company */}
      {deal.company?.name && (
        <p className="text-xs text-slate-400 mt-0.5 truncate">
          {deal.company.name}
        </p>
      )}

      {/* Value & Date row */}
      <div className="flex items-center justify-between mt-2 gap-2">
        <span className="text-xs font-medium text-brand-400">
          {formatValue(deal.value)} {deal.currency}
        </span>
        {deal.expected_close_date && (
          <span className="text-[10px] text-slate-500">
            {formatDate(deal.expected_close_date)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default DealCard;
