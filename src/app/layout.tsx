import './styles/globals.css';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';
import { Toaster } from '@/components/ui/sonner';

export const dynamic = 'force-dynamic';

export const viewport = {
     themeColor: '#0E172B',
};

export const metadata = {
     title: 'Nokan Taskboard',
     description: 'Taskboard application',
     icons: {
          icon: [
               { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
               { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
          ],
          shortcut: '/favicon.ico',
          apple: '/apple-touch-icon.png',
     },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
          <html lang="en" suppressHydrationWarning={true}>
               <body className="bg-slate-900 text-slate-100" suppressHydrationWarning={true}>
                    <Providers>
                         <ClientLayout>{children}</ClientLayout>
                    </Providers>

                    <Toaster position="top-right" duration={2500} />
               </body>
          </html>
     );
}
