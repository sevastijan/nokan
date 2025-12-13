import './styles/globals.css';
import { Providers } from './providers';
import ClientLayout from './ClientLayout';
import { Toaster } from '@/components/ui/sonner';

// Force dynamic rendering...
export const dynamic = 'force-dynamic';

export const metadata = {
     title: 'Nokan Taskboard',
     description: 'Taskboard application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
          <html lang="en">
               <body className="bg-slate-900 text-slate-100">
                    <Providers>
                         <ClientLayout>{children}</ClientLayout>
                    </Providers>

                    <Toaster position="top-right" duration={2500} />
               </body>
          </html>
     );
}
