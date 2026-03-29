'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Plus, Building2, Globe, Briefcase, Users, HandshakeIcon } from 'lucide-react';
import { useGetCrmCompaniesQuery } from '@/app/store/apiSlice';
import Loader from '@/app/components/Loader';
import CompanyForm from './CompanyForm';

const CompanyList = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: companies = [], isLoading } = useGetCrmCompaniesQuery();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const term = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.domain?.toLowerCase().includes(term) ||
        c.industry?.toLowerCase().includes(term),
    );
  }, [companies, search]);

  if (isLoading) return <Loader />;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">{t('crm.companies')}</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('crm.search')}
              className="w-full sm:w-64 bg-slate-800/60 text-white border border-slate-700/50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 placeholder-slate-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('crm.newCompany')}</span>
          </button>
        </div>
      </div>

      {/* Table / Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">
            {companies.length === 0
              ? t('crm.noContacts').replace(t('crm.contacts').toLowerCase(), t('crm.companies').toLowerCase())
              : t('common.noResults')}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            <div className="col-span-4">{t('crm.companyName')}</div>
            <div className="col-span-2">{t('crm.domain')}</div>
            <div className="col-span-2">{t('crm.industry')}</div>
            <div className="col-span-2 text-center">{t('crm.contacts')}</div>
            <div className="col-span-2 text-center">{t('crm.deals')}</div>
          </div>

          {/* Rows */}
          <div className="space-y-1.5">
            {filtered.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                onClick={() => router.push(`/crm/companies/${company.id}`)}
                className="group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3.5 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 hover:border-slate-700/60 rounded-xl cursor-pointer transition-all"
              >
                {/* Name */}
                <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-slate-400 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-white truncate">
                    {company.name}
                  </span>
                </div>

                {/* Domain */}
                <div className="md:col-span-2 flex items-center gap-1.5 min-w-0">
                  <Globe size={13} className="text-slate-500 shrink-0 hidden md:block" />
                  <span className="text-sm text-slate-400 truncate">
                    {company.domain || '—'}
                  </span>
                </div>

                {/* Industry */}
                <div className="md:col-span-2 flex items-center min-w-0">
                  {company.industry ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-700/50 text-xs font-medium text-slate-300 truncate">
                      <Briefcase size={11} className="shrink-0" />
                      {company.industry}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </div>

                {/* Contacts count */}
                <div className="md:col-span-2 flex items-center justify-center gap-1.5">
                  <Users size={13} className="text-slate-500" />
                  <span className="text-sm text-slate-300">
                    {company.contact_count ?? 0}
                  </span>
                </div>

                {/* Deals count */}
                <div className="md:col-span-2 flex items-center justify-center gap-1.5">
                  <HandshakeIcon size={13} className="text-slate-500" />
                  <span className="text-sm text-slate-300">
                    {company.deal_count ?? 0}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Company Form Modal */}
      <CompanyForm isOpen={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
};

export default CompanyList;
