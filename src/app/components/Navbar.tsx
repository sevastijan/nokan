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
    <nav className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-700 px-6 py-8 flex flex-col">
      <div className="flex flex-col gap-8">
        <button
          onClick={goHome}
          className="text-3xl font-bold text-white hover:text-gray-300 transition-colors cursor-pointer text-left"
        >
          NOKAN
        </button>

        <div className="flex flex-col gap-6">
          {status === "loading" ? (
            <div className="text-gray-400">Loading...</div>
          ) : session?.user ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-lg">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt="User avatar"
                    width={48}
                    height={48}
                    className="rounded-full w-12 h-12"
                  />
                )}
                <span className="text-gray-300 text-sm text-center">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-3 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer w-full"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors cursor-pointer w-full"
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
