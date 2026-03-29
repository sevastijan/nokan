'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { X, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  useCreateCrmDealMutation,
  useUpdateCrmDealMutation,
  useGetCrmCompaniesQuery,
  useGetCrmContactsByCompanyQuery,
  useGetCurrentUserQuery,
} from '@/app/store/apiSlice';
import type { CrmDeal, CrmDealStage, CrmCurrency } from '@/app/types/crmTypes';
import { STAGE_ORDER, STAGE_LABELS, DEAL_SOURCE_PRESETS } from '@/app/types/crmTypes';

interface DealFormProps {
  isOpen: boolean;
  onClose: () => void;
  deal?: CrmDeal;
  defaultCompanyId?: string;
}

const CURRENCIES: CrmCurrency[] = ['PLN', 'EUR', 'USD'];

const DealForm = ({ isOpen, onClose, deal, defaultCompanyId }: DealFormProps) => {
  const { t } = useTranslation();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });
  const { data: companies = [] } = useGetCrmCompaniesQuery();
  const [createDeal, { isLoading: creating }] = useCreateCrmDealMutation();
  const [updateDeal, { isLoading: updating }] = useUpdateCrmDealMutation();

  const isEdit = !!deal;
  const isSubmitting = creating || updating;

  // Form state
  const [title, setTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [stage, setStage] = useState<CrmDealStage>('lead');
  const [value, setValue] = useState<number>(0);
  const [valueMax, setValueMax] = useState<number>(0);
  const [currency, setCurrency] = useState<CrmCurrency>('PLN');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);

  // Company search dropdown state
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch contacts for selected company
  const { data: contacts = [] } = useGetCrmContactsByCompanyQuery(companyId, {
    skip: !companyId,
  });

  // Filter companies by search
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, companySearch]);

  // Selected company name
  const selectedCompanyName = useMemo(
    () => companies.find((c) => c.id === companyId)?.name ?? '',
    [companies, companyId],
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(deal?.title ?? '');
      setCompanyId(deal?.company_id ?? defaultCompanyId ?? '');
      setContactId(deal?.contact_id ?? '');
      setStage(deal?.stage ?? 'lead');
      setValue(deal?.value ?? 0);
      setValueMax(deal?.value_max ?? 0);
      setCurrency(deal?.currency ?? 'PLN');
      setExpectedCloseDate(deal?.expected_close_date ?? '');
      setNotes(deal?.notes ?? '');
      setSource(deal?.source ?? '');
      setCompanySearch('');
      setShowCompanyDropdown(false);
      setShowSourceDropdown(false);
    }
  }, [isOpen, deal, defaultCompanyId]);

  // Close source dropdown on outside click
  useEffect(() => {
    if (!showSourceDropdown) return;
    const handler = (e: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) {
        setShowSourceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSourceDropdown]);

  // Close company dropdown on outside click
  useEffect(() => {
    if (!showCompanyDropdown) return;
    const handler = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCompanyDropdown]);

  // Reset contact when company changes
  useEffect(() => {
    if (!isEdit) setContactId('');
  }, [companyId, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyId) return;

    try {
      const payload = {
        title: title.trim(),
        company_id: companyId,
        contact_id: contactId || null,
        stage,
        value,
        value_max: valueMax,
        currency,
        probability: 0, // auto-set by backend based on stage
        expected_close_date: expectedCloseDate || null,
        notes: notes.trim() || null,
        source: source.trim() || null,
      };

      if (isEdit && deal) {
        await updateDeal({ id: deal.id, data: payload }).unwrap();
      } else {
        await createDeal({
          ...payload,
          created_by: currentUser?.id ?? null,
        }).unwrap();
      }

      toast.success(t('crm.saved'));
      onClose();
    } catch (err) {
      console.error('DealForm submit error:', err);
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
            <DialogPanel className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-xl font-semibold text-white">
                  {isEdit ? t('crm.editDeal') : t('crm.newDeal')}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.dealTitle')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder={t('crm.dealTitle')}
                  />
                </div>

                {/* Company (searchable select) */}
                <div ref={companyDropdownRef} className="relative">
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.company')} <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCompanyDropdown((prev) => !prev)}
                    className={`${inputClasses} text-left flex items-center justify-between`}
                  >
                    <span className={selectedCompanyName ? 'text-white' : 'text-slate-500'}>
                      {selectedCompanyName || t('crm.company')}
                    </span>
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {showCompanyDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-700/50 rounded-lg shadow-xl overflow-hidden">
                      <div className="p-2 border-b border-slate-700/50">
                        <div className="relative">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={companySearch}
                            onChange={(e) => setCompanySearch(e.target.value)}
                            className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-md py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 placeholder-slate-500"
                            placeholder={t('crm.search')}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCompanies.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-slate-500 text-center">
                            {t('crm.noContacts')}
                          </div>
                        ) : (
                          filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => {
                                setCompanyId(company.id);
                                setShowCompanyDropdown(false);
                                setCompanySearch('');
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                                company.id === companyId
                                  ? 'text-brand-400 bg-brand-500/10'
                                  : 'text-slate-300'
                              }`}
                            >
                              {company.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact (filtered by company) */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.contact')}
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    disabled={!companyId}
                    className={`${inputClasses} ${!companyId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">--</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stage */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.stage')}
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as CrmDealStage)}
                    className={inputClasses}
                  >
                    {STAGE_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value & Value Max row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('crm.value')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('crm.valueMax')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={valueMax}
                      onChange={(e) => setValueMax(Number(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.currency')}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CrmCurrency)}
                    className={inputClasses}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expected close date */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.expectedCloseDate')}
                  </label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.notes')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className={`${inputClasses} resize-none`}
                    placeholder={t('crm.notes')}
                  />
                </div>

                {/* Source */}
                <div ref={sourceRef} className="relative">
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    Źródło
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    onFocus={() => setShowSourceDropdown(true)}
                    className={inputClasses}
                    placeholder="Wpisz lub wybierz źródło..."
                  />
                  {showSourceDropdown && (
                    <div className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {DEAL_SOURCE_PRESETS.filter((s) => s.toLowerCase().includes(source.toLowerCase())).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setSource(preset);
                            setShowSourceDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
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
                    disabled={!title.trim() || !companyId || isSubmitting}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? t('common.saving') : t('common.save')}
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

export default DealForm;
