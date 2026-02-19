'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function NotFoundContent() {
     const { t } = useTranslation();

     return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6">
               <div className="text-center">
                    <h1 className="text-6xl font-bold text-slate-100 mb-4">{t('notFound.title')}</h1>
                    <h2 className="text-2xl text-slate-300 mb-8">{t('notFound.subtitle')}</h2>
                    <Link
                         href="/"
                         className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-6 py-3 rounded-lg font-medium transition-all"
                    >
                         {t('notFound.goHome')}
                    </Link>
               </div>
          </div>
     );
}
