"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUserRole } from "../hooks/useUserRole";
import Avatar from "../components/Avatar/Avatar";
import Button from "../components/Button/Button";
import {
  FaHome,
  FaTachometerAlt,
  FaCalendarAlt,
  FaSignOutAlt,
  FaUsers,
  FaSignInAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

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
  const { hasManagementAccess, loading: roleLoading, userRole } = useUserRole();
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

  const getRoleBadge = () => {
    if (roleLoading) return null;

    let badgeColor = "";
    let roleText = "";

    switch (userRole) {
      case "OWNER":
        badgeColor =
          "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900";
        roleText = "Owner";
        break;
      case "PROJECT_MANAGER":
        badgeColor = "bg-gradient-to-r from-blue-400 to-blue-600 text-blue-900";
        roleText = "Project Manager";
        break;
      case "MEMBER":
        badgeColor = "bg-gradient-to-r from-gray-400 to-gray-600 text-gray-900";
        roleText = "Member";
        break;
      default:
        return null;
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor} shadow-sm`}
      >
        {roleText}
      </span>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="secondary"
        size="md"
        className="fixed top-4 left-4 z-50 md:hidden shadow-lg"
        onClick={() => setIsOpen(true)}
        icon={<FaBars />}
      />

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 px-6 py-8 flex-col z-30">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Button
            variant="ghost"
            size="lg"
            onClick={goHome}
            className="text-3xl font-bold justify-start p-0 hover:bg-transparent hover:text-gray-300"
            icon={<FaHome />}
          >
            NOKAN
          </Button>

          <div className="flex flex-col gap-6">
            {status === "loading" ? (
              <div className="text-gray-400">Loading...</div>
            ) : session?.user ? (
              <div className="flex flex-col gap-4">
                {/* User Info */}
                <div className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-lg">
                  <Avatar
                    src={session.user.image || null}
                    alt="User avatar"
                    size={48}
                  />
                  <span className="text-gray-300 text-sm text-center">
                    {session.user.name || session.user.email}
                  </span>
                  {getRoleBadge()}
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-3">
                  <Link href="/dashboard">
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      icon={<FaTachometerAlt />}
                    >
                      Dashboard
                    </Button>
                  </Link>

                  <Link href="/calendar">
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      icon={<FaCalendarAlt />}
                    >
                      Calendar
                    </Button>
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-4">
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth
                    onClick={handleSignOut}
                    icon={<FaSignOutAlt />}
                  >
                    Sign Out
                  </Button>

                  {!roleLoading && hasManagementAccess() && (
                    <Link href="/team-management">
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        icon={<FaUsers />}
                      >
                        Manage Teams
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSignIn}
                icon={<FaSignInAlt />}
              >
                Sign In
              </Button>
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
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Mobile Sidebar */}
            <motion.nav
              className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700 px-6 py-8 flex flex-col z-50 md:hidden"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Close button */}
              <div className="self-end mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  icon={<FaTimes />}
                />
              </div>

              <div className="flex flex-col gap-8">
                {/* Mobile Logo */}
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={goHome}
                  className="text-3xl font-bold justify-start p-0 hover:bg-transparent hover:text-gray-300"
                  icon={<FaHome />}
                >
                  NOKAN
                </Button>

                <div className="flex flex-col gap-6">
                  {status === "loading" ? (
                    <div className="text-gray-400">Loading...</div>
                  ) : session?.user ? (
                    <div className="flex flex-col gap-4">
                      {/* Mobile User Info */}
                      <div className="flex flex-col items-center gap-3 p-4 bg-gray-800 rounded-lg">
                        <Avatar
                          src={session.user.image || null}
                          alt="User avatar"
                          size={48}
                        />
                        <span className="text-gray-300 text-sm text-center">
                          {session.user.name || session.user.email}
                        </span>
                        {getRoleBadge()}
                      </div>

                      {/* Mobile Navigation Links */}
                      <div className="flex flex-col gap-3">
                        <Link href="/dashboard">
                          <Button
                            variant="secondary"
                            size="md"
                            fullWidth
                            onClick={() => setIsOpen(false)}
                            icon={<FaTachometerAlt />}
                          >
                            Dashboard
                          </Button>
                        </Link>

                        <Link href="/calendar">
                          <Button
                            variant="secondary"
                            size="md"
                            fullWidth
                            onClick={() => setIsOpen(false)}
                            icon={<FaCalendarAlt />}
                          >
                            Calendar
                          </Button>
                        </Link>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div className="flex flex-col gap-3 mt-4">
                        <Button
                          variant="danger"
                          size="md"
                          fullWidth
                          onClick={() => {
                            handleSignOut();
                            setIsOpen(false);
                          }}
                          icon={<FaSignOutAlt />}
                        >
                          Sign Out
                        </Button>

                        {!roleLoading && hasManagementAccess() && (
                          <Link href="/team-management">
                            <Button
                              variant="primary"
                              size="md"
                              fullWidth
                              onClick={() => setIsOpen(false)}
                              icon={<FaUsers />}
                            >
                              Manage Teams
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => {
                        handleSignIn();
                        setIsOpen(false);
                      }}
                      icon={<FaSignInAlt />}
                    >
                      Sign In
                    </Button>
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
