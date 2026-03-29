'use client';

import CrmLayout from '@/app/components/CRM/CrmLayout';
import CompanyList from '@/app/components/CRM/CompanyList';

export default function CrmCompaniesPage() {
  return (
    <CrmLayout>
      <CompanyList />
    </CrmLayout>
  );
}
