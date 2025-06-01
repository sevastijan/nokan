"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BoardList from "../components/BoardList"; // Import komponentu BoardList

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Sprawdź status sesji - loading, authenticated, unauthenticated
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Jeśli użytkownik nie jest zalogowany, przekieruj na stronę logowania
  if (status === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Your Dashboards</h1>
      <BoardList />
    </div>
  );
}
