'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Users, StickyNote, Inbox, Filter, X } from 'lucide-react';
import {
  useGetCrmDealsQuery,
  useGetCrmCompaniesQuery,
  useGetCrmExchangeRatesQuery,
  useGetCrmActivitiesQuery,
} from '@/app/store/apiSlice';
import type { CrmDeal, CrmDealStage, CrmActivityType } from '@/app/types/crmTypes';
import { STAGE_ORDER, STAGE_LABELS } from '@/app/types/crmTypes';
import CrmStats, { convertToPln, formatValue } from './CrmStats';
import Loader from '@/app/components/Loader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_DOT_COLORS: Record<CrmDealStage, string> = {
  lead: 'bg-slate-500',
  qualification: 'bg-blue-500',
  proposal: 'bg-amber-500',
  negotiation: 'bg-purple-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
};

const ACTIVITY_ICONS: Record<CrmActivityType, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Users,
  note: StickyNote,
};

type PeriodFilter = 'all' | '7d' | '30d' | '90d' | '365d';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'Wszystko' },
  { value: '7d', label: '7 dni' },
  { value: '30d', label: '30 dni' },
  { value: '90d', label: '90 dni' },
  { value: '365d', label: 'Rok' },
];

function getPeriodStart(period: PeriodFilter): Date | null {
  if (period === 'all') return null;
  const days = parseInt(period);
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CrmDashboard = () => {
  const { t } = useTranslation();

  const { data: deals, isLoading: dealsLoading } = useGetCrmDealsQuery();
  const { data: companies } = useGetCrmCompaniesQuery();
  const { data: rates, isLoading: ratesLoading } = useGetCrmExchangeRatesQuery();
  const { data: activities, isLoading: activitiesLoading } = useGetCrmActivitiesQuery({});

  // Filters
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [source, setSource] = useState<string>('all');

  // Refresh exchange rates on mount
  useEffect(() => {
    fetch('/api/crm/exchange-rates').catch(() => {});
  }, []);

  // Unique sources from deals
  const availableSources = useMemo(() => {
    if (!deals) return [];
    const sources = new Set<string>();
    for (const deal of deals) {
      if (deal.source) sources.add(deal.source);
    }
    return Array.from(sources).sort();
  }, [deals]);

  // Filtered deals
  const filteredDeals = useMemo(() => {
    if (!deals) return [];
    const periodStart = getPeriodStart(period);

    return deals.filter((deal: CrmDeal) => {
      if (periodStart && deal.created_at) {
        if (new Date(deal.created_at) < periodStart) return false;
      }
      if (source !== 'all' && deal.source !== source) return false;
      return true;
    });
  }, [deals, period, source]);

  const hasActiveFilters = period !== 'all' || source !== 'all';

  // Build a deal-id -> company-name lookup
  const dealCompanyMap = useMemo(() => {
    const map = new Map<string, string>();
    if (deals) {
      for (const deal of deals) {
        if (deal.company?.name) {
          map.set(deal.id, deal.company.name);
        }
      }
    }
    return map;
  }, [deals]);

  // Stage breakdown data (uses filteredDeals)
  const stageBreakdown = useMemo(() => {
    if (!filteredDeals || !rates) return [];
    const byStage: Record<CrmDealStage, { count: number; valuePln: number }> = {
      lead: { count: 0, valuePln: 0 },
      qualification: { count: 0, valuePln: 0 },
      proposal: { count: 0, valuePln: 0 },
      negotiation: { count: 0, valuePln: 0 },
      won: { count: 0, valuePln: 0 },
      lost: { count: 0, valuePln: 0 },
    };

    for (const deal of filteredDeals) {
      const valuePln = convertToPln(deal.value, deal.currency, rates);
      byStage[deal.stage].count += 1;
      byStage[deal.stage].valuePln += valuePln;
    }

    return STAGE_ORDER.map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      count: byStage[stage].count,
      valuePln: byStage[stage].valuePln,
    }));
  }, [filteredDeals, rates]);

  const recentActivities = useMemo(() => {
    if (!activities) return [];
    const periodStart = getPeriodStart(period);
    let filtered = [...activities];
    if (periodStart) {
      filtered = filtered.filter((a) => new Date(a.date) >= periodStart);
    }
    return filtered
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [activities, period]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (dealsLoading || ratesLoading) {
    return <Loader />;
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (!deals || deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Inbox size={48} className="text-slate-600" />
        <p className="text-slate-400 text-lg">Dodaj pierwszy deal w Pipeline</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Filter size={14} />
          <span className="text-xs font-medium uppercase tracking-wide">Filtry</span>
        </div>

        {/* Period pills */}
        <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                period === opt.value
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Source select */}
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 rounded-lg px-3 py-1.5 cursor-pointer focus:outline-none focus:border-brand-500/50"
        >
          <option value="all">Wszystkie źródła</option>
          {availableSources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => { setPeriod('all'); setSource('all'); }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X size={12} />
            Wyczyść
          </button>
        )}

        {/* Active filter count */}
        {hasActiveFilters && (
          <span className="text-xs text-slate-500">
            {filteredDeals.length} z {deals.length} dealów
          </span>
        )}
      </div>

      {/* Stats cards (uses filtered deals) */}
      <CrmStats deals={filteredDeals} rates={rates ?? []} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            {t('crm.activities')}
          </h3>

          {activitiesLoading ? (
            <Loader />
          ) : recentActivities.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">{t('crm.noActivities')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentActivities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] ?? StickyNote;
                const companyName = activity.deal_id
                  ? dealCompanyMap.get(activity.deal_id)
                  : undefined;

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-b-0"
                  >
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Icon size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">
                        {activity.subject ?? t(`crm.activityTypes.${activity.type}`)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {companyName && (
                          <span className="text-xs text-slate-500 truncate">{companyName}</span>
                        )}
                        <span className="text-xs text-slate-600">{formatDate(activity.date)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stage Breakdown */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
            {t('crm.stage')}
          </h3>

          <div className="flex flex-col gap-2">
            {stageBreakdown.map((row) => (
              <div
                key={row.stage}
                className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-b-0"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STAGE_DOT_COLORS[row.stage]}`}
                />
                <span className="text-sm text-slate-300 flex-1">{row.label}</span>
                <span className="text-sm font-medium text-slate-400 tabular-nums w-8 text-right">
                  {row.count}
                </span>
                <span className="text-sm font-medium text-slate-200 tabular-nums min-w-[100px] text-right">
                  {formatValue(row.valuePln)} PLN
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmDashboard;
