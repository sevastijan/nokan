// src/app/dashboard/DashboardPage.tsx
"use client";

import React, { useState } from "react";
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
import BoardList from "../components/Board/BoardList";
import BoardModal from "../components/Board/BoardModal";
import Loader from "../components/Loader";
import Button from "../components/Button/Button";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaTasks,
  FaUsers,
  FaClock,
  FaChartLine,
  FaArrowRight,
} from "react-icons/fa";

const DashboardPage = () => {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Pobierz usera
  const {
    data: currentUser,
    isFetching: loadingUser,
    error: userError,
  } = useGetCurrentUserQuery(session!, {
    skip: authStatus !== "authenticated",
  });

  // Pobierz boards
  const {
    data: boards,
    isFetching: loadingBoards,
    error: boardsError,
    refetch: refetchBoards,
  } = useGetMyBoardsQuery(currentUser?.id || "", {
    skip: !currentUser?.id,
  });

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

  const openCreate = () => {
    setSelectedBoard(null);
    setModalMode("create");
    setModalOpen(true);
  };
  const openEdit = (boardId: string) => {
    setSelectedBoard(boardId);
    setModalMode("edit");
    setModalOpen(true);
  };
  const openDelete = (boardId: string) => {
    setSelectedBoard(boardId);
    setModalMode("delete");
    setModalOpen(true);
  };

  const handleSave = async (title: string, templateId?: string | null) => {
    if (modalMode === "create" && currentUser) {
      if (templateId) {
        // tworzenie z szablonu
        await createBoardFromTemplate({
          title,
          templateId,
          user_id: currentUser.id,
        }).unwrap();
      } else {
        // zwykłe tworzenie
        await addBoard({
          title,
          user_id: currentUser.id,
          owner: currentUser.email!,
        }).unwrap();
      }
      refetchBoards();
    } else if (modalMode === "edit" && selectedBoard) {
      await updateBoardTitle({ boardId: selectedBoard, title }).unwrap();
      refetchBoards();
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (selectedBoard) {
      await removeBoard({ boardId: selectedBoard }).unwrap();
      refetchBoards();
    }
    setModalOpen(false);
  };

  if (authStatus === "loading" || loadingUser || loadingBoards) {
    return <Loader text="Loading dashboard..." />;
  }
  if (authStatus === "unauthenticated") {
    router.push("/api/auth/signin");
    return null;
  }
  if (userError) {
    return <div className="p-8 text-red-400">Failed to load user data</div>;
  }
  if (boardsError) {
    return <div className="p-8 text-red-400">Failed to load boards</div>;
  }

  // Statystyki (przykład)
  const totalBoards = boards?.length ?? 0;
  const totalTasks =
    boards?.reduce((sum, b) => sum + (b._count?.tasks ?? 0), 0) ?? 0;
  const completedTasks =
    boards?.reduce(
      (sum, b) => sum + /* b._count?.completedTasks ?? 0 */ 0,
      0
    ) ?? 0;
  const teamMembers =
    boards?.reduce((sum, b) => sum + (b._count?.teamMembers ?? 0), 0) ?? 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1>
                Welcome back,{" "}
                {session?.user?.name ? session.user.name.split(" ")[0] : ""} 👋
              </h1>

              <p className="text-slate-400">
                Here&apos;s what&apos;s happening with your projects today
              </p>
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search boards..."
                className="pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-200 w-80"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-8 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* StatCard komponent jak wcześniej */}
          {/* ... */}
        </div>

        {/* Actions */}
        <div className="px-8 flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Your Boards</h2>
            <p className="text-slate-400">Manage and organize your projects</p>
          </div>
          <div className="flex gap-4">
            <Button variant="secondary" size="md" icon={<FaFilter />}>
              Filter
            </Button>
            <Button variant="secondary" size="md" icon={<FaCalendarAlt />}>
              Calendar View
            </Button>
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

        {/* Board List */}
        <div className="px-8 pb-16">
          <BoardList
            //@ts-ignore
            boards={boards || []}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </div>
      </div>

      {/* BoardModal */}
      <BoardModal
        isOpen={modalOpen}
        mode={modalMode}
        initialTitle={
          modalMode === "edit"
            ? boards?.find((b) => b.id === selectedBoard)?.title ?? ""
            : ""
        }
        boardId={selectedBoard || undefined}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
};

export default DashboardPage;
