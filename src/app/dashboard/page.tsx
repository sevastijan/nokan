"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BoardList from "../components/Board/BoardList";
import Loader from "../components/Loader";

/**
 * Dashboard page component that displays user's boards
 * Requires authentication to access
 * @returns JSX element containing the dashboard interface
 */
const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check session status - loading, authenticated, unauthenticated
  if (status === "loading") {
    return <Loader text="Loading dashboards..." />;
  }

  // If user is not authenticated, redirect to sign in page
  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard 🥷🏻</h1>
      <BoardList />
    </div>
  );
};

export default DashboardPage;
