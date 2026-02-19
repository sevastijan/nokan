'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
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
	const pathname = usePathname();
	const loggedIn = status === 'authenticated';
	const isLoading = status === 'loading';
	const isStandalone = usePWAStandalone();
	useServiceWorker();
	const { currentUser } = useCurrentUser();
	usePresence(currentUser?.id ?? null);
	useGlobalChatNotification(currentUser?.id ?? null);
	useGlobalNotification(currentUser?.id ?? null);
	useAutoPushSubscription(currentUser?.id ?? null);

	const isLanding = pathname === '/';

	// On protected routes, show loader while session is resolving.
	// This prevents the flash of dashboard content before auth check completes.
	if (isLoading && !isLanding) {
		return (
			<PWASplashProvider isStandalone={isStandalone}>
				<PWASplashScreen />
				<Loader />
			</PWASplashProvider>
		);
	}

	return (
		<PWASplashProvider isStandalone={isStandalone}>
			<ChatProvider>
				<PWASplashScreen />
				{loggedIn && <Navbar />}
				<main className={`main-content min-h-screen ${loggedIn ? 'md:ml-60' : ''}`}>
					{children}
				</main>
				{loggedIn && <MiniChatContainer />}
			</ChatProvider>
		</PWASplashProvider>
	);
};

export default ClientLayout;
