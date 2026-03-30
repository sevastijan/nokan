'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useGetCurrentUserQuery } from '@/app/store/apiSlice';
import SlackAppSettings from '@/app/components/Settings/SlackAppSettings';
import Loader from '@/app/components/Loader';

export default function SettingsPage() {
     const router = useRouter();
     const { data: session, status } = useSession();
     const { data: currentUser, isLoading } = useGetCurrentUserQuery(session!, { skip: status !== 'authenticated' });

     useEffect(() => {
          if (!isLoading && currentUser?.role !== 'OWNER') router.replace('/dashboard');
     }, [currentUser, isLoading, router]);

     if (isLoading || status === 'loading') return <Loader />;
     if (currentUser?.role !== 'OWNER') return null;

     return (
          <div className="min-h-screen bg-slate-900">
               <div className="px-4 sm:px-6 py-6">
                    <h1 className="text-xl font-bold text-white mb-6">Ustawienia</h1>
                    <SlackAppSettings />
               </div>
          </div>
     );
}
