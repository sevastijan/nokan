'use client';

import { useParams } from 'next/navigation';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import CompanyDetail from '@/app/components/CRM/CompanyDetail';

export default function CrmCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <CrmLayout>
      <CompanyDetail companyId={id} />
    </CrmLayout>
  );
}
