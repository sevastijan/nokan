'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { fetchOrCreateUserFromSession } from '@/app/lib/api';
import { User } from '@/app/types/globalTypes';
import { Session } from 'next-auth';

/**
 * Hook to get the current user row from Supabase based on NextAuth session.
 *
 * Internally:
 * 1. Calls useSession() to get NextAuth session/status.
 * 2. When status === "authenticated", calls fetchOrCreateUserFromSession(session)
 *    which should check Supabase users table and create a new row if missing.
 * 3. Stores the result in local state `currentUser: User | null`.
 * 4. Exposes loading state, error, session/status, and a refetchUser() to manually re-fetch.
 *
 * Returns:
 *  - currentUser: User | null
 *  - loading: boolean
 *  - error: Error | null
 *  - session: Session | null
 *  - authStatus: "loading" | "authenticated" | "unauthenticated"
 *  - refetchUser: () => void
 */
export function useCurrentUser() {
     const { data: session, status: authStatus } = useSession();
     const [currentUser, setCurrentUser] = useState<User | null>(null);
     const [loading, setLoading] = useState<boolean>(false);
     const [error, setError] = useState<Error | null>(null);

     const fetchUser = useCallback(async (sess: Session) => {
          setLoading(true);
          setError(null);
          try {
               const userRow = await fetchOrCreateUserFromSession(sess);
               if (userRow) {
                    setCurrentUser({
                         id: userRow.id,
                         name: userRow.name || userRow.email,
                         email: userRow.email,
                         image: userRow.image || undefined,
                    });
               } else {
                    setCurrentUser(null);
               }
          } catch (err: unknown) {
               const errorObj = err instanceof Error ? err : new Error(String(err));
               console.error('useCurrentUser fetch error:', errorObj);
               setError(errorObj);
               setCurrentUser(null);
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          if (authStatus === 'authenticated' && session) {
               fetchUser(session);
          } else if (authStatus === 'unauthenticated') {
               setCurrentUser(null);
               setError(null);
               setLoading(false);
          } else if (authStatus === 'loading') {
               setLoading(true);
          }
     }, [authStatus, session, fetchUser]);

     const refetchUser = useCallback(() => {
          if (session && authStatus === 'authenticated') {
               fetchUser(session);
          }
     }, [session, authStatus, fetchUser]);

     return {
          currentUser,
          loading: loading || authStatus === 'loading',
          error,
          session,
          authStatus,
          refetchUser,
     };
}
