'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from './components/Navbar';
import PWASplashScreen from './components/PWASplashScreen';
import { PWASplashProvider } from './context/PWASplashContext';
import { useServiceWorker } from './hooks/useServiceWorker';
import { usePWAStandalone } from './hooks/usePWAStandalone';

/**
 * ClientLayout wraps pages on the client side.
 * - If user is authenticated: renders Navbar and applies left margin on main.
 * - If not authenticated: hides Navbar and main spans full width.
 *
 * Assumes <SessionProvider> is higher up (e.g. in Providers).
 */
interface ClientLayoutProps {
     children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
     const { status } = useSession();
     const loggedIn = status === 'authenticated';
     const isStandalone = usePWAStandalone();
     useServiceWorker();

     return (
          <PWASplashProvider isStandalone={isStandalone}>
               <PWASplashScreen />
               {loggedIn && <Navbar />}
               <main className={`main-content min-h-screen ${loggedIn ? 'md:ml-60' : ''}`}>{children}</main>
          </PWASplashProvider>
     );
};

export default ClientLayout;
