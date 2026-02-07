'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from './components/Navbar';
import PWASplashScreen from './components/PWASplashScreen';
import { PWASplashProvider } from './context/PWASplashContext';
import { ChatProvider } from './context/ChatContext';
import MiniChatContainer from './components/Chat/MiniChatContainer';
import { useServiceWorker } from './hooks/useServiceWorker';
import { usePWAStandalone } from './hooks/usePWAStandalone';

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
               <ChatProvider>
                    <PWASplashScreen />
                    {loggedIn && <Navbar />}
                    <main className={`main-content min-h-screen ${loggedIn ? 'md:ml-60' : ''}`}>{children}</main>
                    {loggedIn && <MiniChatContainer />}
               </ChatProvider>
          </PWASplashProvider>
     );
};

export default ClientLayout;
