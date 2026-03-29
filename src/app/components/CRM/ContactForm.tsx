'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateCrmContactMutation,
  useUpdateCrmContactMutation,
} from '@/app/store/apiSlice';
import type { CrmContact } from '@/app/types/crmTypes';

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  contact?: CrmContact;
}

const ContactForm = ({ isOpen, onClose, companyId, contact }: ContactFormProps) => {
  const { t } = useTranslation();
  const [createContact, { isLoading: creating }] = useCreateCrmContactMutation();
  const [updateContact, { isLoading: updating }] = useUpdateCrmContactMutation();

  const isEdit = !!contact;
  const isSubmitting = creating || updating;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFirstName(contact?.first_name ?? '');
      setLastName(contact?.last_name ?? '');
      setEmail(contact?.email ?? '');
      setPhone(contact?.phone ?? '');
      setPosition(contact?.position ?? '');
      setNotes(contact?.notes ?? '');
    }
  }, [isOpen, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    try {
      const payload = {
        company_id: companyId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        position: position.trim() || null,
        notes: notes.trim() || null,
      };

      if (isEdit && contact) {
        await updateContact({ id: contact.id, data: payload }).unwrap();
      } else {
        await createContact(payload).unwrap();
      }

      toast.success(t('crm.saved'));
      onClose();
    } catch (err) {
      console.error('ContactForm submit error:', err);
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
                  {isEdit ? t('crm.editContact') : t('crm.newContact')}
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
                {/* First & Last name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('crm.firstName')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                      placeholder={t('crm.firstName')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-slate-300">
                      {t('crm.lastName')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                      placeholder={t('crm.lastName')}
                    />
                  </div>
                </div>

                {/* Email */}
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

                {/* Phone & Position row */}
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
                      {t('crm.position')}
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full bg-slate-900/50 text-white border border-slate-700/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
                      placeholder={t('crm.position')}
                    />
                  </div>
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
                    disabled={!firstName.trim() || !lastName.trim() || isSubmitting}
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

export default ContactForm;
