import { Suspense } from 'react';
import SubmitPageContent from './SubmitPageContent';
import Loader from '@/app/components/Loader';

export default function SubmitPage() {
     return (
          <Suspense fallback={<Loader text="Ładowanie..." />}>
               <SubmitPageContent />
          </Suspense>
     );
}
