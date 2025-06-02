"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";

/**
 * Authentication button component that handles user sign-in and navigation to dashboard
 * @returns JSX element with conditional authentication UI
 */
const AuthButton = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  /**
   * Handle Google sign-in process
   */
  const handleSignIn = () => {
    signIn("google");
  };

  /**
   * Navigate to user dashboard
   */
  const goToDashboard = () => {
    router.push("/dashboard");
  };

  if (status === "loading") {
    return <Loader text="Loading..." />;
  }

  return (
    <div className="space-y-4">
      {!session ? (
        <button
          onClick={handleSignIn}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg cursor-pointer"
        >
          Sign in with Google
        </button>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-xl text-white">
            Welcome back, {session.user?.name}!
          </p>
          <button
            onClick={goToDashboard}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default AuthButton;
