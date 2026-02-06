'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from './components/Navbar';

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

     // Optional: if you want to redirect or do something on session change, you can useEffect here.
     // e.g. close modals, etc. For now we just rely on rendering logic.

     return (
          <>
               {loggedIn && <Navbar />}
               <main className={`main-content min-h-screen ${loggedIn ? 'md:ml-60' : ''}`}>{children}</main>
          </>
     );
};

export default ClientLayout;
