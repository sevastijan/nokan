import { useState, useEffect } from "react";
import { fetchOrCreateUserFromSession } from "../lib/api";
import { User } from "@/app/types/globalTypes";
import { Session } from "next-auth";

export const useCurrentUser = (session: Session | null) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      getUserFromSession(session);
    }
  }, [session]);

  const getUserFromSession = async (session: Session) => {
    try {
      setLoading(true);
      const user = await fetchOrCreateUserFromSession(session);
      if (user) {
        setCurrentUser({
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          image: user.image || undefined,
        });
      }
    } catch (error) {
      console.error("Error in useCurrentUser:", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentUser,
    loading,
    refetchUser: () => session && getUserFromSession(session),
  };
};
