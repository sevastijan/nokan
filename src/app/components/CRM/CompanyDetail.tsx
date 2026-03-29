'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Globe,
  Pencil,
  Trash2,
  Plus,
  Mail,
  Phone,
  Briefcase,
  Users,
  HandshakeIcon,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCrmCompanyByIdQuery,
  useGetCrmContactsByCompanyQuery,
  useGetCrmDealsQuery,
  useDeleteCrmCompanyMutation,
  useDeleteCrmContactMutation,
} from '@/app/store/apiSlice';
import { STAGE_LABELS, STAGE_COLORS } from '@/app/types/crmTypes';
import type { CrmContact, CrmDeal } from '@/app/types/crmTypes';
import Loader from '@/app/components/Loader';
import CompanyForm from './CompanyForm';
import ContactForm from './ContactForm';

interface CompanyDetailProps {
  companyId: string;
}

type DetailTab = 'contacts' | 'deals' | 'activities';

const CompanyDetail = ({ companyId }: CompanyDetailProps) => {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: company, isLoading } = useGetCrmCompanyByIdQuery(companyId);
  const { data: contacts = [] } = useGetCrmContactsByCompanyQuery(companyId);
  const { data: allDeals = [] } = useGetCrmDealsQuery();

  const [deleteCompany] = useDeleteCrmCompanyMutation();
  const [deleteContact] = useDeleteCrmContactMutation();

  const [activeTab, setActiveTab] = useState<DetailTab>('contacts');
  const [editOpen, setEditOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CrmContact | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const companyDeals = useMemo(
    () => allDeals.filter((d: CrmDeal) => d.company_id === companyId),
    [allDeals, companyId],
  );

  const handleDeleteCompany = async () => {
    try {
      await deleteCompany(companyId).unwrap();
      toast.success(t('crm.deleted'));
      router.push('/crm/companies');
    } catch (err) {
      console.error('Delete company error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact({ id: contactId, companyId }).unwrap();
      toast.success(t('crm.deleted'));
    } catch (err) {
      console.error('Delete contact error:', err);
      toast.error(t('errors.generic'));
    }
  };

  const openEditContact = (contact: CrmContact) => {
    setEditingContact(contact);
    setContactFormOpen(true);
  };

  const openNewContact = () => {
    setEditingContact(undefined);
    setContactFormOpen(true);
  };

  if (isLoading) return <Loader />;
  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 size={40} className="text-slate-500 mb-4" />
        <p className="text-slate-400">{t('common.noResults')}</p>
      </div>
    );
  }

  const tabConfig = [
    { key: 'contacts' as const, label: t('crm.contacts'), icon: Users, count: contacts.length },
    { key: 'deals' as const, label: t('crm.deals'), icon: HandshakeIcon, count: companyDeals.length },
    { key: 'activities' as const, label: t('crm.activities'), icon: Activity },
  ];

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.push('/crm/companies')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        {t('crm.companies')}
      </button>

      {/* Header card */}
      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-brand-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {company.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                {company.domain && (
                  <a
                    href={
                      company.domain.startsWith('http')
                        ? company.domain
                        : `https://${company.domain}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <Globe size={13} />
                    {company.domain}
                  </a>
                )}
                {company.industry && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/50 text-xs font-medium text-slate-300">
                    <Briefcase size={11} />
                    {company.industry}
                  </span>
                )}
              </div>
              {(company.email || company.phone || company.address) && (
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                  {company.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {company.email}
                    </span>
                  )}
                  {company.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {company.phone}
                    </span>
                  )}
                  {company.address && (
                    <span className="truncate max-w-[200px]">{company.address}</span>
                  )}
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
                  onClick={handleDeleteCompany}
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
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-800/30 rounded-xl p-1 border border-slate-700/20">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                isActive
                  ? 'bg-slate-800/80 text-white shadow-sm border border-slate-700/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-brand-600/20 text-brand-400'
                      : 'bg-slate-700/50 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'contacts' && (
            <ContactsTab
              contacts={contacts}
              onAdd={openNewContact}
              onEdit={openEditContact}
              onDelete={handleDeleteContact}
              t={t}
            />
          )}
          {activeTab === 'deals' && (
            <DealsTab deals={companyDeals} t={t} />
          )}
          {activeTab === 'activities' && (
            <ActivitiesTab t={t} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <CompanyForm isOpen={editOpen} onClose={() => setEditOpen(false)} company={company} />
      <ContactForm
        isOpen={contactFormOpen}
        onClose={() => {
          setContactFormOpen(false);
          setEditingContact(undefined);
        }}
        companyId={companyId}
        contact={editingContact}
      />
    </>
  );
};

/* ---------- Contacts Tab ---------- */
interface ContactsTabProps {
  contacts: CrmContact[];
  onAdd: () => void;
  onEdit: (contact: CrmContact) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

const ContactsTab = ({ contacts, onAdd, onEdit, onDelete, t }: ContactsTabProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          {t('crm.contacts')}
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-400 hover:text-white bg-brand-600/10 hover:bg-brand-600/20 rounded-lg transition-colors"
        >
          <Plus size={14} />
          {t('crm.newContact')}
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-xl border border-slate-700/20">
          <Users size={28} className="text-slate-500 mb-3" />
          <p className="text-sm text-slate-400">{t('crm.noContacts')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: index * 0.03 }}
              className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-700/60 flex items-center justify-center shrink-0 text-xs font-medium text-slate-300">
                  {contact.first_name[0]}
                  {contact.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {contact.position && <span>{contact.position}</span>}
                    {contact.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail size={10} /> {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {contact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {confirmDeleteId === contact.id ? (
                  <>
                    <button
                      onClick={() => {
                        onDelete(contact.id);
                        setConfirmDeleteId(null);
                      }}
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
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(contact)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(contact.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Deals Tab ---------- */
interface DealsTabProps {
  deals: CrmDeal[];
  t: (key: string) => string;
}

const DealsTab = ({ deals, t }: DealsTabProps) => {
  const router = useRouter();

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
        {t('crm.deals')}
      </h3>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-xl border border-slate-700/20">
          <HandshakeIcon size={28} className="text-slate-500 mb-3" />
          <p className="text-sm text-slate-400">{t('crm.noDeals')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12, delay: index * 0.03 }}
              onClick={() => router.push(`/crm/deals/${deal.id}`)}
              className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-8 rounded-full shrink-0 ${STAGE_COLORS[deal.stage]}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {deal.title}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-white/90 ${STAGE_COLORS[deal.stage]}`}
                  >
                    {STAGE_LABELS[deal.stage]}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">
                  {new Intl.NumberFormat('pl-PL', {
                    style: 'currency',
                    currency: deal.currency,
                    maximumFractionDigits: 0,
                  }).format(deal.value)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------- Activities Tab ---------- */
const ActivitiesTab = ({ t }: { t: (key: string) => string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-800/20 rounded-xl border border-slate-700/20">
    <Activity size={28} className="text-slate-500 mb-3" />
    <p className="text-sm text-slate-400">
      {t('crm.activities')} — placeholder
    </p>
  </div>
);

export default CompanyDetail;
