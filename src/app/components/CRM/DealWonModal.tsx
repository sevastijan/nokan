'use client';

import { useState } from 'react';
import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { Trophy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  useCreateBoardFromTemplateMutation,
  useLinkCrmDealToBoardMutation,
  useGetCurrentUserQuery,
} from '@/app/store/apiSlice';
import { DEFAULT_TEMPLATES } from '@/app/types/globalTypes';
import type { CrmDeal } from '@/app/types/crmTypes';

interface DealWonModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: CrmDeal;
  onBoardCreated?: (boardId: string) => void;
}

const DealWonModal = ({ isOpen, onClose, deal, onBoardCreated }: DealWonModalProps) => {
  const { t } = useTranslation();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });
  const [createBoard, { isLoading: creatingBoard }] = useCreateBoardFromTemplateMutation();
  const [linkDeal, { isLoading: linking }] = useLinkCrmDealToBoardMutation();

  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);
  const isSubmitting = creatingBoard || linking;

  const handleCreateBoard = async () => {
    if (!currentUser?.id) return;

    const template = DEFAULT_TEMPLATES[selectedTemplateIdx];
    if (!template) return;

    try {
      // Create board from template
      const board = await createBoard({
        title: deal.title,
        templateId: `default-${selectedTemplateIdx}`,
        user_id: currentUser.id,
      }).unwrap();

      // Link deal to the newly created board
      await linkDeal({
        deal_id: deal.id,
        board_id: board.id,
      }).unwrap();

      toast.success(t('crm.saved'));
      onBoardCreated?.(board.id);
      onClose();
    } catch (err) {
      console.error('DealWonModal createBoard error:', err);
      toast.error(t('errors.generic'));
    }
  };

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
            <DialogPanel className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
              {/* Celebration header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 mb-4">
                  <Trophy size={28} className="text-emerald-400" />
                </div>
                <DialogTitle className="text-xl font-bold text-white">
                  {t('crm.dealWon.title')}
                </DialogTitle>
                <p className="text-sm text-slate-400 mt-1">
                  {deal.company?.name && (
                    <span className="font-medium text-slate-300">{deal.company.name}</span>
                  )}
                  {deal.company?.name && ' — '}
                  {deal.title}
                </p>
              </div>

              {/* Template question */}
              <p className="text-sm text-slate-300 mb-4">
                {t('crm.dealWon.createBoard')}
              </p>

              {/* Template selection */}
              <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
                {t('crm.dealWon.selectTemplate')}
              </p>
              <div className="space-y-2 mb-6">
                {DEFAULT_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTemplateIdx(idx)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      selectedTemplateIdx === idx
                        ? 'border-brand-500/60 bg-brand-500/10 ring-1 ring-brand-500/30'
                        : 'border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{tpl.name}</p>
                        {tpl.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>
                        )}
                      </div>
                      {selectedTemplateIdx === idx && (
                        <Check size={16} className="text-brand-400 shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 border border-slate-700/50 transition-colors"
                >
                  {t('crm.dealWon.skip')}
                </button>
                <button
                  type="button"
                  onClick={handleCreateBoard}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? t('common.saving') : t('crm.dealWon.create')}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DealWonModal;
