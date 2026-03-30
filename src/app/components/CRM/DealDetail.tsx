'use client';

import { useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Building2,
  User,
  LayoutDashboard,
  ExternalLink,
  Plus,
  X,
  HandshakeIcon,
  CalendarDays,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { toast } from 'sonner';
import {
  useGetCrmDealByIdQuery,
  useGetCrmDealPartnersQuery,
  useUpdateCrmDealMutation,
  useDeleteCrmDealMutation,
  useGetCrmCompaniesQuery,
  useAddCrmDealPartnerMutation,
  useRemoveCrmDealPartnerMutation,
} from '@/app/store/apiSlice';
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
} from '@/app/types/crmTypes';
import type { CrmDealStage, CrmDeal, CrmCompany, CrmContact } from '@/app/types/crmTypes';

/** The deal query joins extra fields onto company/contact. Cast helpers. */
const asCompany = (c: CrmDeal['company']): CrmCompany | null => c as CrmCompany | null;
const asContact = (c: CrmDeal['contact']): CrmContact | null => c as CrmContact | null;
import Loader from '@/app/components/Loader';
import DealForm from './DealForm';
import DealWonModal from './DealWonModal';
import ActivityLog from './ActivityLog';

interface DealDetailProps {
  dealId: string;
}

const DealDetail = ({ dealId }: DealDetailProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: deal, isLoading, isError } = useGetCrmDealByIdQuery(dealId);
  const { data: partners = [] } = useGetCrmDealPartnersQuery(dealId);
  const { data: companies = [] } = useGetCrmCompaniesQuery();

  const [updateDeal] = useUpdateCrmDealMutation();
  const [deleteDeal] = useDeleteCrmDealMutation();
  const [addPartner, { isLoading: addingPartner }] = useAddCrmDealPartnerMutation();
  const [removePartner] = useRemoveCrmDealPartnerMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [wonModalOpen, setWonModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [selectedPartnerCompanyId, setSelectedPartnerCompanyId] = useState('');
  const [partnerDeleteConfirmId, setPartnerDeleteConfirmId] = useState<string | null>(null);

  // Companies not already added as partners (or the deal's own company)
  const availablePartnerCompanies = useMemo(() => {
    const partnerCompanyIds = new Set(partners.map((p) => p.company_id));
    return companies.filter(
      (c) => c.id !== deal?.company_id && !partnerCompanyIds.has(c.id),
    );
  }, [companies, partners, deal?.company_id]);

  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const handleStageChange = async (newStage: CrmDealStage) => {
    if (!deal || newStage === deal.stage) return;

    if (newStage === 'won') {
      // First update the stage, then open the won modal
      try {
        await updateDeal({ id: dealId, data: { stage: 'won' } }).unwrap();
        setWonModalOpen(true);
      } catch (err) {
        console.error('Stage change error:', err);
        toast.error(t('errors.generic'));
      }
      return;
    }

    try {
      await updateDeal({ id: dealId, data: { stage: newStage } }).unwrap();
      toast.success(t('crm.saved'));
    } catch (err) {
      console.error('Stage change error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const handleDeleteDeal = async () => {
    try {
      await deleteDeal(dealId).unwrap();
      toast.success(t('crm.deleted'));
      router.push('/crm/pipeline');
    } catch (err) {
      console.error('Delete deal error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const handleAddPartner = async () => {
    if (!selectedPartnerCompanyId) return;
    try {
      await addPartner({
        deal_id: dealId,
        company_id: selectedPartnerCompanyId,
      }).unwrap();
      toast.success(t('crm.saved'));
      setPartnerModalOpen(false);
      setSelectedPartnerCompanyId('');
    } catch (err) {
      console.error('Add partner error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const handleRemovePartner = async (partnerId: string) => {
    try {
      await removePartner({ id: partnerId, dealId }).unwrap();
      toast.success(t('crm.deleted'));
      setPartnerDeleteConfirmId(null);
    } catch (err) {
      console.error('Remove partner error:', err);
      toast.error(t('errors.generic'));
    }
  };

  if (isLoading) return <Loader />;

  if (isError || !deal) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <HandshakeIcon size={40} className="text-slate-500 mb-4" />
        <p className="text-slate-400">{t('common.noResults')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.push('/crm/pipeline')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {t('crm.pipeline')}
      </button>

      {/* Header card */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {deal.title}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold text-white ${STAGE_COLORS[deal.stage]}`}
              >
                {STAGE_LABELS[deal.stage]}
              </span>
            </div>

            {/* Value + meta row */}
            <div className="flex flex-wrap items-center gap-4 mt-2.5">
              <span className="text-lg font-semibold text-white">
                {formatCurrency(deal.value, deal.currency)}
                {deal.value_max > 0 && deal.value_max !== deal.value && (
                  <span className="text-sm font-normal text-slate-400 ml-1.5">
                    — {formatCurrency(deal.value_max, deal.currency)}
                  </span>
                )}
              </span>
              <div className="relative flex items-center gap-1.5 text-sm text-slate-400 group/tip cursor-help">
                <TrendingUp size={14} />
                <span>{deal.probability}%</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity shadow-xl z-10">
                  Prawdopodobieństwo wygrania deala
                  <br />
                  <span className="text-slate-500">Ustawiane automatycznie na podstawie etapu</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-950" />
                </div>
              </div>
              {deal.expected_close_date && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <CalendarDays size={14} />
                  <span>
                    {new Date(deal.expected_close_date).toLocaleDateString('pl-PL')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg transition-colors"
            >
              <Pencil size={14} />
              {t('common.edit')}
            </button>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 bg-slate-800 hover:bg-red-600/10 border border-slate-700/50 hover:border-red-600/30 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteDeal}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  {t('crm.confirmDelete')}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stage change dropdown */}
        <div className="mt-4 pt-4 border-t border-slate-700/30">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-3">
            {t('crm.stage')}
          </label>
          <div className="relative inline-block mt-1">
            <select
              value={deal.stage}
              onChange={(e) => handleStageChange(e.target.value as CrmDealStage)}
              className="appearance-none bg-slate-900/50 text-white border border-slate-700/50 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer transition-colors"
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Two-column layout: Activities (left) | Sidebar (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Activities */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-5">
            <ActivityLog dealId={dealId} companyId={deal.company_id} />
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-4">
          {/* Company */}
          {deal.company && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={14} className="text-brand-400" />
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t('crm.company')}
                </h3>
              </div>
              <button
                onClick={() => router.push(`/crm/companies/${deal.company_id}`)}
                className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors truncate block"
              >
                {deal.company.name}
              </button>
              {asCompany(deal.company)?.domain && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{asCompany(deal.company)!.domain}</p>
              )}
            </div>
          )}

          {/* Contact */}
          {deal.contact && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-brand-400" />
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t('crm.contact')}
                </h3>
              </div>
              <p className="text-sm font-medium text-white">
                {deal.contact.first_name} {deal.contact.last_name}
              </p>
              {asContact(deal.contact)?.position && (
                <p className="text-xs text-slate-400 mt-0.5">{asContact(deal.contact)!.position}</p>
              )}
              {asContact(deal.contact)?.email && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{asContact(deal.contact)!.email}</p>
              )}
              {asContact(deal.contact)?.phone && (
                <p className="text-xs text-slate-500 mt-0.5">{asContact(deal.contact)!.phone}</p>
              )}
            </div>
          )}

          {/* Partners */}
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HandshakeIcon size={14} className="text-brand-400" />
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t('crm.partners')}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedPartnerCompanyId(''); setPartnerModalOpen(true); }}
                className="p-1 text-slate-500 hover:text-brand-400 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            {partners.length === 0 ? (
              <p className="text-xs text-slate-600 py-2">Brak partnerów</p>
            ) : (
              <div className="space-y-1.5">
                {partners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between gap-2 py-1.5">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{partner.company?.name ?? 'Unknown'}</p>
                      {partner.contact && (
                        <p className="text-xs text-slate-500 truncate">
                          {partner.contact.first_name} {partner.contact.last_name}
                        </p>
                      )}
                    </div>
                    {partnerDeleteConfirmId === partner.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleRemovePartner(partner.id)} className="px-1.5 py-0.5 text-[10px] text-white bg-red-600 rounded">
                          {t('common.delete')}
                        </button>
                        <button onClick={() => setPartnerDeleteConfirmId(null)} className="px-1.5 py-0.5 text-[10px] text-slate-300 bg-slate-700 rounded">
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setPartnerDeleteConfirmId(partner.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors shrink-0">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked board */}
          {deal.board_id && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <LayoutDashboard size={14} className="text-brand-400" />
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {t('crm.linkedBoard')}
                </h3>
              </div>
              <button
                onClick={() => router.push(`/board/${deal.board_id}`)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-400 hover:text-white bg-brand-600/10 hover:bg-brand-600/20 rounded-lg transition-colors w-full justify-center"
              >
                <ExternalLink size={14} />
                Otwórz board
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Deal Modal */}
      <DealForm isOpen={editOpen} onClose={() => setEditOpen(false)} deal={deal} />

      {/* Deal Won Modal */}
      <DealWonModal
        isOpen={wonModalOpen}
        onClose={() => setWonModalOpen(false)}
        deal={deal}
        onBoardCreated={(boardId) => {
          // Optionally navigate or just close
        }}
      />

      {/* Add Partner Modal */}
      <Transition show={partnerModalOpen} as={Fragment}>
        <Dialog onClose={() => setPartnerModalOpen(false)} className="relative z-50">
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
              <DialogPanel className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <DialogTitle className="text-lg font-semibold text-white">
                    {t('crm.addPartner')}
                  </DialogTitle>
                  <button
                    onClick={() => setPartnerModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.company')}
                  </label>
                  <select
                    value={selectedPartnerCompanyId}
                    onChange={(e) => setSelectedPartnerCompanyId(e.target.value)}
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                  >
                    <option value="">--</option>
                    {availablePartnerCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPartnerModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 border border-slate-700/50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPartner}
                    disabled={!selectedPartnerCompanyId || addingPartner}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingPartner ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default DealDetail;
