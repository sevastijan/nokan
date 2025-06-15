"use client";

import { useState, useEffect, useRef } from "react";
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
  FaUserFriends,
  FaEllipsisV,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { Popover, Transition } from "@headlessui/react";

// --- FILTER POPOVER COMPONENT ---
const FilterPopover = ({
  hasTasksOnly,
  setHasTasksOnly,
  hasMembersOnly,
  setHasMembersOnly,
  clearFilters,
}: {
  hasTasksOnly: boolean;
  setHasTasksOnly: (v: boolean) => void;
  hasMembersOnly: boolean;
  setHasMembersOnly: (v: boolean) => void;
  clearFilters: () => void;
}) => (
  <div className="w-48 bg-slate-800/95 border border-slate-700/50 rounded-lg shadow-xl z-50 p-3 text-sm text-slate-200">
    <div className="font-medium text-white mb-2">Filters</div>
    <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer">
      <input
        type="checkbox"
        checked={hasTasksOnly}
        onChange={(e) => setHasTasksOnly(e.target.checked)}
        className="form-checkbox text-purple-500 focus:ring-purple-400"
      />
      <span>Has tasks</span>
    </label>
    <label className="flex items-center mb-2 space-x-2 hover:bg-slate-700/30 px-2 py-1 rounded cursor-pointer">
      <input
        type="checkbox"
        checked={hasMembersOnly}
        onChange={(e) => setHasMembersOnly(e.target.checked)}
        className="form-checkbox text-purple-500 focus:ring-purple-400"
      />
      <span>Has team members</span>
    </label>
    <button
      onClick={clearFilters}
      className="mt-2 text-xs text-blue-400 hover:text-blue-300"
    >
      Clear all
    </button>
  </div>
);

// --- DASHBOARD PAGE COMPONENT ---
const DashboardPage = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Get current user and boards
  const {
    data: currentUser,
    isFetching: loadingUser,
    error: userError,
  } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== "authenticated",
  });

  const {
    data: boards,
    isFetching: loadingBoards,
    error: boardsError,
    refetch: refetchBoards,
  } = useGetMyBoardsQuery(currentUser?.id || "", { skip: !currentUser?.id });

  // Mutations
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

  // Template selection
  const [selectedTemplate, setSelectedTemplate] =
    useState<BoardTemplate | null>(null);
  const [templateRefreshTrigger, setTemplateRefreshTrigger] =
    useState<number>(0);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [hasTasksOnly, setHasTasksOnly] = useState<boolean>(false);
  const [hasMembersOnly, setHasMembersOnly] = useState<boolean>(false);

  // Board actions menu
  const [boardMenuOpen, setBoardMenuOpen] = useState<string | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/api/auth/signin");
  }, [authStatus, router]);

  // Stats
  const totalBoards = boards?.length ?? 0;
  const totalTasks =
    boards?.reduce((sum, b) => sum + (b._count?.tasks ?? 0), 0) ?? 0;
  const totalMembers =
    boards?.reduce((sum, b) => sum + (b._count?.teamMembers ?? 0), 0) ?? 0;

  // Open/Create/Edit/Delete handlers
  const openCreate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedBoard(null);
    setModalMode("create");
    setModalTitle("");
    setSelectedTemplate(null);
    setTemplateRefreshTrigger((t) => t + 1);
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    const b = boards?.find((b) => b.id === boardId);
    if (b) {
      setSelectedBoard(boardId);
      setModalMode("edit");
      setModalTitle(b.title);
      setSelectedTemplate(null);
      setModalOpen(true);
    }
  };

  const openDelete = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    const b = boards?.find((b) => b.id === boardId);
    if (b) {
      setSelectedBoard(boardId);
      setModalMode("delete");
      setModalTitle(b.title);
      setSelectedTemplate(null);
      setModalOpen(true);
    }
  };

  // Save/Create Board
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
          await addBoard({ title, user_id: currentUser.id }).unwrap();
        }
        await refetchBoards();
      } catch (err) {
        alert("Failed to create board");
      }
    } else if (modalMode === "edit" && selectedBoard) {
      try {
        await updateBoardTitle({ boardId: selectedBoard, title }).unwrap();
        await refetchBoards();
      } catch (err) {
        alert("Failed to update board title");
      }
    }
    setModalOpen(false);
  };

  // Delete Board
  const handleDelete = async () => {
    if (selectedBoard) {
      try {
        await removeBoard({ boardId: selectedBoard }).unwrap();
        await refetchBoards();
      } catch (err) {
        alert("Failed to delete board");
      }
    }
    setModalOpen(false);
  };

  // Filter + search logic
  const filteredBoards = (boards || []).filter((b) => {
    if (
      searchTerm.trim() &&
      !b.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
      return false;
    if (hasTasksOnly && (!b._count?.tasks || b._count.tasks === 0))
      return false;
    if (
      hasMembersOnly &&
      (!b._count?.teamMembers || b._count.teamMembers === 0)
    )
      return false;
    return true;
  });

  if (authStatus === "loading" || loadingUser || loadingBoards)
    return <Loader text="Loading dashboard..." />;
  if (authStatus === "unauthenticated") return null;
  if (userError)
    return <div className="p-8 text-red-400">Failed to load user data</div>;
  if (boardsError)
    return <div className="p-8 text-red-400">Failed to load boards</div>;

  // --- RENDER ---
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* --- Boards & Actions at the Top --- */}
        <section className="px-4 sm:px-6 pt-8 pb-6">
          {/* Boards actions and search */}
          <div className="flex flex-col gap-6 sm:gap-0 sm:flex-row sm:justify-between sm:items-center mb-8">
            <div className="mb-1">
              <h2 className="text-2xl font-bold text-white">Your Boards</h2>
              <p className="text-slate-400 text-sm">
                Manage and organize your projects
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-700/60 border border-slate-600/50 rounded-xl text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
              {/* Actions */}
              <Popover className="relative">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`flex items-center gap-2 px-4 py-2 bg-slate-700/70 hover:bg-slate-700/90 text-slate-200 rounded-lg transition ${
                        open ? "ring-2 ring-purple-500" : ""
                      }`}
                    >
                      <FaFilter className="w-4 h-4" />
                      <span className="text-sm">Filter</span>
                    </Popover.Button>
                    <Transition
                      show={open}
                      as="div"
                      enter="transition ease-out duration-150"
                      enterFrom="opacity-0 translate-y-2"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-2"
                    >
                      <Popover.Panel className="absolute right-0 z-40 mt-2">
                        <FilterPopover
                          hasTasksOnly={hasTasksOnly}
                          setHasTasksOnly={setHasTasksOnly}
                          hasMembersOnly={hasMembersOnly}
                          setHasMembersOnly={setHasMembersOnly}
                          clearFilters={() => {
                            setHasTasksOnly(false);
                            setHasMembersOnly(false);
                          }}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
              <Button
                variant="secondary"
                size="md"
                icon={<FaCalendarAlt />}
                onClick={() => router.push("/calendar")}
                className="w-full sm:w-auto"
              >
                Calendar View
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<FaPlus />}
                onClick={openCreate}
                className="w-full sm:w-auto"
              >
                Create Board
              </Button>
            </div>
          </div>
          {/* Board cards */}
          {filteredBoards.length === 0 ? (
            <p className="text-slate-400 pt-6">No boards found.</p>
          ) : (
            <div className="grid gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBoards.map((b) => (
                <div
                  key={b.id}
                  className="relative cursor-pointer bg-slate-800/70 p-6 rounded-2xl border border-slate-700 hover:bg-slate-800/90 transition flex flex-col justify-between group shadow-lg"
                  onClick={(e) => {
                    if (
                      (e.target as HTMLElement).closest(".board-menu-btn") ||
                      (e.target as HTMLElement).closest(".board-menu-dropdown")
                    )
                      return;
                    router.push(`/board/${b.id}`);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {b.title}
                    </h3>
                    {/* Menu button */}
                    <div className="relative z-20">
                      <button
                        className="board-menu-btn p-2 rounded-full hover:bg-slate-700 text-slate-400 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardMenuOpen(
                            b.id === boardMenuOpen ? null : b.id
                          );
                        }}
                        aria-label="Board actions"
                      >
                        <FaEllipsisV />
                      </button>
                      {/* Dropdown menu */}
                      {boardMenuOpen === b.id && (
                        <div className="board-menu-dropdown absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-lg z-30">
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800 flex items-center gap-2 text-white"
                            onClick={(e) => {
                              openEdit(e, b.id);
                              setBoardMenuOpen(null);
                            }}
                          >
                            <FaEdit className="w-4 h-4" /> Edit
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-600/80 flex items-center gap-2 text-red-400"
                            onClick={(e) => {
                              openDelete(e, b.id);
                              setBoardMenuOpen(null);
                            }}
                          >
                            <FaTrash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Tasks: {b._count?.tasks ?? 0} | Team:{" "}
                    {b._count?.teamMembers ?? 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- Dashboard Statistics Section (below boards) --- */}
        <div className="px-4 sm:px-6 pb-10 grid gap-4 sm:gap-6 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-5 flex items-center gap-4 shadow-sm">
            <span className="bg-purple-600/30 text-purple-300 p-2 rounded-xl text-2xl">
              <FaCalendarAlt />
            </span>
            <div>
              <div className="text-sm text-slate-400">Total Boards</div>
              <div className="text-xl font-bold text-white">{totalBoards}</div>
            </div>
          </div>
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-5 flex items-center gap-4 shadow-sm">
            <span className="bg-green-600/20 text-green-300 p-2 rounded-xl text-2xl">
              <FaPlus />
            </span>
            <div>
              <div className="text-sm text-slate-400">Total Tasks</div>
              <div className="text-xl font-bold text-white">{totalTasks}</div>
            </div>
          </div>
          <div className="bg-slate-800/70 rounded-2xl border border-slate-700 p-5 flex items-center gap-4 shadow-sm">
            <span className="bg-blue-600/20 text-blue-300 p-2 rounded-xl text-2xl">
              <FaUserFriends />
            </span>
            <div>
              <div className="text-sm text-slate-400">Team Members (all)</div>
              <div className="text-xl font-bold text-white">{totalMembers}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Board Create/Edit/Delete Modal */}
      <BoardModal
        isOpen={modalOpen}
        mode={modalMode}
        initialTitle={modalMode === "edit" ? modalTitle : ""}
        boardId={
          modalMode === "edit" || modalMode === "delete"
            ? selectedBoard!
            : undefined
        }
        onClose={() => setModalOpen(false)}
        onSave={async (title: string, tplId?: string | null) =>
          await handleSave(title, tplId)
        }
        onDelete={modalMode === "delete" ? handleDelete : undefined}
        selectedTemplate={
          modalMode === "create" ? selectedTemplate! : undefined
        }
        onTemplateSelect={
          modalMode === "create" ? (tpl) => setSelectedTemplate(tpl) : undefined
        }
        templateRefreshTrigger={templateRefreshTrigger}
      />
    </>
  );
};

export default DashboardPage;
