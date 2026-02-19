import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import LandingPage from './components/LandingPage';

export const dynamic = 'force-dynamic';

export default async function Home() {
	const session = await getServerSession(authOptions);

	if (session) {
		redirect('/dashboard');
	}

	return <LandingPage />;
}
