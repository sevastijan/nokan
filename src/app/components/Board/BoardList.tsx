"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BoardModal from "./BoardModal";
import BoardDropdown from "./BoardDropdown";
import Loader from "../Loader";
import {
  getAllBoardsForUser,
  createBoardFromTemplate,
  addBoard,
} from "../../lib/api";
import { BoardTemplate } from "../../types/useBoardTypes";
import { FaTasks, FaUsers, FaArrowRight, FaPlus } from "react-icons/fa";
import Button from "../../components/Button/Button";

interface Board {
  id: string;
  title: string;
  owner: string;
}

interface BoardListProps {
  searchQuery?: string;
}

/**
 * Board list component that displays user's boards with CRUD operations
 * @returns JSX element containing the board list interface
 */
const BoardList = ({ searchQuery = "" }: BoardListProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  /**
   * Fetch boards when user is authenticated
   */
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchBoards();
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  /**
   * Fetch all boards from API
   */
  const fetchBoards = async () => {
    try {
      const userEmail = session?.user?.email;

      if (!userEmail) {
        return;
      }
      const boards = await getAllBoardsForUser(userEmail);
      setBoards(boards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      setError("Failed to fetch boards");
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new board with template support
   * @param title - The title of the new board
   * @param template - Optional template to use for board creation
   */
  const createBoard = async (title: string, template?: BoardTemplate) => {
    if (!session?.user?.email) return;

    try {
      let newBoard;

      if (template) {
        // Create board from template
        newBoard = await createBoardFromTemplate(
          title,
          template.id,
          session.user.email
        );
      } else {
        // Create basic board without template
        newBoard = await addBoard({ title });
      }

      setCreateModalOpen(false);
      // Refresh boards to get updated list
      await fetchBoards();
    } catch (error) {
      console.error("Error creating board:", error);
      setError("Failed to create board");
    }
  };

  /**
   * Edit an existing board
   * @param title - The new title for the board
   */
  const editBoard = async (title: string) => {
    if (!selectedBoard) return;

    try {
      const response = await fetch(`/api/dashboards/${selectedBoard.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedBoard = await response.json();
      setBoards(
        boards.map((board) =>
          board.id === selectedBoard.id
            ? { ...board, title: updatedBoard.title }
            : board
        )
      );
      setEditModalOpen(false);
      setSelectedBoard(null);
    } catch (error) {
      console.error("Error editing board:", error);
      setError("Failed to edit board");
    }
  };

  /**
   * Delete a board
   */
  const deleteBoard = async () => {
    if (!selectedBoard) return;

    try {
      const response = await fetch(`/api/dashboards/${selectedBoard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setBoards(boards.filter((board) => board.id !== selectedBoard.id));
      setDeleteModalOpen(false);
      setSelectedBoard(null);
    } catch (error) {
      console.error("Error deleting board:", error);
      setError("Failed to delete board");
    }
  };

  /**
   * Navigate to board page
   * @param boardId - The ID of the board to open
   */
  const openBoard = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  /**
   * Handle edit button click
   * @param board - The board to edit
   */
  const handleEditClick = (board: Board) => {
    setSelectedBoard(board);
    setEditModalOpen(true);
  };

  /**
   * Handle delete button click
   * @param board - The board to delete
   */
  const handleDeleteClick = (board: Board) => {
    setSelectedBoard(board);
    setDeleteModalOpen(true);
  };

  // Filter boards based on search query
  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || loading) {
    return <Loader text="Loading boards..." />;
  }

  if (!session) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400">Please log in to view your boards</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBoards.map((board) => (
          <div
            key={board.id}
            className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div onClick={() => openBoard(board.id)} className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full group-hover:scale-110 transition-transform"></div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {board.title}
                  </h3>
                </div>
                <p className="text-slate-400 text-sm">Owner: {board.owner}</p>
              </div>
              <BoardDropdown
                onEdit={() => handleEditClick(board)}
                onDelete={() => handleDeleteClick(board)}
              />
            </div>

            {/* Board preview/stats */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <FaTasks className="w-3 h-3" />0 tasks
                </span>
                <span className="flex items-center gap-1">
                  <FaUsers className="w-3 h-3" />1 member
                </span>
              </div>
              <FaArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {filteredBoards.length === 0 && !loading && (
        <div className="text-center p-12">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "No boards found" : "No boards yet"}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchQuery
                ? `No boards match "${searchQuery}". Try a different search term.`
                : "Create your first board to get started with organizing your tasks!"}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setCreateModalOpen(true)}
                icon={<FaPlus />}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Create Your First Board
              </Button>
            )}
          </div>
        </div>
      )}

      <BoardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={createBoard}
        title="Create Board"
        mode="create"
      />

      <BoardModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBoard(null);
        }}
        onSubmit={editBoard}
        initialTitle={selectedBoard?.title || ""}
        title="Edit Board"
        mode="edit"
      />

      <BoardModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedBoard(null);
        }}
        onSubmit={() => {}}
        onDelete={deleteBoard}
        initialTitle={selectedBoard?.title || ""}
        title="Delete Board"
        mode="delete"
      />
    </div>
  );
};

export default BoardList;
