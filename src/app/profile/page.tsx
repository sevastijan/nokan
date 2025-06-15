"use client";

import { Fragment } from "react";
import { useSession } from "next-auth/react";
import { Transition } from "@headlessui/react";
import Avatar from "../components/Avatar/Avatar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useGetUserRoleQuery, useGetMyBoardsQuery } from "@/app/store/apiSlice";
import Link from "next/link";
import { FaTachometerAlt, FaChevronRight } from "react-icons/fa";

const ProfilePage = () => {
  const { data: session } = useSession();
  const { currentUser } = useCurrentUser();

  // User role
  const { data: userRole } = useGetUserRoleQuery(session?.user?.email ?? "", {
    skip: !session?.user?.email,
  });

  // Boards
  const { data: boards = [], isLoading: boardsLoading } = useGetMyBoardsQuery(
    currentUser?.id ?? "",
    { skip: !currentUser?.id }
  );

  // Role badge
  const getRoleBadge = () => {
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

  return (
    <div className="max-w-2xl mx-auto pt-8 px-4">
      <Transition
        appear
        show={true}
        as={Fragment}
        enter="transition-all duration-300"
        enterFrom="opacity-0 translate-y-4"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-xl p-8 flex flex-col gap-6">
          {/* User Info */}
          <div className="flex gap-5 items-center">
            <Avatar
              src={session?.user?.image || ""}
              alt="Avatar"
              size={64}
              className="ring-2 ring-blue-400/40"
            />
            <div>
              <div className="text-xl font-bold text-white">
                {session?.user?.name || "User"}
              </div>
              <div className="text-slate-400 text-sm">
                {session?.user?.email}
              </div>
              <div className="mt-2">{getRoleBadge()}</div>
            </div>
          </div>
          {/* Boards */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">
              My Boards
            </h2>
            {boardsLoading ? (
              <div className="text-slate-400 text-sm">Loading...</div>
            ) : boards.length === 0 ? (
              <div className="text-slate-500 text-sm">No boards yet.</div>
            ) : (
              <ul className="space-y-2">
                {boards.map(
                  (b: { id: string; title: string; description?: string }) => (
                    <li key={b.id}>
                      <Link
                        href={`/board/${b.id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/70 transition text-slate-100 group"
                      >
                        <FaTachometerAlt className="text-blue-400 w-4 h-4" />
                        <span className="flex-1 truncate">{b.title}</span>
                        <FaChevronRight className="text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                      </Link>
                      {b.description && (
                        <div className="ml-10 text-xs text-slate-400">
                          {b.description}
                        </div>
                      )}
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default ProfilePage;
