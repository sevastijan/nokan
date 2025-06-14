// src/app/dashboard/DashboardPage.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useGetCurrentUserQuery,
  useGetMyBoardsQuery,
  useAddBoardMutation,
  useUpdateBoardTitleMutation,
  useRemoveBoardMutation,
  useCreateBoardFromTemplateMutation,
} from "@/app/store/apiSlice";
import Loader from "@/app/components/Loader";
import Button from "@/app/components/Button/Button";
import BoardModal from "@/app/components/Board/BoardModal";
import { BoardTemplate } from "@/app/types/globalTypes";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaArrowRight,
} from "react-icons/fa";

// A simple popover component for Filters:
const FilterPopover = ({
  anchorRef,
  onClose,
  hasTasksOnly,
  setHasTasksOnly,
  hasMembersOnly,
  setHasMembersOnly,
}: {
  anchorRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  hasTasksOnly: boolean;
  setHasTasksOnly: (v: boolean) => void;
  hasMembersOnly: boolean;
  setHasMembersOnly: (v: boolean) => void;
}) => {
  const popRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose, anchorRef]);

  // Positioning: we render below the anchor; using absolute with nearest positioned ancestor.
  return (
    <div
      ref={popRef}
      className="absolute mt-2 right-0 w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl z-50"
    >
      <div className="p-3 text-sm text-slate-200">
        <div className="font-medium text-white mb-2">Filters</div>
        <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded">
          <input
            type="checkbox"
            checked={hasTasksOnly}
            onChange={(e) => setHasTasksOnly(e.target.checked)}
            className="form-checkbox text-purple-500 focus:ring-purple-400"
          />
          <span>Has tasks</span>
        </label>
        <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded">
          <input
            type="checkbox"
            checked={hasMembersOnly}
            onChange={(e) => setHasMembersOnly(e.target.checked)}
            className="form-checkbox text-purple-500 focus:ring-purple-400"
          />
          <span>Has team members</span>
        </label>
        <button
          onClick={() => {
            setHasTasksOnly(false);
            setHasMembersOnly(false);
            onClose();
          }}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300"
        >
          Clear all
        </button>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // 1) Fetch current user
  const {
    data: currentUser,
    isFetching: loadingUser,
    error: userError,
  } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== "authenticated",
  });

  // 2) Fetch boards
  const {
    data: boards,
    isFetching: loadingBoards,
    error: boardsError,
    refetch: refetchBoards,
  } = useGetMyBoardsQuery(currentUser?.id || "", {
    skip: !currentUser?.id,
  });

  // 3) Mutations
  const [addBoard] = useAddBoardMutation();
  const [updateBoardTitle] = useUpdateBoardTitleMutation();
  const [removeBoard] = useRemoveBoardMutation();
  const [createBoardFromTemplate] = useCreateBoardFromTemplateMutation();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete">(
    "create"
  );
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  // Template selection for create mode
  const [selectedTemplate, setSelectedTemplate] =
    useState<BoardTemplate | null>(null);
  const [templateRefreshTrigger, setTemplateRefreshTrigger] =
    useState<number>(0);

  // Search + filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hasTasksOnly, setHasTasksOnly] = useState<boolean>(false);
  const [hasMembersOnly, setHasMembersOnly] = useState<boolean>(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [authStatus, router]);

  if (authStatus === "loading" || loadingUser || loadingBoards) {
    return <Loader text="Loading dashboard..." />;
  }
  if (authStatus === "unauthenticated") {
    return null;
  }
  if (userError) {
    return <div className="p-8 text-red-400">Failed to load user data</div>;
  }
  if (boardsError) {
    return <div className="p-8 text-red-400">Failed to load boards</div>;
  }

  // Stats
  const totalBoards = boards?.length ?? 0;
  const totalTasks =
    boards?.reduce((sum, b) => sum + (b._count?.tasks ?? 0), 0) ?? 0;
  const totalMembers =
    boards?.reduce((sum, b) => sum + (b._count?.teamMembers ?? 0), 0) ?? 0;

  // Open modals
  const openCreate = () => {
    setSelectedBoard(null);
    setModalMode("create");
    setModalTitle("");
    setSelectedTemplate(null);
    // trigger reload of templates if needed:
    setTemplateRefreshTrigger((t) => t + 1);
    setModalOpen(true);
  };
  const openEdit = (boardId: string) => {
    setSelectedBoard(boardId);
    setModalMode("edit");
    const b = boards?.find((b) => b.id === boardId);
    setModalTitle(b?.title ?? "");
    setSelectedTemplate(null);
    setModalOpen(true);
  };
  const openDelete = (boardId: string) => {
    setSelectedBoard(boardId);
    setModalMode("delete");
    const b = boards?.find((b) => b.id === boardId);
    setModalTitle(b?.title ?? "");
    setSelectedTemplate(null);
    setModalOpen(true);
  };

  // Handle save in modal
  const handleSave = async (title: string, templateId?: string | null) => {
    if (modalMode === "create" && currentUser) {
      try {
        if (templateId) {
          await createBoardFromTemplate({
            title,
            templateId,
            user_id: currentUser.id,
          }).unwrap();
        } else {
          await addBoard({
            title,
            user_id: currentUser.id,
          }).unwrap();
        }
        await refetchBoards();
      } catch (err) {
        console.error("Failed to create board:", err);
        alert("Failed to create board");
      }
    } else if (modalMode === "edit" && selectedBoard) {
      try {
        await updateBoardTitle({
          boardId: selectedBoard,
          title,
        }).unwrap();
        await refetchBoards();
      } catch (err) {
        console.error("Failed to update board title:", err);
        alert("Failed to update board title");
      }
    }
    setModalOpen(false);
  };

  // Handle delete in modal
  const handleDelete = async () => {
    if (selectedBoard) {
      try {
        await removeBoard({ boardId: selectedBoard }).unwrap();
        await refetchBoards();
      } catch (err) {
        console.error("Failed to delete board:", err);
        alert("Failed to delete board");
      }
    }
    setModalOpen(false);
  };

  // Filter + search logic
  const filteredBoards = (boards || []).filter((b) => {
    // Search by title
    if (searchTerm.trim()) {
      if (!b.title.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
    }
    // Filter has tasks
    if (hasTasksOnly) {
      if (!b._count?.tasks || b._count.tasks === 0) return false;
    }
    // Filter has members
    if (hasMembersOnly) {
      if (!b._count?.teamMembers || b._count.teamMembers === 0) return false;
    }
    return true;
  });

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* HEADER */}
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
          <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Greeting */}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back,{" "}
                {session?.user?.name ? session.user.name.split(" ")[0] : "User"}
                👋
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Here&apos;s what&apos;s happening with your projects today
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition">
            <p className="text-sm text-slate-400">Total Boards</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {totalBoards}
            </p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition">
            <p className="text-sm text-slate-400">Total Tasks</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {totalTasks}
            </p>
          </div>
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition">
            <p className="text-sm text-slate-400">Team Members (all)</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {totalMembers}
            </p>
          </div>
          {/* You can add more stat cards here */}
        </div>

        {/* ACTIONS */}
        <div className="px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Boards</h2>
            <p className="text-slate-400 text-sm">
              Manage and organize your projects
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Filter Button + Popover */}
            <div className="relative">
              <button
                ref={filterBtnRef}
                onClick={() => setShowFilterPopover((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/70 hover:bg-slate-700/90 text-slate-200 rounded-lg transition"
              >
                <FaFilter className="w-4 h-4" />
                <span className="text-sm">Filter</span>
                {(hasTasksOnly || hasMembersOnly) && (
                  <span className="ml-1 inline-block w-2 h-2 bg-purple-500 rounded-full" />
                )}
              </button>
              {showFilterPopover && (
                <FilterPopover
                  //@ts-ignore
                  anchorRef={filterBtnRef}
                  onClose={() => setShowFilterPopover(false)}
                  hasTasksOnly={hasTasksOnly}
                  setHasTasksOnly={setHasTasksOnly}
                  hasMembersOnly={hasMembersOnly}
                  setHasMembersOnly={setHasMembersOnly}
                />
              )}
            </div>

            {/* Calendar View Button */}
            <button
              onClick={() => {
                // Placeholder: navigate to /calendar or open calendar view.
                router.push("/calendar");
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700/70 hover:bg-slate-700/90 text-slate-200 rounded-lg transition"
            >
              <FaCalendarAlt className="w-4 h-4" />
              <span className="text-sm">Calendar View</span>
            </button>

            {/* Create Board */}
            <Button
              variant="primary"
              size="md"
              icon={<FaPlus />}
              onClick={openCreate}
            >
              Create Board
            </Button>
          </div>
        </div>

        {/* BOARD CARDS */}
        <div className="px-6 pb-16">
          {filteredBoards.length === 0 ? (
            <p className="text-slate-400">No boards found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBoards.map((b) => (
                <div
                  key={b.id}
                  onClick={() => router.push(`/board/${b.id}`)}
                  className="cursor-pointer bg-slate-800/60 p-5 rounded-2xl border border-slate-700 hover:bg-slate-800/80 transition flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white truncate">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">
                      Tasks: {b._count?.tasks ?? 0} | Team:{" "}
                      {b._count?.teamMembers ?? 0}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <FaArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOARD MODAL */}
      <BoardModal
        isOpen={modalOpen}
        mode={modalMode}
        initialTitle={modalMode === "edit" ? modalTitle : ""}
        boardId={
          modalMode === "edit" || modalMode === "delete"
            ? selectedBoard!
            : undefined
        }
        onClose={() => {
          setModalOpen(false);
        }}
        onSave={async (title: string, tplId?: string | null) => {
          await handleSave(title, tplId);
        }}
        onDelete={modalMode === "delete" ? handleDelete : undefined}
        selectedTemplate={
          modalMode === "create" ? selectedTemplate! : undefined
        }
        onTemplateSelect={
          modalMode === "create"
            ? (tpl) => {
                setSelectedTemplate(tpl);
              }
            : undefined
        }
        templateRefreshTrigger={templateRefreshTrigger}
      />
    </>
  );
};

export default DashboardPage;
