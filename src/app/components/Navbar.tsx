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
  FaCog,
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
          "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 text-yellow-300 border border-yellow-400/30";
        roleText = "Owner";
        break;
      case "PROJECT_MANAGER":
        badgeColor =
          "bg-gradient-to-r from-blue-400/20 to-blue-600/20 text-blue-300 border border-blue-400/30";
        roleText = "Project Manager";
        break;
      case "MEMBER":
        badgeColor =
          "bg-gradient-to-r from-slate-400/20 to-slate-600/20 text-slate-300 border border-slate-400/30";
        roleText = "Member";
        break;
      default:
        return null;
    }

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${badgeColor} backdrop-blur-sm`}
      >
        {roleText}
      </span>
    );
  };

  const notifications = [
    {
      id: 1,
      title: "New task assigned",
      message: "You have been assigned to 'Update Documentation'",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      title: "Board updated",
      message: "Development board has been updated",
      time: "4 hours ago",
      unread: true,
    },
    {
      id: 3,
      title: "Deadline reminder",
      message: "Project deadline is approaching",
      time: "1 day ago",
      unread: false,
    },
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

        <div className="flex-1 p-4 space-y-6">
          {status === "loading" ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : session?.user ? (
            <>
              {/* User Profile - Enhanced */}
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={session.user.image || null}
                      alt="User avatar"
                      size={52}
                      className="ring-2 ring-slate-600/50 ring-offset-2 ring-offset-slate-800"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 shadow-lg">
                      <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {session.user.name || "User"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {getRoleBadge()}
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-slate-400 font-medium">
                          Online
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-slate-400 font-medium">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/30">
                  <div className="flex items-center gap-1">
                    {/* Notifications */}
                    <div className="relative">
                      <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group"
                      >
                        <FaBell className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg animate-bounce">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Notifications Dropdown */}
                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 top-full mt-2 w-80 bg-slate-800/98 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                            style={{
                              maxHeight: "calc(100vh - 120px)",
                              transform: "translateX(-85%)",
                            }}
                          >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <h3 className="text-white font-semibold text-sm">
                                    Notifications
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 text-xs">
                                    {unreadCount} unread
                                  </span>
                                  <button
                                    onClick={() => setShowNotifications(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                              {notifications.map((notification, index) => (
                                <motion.div
                                  key={notification.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className={`relative p-3 border-b border-slate-700/30 hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group ${
                                    notification.unread
                                      ? "bg-blue-500/5 border-l-2 border-l-blue-500"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 mt-1">
                                      {notification.unread ? (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                      ) : (
                                        <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <p
                                          className={`text-xs font-medium leading-tight ${
                                            notification.unread
                                              ? "text-white"
                                              : "text-slate-300"
                                          }`}
                                        >
                                          {notification.title}
                                        </p>
                                        <span className="text-slate-500 text-xs whitespace-nowrap">
                                          {notification.time}
                                        </span>
                                      </div>
                                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                                        {notification.message}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Hover indicator */}
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FaChevronRight className="w-2 h-2 text-slate-400" />
                                  </div>
                                </motion.div>
                              ))}

                              {/* Empty state */}
                              {notifications.length === 0 && (
                                <div className="p-6 text-center">
                                  <FaBell className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                                  <p className="text-slate-400 text-xs">
                                    No notifications yet
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
                              <div className="flex items-center gap-2">
                                <button className="flex-1 text-center text-blue-400 hover:text-blue-300 text-xs font-medium py-1.5 px-2 rounded-lg hover:bg-blue-500/10 transition-all duration-200">
                                  Mark all read
                                </button>
                                <button className="flex-1 text-center text-slate-400 hover:text-white text-xs font-medium py-1.5 px-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200">
                                  View all
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Settings */}
                    <button className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 group">
                      <FaCog className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Profile Actions */}
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-1">
                <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
                  NAVIGATION
                </h4>
                <div className="space-y-1">
                  <Link href="/dashboard">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                      <FaTachometerAlt className="w-4 h-4" />
                      <span className="font-medium text-sm">Dashboard</span>
                      <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  <Link href="/calendar">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                      <FaCalendarAlt className="w-4 h-4" />
                      <span className="font-medium text-sm">Calendar</span>
                      <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  {!roleLoading && hasManagementAccess() && (
                    <Link href="/team-management">
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all duration-200 group cursor-pointer">
                        <FaUsers className="w-4 h-4" />
                        <span className="font-medium text-sm">
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

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Mobile Sidebar - similar updates */}
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
              <div className="flex-1 p-6 space-y-6">
                {status === "loading" ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : session?.user ? (
                  <>
                    {/* Mobile User Profile */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-sm rounded-3xl p-6 border border-slate-700/50 shadow-xl">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Avatar
                            src={session.user.image || null}
                            alt="User avatar"
                            size={88}
                            className="ring-4 ring-slate-600/50 ring-offset-4 ring-offset-slate-800"
                          />
                          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-3 border-slate-800 shadow-lg flex items-center justify-center">
                            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                          </div>
                        </div>

                        <div className="text-center space-y-3">
                          <div className="space-y-2">
                            <h3 className="text-white font-bold text-2xl leading-tight">
                              {session.user.name || "User"}
                            </h3>

                            {/* Role Badge */}
                            <div className="flex justify-center">
                              {getRoleBadge()}
                            </div>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex items-center justify-center gap-4 text-sm pt-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-slate-400 font-medium">
                                Online
                              </span>
                            </div>
                            <div className="w-px h-5 bg-slate-600"></div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                              <span className="text-slate-400 font-medium">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() =>
                              setShowNotifications(!showNotifications)
                            }
                            className="p-3 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all duration-200 relative group"
                          >
                            <FaBell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                          <button className="p-3 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all duration-200 group">
                            <FaCog className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                          </button>
                          <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl text-sm font-medium transition-all duration-200 border border-blue-500/30">
                            Profile
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-2">
                      <div className="space-y-1">
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
