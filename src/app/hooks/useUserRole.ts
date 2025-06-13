import { useSession } from "next-auth/react";
import { useGetUserRoleQuery, UserRole } from "@/app/store/apiSlice";

export const useUserRole = () => {
  const { data: session, status } = useSession();
  // Extract email from session; if undefined, pass empty string and skip query
  const email = session?.user?.email || "";

  // Use RTK Query to fetch role; skip if no email
  const {
    data: roleFromApi,
    error: roleError,
    isLoading: roleLoading,
    isFetching,
  } = useGetUserRoleQuery(email, {
    skip: !email,
  });

  // Determine final userRole: if email empty, null; else from API (could be undefined until fetched)
  const userRole: UserRole | null = email ? roleFromApi ?? null : null;

  // Combine NextAuth loading and RTK Query loading
  const loading =
    status === "loading" || (email !== "" && (roleLoading || isFetching));

  // Access check functions
  const hasManagementAccess = () => {
    return userRole === "OWNER" || userRole === "PROJECT_MANAGER";
  };

  return {
    userRole, // UserRole | null
    loading, // boolean, true while fetching session or role
    hasManagementAccess, // () => boolean
    isOwner: userRole === "OWNER",
    isProjectManager: userRole === "PROJECT_MANAGER",
    isMember: userRole === "MEMBER",
    error: roleError, // possibly expose error for UI
  };
};
