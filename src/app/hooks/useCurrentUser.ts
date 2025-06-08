import { useState, useEffect } from 'react';
import { getUserIdByEmail } from '../lib/api';
import { User } from '../types/useBoardTypes'; 
import { Session } from 'next-auth';

export const useCurrentUser = (session: Session | null) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchCurrentUser(session.user.email);
    }
  }, [session]);

  const fetchCurrentUser = async (userEmail: string) => {
    try {
      setLoading(true);
      const userId = await getUserIdByEmail(userEmail);
      if (userId && session?.user) {
        setCurrentUser({
          id: userId,
          name: session.user.name || session.user.email || "",
          email: session.user.email || "",
          image: session.user.image || undefined, 
        });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    loading,
    refetchUser: () => session?.user?.email && fetchCurrentUser(session.user.email)
  };
};