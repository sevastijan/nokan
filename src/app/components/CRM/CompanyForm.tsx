'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  useCreateCrmCompanyMutation,
  useUpdateCrmCompanyMutation,
  useGetCurrentUserQuery,
} from '@/app/store/apiSlice';
import type { CrmCompany } from '@/app/types/crmTypes';

interface CompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  company?: CrmCompany;
}

const CompanyForm = ({ isOpen, onClose, company }: CompanyFormProps) => {
  const { t } = useTranslation();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });
  const [createCompany, { isLoading: creating }] = useCreateCrmCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCrmCompanyMutation();

  const isEdit = !!company;
  const isSubmitting = creating || updating;

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(company?.name ?? '');
      setDomain(company?.domain ?? '');
      setAddress(company?.address ?? '');
      setPhone(company?.phone ?? '');
      setEmail(company?.email ?? '');
      setIndustry(company?.industry ?? '');
      setNotes(company?.notes ?? '');
    }
  }, [isOpen, company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name: name.trim(),
        domain: domain.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        industry: industry.trim() || null,
        notes: notes.trim() || null,
      };

      if (isEdit && company) {
        await updateCompany({ id: company.id, data: payload }).unwrap();
      } else {
        await createCompany({
          ...payload,
          created_by: currentUser?.id ?? null,
        }).unwrap();
      }

      toast.success(t('crm.saved'));
      onClose();
    } catch (err) {
      console.error('CompanyForm submit error:', err);
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
            <DialogPanel className="bg-slate-900/95 border border-slate-700/50 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <DialogTitle className="text-xl font-semibold text-white">
                  {isEdit ? t('crm.editCompany') : t('crm.newCompany')}
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.companyName')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                    placeholder={t('crm.companyName')}
                  />
                </div>

                {/* Domain */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.domain')}
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                    placeholder="example.com"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.address')}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                    placeholder={t('crm.address')}
                  />
                </div>

                {/* Phone & Email row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('crm.phone')}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                      placeholder={t('crm.phone')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('crm.email')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                      placeholder={t('crm.email')}
                    />
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-300">
                    {t('crm.industry')}
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                    placeholder={t('crm.industry')}
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
                    className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors resize-none"
                    placeholder={t('crm.notes')}
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
                    disabled={!name.trim() || isSubmitting}
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

export default CompanyForm;
