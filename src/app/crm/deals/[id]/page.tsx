'use client';

import { useParams } from 'next/navigation';
import CrmLayout from '@/app/components/CRM/CrmLayout';
import DealDetail from '@/app/components/CRM/DealDetail';

export default function CrmDealDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <CrmLayout>
      <DealDetail dealId={id} />
    </CrmLayout>
  );
}
