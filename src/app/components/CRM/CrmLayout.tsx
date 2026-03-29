'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import { LayoutDashboard, GitBranch, Building2 } from 'lucide-react';
import Loader from '@/app/components/Loader';

interface CrmLayoutProps {
  children: React.ReactNode;
}

const tabs = [
  { key: 'dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
  { key: 'pipeline', href: '/crm/pipeline', icon: GitBranch },
  { key: 'companies', href: '/crm/companies', icon: Building2 },
] as const;

const CrmLayout = ({ children }: CrmLayoutProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status: authStatus } = useSession();
  const { data: currentUser, isLoading: userLoading } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== 'authenticated',
  });
  const role = currentUser?.role ?? null;
  const roleLoading = authStatus === 'loading' || userLoading;

  useEffect(() => {
    if (!roleLoading && role !== 'OWNER') {
      router.replace('/dashboard');
    }
  }, [role, roleLoading, router]);

  if (roleLoading) return <Loader />;
  if (role !== 'OWNER') return null;

  return (
    <div className="md:pl-60 pt-12 md:pt-0 min-h-screen bg-slate-900">
      {/* Sub-navigation */}
      <div className="sticky top-12 md:top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3">
            <span className="text-sm font-semibold text-white mr-4 hidden sm:block">
              {t('crm.title')}
            </span>
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                const isActive =
                  pathname === tab.href ||
                  (tab.key === 'companies' && pathname.startsWith('/crm/companies'));
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-400 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{t(`crm.${tab.key}`)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
};

export default CrmLayout;
