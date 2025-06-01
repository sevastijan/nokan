"use client";

import { signIn, signOut, useSession } from "next-auth/react";

const handleSignIn = () => {
  signIn("google"); // Usuń callbackUrl
};

export default function AuthButton() {
  const { data: session } = useSession();

  return (
    <div>
      {!session ? (
        <button
          onClick={handleSignIn}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Log in with Google
        </button>
      ) : (
        <div className="flex flex-col items-center">
          <p className="mb-2">Welcome, {session.user?.name}!</p>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
