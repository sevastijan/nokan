'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Users, StickyNote, Plus, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCrmActivitiesQuery,
  useDeleteCrmActivityMutation,
} from '@/app/store/apiSlice';
import type { CrmActivityType, CrmActivity } from '@/app/types/crmTypes';
import ActivityForm from './ActivityForm';

interface ActivityLogProps {
  companyId?: string;
  dealId?: string;
  limit?: number;
}

const TYPE_ICONS: Record<CrmActivityType, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Users,
  note: StickyNote,
};

const TYPE_COLORS: Record<CrmActivityType, string> = {
  email: 'text-blue-400 bg-blue-500/10',
  call: 'text-emerald-400 bg-emerald-500/10',
  meeting: 'text-purple-400 bg-purple-500/10',
  note: 'text-amber-400 bg-amber-500/10',
};

type FilterType = 'all' | CrmActivityType;
const FILTER_OPTIONS: FilterType[] = ['all', 'email', 'call', 'meeting', 'note'];

const ActivityLog = ({ companyId, dealId, limit }: ActivityLogProps) => {
  const { t } = useTranslation();

  const { data: activities = [], isLoading } = useGetCrmActivitiesQuery(
    { companyId, dealId },
    { skip: !companyId && !dealId },
  );

  const [deleteActivity] = useDeleteCrmActivityMutation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredActivities = useMemo(() => {
    let result = activities;
    if (filter !== 'all') {
      result = result.filter((a) => a.type === filter);
    }
    if (limit) {
      result = result.slice(0, limit);
    }
    return result;
  }, [activities, filter, limit]);

  const handleDelete = async (activity: CrmActivity) => {
    try {
      await deleteActivity({
        id: activity.id,
        companyId: activity.company_id,
        dealId: activity.deal_id ?? undefined,
      }).unwrap();
      toast.success(t('crm.deleted'));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete activity error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const filterLabels: Record<FilterType, string> = {
    all: t('common.all') || 'Wszystkie',
    email: t('crm.activityTypes.email'),
    call: t('crm.activityTypes.call'),
    meeting: t('crm.activityTypes.meeting'),
    note: t('crm.activityTypes.note'),
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          {t('crm.activities')}
        </h3>
        {companyId && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-400 hover:text-white bg-brand-600/10 hover:bg-brand-600/20 rounded-lg transition-colors"
          >
            <Plus size={14} />
            {t('crm.newActivity')}
          </button>
        )}
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
              filter === opt
                ? 'bg-brand-600/20 text-brand-400 border-brand-500/40'
                : 'bg-slate-800/40 text-slate-400 border-slate-700/30 hover:text-white hover:border-slate-600'
            }`}
          >
            {filterLabels[opt]}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-xl border border-slate-700/20">
          <Activity size={28} className="text-slate-500 mb-3" />
          <p className="text-sm text-slate-400">{t('crm.noActivities')}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filteredActivities.map((activity, index) => {
              const Icon = TYPE_ICONS[activity.type];
              const colorClasses = TYPE_COLORS[activity.type];

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.12, delay: index * 0.02 }}
                  layout
                  className="flex items-start gap-3 px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-all group"
                >
                  {/* Type icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClasses}`}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {activity.subject || t(`crm.activityTypes.${activity.type}`)}
                        </p>
                        {activity.body && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {activity.body}
                          </p>
                        )}
                      </div>

                      {/* Delete button */}
                      <div className="shrink-0">
                        {confirmDeleteId === activity.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(activity)}
                              className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                            >
                              {t('common.delete')}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(activity.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-500">
                        {new Date(activity.date).toLocaleDateString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {activity.creator && (
                        <div className="flex items-center gap-1.5">
                          {activity.creator.image ? (
                            <img
                              src={activity.creator.image}
                              alt={activity.creator.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[8px] font-medium text-slate-300">
                              {activity.creator.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <span className="text-xs text-slate-500">
                            {activity.creator.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Activity Form Modal */}
      {companyId && (
        <ActivityForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          companyId={companyId}
          dealId={dealId}
        />
      )}
    </div>
  );
};

export default ActivityLog;
