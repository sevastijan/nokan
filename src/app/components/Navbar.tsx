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
  FaChevronRight,
  FaBell,
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
  const [showNotifications, setShowNotifications] = useState(false);

  type NotificationPlaceholder = {
    id: string;
    title?: string;
    message?: string;
    time?: string;
    unread: boolean;
  };

  // Prevent background scroll when mobile sidebar open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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
          "bg-yellow-600/20 text-yellow-300 border border-yellow-400/30";
        roleText = "Owner";
        break;
      case "PROJECT_MANAGER":
        badgeColor = "bg-blue-600/20 text-blue-300 border border-blue-400/30";
        roleText = "Project Manager";
        break;
      case "MEMBER":
      default:
        badgeColor =
          "bg-slate-600/20 text-slate-300 border border-slate-400/30";
        roleText = "Member";
        break;
    }
    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${badgeColor} backdrop-blur-sm`}
      >
        {roleText}
      </span>
    );
  };

  // Placeholder notifications array; for now we just show bell icon without dropdown
  const notifications: NotificationPlaceholder[] = [
    // Example placeholder:
    // { id: "1", title: "New task assigned", message: "...", time: "2h ago", unread: true },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 shadow-lg hover:bg-slate-700/80 transition-all duration-200 text-slate-300 hover:text-white"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex-col z-30 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={goHome}
            className="flex items-center gap-2 text-xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text hover:from-blue-300 hover:to-purple-300 transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FaHome className="w-4 h-4 text-white" />
            </div>
            NOKAN
          </button>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : session?.user ? (
            <>
              {/* User Profile */}
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={session.user.image || null}
                    alt="User avatar"
                    size={52}
                    className="ring-2 ring-slate-600/50 ring-offset-2 ring-offset-slate-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">
                      {session.user.name || "User"}
                    </h3>
                    <div className="mt-2">{getRoleBadge()}</div>
                  </div>
                </div>

                {/* Actions Row: only bell placeholder */}
                <div className="flex items-center justify-start mt-4 pt-4 border-t border-slate-700/30 gap-3">
                  <button
                    onClick={() => {
                      /* placeholder: open notifications logic later */
                    }}
                    className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group"
                  >
                    <FaBell className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                  >
                    View Profile
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-1 mt-6">
                <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
                  NAVIGATION
                </h4>
                <div className="space-y-1">
                  <Link href="/dashboard">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                      <FaTachometerAlt className="w-4 h-4" />
                      <span className="font-medium text-sm truncate">
                        Dashboard
                      </span>
                      <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  <Link href="/calendar">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                      <FaCalendarAlt className="w-4 h-4" />
                      <span className="font-medium text-sm truncate">
                        Calendar
                      </span>
                      <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  {!roleLoading && hasManagementAccess() && (
                    <Link href="/team-management">
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                        <FaUsers className="w-4 h-4" />
                        <span className="font-medium text-sm truncate">
                          Manage Teams
                        </span>
                        <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </>
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

        {/* Footer */}
        {session?.user && (
          <div className="p-4 border-t border-slate-700/50">
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleSignOut}
              icon={<FaSignOutAlt />}
            >
              Sign Out
            </Button>
          </div>
        )}
      </nav>

      {/* Click outside to close notifications placeholder */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />

            <motion.nav
              className="fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex flex-col z-50 md:hidden shadow-2xl"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <button
                  onClick={goHome}
                  className="flex items-center gap-3 text-xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text"
                >
                  <div className="w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <FaHome className="w-3.5 h-3.5 text-white" />
                  </div>
                  NOKAN
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {status === "loading" ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : session?.user ? (
                  <>
                    {/* Mobile User Profile */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 shadow-xl">
                      <div className="flex flex-col items-center gap-4">
                        <Avatar
                          src={session.user.image || null}
                          alt="User avatar"
                          size={88}
                          className="ring-4 ring-slate-600/50 ring-offset-4 ring-offset-slate-800"
                        />
                        <h3 className="text-white font-bold text-2xl truncate text-center">
                          {session.user.name || "User"}
                        </h3>
                        <div className="mt-2">{getRoleBadge()}</div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                          <button
                            onClick={() => {
                              /* placeholder */
                            }}
                            className="p-3 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all duration-200 relative group"
                          >
                            <FaBell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => router.push("/profile")}
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl text-sm font-medium transition-all duration-200 border border-blue-500/30"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-2">
                      <Link href="/dashboard">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                          <FaTachometerAlt className="w-5 h-5" />
                          <span className="font-medium">Dashboard</span>
                          <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                      <Link href="/calendar">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                          <FaCalendarAlt className="w-5 h-5" />
                          <span className="font-medium">Calendar</span>
                          <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                      {!roleLoading && hasManagementAccess() && (
                        <Link href="/team-management">
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                            <FaUsers className="w-5 h-5" />
                            <span className="font-medium">Manage Teams</span>
                            <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleSignIn}
                    icon={<FaSignInAlt />}
                  >
                    Sign In
                  </Button>
                )}
              </div>

              {/* Mobile Footer */}
              {session?.user && (
                <div className="p-6 border-t border-slate-700/50">
                  <Button
                    variant="danger"
                    size="md"
                    fullWidth
                    onClick={handleSignOut}
                    icon={<FaSignOutAlt />}
                  >
                    Sign Out
                  </Button>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
