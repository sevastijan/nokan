"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchOrCreateUserFromSession } from "@/app/lib/api";
import { User } from "@/app/types/globalTypes";
import { Session } from "next-auth";

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
 *  - currentUser: User | null      // Supabase user row (with at least id, name, email, image?)
 *  - loading: boolean              // true when NextAuth is loading or Supabase fetch is ongoing
 *  - error: Error | null           // any error during fetchOrCreateUserFromSession
 *  - session: Session | null       // NextAuth session
 *  - authStatus: "loading"|"authenticated"|"unauthenticated"
 *  - refetchUser: () => void       // manually trigger re-fetch from Supabase
 */
export function useCurrentUser() {
  const { data: session, status: authStatus } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * fetchUser: calls fetchOrCreateUserFromSession and updates state.
   * Wrapped in useCallback to maintain stable reference.
   */
  const fetchUser = useCallback(async (sess: Session) => {
    setLoading(true);
    setError(null);
    try {
      const userRow = await fetchOrCreateUserFromSession(sess);
      if (userRow) {
        // Map Supabase user row to your User type in globalTypes
        setCurrentUser({
          id: userRow.id,
          name: userRow.name || userRow.email,
          email: userRow.email,
          image: userRow.image || undefined,
          // If your User type has more fields, map them here
        });
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      console.error("useCurrentUser fetch error:", err);
      setError(err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Effect: when authStatus or session changes:
   *  - If authenticated + session available => fetchUser
   *  - If unauthenticated => clear currentUser+error+loading
   *  - If loading => set loading = true (NextAuth is verifying)
   */
  useEffect(() => {
    if (authStatus === "authenticated" && session) {
      fetchUser(session);
    } else if (authStatus === "unauthenticated") {
      // user is not logged in or has just logged out
      setCurrentUser(null);
      setError(null);
      setLoading(false);
    } else if (authStatus === "loading") {
      // NextAuth is checking session
      setLoading(true);
    }
  }, [authStatus, session, fetchUser]);

  /**
   * refetchUser: manual trigger to re-fetch the Supabase user row,
   * e.g. after profile update.
   */
  const refetchUser = useCallback(() => {
    if (session && authStatus === "authenticated") {
      fetchUser(session);
    }
  }, [session, authStatus, fetchUser]);

  return {
    currentUser,
    loading: loading || authStatus === "loading",
    error,
    session,
    authStatus,
    refetchUser,
  };
}
