'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import store from './store/index';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
     const [queryClient] = useState(() => new QueryClient());

     return (
          <SessionProvider refetchOnWindowFocus={false}>
               <QueryClientProvider client={queryClient}>
                    <Provider store={store}>{children}</Provider>
               </QueryClientProvider>
          </SessionProvider>
     );
}
