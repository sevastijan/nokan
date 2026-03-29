'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, BarChart3, Target, Trophy } from 'lucide-react';
import type { CrmDeal, CrmExchangeRate, CrmDealStage } from '@/app/types/crmTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function convertToPln(value: number, currency: string, rates: CrmExchangeRate[]): number {
  if (currency === 'PLN') return value;
  const rate = rates.find((r) => r.currency === currency);
  return rate ? value * rate.rate_to_pln : value;
}

const formatValue = (value: number): string =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CrmStatsProps {
  deals: CrmDeal[];
  rates: CrmExchangeRate[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CrmStats = ({ deals, rates }: CrmStatsProps) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    let totalValuePln = 0;
    let activeCount = 0;
    let wonCount = 0;
    let lostCount = 0;
    const byStage: Record<CrmDealStage, { count: number; value_pln: number }> = {
      lead: { count: 0, value_pln: 0 },
      qualification: { count: 0, value_pln: 0 },
      proposal: { count: 0, value_pln: 0 },
      negotiation: { count: 0, value_pln: 0 },
      won: { count: 0, value_pln: 0 },
      lost: { count: 0, value_pln: 0 },
    };

    for (const deal of deals) {
      const valuePln = convertToPln(deal.value, deal.currency, rates);
      byStage[deal.stage].count += 1;
      byStage[deal.stage].value_pln += valuePln;

      if (deal.stage === 'won') {
        wonCount += 1;
      } else if (deal.stage === 'lost') {
        lostCount += 1;
      } else {
        activeCount += 1;
        totalValuePln += valuePln;
      }
    }

    const winRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

    return { totalValuePln, activeCount, wonCount, lostCount, winRate, byStage };
  }, [deals, rates]);

  const winRateColor =
    stats.winRate > 50
      ? 'text-emerald-400'
      : stats.winRate > 25
        ? 'text-amber-400'
        : 'text-red-400';

  const cards = [
    {
      label: t('crm.stats.pipelineValue'),
      value: `${formatValue(stats.totalValuePln)} PLN`,
      icon: TrendingUp,
      accent: 'text-brand-400',
    },
    {
      label: t('crm.stats.totalDeals'),
      value: String(stats.activeCount),
      icon: BarChart3,
      accent: 'text-blue-400',
    },
    {
      label: t('crm.stats.winRate'),
      value: `${stats.winRate.toFixed(1)}%`,
      icon: Target,
      accent: winRateColor,
    },
    {
      label: t('crm.stats.wonDeals'),
      value: String(stats.wonCount),
      icon: Trophy,
      accent: 'text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <Icon size={18} className={card.accent} />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <span className={`text-2xl font-bold ${card.accent}`}>{card.value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default CrmStats;
export { convertToPln, formatValue };
