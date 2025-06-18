// src/app/components/Navbar.tsx
"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  Menu,
} from "@headlessui/react";
import { useSession, signOut } from "next-auth/react";
import {
  FaHome,
  FaTachometerAlt,
  FaCalendarAlt,
  FaSignOutAlt,
  FaUsers,
  FaBars,
  FaChevronRight,
  FaBell,
  FaCheck,
  FaTrash,
  FaExternalLinkAlt,
} from "react-icons/fa";
import Avatar from "../components/Avatar/Avatar";
import Button from "../components/Button/Button";
import {
  useGetUserRoleQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
  useGetMyBoardsQuery,
} from "@/app/store/apiSlice";
import { useCurrentUser } from "../hooks/useCurrentUser";

const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();

  // If user not logged in, render nothing
  if (!session?.user) {
    return null;
  }

  const { currentUser } = useCurrentUser();
  const { data: userRole, isLoading: roleLoading } = useGetUserRoleQuery(
    session.user.email ?? "",
    { skip: !session.user.email }
  );

  const hasManagementAccess = () =>
    userRole === "OWNER" || userRole === "PROJECT_MANAGER";

  const { data: notifications = [], refetch: refetchNotifications } =
    useGetNotificationsQuery(currentUser?.id ?? "", {
      skip: !currentUser?.id,
    });
  const [markNotificationRead] = useMarkNotificationReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const { data: boards } = useGetMyBoardsQuery(currentUser?.id ?? "", {
    skip: !currentUser?.id,
  });
  const getBoardName = (boardId: string) =>
    boards?.find((b: { id: string }) => b.id === boardId)?.title ||
    "Unknown board";

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadCount = notifications.filter(
    (n: { read: any }) => !n.read
  ).length;

  const getRoleBadge = () => {
    if (roleLoading) return null;
    let badgeColor = "",
      roleText = "";
    switch (userRole) {
      case "OWNER":
        badgeColor = "bg-yellow-600/20 text-yellow-300 border-yellow-400/30";
        roleText = "Owner";
        break;
      case "PROJECT_MANAGER":
        badgeColor = "bg-blue-600/20 text-blue-300 border-blue-400/30";
        roleText = "Project Manager";
        break;
      default:
        badgeColor = "bg-slate-600/20 text-slate-300 border-slate-400/30";
        roleText = "Member";
    }
    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium border ${badgeColor}`}
      >
        {roleText}
      </span>
    );
  };

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { href: "/calendar", label: "Calendar", icon: <FaCalendarAlt /> },
    ...(hasManagementAccess()
      ? [{ href: "/team-management", label: "Manage Teams", icon: <FaUsers /> }]
      : []),
  ];

  // Sidebar content as a separate component
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo and home */}
      <div className="p-4 border-b border-slate-700/50">
        <button
          onClick={() => {
            router.push("/");
            setSidebarOpen(false);
          }}
          className="flex items-center gap-2 text-xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <FaHome className="w-4 h-4 text-white" />
          </div>
          NOKAN
        </button>
      </div>

      {/* Profile section */}
      {session.user && (
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 shadow-xl mt-5 mx-4">
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
          {/* Notifications bell and profile link */}
          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-700/30">
            {/* Notifications dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                <FaBell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 z-30 mt-3 w-96 max-w-xs bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-slate-700">
                    <span className="font-semibold text-white text-base">
                      Notifications
                    </span>
                    <button
                      className="text-xs text-blue-400 hover:underline"
                      onClick={refetchNotifications}
                      tabIndex={-1}
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-5 text-slate-400 text-center text-sm">
                        No notifications
                      </div>
                    )}
                    {notifications.map(
                      (n: {
                        id: string | number | null | undefined;
                        read: any;
                        task_id: string;
                        title: any;
                        board_id: string;
                        message: React.ReactNode;
                        created_at: string | number | Date;
                      }) => (
                        <Menu.Item key={String(n.id)}>
                          {({ active }) => (
                            <div
                              className={`group px-4 py-3 ${
                                n.read ? "" : "bg-slate-800/60"
                              } ${
                                active ? "bg-slate-800/80" : ""
                              } text-white flex flex-col gap-1 cursor-pointer transition-all rounded`}
                              onClick={() => {
                                if (n.board_id && n.task_id) {
                                  router.push(
                                    `/board/${n.board_id}?task=${n.task_id}`
                                  );
                                  setSidebarOpen(false);
                                }
                              }}
                              tabIndex={0}
                              role="button"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {n.title || "Notification"}
                                </span>
                                {n.board_id && (
                                  <span className="ml-2 bg-slate-700/40 px-2 py-0.5 rounded text-xs text-slate-300 border border-slate-600/40">
                                    {getBoardName(n.board_id)}
                                  </span>
                                )}
                                {n.task_id && (
                                  <FaExternalLinkAlt className="ml-2 w-3 h-3 text-blue-400" />
                                )}
                              </div>
                              <span className="text-xs text-slate-400 break-words">
                                {n.message}
                              </span>
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                {n.created_at
                                  ? new Date(n.created_at).toLocaleString()
                                  : ""}
                              </span>
                              <div className="flex items-center gap-2 mt-2">
                                {!n.read && (
                                  <button
                                    title="Mark as read"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (n.id)
                                        await markNotificationRead({
                                          id: String(n.id),
                                        });
                                      refetchNotifications();
                                    }}
                                    className="text-green-400 hover:bg-green-700/20 rounded p-1.5"
                                  >
                                    <FaCheck />
                                  </button>
                                )}
                                <button
                                  title="Delete"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (n.id)
                                      await deleteNotification({
                                        id: String(n.id),
                                      });
                                    refetchNotifications();
                                  }}
                                  className="text-red-400 hover:bg-red-700/20 rounded p-1.5"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          )}
                        </Menu.Item>
                      )
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <button
              onClick={() => router.push("/profile")}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
            >
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* Main navigation links */}
      <div className="flex-1 mt-8">
        <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-6 mb-2">
          NAVIGATION
        </h4>
        <div className="space-y-1 px-2">
          {nav.map(({ href, label, icon }) => (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all group cursor-pointer">
                {icon}
                <span className="font-medium text-sm truncate">{label}</span>
                <FaChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sign out button */}
      {session.user && (
        <div className="p-4 border-t border-slate-700/50">
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => signOut({ callbackUrl: "/", redirect: true })}
            icon={<FaSignOutAlt />}
          >
            Sign Out
          </Button>
        </div>
      )}
    </div>
  ); // end of SidebarContent return

  // Now the main render of Navbar:
  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed right-4 top-3 z-50 md:hidden bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 shadow-lg hover:bg-slate-700/80 transition-all text-slate-300 hover:text-white"
        aria-label="Open sidebar"
      >
        <FaBars className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex-col z-30 shadow-2xl">
        <SidebarContent />
      </nav>

      {/* Mobile sidebar dialog */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 md:hidden"
          onClose={setSidebarOpen}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" />
          </TransitionChild>
          <TransitionChild
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="fixed inset-0 w-full h-full bg-slate-900/95 border-r border-slate-700/50 shadow-2xl focus:outline-none rounded-none p-0">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-4 top-4 z-50 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              >
                <span className="sr-only">Close</span>✕
              </button>
              <SidebarContent />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  );
};

export default Navbar;
