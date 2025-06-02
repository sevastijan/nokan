"use client";

import { useSession } from "next-auth/react";
import AuthButton from "./GoogleLogin/AuthButton";
import Loader from "./components/Loader";

/**
 * Home page component that displays the landing page with authentication
 * @returns JSX element containing the home page interface
 */
const Home = () => {
  const { status } = useSession();

  if (status === "loading") {
    return <Loader text="Loading..." />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white mb-4">NOKAN</h1>
        <p className="text-xl text-gray-300 mb-8">
          Organize your tasks with simple and powerful boards
        </p>
        <AuthButton />
      </div>
    </div>
  );
};

export default Home;
