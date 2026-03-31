'use client';

import DocsLayout from '@/app/components/Docs/DocsLayout';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

export default function DocsPage() {
  const { t } = useTranslation();

  return (
    <DocsLayout>
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <BookOpen size={48} className="text-slate-600 mb-4" />
        <p className="text-lg text-slate-400">{t('docs.noPages')}</p>
        <p className="text-sm text-slate-600 mt-1">
          {t('docs.search')}
        </p>
      </div>
    </DocsLayout>
  );
}
