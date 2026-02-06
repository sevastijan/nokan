'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import store from './store/index';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
     return (
          <SessionProvider refetchOnWindowFocus={false}>
               <Provider store={store}>{children}</Provider>
          </SessionProvider>
     );
}
