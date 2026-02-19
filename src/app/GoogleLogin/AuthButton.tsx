'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Loader from '../components/Loader';

const AuthButton = () => {
     const { t } = useTranslation();
     const { data: session, status } = useSession();
     const router = useRouter();

     const handleSignIn = () => {
          signIn('google');
     };

     const goToDashboard = () => {
          router.push('/dashboard');
     };

     if (status === 'loading') {
          return <Loader />;
     }

     return (
          <div className="space-y-4 flex flex-col">
               {!session ? (
                    <button
                         onClick={handleSignIn}
                         className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg cursor-pointer border border-slate-600"
                    >
                         {t('auth.signInWithGoogle')}
                    </button>
               ) : (
                    <div className="text-center space-y-4">
                         <p className="text-xl text-slate-100">{t('auth.welcomeBack', { name: session.user?.name })}</p>
                         <button
                              onClick={goToDashboard}
                              className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg cursor-pointer border border-slate-600"
                         >
                              {t('auth.goToDashboard')}
                         </button>
                    </div>
               )}
          </div>
     );
};

export default AuthButton;
