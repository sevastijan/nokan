"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Navigation bar component that displays the app logo and user authentication controls
 * @returns JSX element containing the navigation bar interface
 */
const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  /**
   * Handle user sign out and redirect to home page
   */
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  /**
   * Handle user sign in with redirect to dashboard
   */
  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: "/dashboard" });
  };

  /**
   * Navigate to home page
   */
  const goHome = () => {
    router.push("/");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={goHome}
          className="text-2xl font-bold text-white hover:text-gray-300 transition-colors cursor-pointer"
        >
          NOKAN
        </button>

        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="text-gray-400">Loading...</div>
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="rounded-full w-8 h-8"
                />
              )}
              <span className="text-gray-300 text-sm">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
