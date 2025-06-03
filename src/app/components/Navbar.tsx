"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarVariants = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
  exit: { x: "-100%" },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5 },
  exit: { opacity: 0 },
};

const Navbar = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/", redirect: true });
  };

  const handleSignIn = () => {
    signIn(undefined, { callbackUrl: "/dashboard" });
  };

  const goHome = () => {
    router.push("/");
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 text-white px-3 py-2 rounded focus:outline-none"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Desktop Sidebar */}
      <nav className="hidden fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 px-6 py-8 md:flex md:flex-col">
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

      {/* Mobile Sidebar with Animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black z-40 md:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <motion.nav
              className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 px-6 py-8 flex flex-col z-50 md:hidden"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Close button */}
              <button
                className="self-end text-gray-400 hover:text-white text-2xl mb-4"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>

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
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="bg-red-600 text-white px-4 py-3 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer w-full"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        handleSignIn();
                        setIsOpen(false);
                      }}
                      className="bg-blue-600 text-white px-4 py-3 rounded hover:bg-blue-700 transition-colors cursor-pointer w-full"
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
