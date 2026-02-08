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
import { useCurrentUser } from './hooks/useCurrentUser';
import { usePresence } from './hooks/chat/usePresence';
import { useGlobalChatNotification } from './hooks/chat/useGlobalChatNotification';
import { useGlobalNotification } from './hooks/useGlobalNotification';
import { useAutoPushSubscription } from './hooks/useAutoPushSubscription';

interface ClientLayoutProps {
     children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
     const { status } = useSession();
     const loggedIn = status === 'authenticated';
     const isStandalone = usePWAStandalone();
     useServiceWorker();
     const { currentUser } = useCurrentUser();
     usePresence(currentUser?.id ?? null);
     useGlobalChatNotification(currentUser?.id ?? null);
     useGlobalNotification(currentUser?.id ?? null);
     useAutoPushSubscription(currentUser?.id ?? null);

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
