'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  useCreateCrmActivityMutation,
  useGetCurrentUserQuery,
} from '@/app/store/apiSlice';
import type { CrmActivityType } from '@/app/types/crmTypes';

interface ActivityFormProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  dealId?: string;
  contactId?: string;
}

const ACTIVITY_TYPES: CrmActivityType[] = ['email', 'call', 'meeting', 'note'];

const ActivityForm = ({ isOpen, onClose, companyId, dealId, contactId }: ActivityFormProps) => {
  const { t } = useTranslation();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });

  const [createActivity, { isLoading }] = useCreateCrmActivityMutation();

  const [type, setType] = useState<CrmActivityType>('note');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType('note');
      setSubject('');
      setBody('');
      // Default to now in datetime-local format
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60000);
      setDate(local.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    try {
      await createActivity({
        company_id: companyId,
        deal_id: dealId ?? null,
        contact_id: contactId ?? null,
        type,
        subject: subject.trim(),
        body: body.trim() || null,
        date: new Date(date).toISOString(),
        created_by: currentUser?.id ?? null,
      }).unwrap();

      toast.success(t('crm.saved'));
      onClose();
    } catch (err) {
      console.error('ActivityForm submit error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const inputClasses =
    'w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors';

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-6 w-full max-w-lg shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-xl font-semibold text-white">
                  {t('crm.newActivity')}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.activityType')}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CrmActivityType)}
                    className={inputClasses}
                  >
                    {ACTIVITY_TYPES.map((at) => (
                      <option key={at} value={at}>
                        {t(`crm.activityTypes.${at}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.subject')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder={t('crm.subject')}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.body')}
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className={`${inputClasses} resize-none`}
                    placeholder={t('crm.body')}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.date')}
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 border border-slate-700/50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!subject.trim() || isLoading}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ActivityForm;
